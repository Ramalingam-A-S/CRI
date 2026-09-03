import { RiskAssessment, SystemMode, Sensor, HazardHotspot, RiskArea } from '../types';
import { INITIAL_RISK_AREAS } from '../mock/risks';
import { evaluateRiskSystem } from '../engine/riskEngine';

export interface RiskApi {
  getAssessment(mode: SystemMode, sensors: Sensor[], hotspots: HazardHotspot[], currentAreas: RiskArea[]): Promise<RiskAssessment>;
}

class MockRiskApi implements RiskApi {
  async getAssessment(mode: SystemMode, sensors: Sensor[], hotspots: HazardHotspot[], currentAreas: RiskArea[]): Promise<RiskAssessment> {
    const areasToEval = currentAreas.length > 0 ? currentAreas : INITIAL_RISK_AREAS;
    const assessment = evaluateRiskSystem({
      mode,
      sensors,
      hotspots,
      currentAreas: areasToEval
    });
    return Promise.resolve(assessment);
  }
}

export const riskApi: RiskApi = new MockRiskApi();
