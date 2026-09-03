import { Alert } from '../types';
import { INITIAL_ALERTS } from '../mock/alerts';

export interface AlertApi {
  getAlerts(): Promise<Alert[]>;
  acknowledgeAlert(id: string, byUser?: string): Promise<Alert>;
  dismissAlert(id: string): Promise<boolean>;
}

class MockAlertApi implements AlertApi {
  private alerts: Alert[] = [...INITIAL_ALERTS];

  async getAlerts(): Promise<Alert[]> {
    return Promise.resolve([...this.alerts]);
  }

  async acknowledgeAlert(id: string, byUser: string = 'Command Center Officer'): Promise<Alert> {
    const idx = this.alerts.findIndex(a => a.id === id);
    if (idx === -1) throw new Error(`Alert ${id} not found`);
    this.alerts[idx] = {
      ...this.alerts[idx],
      acknowledged: true,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: byUser
    };
    return Promise.resolve({ ...this.alerts[idx] });
  }

  async dismissAlert(id: string): Promise<boolean> {
    this.alerts = this.alerts.filter(a => a.id !== id);
    return Promise.resolve(true);
  }
}

export const alertApi: AlertApi = new MockAlertApi();
