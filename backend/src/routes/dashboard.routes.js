const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authMiddleware, authorize } = require('../middleware/auth');

router.get('/stats', authMiddleware, dashboardController.getStats);
router.get('/analytics', authMiddleware, authorize('WARD_OFFICER', 'DEPARTMENT_HEAD', 'ADMIN', 'SUPER_ADMIN'), dashboardController.getAnalytics);
router.get('/map-data', authMiddleware, dashboardController.getMapData);
router.get('/trends', authMiddleware, dashboardController.getTrends);
router.get('/department-performance', authMiddleware, authorize('ADMIN', 'SUPER_ADMIN'), dashboardController.getDepartmentPerformance);
router.get('/contractor-performance', authMiddleware, authorize('ADMIN', 'SUPER_ADMIN'), dashboardController.getContractorPerformance);

module.exports = router;
