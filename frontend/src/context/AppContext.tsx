import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  SystemMode,
  Sensor,
  RiskArea,
  HazardHotspot,
  Alert,
  Infrastructure,
  Shelter,
  CitizenReport,
  SimulationState,
  RiskAssessment,
  HazardType,
  Severity
} from '../types';

import { sensorApi } from '../services/sensorApi';
import { riskApi } from '../services/riskApi';
import { alertApi } from '../services/alertApi';
import { hotspotApi } from '../services/hotspotApi';
import { infrastructureApi } from '../services/infrastructureApi';
import { shelterApi } from '../services/shelterApi';
import { citizenReportApi } from '../services/citizenReportApi';
import { computeSimulatedTelemetry } from '../engine/simulationEngine';

interface AppContextType {
  mode: SystemMode;
  sensors: Sensor[];
  riskAreas: RiskArea[];
  hotspots: HazardHotspot[];
  alerts: Alert[];
  infrastructure: Infrastructure[];
  shelters: Shelter[];
  citizenReports: CitizenReport[];
  simulation: SimulationState;
  assessment: RiskAssessment | null;
  
  // Active Selection
  selectedZone: RiskArea | null;
  selectedSensor: Sensor | null;
  selectedInfra: Infrastructure | null;
  selectedShelter: Shelter | null;

  selectedReport: CitizenReport | null;

  routeOrigin: any;
  routeDestination: any;
  routeData: any;
  routingActive: boolean;
  setRouteOrigin: (o: any) => void;
  setRouteDestination: (d: any) => void;
  setRoutingActive: (active: boolean) => void;
  analyzeRoute: () => Promise<void>;


  setSelectedZone: (zone: RiskArea | null) => void;
  setSelectedSensor: (sensor: Sensor | null) => void;
  setSelectedInfra: (infra: Infrastructure | null) => void;
  setSelectedShelter: (shelter: Shelter | null) => void;
  setSelectedReport: (report: CitizenReport | null) => void;

  // Actions
  setMode: (mode: SystemMode) => void;
  startSimulation: (hazard: HazardType, severity: Severity) => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  resetSimulation: () => void;
  setSimulationStep: (step: number) => void;
  acknowledgeAlert: (id: string) => void;
  dismissAlert: (id: string) => void;
  
  // Admin Hotspot Actions
  createHotspot: (data: Omit<HazardHotspot, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateHotspot: (id: string, data: Partial<HazardHotspot>) => Promise<void>;
  deleteHotspot: (id: string) => Promise<void>;
  toggleHotspot: (id: string) => Promise<void>;

  // Citizen Report Actions
  addCitizenReport: (data: Omit<CitizenReport, 'id' | 'timestamp' | 'upvotes' | 'verificationStatus'>) => Promise<void>;
  updateReportStatus: (id: string, status: CitizenReport['verificationStatus']) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<SystemMode>('CLOUD');
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [riskAreas, setRiskAreas] = useState<RiskArea[]>([]);
  const [hotspots, setHotspots] = useState<HazardHotspot[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [infrastructure, setInfrastructure] = useState<Infrastructure[]>([]);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>([]);
  const [assessment, setAssessment] = useState<RiskAssessment | null>(null);

  const [selectedZone, setSelectedZone] = useState<RiskArea | null>(null);
  const [selectedSensor, setSelectedSensor] = useState<Sensor | null>(null);
  const [selectedInfra, setSelectedInfra] = useState<Infrastructure | null>(null);
  const [selectedShelter, setSelectedShelter] = useState<Shelter | null>(null);

  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null);

  const [routeOrigin, setRouteOrigin] = useState<any>(null);
  const [routeDestination, setRouteDestination] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [routingActive, setRoutingActive] = useState<boolean>(false);

  const analyzeRoute = async () => {
    if (!routeOrigin || !routeDestination) return;
    try {
      const oStr = `${routeOrigin[0]},${routeOrigin[1]}`;
      const dStr = `${routeDestination[0]},${routeDestination[1]}`;
      const res = await fetch('http://localhost:8000/api/analyze-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: oStr, destination: dStr, departure_time: '17:30', scenario: 'BASELINE', mode: mode })
      });
      const data = await res.json();
      setRouteData(data);
    } catch (e) { console.error(e); }
  };


  const [simulation, setSimulation] = useState<SimulationState>({
    active: false,
    paused: false,
    currentStep: 0,
    totalSteps: 100,
    config: null,
    speed: '1x',
    elapsedMinutes: 0,
    logs: ['System ready. No active simulation scenario.']
  });

