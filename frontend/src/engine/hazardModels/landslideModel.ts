import { SensorTelemetry, RiskFactor } from '../../types';

export function calculateLandslideScore(
  telemetry: SensorTelemetry,
  baselineRisk: number = 40
): { score: number; confidence: number; factors: RiskFactor[] } {
  // Landslide factors: soil moisture (0-100%), 24h rainfall load
  const soilMoistureRatio = Math.min(1.0, telemetry.soilMoisture / 95);
  const rainfallRatio = Math.min(1.0, telemetry.rainfall / 90);

  const soilContrib = Math.round(soilMoistureRatio * 50);
  const rainContrib = Math.round(rainfallRatio * 35);
  const baselineContrib = Math.round(baselineRisk * 0.15);

  const totalScore = Math.min(100, Math.max(0, soilContrib + rainContrib + baselineContrib));
  const confidence = Math.min(0.96, Math.max(0.40, (telemetry.dataQuality / 100) * (telemetry.battery / 100)));

  const factors: RiskFactor[] = [
    {
      name: 'Subsoil Volumetric Moisture Saturation',
      weight: 0.50,
      currentValue: `${telemetry.soilMoisture.toFixed(1)} %`,
      contribution: soilContrib,
      unit: '%',
      source: 'Multi-Depth Soil TDR Sensor'
    },
    {
      name: 'Accumulated Precipitation Load',
      weight: 0.35,
      currentValue: `${telemetry.rainfall.toFixed(1)} mm/h`,
      contribution: rainContrib,
      unit: 'mm/h',
      source: 'Pluviometer Network'
    },
    {
      name: 'Geotechnical Baseline Inclination',
      weight: 0.15,
      currentValue: `Baseline Risk ${baselineRisk}`,
      contribution: baselineContrib,
      unit: 'index',
      source: 'LiDAR Terrain Model'
    }
  ];

  return { score: totalScore, confidence, factors };
}
