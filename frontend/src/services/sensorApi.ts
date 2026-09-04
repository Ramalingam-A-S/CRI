import { Sensor } from '../types';

export interface SensorApi {
  getSensors(): Promise<Sensor[]>;
  getSensorById(id: string): Promise<Sensor | null>;
  createSensor(sensor: { name: string; lat: number; lng: number }): Promise<Sensor>;
  updateSensorPosition(id: string, lat: number, lng: number): Promise<Sensor>;
  deleteSensor(id: string): Promise<void>;
  updateSensorStatus(id: string, status: Sensor['status']): Promise<Sensor>;
  ingestReading(sensorId: string, readings: Record<string, number>): Promise<any>;
}

class BackendSensorApi implements SensorApi {
  private baseUrl = 'http://localhost:8000/api';

  async getSensors(): Promise<Sensor[]> {
    try {
      const res = await fetch(`${this.baseUrl}/sensors`);
      if (res.ok) {
        const data = await res.json();
        return (data || []).map((s: any) => {
          let primaryHazard: 'FLOOD' | 'HEAT' | 'LANDSLIDE' | 'STORM' = 'FLOOD';
          if (s.type === 'PRESSURE') primaryHazard = 'STORM';
          else if (s.type === 'SOIL_MOISTURE') primaryHazard = 'LANDSLIDE';
          else if (s.type === 'MULTI' && (s.readings?.temperature || 0) > 35) primaryHazard = 'HEAT';

          return {
            id: s.sensorId || s.id,
            name: s.name,
            code: s.sensorId || s.id,
            locationName: s.name,
            coordinates: [s.latitude ?? s.lat, s.longitude ?? s.lng] as [number, number],
            status: (s.status || 'ONLINE') as any,
            primaryHazard: primaryHazard,
            telemetry: {
              timestamp: s.timestamp || new Date().toISOString(),
              temperature: s.readings?.temperature ?? 28,
              humidity: s.readings?.humidity ?? 60,
              rainfall: s.readings?.rainfall ?? 0,
              pressure: s.readings?.pressure ?? 1012,
              windSpeed: s.readings?.windSpeed ?? 12,
              waterLevel: s.readings?.water_level_m ? s.readings.water_level_m * 100 : 20,
              soilMoisture: s.readings?.soil_moisture ? s.readings.soil_moisture * 100 : 30,
              battery: 98,
              signalStrength: 95,
              dataQuality: Math.round((s.qualityScore ?? 1.0) * 100)
            },
            history: [],
            lastUpdate: s.timestamp || new Date().toISOString(),
            anomalyDetected: s.anomaly !== 'NORMAL',
            anomalyType: s.anomaly,
            assignedHotspotIds: []
          };
        });
      }
    } catch (e) {
      console.warn('Backend sensors unavailable, falling back', e);
    }
    return [];
  }

  async getSensorById(id: string): Promise<Sensor | null> {
    const sensors = await this.getSensors();
    return sensors.find(s => s.id === id) || null;
  }

  async createSensor(sensor: { name: string; lat: number; lng: number }): Promise<Sensor> {
    const res = await fetch(`${this.baseUrl}/sensors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sensor)
    });
    const s = await res.json();
    return {
      id: s.sensorId || s.id,
      name: s.name,
      code: s.sensorId || s.id,
      locationName: s.name,
      coordinates: [s.latitude ?? s.lat, s.longitude ?? s.lng] as [number, number],
      status: (s.status || 'ONLINE') as any,
      primaryHazard: 'FLOOD',
      telemetry: {
        timestamp: s.timestamp || new Date().toISOString(),
        temperature: s.readings?.temperature ?? 28,
        humidity: s.readings?.humidity ?? 60,
        rainfall: s.readings?.rainfall ?? 0,
        pressure: s.readings?.pressure ?? 1012,
        windSpeed: s.readings?.windSpeed ?? 12,
        waterLevel: 20,
        soilMoisture: 30,
        battery: 98,
        signalStrength: 95,
        dataQuality: Math.round((s.qualityScore ?? 1.0) * 100)
      },
      history: [],
      lastUpdate: s.timestamp || new Date().toISOString(),
      anomalyDetected: false,
      assignedHotspotIds: []
    };
  }

  async updateSensorPosition(id: string, lat: number, lng: number): Promise<Sensor> {
    const res = await fetch(`${this.baseUrl}/sensors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lng })
    });
    const s = await res.json();
    return {
      id: s.sensorId || s.id,
      name: s.name,
      code: s.sensorId || s.id,
      locationName: s.name,
      coordinates: [s.latitude ?? s.lat, s.longitude ?? s.lng] as [number, number],
      status: (s.status || 'ONLINE') as any,
      primaryHazard: 'FLOOD',
      telemetry: {
        timestamp: s.timestamp || new Date().toISOString(),
        temperature: s.readings?.temperature ?? 28,
        humidity: s.readings?.humidity ?? 60,
        rainfall: s.readings?.rainfall ?? 0,
        pressure: s.readings?.pressure ?? 1012,
        windSpeed: s.readings?.windSpeed ?? 12,
        waterLevel: 20,
        soilMoisture: 30,
        battery: 98,
        signalStrength: 95,
        dataQuality: Math.round((s.qualityScore ?? 1.0) * 100)
      },
      history: [],
      lastUpdate: s.timestamp || new Date().toISOString(),
      anomalyDetected: false,
      assignedHotspotIds: []
    };
  }

  async deleteSensor(id: string): Promise<void> {
    await fetch(`${this.baseUrl}/sensors/${id}`, { method: 'DELETE' });
  }

  async updateSensorStatus(id: string, status: Sensor['status']): Promise<Sensor> {
    const sensor = await this.getSensorById(id);
    if (!sensor) throw new Error(`Sensor ${id} not found`);
    return { ...sensor, status };
  }

  async ingestReading(sensorId: string, readings: Record<string, number>): Promise<any> {
    const res = await fetch(`${this.baseUrl}/sensors/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sensor_id: sensorId, readings })
    });
    return res.json();
  }
}

export const sensorApi: SensorApi = new BackendSensorApi();
