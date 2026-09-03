import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Polyline } from '@react-google-maps/api';
import { Search, MapPin, Navigation, Clock, ShieldAlert, Thermometer, CloudRain, Droplets, Mountain, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const mapContainerStyle = { width: '100%', height: '100%' };
const defaultCenter = { lat: 12.9229, lng: 80.1275 }; // Default to VIT Chennai area

type HazardMode = 'ALL' | 'FLOOD' | 'RAIN' | 'HEAT' | 'LANDSLIDE';

export default function App() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [origin, setOrigin] = useState<any>(null);
  const [destination, setDestination] = useState<any>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  
  const [hazardMode, setHazardMode] = useState<HazardMode>('ALL');
  const [departureTime, setDepartureTime] = useState<string>('17:30');
  const [activeSegment, setActiveSegment] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const handleMapClick = (e: any) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    if (!origin) {
      setOrigin({ lat, lng });
      setErrorMsg(null);
    } else if (!destination) {
      setDestination({ lat, lng });
    } else {
      setOrigin({ lat, lng });
      setDestination(null);
      setRouteData(null);
      setActiveSegment(null);
      setSelectedRouteId(null);
    }
  };

  const analyzeRoute = async () => {
    if (!origin || !destination) {
      setErrorMsg("Please select both an origin and destination on the map.");
      return;
    }
    setLoading(true);
    setRouteData(null);
    setActiveSegment(null);
    setSelectedRouteId(null);
    setErrorMsg(null);
    
    try {
      const res = await fetch('http://localhost:8000/api/analyze-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          origin: `${origin.lat},${origin.lng}`, 
          destination: `${destination.lat},${destination.lng}`,
          departure_time: departureTime, 
          scenario: 'BASELINE' 
        })
      });
      if (!res.ok) {
        let detail = "Climate analysis unavailable. Check the backend connection and try again.";
        try { const err = await res.json(); detail = err.detail || detail; } catch {}
        throw new Error(detail);
      }
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) throw new Error("No route returned.");
      setRouteData(data);
      setSelectedRouteId(data.recommended_route_id);
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Routing API failure or backend unavailable.");
    }
    setLoading(false);
  };

  const getRiskLevel = (seg: any): string => {
    switch (hazardMode) {
      case 'FLOOD': return seg.flood_risk.level;
      case 'HEAT': return seg.heat_risk.level;
      case 'LANDSLIDE': return seg.landslide_risk.level;
      case 'RAIN': 
         if (seg.rainfall > 50) return 'SEVERE';
         if (seg.rainfall > 30) return 'HIGH';
         if (seg.rainfall > 10) return 'MODERATE';
         return 'LOW';
      default: return seg.overall_risk_level;
    }
  };

  const getRiskColor = (level: string) => {
    if (level === 'SEVERE' || level === 'CRITICAL') return '#ef4444'; // red-500
    if (level === 'HIGH') return '#f97316'; // orange-500
    if (level === 'MODERATE') return '#eab308'; // yellow-500
    return '#10b981'; // green-500 matching the mockup
  };

  if (!isLoaded) return <div className="w-full h-screen flex items-center justify-center bg-[#0f172a] text-white font-mono">LOADING CLIMATEROUTE...</div>;

  return (
    <div className="w-full h-screen flex flex-col bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {/* Top Navbar */}
      <div className="h-14 bg-[#0f172a] flex items-center justify-between px-6 shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2 text-white">
          <ShieldAlert className="w-5 h-5 text-teal-500" />
          <span className="font-bold tracking-tight">ClimateRoute</span>
          <span className="text-[10px] font-bold bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full border border-teal-500/30">MVP PROTOTYPE</span>
        </div>
        <div className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-400">
          <span className={!routeData ? "text-white" : ""}>1 Home Input</span>
          <span>2 Loading</span>
          <span>3 Main Dashboard</span>
          <span>4 Segment Details</span>
          <span>5 Temporal Risk</span>
          <span>6 Advisory Action</span>
          <span className={routeData ? "bg-teal-600 text-white px-3 py-1 rounded-full" : ""}>7 Alternatives</span>
          <span>8 Live Journey</span>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Sidebar */}
        <div className="w-full lg:w-[450px] bg-slate-50 border-r border-slate-200 p-8 flex flex-col overflow-y-auto shrink-0 relative z-20">
          
          {!routeData ? (
            // INPUT VIEW
            <div className="flex flex-col h-full justify-center">
              <div className="mb-8">
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Plan Journey</h1>
                <p className="text-sm font-medium text-slate-500">Select Origin and Destination on the map to analyze hyperlocal climate risks.</p>
              </div>

              <div className="space-y-4 relative mb-6">
                <div className="absolute left-[18px] top-[32px] bottom-[32px] w-[2px] bg-slate-200 z-0"></div>
                {/* Origin */}
                <div className="relative z-10">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-white shadow"></div>
                  </div>
                  <input 
                    type="text" readOnly
                    className="w-full pl-10 pr-3 py-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
                    placeholder="Click map to set Origin..."
                    value={origin ? `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}` : ''}
                  />
                </div>
                {/* Destination */}
                <div className="relative z-10">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <MapPin className="w-4 h-4 text-rose-500" />
                  </div>
                  <input 
                    type="text" readOnly
                    className="w-full pl-10 pr-3 py-4 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 shadow-sm"
                    placeholder="Click map to set Destination..."
                    value={destination ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}` : ''}
                  />
                </div>
              </div>

              <div className="mb-8">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">DEPARTURE TIME</p>
                 <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-slate-400" />
                    <input 
                        type="time" 
                        value={departureTime}
                        onChange={(e) => setDepartureTime(e.target.value)}
                        className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                 </div>
              </div>

              {errorMsg && <div className="mb-6 text-xs text-rose-600 font-bold bg-rose-50 p-4 rounded-xl border border-rose-100">{errorMsg}</div>}

              <button 
                onClick={analyzeRoute}
                disabled={loading || !origin || !destination}
                className="w-full bg-[#0f172a] hover:bg-black disabled:bg-slate-300 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 mt-auto"
              >
                {loading ? (
                   <span className="animate-pulse flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Analyzing Routes...</span>
                ) : (
                   <><Search className="w-5 h-5" /> Calculate Safe Routes</>
                )}
              </button>
            </div>
          ) : (
            // RESULTS VIEW
            <div className="flex flex-col h-full">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">OPTIMIZED TRAJECTORY OPTIONS</p>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Alternative Routes</h1>
              <p className="text-sm font-medium text-slate-500 mb-8">Choose based on speed vs. risk.</p>

              <div className="space-y-4 flex-1">
                {routeData.routes.map((r: any, idx: number) => {
                  const isSelected = selectedRouteId === r.route_id;
                  const isRecommended = routeData.recommended_route_id === r.route_id;
                  
                  // Map API route type to mockup names
                  let title = `ROUTE ${String.fromCharCode(65 + idx)} — ${r.type === 'FASTEST' ? 'FASTEST' : 'BALANCED'}`;
                  if (idx === 2) title = "ROUTE C — LOWEST RISK"; // Just in case there's 3

                  const riskLevel = r.overall_risk.level;
                  const riskColorHex = getRiskColor(riskLevel);
                  
                  return (
                    <div 
                      key={r.route_id}
                      onClick={() => setSelectedRouteId(r.route_id)}
                      className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer ${
                        isSelected ? 'border-teal-600 bg-teal-50/40 shadow-md' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-black text-slate-900 text-sm">{title}</h3>
                            {isRecommended && (
                              <span className="bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Recommended
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border bg-white" style={{borderColor: riskColorHex, color: riskColorHex}}>
                              <div className="w-2 h-2 rounded-full" style={{backgroundColor: riskColorHex}}></div>
                              <span className="text-[10px] font-bold uppercase">{riskLevel} RISK</span>
                            </span>
                            <span className="font-black text-slate-900">• {Math.round(r.route.duration_s / 60)} min</span>
                            <span className="text-slate-400 font-medium whitespace-nowrap overflow-hidden text-ellipsis max-w-[100px]">• Via {r.type === 'FASTEST' ? 'Primary' : 'Alternative'}</span>
                          </div>
                        </div>
                        <button 
                          className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] uppercase tracking-wider font-bold border transition-colors ${
                            isSelected ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>
                      
                      <div className="text-xs font-medium mt-3" style={{color: isRecommended ? '#0f766e' : (riskLevel === 'HIGH' || riskLevel === 'SEVERE' || riskLevel === 'CRITICAL' ? '#e11d48' : '#64748b')}}>
                        {r.summary.reasons.join(' • ')}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button className="w-full bg-teal-800 hover:bg-teal-900 text-white font-bold py-4 rounded-xl shadow-lg transition-all mt-6">
                Confirm Route {String.fromCharCode(65 + routeData.routes.findIndex((r:any) => r.route_id === selectedRouteId))} & Start Live Journey →
              </button>
            </div>
          )}
        </div>

        {/* Right Area: Map */}
        <div className="flex-1 p-6 flex flex-col bg-white relative z-10">
          <div className="w-full h-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative">
            
            {/* Map UI Overlays */}
            {routeData && !loading && (
              <>
                <div className="absolute top-4 left-4 z-[10]">
                   <div className="bg-white/95 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">ROUTE COMPARISON MAP</span>
                      <span className="text-xs font-bold text-teal-600">Showing {routeData.routes.length} Candidates</span>
                   </div>
                </div>
                
                <div className="absolute top-4 right-4 z-[10] flex gap-2">
                   <button onClick={() => setHazardMode('ALL')} className={`px-4 py-2 text-[10px] font-bold rounded-xl shadow-sm border transition-all ${hazardMode==='ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200'}`}>ALL</button>
                   <button onClick={() => setHazardMode('FLOOD')} className={`px-4 py-2 text-[10px] font-bold rounded-xl shadow-sm border transition-all ${hazardMode==='FLOOD' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200'}`}>FLOOD</button>
                   <button onClick={() => setHazardMode('HEAT')} className={`px-4 py-2 text-[10px] font-bold rounded-xl shadow-sm border transition-all ${hazardMode==='HEAT' ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200'}`}>HEAT</button>
                </div>
              </>
            )}

            {activeSegment && (
               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[10] w-80 bg-white/95 backdrop-blur-xl shadow-xl rounded-2xl p-5 border border-slate-200">
                  <div className="flex justify-between items-start mb-3">
                      <div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">SEGMENT {activeSegment.segment_id}</p>
                         <h3 className="font-black text-slate-900 text-sm" style={{color: getRiskColor(getRiskLevel(activeSegment))}}>
                            {getRiskLevel(activeSegment)} {hazardMode === 'ALL' ? 'OVERALL' : hazardMode} RISK
                         </h3>
                      </div>
                      <button onClick={() => setActiveSegment(null)} className="text-slate-400 hover:text-slate-800 text-xl">&times;</button>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl mt-3">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">FACTORS</p>
                      <div className="text-xs font-mono text-slate-600 space-y-1">
                         <div>+ Rainfall: {activeSegment.rainfall}mm</div>
                         <div>+ Elevation: {activeSegment.elevation}m</div>
                         <div>+ Arrive @ {activeSegment.estimated_arrival_time}</div>
                      </div>
                  </div>
               </div>
            )}

            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={defaultCenter}
              zoom={12}
              onClick={handleMapClick}
              options={{
                disableDefaultUI: true,
                zoomControl: true,
                mapTypeControl: false,
                streetViewControl: false,
                styles: [
                  { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                  { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] },
                  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#cbe6f7' }] }
                ]
              }}
            >
              {origin && <Marker position={origin} label={{ text: "A", color: "white", fontWeight: "bold" }} />}
              {destination && <Marker position={destination} label={{ text: "B", color: "white", fontWeight: "bold" }} />}
              
              {routeData && !loading && (
                <>
                  {/* Draw Unselected Routes First */}
                  {routeData.routes.filter((r:any) => r.route_id !== selectedRouteId).map((r: any) => (
                    r.segments.map((seg: any) => (
                      <Polyline 
                        key={`${r.route_id}-${seg.segment_id}`}
                        path={seg.geometry.coordinates.map((c:any) => ({ lat: c[1], lng: c[0] }))}
                        options={{ 
                          strokeColor: getRiskColor(getRiskLevel(seg)), 
                          strokeWeight: 6,
                          strokeOpacity: 0.35,
                          zIndex: 10
                        }}
                        onClick={() => { setSelectedRouteId(r.route_id); setActiveSegment(seg); }}
                      />
                    ))
                  ))}

                  {/* Draw Selected Route on Top */}
                  {routeData.routes.filter((r:any) => r.route_id === selectedRouteId).map((r: any) => (
                    r.segments.map((seg: any) => (
                      <Polyline 
                        key={`${r.route_id}-${seg.segment_id}`}
                        path={seg.geometry.coordinates.map((c:any) => ({ lat: c[1], lng: c[0] }))}
                        options={{ 
                          strokeColor: getRiskColor(getRiskLevel(seg)), 
                          strokeWeight: 8,
                          strokeOpacity: 1.0,
                          zIndex: 100
                        }}
                        onClick={() => { setActiveSegment(seg); }}
                      />
                    ))
                  ))}
                </>
              )}
            </GoogleMap>
          </div>
        </div>
      </div>
    </div>
  );
}
