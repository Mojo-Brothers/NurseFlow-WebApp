import React, { useState } from 'react';
import PresentationCard from '../../../components/ui/PresentationCard';
import { getPOIs } from '../../patient/services/wayfinding.service.js';

/**
 * WayfindingAdmin — Enterprise tool for managing facility floor plans and POIs.
 */
export default function WayfindingAdmin() {
  const [allPois] = useState(getPOIs());
  const [currentFloor, setCurrentFloor] = useState(1);
  const [selectedPoi, setSelectedPoi] = useState(null);

  const floorPois = allPois.filter(p => p.floor === currentFloor);

  return (
    <div className="p-8 flex-column gap-10 animate-fade-in max-w-[1600px] mx-auto w-full h-full overflow-y-auto">
       <header className="flex-row justify-between items-end">
          <div>
             <h1 className="text-5xl font-black tracking-tighter uppercase mb-2">Map Configuration</h1>
             <p className="text-on-surface-variant font-medium opacity-60">Enterprise Facility Intelligence • POI Management</p>
          </div>
          <button className="btn-primary text-[10px] font-black uppercase px-8 py-3 shadow-lg">Add New Location</button>
       </header>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* 📍 POI LIST */}
          <div className="lg:col-span-4 space-y-4">
             <div className="flex flex-row justify-between items-center px-2">
                <h3 className="text-[10px] font-black uppercase tracking-widest opacity-40">Registered Locations</h3>
                <div className="flex flex-row gap-2">
                   {[1, 2].map(f => (
                      <button 
                        key={f}
                        onClick={() => setCurrentFloor(f)}
                        className={`w-8 h-8 rounded-lg text-[9px] font-black transition-all ${currentFloor === f ? 'bg-primary text-white' : 'bg-surface-container'}`}
                      >
                         L{f}
                      </button>
                   ))}
                </div>
             </div>
             
             {floorPois.map(poi => (
                <div 
                  key={poi.id} 
                  onClick={() => setSelectedPoi(poi)}
                  className={`p-6 rounded-[2rem] border transition-all cursor-pointer flex-row justify-between items-center
                    ${selectedPoi?.id === poi.id ? 'bg-primary text-white border-primary shadow-xl scale-105' : 'bg-surface border-outline-variant hover:bg-primary/5'}`}
                >
                   <div className="flex-column">
                      <span className="text-xs font-black uppercase tracking-tighter">{poi.name}</span>
                      <span className={`text-[9px] font-bold uppercase opacity-60 ${selectedPoi?.id === poi.id ? 'text-white' : ''}`}>Level {poi.floor} • ID: {poi.id}</span>
                   </div>
                   <span className="material-symbols-outlined opacity-40">location_on</span>
                </div>
             ))}
          </div>

          {/* 🗺️ MAP CANVAS */}
          <div className="lg:col-span-8">
             <PresentationCard padding="3rem" className="bg-surface border-none shadow-sm h-full flex-column gap-8">
                <div className="flex-row justify-between items-center">
                   <h3 className="text-sm font-black uppercase">Facility Visual Editor — Level {currentFloor}</h3>
                   <div className="flex-row gap-4">
                      <span className="text-[10px] font-black uppercase px-3 py-1 bg-surface-container rounded-full">Viewing Floor: {currentFloor}</span>
                      <span className="text-[10px] font-black uppercase px-3 py-1 bg-surface-container rounded-full">Zoom: 100%</span>
                   </div>
                </div>

                <div className="relative w-full aspect-[16/9] bg-surface-container rounded-[3rem] overflow-hidden border-4 border-dashed border-outline-variant">
                   <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
                   
                   {floorPois.map(poi => (
                      <div 
                        key={poi.id}
                        className={`absolute w-6 h-6 rounded-full border-4 border-white shadow-lg cursor-move
                          ${selectedPoi?.id === poi.id ? 'bg-primary scale-125 z-20' : 'bg-outline-variant opacity-40'}`}
                        style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
                      />
                   ))}

                   {selectedPoi && selectedPoi.floor === currentFloor && (
                      <div className="absolute top-4 right-4 bg-surface/90 backdrop-blur p-6 rounded-3xl shadow-2xl border border-primary/20 w-64 animate-fade-in">
                         <h4 className="text-xs font-black uppercase mb-4 border-b pb-2">Location Data</h4>
                         <div className="space-y-4">
                            <div className="flex-column gap-1">
                               <label className="text-[8px] font-black uppercase opacity-40">Coordinates</label>
                               <span className="text-xs font-bold font-mono">X: {selectedPoi.x} / Y: {selectedPoi.y}</span>
                            </div>
                            <div className="flex-column gap-1">
                               <label className="text-[8px] font-black uppercase opacity-40">Display Name</label>
                               <input type="text" value={selectedPoi.name} className="bg-surface-container p-2 rounded text-xs font-bold" readOnly />
                            </div>
                            <button className="w-full py-3 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest mt-2">Save Placement</button>
                         </div>
                      </div>
                   )}
                </div>

                <p className="text-[10px] font-medium opacity-40 text-center italic">
                   "Drag markers to update physical locations in the patient wayfinding system."
                </p>
             </PresentationCard>
          </div>
       </div>
    </div>
  );
}
