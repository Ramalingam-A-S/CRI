import {
  RiskAssessment,
  RiskArea,
  Severity,
  HazardType,
  Sensor,
  HazardHotspot,
  SystemMode,
  RiskFactor
} from '../types';

import { calculateFloodScore } from './hazardModels/floodModel';
import { calculateHeatScore } from './hazardModels/heatModel';
import { calculateLandslideScore } from './hazardModels/landslideModel';
import { calculateStormScore } from './hazardModels/stormModel';

// Centralized Risk Severity Thresholds
export function getSeverityFromScore(score: number): Severity {
  if (score >= 75) return 'CRITICAL';
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MODERATE';
  return 'LOW';
}

export interface RiskEngineInput {
  mode: SystemMode;
  sensors: Sensor[];
  hotspots: HazardHotspot[];
  currentAreas: RiskArea[];
}

export function evaluateRiskSystem(input: RiskEngineInput): RiskAssessment {
  const { mode, sensors, hotspots, currentAreas } = input;
  const timestamp = new Date().toISOString();

  // If system is in NO_DATA mode: return LAST KNOWN STATE frozen, no new predictions!
  if (mode === 'NO_DATA') {
    return {
      mode: 'NO_DATA',
      timestamp,
      hazard: 'FLOOD',
      riskScore: 0,
      severity: 'LOW',
      confidence: 0.0,
      currentAreas: currentAreas.map(a => ({ ...a, lastUpdated: 'LAST KNOWN STATE' })),
      predictedAreas: [], // CRITICAL CONTRACT: NEVER fabricate predictions when NO_DATA
      contributingFactors: [],
      explanationAvailable: false,
      explanationText: 'No usable real-time telemetry feed available. Displaying last known recorded state snapshot.',
      modelVersion: 'mock-engine-v1-nodata',
      inferenceTimestamp: timestamp
    };
  }

  // Evaluate risk areas based on sensor telemetry & hotspot definitions
  const updatedAreas: RiskArea[] = currentAreas.map(area => {
    // Find associated sensors for this zone
    const areaSensors = sensors.filter(s => area.sensorEvidenceIds.includes(s.id));
    const primarySensor = areaSensors[0] || sensors[0];

    // Find matching hotspot baseline if available
    const hotspot = hotspots.find(h => h.sensorIds.some(sid => area.sensorEvidenceIds.includes(sid)));
    const baselineRisk = hotspot ? hotspot.baselineRisk : 30;

    let score = area.riskScore;
    let confidence = area.confidence;
    let factors: RiskFactor[] = area.contributingFactors;

    if (primarySensor && primarySensor.status !== 'OFFLINE') {
      let evalResult;
      switch (area.hazardType) {
        case 'FLOOD':
          evalResult = calculateFloodScore(primarySensor.telemetry, baselineRisk);
          break;
        case 'HEAT':
          evalResult = calculateHeatScore(primarySensor.telemetry, baselineRisk);
          break;
        case 'LANDSLIDE':
          evalResult = calculateLandslideScore(primarySensor.telemetry, baselineRisk);
          break;
        case 'STORM':
          evalResult = calculateStormScore(primarySensor.telemetry, baselineRisk);
          break;
      }
      score = evalResult.score;
      confidence = evalResult.confidence;
      factors = evalResult.factors;
    }

    // In DEGRADED mode: degrade confidence by 25%
    if (mode === 'DEGRADED') {
      confidence = Math.max(0.3, confidence * 0.75);
    }

    // In LOCAL_EDGE mode: adjust confidence slightly for edge model
    if (mode === 'LOCAL_EDGE') {
      confidence = Math.min(0.85, confidence);
    }

    const severity = getSeverityFromScore(score);

    // Predict downstream propagation logic (e.g. Zone A CRITICAL -> Zone B PREDICTED HIGH)
    let isPredicted = area.isPredicted;
    if (area.id.endsWith('-b') && currentAreas.some(a => a.id.endsWith('-a') && a.riskScore >= 75)) {
      // Downstream zone affected by upstream critical zone
      score = Math.max(score, 74);
      isPredicted = true; // Still predicted until peak event
    }

    return {
      ...area,
      riskScore: score,
      severity: getSeverityFromScore(score),
      confidence: Number(confidence.toFixed(2)),
      isPredicted,
      contributingFactors: factors,
      lastUpdated: timestamp
    };
  });

  // Highest overall risk score
  const maxScoreArea = updatedAreas.reduce((prev, curr) => (curr.riskScore > prev.riskScore ? curr : prev), updatedAreas[0]);
  const overallScore = maxScoreArea ? maxScoreArea.riskScore : 0;
  const overallSeverity = getSeverityFromScore(overallScore);
  const overallHazard: HazardType = maxScoreArea ? maxScoreArea.hazardType : 'FLOOD';
  const overallConfidence = maxScoreArea ? maxScoreArea.confidence : 0.85;

  const currentAreasList = updatedAreas.filter(a => !a.isPredicted);
  const predictedAreasList = updatedAreas.filter(a => a.isPredicted);

  // AI Explanation Availability Contract based on SystemMode
  let explanationAvailable = false;
  let explanationText = '';

  if (mode === 'CLOUD') {
    explanationAvailable = true;
    explanationText = `[CLOUD ML HIGH-PRECISION INFERENCE] Multi-hazard assessment indicates ${overallSeverity} risk (${overallScore}/100) driven primarily by ${overallHazard} dynamics in ${maxScoreArea.name}. Sensor telemetry confirms ${maxScoreArea.contributingFactors[0]?.name || 'critical environmental thresholds'} at ${maxScoreArea.contributingFactors[0]?.currentValue || 'elevated values'}. Downstream propagation predicted for adjacent low-elevation sectors.`;
  } else if (mode === 'LOCAL_EDGE') {
    explanationAvailable = true;
    explanationText = `[LOCAL EDGE INFERENCE ACTIVE] Cloud backend disconnected. Local edge gateway executing deterministic rule-based evaluation. Overall risk: ${overallSeverity} (${overallScore}/100) for ${maxScoreArea.name}. Basic edge hazard factors available.`;
  } else if (mode === 'DEGRADED') {
    explanationAvailable = true;
    explanationText = `[DEGRADED DATA MODE] Sensor network reporting partial telemetry loss or high noise ratio. Confidence reduced to ${(overallConfidence * 100).toFixed(0)}%. ${overallSeverity} risk detected in ${maxScoreArea.name}.`;
  }

  return {
    mode,
    timestamp,
    hazard: overallHazard,
    riskScore: overallScore,
    severity: overallSeverity,
    confidence: overallConfidence,
    currentAreas: currentAreasList,
    predictedAreas: predictedAreasList,
    contributingFactors: maxScoreArea ? maxScoreArea.contributingFactors : [],
    explanationAvailable,
    explanationText,
    modelVersion: mode === 'CLOUD' ? 'cloud-fusion-v3.4' : 'edge-deterministic-v1.1',
    inferenceTimestamp: timestamp
  };
}
