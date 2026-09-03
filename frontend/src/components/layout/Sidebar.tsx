import React from 'react';
import { Map, Play, ShieldAlert, Cpu, Settings, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type TabType = 'map' | 'simulation' | 'response' | 'sensors' | 'admin';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { simulation, alerts } = useApp();

  const unackAlerts = alerts.filter(a => !a.acknowledged).length;

  const navItems: { id: TabType; label: string; icon: any; badge?: string | number }[] = [
    { id: 'map', label: 'Live Map', icon: Map },
    { id: 'simulation', label: 'Simulation', icon: Play, badge: simulation.active ? 'LIVE' : undefined },
    { id: 'response', label: 'Incident Response', icon: ShieldAlert, badge: unackAlerts > 0 ? unackAlerts : undefined },
    { id: 'sensors', label: 'Sensor Network', icon: Cpu },
    { id: 'admin', label: 'Admin Hotspots', icon: Settings }
  ];

  return (
    <aside className="w-64 bg-[#0A0E18] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none z-20">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono text-slate-500 tracking-wider uppercase">
          Command Operations
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-md shadow-cyan-500/5'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold rounded ${
                  item.id === 'simulation' && simulation.active
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* System Mode Footer Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 font-mono text-[10px] text-slate-400 space-y-1">
        <div className="flex justify-between items-center text-slate-500">
          <span>PLATFORM VER:</span>
          <span className="text-slate-300">v1.2.0-hyperlocal</span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>LATENCY:</span>
          <span className="text-emerald-400 font-bold">14 ms (Edge)</span>
        </div>
        <div className="flex justify-between items-center text-slate-500">
          <span>DATA INTEGRITY:</span>
          <span className="text-cyan-400 font-bold">99.4 %</span>
        </div>
      </div>
    </aside>
  );
};
