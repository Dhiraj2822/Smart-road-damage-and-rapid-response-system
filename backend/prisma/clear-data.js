const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Cleaning Complaint History...');
    await prisma.complaintHistory.deleteMany({});
    
    console.log('Cleaning Complaint Images...');
    await prisma.complaintImage.deleteMany({});
    
    console.log('Cleaning Complaints...');
    await prisma.complaint.deleteMany({});
    
    console.log('All complaints cleared successfully!');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
