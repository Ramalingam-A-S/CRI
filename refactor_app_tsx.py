import os

app_tsx_path = r'd:\Aracnids\frontend\src\App.tsx'

content = """import React, { useState } from 'react';
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
    return '#22c55e'; // green-500
  };

  const fastestRoute = routeData?.routes.find((r: any) => r.type === 'FASTEST');
  const saferRoute = routeData?.routes.find((r: any) => r.type === 'SAFER_ALTERNATIVE');

  if (!isLoaded) return <div className="w-full h-screen flex items-center justify-center bg-gray-900 text-white font-mono">LOADING GOOGLE MAPS...</div>;

  return (
    <div className="relative w-full h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      
      {/* 1. ROUTE INPUT PANEL */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-[10] w-[calc(100%-2rem)] sm:w-80 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-5 border border-slate-200">
        <div className="flex items-center gap-2 mb-5">
          <Navigation className="w-5 h-5 text-emerald-600" />
          <h1 className="text-lg font-black text-slate-900 tracking-tight">ClimaRoute Engine</h1>
        </div>

        <div className="space-y-3 relative">
          <div className="absolute left-[15px] top-[24px] bottom-[24px] w-[2px] bg-slate-200 z-0"></div>
          {/* Origin */}
          <div className="relative z-10">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            </div>
            <input 
              type="text" readOnly
              className="w-full pl-8 pr-3 py-2.5 bg-slate-100 border-0 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 cursor-pointer focus:ring-2 focus:ring-emerald-500"
              placeholder="Click map to set Origin..."
              value={origin ? `${origin.lat.toFixed(4)}, ${origin.lng.toFixed(4)}` : ''}
            />
          </div>
          {/* Destination */}
          <div className="relative z-10">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <input 
              type="text" readOnly
              className="w-full pl-8 pr-3 py-2.5 bg-slate-100 border-0 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 cursor-pointer focus:ring-2 focus:ring-rose-500"
              placeholder="Click map to set Destination..."
              value={destination ? `${destination.lat.toFixed(4)}, ${destination.lng.toFixed(4)}` : ''}
            />
          </div>
        </div>

        {errorMsg && <div className="mt-3 text-[10px] text-rose-600 font-bold bg-rose-50 p-2 rounded">{errorMsg}</div>}

        <button 
          onClick={analyzeRoute}
          disabled={loading || !origin || !destination}
          className="w-full bg-slate-900 hover:bg-black disabled:bg-slate-300 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex justify-center items-center gap-2 mt-5"
        >
          {loading ? (
             <span className="animate-pulse">Analyzing route climate conditions...</span>
          ) : (
             <><Search className="w-4 h-4" /> Analyze Route</>
          )}
        </button>
      </div>

      {/* 2. HAZARD & TEMPORAL CONTROL */}
      {routeData && !loading && (
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-[10] bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-4 border border-slate-200 flex flex-col gap-4">
          <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">CLIMATE RISK</p>
              <div className="flex bg-slate-100 rounded-lg p-1">
                {['ALL', 'FLOOD', 'RAIN', 'HEAT', 'LANDSLIDE'].map(h => (
                  <button 
                    key={h}
                    onClick={() => { setHazardMode(h as HazardMode); setActiveSegment(null); }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${hazardMode === h ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
          </div>
          <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">DEPARTURE TIME</p>
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-100 rounded-lg p-2">
                 <Clock className="w-4 h-4 mr-2"/>
                 <input 
                    type="time" 
                    value={departureTime}
                    onChange={(e) => { setDepartureTime(e.target.value); }}
                    onBlur={analyzeRoute}
                    className="bg-transparent border-none outline-none text-slate-900 font-mono"
                 />
              </div>
          </div>
        </div>
      )}

      {/* 3. ROUTE COMPARISON PANEL */}
      {routeData && !loading && (
        <div className="absolute bottom-16 left-4 sm:bottom-6 sm:left-6 z-[10] w-[calc(100%-2rem)] sm:w-80 max-h-[80vh] overflow-y-auto bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-5 border border-slate-200">
           
           <div className="mb-4">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">ROUTE RECOMMENDATION</p>
             <h2 className="text-xl font-black text-slate-900 tracking-tight">{routeData.recommendation_reason}</h2>
             
             {saferRoute && (
               <div className="mt-2 text-sm text-slate-600 font-medium bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                 {saferRoute.summary.reasons.map((r: string, i: number) => (
                   <div key={i} className="flex items-center gap-1">
                     <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                     <span>{r}</span>
                   </div>
                 ))}
               </div>
             )}
           </div>

           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 mt-4">ROUTE COMPARISON</p>
           
           <div className="space-y-3">
             {routeData.routes.map((r: any) => {
               const isSelected = selectedRouteId === r.route_id;
               const isFastest = r.type === 'FASTEST';
               return (
                 <div 
                   key={r.route_id}
                   onClick={() => setSelectedRouteId(r.route_id)}
                   className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${isSelected ? (isFastest ? 'border-slate-800 bg-slate-50' : 'border-emerald-500 bg-emerald-50') : 'border-slate-100 hover:border-slate-300'}`}
                 >
                   <div className="flex justify-between items-start mb-2">
                     <div>
                       <span className={`text-[10px] uppercase font-black px-1.5 py-0.5 rounded ${isFastest ? 'bg-slate-200 text-slate-700' : 'bg-emerald-200 text-emerald-800'}`}>
                         {isFastest ? 'FASTEST' : 'SAFER'}
                       </span>
                     </div>
                     <div className="text-right">
                       <p className="text-sm font-black text-slate-900">{Math.round(r.route.duration_s / 60)} min</p>
                       <p className="text-[10px] font-semibold text-slate-500">{(r.route.distance_m / 1000).toFixed(1)} km</p>
                     </div>
                   </div>
                   
                   <div className="flex justify-between items-end mt-2">
                     <div>
                       <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Overall Risk</p>
                       <p className="text-sm font-black" style={{color: getRiskColor(r.overall_risk.level)}}>{r.overall_risk.level}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">High/Crit Exposed</p>
                       <p className="text-sm font-black text-slate-700">{r.summary.exposure_percent}%</p>
                     </div>
                   </div>

                   {/* Explanations */}
                   {isSelected && r.summary.reasons.length > 0 && (
                     <div className="mt-3 pt-3 border-t border-slate-200/50">
                       <p className="text-[10px] font-black text-slate-400 uppercase mb-1">WHY?</p>
                       <ul className="text-xs font-medium space-y-1">
                         {r.summary.reasons.map((reason: string, i: number) => (
                           <li key={i} className={r.type === 'FASTEST' && r.summary.high_risk_segments > 0 ? "text-rose-600" : "text-emerald-700"}>
                             {reason}
                           </li>
                         ))}
                       </ul>
                     </div>
                   )}
                 </div>
               );
             })}
           </div>

           <p className="text-[8px] text-slate-400 mt-4 text-center">Prototype climate-risk assessment — not an official safety guarantee.</p>
        </div>
      )}

      {/* 4. CLICKABLE SEGMENT INFO CARD */}
      {activeSegment && !loading && (
         <div className="absolute bottom-4 right-4 sm:bottom-6 sm:right-6 z-[10] w-[calc(100%-2rem)] sm:w-80 bg-white/95 backdrop-blur-xl shadow-2xl rounded-2xl p-5 border border-slate-200">
            <div className="flex justify-between items-start mb-3">
                <div>
                   <p className="text-[10px] text-slate-500 font-bold uppercase mb-1">SEGMENT {activeSegment.segment_id}</p>
                   <h3 className="font-black text-slate-900 text-sm" style={{color: getRiskColor(getRiskLevel(activeSegment))}}>
                      {getRiskLevel(activeSegment)} {hazardMode === 'ALL' ? 'OVERALL' : hazardMode} RISK
                   </h3>
                </div>
                <button onClick={() => setActiveSegment(null)} className="text-slate-400 hover:text-slate-800 text-lg">&times;</button>
            </div>
            
            {/* Explainability Factors */}
            {(() => {
                let factors: any = {};
                if (hazardMode === 'FLOOD' || hazardMode === 'ALL' || hazardMode === 'RAIN') factors = activeSegment.flood_risk.factors;
                else if (hazardMode === 'HEAT') factors = activeSegment.heat_risk.factors;
                else if (hazardMode === 'LANDSLIDE') factors = activeSegment.landslide_risk.factors;
                
                if (factors && Object.keys(factors).length > 0) {
                    return (
                        <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl mb-3">
                            <p className="text-[10px] font-black text-slate-600 uppercase mb-2">WHY?</p>
                            <ul className="text-xs text-slate-700 font-semibold space-y-1">
                                {Object.entries(factors).map(([k,v]: any) => (
                                   <li key={k} className="flex justify-between"><span>• {k}:</span><span className="font-mono">+{v}</span></li>
                                ))}
                            </ul>
                        </div>
                    );
                }
                return null;
            })()}

            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mt-2 pt-2 border-t border-slate-100">
               <span>Travel Window: {activeSegment.estimated_arrival_time}</span>
               {activeSegment.confidence !== undefined && (
                 <span>Confidence: {(activeSegment.confidence * 100).toFixed(0)}%</span>
               )}
            </div>
         </div>
      )}

      {/* 5. LEGEND */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[10] bg-white/90 backdrop-blur-xl px-4 py-2 rounded-full shadow-lg border border-slate-200 flex items-center gap-4 text-[10px] font-black uppercase text-slate-500">
          <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-1"></div> LOW</span>
          <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div> MODERATE</span>
          <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-orange-500 mr-1"></div> HIGH</span>
          <span className="flex items-center"><div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div> SEVERE</span>
      </div>

      {/* MAP */}
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
            { featureType: 'transit', elementType: 'labels', stylers: [{ visibility: 'off' }] }
          ]
        }}
      >
        {origin && <Marker position={origin} />}
        {destination && <Marker position={destination} />}
        
        {routeData && !loading && routeData.routes.map((r: any) => {
          const isSelected = selectedRouteId === r.route_id;
          const isFastest = r.type === 'FASTEST';
          const zIndex = isSelected ? 100 : 50;
          
          return r.segments.map((seg: any) => (
            <Polyline 
              key={`${r.route_id}-${seg.segment_id}`}
              path={seg.geometry.coordinates.map((c:any) => ({ lat: c[1], lng: c[0] }))}
              options={{ 
                strokeColor: getRiskColor(getRiskLevel(seg)), 
                strokeWeight: isSelected ? 8 : 6,
                strokeOpacity: isSelected ? 1.0 : (isFastest ? 0.4 : 0.3),
                zIndex: zIndex
              }}
              onClick={() => { setSelectedRouteId(r.route_id); setActiveSegment(seg); }}
            />
          ));
        })}
      </GoogleMap>
    </div>
  );
}
"""

with open(app_tsx_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Updated App.tsx successfully')
