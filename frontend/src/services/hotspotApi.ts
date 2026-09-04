import { HazardHotspot } from '../types';

export interface HotspotApi {
  getHotspots(): Promise<HazardHotspot[]>;
  createHotspot(hotspot: Partial<HazardHotspot>): Promise<HazardHotspot>;
  updateHotspot(id: string, hotspot: Partial<HazardHotspot>): Promise<HazardHotspot>;
  deleteHotspot(id: string): Promise<void>;
  toggleHotspot(id: string): Promise<HazardHotspot>;
  toggleHotspotActive(id: string): Promise<HazardHotspot>;
}

class BackendHotspotApi implements HotspotApi {
  private baseUrl = 'http://localhost:8000/api/hotspots';

  async getHotspots(): Promise<HazardHotspot[]> {
    try {
      const res = await fetch(this.baseUrl);
      if (res.ok) {
        const data = await res.json();
        return (data || []).map((h: any) => ({
          id: h.id,
          name: h.name,
          hazardType: (h.hazardTag || h.hazard || 'FLOOD').toUpperCase(),
          geometry: h.geometry || {
            type: 'Polygon',
            coordinates: [[[13.386, 79.798], [13.390, 79.802], [13.385, 79.805], [13.386, 79.798]]]
          },
          centroid: h.centroid || [13.386, 79.798],
          elevation: h.elevation ?? 70,
          slope: h.slope ?? 2,
          baselineRisk: h.baselineRiskScore || 75,
          factors: [h.notes || 'User defined hotspot'],
          thresholds: {
            rainfallWarningMm: 50,
            waterLevelWarningCm: 80,
            temperatureWarningC: 40,
            soilMoistureWarningPct: 75
          },
          sensorIds: [],
          active: h.active ?? true,
          notes: h.notes || '',
          createdAt: h.createdAt || new Date().toISOString(),
          updatedAt: h.createdAt || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.warn('Backend hotspots unavailable, falling back', e);
    }
    return [];
  }

  async createHotspot(hotspot: Partial<HazardHotspot>): Promise<HazardHotspot> {
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: hotspot.name || 'Custom Hotspot',
        hazardTag: (hotspot.hazardType || 'FLOOD').toLowerCase(),
        geometry: hotspot.geometry,
        notes: hotspot.notes || ''
      })
    });
    const h = await res.json();
    return {
      id: h.id,
      name: h.name,
      hazardType: (h.hazardTag || h.hazard || 'FLOOD').toUpperCase(),
      geometry: h.geometry || hotspot.geometry,
      centroid: h.centroid || [13.386, 79.798],
      elevation: h.elevation ?? 70,
      slope: h.slope ?? 2,
      baselineRisk: h.baselineRiskScore || 75,
      factors: [h.notes || 'User defined hotspot'],
      thresholds: {
        rainfallWarningMm: 50,
        waterLevelWarningCm: 80,
        temperatureWarningC: 40,
        soilMoistureWarningPct: 75
      },
      sensorIds: [],
      active: true,
      notes: h.notes || '',
      createdAt: h.createdAt || new Date().toISOString(),
      updatedAt: h.createdAt || new Date().toISOString()
    };
  }

  async updateHotspot(id: string, hotspot: Partial<HazardHotspot>): Promise<HazardHotspot> {
    const res = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: hotspot.name,
        hazardTag: hotspot.hazardType?.toLowerCase(),
        geometry: hotspot.geometry,
        notes: hotspot.notes
      })
    });
    const h = await res.json();
    return {
      id: h.id,
      name: h.name,
      hazardType: (h.hazardTag || h.hazard || 'FLOOD').toUpperCase(),
      geometry: h.geometry || hotspot.geometry,
      centroid: h.centroid || [13.386, 79.798],
      elevation: h.elevation ?? 70,
      slope: h.slope ?? 2,
      baselineRisk: h.baselineRiskScore || 75,
      factors: [h.notes || 'User defined hotspot'],
      thresholds: {
        rainfallWarningMm: 50,
        waterLevelWarningCm: 80,
        temperatureWarningC: 40,
        soilMoistureWarningPct: 75
      },
      sensorIds: [],
      active: h.active ?? true,
      notes: h.notes || '',
      createdAt: h.createdAt || new Date().toISOString(),
      updatedAt: h.createdAt || new Date().toISOString()
    };
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
