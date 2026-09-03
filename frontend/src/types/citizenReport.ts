import { Severity } from './risk';

export type ReportType = 
  | 'FLOODING'
  | 'BLOCKED_ROAD'
  | 'FALLEN_TREE'
  | 'EXTREME_HEAT'
  | 'LANDSLIDE'
  | 'INFRASTRUCTURE_DAMAGE';

export type VerificationStatus = 'UNVERIFIED' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';

export interface CitizenReport {
  id: string;
  type: ReportType;
  locationName: string;
  coordinates: [number, number]; // [lat, lng]
  severity: Severity;
  timestamp: string;
  description: string;
  reporterName?: string;
  verificationStatus: VerificationStatus;
  upvotes: number;
  imageUrl?: string;
}
