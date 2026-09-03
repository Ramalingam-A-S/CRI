import React from 'react';
import { useApp } from '../../context/AppContext';
import { RiskMap } from '../../components/map/RiskMap';
import { RiskDetailsPanel } from '../../components/map/RiskDetailsPanel';
import { SensorDetailsPanel } from '../../components/map/SensorDetailsPanel';
import { InfraDetailsPanel } from '../../components/map/InfraDetailsPanel';
import { ShelterDetailsPanel } from '../../components/map/ShelterDetailsPanel';
import { CitizenReportDetailsPanel } from '../../components/map/CitizenReportDetailsPanel';

export const LiveMapPage: React.FC = () => {
  const { routingActive, setRoutingActive, routeOrigin, routeDestination, analyzeRoute } = useApp();

  return (
    <div className="flex w-full h-full relative overflow-hidden bg-[#090D16]">
      {/* Primary Map View */}
      <div className="flex-1 h-full relative">
        <RiskMap />
        
        {/* Routing Overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-slate-900 border border-slate-700 p-4 rounded-lg shadow-2xl flex items-center space-x-4">
            <div className="text-sm font-bold text-slate-300">
                DYNAMIC ROUTING
            </div>
            <button 
                onClick={() => setRoutingActive(!routingActive)}
                className={`px-3 py-1 rounded text-xs font-bold ${routingActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'}`}
            >
                {routingActive ? 'MAP CLICKS ENABLED' : 'ENABLE MAP CLICKS'}
            </button>
            <div className="flex flex-col text-[10px] font-mono text-slate-400">
                <span>Origin: {routeOrigin ? 'SET' : 'PENDING'}</span>
                <span>Dest: {routeDestination ? 'SET' : 'PENDING'}</span>
            </div>
            <button 
                onClick={analyzeRoute}
                disabled={!routeOrigin || !routeDestination}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-black text-sm rounded transition"
            >
                ANALYZE ROUTE
            </button>
        </div>
      </div>

      {/* Contextual Side Details Panels */}
      <RiskDetailsPanel />
      <SensorDetailsPanel />
      <InfraDetailsPanel />
      <ShelterDetailsPanel />
      <CitizenReportDetailsPanel />
    </div>
  );
};
