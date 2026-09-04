import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  Marker,
  Popup,
  Rectangle,
  useMapEvents
} from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { Filter, PenTool, MapPin, Trash2, CheckCircle, X, ShieldAlert, Mountain, Compass, Wind } from 'lucide-react';

// Sadasiva Sankarapuram Region Constants
const REGION_CENTER: [number, number] = [13.3860, 79.7980];
const BOUNDING_BOX: [[number, number], [number, number]] = [
  [13.3260, 79.7380], // Southwest (Nagalapuram hills)
  [13.4460, 79.8580]  // Northeast (Lowland plains)
];

// Custom tactical radar dot for sensors
const createSensorIcon = (color: string = '#10B981') => {
  return L.divIcon({
    className: 'custom-sensor-icon',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center; cursor: grab;">
        <div style="position: absolute; width: 30px; height: 30px; border-radius: 50%; border: 2px dashed ${color}; opacity: 0.8; animation: ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="width: 14px; height: 14px; border-radius: 50%; background-color: ${color}; border: 2px solid white; box-shadow: 0 0 10px ${color};"></div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

// Tactical Twister / Vortex DivIcon with multi-ring counter-rotating SVG spirals & HUD badge
const createTwisterDivIcon = (color: string, cand: any, rank: number) => {
  const label = cand.name || `Hotspot #${rank + 1}`;
  const prob = cand.probability || 95;
  const eta = cand.etaText || '~10m';

  return L.divIcon({
    className: 'custom-twister-icon',
    html: `
      <div style="position: relative; width: 70px; height: 70px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <!-- Top HUD Label Tag -->
        <div style="position: absolute; top: -26px; left: 50%; transform: translateX(-50%); white-space: nowrap; background: rgba(11, 15, 25, 0.95); border: 1px solid ${color}; color: #F8FAFC; padding: 2px 8px; border-radius: 9999px; font-family: monospace; font-size: 10px; font-weight: 700; letter-spacing: 0.03em; display: flex; align-items: center; gap: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.8); pointer-events: none; z-index: 100;">
          <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${color}; box-shadow: 0 0 6px ${color}; animation: ping 1.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
          <span style="color: #F1F5F9; max-width: 90px; overflow: hidden; text-overflow: ellipsis;">${label}</span>
          <span style="color: ${color}; font-weight: 900;">${prob}%</span>
          <span style="color: #FBBF24; font-size: 9px;">${eta}</span>
        </div>

        <!-- Atmospheric Swirl Shockwave Ring -->
        <div style="position: absolute; width: 64px; height: 64px; border-radius: 50%; border: 1.5px solid ${color}; opacity: 0.45; animation: ping 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>

        <!-- Primary Outer Spiral Arms (Spin Clockwise) -->
        <div style="position: absolute; width: 54px; height: 54px; animation: spin-twister 1.4s linear infinite; color: ${color}; pointer-events: none;">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" style="width: 100%; height: 100%; filter: drop-shadow(0 0 8px ${color});">
            <path d="M 50 8 A 42 42 0 0 1 92 50 A 28 28 0 0 1 64 78 A 16 16 0 0 1 50 50" stroke-width="5" stroke-linecap="round" opacity="0.95" />
            <path d="M 50 92 A 42 42 0 0 1 8 50 A 28 28 0 0 1 36 22 A 16 16 0 0 1 50 50" stroke-width="5" stroke-linecap="round" opacity="0.95" />
            <circle cx="92" cy="50" r="4" fill="${color}" />
            <circle cx="8" cy="50" r="4" fill="${color}" />
            <circle cx="50" cy="8" r="3" fill="#FFFFFF" />
            <circle cx="50" cy="92" r="3" fill="#FFFFFF" />
          </svg>
        </div>

        <!-- Inner Counter-Rotating Vortex Spiral Core -->
        <div style="position: absolute; width: 38px; height: 38px; animation: spin-twister-reverse 0.85s linear infinite; color: #FFFFFF; pointer-events: none;">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" style="width: 100%; height: 100%; filter: drop-shadow(0 0 10px ${color});">
            <path d="M 22 22 Q 50 10 78 22 Q 70 50 50 50 Q 30 50 22 22 Z" fill="${color}" fill-opacity="0.35" stroke="currentColor" stroke-width="3" />
            <path d="M 28 48 Q 50 36 72 48 Q 62 72 50 78 Q 38 72 28 48 Z" fill="${color}" fill-opacity="0.45" stroke="currentColor" stroke-width="2.5" />
          </svg>
        </div>

        <!-- Center Tornado Eye / Glowing Funnel -->
        <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: radial-gradient(circle, #FFFFFF 15%, ${color} 85%); box-shadow: 0 0 16px ${color}, 0 0 28px ${color}; display: flex; align-items: center; justify-content: center; z-index: 5;">
          <svg viewBox="0 0 24 24" fill="none" stroke="#0B0F19" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" style="width: 15px; height: 15px;">
            <path d="M4 8h16" />
            <path d="M6 12h12" />
            <path d="M8.5 16h7" />
            <path d="M10.5 20h3" />
          </svg>
        </div>
      </div>
    `,
    iconSize: [70, 70],
    iconAnchor: [35, 35]
  });
};

// Trailing vortex debris particle dot
const createTrailDivIcon = (color: string, size: number, opacity: number) => {
  return L.divIcon({
    className: 'custom-twister-trail-icon',
    html: `
      <div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: ${color}; opacity: ${opacity}; box-shadow: 0 0 ${size * 1.5}px ${color}; animation: vortex-core-pulse 1s infinite alternate;"></div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Landfall Impact Target Radar Beacon
const createImpactZoneIcon = (color: string, isPrimary: boolean) => {
  const size = isPrimary ? 54 : 44;
  return L.divIcon({
    className: 'custom-impact-zone-icon',
    html: `
      <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; pointer-events: none;">
        <div class="animate-impact-wave" style="position: absolute; width: ${size - 4}px; height: ${size - 4}px; border-radius: 50%; border: 2px solid ${color};"></div>
        <div style="position: absolute; width: ${size - 12}px; height: ${size - 12}px; border-radius: 50%; border: 2px dashed ${color}; animation: spin-twister 5s linear infinite; opacity: 0.85;"></div>
        <div style="width: 12px; height: 12px; border-radius: 50%; background: ${color}; border: 2px solid #FFFFFF; box-shadow: 0 0 14px ${color}; z-index: 2;"></div>
        ${isPrimary ? `
          <div style="position: absolute; bottom: -22px; left: 50%; transform: translateX(-50%); background: rgba(15, 23, 42, 0.92); border: 1px solid ${color}; color: ${color}; font-family: monospace; font-size: 9px; font-weight: 800; padding: 1px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 4px 10px rgba(0,0,0,0.7);">
            🎯 LANDFALL IMPACT
          </div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

// Geodesic Hazard Dispersion Swath Wedge Calculator
const computeConePolygon = (origin: [number, number], target: [number, number], spreadDeg = 14): [number, number][] => {
  const dLat = target[0] - origin[0];
  const dLng = target[1] - origin[1];
  const dist = Math.sqrt(dLat * dLat + dLng * dLng);
  if (dist === 0) return [origin, target, target];
  const angle = Math.atan2(dLng, dLat);
  const spreadRad = (spreadDeg * Math.PI) / 180;
  const len = dist * 1.06;

  const leftLat = origin[0] + len * Math.cos(angle - spreadRad);
  const leftLng = origin[1] + len * Math.sin(angle - spreadRad);

  const rightLat = origin[0] + len * Math.cos(angle + spreadRad);
  const rightLng = origin[1] + len * Math.sin(angle + spreadRad);

  return [origin, [leftLat, leftLng], target, [rightLat, rightLng]];
};

// 60-FPS Traveling Twister Marker Component
interface TravelingTwisterProps {
  origin: [number, number];
  target: [number, number];
  cand: any;
  color: string;
  rank: number;
  durationMs?: number;
}

const TravelingTwisterMarker: React.FC<TravelingTwisterProps> = ({
  origin,
  target,
  cand,
  color,
  rank,
  durationMs = 3800
}) => {
  const markerRef = useRef<L.Marker | null>(null);
  const trail1Ref = useRef<L.Marker | null>(null);
  const trail2Ref = useRef<L.Marker | null>(null);
  const trail3Ref = useRef<L.Marker | null>(null);

  const twisterIcon = useMemo(() => createTwisterDivIcon(color, cand, rank), [color, cand, rank]);
  const trail1Icon = useMemo(() => createTrailDivIcon(color, 16, 0.70), [color]);
  const trail2Icon = useMemo(() => createTrailDivIcon(color, 12, 0.45), [color]);
  const trail3Icon = useMemo(() => createTrailDivIcon(color, 8, 0.25), [color]);

  useEffect(() => {
    let animId: number;
    let start: number | null = null;

    const animate = (timestamp: number) => {
      if (!start) start = timestamp;
      const elapsed = timestamp - start;
      const progress = (elapsed % durationMs) / durationMs;

      const curLat = origin[0] + progress * (target[0] - origin[0]);
      const curLng = origin[1] + progress * (target[1] - origin[1]);

      if (markerRef.current) {
        markerRef.current.setLatLng([curLat, curLng]);
      }

      const p1 = Math.max(0, progress - 0.03);
      if (trail1Ref.current) {
        trail1Ref.current.setLatLng([
          origin[0] + p1 * (target[0] - origin[0]),
          origin[1] + p1 * (target[1] - origin[1])
        ]);
      }

      const p2 = Math.max(0, progress - 0.06);
      if (trail2Ref.current) {
        trail2Ref.current.setLatLng([
          origin[0] + p2 * (target[0] - origin[0]),
          origin[1] + p2 * (target[1] - origin[1])
        ]);
      }

      const p3 = Math.max(0, progress - 0.09);
      if (trail3Ref.current) {
        trail3Ref.current.setLatLng([
          origin[0] + p3 * (target[0] - origin[0]),
          origin[1] + p3 * (target[1] - origin[1])
        ]);
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [origin[0], origin[1], target[0], target[1], durationMs]);

  return (
    <>
      <Marker ref={trail3Ref} position={origin} icon={trail3Icon} interactive={false} />
      <Marker ref={trail2Ref} position={origin} icon={trail2Icon} interactive={false} />
      <Marker ref={trail1Ref} position={origin} icon={trail1Icon} interactive={false} />
      <Marker ref={markerRef} position={origin} icon={twisterIcon} zIndexOffset={2000}>
        <Popup>
          <div className="p-1 space-y-1 font-mono text-xs text-slate-100 min-w-[210px]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1">
              <span className="font-bold text-xs" style={{ color }}>🌪️ PREDICTED HAZARD FRONT</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                RANK #{rank + 1}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 space-y-0.5">
              <div>Destination: <strong className="text-slate-100">{cand.name}</strong></div>
              <div>ML Probability: <strong style={{ color }}>{cand.probability}%</strong></div>
              <div>Estimated Arrival: <strong className="text-amber-300">{cand.etaText || 'Imminent'}</strong></div>
              <div>Distance: <span className="text-slate-200">{cand.distanceKm} km</span> | Bearing: <span className="text-slate-200">{cand.bearingDeg}°</span></div>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

// Map Click Handler Component
const MapClickHandler: React.FC<{
  onMapClick: (lat: number, lng: number) => void;
}> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

export const RiskMap: React.FC = () => {
  const {
    sensors,
    hotspots,
    directedResult,
    createHotspot,
    deleteHotspot,
    createSensor,
    updateSensorPosition,
    deleteSensor
  } = useApp();

  const [hazardFilter, setHazardFilter] = useState<string>('ALL');

  // Drawing & Placement State
  const [activeTool, setActiveTool] = useState<'NONE' | 'DRAW_HOTSPOT' | 'PLACE_SENSOR'>('NONE');
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);

  // Hotspot Form Modal State
  const [hotspotModalOpen, setHotspotModalOpen] = useState(false);
  const [newHotspotName, setNewHotspotName] = useState('');
  const [newHotspotTag, setNewHotspotTag] = useState<'flood' | 'heatwave' | 'landslide' | 'heavy_rain'>('flood');
  const [newHotspotNotes, setNewHotspotNotes] = useState('');

  // Sensor Form Modal State
  const [sensorModalOpen, setSensorModalOpen] = useState(false);
  const [pendingSensorCoord, setPendingSensorCoord] = useState<[number, number] | null>(null);
  const [newSensorName, setNewSensorName] = useState('');

  // Tile provider detection: MapTiler if key provided, else Esri World Dark Gray + Hillshade
  const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;

  const handleMapClick = (lat: number, lng: number) => {
    if (activeTool === 'DRAW_HOTSPOT') {
      setDrawingPoints(prev => [...prev, [lat, lng]]);
    } else if (activeTool === 'PLACE_SENSOR') {
      setPendingSensorCoord([lat, lng]);
      setNewSensorName(`Sensor ${String.fromCharCode(65 + sensors.length)}`);
      setSensorModalOpen(true);
    }
  };

  const handleFinishDrawing = () => {
    if (drawingPoints.length < 3) {
      alert('A polygon hotspot requires at least 3 vertex points.');
      return;
    }
    setNewHotspotName(`Hotspot ${hotspots.length + 1}`);
    setHotspotModalOpen(true);
  };

  const handleSaveHotspot = async () => {
    if (drawingPoints.length < 3) return;
    const closed = [...drawingPoints, drawingPoints[0]];
    const geometry = {
      type: 'Polygon' as const,
      coordinates: [closed]
    };


    await createHotspot({
      name: newHotspotName || 'Custom Hotspot',
      hazardType: newHotspotTag.toUpperCase() as any,
      geometry,
      notes: newHotspotNotes
    });

    setDrawingPoints([]);
    setHotspotModalOpen(false);
    setActiveTool('NONE');
    setNewHotspotNotes('');
  };

  const handleSaveSensor = async () => {
    if (!pendingSensorCoord) return;
    await createSensor({
      name: newSensorName || `Telemetry Node ${sensors.length + 1}`,
      lat: pendingSensorCoord[0],
      lng: pendingSensorCoord[1]
    });
    setPendingSensorCoord(null);
    setSensorModalOpen(false);
    setActiveTool('NONE');
  };

  const getHotspotColor = (tag: string) => {
    const t = tag.toLowerCase();
    if (t === 'flood') return '#06B6D4'; // Cyan
    if (t === 'heatwave' || t === 'heat') return '#F97316'; // Orange
    if (t === 'landslide') return '#EF4444'; // Red
    if (t === 'heavy_rain' || t === 'storm') return '#8B5CF6'; // Violet
    return '#10B981';
  };

  const filteredHotspots = hotspots.filter(h => {
    if (hazardFilter === 'ALL') return true;
    const t = (h.hazardType || '').toUpperCase();
    if (hazardFilter === 'HEAT' && (t === 'HEAT' || t === 'HEATWAVE')) return true;
    if (hazardFilter === 'STORM' && (t === 'STORM' || t === 'HEAVY_RAIN')) return true;
    return t === hazardFilter;
  });

  return (
    <div className="relative w-full h-full bg-[#070B14] overflow-hidden">
      {/* Top Toolbar: Drawing / Sensor Placement Controls */}
      <div className="absolute top-4 left-5 right-5 z-[1000] pointer-events-none flex items-center justify-between">
        {/* Left: Tactical Tools */}
        <div className="pointer-events-auto bg-[#0A1120]/95 border border-slate-800 backdrop-blur-md px-3 py-2 rounded-2xl flex items-center space-x-2 shadow-2xl">
          <button
            onClick={() => {
              if (activeTool === 'DRAW_HOTSPOT') {
                setActiveTool('NONE');
                setDrawingPoints([]);
              } else {
                setActiveTool('DRAW_HOTSPOT');
                setDrawingPoints([]);
              }
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === 'DRAW_HOTSPOT'
                ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 ring-2 ring-rose-400'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>{activeTool === 'DRAW_HOTSPOT' ? 'DRAWING HOTSPOT...' : 'DRAW HOTSPOT'}</span>
          </button>

          {activeTool === 'DRAW_HOTSPOT' && drawingPoints.length >= 3 && (
            <button
              onClick={handleFinishDrawing}
              className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center space-x-1 shadow-md"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              <span>SAVE HOTSPOT ({drawingPoints.length} pts)</span>
            </button>
          )}

          {activeTool === 'DRAW_HOTSPOT' && drawingPoints.length > 0 && (
            <button
              onClick={() => setDrawingPoints([])}
              className="px-2 py-1.5 rounded-xl text-xs font-mono text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => {
              setActiveTool(activeTool === 'PLACE_SENSOR' ? 'NONE' : 'PLACE_SENSOR');
              setDrawingPoints([]);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1.5 transition-all ${
              activeTool === 'PLACE_SENSOR'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400'
                : 'bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>{activeTool === 'PLACE_SENSOR' ? 'CLICK MAP TO PLACE' : 'PLACE SENSOR'}</span>
          </button>
        </div>

        {/* Right: Hazard Filter */}
        <div className="pointer-events-auto bg-[#0A1120]/95 border border-slate-800 backdrop-blur-md px-3.5 py-2 rounded-2xl flex items-center space-x-2 shadow-2xl">
          <div className="flex items-center space-x-1.5 text-slate-400 font-mono text-xs font-bold uppercase tracking-wider pr-1">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <span>FILTER:</span>
          </div>
          {(['ALL', 'FLOOD', 'HEAT', 'LANDSLIDE', 'STORM']).map(h => (
            <button
              key={h}
              onClick={() => setHazardFilter(h)}
              className={`px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                hazardFilter === h
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {h}
            </button>
          ))}
        </div>
      </div>

      {/* Helper Notification Banner during Drawing */}
      {activeTool === 'DRAW_HOTSPOT' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1000] bg-rose-950/90 border border-rose-500/50 text-rose-200 text-xs px-4 py-2 rounded-full font-mono backdrop-blur-md shadow-2xl flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          <span>Click vertices on map to trace polygon ({drawingPoints.length} points). Click Save when finished.</span>
        </div>
      )}

      {/* Primary Leaflet Map Container */}
      <MapContainer
        center={REGION_CENTER}
        zoom={12}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%', background: '#070B14' }}
        zoomControl={false}
      >
        <MapClickHandler onMapClick={handleMapClick} />

        {/* Dual-Mode Basemap: MapTiler with Terrain or Esri Dark Gray + World Hillshade */}
        {maptilerKey ? (
          <>
            <TileLayer
              url={`https://api.maptiler.com/maps/dataviz-dark/256/{z}/{x}/{y}.png?key=${maptilerKey}`}
              attribution='&copy; <a href="https://www.maptiler.com/">MapTiler</a>'
              maxZoom={18}
            />
            <TileLayer
              url={`https://api.maptiler.com/tiles/terrain-rgb/{z}/{x}/{y}.png?key=${maptilerKey}`}
              opacity={0.35}
              maxZoom={18}
            />
          </>
        ) : (
          <>
            {/* Esri World Dark Gray Base */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
              maxZoom={16}
            />
            {/* Esri World Hillshade Layer (Renders Nagalapuram ridge slopes clearly) */}
            <TileLayer
              url="https://server.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}"
              opacity={0.35}
              maxZoom={16}
            />
            {/* Esri Dark Gray Reference Boundaries & Labels */}
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}"
              opacity={0.70}
              maxZoom={16}
            />
          </>
        )}

        {/* Sadasiva Sankarapuram Bounding Box Guideline (12.5 km Working Area) */}
        <Rectangle
          bounds={BOUNDING_BOX}
          pathOptions={{
            color: '#0284C7',
            weight: 1.5,
            dashArray: '6, 6',
            fillColor: '#0369A1',
            fillOpacity: 0.04
          }}
        />

        {/* Live Drawing Polyline & Vertices */}
        {drawingPoints.length > 0 && (
          <>
            <Polyline
              positions={drawingPoints}
              pathOptions={{ color: '#F43F5E', weight: 2.5, dashArray: '4, 4' }}
            />
            {drawingPoints.map((pt, idx) => (
              <Marker
                key={`draw-pt-${idx}`}
                position={pt}
                icon={L.divIcon({
                  className: 'draw-pt',
                  html: `<div style="width: 10px; height: 10px; border-radius: 50%; background: #F43F5E; border: 2px solid white;"></div>`,
                  iconSize: [10, 10],
                  iconAnchor: [5, 5]
                })}
              />
            ))}
          </>
        )}

        {/* Saved Hotspots Polygons */}
        {filteredHotspots.map(h => {
          const color = getHotspotColor(h.hazardType);
          const coords = h.geometry?.coordinates?.[0] || [];
          if (!coords || coords.length === 0) return null;

          return (
            <Polygon
              key={h.id}
              positions={coords}
              pathOptions={{
                color: color,
                weight: 2.5,
                fillColor: color,
                fillOpacity: 0.35
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 font-mono text-xs text-slate-100 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="font-bold text-sm text-cyan-300">{h.name}</span>
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase"
                      style={{ backgroundColor: `${color}25`, color: color, border: `1px solid ${color}60` }}
                    >
                      {h.hazardType}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Elevation:</span>
                      <span className="font-bold text-slate-200">{h.elevation ?? 75} m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Slope:</span>
                      <span className="font-bold text-slate-200">{h.slope ?? 2}°</span>
                    </div>
                    {h.notes && (
                      <div className="pt-1 text-slate-400 italic text-[10px] border-t border-slate-800/80">
                        "{h.notes}"
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => deleteHotspot(h.id)}
                    className="w-full mt-2 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded flex items-center justify-center space-x-1 text-[10px] font-bold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>DELETE HOTSPOT</span>
                  </button>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Directional Hazard Propagation Vectors, Cones, Impact Zones & Traveling Twister Vortex */}
        {directedResult?.rankedCandidates?.map((cand: any, idx: number) => {
          const origin: [number, number] = directedResult.sourceSensor?.coordinates || REGION_CENTER;
          const target: [number, number] = cand.cone?.target || REGION_CENTER;
          const candColor = idx === 0 ? '#F43F5E' : (idx === 1 ? '#FB923C' : '#FBBF24');
          const conePolygon = computeConePolygon(origin, target, idx === 0 ? 14 : 10);
          const twisterDuration = idx === 0 ? 3600 : (idx === 1 ? 4400 : 5200);

          return (
            <React.Fragment key={`sim-prop-${cand.hotspotId}`}>
              {/* Geodesic Hazard Dispersion Swath Wedge */}
              <Polygon
                positions={conePolygon}
                pathOptions={{
                  fillColor: candColor,
                  fillOpacity: idx === 0 ? 0.08 : 0.04,
                  stroke: true,
                  color: candColor,
                  weight: 1,
                  dashArray: '4, 4',
                  opacity: 0.4
                }}
                interactive={false}
              />

              {/* Underlying Glowing Ambient Conduit Track */}
              <Polyline
                positions={[origin, target]}
                pathOptions={{
                  color: candColor,
                  weight: idx === 0 ? 9 : 5,
                  opacity: 0.24,
                  lineCap: 'round'
                }}
              />

              {/* High-Tech Animated Flowing Laser Pulse Vector */}
              <Polyline
                positions={[origin, target]}
                pathOptions={{
                  color: candColor,
                  weight: idx === 0 ? 3.5 : 2,
                  dashArray: '10, 8',
                  className: 'hazard-vector-flow',
                  opacity: 0.95
                }}
              />

              {/* Landfall Impact Target Radar Beacon at predicted hotspot */}
              <Marker
                position={target}
                icon={createImpactZoneIcon(candColor, idx === 0)}
                interactive={false}
              />

              {/* Active Traveling Twister / Vortex Hazard Front (Render for top 2 candidates) */}
              {idx < 2 && (
                <TravelingTwisterMarker
                  origin={origin}
                  target={target}
                  cand={cand}
                  color={candColor}
                  rank={idx}
                  durationMs={twisterDuration}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Placed Sensors Markers */}
        {sensors.map(s => {
          return (
            <Marker
              key={s.id}
              position={s.coordinates}
              draggable={true}
              icon={createSensorIcon('#10B981')}
              eventHandlers={{
                dragend: (e) => {
                  const latlng = e.target.getLatLng();
                  updateSensorPosition(s.id, latlng.lat, latlng.lng);
                }
              }}
            >
              <Popup>
                <div className="p-1 space-y-2 font-mono text-xs text-slate-100 min-w-[200px]">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                    <span className="font-bold text-sm text-emerald-400">{s.name}</span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                      {s.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-[11px] text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Coordinates:</span>
                      <span className="text-[10px] text-slate-300">{s.coordinates[0].toFixed(4)}, {s.coordinates[1].toFixed(4)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Quality Score:</span>
                      <span className="text-emerald-400 font-bold">{s.telemetry?.dataQuality || 100}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Temp / Rain:</span>
                      <span className="text-slate-200">{s.telemetry?.temperature}°C | {s.telemetry?.rainfall} mm</span>
                    </div>
                  </div>
                  <div className="text-[9px] text-slate-500 italic">Drag marker to reposition coordinate</div>
                  <button
                    onClick={() => deleteSensor(s.id)}
                    className="w-full mt-1 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded flex items-center justify-center space-x-1 text-[10px] font-bold"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>DELETE SENSOR</span>
                  </button>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Bottom-Left Region Indicator */}
      <div className="absolute bottom-6 left-6 z-[1000] bg-[#0A1120]/95 border border-slate-800 p-3.5 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-mono select-none">
        <div className="flex items-center space-x-2 text-cyan-400 font-bold uppercase text-[10px] tracking-wider mb-2">
          <Mountain className="w-3.5 h-3.5" />
          <span>SADASIVA SANKARAPURAM SECTOR</span>
        </div>
        <div className="text-[11px] text-slate-300 space-y-1">
          <div>Anchor: <span className="text-slate-400">13.3860°N, 79.7980°E</span></div>
          <div>Terrain: <span className="text-slate-400">Nagalapuram Hills & Lowland</span></div>
          <div className="text-slate-500 text-[10px] pt-1 border-t border-slate-800">
            Hotspots: {hotspots.length} | Sensors: {sensors.length}
          </div>
        </div>
      </div>

      {/* Modal: Draw Hotspot Form */}
      {hotspotModalOpen && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1120] border border-slate-800 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <PenTool className="w-4 h-4 text-rose-400" />
                <span>SAVE HAZARD HOTSPOT</span>
              </h3>
              <button onClick={() => setHotspotModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 text-[11px]">Hotspot Name:</label>
              <input
                type="text"
                value={newHotspotName}
                onChange={e => setNewHotspotName(e.target.value)}
                placeholder="e.g. Western Ridge Slope, East Basin"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-cyan-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 text-[11px]">Hazard Tag:</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'flood', label: 'Flood' },
                  { id: 'heatwave', label: 'Heat Wave' },
                  { id: 'landslide', label: 'Landslide' },
                  { id: 'heavy_rain', label: 'Heavy Rain' }
                ].map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setNewHotspotTag(item.id as any)}
                    className={`py-2 px-3 rounded-lg border text-left font-bold transition-all ${
                      newHotspotTag === item.id
                        ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500'
                        : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 text-[11px]">Notes / Context (Optional):</label>
              <textarea
                value={newHotspotNotes}
                onChange={e => setNewHotspotNotes(e.target.value)}
                rows={2}
                placeholder="Terrain notes, observed vulnerabilities..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-cyan-500 resize-none text-xs"
              />
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setHotspotModalOpen(false)}
                className="w-1/2 py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveHotspot}
                className="w-1/2 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold shadow-lg shadow-cyan-600/30"
              >
                Save Hotspot
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Place Sensor Form */}
      {sensorModalOpen && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0A1120] border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>PLACE TELEMETRY SENSOR</span>
              </h3>
              <button onClick={() => setSensorModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 text-[11px]">Sensor Node Name:</label>
              <input
                type="text"
                value={newSensorName}
                onChange={e => setNewSensorName(e.target.value)}
                placeholder="e.g. Ridge Telemetry Alpha"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 outline-none focus:border-emerald-500"
              />
            </div>

            {pendingSensorCoord && (
              <div className="text-[10px] text-slate-500">
                Selected Location: {pendingSensorCoord[0].toFixed(5)}°N, {pendingSensorCoord[1].toFixed(5)}°E
              </div>
            )}

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setSensorModalOpen(false)}
                className="w-1/2 py-2 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-900"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSensor}
                className="w-1/2 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold shadow-lg shadow-emerald-600/30"
              >
                Confirm Placement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
