import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { HazardHotspot, HazardType } from '../../types';
import { Settings, Plus, Edit2, Trash2, CheckCircle2, XCircle, ShieldAlert, Cpu } from 'lucide-react';

export const AdminPage: React.FC = () => {
  const { hotspots, createHotspot, updateHotspot, deleteHotspot, toggleHotspot, sensors } = useApp();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [hazardType, setHazardType] = useState<HazardType>('FLOOD');
  const [baselineRisk, setBaselineRisk] = useState<number>(60);
  const [notes, setNotes] = useState('');
  const [assignedSensors, setAssignedSensors] = useState<string[]>(['sens-001']);
  const [factorsInput, setFactorsInput] = useState('Low-lying basin, High stormwater runoff');
  
  const [rainfallThreshold, setRainfallThreshold] = useState(35);
  const [waterLevelThreshold, setWaterLevelThreshold] = useState(50);
  const [tempThreshold, setTempThreshold] = useState(40);
  const [soilThreshold, setSoilThreshold] = useState(85);

  const resetForm = () => {
    setName('');
    setHazardType('FLOOD');
    setBaselineRisk(60);
    setNotes('');
    setAssignedSensors(['sens-001']);
    setFactorsInput('Low-lying basin, High stormwater runoff');
    setRainfallThreshold(35);
    setWaterLevelThreshold(50);
    setTempThreshold(40);
    setSoilThreshold(85);
    setEditingId(null);
    setIsDrawerOpen(false);
  };

  const handleEditClick = (h: HazardHotspot) => {
    setEditingId(h.id);
    setName(h.name);
    setHazardType(h.hazardType);
    setBaselineRisk(h.baselineRisk);
    setNotes(h.notes || '');
    setAssignedSensors(h.sensorIds);
    setFactorsInput(h.factors.join(', '));
    setRainfallThreshold(h.thresholds.rainfallWarningMm);
    setWaterLevelThreshold(h.thresholds.waterLevelWarningCm);
    setTempThreshold(h.thresholds.temperatureWarningC);
    setSoilThreshold(h.thresholds.soilMoistureWarningPct);
    setIsDrawerOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const factors = factorsInput.split(',').map(s => s.trim()).filter(Boolean);

    // Default polygon geometry around Central Underpass area
    const dummyGeometry: HazardHotspot['geometry'] = {
      type: 'Polygon',
      coordinates: [[
        [12.9780, 77.5920],
        [12.9820, 77.5990],
        [12.9750, 77.6040],
        [12.9700, 77.5960],
        [12.9780, 77.5920]
      ]]
    };

    const dataPayload = {
      name,
      hazardType,
      geometry: dummyGeometry,
      baselineRisk: Number(baselineRisk),
      factors,
      thresholds: {
        rainfallWarningMm: Number(rainfallThreshold),
        waterLevelWarningCm: Number(waterLevelThreshold),
        temperatureWarningC: Number(tempThreshold),
        soilMoistureWarningPct: Number(soilThreshold)
      },
      sensorIds: assignedSensors,
      active: true,
      notes
    };

    if (editingId) {
      await updateHotspot(editingId, dataPayload);
    } else {
      await createHotspot(dataPayload);
    }

    resetForm();
  };

  return (
    <div className="flex w-full h-full bg-[#0B0F19] text-slate-100 overflow-hidden select-none p-6 space-x-6">
      {/* Hotspots Data Table View */}
      <div className="flex-1 bg-[#0E1526] border border-slate-800 rounded-xl p-5 flex flex-col justify-between overflow-hidden space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              <span>ADMIN HAZARD HOTSPOT MANAGEMENT</span>
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Define, configure, enable/disable, and calibrate municipal hazard micro-zones
            </p>
          </div>
          <button
            onClick={() => { resetForm(); setIsDrawerOpen(true); }}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-xs rounded-lg shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE NEW HOTSPOT</span>
          </button>
        </div>

        {/* Hotspots List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {hotspots.map(h => (
            <div key={h.id} className="bg-slate-900/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
              <div className="space-y-1 max-w-xl">
                <div className="flex items-center space-x-3">
                  <span className="font-bold text-sm text-slate-100">{h.name}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    h.hazardType === 'FLOOD' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' :
                    h.hazardType === 'HEAT' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    h.hazardType === 'LANDSLIDE' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                    'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}>
                    {h.hazardType}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    h.active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {h.active ? 'ACTIVE' : 'DISABLED'}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px]">
                  Baseline Risk: <strong className="text-slate-200">{h.baselineRisk}/100</strong> | Assigned Sensors: <strong className="text-cyan-400">{h.sensorIds.join(', ')}</strong>
                </div>
                <div className="text-slate-400 text-[10px] italic">
                  Factors: {h.factors.join(' • ')}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => toggleHotspot(h.id)}
                  className={`px-2.5 py-1.5 rounded border text-[11px] font-bold ${
                    h.active ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  }`}
                >
                  {h.active ? 'DISABLE' : 'ENABLE'}
                </button>
                <button
                  onClick={() => handleEditClick(h)}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteHotspot(h.id)}
                  className="p-2 bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/30 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Drawer / Editor Form */}
      {isDrawerOpen && (
        <div className="w-[420px] bg-[#0E1526] border border-slate-800 rounded-xl p-5 overflow-y-auto space-y-4 text-xs font-sans shrink-0">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-100 font-mono uppercase">
              {editingId ? 'Edit Hazard Hotspot' : 'Create New Hazard Hotspot'}
            </h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-200">
              <XCircle className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Hotspot Name:</label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Central Metro Underpass Basin"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Hazard Type:</label>
                <select
                  value={hazardType}
                  onChange={e => setHazardType(e.target.value as HazardType)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                >
                  <option value="FLOOD">FLOOD</option>
                  <option value="HEAT">HEAT</option>
                  <option value="LANDSLIDE">LANDSLIDE</option>
                  <option value="STORM">STORM</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Baseline Risk (0-100):</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={baselineRisk}
                  onChange={e => setBaselineRisk(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Contributing Factors (comma separated):</label>
              <input
                type="text"
                value={factorsInput}
                onChange={e => setFactorsInput(e.target.value)}
                placeholder="Low elevation, Silt buildup, High runoff"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            {/* Threshold Configuration */}
            <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-2 font-mono">
              <div className="text-[10px] text-slate-400 font-bold uppercase">Sensor Warning Thresholds</div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400">Rainfall (mm/h):</label>
                  <input
                    type="number"
                    value={rainfallThreshold}
                    onChange={e => setRainfallThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400">Water Level (cm):</label>
                  <input
                    type="number"
                    value={waterLevelThreshold}
                    onChange={e => setWaterLevelThreshold(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-slate-300 font-medium">Notes & Municipal Directives:</label>
              <textarea
                rows={2}
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Special notes for emergency dispatchers..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold rounded-lg shadow-lg shadow-cyan-500/20 text-xs uppercase"
            >
              {editingId ? 'PUBLISH UPDATED HOTSPOT' : 'PUBLISH NEW HOTSPOT'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
