const prisma = require('../config/database');
const { logger } = require('../utils/logger');

/**
 * Department routing logic based on damage type and severity
 */

const DEPARTMENT_CODES = {
  ENGINEERING: 'ENG',
  WATER_SUPPLY: 'WATER',
  DRAINAGE: 'DRAIN',
  ELECTRICITY: 'ELEC',
  TRAFFIC: 'TRAFFIC',
  DISASTER_MGMT: 'DISASTER',
  WARD_OFFICE: 'WARD'
};

/**
 * Route complaint to appropriate department
 */
const routeToDepartment = async ({ damageType, severity, roadType, ward }) => {
  try {
    let departmentCode;
    
    // Utility-related damage routing
    if (damageType === 'WATER_LOGGING') {
      departmentCode = DEPARTMENT_CODES.DRAINAGE;
    } else if (damageType === 'UTILITY_DAMAGE') {
      // This would need more context, defaulting to engineering
      departmentCode = DEPARTMENT_CODES.ENGINEERING;
    }
    // Critical damage on highways
    else if (severity === 'CRITICAL' && roadType === 'HIGHWAY') {
      departmentCode = DEPARTMENT_CODES.ENGINEERING;
      // Also notify traffic and disaster management
      await notifyDepartments([
        DEPARTMENT_CODES.TRAFFIC,
        DEPARTMENT_CODES.DISASTER_MGMT
      ]);
    }
    // High severity on main roads
    else if ((severity === 'CRITICAL' || severity === 'HIGH') && roadType === 'MAIN_ROAD') {
      departmentCode = DEPARTMENT_CODES.ENGINEERING;
      await notifyDepartments([DEPARTMENT_CODES.TRAFFIC]);
    }
    // Regular road damage
    else if (damageType === 'POTHOLE' || damageType === 'CRACK' || damageType === 'SURFACE_FAILURE') {
      departmentCode = DEPARTMENT_CODES.ENGINEERING;
    }
    // Default to ward office for residential/internal roads
    else if (roadType === 'RESIDENTIAL' || roadType === 'INTERNAL') {
      departmentCode = DEPARTMENT_CODES.WARD_OFFICE;
    }
    // Fallback to engineering
    else {
      departmentCode = DEPARTMENT_CODES.ENGINEERING;
    }
    
    // Find department by code
    const department = await prisma.department.findUnique({
      where: { code: departmentCode }
    });
    
    if (!department) {
      logger.warn(`Department not found for code: ${departmentCode}`);
      return null;
    }
    
    return department.id;
  } catch (error) {
    logger.error('Error routing to department:', error);
    return null;
  }
};

/**
 * Notify multiple departments about a complaint
 */
const notifyDepartments = async (departmentCodes) => {
  try {
    const departments = await prisma.department.findMany({
      where: {
        code: { in: departmentCodes }
      }
    });
    
    // This would trigger notifications to department heads
    logger.info(`Notifying departments: ${departmentCodes.join(', ')}`);
    
    return departments;
  } catch (error) {
    logger.error('Error notifying departments:', error);
    return [];
  }
};

/**
 * Escalate complaint if SLA is breached
 */
const escalateComplaint = async (complaintId) => {
  try {
    const complaint = await prisma.complaint.findUnique({
      where: { id: complaintId },
      include: {
        department: true,
        assignedTo: true
      }
    });
    
    if (!complaint) {
      return null;
    }
    
    // Check if SLA is breached
    const now = new Date();
    if (complaint.slaDeadline && now > complaint.slaDeadline) {
      logger.warn(`SLA breached for complaint: ${complaint.complaintNumber}`);
      
      // Escalate to department head or higher authority
      // This would involve sending notifications to senior officials
      
      // Create escalation history
      await prisma.complaintHistory.create({
        data: {
          complaintId,
          action: 'SLA_ESCALATION',
          performedBy: 'SYSTEM',
          comments: 'Complaint escalated due to SLA breach',
          newValue: { escalated: true, escalatedAt: now }
        }
      });
      
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error escalating complaint:', error);
    return false;
  }
};

/**
 * Get workflow status for a complaint
 */
const getWorkflowStatus = (complaint) => {
  const stages = [
    { name: 'Submitted', completed: !!complaint.createdAt, date: complaint.createdAt },
    { name: 'Verified', completed: !!complaint.verifiedAt, date: complaint.verifiedAt },
    { name: 'Assigned', completed: !!complaint.assignedAt, date: complaint.assignedAt },
    { name: 'In Progress', completed: !!complaint.inProgressAt, date: complaint.inProgressAt },
    { name: 'Resolved', completed: !!complaint.resolvedAt, date: complaint.resolvedAt }
  ];
  
  const currentStage = stages.findIndex(stage => !stage.completed);
  
  return {
    stages,
    currentStage: currentStage === -1 ? stages.length - 1 : currentStage,
    progress: (stages.filter(s => s.completed).length / stages.length) * 100
  };
};

module.exports = {
  routeToDepartment,
  notifyDepartments,
  escalateComplaint,
  getWorkflowStatus
};
