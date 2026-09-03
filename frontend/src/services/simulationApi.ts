import { SimulationState, SimulationConfig } from '../types';

export interface SimulationApi {
  getSimulationState(): Promise<SimulationState>;
}

class MockSimulationApi implements SimulationApi {
  private state: SimulationState = {
    active: false,
    paused: false,
    currentStep: 0,
    totalSteps: 100,
    config: null,
    speed: '1x',
    elapsedMinutes: 0,
    logs: ['Simulation engine initialized and idle.']
  };

  async getSimulationState(): Promise<SimulationState> {
    return Promise.resolve({ ...this.state });
  }
}

export const simulationApi: SimulationApi = new MockSimulationApi();
