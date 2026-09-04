import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { simulationApi } from '../../services/simulationApi';
import { CompassDial } from '../../components/map/CompassDial';
import { RiskMap } from '../../components/map/RiskMap';
import {
  Play,
  RotateCcw,
  CloudRain,
  Flame,
  Mountain,
  Zap,
  Radio,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Compass,
  AlertTriangle,
  Info
} from 'lucide-react';

export const SimulationPage: React.FC = () => {
  const {
    sensors,
    hotspots,
    directedResult,
    setDirectedResult,
    mode
  } = useApp();

  // Directed Scenario Parameters
  const [eventType, setEventType] = useState<'heavy_rain' | 'flood' | 'landslide' | 'heatwave'>('heavy_rain');
  const [selectedSensorId, setSelectedSensorId] = useState<string>('');
  
  // Data Points
  const [rainfall, setRainfall] = useState<number>(45.0);
  const [windSpeed, setWindSpeed] = useState<number>(30.0);
  const [windDirection, setWindDirection] = useState<number>(225.0);
  const [temperature, setTemperature] = useState<number>(28.0);
  const [humidity, setHumidity] = useState<number>(75.0);

  const [loading, setLoading] = useState<boolean>(false);
  const [liveWeatherLoaded, setLiveWeatherLoaded] = useState<boolean>(false);

  // Auto-select first sensor when available
  useEffect(() => {
    if (sensors.length > 0 && !selectedSensorId) {
      setSelectedSensorId(sensors[0].id);
    }
  }, [sensors, selectedSensorId]);

  // Prefill live atmospheric conditions from WeatherProvider
  const handlePrefillLiveWeather = async () => {
    try {
      setLoading(true);
      const data = await simulationApi.getLiveWeather();
      if (data) {
        if (data.temperature !== undefined) setTemperature(Math.round(data.temperature * 10) / 10);
        if (data.humidity !== undefined) setHumidity(Math.round(data.humidity));
        if (data.rainfall !== undefined) setRainfall(Math.round(data.rainfall * 10) / 10);
        if (data.windSpeed !== undefined) setWindSpeed(Math.round(data.windSpeed * 10) / 10);
        if (data.windDirection !== undefined) setWindDirection(Math.round(data.windDirection));
        setLiveWeatherLoaded(true);
      }
    } catch (e) {
      console.warn('Live weather prefill failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunSimulation = async () => {
    if (hotspots.length === 0) {
      alert('Please draw at least one hotspot on the map before running propagation simulation.');
      return;
    }

    setLoading(true);
    try {
      const res = await simulationApi.runDirectedSimulation({
        eventType,
        sensorId: selectedSensorId || (sensors[0]?.id),
        dataPoints: {
          rainfallMmHr: rainfall,
          windSpeedKmh: windSpeed,
          windDirectionDeg: windDirection,
          temperatureC: temperature,
          humidityPct: humidity
        },
        mode
      });
      setDirectedResult(res);
    } catch (e) {
      console.error('Simulation execution failed', e);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    setDirectedResult(null);
    await simulationApi.resetSimulation();
  };

  const isHeatwave = eventType === 'heatwave';

  return (
    <div className="flex w-full h-full bg-[#0B0F19] text-slate-100 overflow-hidden select-none">
      {/* Left Control Panel */}
      <div className="w-[410px] bg-[#0E1526] border-r border-slate-800 p-4 h-full flex flex-col justify-between overflow-y-auto shrink-0 space-y-4 text-xs font-mono">
        <div className="space-y-4">
          {/* Header */}
          <div className="border-b border-slate-800 pb-3">
            <h2 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
              <Play className="w-4 h-4 text-cyan-400" />
              <span>DIRECTED HAZARD SIMULATOR</span>
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Directional Hazard Propagation & Next-Hotspot Machine Learning Predictor
            </p>
          </div>

          {/* 1. Event Type Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-300 font-bold flex items-center space-x-1">
              <span>1. TRIGGER EVENT TYPE</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'heavy_rain', label: 'Heavy Rain', icon: Zap, color: 'text-indigo-400 border-indigo-500/40' },
                { id: 'flood', label: 'Flood', icon: CloudRain, color: 'text-cyan-400 border-cyan-500/40' },
                { id: 'landslide', label: 'Landslide', icon: Mountain, color: 'text-rose-400 border-rose-500/40' },
                { id: 'heatwave', label: 'Heat Wave', icon: Flame, color: 'text-amber-400 border-amber-500/40' }
              ].map(item => {
                const Icon = item.icon;
                const active = eventType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setEventType(item.id as any)}
                    className={`py-2 px-2.5 rounded-xl border flex items-center space-x-2 transition-all ${
                      active
                        ? `bg-slate-900 ${item.color} shadow-lg ring-1 ring-cyan-400`
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="font-bold">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Source Sensor Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] text-slate-300 font-bold flex items-center space-x-1">
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              <span>2. SOURCE SENSOR ORIGIN</span>
            </label>
            {sensors.length === 0 ? (
              <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>No sensors placed yet. Click "Place Sensor" on the map toolbar to place one.</span>
              </div>
            ) : (
              <select
                value={selectedSensorId}
                onChange={e => setSelectedSensorId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 outline-none focus:border-cyan-500 font-mono text-xs"
              >
                {sensors.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.coordinates[0].toFixed(3)}°N, {s.coordinates[1].toFixed(3)}°E)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 3. Interactive Wind Direction Dial */}
          <div className={`p-3 rounded-2xl border transition-all ${
            isHeatwave
              ? 'bg-slate-950/40 border-slate-900 opacity-40'
              : 'bg-slate-900/90 border-slate-800'
          }`}>
            <CompassDial
              value={windDirection}
              onChange={setWindDirection}
              disabled={isHeatwave}
            />
            {isHeatwave && (
              <div className="text-[10px] text-amber-400 mt-2 text-center">
                Heatwaves do not propagate directionally by wind. Local intensity model active.
              </div>
            )}
          </div>

          {/* 4. Weather Data Points with Live Prefill */}
          <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                ATMOSPHERIC PARAMETERS
              </span>
              <button
                onClick={handlePrefillLiveWeather}
                disabled={loading}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-cyan-950 border border-cyan-700 text-cyan-300 hover:bg-cyan-900 flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>{liveWeatherLoaded ? 'LIVE WEATHER LOADED' : 'PREFILL LIVE WEATHER'}</span>
              </button>
            </div>

            {/* Rainfall Slider */}
            <div className={`space-y-1 ${isHeatwave ? 'opacity-30' : ''}`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Rainfall Intensity:</span>
                <span className="text-cyan-400 font-bold">{rainfall} mm/h</span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                disabled={isHeatwave}
                value={rainfall}
                onChange={e => setRainfall(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Wind Speed Slider */}
            <div className={`space-y-1 ${isHeatwave ? 'opacity-30' : ''}`}>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Wind Speed:</span>
                <span className="text-cyan-400 font-bold">{windSpeed} km/h</span>
              </div>
              <input
                type="range"
                min={0}
                max={90}
                step={2}
                disabled={isHeatwave}
                value={windSpeed}
                onChange={e => setWindSpeed(Number(e.target.value))}
                className="w-full accent-cyan-400"
              />
            </div>

            {/* Temperature Slider */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400">Ambient Temperature:</span>
                <span className="text-amber-400 font-bold">{temperature} °C</span>
              </div>
              <input
                type="range"
                min={15}
                max={48}
                step={0.5}
                value={temperature}
                onChange={e => setTemperature(Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>
          </div>

          {/* Run / Reset Action Buttons */}
          <div className="pt-1 flex items-center space-x-2">
            <button
              onClick={handleRunSimulation}
              disabled={loading || hotspots.length === 0}
              className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center space-x-2 text-xs shadow-lg transition-all ${
                hotspots.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              }`}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{loading ? 'PREDICTING...' : 'RUN SIMULATION'}</span>
            </button>

            {directedResult && (
              <button
                onClick={handleReset}
                className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Results: Top 3 Predicted Candidates */}
        {directedResult && directedResult.rankedCandidates?.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[10px] text-cyan-400 tracking-wider uppercase">
                TOP PREDICTED CANDIDATES ({directedResult.mode})
              </span>
              <span className="text-[10px] text-slate-500">
                Confidence: {Math.round((directedResult.confidence || 0.9) * 100)}%
              </span>
            </div>

            <div className="space-y-2">
              {directedResult.rankedCandidates.slice(0, 3).map((cand: any, idx: number) => {
                const rankColors = ['border-rose-500/50 bg-rose-950/20', 'border-amber-500/50 bg-amber-950/20', 'border-yellow-500/40 bg-slate-900'];
                return (
                  <div
                    key={cand.hotspotId}
                    className={`p-2.5 rounded-xl border ${rankColors[idx] || 'border-slate-800 bg-slate-900'} space-y-1.5`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] font-black flex items-center justify-center text-cyan-400">
                          #{idx + 1}
                        </span>
                        <span className="font-bold text-slate-100 text-[11px] truncate max-w-[170px]">{cand.name}</span>
                      </div>
                      <span className="font-bold text-rose-400 text-xs">{cand.probability}%</span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Bearing: <strong className="text-slate-200">{cand.bearingDeg}°</strong></span>
                      <span>Dist: <strong className="text-slate-200">{cand.distanceKm}km</strong></span>
                      {cand.etaText && <span>ETA: <strong className="text-amber-300">{cand.etaText}</strong></span>}
                      <span className="uppercase text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-300">{cand.hazardTag}</span>
                    </div>

                    {/* XAI Factor Attribution */}
                    {cand.factors && cand.factors.length > 0 && (
                      <div className="pt-1 text-[9px] text-slate-400 border-t border-slate-800/60 flex items-center space-x-2">
                        {cand.factors.map((f: any) => (
                          <span key={f.name} className="truncate">
                            {f.name}: <strong className="text-cyan-300">{f.contributionPct}%</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right Map Canvas */}
      <div className="flex-1 h-full relative">
        <RiskMap />
      </div>
    </div>
  );
};