  // Initial load
  useEffect(() => {
    async function loadData() {
      const [sData, hData, aData, iData, shData, crData] = await Promise.all([
        sensorApi.getSensors(),
        hotspotApi.getHotspots(),
        alertApi.getAlerts(),
        infrastructureApi.getInfrastructure(),
        shelterApi.getShelters(),
        citizenReportApi.getReports()
      ]);

      setSensors(sData);
      setHotspots(hData);
      setAlerts(aData);
      setInfrastructure(iData);
      setShelters(shData);
      setCitizenReports(crData);

      const initAssess = await riskApi.getAssessment('CLOUD', sData, hData, []);
      setAssessment(initAssess);
      setRiskAreas([...initAssess.currentAreas, ...initAssess.predictedAreas]);
    }
    loadData();
  }, []);

  // Recalculate Risk Assessment whenever sensors, mode, or hotspots change
  const refreshRiskAssessment = useCallback(async (currentSensors: Sensor[], currentMode: SystemMode, currentHotspots: HazardHotspot[], currentRiskAreas: RiskArea[]) => {
    const newAssess = await riskApi.getAssessment(currentMode, currentSensors, currentHotspots, currentRiskAreas);
    setAssessment(newAssess);
    setRiskAreas([...newAssess.currentAreas, ...newAssess.predictedAreas]);
  }, []);

