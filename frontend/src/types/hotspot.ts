import { HazardType, GeoPolygon, Severity } from './risk';

export interface HotspotThresholds {
  rainfallWarningMm: number;
  waterLevelWarningCm: number;
  temperatureWarningC: number;
  soilMoistureWarningPct: number;
}

export interface HazardHotspot {
  id: string;
  name: string;
  hazardType: HazardType;
  geometry: GeoPolygon;
  baselineRisk: number; // 0-100
  factors: string[];
  thresholds: HotspotThresholds;
  sensorIds: string[];
  active: boolean;
  notes?: string;
  elevation?: number;
  slope?: number;
  centroid?: [number, number];
  createdAt: string;
  updatedAt: string;
}

