const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
  try {
    const userCount = await prisma.user.count();
    const complaintCount = await prisma.complaint.count();
    const contractorCount = await prisma.contractor.count();
    const workOrderCount = await prisma.workOrder.count();
    const auditCount = await prisma.auditLog.count();

    console.log('--- Database Status ---');
    console.log(`Users: ${userCount}`);
    console.log(`Complaints: ${complaintCount}`);
    console.log(`Contractors: ${contractorCount}`);
    console.log(`Work Orders: ${workOrderCount}`);
    console.log(`Audit Logs: ${auditCount}`);
    
    if (userCount > 0) {
      const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
      console.log(`Admin found: ${admin ? admin.email : 'None'}`);
    }
  } catch (e) {
    console.error('Error checking database:', e);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
