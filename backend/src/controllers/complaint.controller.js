const Joi = require('joi');
const prisma = require('../config/database');
const { logger } = require('../utils/logger');
const { saveFile } = require('../services/fileStorage.service');
const { analyzeDamage } = require('../services/ai.service');
const { sendNotification } = require('../services/notification.service');

const VALID_TRANSITIONS = {
  'SUBMITTED': ['VERIFIED', 'REJECTED'],
  'VERIFIED': ['ASSIGNED', 'REJECTED'],
  'ASSIGNED': ['IN_PROGRESS'],
  'IN_PROGRESS': ['COMPLETED'],
  'COMPLETED': ['CLOSED', 'IN_PROGRESS'],
  'REJECTED': [],
  'CLOSED': []
};

const isValidTransition = (from, to) => VALID_TRANSITIONS[from]?.includes(to) ?? false;

const complaintSchema = Joi.object({
  title: Joi.string().min(5).max(200).required(),
  description: Joi.string().min(10).max(1000).required(),
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
  address: Joi.string().required(),
  ward: Joi.string().required(),
  roadType: Joi.string().valid('HIGHWAY', 'MAIN_ROAD', 'RESIDENTIAL', 'INTERNAL').required()
});

const createComplaint = async (req, res, next) => {
  try {
    const { latitude, longitude } = req.body;
    if (!latitude || !longitude) return res.status(400).json({ error: 'GPS coordinates required.' });

    const { error, value } = complaintSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'Image required.' });

    const { title, description, address, ward, roadType } = value;
    const complaintNumber = 'SMC-' + Date.now();
    const slaDeadline = new Date(Date.now() + 168 * 60 * 60 * 1000);

    const complaint = await prisma.complaint.create({
      data: {
        complaintNumber,
        userId: req.user.id,
        title, description, latitude: parseFloat(latitude), longitude: parseFloat(longitude),
        address, ward, roadType, status: 'SUBMITTED', slaDeadline
      }
    });

    let aiAnalysis = null;
    for (let i = 0; i < req.files.length; i++) {
        const fileInfo = await saveFile(req.files[i], complaint.id);
        await prisma.complaintImage.create({ data: { complaintId: complaint.id, imageUrl: fileInfo.fileUrl, originalName: req.files[i].originalname } });
        if (i === 0) {
            try { 
                aiAnalysis = await analyzeDamage(fileInfo.filePath, fileInfo.mimeType); 
            } catch (e) { 
                logger.error("AI Analysis Failed:", e);
                await prisma.auditLog.create({
                    data: { complaintId: complaint.id, action: 'AI_ANALYSIS_FAILED', details: { error: e.message || "Unknown AI error" }, performedById: 'SYSTEM' }
                });
            }
        }
    }
    
    if (aiAnalysis) {
        await prisma.complaint.update({ where: { id: complaint.id }, data: { aiDetails: aiAnalysis } });
        await prisma.auditLog.create({
            data: { complaintId: complaint.id, action: 'AI_ADVISORY', details: aiAnalysis, performedById: 'SYSTEM' }
        });
    }
    await prisma.auditLog.create({
        data: { complaintId: complaint.id, action: 'SUBMISSION', details: { status: 'SUBMITTED' }, performedById: req.user.id }
    });
    res.status(201).json({ message: 'Submitted', complaint });
  } catch (error) { next(error); }
};

const getComplaints = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, ward, departmentId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (ward) where.ward = ward;
    if (departmentId) where.departmentId = departmentId;
    if (req.user.role === 'DEPARTMENT_HEAD' && req.user.departmentId) where.departmentId = req.user.departmentId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [complaints, total] = await Promise.all([
      prisma.complaint.findMany({ 
        where, 
        skip, 
        take: parseInt(limit), 
        orderBy: { createdAt: 'desc' }, 
        include: { 
          user: { select: { name: true, role: true } }, 
          department: true, 
          images: true, 
          auditLogs: { 
            orderBy: { timestamp: 'asc' }
          } 
        } 
      }),
      prisma.complaint.count({ where })
    ]);
    res.json({ complaints, pagination: { page: parseInt(page), total } });
  } catch (error) { next(error); }
};

const getComplaintById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const complaint = await prisma.complaint.findUnique({
      where: { id },
      include: { user: true, department: true, assignedTo: true, contractor: true, images: true, auditLogs: { orderBy: { timestamp: 'desc' } } }
    });
    if (!complaint) return res.status(404).json({ error: 'Not found' });
    res.json({ complaint });
  } catch (error) { next(error); }
};

const updateComplaintStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;
    const old = await prisma.complaint.findUnique({ where: { id }, include: { user: true } });
    if (req.user.role === 'CONTRACTOR') {
         if (status === 'IN_PROGRESS' && old.status !== 'ASSIGNED') return res.status(403).json({ error: 'Can only start ASSIGNED tasks' });
         if (status === 'COMPLETED' && old.status !== 'IN_PROGRESS') return res.status(403).json({ error: 'Can only complete IN_PROGRESS tasks' });
         if (status === 'CLOSED' || status === 'REJECTED') return res.status(403).json({ error: 'Contractors cannot CLOSE or REJECT' });
    }
    if (!isValidTransition(old.status, status)) return res.status(400).json({ error: 'Invalid transition ' + old.status + ' -> ' + status });

    const updateData = { status };
    if (status === 'IN_PROGRESS') updateData.inProgressAt = new Date();
    if (status === 'CLOSED') updateData.resolvedAt = new Date();
    
    const complaint = await prisma.complaint.update({ where: { id }, data: updateData });
    
    // UPDATE CONTRACTOR STATS: If closing, decrement active and increment completed
    if (status === 'CLOSED' && old.contractorId) {
        await prisma.contractor.update({
            where: { id: old.contractorId },
            data: { 
                activeJobs: { decrement: 1 },
                completedJobs: { increment: 1 }
            }
        }).catch(err => logger.error("Failed to update contractor stats on Close:", err));
    }

    await prisma.auditLog.create({ data: { complaintId: id, action: 'STATUS_CHANGE', details: { from: old.status, to: status, comments }, performedById: req.user.id } });
    
    // Send notification to citizen
    // Send notification to citizen
    if (status === "IN_PROGRESS" && old.status === "COMPLETED") {
        // Admin rejecting contractor work - do not confuse citizen with "Work started" message
        // Optional: send citizen "Work is being revised"
    } else {
      const statusMessages = {
        "IN_PROGRESS": "Work has started on your complaint",
        "COMPLETED": "Work has been completed. Pending final verification.",
        "CLOSED": "Your complaint has been resolved and closed. Thank you for reporting!",
        "REJECTED": "Your complaint work was rejected and sent back for rework."
      };
      if (statusMessages[status] && old.userId) {
        sendNotification({
          userId: old.userId,
          type: "STATUS_UPDATE",
          title: `Complaint ${old.complaintNumber} - ${status}`,
          message: statusMessages[status],
          channels: ["IN_APP"],
          metadata: { complaintId: id, status }
        }).catch(err => logger.error("Notification failed:", err));
      }
    }
    
    // CRITICAL: If reverting to IN_PROGRESS (Rejection), ensure the WorkOrder is also active again
    if (status === "IN_PROGRESS" && old.status === "COMPLETED") {
         const wo = await prisma.workOrder.findFirst({
             where: { complaintId: id, status: "COMPLETED" },
             include: { contractor: { include: { users: true } } }
         });
         if (wo) {
             await prisma.workOrder.update({
                 where: { id: wo.id },
                 data: { status: "IN_PROGRESS", rejectionReason: comments }
             });
             
             // Notify contractor
             if (wo.contractor && wo.contractor.users) {
                 for (const user of wo.contractor.users) {
                     sendNotification({
                         userId: user.id,
                         type: "WORK_REJECTED",
                         title: `Work Rejected - WO#${wo.orderNumber}`,
                         message: comments || "The admin rejected your submission. Please revise.",
                         channels: ["IN_APP"]
                     }).catch(err => logger.error("Notification failed:", err));
                 }
             }
         }
    }
    res.json({ message: 'Updated', complaint });
  } catch (error) { next(error); }
};

const verifyComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { verified, damageType, severity, priority, departmentId, comments } = req.body;
    const old = await prisma.complaint.findUnique({ where: { id } });
    if (old.status !== 'SUBMITTED') return res.status(400).json({ error: 'Only SUBMITTED complaints can be verified.' });

    const status = verified ? 'VERIFIED' : 'REJECTED'; 
    let updateData = { status, verifiedAt: new Date() };

    if (verified) {
        if (!damageType || !severity) return res.status(400).json({ error: 'Damage Type and Severity are MANDATORY for verification.' });
        updateData.damageType = damageType; 
        updateData.severity = severity;
        updateData.priority = priority ? parseInt(priority) : 5;
        if (departmentId) updateData.departmentId = departmentId;
    }
    const complaint = await prisma.complaint.update({ where: { id }, data: updateData });
    await prisma.auditLog.create({
        data: { complaintId: id, action: verified ? 'VERIFICATION' : 'REJECTION', details: { verified, damageType, severity, comments }, performedById: req.user.id }
    });
    
    // Notify citizen
    sendNotification({
      userId: old.userId,
      type: verified ? 'VERIFICATION' : 'REJECTION',
      title: `Complaint ${old.complaintNumber} - ${verified ? 'Verified' : 'Rejected'}`,
      message: verified 
        ? `Your complaint has been verified. Damage: ${damageType}, Severity: ${severity}. Assignment in progress.`
        : `Your complaint was rejected. Reason: ${comments || 'Not specified'}`,
      channels: ['IN_APP'],
      metadata: { complaintId: id, verified }
    }).catch(err => logger.error('Notification failed:', err));
    
    res.json({ message: 'Verified Only (Assignment Required Next)', complaint });
  } catch (e) { next(e); }
};

