import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, UserCheck, ThumbsUp, ShieldCheck, AlertTriangle } from 'lucide-react';

export const CitizenReportDetailsPanel: React.FC = () => {
  const { selectedReport, setSelectedReport, updateReportStatus } = useApp();

  if (!selectedReport) return null;

  return (
    <div className="w-96 bg-[#0E1526]/95 border-l border-slate-800/80 p-4 h-full flex flex-col justify-between overflow-y-auto shrink-0 select-none text-xs text-slate-200 backdrop-blur z-20">
      <div className="space-y-4">
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-sm text-slate-100">{selectedReport.type}</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedReport.locationName}</p>
          </div>
          <button onClick={() => setSelectedReport(null)} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3 rounded-lg space-y-2">
          <div className="flex justify-between items-center font-mono">
            <span className="text-slate-400">VERIFICATION:</span>
            <span className={`px-2 py-0.5 rounded font-bold ${
              selectedReport.verificationStatus === 'VERIFIED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              selectedReport.verificationStatus === 'UNDER_REVIEW' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-slate-800 text-slate-400'
            }`}>
              {selectedReport.verificationStatus}
            </span>
          </div>
          <div className="flex justify-between items-center font-mono text-[11px]">
            <span className="text-slate-400">CITIZEN UPVOTES:</span>
            <span className="font-bold text-cyan-400 flex items-center space-x-1">
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>{selectedReport.upvotes} Confirmations</span>
            </span>
          </div>
        </div>

        <div className="space-y-1.5">
          <h3 className="font-mono font-bold text-[11px] text-slate-400 uppercase tracking-wider">
            Citizen Observation Details
          </h3>
          <p className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg text-slate-300 leading-relaxed font-sans">
            {selectedReport.description}
          </p>
        </div>

        {/* Verification Triage Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-800 font-mono text-xs">
          <div className="text-slate-400 text-[10px]">COMMAND CENTER TRIAGE ACTION:</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateReportStatus(selectedReport.id, 'VERIFIED')}
              className="bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/50 text-emerald-300 py-1.5 rounded flex items-center justify-center space-x-1 font-bold"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>VERIFY REPORT</span>
            </button>
            <button
              onClick={() => updateReportStatus(selectedReport.id, 'REJECTED')}
              className="bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/50 text-rose-300 py-1.5 rounded flex items-center justify-center space-x-1 font-bold"
            >
              <X className="w-3.5 h-3.5" />
              <span>REJECT REPORT</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
