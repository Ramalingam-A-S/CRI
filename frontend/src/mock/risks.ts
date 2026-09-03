import { RiskArea } from '../types';

export const INITIAL_RISK_AREAS: RiskArea[] = [
  // CURRENTLY AFFECTED FLOOD ZONE A (CRITICAL - SOLID)
  {
    id: 'zone-flood-a',
    name: 'Central Underpass & River Basin',
    hazardType: 'FLOOD',
    riskScore: 88,
    severity: 'CRITICAL',
    confidence: 0.92, // 92%
    isPredicted: false, // CURRENTLY AFFECTED (Solid Polygon)
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
    center: [12.9760, 77.5980],
    contributingFactors: [
      { name: 'Rainfall Accumulation', weight: 0.35, currentValue: '62.0 mm/h', contribution: 38, unit: 'mm/h', source: 'SN-CU-02 Sensor' },
      { name: 'Underpass Water Inundation', weight: 0.30, currentValue: '112.0 cm', contribution: 32, unit: 'cm', source: 'SN-CU-02 Ultrasonic Sensor' },
      { name: 'Drainage Elevation Index', weight: 0.20, currentValue: 'Low Basin (2.4m rel)', contribution: 18, unit: 'm', source: 'GIS Topography' },
      { name: 'Historical Inundation Frequency', weight: 0.15, currentValue: 'High (8 incidents/yr)', contribution: 12, unit: 'events', source: 'Municipal Records' }
    ],
    lastUpdated: new Date().toISOString(),
    sensorEvidenceIds: ['sens-001', 'sens-002', 'sens-010'],
    affectedPopulationEstimate: 14200,
    predictedPeakTime: 'In 35 minutes'
  },

  // PREDICTED NEXT AFFECTED FLOOD ZONE B (HIGH - DASHED/HATCHED)
  {
    id: 'zone-flood-b',
    name: 'Downstream East Canal Corridor',
    hazardType: 'FLOOD',
    riskScore: 74,
    severity: 'HIGH',
    confidence: 0.84, // 84%
    isPredicted: true, // PREDICTED NEXT AFFECTED (Dashed Polygon)
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
    center: [12.9700, 77.6110],
    contributingFactors: [
      { name: 'Upstream Basin Overflow Rate', weight: 0.40, currentValue: '+15 cm/10min', contribution: 45, unit: 'cm/min', source: 'Flow Velocity Model' },
      { name: 'Downstream Channel Capacity', weight: 0.35, currentValue: '82% Full', contribution: 35, unit: '%', source: 'SN-ED-03 Sensor' },
      { name: 'Topographic Runoff Angle', weight: 0.25, currentValue: '1.8° Gradient', contribution: 20, unit: 'deg', source: 'DEM Elevation Model' }
    ],
    lastUpdated: new Date().toISOString(),
    sensorEvidenceIds: ['sens-002', 'sens-003', 'sens-013'],
    affectedPopulationEstimate: 9800,
    predictedPeakTime: 'In 60 minutes'
  },

  // CURRENTLY AFFECTED HEATWAVE ZONE (HIGH - SOLID)
  {
    id: 'zone-heat-a',
    name: 'East Industrial Thermal Corridor',
    hazardType: 'HEAT',
    riskScore: 82,
    severity: 'HIGH',
    confidence: 0.88,
    isPredicted: false, // Solid
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
    center: [12.9630, 77.6230],
    contributingFactors: [
      { name: 'Ambient Air Temperature', weight: 0.45, currentValue: '43.8 °C', contribution: 50, unit: '°C', source: 'SN-IZ-05 Sensor' },
      { name: 'Urban Heat Island Index', weight: 0.30, currentValue: '+4.2°C anomaly', contribution: 30, unit: '°C', source: 'Satellite Thermal Band' },
      { name: 'Vegetation Canopy Ratio', weight: 0.25, currentValue: '4.2% (Low Canopy)', contribution: 20, unit: '%', source: 'NDVI Canopy Dataset' }
    ],
    lastUpdated: new Date().toISOString(),
    sensorEvidenceIds: ['sens-004', 'sens-005', 'sens-011'],
    affectedPopulationEstimate: 22000
  },

  // PREDICTED NEXT AFFECTED HEATWAVE ZONE (MODERATE - DASHED)
  {
    id: 'zone-heat-b',
    name: 'Commercial District Expansion Zone',
    hazardType: 'HEAT',
    riskScore: 68,
    severity: 'MODERATE',
    confidence: 0.79,
    isPredicted: true, // Dashed
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [12.9780, 77.5800],
        [12.9850, 77.5900],
        [12.9750, 77.5920],
        [12.9720, 77.5820],
        [12.9780, 77.5800]
      ]]
    },
    center: [12.9770, 77.5860],
    contributingFactors: [
      { name: 'Thermal Convection Advection', weight: 0.50, currentValue: 'South-East Wind 6.5km/h', contribution: 50, unit: 'km/h', source: 'Thermal Vector Model' },
      { name: 'Asphalt Surface Coverage', weight: 0.50, currentValue: '78% Impervious', contribution: 50, unit: '%', source: 'Land Use GIS' }
    ],
    lastUpdated: new Date().toISOString(),
    sensorEvidenceIds: ['sens-004'],
    affectedPopulationEstimate: 31000
  },

  // CURRENTLY AFFECTED LANDSLIDE ZONE (CRITICAL - SOLID)
  {
    id: 'zone-landslide-a',
    name: 'North Ridge Escarpment',
    hazardType: 'LANDSLIDE',
    riskScore: 91,
    severity: 'CRITICAL',
    confidence: 0.89,
    isPredicted: false, // Solid
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
    center: [12.9930, 77.5840],
    contributingFactors: [
      { name: 'Soil Moisture Saturation', weight: 0.40, currentValue: '94.8 %', contribution: 45, unit: '%', source: 'SN-RV-06 Moisture Probe' },
      { name: 'Slope Inclination Angle', weight: 0.30, currentValue: '38° Gradient', contribution: 30, unit: 'deg', source: 'LiDAR Elevation Model' },
      { name: '24-Hour Rainfall Load', weight: 0.30, currentValue: '78.5 mm', contribution: 25, unit: 'mm', source: 'SN-RV-06 Pluviometer' }
    ],
    lastUpdated: new Date().toISOString(),
    sensorEvidenceIds: ['sens-006', 'sens-007'],
    affectedPopulationEstimate: 3400
  },

  // PREDICTED NEXT AFFECTED LANDSLIDE ZONE (HIGH - DASHED)
  {
    id: 'zone-landslide-b',
    name: 'West Terrace Runout Zone',
    hazardType: 'LANDSLIDE',
    riskScore: 78,
    severity: 'HIGH',
    confidence: 0.82,
    isPredicted: true, // Dashed
    geometry: {
      type: 'Polygon',
      coordinates: [[
        [12.9820, 77.5700],
        [12.9880, 77.5720],
        [12.9900, 77.5900],
        [12.9820, 77.5840],
        [12.9820, 77.5700]
      ]]
    },
    center: [12.9850, 77.5780],
    contributingFactors: [
      { name: 'Upper Escarpment Shear Stress', weight: 0.60, currentValue: 'Deformation Vector North', contribution: 60, unit: 'vector', source: 'Geotechnical Model' },
      { name: 'Lower Valley Population Exposure', weight: 0.40, currentValue: 'Medium Density Settlement', contribution: 40, unit: 'density', source: 'Census Layer' }
    ],
    lastUpdated: new Date().toISOString(),
    sensorEvidenceIds: ['sens-006', 'sens-007'],
    affectedPopulationEstimate: 5100
  }
];
