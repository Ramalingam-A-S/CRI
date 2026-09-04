import { Alert, HazardType, Severity, AlertLevel } from '../types';

export interface AlertApi {
  getAlerts(): Promise<Alert[]>;
  acknowledgeAlert(id: string): Promise<Alert>;
  dismissAlert(id: string): Promise<void>;
}

class BackendAlertApi implements AlertApi {
  private baseUrl = 'http://localhost:8000/api/v1';

  async getAlerts(): Promise<Alert[]> {
    try {
      const res = await fetch(`${this.baseUrl}/alerts`);
      if (res.ok) {
        const data = await res.json();
        return (data || []).map((a: any) => ({
          id: a.id,
          hazard: (a.hazard || 'FLOOD') as HazardType,
          level: (a.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING') as AlertLevel,
          severity: (a.severity || 'CRITICAL') as Severity,
          title: `[${a.severity}] ${a.hazard}`,
          message: a.reason || `${a.hazard} emergency alert in Sadasiva Sankarapuram sector.`,
          locationName: a.location?.name || 'Sadasiva Sankarapuram Sector',
          coordinates: [a.location?.latitude || 13.3860, a.location?.longitude || 79.7980] as [number, number],
          timestamp: a.timestamp || new Date().toISOString(),
          source: 'Spatial Risk Engine v1.0',
          confidence: a.confidence || 0.85,
          acknowledged: a.status === 'ACKNOWLEDGED' || false
        }));
      }
    } catch (e) {
      console.warn('Backend alerts unavailable, falling back', e);
    }
    return [];
  }

  async acknowledgeAlert(id: string): Promise<Alert> {
    try {
      const res = await fetch(`${this.baseUrl}/alerts/acknowledge/${id}`, { method: 'POST' });
      if (res.ok) {
        const a = await res.json();
        return {
          id: a.id,
          hazard: a.hazard as HazardType,
          level: (a.severity === 'CRITICAL' ? 'CRITICAL' : 'WARNING') as AlertLevel,
          severity: a.severity as Severity,
          title: `[${a.severity}] ${a.hazard}`,
          message: a.reason,
          locationName: a.location?.name || 'Sadasiva Sankarapuram Sector',
          coordinates: [a.location?.latitude || 13.3860, a.location?.longitude || 79.7980],
          timestamp: a.timestamp,
          source: 'Spatial Risk Engine v1.0',
          confidence: a.confidence || 0.85,
          acknowledged: true
        };
      }
    } catch (e) {
      console.error(e);
    }
    return {} as Alert;
  }

  async dismissAlert(id: string): Promise<void> {
    // Local dismiss
  }
}

export const alertApi: AlertApi = new BackendAlertApi();
