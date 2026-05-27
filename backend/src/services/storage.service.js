const AWS = require('aws-sdk');
const { logger } = require('../utils/logger');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

/**
 * Upload file to S3
 * @param {Object} file - Multer file object
 * @param {string} folder - S3 folder path
 * @returns {Promise<{url: string, key: string}>}
 */
const uploadToS3 = async (file, folder = 'uploads') => {
  try {
    const timestamp = Date.now();
    const filename = `${folder}/${timestamp}-${file.originalname || 'image.jpg'}`;
    
    const params = {
      Bucket: BUCKET_NAME,
      Key: filename,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read'
    };
    
    const result = await s3.upload(params).promise();
    
    logger.info(`File uploaded to S3: ${filename}`);
    
    return {
      url: result.Location,
      key: result.Key
    };
  } catch (error) {
    logger.error('S3 upload error:', error);
    throw new Error('Failed to upload file to S3');
  }
};

/**
 * Delete file from S3
 * @param {string} key - S3 object key
 */
const deleteFromS3 = async (key) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: key
    };
    
    await s3.deleteObject(params).promise();
    logger.info(`File deleted from S3: ${key}`);
  } catch (error) {
    logger.error('S3 delete error:', error);
    throw new Error('Failed to delete file from S3');
  }
};

/**
 * Get signed URL for private files
 * @param {string} key - S3 object key
 * @param {number} expiresIn - URL expiration time in seconds
 */
const getSignedUrl = (key, expiresIn = 3600) => {
  const params = {
    Bucket: BUCKET_NAME,
    Key: key,
    Expires: expiresIn
  };
  
  return s3.getSignedUrl('getObject', params);
};

module.exports = {
  uploadToS3,
  deleteFromS3,
  getSignedUrl
};
