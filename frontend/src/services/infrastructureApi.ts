import { Infrastructure } from '../types';
import { INITIAL_INFRASTRUCTURE } from '../mock/infrastructure';

export interface InfrastructureApi {
  getInfrastructure(): Promise<Infrastructure[]>;
}

class BackendInfrastructureApi implements InfrastructureApi {
  private baseUrl = 'http://localhost:8000/api';
  private fallbackData: Infrastructure[] = [...INITIAL_INFRASTRUCTURE];

  async getInfrastructure(): Promise<Infrastructure[]> {
    try {
      const res = await fetch(`${this.baseUrl}/infrastructure`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((inf: any) => {
            let infraType = inf.type;
            if (infraType === 'POWER') infraType = 'POWER_SUBSTATION';
            else if (infraType === 'MEDICAL') infraType = 'HOSPITAL';
            else if (infraType === 'PUMPING') infraType = 'PUMPING_STATION';
            else if (infraType === 'COMMUNICATION') infraType = 'COMMUNICATION_TOWER';
            else if (!['HOSPITAL', 'FIRE_STATION', 'AMBULANCE_STATION', 'SCHOOL', 'POWER_SUBSTATION', 'PUMPING_STATION', 'COMMUNICATION_TOWER'].includes(infraType)) {
              infraType = 'POWER_SUBSTATION';
            }

            return {
              id: inf.id,
              name: inf.name,
              type: infraType as any,
              coordinates: [inf.latitude ?? inf.coordinates?.[0] ?? 13.386, inf.longitude ?? inf.coordinates?.[1] ?? 79.798] as [number, number],
              status: (inf.status || 'OPERATIONAL') as any,
              capacityDetails: inf.capacityDetails || 'Operational Node',
              backupPower: inf.backupPower ?? true,
              currentExposureSeverity: (inf.criticalLevel || inf.currentExposureSeverity || 'MODERATE') as any,
              assignedZoneId: inf.assignedZoneId || 'zone-flood-a',
              contactNumber: inf.contactNumber || '+91-877-2244-1100',
              notes: inf.notes || `Protected infrastructure node in Sadasiva Sankarapuram.`
            };
          });
        }
      }
    } catch (e) {
      console.warn('Backend infrastructure unavailable, using local registry', e);
    }
    return [...this.fallbackData];
  }
}

export const infrastructureApi: InfrastructureApi = new BackendInfrastructureApi();
