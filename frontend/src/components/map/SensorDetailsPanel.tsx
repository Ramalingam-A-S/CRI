import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Cpu, Activity, Battery, Signal, CheckCircle2, AlertOctagon } from 'lucide-react';

export const SensorDetailsPanel: React.FC = () => {
  const { selectedSensor, setSelectedSensor } = useApp();

  if (!selectedSensor) return null;

  const { telemetry } = selectedSensor;

  return (
    <div className="w-96 bg-[#0E1526]/95 border-l border-slate-800/80 p-4 h-full flex flex-col justify-between overflow-y-auto shrink-0 select-none text-xs text-slate-200 backdrop-blur z-20">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <h2 className="font-bold text-sm text-slate-100">{selectedSensor.name}</h2>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{selectedSensor.code} - {selectedSensor.locationName}</p>
          </div>
          <button onClick={() => setSelectedSensor(null)} className="p-1 text-slate-400 hover:text-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Anomaly Banner if detected */}
        {selectedSensor.anomalyDetected && (
          <div className="bg-red-950/60 border border-red-500/50 p-3 rounded-lg text-xs space-y-1">
            <div className="flex items-center space-x-2 font-bold text-red-400 font-mono">
              <AlertOctagon className="w-4 h-4" />
              <span>ANOMALY DETECTED: {selectedSensor.anomalyType}</span>
            </div>
            <p className="text-[11px] text-red-200">{selectedSensor.anomalyDescription}</p>
          </div>
        )}

        {/* Sensor Health Metrics */}
        <div className="grid grid-cols-3 gap-2 text-center font-mono">
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
            <div className="text-[9px] text-slate-400">BATTERY</div>
            <div className={`font-bold text-base ${telemetry.battery < 40 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {telemetry.battery}%
            </div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
            <div className="text-[9px] text-slate-400">SIGNAL</div>
            <div className="font-bold text-base text-cyan-400">{telemetry.signalStrength}%</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-lg">
            <div className="text-[9px] text-slate-400">DATA QUALITY</div>
            <div className="font-bold text-base text-cyan-400">{telemetry.dataQuality}%</div>
          </div>
        </div>

        {/* Current Telemetry Measurements Grid */}
        <div className="space-y-2">
          <h3 className="font-mono font-bold text-[11px] text-slate-400 uppercase tracking-wider">
            Live Telemetry Readings
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex justify-between">
              <span className="text-slate-400">Temp:</span>
              <span className="font-bold text-slate-100">{telemetry.temperature} °C</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex justify-between">
              <span className="text-slate-400">Humidity:</span>
              <span className="font-bold text-slate-100">{telemetry.humidity} %</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex justify-between">
              <span className="text-slate-400">Rainfall:</span>
              <span className="font-bold text-cyan-400">{telemetry.rainfall} mm/h</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex justify-between">
              <span className="text-slate-400">Water Level:</span>
              <span className="font-bold text-cyan-400">{telemetry.waterLevel} cm</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex justify-between">
              <span className="text-slate-400">Soil Moisture:</span>
              <span className="font-bold text-slate-100">{telemetry.soilMoisture} %</span>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-lg flex justify-between">
              <span className="text-slate-400">Pressure:</span>
              <span className="font-bold text-slate-100">{telemetry.pressure} hPa</span>
            </div>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 font-mono flex justify-between">
        <span>Last Sensor Transmission:</span>
        <span>{new Date(selectedSensor.lastUpdate).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};
