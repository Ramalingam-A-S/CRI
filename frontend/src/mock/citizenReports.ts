import { CitizenReport } from '../types';

export const INITIAL_CITIZEN_REPORTS: CitizenReport[] = [
  {
    id: 'rep-001',
    type: 'FLOODING',
    locationName: 'Metro Central Underpass Ramp',
    coordinates: [12.9735, 77.5985],
    severity: 'CRITICAL',
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(),
    description: 'Car partially submerged in waist-deep water on the eastbound entrance ramp. Drivers reversing out.',
    reporterName: 'David K. (Commuter)',
    verificationStatus: 'VERIFIED',
    upvotes: 42
  },
  {
    id: 'rep-002',
    type: 'BLOCKED_ROAD',
    locationName: 'North River Road & 4th Cross',
    coordinates: [12.9810, 77.5920],
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 35 * 60000).toISOString(),
    description: 'Storm drain overflowed throwing manhole cover off. Road blocked with emergency flares.',
    reporterName: 'Ananya S. (Local Resident)',
    verificationStatus: 'VERIFIED',
    upvotes: 29
  },
  {
    id: 'rep-003',
    type: 'FALLEN_TREE',
    locationName: 'Ridge View Terrace Road',
    coordinates: [12.9900, 77.5840],
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 48 * 60000).toISOString(),
    description: 'Large banyan branch collapsed across power lines and both lanes of northbound traffic.',
    reporterName: 'Resident Association Watch',
    verificationStatus: 'UNDER_REVIEW',
    upvotes: 18
  },
  {
    id: 'rep-004',
    type: 'EXTREME_HEAT',
    locationName: 'East Industrial Gate 2 Bus Stop',
    coordinates: [12.9620, 77.6200],
    severity: 'HIGH',
    timestamp: new Date(Date.now() - 90 * 60000).toISOString(),
    description: 'Extremely hot shelter metal roof, several workers waiting feeling heat exhaustion.',
    reporterName: 'Worker Safety Group',
    verificationStatus: 'VERIFIED',
    upvotes: 31
  },
  {
    id: 'rep-005',
    type: 'INFRASTRUCTURE_DAMAGE',
    locationName: 'South Pumping Station Spillway',
    coordinates: [12.9600, 77.5900],
    severity: 'CRITICAL',
    timestamp: new Date(Date.now() - 15 * 60000).toISOString(),
    description: 'Trash rack clogged with tree debris, intake water backing up toward street level.',
    reporterName: 'Pumping Technician',
    verificationStatus: 'VERIFIED',
    upvotes: 56
  }
];
