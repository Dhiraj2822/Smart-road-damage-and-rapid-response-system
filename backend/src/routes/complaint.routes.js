const express = require('express');
const router = express.Router();
const multer = require('multer');
const complaintController = require('../controllers/complaint.controller');
const { authMiddleware, authorize } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

router.post('/', authMiddleware, upload.array('images', 5), complaintController.createComplaint);
router.get('/', authMiddleware, complaintController.getComplaints);
router.get('/my-complaints', authMiddleware, complaintController.getMyComplaints);
// New SLA Check Endpoint
router.get('/sla-breaches', authMiddleware, authorize('ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_HEAD'), complaintController.checkSlaBreaches);
router.get('/:id', authMiddleware, complaintController.getComplaintById);
router.put('/:id/verify', authMiddleware, authorize('WARD_OFFICER', 'DEPARTMENT_HEAD', 'ADMIN'), complaintController.verifyComplaint);
router.put('/:id/assign', authMiddleware, authorize('WARD_OFFICER', 'DEPARTMENT_HEAD', 'ADMIN'), complaintController.assignComplaint);
router.put('/:id/status', authMiddleware, complaintController.updateComplaintStatus);
router.put('/:id/reject', authMiddleware, authorize('WARD_OFFICER', 'DEPARTMENT_HEAD', 'ADMIN'), complaintController.rejectComplaint);
router.get('/:id/history', authMiddleware, complaintController.getComplaintHistory);

module.exports = router;
