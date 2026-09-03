import { HazardHotspot } from '../types';
import { INITIAL_HOTSPOTS } from '../mock/hotspots';

export interface HotspotApi {
  getHotspots(): Promise<HazardHotspot[]>;
  createHotspot(hotspot: Omit<HazardHotspot, 'id' | 'createdAt' | 'updatedAt'>): Promise<HazardHotspot>;
  updateHotspot(id: string, updates: Partial<HazardHotspot>): Promise<HazardHotspot>;
  deleteHotspot(id: string): Promise<boolean>;
  toggleHotspotActive(id: string): Promise<HazardHotspot>;
}

class MockHotspotApi implements HotspotApi {
  private hotspots: HazardHotspot[] = [...INITIAL_HOTSPOTS];

  async getHotspots(): Promise<HazardHotspot[]> {
    return Promise.resolve([...this.hotspots]);
  }

  async createHotspot(data: Omit<HazardHotspot, 'id' | 'createdAt' | 'updatedAt'>): Promise<HazardHotspot> {
    const newHotspot: HazardHotspot = {
      ...data,
      id: `hotspot-custom-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.hotspots.push(newHotspot);
    return Promise.resolve({ ...newHotspot });
  }

  async updateHotspot(id: string, updates: Partial<HazardHotspot>): Promise<HazardHotspot> {
    const idx = this.hotspots.findIndex(h => h.id === id);
    if (idx === -1) throw new Error(`Hotspot ${id} not found`);
    this.hotspots[idx] = {
      ...this.hotspots[idx],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    return Promise.resolve({ ...this.hotspots[idx] });
  }

  async deleteHotspot(id: string): Promise<boolean> {
    this.hotspots = this.hotspots.filter(h => h.id !== id);
    return Promise.resolve(true);
  }

  async toggleHotspotActive(id: string): Promise<HazardHotspot> {
    const idx = this.hotspots.findIndex(h => h.id === id);
    if (idx === -1) throw new Error(`Hotspot ${id} not found`);
    this.hotspots[idx].active = !this.hotspots[idx].active;
    this.hotspots[idx].updatedAt = new Date().toISOString();
    return Promise.resolve({ ...this.hotspots[idx] });
  }
}

export const hotspotApi: HotspotApi = new MockHotspotApi();
