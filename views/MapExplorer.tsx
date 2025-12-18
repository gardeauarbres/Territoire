
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Spot, SpotType } from '../types';
import SpotCard from '../components/SpotCard';
import BioRadar from '../components/BioRadar';
import { ICONS } from '../constants';

const MapExplorer: React.FC = () => {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [recommended, setRecommended] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'route'>('list');

  useEffect(() => {
    const load = async () => {
      const [s, r] = await Promise.all([
        db.getSpots(),
        db.getRecommendedPath()
      ]);
      setSpots(s);
      setRecommended(r);
      setLoading(false);
    };
    load();
  }, []);

  const filteredSpots = filter === 'all' ? spots : spots.filter(s => s.type === filter);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="w-10 h-10 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
        <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Initialisation du Bio-Scan...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Bio-Radar Section */}
      <div className="relative h-64 w-full">
        <BioRadar spots={spots} activeFilter={filter} />
        
        {/* Radar Controls */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <button 
            onClick={() => setViewMode(viewMode === 'list' ? 'route' : 'list')}
            className={`w-10 h-10 rounded-full glass-panel flex items-center justify-center border transition-all ${
              viewMode === 'route' ? 'border-green-400 text-green-400 neon-glow' : 'border-green-900/40 text-slate-500'
            }`}
          >
            <i className={`fas ${viewMode === 'route' ? 'fa-project-diagram' : 'fa-list-ul'}`}></i>
          </button>
        </div>
      </div>

      {/* Quick Stats HUD */}
      <div className="flex justify-between items-center px-1">
        <div className="flex gap-4">
          <div className="flex flex-col">
            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Spots</span>
            <span className="text-sm font-mono text-green-400">{spots.length}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Densité</span>
            <span className="text-sm font-mono text-green-400">High</span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest">Localisation</span>
          <span className="text-[9px] font-mono text-green-700 block uppercase">Secteur Alpha-01</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar px-1">
        {[
          { id: 'all', label: 'Global', icon: 'fa-globe' },
          { id: SpotType.TREE, label: 'Bio-Masse', icon: 'fa-tree' },
          { id: SpotType.WATER, label: 'Hydro', icon: 'fa-tint' },
          { id: SpotType.ZONE, label: 'Diversité', icon: 'fa-leaf' }
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-2 rounded-lg flex items-center gap-2 text-[10px] font-bold whitespace-nowrap border transition-all ${
              filter === f.id 
                ? 'bg-green-500/20 border-green-400 text-green-400 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]' 
                : 'bg-slate-900/40 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <i className={`fas ${f.icon} text-xs`}></i>
            <span className="uppercase tracking-widest">{f.label}</span>
          </button>
        ))}
      </div>

      {/* View Content */}
      <div className="space-y-4 animate-in fade-in duration-500">
        {viewMode === 'route' ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-500">Parcours de Symbiose Suggéré</h2>
              <span className="text-[8px] font-mono text-slate-600">AUTO-GEN V1.2</span>
            </div>
            
            <div className="relative pl-6 space-y-4 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-gradient-to-b before:from-green-500/50 before:via-green-900/20 before:to-transparent">
              {recommended.map((spot, idx) => (
                <div key={spot.id} className="relative">
                  <div className="absolute -left-[24px] top-4 w-4 h-4 rounded-full bg-[#050801] border-2 border-green-500 flex items-center justify-center text-[8px] font-bold text-green-500 z-10 shadow-[0_0_8px_rgba(34,197,94,0.3)]">
                    {idx + 1}
                  </div>
                  <SpotCard spot={spot} />
                </div>
              ))}
              <div className="p-4 text-center">
                 <button className="text-[9px] font-bold text-green-900 uppercase tracking-[0.3em] hover:text-green-500 transition-colors">
                   + Explorer de nouveaux sentiers
                 </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Biosignaux à proximité</h2>
              <span className="text-[9px] font-mono text-slate-700">{filteredSpots.length} détectés</span>
            </div>
            {filteredSpots.length > 0 ? (
              filteredSpots.map(spot => (
                <SpotCard key={spot.id} spot={spot} />
              ))
            ) : (
              <div className="p-10 text-center glass-panel rounded-xl border-dashed border-slate-800">
                 <p className="text-xs text-slate-600 italic">Aucun biosignal correspondant au filtre dans ce secteur.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MapExplorer;
