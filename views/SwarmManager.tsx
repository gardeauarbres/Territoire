
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Swarm, Profile, ImpactStats } from '../types';
import { suggestSwarm } from '../services/geminiService';

const SwarmManager: React.FC = () => {
  const [swarms, setSwarms] = useState<Swarm[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newMotto, setNewMotto] = useState('');
  
  const [oracleSuggestion, setOracleSuggestion] = useState<string | null>(null);
  const [isConsultingOracle, setIsConsultingOracle] = useState(false);

  const loadData = async () => {
    const [s, p] = await Promise.all([
      db.getSwarms(),
      db.getProfile()
    ]);
    setSwarms(s.sort((a, b) => b.reputation - a.reputation));
    setProfile(p);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleJoin = async (id: string) => {
    const updated = await db.joinSwarm(id);
    setProfile(updated);
    loadData();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newDesc) return;
    await db.createSwarm(newName, newDesc, newMotto);
    setIsCreating(false);
    loadData();
  };

  const consultOracle = async () => {
    if (!profile) return;
    setIsConsultingOracle(true);
    try {
      const impact = await db.getImpactStats();
      const suggestion = await suggestSwarm(profile, impact, swarms);
      setOracleSuggestion(suggestion);
    } catch (e) {
      console.error(e);
    } finally {
      setIsConsultingOracle(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );

  const mySwarm = swarms.find(s => s.id === profile?.swarm_id);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-[0.3em] uppercase text-white neon-text">Les Essaims</h2>
        <p className="text-[10px] font-mono text-green-700 uppercase tracking-widest">Synergie Bio-Collective du Secteur</p>
      </div>

      {/* Oracle Section */}
      {!profile?.swarm_id && (
        <div className="glass-panel p-6 rounded-3xl border-dashed border-green-500/30">
          <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-widest mb-4">Oracle de Recrutement</h3>
          {oracleSuggestion ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95">
               <p className="text-sm italic text-slate-200 leading-relaxed font-serif">"{oracleSuggestion}"</p>
               <button onClick={() => setOracleSuggestion(null)} className="text-[8px] text-slate-600 uppercase font-bold hover:text-white">Réessayer</button>
            </div>
          ) : (
            <button 
              onClick={consultOracle}
              disabled={isConsultingOracle}
              className="w-full py-3 bg-green-950/40 border border-green-500/20 text-green-400 text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-green-500 hover:text-black transition-all"
            >
              {isConsultingOracle ? "Analyse de vos fréquences..." : "Interroger l'Oracle des Essaims"}
            </button>
          )}
        </div>
      )}

      {/* User Swarm Status */}
      {mySwarm ? (
        <div className="glass-panel p-6 rounded-3xl border-2 border-green-400 shadow-[0_0_20px_rgba(34,197,94,0.2)]">
           <div className="flex items-center gap-4 mb-4">
              <img src={mySwarm.avatar_url} className="w-16 h-16 rounded-2xl bg-black border border-green-500/20" alt="Swarm" />
              <div>
                 <div className="text-[10px] font-bold text-green-500 uppercase tracking-widest">Votre Essaim</div>
                 <h3 className="text-xl font-bold text-white uppercase">{mySwarm.name}</h3>
                 <p className="text-[10px] font-mono italic text-slate-500">"{mySwarm.motto}"</p>
              </div>
           </div>
           <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-3 bg-black/40 rounded-xl border border-green-900/30">
                 <div className="text-[8px] text-slate-500 uppercase font-bold">Résonance</div>
                 <div className="text-xl font-bold text-white">{mySwarm.reputation} <span className="text-[10px] text-green-500">RP</span></div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-green-900/30">
                 <div className="text-[8px] text-slate-500 uppercase font-bold">Membres</div>
                 <div className="text-xl font-bold text-white">{mySwarm.member_count}</div>
              </div>
           </div>
        </div>
      ) : (
        <button 
          onClick={() => setIsCreating(true)}
          className="w-full py-4 bg-slate-900/50 border border-dashed border-green-500/30 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:border-green-500 hover:text-green-500 transition-all"
        >
          + Initialiser un Nouvel Essaim
        </button>
      )}

      {/* Leaderboard */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Résonance Globale du Secteur</h3>
        <div className="space-y-3">
          {swarms.map((s, idx) => (
            <div key={s.id} className={`glass-panel p-4 rounded-2xl border flex items-center justify-between group transition-all ${s.id === profile?.swarm_id ? 'border-green-500' : 'border-slate-900/50'}`}>
               <div className="flex items-center gap-4">
                  <div className="relative">
                    <img src={s.avatar_url} className="w-10 h-10 rounded-lg bg-black border border-white/5" alt={s.name} />
                    <div className="absolute -top-2 -left-2 w-5 h-5 bg-slate-900 rounded-full flex items-center justify-center border border-white/10 text-[8px] font-bold text-slate-500">
                       #{idx + 1}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase group-hover:text-green-400 transition-colors">{s.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                       <span className="text-[8px] font-mono text-slate-600 uppercase tracking-tighter">{s.member_count} GARDIEŃS</span>
                       <span className="w-1 h-1 rounded-full bg-slate-800"></span>
                       <span className="text-[8px] font-mono text-green-900 uppercase tracking-tighter">{s.reputation} RP</span>
                    </div>
                  </div>
               </div>
               
               {s.id !== profile?.swarm_id && (
                 <button 
                  onClick={() => handleJoin(s.id)}
                  className="px-4 py-1.5 rounded-lg border border-green-500/20 text-[9px] font-bold uppercase tracking-widest text-green-500 hover:bg-green-500 hover:text-black transition-all"
                 >
                   Rejoindre
                 </button>
               )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Modal Simulation */}
      {isCreating && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
           <div className="glass-panel w-full max-w-sm p-8 rounded-3xl border-green-500/50 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
              <h3 className="text-xl font-bold text-white uppercase tracking-widest mb-6">Initialisation Bio-Sémantique</h3>
              <form onSubmit={handleCreate} className="space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nom de l'Essaim</label>
                    <input 
                      type="text" required value={newName} onChange={(e) => setNewName(e.target.value)}
                      className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-green-400 font-mono focus:outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Poésie de Transmission (Devise)</label>
                    <input 
                      type="text" value={newMotto} onChange={(e) => setNewMotto(e.target.value)}
                      className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-green-400 font-mono focus:outline-none"
                    />
                 </div>
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Vocation de l'Essaim</label>
                    <textarea 
                      required value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                      className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-green-400 font-mono focus:outline-none h-24"
                    />
                 </div>
                 <div className="flex gap-2 pt-4">
                    <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-3 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-white">Annuler</button>
                    <button type="submit" className="flex-1 py-3 bg-green-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-green-500/20">Activer l'Essaim</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default SwarmManager;
