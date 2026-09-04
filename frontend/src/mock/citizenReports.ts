import { CitizenReport } from '../types';

export const INITIAL_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'rep-001',
    type: 'FLOODING',
    locationName: 'Nagalapuram Lowland Pass Canal Bridge',
    coordinates: [13.3875, 79.7995],
    severity: 'CRITICAL',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    description: 'Flash inundation reaching 2.5 ft across road section near irrigation culvert. Light vehicles turning around.',
    reporterName: 'V. Naidu (Farmer / Commuter)',
    verificationStatus: 'VERIFIED',
    upvotes: 42
  },
  {
    id: 'rep-002',
    type: 'BLOCKED_ROAD',
    locationName: 'Sankarapuram East Connecting Road',
    coordinates: [13.3855, 79.8050],
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    description: 'Drainage runoff overflowed ditch, muddy debris blocking single lane road.',
    reporterName: 'Ananya S. (Local Resident)',
    verificationStatus: 'VERIFIED',
    upvotes: 29
  },
  {
    id: 'rep-003',
    type: 'FALLEN_TREE',
    locationName: 'West Hills Foothill Trail Approach',
    coordinates: [13.3840, 79.7650],
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
    description: 'Uprooted teak tree collapsed across rural feeder road and secondary power wire.',
    reporterName: 'Forest Watch Volunteer',
    verificationStatus: 'UNDER_REVIEW',
    upvotes: 18
  },
  {
    id: 'rep-004',
    type: 'EXTREME_HEAT',
    locationName: 'Sankarapuram Weekly Market Yard',
    coordinates: [13.3870, 79.7940],
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    description: 'Open metal canopy shelter temperature high; shade and drinking water requested.',
    reporterName: 'Market Committee Member',
    verificationStatus: 'VERIFIED',
    upvotes: 31
  },
  {
    id: 'rep-005',
    type: 'INFRASTRUCTURE_DAMAGE',
    locationName: 'East Drainage Pumping Station Culvert',
    coordinates: [13.3835, 79.8150],
    severity: 'CRITICAL',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    description: 'Silt and branch debris clogging spillway screen, water backing up toward crop field.',
    reporterName: 'Pumping Technician',
    verificationStatus: 'VERIFIED',
    upvotes: 56
  }
];
