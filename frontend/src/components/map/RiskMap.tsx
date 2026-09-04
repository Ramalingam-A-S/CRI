import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { RiskArea } from '../../types';
import { Filter } from 'lucide-react';

// Custom pulsing radar dot for sensors/hotspots
const createRadarIcon = (color: string) => {
  return L.divIcon({
    className: 'radar-marker-icon',
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; border: 2px dashed ${color}; opacity: 0.85; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 0 12px ${color};"></div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export const RiskMap: React.FC = () => {
  const {
    riskAreas,
    sensors,
    hotspots,
    assessment,
    setSelectedZone,
    setSelectedSensor
  } = useApp();

  const [hazardFilter, setHazardFilter] = useState<string>('ALL');

  // Polygon styling per severity and isPredicted status
  const getPolygonStyle = (area: RiskArea) => {
    let color = '#10B981'; // LOW (0-32)
    if (area.severity === 'CRITICAL' || area.riskScore >= 85) color = '#EF4444'; // CRITICAL
    else if (area.severity === 'HIGH' || area.riskScore >= 66) color = '#F97316'; // HIGH
    else if (area.severity === 'MODERATE' || area.riskScore >= 33) color = '#F59E0B'; // MODERATE

    return {
      color: color,
      weight: area.isPredicted ? 3 : 2.5,
      dashArray: area.isPredicted ? '8, 8' : undefined,
      fillColor: color,
      fillOpacity: area.isPredicted ? 0.35 : 0.55
    };
  };

  const filteredAreas = riskAreas.filter(a => {
    if (hazardFilter === 'ALL') return true;
    return a.hazardType.toUpperCase() === hazardFilter;
  });

  return (
    <div className="relative w-full h-full bg-[#070B14] overflow-hidden">
      {/* Top Overlays: Hazard Filter & Live Dominant Hazard Stats */}
      <div className="absolute top-4 left-5 right-5 z-[1000] pointer-events-none flex items-center justify-between">
        {/* Left: Hazard Filter Bar */}
        <div className="pointer-events-auto bg-[#0A1120]/90 border border-slate-800/90 backdrop-blur-md px-3.5 py-2 rounded-2xl flex items-center space-x-2.5 shadow-2xl">
          <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-xs font-bold uppercase tracking-wider pr-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>HAZARD FILTER:</span>
          </div>
          {(['ALL', 'FLOOD', 'HEAT', 'LANDSLIDE', 'STORM']).map(h => (
            <button
              key={h}
              onClick={() => setHazardFilter(h)}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                hazardFilter === h
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              {h}
            </button>
          ))}
        </div>

        {/* Right: Dominant Hazard Scorecard */}
        <div className="pointer-events-auto bg-[#0A1120]/90 border border-slate-800/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center space-x-5 shadow-2xl font-mono text-xs">
          <div>
            <span className="text-[10px] text-slate-500 font-bold tracking-wider block uppercase">
              DOMINANT HAZARD
            </span>
            <span className="font-bold text-slate-100 uppercase">
              {assessment?.hazard || 'FLOOD'}
            </span>
          </div>

          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider block uppercase">
              RISK SCORE
            </span>
            <span className="font-bold text-amber-400">
              {assessment?.riskScore || 100} / 100
            </span>
          </div>

          <div className="border-l border-slate-800 pl-4">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider block uppercase">
              CONFIDENCE
            </span>
            <span className="font-bold text-cyan-400">
              {Math.round((assessment?.confidence || 0.4) * 100)}%
            </span>
          </div>

          <div className="border-l border-slate-800 pl-4">
            <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm">
              {assessment?.severity || 'CRITICAL'}
            </span>
          </div>
        </div>
      </div>

      {/* Primary Leaflet Map Container */}
      <MapContainer
        center={[13.0450, 80.2300]}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#070B14' }}
        zoomControl={false}
      >
        {/* Native Dark Slate Basemap (Esri Dark Gray Canvas - Zero Rate Limits, No Blackspots, No Watermarks) */}
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          maxZoom={16}
        />
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
          maxZoom={16}
        />

        {/* Spatial Risk Polygons */}
        {filteredAreas.map(area => (
          <Polygon
            key={area.id}
            positions={area.geometry.coordinates[0]}
            pathOptions={getPolygonStyle(area)}
            eventHandlers={{
              click: () => setSelectedZone(area)
            }}
          >
            <Popup className="custom-dark-popup">
              <div className="p-1 space-y-1 font-sans text-slate-200">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>{area.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    area.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400 border border-red-500/40' :
                    area.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40' : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  }`}>
                    {area.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono">
                  Risk Score: {area.riskScore}/100 | Confidence: {(area.confidence * 100).toFixed(0)}%
                </div>
                <div className="text-[10px] text-cyan-400 font-mono font-semibold">
                  Status: {area.isPredicted ? 'PREDICTED NEXT AFFECTED' : 'CURRENTLY AFFECTED'}
                </div>
              </div>
            </Popup>
          </Polygon>
        ))}

        {/* Sensor & Hotspot Radar Markers */}
        {sensors.map(s => {
          let dotColor = '#10B981'; // Green default
          if (s.primaryHazard === 'FLOOD') dotColor = '#3B82F6';
          else if (s.primaryHazard === 'STORM') dotColor = '#F59E0B';
          else if (s.primaryHazard === 'HEAT') dotColor = '#EF4444';
          return (
            <Marker
              key={s.id}
              position={s.coordinates}
              icon={createRadarIcon(dotColor)}
              eventHandlers={{
                click: () => setSelectedSensor(s)
              }}
            >
              <Popup>
                <div className="font-sans text-xs text-slate-200">
                  <div className="font-bold text-cyan-400">{s.name}</div>
                  <div className="text-[11px] text-slate-400">Hazard: {s.primaryHazard} | Status: {s.status}</div>
                  <div className="text-[10px] font-mono text-emerald-400">Quality: {s.telemetry?.dataQuality || 95}%</div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Registered Vulnerability Hotspots */}
        {hotspots.map(h => {
          const coords = h.geometry?.coordinates?.[0]?.[0] || [13.0, 80.2];
          return (
            <CircleMarker
              key={h.id}
              center={[coords[0], coords[1]]}
              radius={18}
              pathOptions={{
                color: '#EF4444',
                dashArray: '4, 4',
                fillColor: '#EF4444',
                fillOpacity: 0.25,
                weight: 2
              }}
            >
              <Popup>
                <div className="font-sans text-xs">
                  <div className="font-bold text-red-400">{h.name}</div>
                  <div className="text-[11px] text-slate-300">Hazard: {h.hazardType} | Baseline: {h.baselineRisk}</div>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}
      </MapContainer>

      {/* Floating Bottom-Left Risk Severity Scale (Matches Image 1) */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-[#0A1120]/95 border border-slate-800/90 p-4 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono select-none">
        <div className="text-slate-400 font-bold uppercase text-[10px] tracking-wider mb-3">
          RISK SEVERITY SCALE
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px]">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] shadow-sm shadow-emerald-500/50"></span>
            <span className="text-slate-300">LOW (0 - 32)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] shadow-sm shadow-amber-500/50"></span>
            <span className="text-slate-300">MODERATE (33 - 65)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#F97316] shadow-sm shadow-orange-500/50"></span>
            <span className="text-slate-300">HIGH (66 - 84)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] shadow-sm shadow-red-500/50"></span>
            <span className="text-slate-300">CRITICAL (85+)</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center space-x-5 text-[10px] text-slate-400">
          <div className="flex items-center space-x-2">
            <span className="w-5 h-0.5 bg-cyan-400 inline-block"></span>
            <span>Current Area (Solid)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-5 h-0.5 border-b-2 border-dashed border-cyan-400 inline-block"></span>
            <span>Predicted Next (Dashed)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
