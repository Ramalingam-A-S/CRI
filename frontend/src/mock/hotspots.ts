import { HazardHotspot } from '../types';

export const INITIAL_HOTSPOTS: HazardHotspot[] = [
  {
    id: 'hotspot-flood-01',
    name: 'Central Metro Underpass Basin',
    hazardType: 'FLOOD',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [12.9780, 77.5920],
        [12.9820, 77.5990],
        [12.9750, 77.6040],
        [12.9700, 77.5960],
        [12.9780, 77.5920]
      ]]
    },
    baselineRisk: 65,
    factors: ['Low elevation basin', 'Substandard storm drain diameter', 'Frequent flash flooding'],
    thresholds: {
      rainfallWarningMm: 30,
      waterLevelWarningCm: 50,
      temperatureWarningC: 38,
      soilMoistureWarningPct: 80
    },
    sensorIds: ['sens-001', 'sens-002', 'sens-010'],
    active: true,
    notes: 'Primary urban choke point during heavy monsoon downpours.',
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'hotspot-flood-02',
    name: 'East Drain Canal Junction',
    hazardType: 'FLOOD',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [12.9750, 77.6040],
        [12.9780, 77.6140],
        [12.9650, 77.6180],
        [12.9640, 77.6080],
        [12.9750, 77.6040]
      ]]
    },
    baselineRisk: 50,
    factors: ['Downstream bottleneck', 'Silt accumulation', 'High runoff ratio'],
    thresholds: {
      rainfallWarningMm: 35,
      waterLevelWarningCm: 60,
      temperatureWarningC: 38,
      soilMoistureWarningPct: 80
    },
    sensorIds: ['sens-002', 'sens-003', 'sens-013'],
    active: true,
    notes: 'Prone to overflow when upstream pumping stations fail.',
    createdAt: '2026-02-10T10:30:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'hotspot-heat-01',
    name: 'Industrial Corridor Asphalt Zone',
    hazardType: 'HEAT',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [12.9680, 77.6150],
        [12.9720, 77.6280],
        [12.9580, 77.6320],
        [12.9540, 77.6180],
        [12.9680, 77.6150]
      ]]
    },
    baselineRisk: 70,
    factors: ['Extreme impervious surface area', 'Absence of tree canopy', 'Industrial thermal emissions'],
    thresholds: {
      rainfallWarningMm: 10,
      waterLevelWarningCm: 10,
      temperatureWarningC: 40,
      soilMoistureWarningPct: 20
    },
    sensorIds: ['sens-004', 'sens-005', 'sens-011'],
    active: true,
    notes: 'Severe urban heat island effect during mid-day peak.',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'hotspot-landslide-01',
    name: 'North Ridge Slope Cut',
    hazardType: 'LANDSLIDE',
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [12.9880, 77.5720],
        [12.9960, 77.5820],
        [12.9980, 77.5920],
        [12.9900, 77.5900],
        [12.9880, 77.5720]
      ]]
    },
    baselineRisk: 75,
    factors: ['Steep inclination (>35deg)', 'Unconsolidated clay topsoil', 'High rainwater infiltration'],
    thresholds: {
      rainfallWarningMm: 50,
      waterLevelWarningCm: 20,
      temperatureWarningC: 35,
      soilMoistureWarningPct: 85
    },
    sensorIds: ['sens-006', 'sens-007'],
    active: true,
    notes: 'High geotechnical risk during prolonged rainfall exceeding 60mm.',
    createdAt: '2026-03-15T09:15:00Z',
    updatedAt: new Date().toISOString()
  }
];
