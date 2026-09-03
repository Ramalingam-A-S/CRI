import { SystemStatus, SystemMode } from '../types';

export interface SystemApi {
  getSystemStatus(): Promise<SystemStatus>;
  setSystemMode(mode: SystemMode): Promise<SystemStatus>;
}

class MockSystemApi implements SystemApi {
  private status: SystemStatus = {
    mode: 'CLOUD',
    cloudConnected: true,
    edgeActive: false,
    sensorsOnline: 14,
    sensorsTotal: 15,
    activeAlertsCount: 4,
    overallRiskLevel: 'HIGH',
    lastUpdated: new Date().toISOString(),
    explanationAvailable: true
  };

  async getSystemStatus(): Promise<SystemStatus> {
    return Promise.resolve({ ...this.status });
  }

  async setSystemMode(mode: SystemMode): Promise<SystemStatus> {
    this.status.mode = mode;
    this.status.cloudConnected = mode === 'CLOUD';
    this.status.edgeActive = mode === 'LOCAL_EDGE';
    this.status.explanationAvailable = mode === 'CLOUD' || mode === 'LOCAL_EDGE';
    this.status.lastUpdated = new Date().toISOString();
    return Promise.resolve({ ...this.status });
  }
}

export const systemApi: SystemApi = new MockSystemApi();
