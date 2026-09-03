import { Severity } from './risk';

export type ShelterAvailability = 'AVAILABLE' | 'NEAR_CAPACITY' | 'FULL' | 'CLOSED';

export interface Shelter {
  id: string;
  name: string;
  locationName: string;
  coordinates: [number, number]; // [lat, lng]
  capacity: number;
  occupancy: number;
  availability: ShelterAvailability;
  services: string[];          // e.g. ["Medical", "Food", "Power Backup", "Clean Water"]
  currentRisk: Severity;
  status: 'OPEN' | 'PREPARING' | 'CLOSED';
  contactPerson: string;
  contactPhone: string;
  assignedZoneId: string;
}
