import { Severity } from './risk';

export type InfraType = 
  | 'HOSPITAL'
  | 'FIRE_STATION'
  | 'AMBULANCE_STATION'
  | 'SCHOOL'
  | 'POWER_SUBSTATION'
  | 'PUMPING_STATION'
  | 'COMMUNICATION_TOWER';

export type InfraStatus = 'OPERATIONAL' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';

export interface Infrastructure {
  id: string;
  name: string;
  type: InfraType;
  coordinates: [number, number]; // [lat, lng]
  status: InfraStatus;
  capacityDetails?: string;
  backupPower: boolean;
  currentExposureSeverity: Severity;
  assignedZoneId: string;
  contactNumber: string;
  notes?: string;
}
