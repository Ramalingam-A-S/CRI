export type SensorStatus = 'ONLINE' | 'DEGRADED' | 'OFFLINE' | 'MAINTENANCE';

export interface SensorTelemetry {
  timestamp: string;
  temperature: number;      // °C
  humidity: number;         // %
  rainfall: number;         // mm/h
  pressure: number;         // hPa
  windSpeed: number;        // km/h
  waterLevel: number;       // cm
  soilMoisture: number;     // %
  battery: number;          // %
  signalStrength: number;   // %
  dataQuality: number;      // %
}

export interface Sensor {
  id: string;
  name: string;
  code: string;
  locationName: string;
  coordinates: [number, number]; // [lat, lng]
  status: SensorStatus;
  primaryHazard: 'FLOOD' | 'HEAT' | 'LANDSLIDE' | 'STORM';
  telemetry: SensorTelemetry;
  history: SensorTelemetry[];
  lastUpdate: string;
  anomalyDetected: boolean;
  anomalyType?: string;
  anomalyDescription?: string;
  assignedHotspotIds: string[];
}
