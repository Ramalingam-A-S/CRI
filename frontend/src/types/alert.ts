import { HazardType, Severity } from './risk';

export type AlertLevel = 'INFO' | 'ADVISORY' | 'WARNING' | 'CRITICAL';

export interface Alert {
  id: string;
  hazard: HazardType;
  level: AlertLevel;
  severity: Severity;
  title: string;
  message: string;
  locationName: string;
  coordinates: [number, number]; // [lat, lng]
  timestamp: string;
  source: string;              // e.g. "Risk Engine v1.2", "Citizen Telemetry"
  confidence: number;          // 0.0 to 1.0
  acknowledged: boolean;
  acknowledgedAt?: string;
  acknowledgedBy?: string;
  affectedZoneId?: string;
}
