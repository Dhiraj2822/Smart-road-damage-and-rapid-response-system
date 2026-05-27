const { calculatePriority } = require('../src/services/priority.service');

describe('Priority Service', () => {
  test('should calculate high priority for critical highway damage', () => {
    const priority = calculatePriority({
      severity: 'CRITICAL',
      roadType: 'HIGHWAY',
      latitude: 17.6599,
      longitude: 75.9064,
      ward: 'Ward 1',
      address: 'Near hospital'
    });
    
    expect(priority).toBeGreaterThan(7);
  });

  test('should calculate low priority for minor residential damage', () => {
    const priority = calculatePriority({
      severity: 'LOW',
      roadType: 'RESIDENTIAL',
      latitude: 17.6599,
      longitude: 75.9064,
      ward: 'Ward 1',
      address: 'Residential area'
    });
    
    expect(priority).toBeLessThan(5);
  });

  test('should increase priority for school zones', () => {
    const normalPriority = calculatePriority({
      severity: 'MEDIUM',
      roadType: 'MAIN_ROAD',
      latitude: 17.6599,
      longitude: 75.9064,
      ward: 'Ward 1',
      address: 'Main road'
    });

    const schoolPriority = calculatePriority({
      severity: 'MEDIUM',
      roadType: 'MAIN_ROAD',
      latitude: 17.6599,
      longitude: 75.9064,
      ward: 'Ward 1',
      address: 'Near school'
    });
    
    expect(schoolPriority).toBeGreaterThan(normalPriority);
  });
});
