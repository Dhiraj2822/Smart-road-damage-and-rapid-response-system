const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const { authMiddleware, authorize } = require('../middleware/auth');

// Get all departments
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const departments = await prisma.department.findMany({
      include: { _count: { select: { complaints: true, users: true } } },
      orderBy: { name: 'asc' }
    });
    res.json({ departments });
  } catch (error) { next(error); }
});

// Get department by ID
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const department = await prisma.department.findUnique({
      where: { id: req.params.id },
      include: { users: { select: { id: true, name: true, email: true, role: true } }, _count: { select: { complaints: true } } }
    });
    if (!department) return res.status(404).json({ error: 'Department not found' });
    res.json({ department });
  } catch (error) { next(error); }
});

// Create department (Admin only)
router.post('/', authMiddleware, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { name, code, description, contactEmail, contactPhone } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });
    
    const existing = await prisma.department.findUnique({ where: { code } });
    if (existing) return res.status(400).json({ error: 'Department code already exists' });
    
    const department = await prisma.department.create({
      data: { name, code: code.toUpperCase(), description, contactEmail, contactPhone }
    });
    res.status(201).json({ message: 'Department created', department });
  } catch (error) { next(error); }
});

// Update department (Admin only)
router.put('/:id', authMiddleware, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const { name, description, contactEmail, contactPhone } = req.body;
    const department = await prisma.department.update({
      where: { id: req.params.id },
      data: { name, description, contactEmail, contactPhone }
    });
    res.json({ message: 'Department updated', department });
  } catch (error) { next(error); }
});

// Delete department (Admin only)
router.delete('/:id', authMiddleware, authorize(['ADMIN', 'SUPER_ADMIN']), async (req, res, next) => {
  try {
    const hasComplaints = await prisma.complaint.count({ where: { departmentId: req.params.id } });
    if (hasComplaints > 0) return res.status(400).json({ error: 'Cannot delete department with assigned complaints' });
    
    await prisma.department.delete({ where: { id: req.params.id } });
    res.json({ message: 'Department deleted' });
  } catch (error) { next(error); }
});

module.exports = router;
