const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.notification.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.complaintImage.deleteMany();
  await prisma.complaintHistory.deleteMany();
  await prisma.complaint.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.contractor.deleteMany();

  const adminPass = await bcrypt.hash("smc123", 10);
  const citizenPass = await bcrypt.hash("user123", 10);
  const contractorPass = await bcrypt.hash("smc123", 10);

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: "Public Works Department",
        code: "PWD",
        description: "Main road maintenance and construction",
        contactEmail: "pwd@municipal.gov.in",
        contactPhone: "0217-2731001",
      },
    }),
    prisma.department.create({
      data: {
        name: "Water Supply Department",
        code: "WSD",
        description: "Pipeline leakages and repairs",
        contactEmail: "wsd@municipal.gov.in",
        contactPhone: "0217-2731002",
      },
    }),
    prisma.department.create({
      data: {
        name: "Sewage & Drainage Department",
        code: "SDD",
        description: "Drainage blockages and repairs",
        contactEmail: "sdd@municipal.gov.in",
        contactPhone: "0217-2731003",
      },
    }),
    prisma.department.create({
      data: {
        name: "Electricity Department",
        code: "ELE",
        description: "Street lighting and electrical repairs",
        contactEmail: "ele@municipal.gov.in",
        contactPhone: "0217-2731004",
      },
    }),
    prisma.department.create({
      data: {
        name: "Traffic Police Department",
        code: "TPD",
        description: "Signs, signals and traffic management",
        contactEmail: "tpd@municipal.gov.in",
        contactPhone: "0217-2731005",
      },
    }),
    prisma.department.create({
      data: {
        name: "General Ward Maintenance",
        code: "GWM",
        description: "Internal ward road repairs",
        contactEmail: "gwm@municipal.gov.in",
        contactPhone: "0217-2731006",
      },
    }),
  ]);

  console.log("Created departments:", departments.length);

  // Create admin user
  const admin = await prisma.user.create({
    data: {
      name: "SMC Admin",
      email: "admin@smc.gov",
      phone: "9876543210",
      password: adminPass,
      role: "ADMIN",
      isActive: true,
      isVerified: true,
    },
  });

  console.log("Created admin user:", admin.email);

  // Create some department heads
  const deptHeads = await Promise.all([
    prisma.user.create({
      data: {
        name: "PWD Head",
        email: "pwd.head@smc.gov",
        phone: "9876543211",
        password: adminPass,
        role: "DEPT_HEAD",
        departmentId: departments[0].id,
        isActive: true,
        isVerified: true,
      },
    }),
    prisma.user.create({
      data: {
        name: "Ward Officer",
        email: "ward.officer@smc.gov",
        phone: "9876543212",
        password: adminPass,
        role: "WARD_OFFICER",
        departmentId: departments[5].id,
        isActive: true,
        isVerified: true,
      },
    }),
  ]);

  console.log("Created department heads:", deptHeads.length);

  // Create a default citizen for testing
  const citizen = await prisma.user.create({
    data: {
      name: "Test Citizen",
      email: "user@test.com",
      phone: "9876543219",
      password: citizenPass,
      role: "CITIZEN",
      isActive: true,
      isVerified: true,
    },
  });

  console.log("Created citizen user:", citizen.email);

  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
