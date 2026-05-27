/**
 * Calculate priority score for a complaint
 * Priority Score = (Severity  40%) + (Traffic Impact  30%) + (Age  20%) + (Public Safety  10%)
 */

const SEVERITY_WEIGHTS = {
  LOW: 2.5,
  MEDIUM: 5,
  HIGH: 7.5,
  CRITICAL: 10
};

const ROAD_TYPE_WEIGHTS = {
  HIGHWAY: 10,
  MAIN_ROAD: 7,
  RESIDENTIAL: 4,
  INTERNAL: 2
};

// High-priority locations (schools, hospitals, etc.)
const PUBLIC_SAFETY_ZONES = [
  { name: 'School Zone', keywords: ['school', 'college', 'university'], weight: 10 },
  { name: 'Hospital Zone', keywords: ['hospital', 'clinic', 'medical'], weight: 10 },
  { name: 'Market Area', keywords: ['market', 'bazaar', 'shopping'], weight: 7 },
  { name: 'Bus Stand', keywords: ['bus', 'stand', 'station'], weight: 8 }
];

const calculatePriority = ({ severity, roadType, latitude, longitude, ward, address = '', createdAt = new Date() }) => {
  // 1. Severity Score (40%)
  const severityScore = (SEVERITY_WEIGHTS[severity] || 5) * 0.4;
  
  // 2. Traffic Impact Score (30%)
  const trafficScore = (ROAD_TYPE_WEIGHTS[roadType] || 4) * 0.3;
  
  // 3. Age Score (20%) - increases over time
  const ageInDays = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  const ageScore = Math.min(ageInDays / 7, 1) * 10 * 0.2; // Max after 7 days
  
  // 4. Public Safety Score (10%)
  let publicSafetyScore = 5; // Default
  const addressLower = address.toLowerCase();
  
  for (const zone of PUBLIC_SAFETY_ZONES) {
    if (zone.keywords.some(keyword => addressLower.includes(keyword))) {
      publicSafetyScore = zone.weight;
      break;
    }
  }
  publicSafetyScore *= 0.1;
  
  // Calculate total priority score (0-10)
  const priorityScore = severityScore + trafficScore + ageScore + publicSafetyScore;
  
  return Math.round(priorityScore * 100) / 100; // Round to 2 decimal places
};

/**
 * Recalculate priority for aging complaints
 */
const recalculatePriority = (complaint) => {
  return calculatePriority({
    severity: complaint.severity,
    roadType: complaint.roadType,
    latitude: complaint.latitude,
    longitude: complaint.longitude,
    ward: complaint.ward,
    address: complaint.address,
    createdAt: complaint.createdAt
  });
};

module.exports = {
  calculatePriority,
  recalculatePriority
};
