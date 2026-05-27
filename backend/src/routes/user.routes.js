const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/auth');

router.get('/', authMiddleware, authorize('ADMIN', 'SUPER_ADMIN'), async (req, res) => {
  res.json({ message: 'User routes' });
});

module.exports = router;
