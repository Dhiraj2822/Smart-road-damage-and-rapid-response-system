const { PrismaClient } = require('@prisma/client');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

prisma.$connect()
  .then(() => logger.info('PostgreSQL connected successfully'))
  .catch((err) => logger.error('PostgreSQL connection error:', err));

module.exports = prisma;
