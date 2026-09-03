import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HazardType, Severity } from '../../types';
import { Play, Pause, RotateCcw, FastForward, ShieldAlert, Cpu, Activity, Clock } from 'lucide-react';
import { RiskMap } from '../../components/map/RiskMap';

export const SimulationPage: React.FC = () => {
  const {
    simulation,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    resetSimulation,
    setSimulationStep,
    assessment,
    sensors
  } = useApp();

  const [selectedHazard, setSelectedHazard] = useState<HazardType>('FLOOD');
  const [selectedSeverity, setSelectedSeverity] = useState<Severity>('HIGH');

  return (
    <div className="flex w-full h-full bg-[#0B0F19] text-slate-100 overflow-hidden select-none">
      {/* Left Control & Telemetry Panel */}
      <div className="w-96 bg-[#0E1526] border-r border-slate-800/80 p-4 h-full flex flex-col justify-between overflow-y-auto shrink-0 space-y-4 text-xs">
        <div className="space-y-4">
          {/* Header */}
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
              <Play className="w-4 h-4 text-cyan-400" />
              <span>DISASTER SIMULATION ENGINE</span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Event-Driven Multi-Hazard Scenario Simulator & Risk Propagation
            </p>
          </div>

          {/* Scenario Configuration Card */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-3">
            <div className="font-mono font-bold text-[10px] text-slate-400 uppercase tracking-wider">
              Disaster Scenario Parameters
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium">Hazard Type:</label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {(['FLOOD', 'HEAT', 'LANDSLIDE', 'STORM'] as HazardType[]).map(h => (
                  <button
                    key={h}
                    disabled={simulation.active}
                    onClick={() => setSelectedHazard(h)}
                    className={`py-1.5 px-2 rounded font-bold border transition-colors ${
                      selectedHazard === h
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-300 font-medium">Target Event Severity:</label>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {(['LOW', 'MODERATE', 'HIGH', 'CRITICAL'] as Severity[]).map(s => (
                  <button
                    key={s}
                    disabled={simulation.active}
                    onClick={() => setSelectedSeverity(s)}
                    className={`py-1.5 px-2 rounded font-bold border transition-colors ${
                      selectedSeverity === s
                        ? 'bg-red-500/20 text-red-400 border-red-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulation Action Buttons */}
            <div className="pt-2">
              {!simulation.active ? (
                <button
                  onClick={() => startSimulation(selectedHazard, selectedSeverity)}
                  className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold rounded-lg shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2 text-xs"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>START DISASTER SIMULATION</span>
                </button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {simulation.paused ? (
                    <button
                      onClick={resumeSimulation}
                      className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold rounded-lg flex items-center justify-center space-x-1"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>RESUME</span>
                    </button>
                  ) : (
                    <button
                      onClick={pauseSimulation}
                      className="py-2 bg-amber-600 hover:bg-amber-500 text-white font-mono font-bold rounded-lg flex items-center justify-center space-x-1"
                    >
                      <Pause className="w-3.5 h-3.5 fill-current" />
                      <span>PAUSE</span>
                    </button>
                  )}
                  <button
                    onClick={resetSimulation}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono font-bold rounded-lg border border-slate-700 flex items-center justify-center space-x-1"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Slider Control */}
          <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-3 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">TIMELINE PROGRESSION:</span>
              <span className="text-cyan-400 font-bold text-sm">T = {simulation.currentStep} / 100</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={simulation.currentStep}
              onChange={e => setSimulationStep(Number(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>T=0 (Normal Baseline)</span>
              <span>T=50 (Escalation)</span>
              <span>T=100 (Peak Event)</span>
            </div>
          </div>

          {/* Dynamic Evaluation Telemetry Output */}
          {assessment && (
            <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-xl space-y-2 font-mono">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                Risk Engine Output Feed
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">OVERALL RISK SCORE:</span>
                <span className={`font-bold text-sm ${
                  assessment.severity === 'CRITICAL' ? 'text-red-400' : 'text-orange-400'
                }`}>
                  {assessment.riskScore}/100 ({assessment.severity})
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300">MODEL CONFIDENCE:</span>
                <span className="font-bold text-cyan-400">{(assessment.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}

          {/* Simulation Log Stream */}
          <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-1.5 font-mono text-[10px] max-h-48 overflow-y-auto">
            <div className="text-slate-500 font-bold border-b border-slate-900 pb-1">EVENT LOG STREAM</div>
            {simulation.logs.map((log, idx) => (
              <div key={idx} className="text-slate-300">
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Map Spatial View demonstrating simulation effect in real-time */}
      <div className="flex-1 h-full relative">
        <RiskMap />
      </div>
    </div>
  );
};
