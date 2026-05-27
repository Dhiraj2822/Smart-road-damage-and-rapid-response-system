const prisma = require('../config/database');
const bcrypt = require('bcryptjs');

const createContractor = async (req, res, next) => {
  try {
    const { name, companyName, phone, email, licenseNumber, address, password } = req.body;
    
    // Transaction to ensure both Contractor and User are created
    const result = await prisma.$transaction(async (prisma) => {
        // 1. Create Contractor Entity
        const contractor = await prisma.contractor.create({
          data: { name, companyName, phone, email, licenseNumber, address }
        });
        
        // 2. Create User Login for Contractor
        const finalPassword = password || "Contractor@123";
        const hashedPassword = await bcrypt.hash(finalPassword, 10);
        
        await prisma.user.create({
            data: {
                name: companyName,
                email: email, 
                phone: phone,
                password: hashedPassword,
                role: "CONTRACTOR",
                isVerified: true,
                contractorId: contractor.id
            }
        });
        
        return contractor;
    });

    res.status(201).json({ message: 'Contractor and Login Account created', contractor: result });
  } catch (error) {
    next(error);
  }
};

const getContractorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const contractor = await prisma.contractor.findUnique({
      where: { id },
      include: {
        workOrders: {
            orderBy: { createdAt: 'desc' },
            include: { complaint: true }
        }
      }
    });

    if (!contractor) return res.status(404).json({ error: "Contractor not found" });

    // Sanitize
    const sanitized = { ...contractor };
    delete sanitized.password; // Double safety

    res.json({ contractor: sanitized });
  } catch (error) {
    next(error);
  }
};

