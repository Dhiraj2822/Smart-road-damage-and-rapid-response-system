const express = require('express');
const multer = require('multer');
const pathModule = require('path');

// Configure multer for proof images
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/proofs'),
    filename: (req, file, cb) => cb(null, 'proof-' + Date.now() + pathModule.extname(file.originalname))
});
const upload = multer({ storage });
const router = express.Router();
const { 
    createContractor, 
    getContractorById,
    getAllContractors, 
    updateContractor,
    deleteContractor,
    assignWorkOrder, 
    getMyWorkOrders, 
    acceptWorkOrder,
    rejectWorkOrder,
    completeWorkOrder 
} = require('../controllers/contractor.controller');
// FIXED IMPORT:
const { authMiddleware: authenticate, authorize } = require('../middleware/auth');

// Admin only routes
router.post('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), createContractor);
router.get('/', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_HEAD']), getAllContractors);
router.post('/assign', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_HEAD']), assignWorkOrder);

// Contractor Self-Service Routes (Move specific routes ABOVE parameterized ones like /:id)
router.get('/my-orders', authenticate, authorize(['CONTRACTOR']), getMyWorkOrders);

router.get('/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN', 'DEPARTMENT_HEAD']), getContractorById);
router.put('/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), updateContractor);
router.delete('/:id', authenticate, authorize(['ADMIN', 'SUPER_ADMIN']), deleteContractor);

router.post('/orders/:id/accept', authenticate, authorize(['CONTRACTOR']), acceptWorkOrder);
router.post('/orders/:id/reject', authenticate, authorize(['CONTRACTOR']), rejectWorkOrder);
router.post('/orders/:id/complete', authenticate, authorize(['CONTRACTOR']), upload.single('proofImage'), completeWorkOrder);

module.exports = router;
