import { SimulationConfig } from '../types';

export interface SimulationApi {
  triggerSimulation(config: Partial<SimulationConfig>): Promise<any>;
  resetSimulation(): Promise<any>;
}

class BackendSimulationApi implements SimulationApi {
  async triggerSimulation(config: any): Promise<any> {
    const res = await fetch('http://localhost:8000/api/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || { hazard: 'FLOOD', intensity: 1.5 })
    });
    return res.json();
  }

  async resetSimulation(): Promise<any> {
    const res = await fetch('http://localhost:8000/api/reset-simulation', {
      method: 'POST'
    });
    return res.json();
  }
}

export const simulationApi: SimulationApi = new BackendSimulationApi();
