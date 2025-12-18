
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../services/db';
import { Spot, Mission, MissionCompletion, WeatherData, Profile, Echo } from '../types';
import { ICONS } from '../constants';
import { getLocalSpeciesFromINPN, SpeciesOccurrence } from '../services/ecologyService';
import { generateMissionFromSpecies, generateSpiritVoice } from '../services/geminiService';
import { motion, AnimatePresence } from 'framer-motion';
import { audioService } from '../services/audioService';

const SpotDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [completions, setCompletions] = useState<MissionCompletion[]>([]);
  const [echos, setEchos] = useState<Echo[]>([]);
  const [localSpecies, setLocalSpecies] = useState<SpeciesOccurrence[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGeneratingMission, setIsGeneratingMission] = useState(false);
  const [newEcho, setNewEcho] = useState('');
  const spiritAudioRef = useRef<HTMLAudioElement | null>(null);

  const playSpiritWelcome = async (spotName: string, personality: string) => {
    try {
      const base64Audio = await generateSpiritVoice(spotName, personality || "Sage et protecteur");
      if (base64Audio) {
        const audioBlob = await fetch(`data:audio/pcm;base64,${base64Audio}`).then(res => res.blob());
        // Note: Gemini TTS renvoie du PCM brut, mais ici on simplifie pour le navigateur si possible 
        // ou on utilise l'AudioContext pour décoder si nécessaire. 
        // Pour cet exemple, on suppose un format lisible ou on injecte l'audio via AudioContext.
        
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        const arrayBuffer = Uint8Array.from(atob(base64Audio), c => c.charCodeAt(0)).buffer;
        const int16 = new Int16Array(arrayBuffer);
        const float32 = new Float32Array(int16.length);
        for(let i=0; i<int16.length; i++) float32[i] = int16[i]/32768;
        
        const buffer = audioCtx.createBuffer(1, float32.length, 24000);
        buffer.getChannelData(0).set(float32);
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
      }
    } catch (e) {
      console.warn("L'Esprit reste silencieux aujourd'hui.");
    }
  };

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const s = await db.getSpot(id);
      if (s) {
        setSpot(s);
        
        // Accueil vocal de l'Esprit
        playSpiritWelcome(s.name, s.spirit_personality || "Gardien de la terre");

        const [mFixed, c, e] = await Promise.all([
          db.getMissionsForSpot(s.id),
          db.getCompletions(),
          db.getEchos(s.id)
        ]);

        // Utilisation de la géolocalisation réelle pour INPN
        let species: SpeciesOccurrence[] = [];
        let dynamicMissions: Mission[] = [];
        
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                species = await getLocalSpeciesFromINPN(pos.coords.latitude, pos.coords.longitude);
                setLocalSpecies(species);

                if (species.length > 0) {
                    setIsGeneratingMission(true);
                    // On ne génère que si aucune mission dynamique n'existe déjà
                    const hasDynamic = mFixed.some(m => m.id.startsWith('dynamic'));
                    if (!hasDynamic) {
                        const randomSpecies = species[Math.floor(Math.random() * species.length)];
                        const dynamicData = await generateMissionFromSpecies(s.id, randomSpecies);
                        // Persistance en base de données !
                        const savedMission = await db.createMission({
                            ...dynamicData,
                            type: 'observation',
                            is_priority: true
                        });
                        dynamicMissions.push(savedMission);
                    }
                }
            } catch (err) {
                console.error("Échec liaison bio-data", err);
            } finally {
                setIsGeneratingMission(false);
                setMissions([...dynamicMissions, ...mFixed]);
            }
        }, (err) => {
            console.warn("Position GPS non disponible, fallback...");
            setMissions(mFixed);
        });

        setCompletions(c);
        setEchos(e);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleCompleteMission = async (missionId: string) => {
    try {
      await db.completeMission(missionId);
      audioService.playClick();
      await fetchData();
    } catch (err) {
      alert("Erreur lors de la complétion");
    }
  };

  const handleAddEcho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!spot || !newEcho.trim()) return;
    try {
      await db.addEcho(spot.id, newEcho, newEcho);
      setNewEcho('');
      const updatedEchos = await db.getEchos(spot.id);
      setEchos(updatedEchos);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
      <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Séquençage du Spot...</p>
    </div>
  );

  if (!spot) return <div className="text-white p-10 text-center">Nexus Liaison Failed: Spot Not Found</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-500 hover:text-white transition-colors border border-white/5">
          <i className="fas fa-arrow-left"></i>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-white uppercase tracking-tight">{spot.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-mono text-green-500 bg-green-950/40 px-2 py-0.5 rounded border border-green-500/20">
              #{spot.short_code}
            </span>
            <span className="text-[9px] text-slate-500 uppercase tracking-widest">{spot.type} DETECTED</span>
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-3xl border-white/5 bg-black/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10 text-4xl">
           <i className="fas fa-ghost"></i>
        </div>
        <p className="text-slate-300 italic leading-relaxed font-serif relative z-10">"{spot.description}"</p>
      </div>

      {localSpecies.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Bio-Inventaire Local (GPS)</h3>
            <span className="text-[8px] font-mono text-blue-500 uppercase px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded">Source: INPN</span>
          </div>
          <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
            {localSpecies.map((s, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex-shrink-0 w-40 glass-panel p-4 rounded-2xl border-white/5 bg-white/5"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-3 border border-blue-500/20">
                   <i className="fas fa-leaf text-xs"></i>
                </div>
                <div className="text-[10px] font-bold text-white uppercase truncate">{s.vernacularName || s.scientificName}</div>
                <div className="text-[8px] font-mono text-slate-500 italic truncate">{s.scientificName}</div>
                <div className="mt-2 text-[7px] font-bold text-blue-900 uppercase tracking-tighter">{s.group}</div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Missions de Résonance</h3>
          {isGeneratingMission && <span className="text-[8px] font-mono text-green-500 animate-pulse uppercase">Génération IA...</span>}
        </div>
        <div className="space-y-3">
          {missions.map(m => {
            const isCompleted = completions.some(c => c.mission_id === m.id);
            return (
              <div key={m.id} className={`glass-panel p-5 rounded-3xl border transition-all ${
                m.is_priority ? 'border-green-400/50 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-white/5'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    {m.is_priority && (
                       <div className="flex items-center gap-1.5 mb-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-[8px] font-bold text-green-500 uppercase tracking-widest">Urgence Bio-Data</span>
                       </div>
                    )}
                    <h4 className="font-bold text-white text-lg">{m.title}</h4>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed italic">"{m.description}"</p>
                  </div>
                  <div className="text-right">
                    <div className="text-green-500 font-mono text-sm font-bold">+{m.xp_reward} XP</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-5 border-t border-white/5 pt-4">
                   <div className="flex gap-3">
                      <div className="text-[8px] font-bold text-slate-600 uppercase">Impact: <span className="text-white">+{m.impact_value} {m.impact_type}</span></div>
                   </div>
                   {isCompleted ? (
                     <span className="px-4 py-1.5 bg-green-500/10 text-green-500 text-[10px] font-bold uppercase rounded-xl border border-green-500/20">
                       <i className="fas fa-check-circle mr-2"></i> Archivé
                     </span>
                   ) : (
                     <button 
                       onClick={() => handleCompleteMission(m.id)}
                       className="px-6 py-2 bg-green-500 text-black rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-green-400 transition-all active:scale-95 shadow-lg shadow-green-500/20"
                     >
                       Synchroniser
                     </button>
                   )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 pb-10">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">Échos du Nexus</h3>
        <form onSubmit={handleAddEcho} className="flex gap-2">
           <input 
             value={newEcho}
             onChange={e => setNewEcho(e.target.value)}
             placeholder="Laissez un message dans le Nexus..."
             className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-5 py-3 text-sm text-white focus:outline-none focus:border-green-500/50 transition-all placeholder:text-slate-700"
           />
           <button type="submit" className="w-12 h-12 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl hover:bg-green-500 hover:text-black transition-all">
             <i className="fas fa-paper-plane"></i>
           </button>
        </form>
        <div className="space-y-3 mt-6">
          <AnimatePresence>
            {echos.map((e, idx) => (
              <motion.div 
                key={e.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-4 bg-white/5 rounded-2xl border border-white/5"
              >
                 <div className="flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-700"></div>
                      <span className="text-[10px] font-bold text-green-500 uppercase">{e.username}</span>
                   </div>
                   <span className="text-[8px] font-mono text-slate-600 uppercase">{new Date(e.created_at).toLocaleTimeString()}</span>
                 </div>
                 <p className="text-xs text-slate-300 leading-relaxed italic">"{e.content}"</p>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default SpotDetails;
