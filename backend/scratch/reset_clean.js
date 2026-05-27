const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function resetAndSetup() {
  try {
    console.log('--- Cleaning up database ---');
    // Delete in order of dependency
    await prisma.notification.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.complaintHistory.deleteMany({});
    await prisma.workOrder.deleteMany({});
    await prisma.complaintImage.deleteMany({});
    await prisma.complaint.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.contractor.deleteMany({});
    // We'll keep departments as they are infrastructure, but clean them if you want. 
    // Let's just ensure we have at least one.

    const passwordHash = await bcrypt.hash('admin123', 10);

    console.log('--- Creating 1 MNC Official (Admin) ---');
    await prisma.user.create({
      data: {
        name: 'MNC Official',
        email: 'admin@smc.gov.in',
        phone: '1234567890',
        password: passwordHash,
        role: 'ADMIN',
        isVerified: true
      }
    });

    console.log('--- Creating 1 Citizen ---');
    await prisma.user.create({
      data: {
        name: 'Citizen User',
        email: 'citizen@gmail.com',
        phone: '9876543210',
        password: passwordHash,
        role: 'CITIZEN',
        isVerified: true
      }
    });

    console.log('--- Creating 2 Contractors ---');
    const c1 = await prisma.contractor.create({
      data: {
        name: 'John Contractor',
        companyName: 'John Road Builders',
        licenseNumber: 'LIC-001',
        phone: '1112223333',
        email: 'john@contractor.com'
      }
    });

    const c2 = await prisma.contractor.create({
      data: {
        name: 'Steve Works',
        companyName: 'Steve Infra',
        licenseNumber: 'LIC-002',
        phone: '4445556666',
        email: 'steve@contractor.com'
      }
    });

    console.log('--- Creating User Accounts for Contractors ---');
    await prisma.user.create({
      data: {
        name: 'John Road Builders (Login)',
        email: 'john@contractor.com',
        phone: '1112223333',
        password: passwordHash,
        role: 'CONTRACTOR',
        contractorId: c1.id,
        isVerified: true
      }
    });

    await prisma.user.create({
      data: {
        name: 'Steve Infra (Login)',
        email: 'steve@contractor.com',
        phone: '4445556666',
        password: passwordHash,
        role: 'CONTRACTOR',
        contractorId: c2.id,
        isVerified: true
      }
    });

    console.log('--- Setup Complete ---');
    console.log('Logins (All passwords are "admin123"):');
    console.log('Admin: admin@smc.gov.in');
    console.log('Citizen: citizen@gmail.com');
    console.log('Contractor 1: john@contractor.com');
    console.log('Contractor 2: steve@contractor.com');

  } catch (e) {
    console.error('Error during reset:', e);
  } finally {
    await prisma.$disconnect();
  }
}

resetAndSetup();
