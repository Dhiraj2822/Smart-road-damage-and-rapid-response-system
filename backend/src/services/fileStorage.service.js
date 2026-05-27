const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/complaints');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * Save uploaded file to local storage
 * @param {Object} file - Multer file object
 * @param {string} complaintId - Complaint ID for folder organization
 * @returns {Object} - { fileName, filePath, fileUrl }
 */
const saveFile = async (file, complaintId) => {
  const fileExt = path.extname(file.originalname);
  const fileName = `${uuidv4()}${fileExt}`;
  const complaintDir = path.join(UPLOAD_DIR, complaintId);
  
  // Create complaint-specific directory
  if (!fs.existsSync(complaintDir)) {
    fs.mkdirSync(complaintDir, { recursive: true });
  }
  
  const filePath = path.join(complaintDir, fileName);
  
  // Write file to disk
  fs.writeFileSync(filePath, file.buffer);
  
  // Return URL path (relative to server)
  const fileUrl = `/uploads/complaints/${complaintId}/${fileName}`;
  
  return {
    fileName,
    filePath,
    fileUrl,
    originalName: file.originalname,
    fileSize: file.size,
    mimeType: file.mimetype
  };
};

/**
 * Delete file from local storage
 * @param {string} fileUrl - URL of file to delete
 */
const deleteFile = (fileUrl) => {
  try {
    const filePath = path.join(__dirname, '../..', fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

module.exports = {
  saveFile,
  deleteFile,
  UPLOAD_DIR
};
