const prisma = require('../config/database');

const getStats = async (req, res, next) => {
  try {
    const where = {};
    if (req.user.role !== 'ADMIN' && req.user.role !== 'SUPER_ADMIN' && req.user.departmentId) {
      where.departmentId = req.user.departmentId;
    }
    
    const [total, submitted, verified, assigned, inProgress, resolved, rejected, critical, high] = await Promise.all([
      prisma.complaint.count({ where }),
      prisma.complaint.count({ where: { ...where, status: 'SUBMITTED' } }),
      prisma.complaint.count({ where: { ...where, status: 'VERIFIED' } }),
      prisma.complaint.count({ where: { ...where, status: 'ASSIGNED' } }),
      prisma.complaint.count({ where: { ...where, status: 'IN_PROGRESS' } }),
      prisma.complaint.count({ where: { ...where, status: 'RESOLVED' } }),
      prisma.complaint.count({ where: { ...where, status: 'REJECTED' } }),
      prisma.complaint.count({ where: { ...where, severity: 'CRITICAL' } }),
      prisma.complaint.count({ where: { ...where, severity: 'HIGH' } })
    ]);
    
    const resolutionRate = total > 0 ? ((resolved / total) * 100).toFixed(2) : 0;
    
    res.json({
      stats: {
        total,
        byStatus: { submitted, verified, assigned, inProgress, resolved, rejected },
        bySeverity: { critical, high },
        resolutionRate: parseFloat(resolutionRate)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getAnalytics = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    
    const complaints = await prisma.complaint.findMany({
      where: {
        createdAt: { gte: start, lte: end }
      },
      select: {
        id: true, createdAt: true, resolvedAt: true, status: true, severity: true, ward: true
      }
    });
    
    const resolvedComplaints = complaints.filter(c => c.resolvedAt);
    const avgResolutionTime = resolvedComplaints.length > 0
      ? resolvedComplaints.reduce((sum, c) => sum + (new Date(c.resolvedAt) - new Date(c.createdAt)), 0) / resolvedComplaints.length / (1000 * 60 * 60)
      : 0;
    
    res.json({
      analytics: {
        totalComplaints: complaints.length,
        resolvedComplaints: resolvedComplaints.length,
        avgResolutionTimeHours: avgResolutionTime.toFixed(2),
        period: { start, end }
      }
    });
  } catch (error) {
    next(error);
  }
};

const getMapData = async (req, res, next) => {
  try {
    const { status, severity } = req.query;
    const where = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    
    const complaints = await prisma.complaint.findMany({
      where,
      select: {
        id: true, complaintNumber: true, latitude: true, longitude: true,
        status: true, severity: true, damageType: true, ward: true, createdAt: true
      }
    });
    
    res.json({ complaints });
  } catch (error) {
    next(error);
  }
};

const getTrends = async (req, res, next) => {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    const complaints = await prisma.complaint.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      },
      select: { createdAt: true }
    });
    
    const trends = {};
    complaints.forEach(item => {
      const date = item.createdAt.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    });
    
    const result = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        count: trends[dateStr] || 0
      });
    }
    
    res.json({ trends: result });
  } catch (error) {
    next(error);
  }
};

const getDepartmentPerformance = async (req, res, next) => {
  res.json({ message: 'Department performance endpoint' });
};

const getContractorPerformance = async (req, res, next) => {
  res.json({ message: 'Contractor performance endpoint' });
};

module.exports = {
  getStats,
  getAnalytics,
  getMapData,
  getTrends,
  getDepartmentPerformance,
  getContractorPerformance
};
