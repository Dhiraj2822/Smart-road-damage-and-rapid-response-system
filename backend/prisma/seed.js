const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs'); // This works because we run it in backend/
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding departments...');
  const departments = [
    { name: 'Engineering Department', code: 'DEPT_ENG', description: 'Responsible for road construction, maintenance, and pothole repairs.', contactEmail: 'engineering@solapur.gov.in', contactPhone: '0217-2740300' },
    { name: 'Drainage & Water Supply', code: 'DEPT_DRN', description: 'Handles water logging, pipeline leaks, and drainage issues.', contactEmail: 'drainage@solapur.gov.in', contactPhone: '0217-2740301' },
    { name: 'Traffic Department', code: 'DEPT_TRF', description: 'Manages traffic signals, signage, and accident-prone zones.', contactEmail: 'traffic@solapur.gov.in', contactPhone: '0217-2740302' },
    { name: 'Health & Sanitation', code: 'DEPT_SNT', description: 'Street cleaning and garbage removal.', contactEmail: 'health@solapur.gov.in', contactPhone: '0217-2740303' },
    { name: 'Disaster Management', code: 'DEPT_DIS', description: 'Emergency response for floods and major collapses.', contactEmail: 'disaster@solapur.gov.in', contactPhone: '0217-2740304' }
  ];

  for (const dept of departments) {
    const upsertedDept = await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    });
    console.log(`Upserted department: ${upsertedDept.name}`);
  }

  console.log('Seeding contractors...');
  const contractors = [
    { name: 'Ramesh Patil', companyName: 'BuildWell Infra', phone: '9822334455', email: 'contractor@buildwell.com', licenseNumber: 'CON-SOL-001', address: '12, MIDC, Solapur', rating: 4.5 },
    { name: 'Suresh More', companyName: 'More Road Works', phone: '9822334466', email: 'suresh@more.com', licenseNumber: 'CON-SOL-002', address: '45, Navi Peth, Solapur', rating: 4.2 }
  ];

  for (const con of contractors) {
    const upsertedCon = await prisma.contractor.upsert({
      where: { licenseNumber: con.licenseNumber },
      update: con,
      create: con,
    });
    console.log(`Upserted contractor: ${upsertedCon.companyName}`);
  }

  console.log('Seeding Users with HASHED passwords...');
  
  // Hashes (calculated via bcrypt)
  const adminHash = await bcrypt.hash('admin', 10);
  const contractorHash = await bcrypt.hash('Contractor@123', 10);
  const citizenHash = await bcrypt.hash('123456', 10);

  // Admin
  await prisma.user.upsert({
      where: { email: 'admin@smc.gov.in' },
      update: {
          role: 'ADMIN',
          password: adminHash // UPDATE PASSWORD
      },
      create: {
          email: 'admin@smc.gov.in',
          password: adminHash,
          name: 'System Admin',
          role: 'ADMIN',
          phone: '0000000000'
      }
  });

  // Contractor User
  const contractor = await prisma.contractor.findUnique({ where: { licenseNumber: 'CON-SOL-001' } });
  if (contractor) {
      await prisma.user.upsert({
          where: { email: 'contractor@buildwell.com' },
          update: { 
            contractorId: contractor.id,
            role: 'CONTRACTOR',
            password: contractorHash // UPDATE PASSWORD
          },
          create: {
              email: 'contractor@buildwell.com',
              password: contractorHash,
              name: 'Ramesh Contractor',
              role: 'CONTRACTOR',
              phone: '9822334455',
              contractorId: contractor.id
          }
      });
  }

  // Citizen
  await prisma.user.upsert({
      where: { email: 'final@citizen.com' },
      update: { role: 'CITIZEN', password: citizenHash },
      create: {
          email: 'final@citizen.com',
          password: citizenHash,
          name: 'Final Test Citizen',
          role: 'CITIZEN',
          phone: '9988776655'
      }
  });
  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
