const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.details || err.message
    });
  }
  
  if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (err.code === 'P2002') { // Prisma unique constraint
    return res.status(409).json({ error: 'Resource already exists' });
  }
  
  if (err.code === 'P2025') { // Prisma record not found
    return res.status(404).json({ error: 'Resource not found' });
  }
  
  res.status(err.statusCode || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
};

module.exports = { errorHandler };
