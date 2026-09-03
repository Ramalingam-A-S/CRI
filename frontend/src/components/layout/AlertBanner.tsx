import React from 'react';
import { useApp } from '../../context/AppContext';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

export const AlertBanner: React.FC = () => {
  const { alerts, acknowledgeAlert, dismissAlert } = useApp();

  const criticalAlerts = alerts.filter(a => !a.acknowledged);

  if (criticalAlerts.length === 0) return null;

  const topAlert = criticalAlerts[0];

  return (
    <div className="bg-gradient-to-r from-red-950/90 via-rose-900/90 to-red-950/90 border-b border-red-500/50 px-4 py-2 text-xs flex items-center justify-between text-rose-100 shrink-0 shadow-lg shadow-red-950/50 z-20">
      <div className="flex items-center space-x-3 overflow-hidden">
        <span className="flex h-2.5 w-2.5 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
        </span>
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="font-mono font-bold text-red-400 uppercase tracking-wider text-[11px] shrink-0">
          [{topAlert.level} - {topAlert.hazard}]
        </span>
        <span className="font-semibold text-slate-100 truncate">{topAlert.title}:</span>
        <span className="text-slate-300 truncate">{topAlert.message}</span>
      </div>

      <div className="flex items-center space-x-2 shrink-0 font-mono text-[11px]">
        <button
          onClick={() => acknowledgeAlert(topAlert.id)}
          className="bg-red-500/30 hover:bg-red-500/50 text-red-200 border border-red-500/50 px-2.5 py-1 rounded flex items-center space-x-1.5 transition-colors"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          <span>ACKNOWLEDGE</span>
        </button>
        <button
          onClick={() => dismissAlert(topAlert.id)}
          className="p-1 text-slate-400 hover:text-slate-200"
          title="Dismiss Alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
