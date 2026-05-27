const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding Demo Data for Judges...');

    const pwd = await prisma.department.findFirst({ where: { code: 'PWD' } });
    if (!pwd) { console.log('Run npm run seed first.'); return; }

    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@smc.gov' } });

    // 1. Ensure Contractor Company Exists
    let contractorCompany = await prisma.contractor.findFirst({ where: { licenseNumber: 'LIC-2024-001' } });
    if (!contractorCompany) {
        contractorCompany = await prisma.contractor.create({
            data: {
                name: 'BuildWell Construction',
                companyName: 'BuildWell Construction',
                licenseNumber: 'LIC-2024-001', // Unique
                phone: '9876543220',
                address: '123 Industrial Area, City Center',
                isActive: true
            }
        });
        console.log('✅ Created Contractor Company: BuildWell');
    }

    // 2. Ensure Contractor User Exists & Linked
    let contractorUser = await prisma.user.findUnique({ where: { email: 'contractor@smc.gov' } });
    if (!contractorUser) {
        const hashedPassword = await bcrypt.hash('smc123', 10);
        contractorUser = await prisma.user.create({
            data: {
                name: 'BuildWell Agent',
                email: 'contractor@smc.gov',
                phone: '9876543220', // Ensure this is unique
                password: hashedPassword,
                role: 'CONTRACTOR',
                isActive: true,
                contractorId: contractorCompany.id // Link to company
            }
        });
        console.log('✅ Created Contractor User Linked to Company');
    } else {
        // Ensure existing user is linked
        if (!contractorUser.contractorId) {
            await prisma.user.update({ where: { id: contractorUser.id }, data: { contractorId: contractorCompany.id } });
            console.log('✅ Linked existing User to Contractor Company');
        }
    }

    const citizen = await prisma.user.findFirst({ where: { role: 'CITIZEN' } }) || adminUser;
    const contractorIdForComplaint = contractorCompany.id;

    console.log('USING CONTRACTOR COMPANY ID:', contractorIdForComplaint);

    // SCENARIO 1: Resolved
    // Robust Cleanup
    const demoNumbers = ['DEMO-2026-001', 'DEMO-2026-002', 'DEMO-2026-003'];
    console.log('🧹 Cleaning up old demo records...');

    // Find IDs first
    const existingDemos = await prisma.complaint.findMany({
        where: { complaintNumber: { in: demoNumbers } },
        select: { id: true }
    });
    const demoIds = existingDemos.map(c => c.id);

    if (demoIds.length > 0) {
        // Delete dependents manual cascade
        await prisma.auditLog.deleteMany({ where: { complaintId: { in: demoIds } } });
        await prisma.complaintImage.deleteMany({ where: { complaintId: { in: demoIds } } });
        await prisma.complaintHistory.deleteMany({ where: { complaintId: { in: demoIds } } });
        await prisma.workOrder.deleteMany({ where: { complaintId: { in: demoIds } } });

        // Delete parent
        await prisma.complaint.deleteMany({ where: { id: { in: demoIds } } });
        console.log('✅ Cleaned up old records.');
    }

    const resolved = await prisma.complaint.create({
        data: {
            complaintNumber: 'DEMO-2026-001',
            title: 'Critical Pothole on Station Road',
            description: 'Large crater causing traffic jam near Railway Station.',
            latitude: 17.6599,
            longitude: 75.9064,
            address: 'Station Road, City Center',
            ward: 'Ward 12',
            roadType: 'MAIN_ROAD',
            status: 'CLOSED',
            damageType: 'POTHOLE',
            severity: 'CRITICAL',
            priority: 1,
            userId: citizen.id,
            departmentId: pwd.id,
            assignedToId: adminUser.id,
            contractorId: contractorIdForComplaint,
            resolvedAt: new Date()
        }
    });

    await prisma.auditLog.createMany({
        data: [
            { complaintId: resolved.id, action: 'SUBMISSION', performedById: citizen.id, details: { status: 'SUBMITTED' }, timestamp: new Date(Date.now() - 86400000 * 5) },
            { complaintId: resolved.id, action: 'AI_ADVISORY', performedById: 'SYSTEM', details: { damageType: 'POTHOLE', severity: 'HIGH', confidence: 0.95 }, timestamp: new Date(Date.now() - 86400000 * 5 + 1000) },
            { complaintId: resolved.id, action: 'VERIFICATION', performedById: adminUser.id, details: { verified: true, damageType: 'POTHOLE', severity: 'CRITICAL' }, timestamp: new Date(Date.now() - 86400000 * 4) },
            { complaintId: resolved.id, action: 'ASSIGNMENT', performedById: adminUser.id, details: { contractor: 'BuildWell' }, timestamp: new Date(Date.now() - 86400000 * 3) },
            { complaintId: resolved.id, action: 'STATUS_CHANGE', performedById: contractorUser.id, details: { from: 'ASSIGNED', to: 'IN_PROGRESS' }, timestamp: new Date(Date.now() - 86400000 * 2) }, // Use Contractor User ID for audit actions
            { complaintId: resolved.id, action: 'STATUS_CHANGE', performedById: contractorUser.id, details: { from: 'IN_PROGRESS', to: 'COMPLETED', comments: 'Patch work done.' }, timestamp: new Date(Date.now() - 86400000 * 1) },
            { complaintId: resolved.id, action: 'STATUS_CHANGE', performedById: adminUser.id, details: { from: 'COMPLETED', to: 'CLOSED', comments: 'Quality verified.' }, timestamp: new Date() }
        ]
    });
    console.log('✅ Created Demo Scenario 1: Resolved Complaint');

    // SCENARIO 2: Pending Verification
    const pending = await prisma.complaint.create({
        data: {
            complaintNumber: 'DEMO-2026-002',
            title: 'New Damage: Pipeline Leak',
            description: 'Water leaking onto street near Market Yard.',
            latitude: 17.6619,
            longitude: 75.9084,
            address: 'Market Yard, City Center',
            ward: 'Ward 5',
            roadType: 'INTERNAL',
            status: 'SUBMITTED',
            userId: citizen.id,
            aiDetails: {
                damageType: 'CRACK',
                damageTypeConfidence: 0.88,
                severity: 'MEDIUM',
                confidence: 0.92,
                detections: [{ class: 'CRACK', confidence: 0.92, bbox: [10, 10, 100, 100] }]
            }
        }
    });
    console.log('✅ Created Demo Scenario 2: Pending Verification');

    // SCENARIO 3: In Progress
    const inProgress = await prisma.complaint.create({
        data: {
            complaintNumber: 'DEMO-2026-003',
            title: 'Sinkhole forming',
            description: 'Dangerous subsidence near School.',
            latitude: 17.6579,
            longitude: 75.9044,
            address: 'City School Rd, City Center',
            ward: 'Ward 8',
            roadType: 'RESIDENTIAL',
            status: 'IN_PROGRESS',
            damageType: 'SURFACE_FAILURE',
            severity: 'HIGH',
            userId: citizen.id,
            departmentId: pwd.id,
            contractorId: contractorIdForComplaint,
            verifiedAt: new Date(),
            assignedAt: new Date(),
            inProgressAt: new Date()
        }
    });
    console.log('✅ Created Demo Scenario 3: In Progress (For Contractor)');

    console.log('\n🎉 Demo Data Ready!');
    console.log('1. Login as Admin (admin@smc.gov / smc123) to see Scenarios 1 & 2.');
    console.log('2. Login as Contractor (contractor@smc.gov / smc123) to see Scenario 3.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
