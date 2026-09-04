import { HazardHotspot } from '../types';

export interface HotspotApi {
  getHotspots(): Promise<HazardHotspot[]>;
  createHotspot(hotspot: Omit<HazardHotspot, 'id' | 'createdAt' | 'updatedAt'>): Promise<HazardHotspot>;
  updateHotspot(id: string, hotspot: Partial<HazardHotspot>): Promise<HazardHotspot>;
  deleteHotspot(id: string): Promise<void>;
  toggleHotspot(id: string): Promise<HazardHotspot>;
  toggleHotspotActive(id: string): Promise<HazardHotspot>;
}

class BackendHotspotApi implements HotspotApi {
  private baseUrl = 'http://localhost:8000/api/v1/hotspots';

  async getHotspots(): Promise<HazardHotspot[]> {
    try {
      const res = await fetch(this.baseUrl);
      if (res.ok) {
        const data = await res.json();
        return (data || []).map((h: any) => ({
          id: h.id,
          name: h.name,
          hazardType: h.hazard || 'FLOOD',
          geometry: {
            type: 'Polygon',
            coordinates: [[[h.latitude, h.longitude], [h.latitude + 0.005, h.longitude + 0.005], [h.latitude + 0.005, h.longitude], [h.latitude, h.longitude]]]
          },
          baselineRisk: h.baselineRiskScore || 70,
          factors: [h.notes || 'Admin monitored node'],
          thresholds: {
            rainfallWarningMm: 50,
            waterLevelWarningCm: 80,
            temperatureWarningC: 40,
            soilMoistureWarningPct: 75
          },
          sensorIds: [],
          active: h.active ?? true,
          notes: h.notes || '',
          createdAt: h.created_at || new Date().toISOString(),
          updatedAt: h.created_at || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.warn('Backend hotspots unavailable, falling back', e);
    }
    return [];
  }

  async createHotspot(hotspot: Omit<HazardHotspot, 'id' | 'createdAt' | 'updatedAt'>): Promise<HazardHotspot> {
    const lat = hotspot.geometry?.coordinates?.[0]?.[0]?.[0] || 13.04;
    const lng = hotspot.geometry?.coordinates?.[0]?.[0]?.[1] || 80.23;
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: hotspot.name,
        latitude: lat,
        longitude: lng,
        hazard: hotspot.hazardType,
        severity: 'HIGH'
      })
    });
    const h = await res.json();
    return {
      id: h.id,
      name: h.name,
      hazardType: h.hazard || hotspot.hazardType,
      geometry: hotspot.geometry,
      baselineRisk: h.baselineRiskScore || hotspot.baselineRisk,
      factors: hotspot.factors,
      thresholds: hotspot.thresholds,
      sensorIds: hotspot.sensorIds,
      active: h.active,
      notes: h.notes,
      createdAt: h.created_at,
      updatedAt: h.created_at
    };
  }

  async updateHotspot(id: string, hotspot: Partial<HazardHotspot>): Promise<HazardHotspot> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hotspot)
    });
    return res.json();
  }

  async deleteHotspot(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/${id}`, { method: 'DELETE' });
  }

  async toggleHotspot(id: string): Promise<HazardHotspot> {
    return this.toggleHotspotActive(id);
  }

  async toggleHotspotActive(id: string): Promise<HazardHotspot> {
    const hotspots = await this.getHotspots();
    const found = hotspots.find(h => h.id === id);
    if (!found) throw new Error('Hotspot not found');
    return this.updateHotspot(id, { active: !found.active });
  }
}

export const hotspotApi: HotspotApi = new BackendHotspotApi();
