import { RiskAssessment, SystemMode, Sensor, HazardHotspot, RiskArea } from '../types';

export interface RiskApi {
  getAssessment(mode: SystemMode, sensors: Sensor[], hotspots: HazardHotspot[], currentAreas: RiskArea[]): Promise<RiskAssessment>;
  getRiskMap(): Promise<{ currentAreas: RiskArea[]; predictedAreas: RiskArea[] }>;
}

class BackendRiskApi implements RiskApi {
  private baseUrl = 'http://localhost:8000/api/v1';

  async getAssessment(mode: SystemMode): Promise<RiskAssessment> {
    try {
      const res = await fetch(`${this.baseUrl}/risk/assessment?mode=${mode}`);
      if (res.ok) {
        const data = await res.json();
        return {
          mode: data.mode,
          timestamp: data.timestamp,
          hazard: data.hazard,
          severity: data.severity,
          riskScore: data.riskScore,
          confidence: data.confidence,
          currentAreas: (data.currentAreas || []).map(this.mapArea),
          predictedAreas: (data.predictedAreas || []).map(this.mapArea),
          contributingFactors: data.contributingFactors || [],
          explanationAvailable: data.explanationAvailable || false,
          modelVersion: data.modelVersion || 'v1.0-synthetic',
          inferenceTimestamp: data.inferenceTimestamp || new Date().toISOString()
        };
      }
    } catch (e) {
      console.warn('Backend risk assessment unavailable, falling back', e);
    }
    return {
      mode: 'CLOUD',
      timestamp: new Date().toISOString(),
      hazard: 'FLOOD',
      severity: 'CRITICAL',
      riskScore: 100,
      confidence: 0.4,
      currentAreas: [],
      predictedAreas: [],
      contributingFactors: [],
      explanationAvailable: true,
      modelVersion: 'v1.0',
      inferenceTimestamp: new Date().toISOString()
    };
  }

  async getRiskMap(): Promise<{ currentAreas: RiskArea[]; predictedAreas: RiskArea[] }> {
    try {
      const res = await fetch(`${this.baseUrl}/risk/map`);
      if (res.ok) {
        const data = await res.json();
        return {
          currentAreas: (data.currentAreas || []).map(this.mapArea),
          predictedAreas: (data.predictedAreas || []).map(this.mapArea)
        };
      }
    } catch (e) {
      console.warn('Error fetching risk map', e);
    }
    return { currentAreas: [], predictedAreas: [] };
  }

  private mapArea(a: any): RiskArea {
    let coords = a.geometry?.coordinates?.[0] || a.coordinates || a.coords;
    if (!coords || !Array.isArray(coords)) {
      coords = [[12.978, 80.221], [12.985, 80.226], [12.975, 80.235], [12.969, 80.228], [12.978, 80.221]];
    }
    return {
      id: a.id,
      name: a.name,
      hazardType: a.hazard || a.hazardType || 'FLOOD',
      severity: a.severity || 'CRITICAL',
      riskScore: a.riskScore || 90,
      confidence: a.confidence || 0.8,
      isPredicted: a.isPredicted || false,
      affectedPopulationEstimate: a.affectedPopulationEstimate || a.base_pop || 15000,
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      },
      center: a.center || [coords[0][0], coords[0][1]],
      contributingFactors: a.contributingFactors || [],
      lastUpdated: a.lastUpdated || new Date().toISOString(),
      sensorEvidenceIds: a.sensorEvidenceIds || []
    };
  }
}

export const riskApi: RiskApi = new BackendRiskApi();
