import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Building2, Zap, Phone, Shield } from 'lucide-react';

export const InfraDetailsPanel: React.FC = () => {
  const { selectedInfra, setSelectedInfra } = useApp();

  if (!selectedInfra) return null;

  return (
    <div className="w-96 bg-[#0E1526]/95 border-l border-slate-800/80 p-4 h-full flex flex-col justify-between overflow-y-auto shrink-0 select-none text-xs text-slate-200 backdrop-blur z-20">
      <div className="space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <h2 className="font-bold text-sm text-slate-100">{selectedInfra.name}</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedInfra.type}</p>
          </div>
          <button onClick={() => setSelectedInfra(null)} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg space-y-2 font-mono">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">OPERATIONAL STATUS:</span>
            <span className="font-bold text-emerald-400">{selectedInfra.status}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">EXPOSURE SEVERITY:</span>
            <span className={`font-bold ${
              selectedInfra.currentExposureSeverity === 'CRITICAL' ? 'text-red-400' : 'text-amber-400'
            }`}>
              {selectedInfra.currentExposureSeverity}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-400">BACKUP POWER:</span>
            <span className={selectedInfra.backupPower ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
              {selectedInfra.backupPower ? 'READY (Generator)' : 'NO BACKUP'}
            </span>
          </div>
        </div>

        {selectedInfra.capacityDetails && (
          <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-1">
            <div className="text-[10px] text-slate-400 font-mono">CAPACITY & SPECS</div>
            <div className="font-semibold text-slate-100">{selectedInfra.capacityDetails}</div>
          </div>
        )}

        <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-1 font-mono">
          <div className="text-[10px] text-slate-400">CONTACT EMERGENCY DESK</div>
          <div className="font-bold text-cyan-400">{selectedInfra.contactNumber}</div>
        </div>
      </div>
    </div>
  );
};
