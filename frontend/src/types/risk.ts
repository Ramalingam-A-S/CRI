import { SystemMode } from './system';

export type HazardType = 'FLOOD' | 'HEAT' | 'LANDSLIDE' | 'STORM';
export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][]; // [lat, lng] arrays
}

export interface RiskFactor {
  name: string;
  weight: number;      // 0.0 to 1.0
  currentValue: number | string;
  contribution: number; // Percentage contribution 0-100%
  unit?: string;
  source: string;
}

export interface RiskArea {
  id: string;
  name: string;
  hazardType: HazardType;
  riskScore: number;        // 0 to 100
  severity: Severity;
  confidence: number;       // 0.0 to 1.0 (e.g. 0.84 = 84%)
  isPredicted: boolean;     // false = CURRENTLY AFFECTED (solid), true = PREDICTED NEXT AFFECTED (dashed)
  geometry: GeoPolygon;
  center: [number, number]; // [lat, lng]
  contributingFactors: RiskFactor[];
  lastUpdated: string;
  sensorEvidenceIds: string[];
  affectedPopulationEstimate: number;
  predictedPeakTime?: string;
}

export interface RiskAssessment {
  mode: SystemMode;
  timestamp: string;
  hazard: HazardType;
  riskScore: number;
  severity: Severity;
  confidence: number;
  currentAreas: RiskArea[];
  predictedAreas: RiskArea[];
  contributingFactors: RiskFactor[];
  explanationAvailable: boolean;
  explanationText?: string;
  modelVersion: string;
  inferenceTimestamp: string;
}
