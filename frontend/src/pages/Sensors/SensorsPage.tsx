import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sensor } from '../../types';
import { Cpu, Activity, Battery, Signal, AlertOctagon, Search, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const SensorsPage: React.FC = () => {
  const { sensors } = useApp();
  const [selectedSensorId, setSelectedSensorId] = useState<string>(sensors[0]?.id || 'sens-001');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const selectedSensor = sensors.find(s => s.id === selectedSensorId) || sensors[0];

  const filteredSensors = sensors.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex w-full h-full bg-[#0B0F19] text-slate-100 overflow-hidden select-none">
      {/* Left Sensor Station List */}
      <div className="w-96 bg-[#0E1526] border-r border-slate-800/80 p-4 h-full flex flex-col justify-between overflow-y-auto shrink-0 space-y-4 text-xs">
        <div className="space-y-3">
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>IOT SENSOR NETWORK</span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
              Urban Traffic-Light & Micro-Environmental Telemetry Nodes
            </p>
          </div>

          {/* Search & Filter */}
          <div className="space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search station name or code..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex items-center space-x-1 font-mono text-[10px]">
              {['ALL', 'ONLINE', 'DEGRADED', 'OFFLINE'].map(st => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded border transition-colors ${
                    statusFilter === st
                      ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40 font-bold'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Sensor Cards List */}
          <div className="space-y-2 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {filteredSensors.map(s => {
              const isSelected = s.id === selectedSensorId;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSensorId(s.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-lg shadow-cyan-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-xs text-slate-100">{s.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{s.code} - {s.primaryHazard}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      s.status === 'ONLINE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                      s.status === 'DEGRADED' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}>
                      {s.status}
                    </span>
                  </div>

                  {s.anomalyDetected && (
                    <div className="mt-2 text-[10px] text-rose-400 font-mono flex items-center space-x-1">
                      <AlertOctagon className="w-3 h-3 text-rose-400 shrink-0" />
                      <span className="truncate">ANOMALY: {s.anomalyType}</span>
                    </div>
                  )}

                  <div className="mt-2 grid grid-cols-3 gap-1 text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2">
                    <div>Bat: <span className="text-slate-200 font-bold">{s.telemetry.battery}%</span></div>
                    <div>Sig: <span className="text-slate-200 font-bold">{s.telemetry.signalStrength}%</span></div>
                    <div>Rain: <span className="text-cyan-400 font-bold">{s.telemetry.rainfall}</span></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Detailed Telemetry View */}
      {selectedSensor && (
        <div className="flex-1 h-full p-6 overflow-y-auto space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-bold text-slate-100">{selectedSensor.name}</h1>
                <span className="bg-cyan-500/20 text-cyan-300 px-2.5 py-0.5 rounded font-mono text-xs border border-cyan-500/30">
                  {selectedSensor.code}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">{selectedSensor.locationName}</p>
            </div>
            <div className="text-right font-mono text-xs">
              <div className="text-slate-400">LAST TELEMETRY UPDATE</div>
              <div className="text-slate-100 font-bold">{new Date(selectedSensor.lastUpdate).toLocaleString()}</div>
            </div>
          </div>

          {/* Health & Status Indicators */}
          <div className="grid grid-cols-4 gap-4 font-mono">
            <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 text-xs flex items-center justify-between">
                <span>STATION STATUS</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-emerald-400">{selectedSensor.status}</div>
            </div>
            <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 text-xs flex items-center justify-between">
                <span>BATTERY HEALTH</span>
                <Battery className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-lg font-bold text-slate-100">{selectedSensor.telemetry.battery}%</div>
            </div>
            <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 text-xs flex items-center justify-between">
                <span>SIGNAL STRENGTH</span>
                <Signal className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-slate-100">{selectedSensor.telemetry.signalStrength}%</div>
            </div>
            <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-1">
              <div className="text-slate-400 text-xs flex items-center justify-between">
                <span>DATA QUALITY INDEX</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-lg font-bold text-cyan-400">{selectedSensor.telemetry.dataQuality}%</div>
            </div>
          </div>

          {/* Telemetry Charts using Recharts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Rainfall & Water Level Chart */}
            <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="font-mono font-bold text-xs text-slate-300 uppercase">
                Rainfall & Water Level Inundation History
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSensor.history.length > 0 ? selectedSensor.history : [selectedSensor.telemetry]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="timestamp" stroke="#64748B" tickFormatter={t => new Date(t).toLocaleTimeString()} />
                    <YAxis stroke="#64748B" />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="rainfall" name="Rainfall (mm/h)" stroke="#06B6D4" strokeWidth={2} />
                    <Line type="monotone" dataKey="waterLevel" name="Water Level (cm)" stroke="#EF4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Temperature & Humidity Chart */}
            <div className="bg-[#0E1526] border border-slate-800 p-4 rounded-xl space-y-3">
              <div className="font-mono font-bold text-xs text-slate-300 uppercase">
                Thermal & Humidity Progression
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedSensor.history.length > 0 ? selectedSensor.history : [selectedSensor.telemetry]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                    <XAxis dataKey="timestamp" stroke="#64748B" tickFormatter={t => new Date(t).toLocaleTimeString()} />
                    <YAxis stroke="#64748B" />
                    <Tooltip contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px' }} />
                    <Line type="monotone" dataKey="temperature" name="Temp (°C)" stroke="#F59E0B" strokeWidth={2} />
                    <Line type="monotone" dataKey="soilMoisture" name="Soil Moisture (%)" stroke="#10B981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
