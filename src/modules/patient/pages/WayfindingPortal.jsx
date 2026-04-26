import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getPOIs, calculateRoute, getPOIsByFloor } from '../services/wayfinding.service.js';

/**
 * WayfindingPortal — The interactive digital guide for hospital navigation.
 */
export default function WayfindingPortal() {
  const allPois = getPOIs();
  const [searchParams] = useSearchParams();
  const to = searchParams.get('to');
  
  const [startPoint, setStartPoint] = useState('lobby');
  const [endPoint, setEndPoint] = useState(to || 'lab');
  const [currentFloor, setCurrentFloor] = useState(() => {
    return allPois.find(p => p.id === 'lobby')?.floor || 1;
  });

  // Derived state: Calculate route
  const route = React.useMemo(() => {
    return calculateRoute(startPoint, endPoint);
  }, [startPoint, endPoint]);

  const handleStartPointChange = (newId) => {
    setStartPoint(newId);
    const poi = allPois.find(p => p.id === newId);
    if (poi) setCurrentFloor(poi.floor);
  };

  const floorPois = getPOIsByFloor(currentFloor);



  return (
    <div className="min-h-screen bg-surface-container flex flex-col p-6 animate-fade-in md:max-w-[480px] md:mx-auto">
       <header className="flex flex-row justify-between items-center mb-6">
          <div className="flex flex-col">
             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Wayfinding Service</span>
             <h1 className="text-2xl font-black tracking-tighter">Indoor Navigation</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
             <span className="material-symbols-outlined">map</span>
          </button>
       </header>

       {/* 🏢 FLOOR SWITCHER */}
       <div className="flex flex-row gap-2 mb-6">
          {[1, 2].map(floor => (
             <button 
                key={floor}
                onClick={() => setCurrentFloor(floor)}
                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${currentFloor === floor ? 'bg-primary text-white shadow-lg scale-105' : 'bg-surface text-on-surface opacity-60'}`}
             >
                Level {floor}
             </button>
          ))}
       </div>

       {/* 🗺️ INTERACTIVE MAP */}
       <div className="relative w-full aspect-square bg-surface rounded-[3rem] shadow-xl mb-8 overflow-hidden border-8 border-surface">
          <div className="absolute inset-0 bg-primary/5 opacity-40" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          
          {/* Floor Labels */}
          <div className="absolute top-6 left-6 bg-surface-container/80 backdrop-blur px-4 py-2 rounded-2xl border border-outline-variant z-10">
             <span className="text-[10px] font-black uppercase tracking-tighter opacity-60">Viewing Floor</span>
             <p className="text-sm font-black">Level {currentFloor}</p>
          </div>

          {/* POI Markers (Filtered by Floor) */}
          {floorPois.map(poi => (
             <div 
               key={poi.id}
               className={`absolute w-4 h-4 rounded-full border-4 border-white shadow-md transition-all duration-500
                 ${poi.id === startPoint ? 'bg-secondary scale-150 z-20' : 
                   poi.id === endPoint ? 'bg-primary scale-150 z-20 animate-bounce' : 'bg-outline-variant opacity-40'}`}
               style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
             >
                {(poi.id === startPoint || poi.id === endPoint) && (
                   <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[8px] font-black px-2 py-1 rounded whitespace-nowrap uppercase">
                      {poi.name}
                   </div>
                )}
             </div>
          ))}

          {/* Path Rendering (Only if points are on current floor) */}
          {route && (
             <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {route.path.map((point, index) => {
                   if (index === 0) return null;
                   const prev = route.path[index - 1];
                   if (prev.floor === currentFloor && point.floor === currentFloor) {
                      return (
                         <line 
                           key={index}
                           x1={`${prev.x}%`} y1={`${prev.y}%`} 
                           x2={`${point.x}%`} y2={`${point.y}%`} 
                           stroke="var(--primary)" strokeWidth="4" strokeDasharray="8,8" className="animate-dash"
                         />
                      );
                   }
                   return null;
                })}
             </svg>
          )}
       </div>

       {/* 🧭 NAVIGATION CONTROLS */}
       <div className="space-y-6 mb-8">
          <div className="grid grid-cols-2 gap-4">
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase opacity-40 ml-2">Start From</label>
                <select 
                  className="form-input bg-surface text-xs font-bold py-3" 
                  value={startPoint} 
                  onChange={e => handleStartPointChange(e.target.value)}
                >
                   {allPois.map(p => <option key={p.id} value={p.id}>{p.name} (L{p.floor})</option>)}
                </select>
             </div>
             <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black uppercase opacity-40 ml-2">Go To</label>
                <select className="form-input bg-surface text-xs font-bold py-3" value={endPoint} onChange={e => setEndPoint(e.target.value)}>
                   {allPois.map(p => <option key={p.id} value={p.id}>{p.name} (L{p.floor})</option>)}
                </select>
             </div>
          </div>
          <div 
            className="w-full py-4 bg-primary text-white rounded-3xl text-xs font-black uppercase tracking-widest shadow-lg text-center opacity-90"
          >
             Navigation Active
          </div>
       </div>

       {/* 🚶 STEP DIRECTIONS */}
       {route && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
             <div className="flex flex-row justify-between items-end mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40 ml-2">Instructions</h3>
                <span className="text-[9px] font-bold text-primary uppercase">{route.steps.length} Steps</span>
             </div>
             {route.steps.map((step, i) => (
                <div key={i} className="flex flex-row items-center gap-4 bg-surface p-5 rounded-3xl shadow-sm border border-outline-variant animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                   <div className="w-10 h-10 rounded-2xl bg-primary/5 text-primary flex items-center justify-center font-black text-xs">
                      {i + 1}
                   </div>
                   <p className="text-xs font-bold leading-tight">{step}</p>
                </div>
             ))}
          </div>
       )}

       <footer className="mt-8 text-center text-[9px] font-medium opacity-40">
          NurseFlow Wayfinding — Precise Facility Intelligence
       </footer>
    </div>
  );
}
