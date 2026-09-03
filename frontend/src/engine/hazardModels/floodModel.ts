import { SensorTelemetry, RiskFactor } from '../../types';

export function calculateFloodScore(
  telemetry: SensorTelemetry,
  baselineRisk: number = 30
): { score: number; confidence: number; factors: RiskFactor[] } {
  // Flood factors: rainfall (0-100 mm/h), water level (0-150 cm), pressure drop
  const rainfallRatio = Math.min(1.0, telemetry.rainfall / 80); // 80 mm/h = 100%
  const waterLevelRatio = Math.min(1.0, telemetry.waterLevel / 120); // 120 cm = 100%
  const soilMoistureRatio = Math.min(1.0, telemetry.soilMoisture / 95);

  const rainfallContrib = Math.round(rainfallRatio * 40);
  const waterLevelContrib = Math.round(waterLevelRatio * 45);
  const soilContrib = Math.round(soilMoistureRatio * 15);

  const totalScore = Math.min(100, Math.max(0, Math.round(
    (baselineRisk * 0.2) + rainfallContrib + waterLevelContrib + soilContrib
  )));

  // Confidence calculation based on data quality & signal strength
  const confidence = Math.min(0.98, Math.max(0.40, (telemetry.dataQuality / 100) * (telemetry.signalStrength / 100)));

  const factors: RiskFactor[] = [
    {
      name: 'Rainfall Accumulation Rate',
      weight: 0.40,
      currentValue: `${telemetry.rainfall.toFixed(1)} mm/h`,
      contribution: rainfallContrib,
      unit: 'mm/h',
      source: 'Pluviometer Sensor'
    },
    {
      name: 'Water Level Inundation Depth',
      weight: 0.45,
      currentValue: `${telemetry.waterLevel.toFixed(1)} cm`,
      contribution: waterLevelContrib,
      unit: 'cm',
      source: 'Ultrasonic Stage Gauge'
    },
    {
      name: 'Soil Saturation Rate',
      weight: 0.15,
      currentValue: `${telemetry.soilMoisture.toFixed(1)} %`,
      contribution: soilContrib,
      unit: '%',
      source: 'Subsurface Probe'
    }
  ];

  return { score: totalScore, confidence, factors };
}
