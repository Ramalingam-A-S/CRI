import { Shelter } from '../types';
import { INITIAL_SHELTERS } from '../mock/shelters';

export interface ShelterApi {
  getShelters(): Promise<Shelter[]>;
}

class BackendShelterApi implements ShelterApi {
  private baseUrl = 'http://localhost:8000/api';
  private fallbackData: Shelter[] = [...INITIAL_SHELTERS];

  async getShelters(): Promise<Shelter[]> {
    try {
      const res = await fetch(`${this.baseUrl}/shelters`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          return data.map((s: any) => {
            const cap = s.capacity || 500;
            const occ = s.currentOccupancy ?? s.occupancy ?? 0;
            let avail = s.availability;
            if (!avail) {
              avail = occ >= cap ? 'FULL' : (occ / cap > 0.8 ? 'NEAR_CAPACITY' : 'AVAILABLE');
            }
            return {
              id: s.id,
              name: s.name,
              locationName: s.locationName || s.name,
              coordinates: [s.latitude ?? s.coordinates?.[0] ?? 13.386, s.longitude ?? s.coordinates?.[1] ?? 79.798] as [number, number],
              capacity: cap,
              occupancy: occ,
              availability: avail,
              services: s.services || ['Emergency Medical', 'Hot Meals', 'Power Generator', 'Clean Sanitation'],
              currentRisk: s.currentRisk || 'LOW',
              status: s.status || 'OPEN',
              contactPerson: s.contactPerson || 'Disaster Relief Coordinator',
              contactPhone: s.contactNumber || s.contactPhone || '+91-877-2244-9900',
              assignedZoneId: s.assignedZoneId || 'zone-flood-a'
            };
          });
        }
      }
    } catch (e) {
      console.warn('Backend shelters unavailable, using local registry', e);
    }
    return [...this.fallbackData];
  }
}

export const shelterApi: ShelterApi = new BackendShelterApi();
