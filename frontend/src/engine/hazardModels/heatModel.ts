import { SensorTelemetry, RiskFactor } from '../../types';

export function calculateHeatScore(
  telemetry: SensorTelemetry,
  baselineRisk: number = 25
): { score: number; confidence: number; factors: RiskFactor[] } {
  // Heat factors: temperature (25-45°C), humidity (heat index formula simulation)
  const tempRatio = Math.min(1.0, Math.max(0, (telemetry.temperature - 30) / 15)); // 45°C max
  const tempContrib = Math.round(tempRatio * 60);

  const humidityFactor = telemetry.humidity < 40 ? 25 : 15; // Low humidity accentuates dry thermal stress
  const windFactor = telemetry.windSpeed < 5 ? 15 : 5;     // Stagnant air

  const totalScore = Math.min(100, Math.max(0, Math.round(
    (baselineRisk * 0.2) + tempContrib + humidityFactor + windFactor
  )));

  const confidence = Math.min(0.98, Math.max(0.40, (telemetry.dataQuality / 100)));

  const factors: RiskFactor[] = [
    {
      name: 'Ambient Temperature',
      weight: 0.60,
      currentValue: `${telemetry.temperature.toFixed(1)} °C`,
      contribution: tempContrib,
      unit: '°C',
      source: 'Thermal Sensor'
    },
    {
      name: 'Relative Air Dryness Index',
      weight: 0.25,
      currentValue: `${telemetry.humidity.toFixed(1)} %`,
      contribution: humidityFactor,
      unit: '%',
      source: 'Hygrometer Probe'
    },
    {
      name: 'Air Stagnation Vector',
      weight: 0.15,
      currentValue: `${telemetry.windSpeed.toFixed(1)} km/h`,
      contribution: windFactor,
      unit: 'km/h',
      source: 'Anemometer'
    }
  ];

  return { score: totalScore, confidence, factors };
}