const getAllContractors = async (req, res, next) => {
  try {
    const contractors = await prisma.contractor.findMany({
      select: {
          id: true, name: true, email: true, phone: true, companyName: true, licenseNumber: true, activeJobs: true, completedJobs: true, createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    res.json({ contractors });
  } catch (error) {
    next(error);
  }
};

const assignWorkOrder = async (req, res, next) => {
  try {
    const { complaintId, contractorId, description, estimatedCost, dueDate } = req.body;
    
    if (parseFloat(estimatedCost) < 0) {
        return res.status(400).json({ error: "Estimated cost cannot be negative." });
    }
    
    const complaint = await prisma.complaint.findUnique({ where: { id: complaintId } });
    if (!complaint) return res.status(404).json({ error: 'Complaint not found' });
    
    // Check if duplicate assignment
    if (complaint.status === 'IN_PROGRESS') {
         return res.status(400).json({ error: 'Complaint is already in progress' });
    }

    const orderNumber = 'WO-' + Date.now();
    
    const workOrder = await prisma.workOrder.create({
      data: {
        orderNumber,
        complaintId,
        contractorId,
        description,
        estimatedCost: parseFloat(estimatedCost),
        dueDate: new Date(dueDate),
        startDate: null, // Will be set when accepted
        status: 'ASSIGNED' // Starting status
      }
    });
    
    await prisma.complaint.update({
      where: { id: complaintId },
      data: {
        status: 'ASSIGNED',
        contractorId,
        assignedAt: new Date()
      }
    });
    
    await prisma.contractor.update({
      where: { id: contractorId },
      data: { activeJobs: { increment: 1 } }
    });
    
    await prisma.complaintHistory.create({
      data: {
        complaintId,
        action: 'WORK_ORDER_CREATED',
        newValue: JSON.stringify({ orderNumber, contractorId }),
        performedById: req.user.id
      }
    });
    
    res.status(201).json({ message: 'Work order created and assigned', workOrder });
  } catch (error) {
    next(error);
  }
};

// CONTRACTOR SELF-SERVICE ENDPOINTS

const getMyWorkOrders = async (req, res, next) => {
    try {
        const contractorId = req.user.contractorId;
        if (!contractorId) return res.status(403).json({ error: 'Not a contractor' });

        const workOrders = await prisma.workOrder.findMany({
            where: { contractorId },
            include: {
                complaint: {
                    include: { 
                        images: true,
                        history: {
                            orderBy: { createdAt: 'desc' },
                            take: 5
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json({ workOrders });
    } catch (error) {
        next(error);
    }
};

const acceptWorkOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const contractorId = req.user.contractorId;
        
        const workOrder = await prisma.workOrder.findUnique({ where: { id } });
        if (!workOrder) return res.status(404).json({ error: 'Work Order not found' });
        if (workOrder.contractorId !== contractorId) return res.status(403).json({ error: 'Access denied' });
        
        if (workOrder.status !== 'ASSIGNED' && workOrder.status !== 'PENDING') {
             return res.status(400).json({ error: 'Work order is not in assigned state' });
        }

        await prisma.$transaction(async (prisma) => {
            await prisma.workOrder.update({
                where: { id },
                data: {
                    status: 'IN_PROGRESS',
                    acceptedAt: new Date(),
                    startDate: new Date()
                }
            });
            await prisma.complaint.update({
                where: { id: workOrder.complaintId },
                data: { status: 'IN_PROGRESS', inProgressAt: new Date() }
            });
            await prisma.complaintHistory.create({
                data: {
                    complaintId: workOrder.complaintId,
                    action: 'WORK_ACCEPTED_BY_CONTRACTOR',
                    performedById: req.user.id
                }
            });
        });

        res.json({ message: 'Work Order Accepted' });
    } catch (e) { next(e); }
};

const rejectWorkOrder = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;
        const contractorId = req.user.contractorId;
         if (!reason) return res.status(400).json({ error: 'Rejection reason required' });

        const workOrder = await prisma.workOrder.findUnique({ where: { id } });
        if (!workOrder) return res.status(404).json({ error: 'Work Order not found' });
        if (workOrder.contractorId !== contractorId) return res.status(403).json({ error: 'Access denied' });

        await prisma.$transaction(async (prisma) => {
            await prisma.workOrder.update({
                where: { id },
                data: {
                    status: 'REJECTED',
                    rejectionReason: reason
                }
            });
            await prisma.complaint.update({
                where: { id: workOrder.complaintId },
                data: { status: 'VERIFIED', contractorId: null } 
            });
            await prisma.complaintHistory.create({
                data: {
                    complaintId: workOrder.complaintId,
                    action: 'WORK_REJECTED_BY_CONTRACTOR',
                    newValue: JSON.stringify({ reason }),
                    performedById: req.user.id
                }
            });
            // Decrement active jobs?
             await prisma.contractor.update({
                where: { id: contractorId },
                data: { activeJobs: { decrement: 1 } }
             });
        });
        
        res.json({ message: 'Work Order Rejected' });
    } catch (e) { next(e); }
};

const completeWorkOrder = async (req, res, next) => {
    try {
        const { id } = req.params; // WorkOrder ID
        const contractorId = req.user.contractorId;
        
        const { finalCost, completionNotes, proofImageUrl } = req.body;
        // Handle file upload if present - Normalize Windows paths
        const actualProofUrl = req.file 
            ? req.file.path.replace(/\\/g, '/').replace('uploads/', '/uploads/') 
            : proofImageUrl;
        
        // MANDATORY: Proof image required
        if (!actualProofUrl) {
            return res.status(400).json({ error: 'Proof image is required. Please capture an after-repair photo.' });
        }

        const workOrder = await prisma.workOrder.findUnique({ where: { id } });
        if (!workOrder) return res.status(404).json({ error: 'Work Order not found' });
        if (workOrder.contractorId !== contractorId) return res.status(403).json({ error: 'Access denied' });

        await prisma.$transaction(async (prisma) => {
            // Update Work Order
            await prisma.workOrder.update({
                where: { id },
                data: {
                    status: 'COMPLETED',
                    actualCost: parseFloat(finalCost || 0),
                    completedAt: new Date(),
                    proofImageUrl: actualProofUrl || null,
                    completionNotes: completionNotes || null
                }
            });

            // Update Complaint
            await prisma.complaint.update({
                where: { id: workOrder.complaintId },
                data: {
                    status: 'COMPLETED', // Waiting for official approval
                    resolvedAt: new Date()
                }
            });

            // Log History
            await prisma.complaintHistory.create({
                data: {
                    complaintId: workOrder.complaintId,
                    action: 'WORK_COMPLETED_BY_CONTRACTOR',
                    newValue: JSON.stringify({ finalCost, completionNotes, proofImageUrl }),
                    performedById: req.user.id
                }
            });

            // Create "After" Image record linked to the complaint
            if (actualProofUrl) {
                 await prisma.complaintImage.create({
                    data: {
                        complaintId: workOrder.complaintId,
                        imageUrl: actualProofUrl,
                        originalName: "Proof of Repairs",
                        mimeType: "image/jpeg",
                        isProof: true // EXPLICITLY MARK AS PROOF
                    }
                 });
            }
        });
        
        // Notify all officials that work is complete and ready for review
        const officials = await prisma.user.findMany({ where: { role: "OFFICIAL" } });
        for (const official of officials) {
            sendNotification({
                 userId: official.id,
                 type: "WORK_COMPLETED",
                 title: `Work Completed Pending Review`,
                 message: `Contractor has submitted proof for order ${workOrder.orderNumber}. Ready for your review.`,
                 channels: ["IN_APP"]
            }).catch(err => console.error(err));
        }

        res.json({ message: "Work Order marked completed. Submitted for verification." });
    } catch (error) {
        next(error);
    }
};

const updateContractor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, companyName, phone, email, licenseNumber, address } = req.body;

    const contractor = await prisma.contractor.update({
      where: { id },
      data: { name, companyName, phone, email, licenseNumber, address },
      select: {
          id: true, name: true, email: true, phone: true, companyName: true, licenseNumber: true, activeJobs: true, completedJobs: true, createdAt: true
      }
    });

    res.json({ message: 'Contractor updated successfully', contractor });
  } catch (error) {
    next(error);
  }
};

const deleteContractor = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Check if contractor has active jobs
    const contractor = await prisma.contractor.findUnique({ 
        where: { id },
        include: { _count: { select: { workOrders: { where: { status: 'IN_PROGRESS' } } } } }
    });

    if (contractor._count.workOrders > 0) {
        return res.status(400).json({ error: "Cannot delete contractor with active work orders. Please reassign or complete them first." });
    }

    await prisma.contractor.delete({ where: { id } });
    res.json({ message: 'Contractor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createContractor,
  getContractorById,
  getAllContractors,
  updateContractor,
  deleteContractor,
  assignWorkOrder,
  getMyWorkOrders,
  acceptWorkOrder,
  rejectWorkOrder,
  completeWorkOrder
};

