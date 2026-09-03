# DATA MODEL CONTRACT SPECIFICATION

All REST and WebSocket interfaces consume these TypeScript JSON schemas:

```typescript
type SystemMode = 'CLOUD' | 'LOCAL_EDGE' | 'DEGRADED' | 'NO_DATA';
type HazardType = 'FLOOD' | 'HEAT' | 'LANDSLIDE' | 'STORM';
type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
type AlertLevel = 'INFO' | 'ADVISORY' | 'WARNING' | 'CRITICAL';

interface GeoPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

interface RiskFactor {
  name: string;
  weight: number;
  currentValue: number | string;
  contribution: number;
  unit?: string;
  source: string;
}

interface RiskArea {
  id: string;
  name: string;
  hazardType: HazardType;
  riskScore: number;       // 0 to 100
  severity: Severity;
  confidence: number;      // 0.0 to 1.0 (Separate value, never combined)
  isPredicted: boolean;    // false = solid boundary, true = dashed boundary
  geometry: GeoPolygon;
  center: [number, number];
  contributingFactors: RiskFactor[];
  lastUpdated: string;
  sensorEvidenceIds: string[];
  affectedPopulationEstimate: number;
  predictedPeakTime?: string;
}

interface SensorTelemetry {
  timestamp: string;
  temperature: number;
  humidity: number;
  rainfall: number;
  pressure: number;
  windSpeed: number;
  waterLevel: number;
  soilMoisture: number;
  battery: number;
  signalStrength: number;
  dataQuality: number;
}
```
