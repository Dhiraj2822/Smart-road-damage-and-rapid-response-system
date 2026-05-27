const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsers() {
  try {
    const users = await prisma.user.findMany({ select: { email: true, role: true } });
    console.log('--- User List ---');
    users.forEach(u => console.log(`${u.email} - [${u.role}]`));
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
