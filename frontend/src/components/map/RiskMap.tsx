import React, { useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { RiskArea, Sensor, Infrastructure, Shelter, CitizenReport, HazardType } from '../../types';
import { Layers, ShieldAlert, Cpu, Building2, Home, UserCheck } from 'lucide-react';

// Custom Leaflet Icons using SVG Data URIs
const createMarkerIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-leaflet-icon',
    html: `
      <div style="
        background-color: ${color};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 10px ${color};
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
        font-family: monospace;
      ">
        ${label}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const sensorIcon = createMarkerIcon('#06B6D4', 'S');
const infraIcon = createMarkerIcon('#3B82F6', 'H');
const shelterIcon = createMarkerIcon('#10B981', 'S');
const reportIcon = createMarkerIcon('#F59E0B', '!');


const MapClickHandler = () => {
  const { setRouteOrigin, setRouteDestination, routeOrigin, routeDestination, routingActive } = useApp();
  useMapEvents({
    click(e) {
      if (!routingActive) return;
      if (!routeOrigin) {
        setRouteOrigin([e.latlng.lat, e.latlng.lng]);
      } else if (!routeDestination) {
        setRouteDestination([e.latlng.lat, e.latlng.lng]);
      } else {
        setRouteOrigin([e.latlng.lat, e.latlng.lng]);
        setRouteDestination(null);
      }
    }
  });
  return null;
};

export const RiskMap: React.FC = () => {
  const {
    riskAreas,
    sensors,
    infrastructure,
    shelters,
    citizenReports,
    selectedZone,
    setSelectedZone,
    setSelectedSensor,
    setSelectedInfra,
    setSelectedShelter,
    setSelectedReport,
    routeOrigin, routeDestination, routeData, routingActive
  } = useApp();

  // Layer Toggles
  const [layers, setLayers] = useState({
    risk: true,
    sensors: true,
    flood: true,
    heat: true,
    landslide: true,
    storm: true,
    infrastructure: true,
    shelters: true,
    reports: true
  });

  const [showLayerPanel, setShowLayerPanel] = useState(false);

  // Polygon styling per severity and isPredicted status
  const getPolygonStyle = (area: RiskArea) => {
    let color = '#10B981'; // LOW
    if (area.severity === 'CRITICAL') color = '#EF4444';
    else if (area.severity === 'HIGH') color = '#F97316';
    else if (area.severity === 'MODERATE') color = '#F59E0B';

    return {
      color: color,
      weight: area.isPredicted ? 3 : 2,
      dashArray: area.isPredicted ? '8, 8' : undefined, // Dashed for PREDICTED NEXT AFFECTED, Solid for CURRENTLY AFFECTED
      fillColor: color,
      fillOpacity: area.isPredicted ? 0.25 : 0.45
    };
  };

  const filteredAreas = riskAreas.filter(a => {
    if (!layers.risk) return false;
    if (a.hazardType === 'FLOOD' && !layers.flood) return false;
    if (a.hazardType === 'HEAT' && !layers.heat) return false;
    if (a.hazardType === 'LANDSLIDE' && !layers.landslide) return false;
    if (a.hazardType === 'STORM' && !layers.storm) return false;
    return true;
  });

  return (
    <div className="relative w-full h-full bg-[#090D16] overflow-hidden">
      <MapContainer
        center={[12.9750, 77.5950]}
        zoom={13}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
        />


        <MapClickHandler />
        
        {routeOrigin && <Marker position={routeOrigin as any}><Popup>Route Origin</Popup></Marker>}
        {routeDestination && <Marker position={routeDestination as any}><Popup>Route Destination</Popup></Marker>}
        
        {routeData && routeData.segments && routeData.segments.map((seg: any) => (
          <Polyline 
            key={seg.segment_id}
            positions={seg.geometry.coordinates.map((c:any) => [c[1], c[0]])} 
            color={
                seg.overall_risk_level === 'LOW' ? '#22c55e' :
                seg.overall_risk_level === 'MODERATE' ? '#eab308' :
                seg.overall_risk_level === 'HIGH' ? '#f97316' : '#ef4444'
            }
            weight={8}
          />
        ))}
        
        {/* Spatial Risk Polygons */}

        {filteredAreas.map(area => (
          <Polygon
            key={area.id}
            positions={area.geometry.coordinates[0]}
            pathOptions={getPolygonStyle(area)}
            eventHandlers={{
              click: () => {
                setSelectedZone(area);
                setSelectedSensor(null);
                setSelectedInfra(null);
                setSelectedShelter(null);
                setSelectedReport(null);
              }
            }}
          >
            <Popup>
              <div className="p-1 space-y-1 font-sans">
                <div className="flex items-center justify-between font-bold text-xs">
                  <span>{area.name}</span>
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    area.severity === 'CRITICAL' ? 'bg-red-500/20 text-red-400' :
                    area.severity === 'HIGH' ? 'bg-orange-500/20 text-orange-400' : 'bg-amber-500/20 text-amber-400'
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

        {/* Sensor Markers */}
        {layers.sensors && sensors.map(sensor => (
          <Marker
            key={sensor.id}
            position={sensor.coordinates}
            icon={sensorIcon}
            eventHandlers={{
              click: () => {
                setSelectedSensor(sensor);
                setSelectedZone(null);
                setSelectedInfra(null);
                setSelectedShelter(null);
                setSelectedReport(null);
              }
            }}
          >
            <Popup>
              <div className="font-sans text-xs">
                <div className="font-bold text-slate-100">{sensor.name}</div>
                <div className="text-slate-400 text-[10px] font-mono">{sensor.code} - {sensor.status}</div>
                <div className="mt-1 text-[11px] text-cyan-300">
                  Temp: {sensor.telemetry.temperature}°C | Rain: {sensor.telemetry.rainfall}mm/h | Water: {sensor.telemetry.waterLevel}cm
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Infrastructure Markers */}
        {layers.infrastructure && infrastructure.map(infra => (
          <Marker
            key={infra.id}
            position={infra.coordinates}
            icon={infraIcon}
            eventHandlers={{
              click: () => {
                setSelectedInfra(infra);
                setSelectedZone(null);
                setSelectedSensor(null);
                setSelectedShelter(null);
                setSelectedReport(null);
              }
            }}
          >
            <Popup>
              <div className="font-sans text-xs">
                <div className="font-bold text-blue-400">{infra.name}</div>
                <div className="text-slate-300 text-[10px]">{infra.type} - Status: {infra.status}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Shelter Markers */}
        {layers.shelters && shelters.map(shelter => (
          <Marker
            key={shelter.id}
            position={shelter.coordinates}
            icon={shelterIcon}
            eventHandlers={{
              click: () => {
                setSelectedShelter(shelter);
                setSelectedZone(null);
                setSelectedSensor(null);
                setSelectedInfra(null);
                setSelectedReport(null);
              }
            }}
          >
            <Popup>
              <div className="font-sans text-xs">
                <div className="font-bold text-emerald-400">{shelter.name}</div>
                <div className="text-slate-300 text-[10px]">Occupancy: {shelter.occupancy}/{shelter.capacity}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Citizen Report Markers */}
        {layers.reports && citizenReports.map(report => (
          <Marker
            key={report.id}
            position={report.coordinates}
            icon={reportIcon}
            eventHandlers={{
              click: () => {
                setSelectedReport(report);
                setSelectedZone(null);
                setSelectedSensor(null);
                setSelectedInfra(null);
                setSelectedShelter(null);
              }
            }}
          >
            <Popup>
              <div className="font-sans text-xs">
                <div className="font-bold text-amber-400">{report.type}</div>
                <div className="text-slate-300 text-[10px]">{report.description}</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Floating Layer Control Button & Panel */}
      <div className="absolute top-4 right-4 z-[1000]">
        <button
          onClick={() => setShowLayerPanel(!showLayerPanel)}
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 p-2.5 rounded-lg shadow-xl flex items-center space-x-2 text-xs font-semibold"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>MAP LAYERS</span>
        </button>

        {showLayerPanel && (
          <div className="mt-2 w-64 bg-slate-900/95 border border-slate-700/80 rounded-xl p-3.5 shadow-2xl backdrop-blur text-xs space-y-2 text-slate-200">
            <div className="font-mono font-bold text-slate-400 uppercase tracking-wider text-[10px] pb-1 border-b border-slate-800">
              Active Map Layers
            </div>
            {[
              { id: 'risk', label: 'Spatial Risk Zones' },
              { id: 'sensors', label: 'IoT Sensor Stations' },
              { id: 'flood', label: 'Flood Hazards' },
              { id: 'heat', label: 'Heat Micro-zones' },
              { id: 'landslide', label: 'Landslide Slopes' },
              { id: 'storm', label: 'Storm Corridors' },
              { id: 'infrastructure', label: 'Critical Infrastructure' },
              { id: 'shelters', label: 'Evacuation Shelters' },
              { id: 'reports', label: 'Citizen Reports' }
            ].map(item => (
              <label key={item.id} className="flex items-center space-x-2.5 cursor-pointer hover:text-cyan-400">
                <input
                  type="checkbox"
                  checked={(layers as any)[item.id]}
                  onChange={e => setLayers({ ...layers, [item.id]: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Floating Spatial Risk Legend */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 border border-slate-800 p-3 rounded-xl shadow-2xl text-[11px] font-mono space-y-2 backdrop-blur">
        <div className="text-slate-400 font-bold uppercase text-[10px]">Risk Severity Legend</div>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span className="text-slate-200">CRITICAL (75-100)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-orange-500"></span>
            <span className="text-slate-200">HIGH (50-74)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span className="text-slate-200">MODERATE (25-49)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded bg-emerald-500"></span>
            <span className="text-slate-200">LOW (0-24)</span>
          </div>
        </div>
        <div className="pt-2 border-t border-slate-800 flex items-center space-x-4 text-[10px]">
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 bg-cyan-400 inline-block"></span>
            <span className="text-slate-300">CURRENT (Solid)</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="w-4 h-0.5 border-b-2 border-dashed border-cyan-400 inline-block"></span>
            <span className="text-slate-300">PREDICTED (Dashed)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
