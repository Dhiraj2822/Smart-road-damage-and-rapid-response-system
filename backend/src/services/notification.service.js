const nodemailer = require("nodemailer");
const prisma = require("../config/database");
const { logger } = require("../utils/logger");

// Email transporter
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Twilio client - only initialize if credentials are valid
let twilioClient = null;
if (
  process.env.TWILIO_ACCOUNT_SID &&
  process.env.TWILIO_ACCOUNT_SID.startsWith("AC")
) {
  try {
    const twilio = require("twilio");
    twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  } catch (error) {
    console.error("Failed to initialize Twilio:", error.message);
  }
}

const sendNotification = async ({
  userId,
  type,
  title,
  message,
  channels = ["IN_APP"],
  metadata = {},
}) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, name: true },
    });

    if (!user) {
      logger.warn(`User not found for notification: ${userId}`);
      return;
    }

    const notificationPromises = [];

    // Create in-app notification (always)
    const inAppNotification = prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        channel: "IN_APP",
        status: "SENT",
        metadata,
        sentAt: new Date(),
      },
    });
    notificationPromises.push(inAppNotification);

    // Send email
    if (channels.includes("EMAIL")) {
      const emailPromise = sendEmail(user.email, title, message)
        .then(() => {
          return prisma.notification.create({
            data: {
              userId,
              type,
              title,
              message,
              channel: "EMAIL",
              status: "SENT",
              metadata,
              sentAt: new Date(),
            },
          });
        })
        .catch((error) => {
          logger.error("Email send error:", error);
          return prisma.notification.create({
            data: {
              userId,
              type,
              title,
              message,
              channel: "EMAIL",
              status: "FAILED",
              metadata: { ...metadata, error: error.message },
            },
          });
        });
      notificationPromises.push(emailPromise);
    }

    // Send SMS
    if (channels.includes("SMS") && twilioClient) {
      const smsPromise = sendSMS(user.phone, message)
        .then(() => {
          return prisma.notification.create({
            data: {
              userId,
              type,
              title,
              message,
              channel: "SMS",
              status: "SENT",
              metadata,
              sentAt: new Date(),
            },
          });
        })
        .catch((error) => {
          logger.error("SMS send error:", error);
          return prisma.notification.create({
            data: {
              userId,
              type,
              title,
              message,
              channel: "SMS",
              status: "FAILED",
              metadata: { ...metadata, error: error.message },
            },
          });
        });
      notificationPromises.push(smsPromise);
    }

    await Promise.all(notificationPromises);
    logger.info(
      `Notifications sent to user ${userId} via channels: ${channels.join(", ")}`
    );
  } catch (error) {
    logger.error("Notification service error:", error);
  }
};

const sendEmail = async (to, subject, text, html = null) => {
  try {
    const mailOptions = {
      from: `"Solapur Road Damage System" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error("Email error:", error);
    throw error;
  }
};

const sendSMS = async (to, message) => {
  if (!twilioClient) {
    logger.warn("SMS skipped - Twilio not configured");
    return;
  }
  try {
    const phoneNumber = to.startsWith("+") ? to : `+91${to}`;
    const sms = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
    logger.info(`SMS sent: ${sms.sid}`);
    return sms;
  } catch (error) {
    logger.error("SMS error:", error);
    throw error;
  }
};

module.exports = {
  sendNotification,
  sendEmail,
  sendSMS,
};