const assignComplaint = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Validate: must have contractorId
    if (!contractorId) {
      return res.status(400).json({ error: 'Contractor must be selected for assignment.' });
    }

    const updateData = { status: 'ASSIGNED', assignedAt: new Date(), contractorId };
    if (assignedToId) updateData.assignedToId = assignedToId;
    
    const complaint = await prisma.complaint.update({ where: { id }, data: updateData, include: { contractor: true } });
    
    await prisma.auditLog.create({
        data: { complaintId: id, action: 'ASSIGNMENT', details: { assignedToId, contractorId }, performedById: req.user.id }
    });
    
    // Notify citizen of assignment
    const assigneeName = complaint.contractor?.companyName || complaint.department?.name || 'Assigned Team';
    sendNotification({
      userId: old.userId,
      type: 'ASSIGNMENT',
      title: `Complaint ${old.complaintNumber} - Assigned`,
      message: `Your complaint has been assigned to ${assigneeName}. Work will begin soon.`,
      channels: ['IN_APP'],
      metadata: { complaintId: id, assignee: assigneeName }
    }).catch(err => logger.error('Notification failed:', err));
    
    res.json({ message: 'Assigned', complaint });
  } catch (error) { next(error); }
};

const getMyComplaints = async (req, res, next) => {
    try {
        const complaints = await prisma.complaint.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, include: { images: true } });
         res.json({ complaints });
    } catch (e) { next(e); }
};

const rejectComplaint = async (req, res, next) => {
    req.body.verified = false;
    return verifyComplaint(req, res, next);
};

const checkSlaBreaches = async (req, res, next) => {
    try {
        const breaches = await prisma.complaint.findMany({ where: { slaDeadline: { lt: new Date() }, status: { notIn: ['CLOSED', 'REJECTED'] } } });
        res.json({ count: breaches.length, breaches });
    } catch (e) { next(e); }
};

const getComplaintHistory = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        // 1. Resolve Complaint (Allow lookup by ID or ComplaintNumber)
        const complaint = await prisma.complaint.findFirst({
            where: { OR: [{ id }, { complaintNumber: id }] },
            select: { id: true, createdAt: true, complaintNumber: true }
        });

        if (!complaint) return res.status(404).json({ error: "Complaint not found" });
        const complaintId = complaint.id;

        // 2. Fetch Logs
        const [auditLogs, legacy] = await Promise.all([
            prisma.auditLog.findMany({ 
                where: { complaintId },
                include: { performedBy: { select: { name: true, role: true } } }
            }),
            prisma.complaintHistory.findMany({ 
                where: { complaintId },
                include: { performedBy: { select: { name: true, role: true } } }
            })
        ]);

        // 3. Unified Format
        const history = [
            ...auditLogs.map(l => ({
                id: l.id,
                action: l.action,
                timestamp: l.timestamp,
                comments: l.details?.comments || l.details?.reason || null,
                performedBy: l.performedBy?.name || (l.performedById === 'SYSTEM' ? 'AI System' : 'Official')
            })),
            ...legacy.map(h => ({
                id: h.id,
                action: h.action,
                timestamp: h.createdAt,
                comments: h.comments,
                performedBy: h.performedBy?.name || "User"
            }))
        ];

        // 4. Critical Step: If no submission log exists, synthesize one from createdAt
        if (!history.some(h => h.action === 'SUBMISSION' || h.action === 'COMPLAINT_SUBMITTED')) {
            history.push({
                id: 'initial',
                action: 'SUBMISSION',
                timestamp: complaint.createdAt,
                comments: "Initial complaint record created.",
                performedBy: "Citizen"
            });
        }

        // 5. Final Sort (Oldest first)
        history.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

        res.json({ history }); 
    } catch (e) { 
        logger.error("History fetch error:", e);
        next(e); 
    }
};

module.exports = {
  createComplaint,
  getComplaints,
  getMyComplaints,
  getComplaintById,
  updateComplaintStatus,
  verifyComplaint,
  assignComplaint,
  rejectComplaint,
  checkSlaBreaches,
  getComplaintHistory
};

