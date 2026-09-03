export type SystemMode = 'CLOUD' | 'LOCAL_EDGE' | 'DEGRADED' | 'NO_DATA';

export interface SystemStatus {
  mode: SystemMode;
  cloudConnected: boolean;
  edgeActive: boolean;
  sensorsOnline: number;
  sensorsTotal: number;
  activeAlertsCount: number;
  overallRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  lastUpdated: string;
  explanationAvailable: boolean;
  activeSimulationId?: string | null;
}