  // System mode change
  const setMode = async (newMode: SystemMode) => {
    setModeState(newMode);
    try {
      await fetch('http://localhost:8000/api/v1/mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode })
      });
    } catch (e) {
      console.warn('Could not sync mode to backend', e);
    }
    refreshRiskAssessment(sensors, newMode, hotspots, riskAreas);
  };

  // Simulation timer loop
  useEffect(() => {
    let interval: any = null;
    if (simulation.active && !simulation.paused) {
      interval = setInterval(() => {
        setSimulation(prev => {
          if (prev.currentStep >= prev.totalSteps) {
            clearInterval(interval);
            return { ...prev, active: false, logs: [`[T=100] Simulation completed peak event scenario.`, ...prev.logs] };
          }
          const nextStep = prev.currentStep + 2;
          return {
            ...prev,
            currentStep: nextStep,
            elapsedMinutes: nextStep * 1.2,
            logs: [`[T=${nextStep}] Simulating telemetry step progression...`, ...prev.logs]
          };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [simulation.active, simulation.paused]);

  // When simulation step changes: dynamically evolve sensor values and feed Risk Engine
  useEffect(() => {
    if (simulation.active && simulation.config) {
      const hazardType = simulation.config.hazardType;
      const targetSeverity = simulation.config.targetSeverity;

      const simulatedSensors = sensors.map(s => {
        const newTelemetry = computeSimulatedTelemetry(s, simulation.currentStep, hazardType, targetSeverity);
        return {
          ...s,
          telemetry: newTelemetry,
          history: [...s.history.slice(-11), newTelemetry]
        };
      });

      setSensors(simulatedSensors);
      refreshRiskAssessment(simulatedSensors, mode, hotspots, riskAreas);

      // Trigger dynamic simulation alerts at milestones
      if (simulation.currentStep === 40) {
        const simAlert: Alert = {
          id: `sim-alt-${Date.now()}`,
          hazard: hazardType,
          level: 'WARNING',
          severity: 'HIGH',
          title: `SIMULATION WARNING: ${hazardType} INTENSITY ELEVATED`,
          message: `Water/Thermal metrics spiking rapidly in Central Sector. Risk Score approaching High threshold.`,
          locationName: 'Central Sector Underpass',
          coordinates: [12.9735, 77.5985],
          timestamp: new Date().toISOString(),
          source: 'Disaster Simulation Engine',
          confidence: 0.92,
          acknowledged: false
        };
        setAlerts(prev => [simAlert, ...prev]);
      } else if (simulation.currentStep === 70) {
        const simAlertCrit: Alert = {
          id: `sim-alt-crit-${Date.now()}`,
          hazard: hazardType,
          level: 'CRITICAL',
          severity: 'CRITICAL',
          title: `SIMULATION CRITICAL ALERT: ${hazardType} PEAK EMERGENCY`,
          message: `Primary sector hazard reached CRITICAL. Downstream predicted next affected areas activated.`,
          locationName: 'Central Basin & Downstream Corridor',
          coordinates: [12.9780, 77.5920],
          timestamp: new Date().toISOString(),
          source: 'Disaster Simulation Engine',
          confidence: 0.95,
          acknowledged: false
        };
        setAlerts(prev => [simAlertCrit, ...prev]);
      }
    }
  }, [simulation.currentStep, simulation.active, simulation.config]);

  // Simulation controls
  const startSimulation = (hazardType: HazardType, targetSeverity: Severity) => {
    setSimulation({
      active: true,
      paused: false,
      currentStep: 0,
      totalSteps: 100,
      config: {
        id: `sim-${Date.now()}`,
        name: `${hazardType} ${targetSeverity} Disaster Scenario`,
        hazardType,
        targetSeverity,
        durationMinutes: 120,
        epicenter: [12.9735, 77.5985],
        affectedZoneIds: ['zone-flood-a', 'zone-flood-b'],
        description: `Simulated propagation of severe ${hazardType.toLowerCase()} event across central urban micro-zones.`
      },
      speed: '1x',
      elapsedMinutes: 0,
      logs: [`Started simulation: ${hazardType} ${targetSeverity} scenario (T=0 to T=100)`]
    });
  };

  const pauseSimulation = () => setSimulation(prev => ({ ...prev, paused: true }));
  const resumeSimulation = () => setSimulation(prev => ({ ...prev, paused: false }));
  const resetSimulation = async () => {
    setSimulation({
      active: false,
      paused: false,
      currentStep: 0,
      totalSteps: 100,
      config: null,
      speed: '1x',
      elapsedMinutes: 0,
      logs: ['Simulation reset to initial conditions.']
    });
    const freshSensors = await sensorApi.getSensors();
    setSensors(freshSensors);
    refreshRiskAssessment(freshSensors, mode, hotspots, riskAreas);
  };

  const setSimulationStep = (step: number) => {
    setSimulation(prev => ({ ...prev, currentStep: step }));
  };

  const acknowledgeAlert = async (id: string) => {
    const updated = await alertApi.acknowledgeAlert(id);
    setAlerts(prev => prev.map(a => (a.id === id ? updated : a)));
  };

  const dismissAlert = async (id: string) => {
    await alertApi.dismissAlert(id);
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Hotspot actions
  const createHotspot = async (data: Omit<HazardHotspot, 'id' | 'createdAt' | 'updatedAt'>) => {
    const created = await hotspotApi.createHotspot(data);
    const updated = [...hotspots, created];
    setHotspots(updated);
    refreshRiskAssessment(sensors, mode, updated, riskAreas);
  };

  const updateHotspot = async (id: string, data: Partial<HazardHotspot>) => {
    const updatedH = await hotspotApi.updateHotspot(id, data);
    const list = hotspots.map(h => (h.id === id ? updatedH : h));
    setHotspots(list);
    refreshRiskAssessment(sensors, mode, list, riskAreas);
  };

  const deleteHotspot = async (id: string) => {
    await hotspotApi.deleteHotspot(id);
    const list = hotspots.filter(h => h.id !== id);
    setHotspots(list);
    refreshRiskAssessment(sensors, mode, list, riskAreas);
  };

  const toggleHotspot = async (id: string) => {
    const updatedH = await hotspotApi.toggleHotspotActive(id);
    const list = hotspots.map(h => (h.id === id ? updatedH : h));
    setHotspots(list);
    refreshRiskAssessment(sensors, mode, list, riskAreas);
  };

  const addCitizenReport = async (data: Omit<CitizenReport, 'id' | 'timestamp' | 'upvotes' | 'verificationStatus'>) => {
    const created = await citizenReportApi.createReport(data);
    setCitizenReports(prev => [created, ...prev]);
  };

  const updateReportStatus = async (id: string, status: CitizenReport['verificationStatus']) => {
    const updated = await citizenReportApi.updateVerificationStatus(id, status);
    setCitizenReports(prev => prev.map(r => (r.id === id ? updated : r)));
  };

  return (
    <AppContext.Provider
      value={{
        mode,
        sensors,
        riskAreas,
        hotspots,
        alerts,
        infrastructure,
        shelters,
        citizenReports,
        simulation,
        assessment,
        selectedZone,
        selectedSensor,
        selectedInfra,
        selectedShelter,
        selectedReport,
        setSelectedZone,
        setSelectedSensor,
        setSelectedInfra,
        setSelectedShelter,
        setSelectedReport,
        routeOrigin, routeDestination, routeData, routingActive,
        setRouteOrigin, setRouteDestination, setRoutingActive, analyzeRoute,
        setMode,
        startSimulation,
        pauseSimulation,
        resumeSimulation,
        resetSimulation,
        setSimulationStep,
        acknowledgeAlert,
        dismissAlert,
        createHotspot,
        updateHotspot,
        deleteHotspot,
        toggleHotspot,
        addCitizenReport,
        updateReportStatus
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};
