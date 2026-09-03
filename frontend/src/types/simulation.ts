import { HazardType, Severity } from './risk';

export type SimulationSpeed = '1x' | '2x' | '5x' | '10x';

export interface SimulationConfig {
  id: string;
  name: string;
  hazardType: HazardType;
  targetSeverity: Severity;
  durationMinutes: number;
  epicenter: [number, number]; // [lat, lng]
  affectedZoneIds: string[];
  description: string;
}

export interface SimulationState {
  active: boolean;
  paused: boolean;
  currentStep: number;       // 0 to 100 timeline slider
  totalSteps: number;        // e.g. 100
  config: SimulationConfig | null;
  speed: SimulationSpeed;
  elapsedMinutes: number;
  logs: string[];
}
