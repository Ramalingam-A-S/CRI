import { Sensor, SensorTelemetry, HazardType, Severity } from '../types';

export interface SimulationStepData {
  step: number; // 0 to 100
  hazardType: HazardType;
  targetSeverity: Severity;
}

export function computeSimulatedTelemetry(
  sensor: Sensor,
  step: number,
  hazardType: HazardType,
  targetSeverity: Severity
): SensorTelemetry {
  const progress = step / 100; // 0.0 to 1.0
  const base = { ...sensor.telemetry };

  if (hazardType === 'FLOOD') {
    if (sensor.primaryHazard === 'FLOOD' || sensor.id === 'sens-001' || sensor.id === 'sens-002' || sensor.id === 'sens-010') {
      // T=0: normal rainfall (10mm/h), T=20: rainfall increasing (35mm/h), T=40: water level rising (65cm), T=60: Zone A CRITICAL (115cm), T=80: Zone B becomes CURRENT, T=100: peak event
      base.rainfall = Number((10 + progress * 85).toFixed(1));          // Up to 95 mm/h
      base.waterLevel = Number((15 + Math.pow(progress, 1.5) * 125).toFixed(1)); // Up to 140 cm
      base.soilMoisture = Number((55 + progress * 40).toFixed(1));      // Up to 95%
      base.humidity = Number((75 + progress * 20).toFixed(0));
    }
  } else if (hazardType === 'HEAT') {
    if (sensor.primaryHazard === 'HEAT' || sensor.id === 'sens-004' || sensor.id === 'sens-005' || sensor.id === 'sens-011') {
      base.temperature = Number((34 + progress * 11.5).toFixed(1));    // Up to 45.5 °C
      base.humidity = Number((50 - progress * 28).toFixed(0));          // Down to 22%
      base.soilMoisture = Number((25 - progress * 20).toFixed(1));      // Down to 5%
    }
  } else if (hazardType === 'LANDSLIDE') {
    if (sensor.primaryHazard === 'LANDSLIDE' || sensor.id === 'sens-006' || sensor.id === 'sens-007') {
      base.rainfall = Number((20 + progress * 75).toFixed(1));
      base.soilMoisture = Number((65 + Math.pow(progress, 0.8) * 32).toFixed(1)); // Up to 97%
    }
  } else if (hazardType === 'STORM') {
    base.windSpeed = Number((15 + progress * 75).toFixed(1));            // Up to 90 km/h
    base.pressure = Number((1014 - progress * 24).toFixed(1));           // Down to 990 hPa
    base.rainfall = Number((5 + progress * 65).toFixed(1));
  }

  return base;
}
