const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { logger } = require('../utils/logger');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        departmentId: true,
        contractorId: true,
        contractor: {
          select: {
            companyName: true
          }
        },
        isActive: true
      }
    });
    
    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid or inactive user' });
    }
    
    req.user = user;
    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const authorize = (...rolesInput) => {
  return (req, res, next) => {
    // FIX: Flatten 'roles' if passed as an array
    const roles = (rolesInput.length === 1 && Array.isArray(rolesInput[0])) 
      ? rolesInput[0] 
      : rolesInput;

    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

module.exports = { authMiddleware, authorize };
