import React from 'react';
import { useApp } from '../../context/AppContext';
import { SystemMode } from '../../types';
import { AlertTriangle, Activity, Wifi, ShieldAlert, Cpu, Radio, Zap } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { mode, setMode, assessment, alerts, sensors } = useApp();

  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const onlineSensorsCount = sensors.filter(s => s.status === 'ONLINE').length;
  const totalSensorsCount = sensors.length;

  const modeColors: Record<SystemMode, { bg: string; border: string; text: string; label: string }> = {
    CLOUD: { bg: 'bg-cyan-950/60', border: 'border-cyan-500/40', text: 'text-cyan-400', label: 'CLOUD INFERENCE MODE' },
    LOCAL_EDGE: { bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', text: 'text-emerald-400', label: 'LOCAL EDGE ACTIVE' },
    DEGRADED: { bg: 'bg-amber-950/60', border: 'border-amber-500/40', text: 'text-amber-400', label: 'DEGRADED DATA MODE' },
    NO_DATA: { bg: 'bg-rose-950/60', border: 'border-rose-500/40', text: 'text-rose-400', label: 'NO DATA (LAST KNOWN)' }
  };

  const currentModeStyle = modeColors[mode];

  return (
    <header className="h-16 bg-[#0E1526]/90 backdrop-blur border-b border-slate-800/80 px-4 flex items-center justify-between text-xs z-30 shrink-0 select-none">
      {/* Brand Title */}
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
          <ShieldAlert className="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <h1 className="font-bold text-sm text-slate-100 tracking-wide flex items-center space-x-2">
            <span>HYPERLOCAL CLIMATE RISK-TO-ACTION</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-500/30 font-mono">T1-PROTOTYPE</span>
          </h1>
          <p className="text-[10px] text-slate-400">Emergency Operations Command Center & Resilient Edge Platform</p>
        </div>
      </div>

      {/* System Status Indicators */}
      <div className="flex items-center space-x-4">
        {/* Overall System Risk Badge */}
        {assessment && (
          <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="text-slate-400 font-medium">OVERALL RISK:</span>
            <span className={`font-mono font-bold text-sm px-2 py-0.5 rounded ${
              assessment.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
              assessment.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
              assessment.severity === 'MODERATE' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {assessment.riskScore}/100 ({assessment.severity})
            </span>
          </div>
        )}

        {/* Sensor Network Status */}
        <div className="flex items-center space-x-2 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-300">
          <Radio className="w-3.5 h-3.5 text-cyan-400" />
          <span>SENSORS:</span>
          <span className="font-mono font-semibold text-slate-100">{onlineSensorsCount}/{totalSensorsCount} ONLINE</span>
        </div>

        {/* Active Alerts Count */}
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border font-medium ${
          activeAlertsCount > 0 ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse' : 'bg-slate-900/80 border-slate-800 text-slate-400'
        }`}>
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>ALERTS:</span>
          <span className="font-mono font-bold">{activeAlertsCount} ACTIVE</span>
        </div>

        {/* System Mode Switcher Dropdown */}
        <div className={`flex items-center space-x-2 border px-3 py-1.5 rounded-lg font-mono text-xs ${currentModeStyle.bg} ${currentModeStyle.border} ${currentModeStyle.text}`}>
          <Cpu className="w-3.5 h-3.5" />
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SystemMode)}
            className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer pr-1"
          >
            <option value="CLOUD" className="bg-slate-900 text-cyan-400">CLOUD MODE</option>
            <option value="LOCAL_EDGE" className="bg-slate-900 text-emerald-400">LOCAL EDGE ACTIVE</option>
            <option value="DEGRADED" className="bg-slate-900 text-amber-400">DEGRADED DATA</option>
            <option value="NO_DATA" className="bg-slate-900 text-rose-400">NO DATA MODE</option>
          </select>
        </div>
      </div>
    </header>
  );
};
