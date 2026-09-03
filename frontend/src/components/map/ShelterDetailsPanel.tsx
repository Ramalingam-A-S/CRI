import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Home, Users, CheckCircle, Phone } from 'lucide-react';

export const ShelterDetailsPanel: React.FC = () => {
  const { selectedShelter, setSelectedShelter } = useApp();

  if (!selectedShelter) return null;

  const occupancyPct = Math.round((selectedShelter.occupancy / selectedShelter.capacity) * 100);

  return (
    <div className="w-96 bg-[#0E1526]/95 border-l border-slate-800/80 p-4 h-full flex flex-col justify-between overflow-y-auto shrink-0 select-none text-xs text-slate-200 backdrop-blur z-20">
      <div className="space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Home className="w-4 h-4 text-emerald-400" />
              <h2 className="font-bold text-sm text-slate-100">{selectedShelter.name}</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedShelter.locationName}</p>
          </div>
          <button onClick={() => setSelectedShelter(null)} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Occupancy Progress Bar */}
        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg space-y-2">
          <div className="flex justify-between items-center font-mono text-xs">
            <span className="text-slate-400">SHELTER OCCUPANCY:</span>
            <span className="font-bold text-emerald-400">{selectedShelter.occupancy} / {selectedShelter.capacity} ({occupancyPct}%)</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all ${
                occupancyPct > 90 ? 'bg-rose-500' : occupancyPct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${occupancyPct}%` }}
            ></div>
          </div>
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 pt-1">
            <span>Availability: <strong className="text-slate-200">{selectedShelter.availability}</strong></span>
            <span>Risk Level: <strong className="text-emerald-400">{selectedShelter.currentRisk}</strong></span>
          </div>
        </div>

        {/* Services List */}
        <div className="space-y-2">
          <h3 className="font-mono font-bold text-[11px] text-slate-400 uppercase tracking-wider">
            Available Shelter Services
          </h3>
          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            {selectedShelter.services.map((svc, idx) => (
              <div key={idx} className="bg-slate-900/60 border border-slate-800 p-2 rounded flex items-center space-x-1.5 text-slate-300">
                <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                <span>{svc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Contact info */}
        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-1 font-mono text-[11px]">
          <div className="text-[10px] text-slate-400">SHELTER MANAGER CONTACT</div>
          <div className="font-bold text-slate-100">{selectedShelter.contactPerson}</div>
          <div className="text-cyan-400">{selectedShelter.contactPhone}</div>
        </div>
      </div>
    </div>
  );
};
