import React from 'react';
import { useApp } from '../../context/AppContext';
import { ShieldAlert, AlertTriangle, Cpu, Building2, Home, UserCheck, Bot } from 'lucide-react';

export const ResponsePage: React.FC = () => {
  const { assessment, alerts, sensors, infrastructure, shelters, citizenReports, riskAreas, mode } = useApp();

  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const criticalZones = riskAreas.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH');
  const anomalousSensors = sensors.filter(s => s.anomalyDetected);

  return (
    <div className="flex-1 w-full h-full bg-[#0B0F19] text-slate-100 overflow-y-auto p-6 space-y-6 select-none">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-cyan-400" />
            <span>INCIDENT & EMERGENCY RESPONSE DASHBOARD</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Operational Overview, AI Situation Summary, and Critical Asset Exposure Matrix
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-right font-mono text-xs">
          <div className="text-slate-400 text-[10px]">CURRENT SYSTEM OPERATIONAL MODE</div>
          <div className="font-bold text-cyan-400">{mode} INFERENCE</div>
        </div>
      </div>

      {/* AI Situation Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0F172A] to-slate-900 border border-cyan-500/30 p-5 rounded-2xl shadow-xl space-y-2 relative overflow-hidden">
        <div className="flex items-center space-x-2 text-cyan-400 font-mono font-bold text-xs">
          <Bot className="w-4 h-4" />
          <span>AI SITUATION SUMMARY — SYNTHESIZED COMMAND BRIEFING</span>
        </div>
        <p className="text-xs text-slate-200 leading-relaxed font-sans">
          {assessment?.explanationText || 'System synthesizes multi-hazard sensor feeds across micro-zones.'}
        </p>
        <div className="flex items-center space-x-4 pt-2 font-mono text-[10px] text-slate-400 border-t border-slate-800/80">
          <span>Active Critical Zones: <strong className="text-red-400 font-bold">{criticalZones.length}</strong></span>
          <span>Unacknowledged Alerts: <strong className="text-rose-400 font-bold">{activeAlerts.length}</strong></span>
          <span>Sensor Anomalies: <strong className="text-amber-400 font-bold">{anomalousSensors.length}</strong></span>
        </div>
      </div>

      {/* Grid Layout of Incident & Response Modules */}
      <div className="grid grid-cols-3 gap-6">
        {/* Active Alerts Feed */}
        <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>ACTIVE ALERTS ({activeAlerts.length})</span>
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {alerts.slice(0, 5).map(alt => (
              <div key={alt.id} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg space-y-1">
                <div className="flex justify-between font-bold text-[11px]">
                  <span className={alt.severity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'}>
                    [{alt.level}] {alt.hazard}
                  </span>
                  <span className="text-slate-400 text-[10px]">{new Date(alt.timestamp).toLocaleTimeString()}</span>
                </div>
                <div className="text-[11px] text-slate-200">{alt.title}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Affected Critical Infrastructure */}
        <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>CRITICAL INFRASTRUCTURE IMPACT</span>
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {infrastructure.map(inf => (
              <div key={inf.id} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-100">{inf.name}</div>
                  <div className="text-[10px] text-slate-400">{inf.type} - {inf.status}</div>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  inf.currentExposureSeverity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
                }`}>
                  {inf.currentExposureSeverity} EXPOSURE
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Shelters Matrix */}
        <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-3 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200 flex items-center space-x-2">
              <Home className="w-4 h-4 text-emerald-400" />
              <span>SHELTER STATUS & CAPACITY</span>
            </span>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {shelters.map(sh => (
              <div key={sh.id} className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg space-y-1.5">
                <div className="flex justify-between font-bold">
                  <span className="text-slate-100">{sh.name}</span>
                  <span className="text-emerald-400">{sh.occupancy}/{sh.capacity}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.round((sh.occupancy / sh.capacity) * 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
