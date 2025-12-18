
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { CollectiveMission } from '../types';
import { generateVictoryChronicle } from '../services/geminiService';

const Ritual: React.FC = () => {
  const [missions, setMissions] = useState<CollectiveMission[]>([]);
  const [loading, setLoading] = useState(true);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);

  const load = async () => {
    const m = await db.getCollectiveMissions();
    setMissions(m);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerCompletion = async (mission: CollectiveMission) => {
    if (mission.is_completed && !mission.victory_chronicle) {
      setCelebratingId(mission.id);
      try {
        const chronicle = await generateVictoryChronicle(mission.title, `${mission.goal_value} ${mission.unit}`);
        await db.updateCollectiveMission(mission.id, 0, chronicle);
        load();
      } catch (e) {
        console.error(e);
      } finally {
        setCelebratingId(null);
      }
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-700">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold tracking-[0.4em] uppercase text-white neon-glow inline-block p-2">Le Grand Rituel</h2>
        <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Convergence des Énergies Biologiques</p>
      </div>

      <div className="relative">
        <div className="absolute inset-0 bg-green-500/5 blur-3xl rounded-full animate-pulse"></div>
        <div className="grid grid-cols-1 gap-6 relative z-10">
          {missions.map(m => {
            const progress = Math.min((m.current_value / m.goal_value) * 100, 100);
            return (
              <div key={m.id} className={`glass-panel p-6 rounded-3xl border-2 transition-all duration-1000 ${
                m.is_completed ? 'border-green-400 bg-green-950/20' : 'border-green-900/30'
              }`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-tight">{m.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                  </div>
                  {m.is_completed && <i className="fas fa-crown text-yellow-500 text-xl animate-bounce"></i>}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-mono text-green-500">
                    <span>PROGRESSION GLOBALE</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="h-4 w-full bg-slate-950 rounded-full border border-green-900/50 overflow-hidden p-0.5">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.5)] ${
                        m.is_completed ? 'bg-green-400' : 'bg-gradient-to-r from-green-900 via-green-600 to-green-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>{m.current_value} / {m.goal_value} {m.unit}</span>
                    <span className="animate-pulse text-green-700">RÉSONANCE ACTIVE</span>
                  </div>
                </div>

                {m.is_completed && m.victory_chronicle && (
                  <div className="mt-6 p-4 bg-black/50 border border-green-400/30 rounded-2xl animate-in zoom-in-95 duration-700">
                    <div className="text-[8px] font-bold text-green-500 uppercase tracking-widest mb-2">Chronique de Victoire</div>
                    <p className="text-sm italic text-slate-200 leading-relaxed font-serif">"{m.victory_chronicle}"</p>
                  </div>
                )}

                {m.is_completed && !m.victory_chronicle && (
                  <button 
                    onClick={() => triggerCompletion(m)}
                    disabled={celebratingId === m.id}
                    className="w-full mt-6 py-3 bg-green-500 text-black font-bold uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-green-500/20"
                  >
                    {celebratingId === m.id ? "Invocation de l'Esprit..." : "Célébrer la Réussite"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border-dashed border-green-900/50 text-center">
         <i className="fas fa-users text-3xl text-green-900/50 mb-4"></i>
         <p className="text-xs text-slate-500 italic">Chaque mission individuelle complétée par un Gardien alimente la résonance du Rituel. Ensemble, nous soignons le Territoire.</p>
      </div>
    </div>
  );
};

export default Ritual;
