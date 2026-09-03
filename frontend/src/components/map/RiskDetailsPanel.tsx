import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, ShieldAlert, Cpu, Users, Clock, AlertTriangle, Layers } from 'lucide-react';

export const RiskDetailsPanel: React.FC = () => {
  const { selectedZone, setSelectedZone, assessment, mode } = useApp();

  if (!selectedZone) return null;

  return (
    <div className="w-96 bg-[#0E1526]/95 border-l border-slate-800/80 p-4 h-full flex flex-col justify-between overflow-y-auto shrink-0 select-none text-xs text-slate-200 backdrop-blur z-20">
      <div className="space-y-4">
        {/* Panel Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className={`w-4 h-4 ${
                selectedZone.severity === 'CRITICAL' ? 'text-red-400' :
                selectedZone.severity === 'HIGH' ? 'text-orange-400' : 'text-amber-400'
              }`} />
              <h2 className="font-bold text-sm text-slate-100">{selectedZone.name}</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">ID: {selectedZone.id}</p>
          </div>
          <button
            onClick={() => setSelectedZone(null)}
            className="p-1 text-slate-400 hover:text-slate-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current vs Predicted Status Banner */}
        <div className={`p-2.5 rounded-lg border font-mono text-xs flex items-center justify-between ${
          selectedZone.isPredicted
            ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
            : 'bg-red-950/40 border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${selectedZone.isPredicted ? 'bg-cyan-400 border border-dashed border-cyan-200' : 'bg-red-500 animate-pulse'}`}></span>
            <span className="font-bold">
              STATUS: {selectedZone.isPredicted ? 'PREDICTED NEXT AFFECTED' : 'CURRENTLY AFFECTED'}
            </span>
          </div>
        </div>

        {/* Explicit Separation of Risk Score & Confidence */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-center space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">RISK SCORE & SEVERITY</div>
            <div className={`font-mono font-bold text-2xl ${
              selectedZone.severity === 'CRITICAL' ? 'text-red-400' :
              selectedZone.severity === 'HIGH' ? 'text-orange-400' : 'text-amber-400'
            }`}>
              {selectedZone.riskScore} / 100
            </div>
            <div className="text-[10px] font-bold text-slate-300 uppercase">{selectedZone.severity}</div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg text-center space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">MODEL CONFIDENCE</div>
            <div className="font-mono font-bold text-2xl text-cyan-400">
              {(selectedZone.confidence * 100).toFixed(0)}%
            </div>
            <div className="text-[10px] text-slate-400 font-mono">SEPARATE MEASURE</div>
          </div>
        </div>

        {/* Affected Population & Peak Time */}
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-2">
          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center space-x-1.5 text-slate-400">
              <Users className="w-3.5 h-3.5" />
              <span>Est. Population Exposed:</span>
            </span>
            <span className="font-mono font-bold text-slate-100">{selectedZone.affectedPopulationEstimate.toLocaleString()}</span>
          </div>
          {selectedZone.predictedPeakTime && (
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center space-x-1.5 text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                <span>Predicted Peak Event:</span>
              </span>
              <span className="font-mono font-bold text-cyan-400">{selectedZone.predictedPeakTime}</span>
            </div>
          )}
        </div>

        {/* Contributing Factors Breakdown */}
        <div className="space-y-2">
          <h3 className="font-mono font-bold text-[11px] text-slate-400 uppercase tracking-wider">
            Contributing Factor Analysis
          </h3>
          <div className="space-y-2">
            {selectedZone.contributingFactors.map((factor, idx) => (
              <div key={idx} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg text-[11px]">
                <div className="flex justify-between items-center font-medium text-slate-200">
                  <span>{factor.name}</span>
                  <span className="font-mono font-bold text-cyan-400">+{factor.contribution}%</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                  <span>Current: <strong className="text-slate-200 font-mono">{factor.currentValue}</strong></span>
                  <span className="italic">Source: {factor.source}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sensor Evidence Links */}
        <div className="space-y-2">
          <h3 className="font-mono font-bold text-[11px] text-slate-400 uppercase tracking-wider">
            Sensor Evidence Stations
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {selectedZone.sensorEvidenceIds.map(sid => (
              <span key={sid} className="bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 px-2 py-1 rounded text-[10px] font-mono flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>{sid}</span>
              </span>
            ))}
          </div>
        </div>

        {/* AI Explanation per SystemMode contract */}
        <div className="space-y-1.5 bg-slate-900/90 border border-slate-800 p-3 rounded-lg">
          <div className="flex items-center justify-between text-[10px] font-mono font-bold">
            <span className="text-slate-400">AI SYNTHESIS EXPLANATION</span>
            <span className={assessment?.explanationAvailable ? 'text-emerald-400' : 'text-rose-400'}>
              {assessment?.explanationAvailable ? 'AVAILABLE' : 'UNAVAILABLE'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
            {assessment?.explanationText || 'No current inference text.'}
          </p>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex justify-between">
        <span>Last Updated:</span>
        <span>{new Date(selectedZone.lastUpdated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
