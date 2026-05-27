const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authMiddleware } = require('../middleware/auth');

// Get user's notifications
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json({ notifications });
  } catch (error) { next(error); }
});

// Get unread count
router.get('/unread-count', authMiddleware, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.id, isRead: false }
    });
    res.json({ count });
  } catch (error) { next(error); }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req, res, next) => {
  try {
    const notification = await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ message: 'Marked as read', notification });
  } catch (error) { next(error); }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true }
    });
    res.json({ message: 'All marked as read' });
  } catch (error) { next(error); }
});

module.exports = router;
