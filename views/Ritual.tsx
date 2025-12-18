
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { CollectiveMission, Territory } from '../types';
import { generateVictoryChronicle } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { audioService } from '../services/audioService';

const Ritual: React.FC = () => {
  const [missions, setMissions] = useState<CollectiveMission[]>([]);
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebratingId, setCelebratingId] = useState<string | null>(null);
  const [contributingId, setContributingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const [m, t] = await Promise.all([
        db.getCollectiveMissions(),
        db.getTerritory()
      ]);
      setMissions(m);
      setTerritory(t);
    } catch (e) {
      console.error("Liaison Nexus interrompue");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleContribute = async (missionId: string) => {
    setContributingId(missionId);
    audioService.playClick();
    try {
      // Contribution de 50 points de Bio-Flux
      await db.updateCollectiveMission(missionId, 50);
      
      const mission = missions.find(m => m.id === missionId);
      if (mission?.type === 'EMERGENCY') {
        audioService.vibrate([50, 20, 50]);
        // Stabilisation légère du territoire (logique côté DB ou via un appel updateTerritory si dispo)
      }
      
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setContributingId(null);
    }
  };

  const triggerCompletion = async (mission: CollectiveMission) => {
    setCelebratingId(mission.id);
    audioService.vibrate([200, 100, 200, 100, 500]);
    try {
      // 1. Générer la prophétie via Gemini
      const chronicleContent = await generateVictoryChronicle(mission.title, `${mission.goal_value} ${mission.unit}`);
      
      // 2. Archiver dans les Chroniques globales
      await db.addChronicle({
        title: `Victoire : ${mission.title}`,
        content: chronicleContent,
        threat_level: mission.type === 'EMERGENCY' ? 'MEDIUM' : 'LOW',
        highlighted_swarm_name: "Gardiens Unis"
      });

      // 3. Marquer la mission comme archivée avec son texte
      await db.updateCollectiveMission(mission.id, 0, chronicleContent);
      
      await load();
    } catch (e) {
      console.error("Échec de l'invocation du Mycélium", e);
    } finally {
      setCelebratingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );

  const isCrisis = (territory?.stability_score || 100) < 30;

  return (
    <div className={`space-y-8 pb-10 animate-in fade-in duration-700 ${isCrisis ? 'crisis-mode' : ''}`}>
      <div className="text-center space-y-2">
        <h2 className={`text-2xl font-bold tracking-[0.4em] uppercase transition-colors duration-500 ${isCrisis ? 'text-red-500' : 'text-white neon-glow inline-block p-2'}`}>
          {isCrisis ? 'Nexus en Alerte' : 'Le Grand Rituel'}
        </h2>
        <p className={`text-[10px] font-mono uppercase tracking-widest ${isCrisis ? 'text-red-900' : 'text-green-500'}`}>
          {isCrisis ? 'Convergence Tactique de Survie' : 'Convergence des Énergies Biologiques'}
        </p>
      </div>

      {/* Territory Health HUD */}
      {territory && (
        <motion.div 
          layout
          className={`glass-panel p-6 rounded-3xl border transition-all duration-1000 relative overflow-hidden ${isCrisis ? 'border-red-500 bg-red-950/10 shadow-[0_0_30px_rgba(220,38,38,0.2)]' : 'border-green-500/20'}`}
        >
           <div className={`absolute top-0 right-0 p-8 opacity-10 text-6xl transform rotate-12 transition-colors ${isCrisis ? 'text-red-600' : 'text-green-500'}`}>
             <i className={`fas ${isCrisis ? 'fa-biohazard' : 'fa-tree'}`}></i>
           </div>
           <div className="relative z-10 flex flex-col items-center">
              <div className={`text-[10px] font-bold uppercase tracking-[0.3em] mb-4 ${isCrisis ? 'text-red-500' : 'text-slate-500'}`}>État de Santé du Secteur</div>
              
              <div className="relative w-32 h-32 flex items-center justify-center">
                 <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="58" fill="transparent" stroke={isCrisis ? "rgba(220,38,38,0.1)" : "rgba(34,197,94,0.1)"} strokeWidth="8" />
                    <motion.circle 
                      initial={{ strokeDashoffset: 2 * Math.PI * 58 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 58 * (1 - territory.health_score / 100) }}
                      cx="64" 
                      cy="64" 
                      r="58" 
                      fill="transparent" 
                      stroke={isCrisis ? "#dc2626" : "#22c55e"}
                      strokeWidth="8" 
                      strokeDasharray={2 * Math.PI * 58}
                      strokeLinecap="round"
                      className="transition-all duration-1000 shadow-xl"
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-3xl font-bold leading-none transition-colors ${isCrisis ? 'text-red-500' : 'text-white'}`}>{territory.health_score}%</span>
                    <span className={`text-[8px] font-mono uppercase ${isCrisis ? 'text-red-900' : 'text-green-500'}`}>Vitalité</span>
                 </div>
              </div>

              <div className="mt-6 flex gap-8">
                 <div className="text-center">
                    <div className="text-xs font-bold text-white">{territory.active_nodes}</div>
                    <div className="text-[7px] text-slate-500 uppercase tracking-widest">Nœuds Actifs</div>
                 </div>
                 <div className="text-center">
                    <div className="text-xs font-bold text-white">{territory.stability_score}%</div>
                    <div className="text-[7px] text-slate-500 uppercase tracking-widest">Stabilité</div>
                 </div>
              </div>
           </div>
        </motion.div>
      )}

      <div className="space-y-6">
        <AnimatePresence>
          {missions.map(m => {
            const isEmergency = m.type === 'EMERGENCY';
            const progress = Math.min((m.current_value / m.goal_value) * 100, 100);
            
            return (
              <motion.div 
                key={m.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`relative group ${m.is_completed ? 'order-last opacity-80' : 'order-first'}`}
              >
                {isEmergency && !m.is_completed && (
                  <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-red-900 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                )}
                
                <div className={`relative glass-panel p-6 rounded-3xl border-2 transition-all duration-500 ${
                  m.is_completed ? 'border-green-400 bg-green-950/20' : 
                  isEmergency ? 'border-red-500 bg-red-950/10' : 'border-green-900/30'
                }`}>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        {isEmergency && !m.is_completed && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isEmergency ? 'text-red-500' : 'text-green-600'}`}>
                          {isEmergency ? 'Urgence Tactique' : 'Croissance Mycélienne'}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-tight">{m.title}</h3>
                      <p className="text-xs text-slate-400 mt-1 italic">"{m.description}"</p>
                    </div>
                    {m.is_completed ? (
                      <i className="fas fa-crown text-yellow-500 text-xl animate-bounce"></i>
                    ) : (
                      <i className={`fas ${isEmergency ? 'fa-radiation animate-spin duration-[5s] text-red-600' : 'fa-seedling text-green-600'} text-xl`}></i>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between text-[10px] font-mono">
                      <span className={isEmergency ? 'text-red-400' : 'text-green-500'}>SYNCHRONISATION</span>
                      <span className="text-white">{m.current_value} / {m.goal_value} {m.unit}</span>
                    </div>
                    
                    <div className={`h-4 w-full bg-black rounded-full border p-0.5 overflow-hidden ${isEmergency ? 'border-red-900/50' : 'border-green-900/50'}`}>
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className={`h-full rounded-full transition-all duration-1000 shadow-lg ${
                          m.is_completed ? 'bg-green-400' : 
                          isEmergency ? 'bg-gradient-to-r from-red-900 to-red-400' : 'bg-gradient-to-r from-green-900 to-green-400'
                        }`}
                      />
                    </div>

                    {!m.is_completed && (
                      <button 
                        onClick={() => handleContribute(m.id)}
                        disabled={contributingId === m.id}
                        className={`w-full py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-lg ${
                          isEmergency 
                          ? 'bg-red-600 text-white hover:bg-red-500' 
                          : 'bg-green-950/40 border border-green-500/20 text-green-500 hover:bg-green-500 hover:text-black'
                        }`}
                      >
                        {contributingId === m.id ? "Injection..." : `Contribuer (+50 ${m.unit})`}
                      </button>
                    )}
                  </div>

                  {m.is_completed && m.victory_chronicle && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} 
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-6 p-4 bg-black/50 border border-green-400/30 rounded-2xl"
                    >
                      <div className="text-[8px] font-bold text-green-500 uppercase tracking-widest mb-2">Chronique Archivée</div>
                      <p className="text-sm italic text-slate-200 leading-relaxed font-serif">"{m.victory_chronicle}"</p>
                    </motion.div>
                  )}

                  {m.is_completed && !m.victory_chronicle && (
                    <button 
                      onClick={() => triggerCompletion(m)}
                      disabled={celebratingId === m.id}
                      className="w-full mt-6 py-3 bg-green-500 text-black font-bold uppercase text-[10px] tracking-widest rounded-xl shadow-lg shadow-green-500/20 animate-pulse"
                    >
                      {celebratingId === m.id ? "Transcription du Destin..." : "Finaliser l'Exploit Collectivement"}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      <style>{`
        .crisis-mode { animation: glitch-vibrate 0.3s infinite; }
        @keyframes glitch-vibrate {
          0% { transform: translate(0); }
          25% { transform: translate(0.5px, -0.5px); }
          50% { transform: translate(-0.5px, 0.5px); }
          75% { transform: translate(0.5px, 0.5px); }
          100% { transform: translate(0); }
        }
      `}</style>
    </div>
  );
};

export default Ritual;
