import React from 'react';
import { useApp } from '../../context/AppContext';
import { SystemMode } from '../../types';
import { 
  Activity, 
  Cloud, 
  Cpu, 
  AlertTriangle, 
  WifiOff, 
  RotateCw,
  Map,
  SlidersHorizontal,
  ShieldAlert,
  Radio,
  Settings
} from 'lucide-react';

export type TabType = 'map' | 'simulation' | 'response' | 'sensors' | 'admin';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab }) => {
  const { mode, setMode, assessment, alerts } = useApp();

  const activeAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const topAlert = alerts.find(a => !a.acknowledged) || alerts[0];

  const handleRefresh = async () => {
    window.location.reload();
  };

  return (
    <header className="bg-[#090E17] border-b border-slate-800 text-slate-100 shrink-0 select-none z-30">
      {/* Top Header Row */}
      <div className="h-16 px-5 flex items-center justify-between">
        {/* Left: Branding */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-black text-sm tracking-wider text-white">
                C.R.I. COMMAND CENTER
              </h1>
              <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 px-2 py-0.5 rounded-full">
                v1.0 REALIGNED
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">
              Hyperlocal Multi-Hazard Risk Intelligence & Disaster Response
            </p>
          </div>
        </div>

        {/* Center: Inline Live Alert Banner */}
        {topAlert && (
          <div className="hidden lg:flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border border-red-500/40 bg-red-950/40 text-red-200 text-xs font-mono shadow-md shadow-red-950/50 max-w-xl truncate">
            <span className="text-red-400 font-bold uppercase tracking-wider">
              [{topAlert.severity}] {topAlert.hazard}:
            </span>
            <span className="truncate text-slate-300">
              {topAlert.message || 'Elevated risk detected in active sector.'}
            </span>
          </div>
        )}

        {/* Right: Operating Mode Selector & Refresh */}
        <div className="flex items-center space-x-2">
          <div className="bg-slate-950/80 border border-slate-800 p-1 rounded-xl flex items-center space-x-1 text-xs font-mono font-semibold">
            <button
              onClick={() => setMode('CLOUD')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'CLOUD'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>CLOUD</span>
            </button>

            <button
              onClick={() => setMode('LOCAL_EDGE')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'LOCAL_EDGE'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>LOCAL EDGE</span>
            </button>

            <button
              onClick={() => setMode('DEGRADED')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'DEGRADED'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>DEGRADED</span>
            </button>

            <button
              onClick={() => setMode('NO_DATA')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all ${
                mode === 'NO_DATA'
                  ? 'bg-rose-500 text-slate-950 font-bold shadow-md shadow-rose-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <WifiOff className="w-3.5 h-3.5" />
              <span>NO DATA</span>
            </button>
          </div>

          <button
            onClick={handleRefresh}
            title="Reload System Telemetry"
            className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-400 hover:border-slate-700 flex items-center justify-center transition-colors"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Row 2: Horizontal Navigation Tabs */}
      <div className="h-11 px-6 bg-[#070B14] border-t border-slate-800/80 flex items-center space-x-8 text-xs font-bold font-mono">
        <button
          onClick={() => setActiveTab('map')}
          className={`h-full flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'map'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Map className="w-4 h-4" />
          <span>LIVE MAP</span>
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`h-full flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'simulation'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>SIMULATION</span>
        </button>

        <button
          onClick={() => setActiveTab('response')}
          className={`h-full flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'response'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>INCIDENT COMMAND</span>
          {activeAlertsCount > 0 && (
            <span className="bg-rose-500 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full">
              {activeAlertsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('sensors')}
          className={`h-full flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'sensors'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>SENSOR NETWORK</span>
        </button>

        <button
          onClick={() => setActiveTab('admin')}
          className={`h-full flex items-center space-x-2 border-b-2 transition-all ${
            activeTab === 'admin'
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>ADMIN HOTSPOTS</span>
        </button>
      </div>
    </header>
  );
};
