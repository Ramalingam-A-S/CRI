import { Sensor } from '../types';
import { INITIAL_SENSORS } from '../mock/sensors';

export interface SensorApi {
  getSensors(): Promise<Sensor[]>;
  getSensorById(id: string): Promise<Sensor | null>;
  updateSensorStatus(id: string, status: Sensor['status']): Promise<Sensor>;
}

class MockSensorApi implements SensorApi {
  private sensors: Sensor[] = [...INITIAL_SENSORS];

  async getSensors(): Promise<Sensor[]> {
    return Promise.resolve([...this.sensors]);
  }

  async getSensorById(id: string): Promise<Sensor | null> {
    const found = this.sensors.find(s => s.id === id);
    return Promise.resolve(found ? { ...found } : null);
  }

  async updateSensorStatus(id: string, status: Sensor['status']): Promise<Sensor> {
    const index = this.sensors.findIndex(s => s.id === id);
    if (index === -1) throw new Error(`Sensor ${id} not found`);
    this.sensors[index] = { ...this.sensors[index], status };
    return Promise.resolve({ ...this.sensors[index] });
  }
}

export const sensorApi: SensorApi = new MockSensorApi();
