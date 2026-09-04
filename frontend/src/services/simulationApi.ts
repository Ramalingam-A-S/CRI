import { SimulationConfig } from '../types';

export interface DirectedSimulationPayload {
  eventType: string;
  sensorId?: string;
  dataPoints: {
    rainfallMmHr?: number;
    windSpeedKmh?: number;
    windDirectionDeg?: number;
    temperatureC?: number;
    humidityPct?: number;
  };
  mode?: string;
}

export interface SimulationApi {
  triggerSimulation(config: Partial<SimulationConfig>): Promise<any>;
  resetSimulation(): Promise<any>;
  runDirectedSimulation(payload: DirectedSimulationPayload): Promise<any>;
  getLiveWeather(lat?: number, lon?: number): Promise<any>;
}

class BackendSimulationApi implements SimulationApi {
  private baseUrl = 'http://localhost:8000/api';

  async triggerSimulation(config: any): Promise<any> {
    const res = await fetch(`${this.baseUrl}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config || { hazard: 'FLOOD', intensity: 1.5 })
    });
    return res.json();
  }

  async resetSimulation(): Promise<any> {
    const res = await fetch(`${this.baseUrl}/reset-simulation`, {
      method: 'POST'
    });
    return res.json();
  }

  async runDirectedSimulation(payload: DirectedSimulationPayload): Promise<any> {
    const res = await fetch(`${this.baseUrl}/simulate/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }

  async getLiveWeather(lat: number = 13.386, lon: number = 79.798): Promise<any> {
    const res = await fetch(`${this.baseUrl}/weather/live?lat=${lat}&lon=${lon}`);
    return res.json();
  }
}

export const simulationApi: SimulationApi = new BackendSimulationApi();
