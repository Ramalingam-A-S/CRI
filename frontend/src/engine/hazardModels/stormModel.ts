import { SensorTelemetry, RiskFactor } from '../../types';

export function calculateStormScore(
  telemetry: SensorTelemetry,
  baselineRisk: number = 20
): { score: number; confidence: number; factors: RiskFactor[] } {
  // Storm factors: wind speed (0-100 km/h), barometric pressure drop (< 1005 hPa)
  const windRatio = Math.min(1.0, telemetry.windSpeed / 90);
  const pressureRatio = Math.min(1.0, Math.max(0, (1015 - telemetry.pressure) / 25)); // 990 hPa max

  const windContrib = Math.round(windRatio * 50);
  const pressureContrib = Math.round(pressureRatio * 35);
  const rainContrib = Math.round(Math.min(1.0, telemetry.rainfall / 80) * 15);

  const totalScore = Math.min(100, Math.max(0, windContrib + pressureContrib + rainContrib));
  const confidence = Math.min(0.98, Math.max(0.40, (telemetry.dataQuality / 100)));

  const factors: RiskFactor[] = [
    {
      name: 'Peak Gust Velocity',
      weight: 0.50,
      currentValue: `${telemetry.windSpeed.toFixed(1)} km/h`,
      contribution: windContrib,
      unit: 'km/h',
      source: 'Ultrasonic Anemometer'
    },
    {
      name: 'Barometric Pressure Drop Rate',
      weight: 0.35,
      currentValue: `${telemetry.pressure.toFixed(1)} hPa`,
      contribution: pressureContrib,
      unit: 'hPa',
      source: 'Barometer Node'
    },
    {
      name: 'Associated Rain Squall Band',
      weight: 0.15,
      currentValue: `${telemetry.rainfall.toFixed(1)} mm/h`,
      contribution: rainContrib,
      unit: 'mm/h',
      source: 'Pluviometer'
    }
  ];

  return { score: totalScore, confidence, factors };
}
