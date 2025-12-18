
import React, { useState, useEffect, useRef } from 'react';
import * as RouterDOM from 'react-router-dom';
import { db } from '../services/db';
import { Spot, Mission, MissionCompletion, Echo, WeatherData, Profile } from '../types';
import { ICONS } from '../constants';
import { SpiritOfForestSession, poetizeEcho } from '../services/geminiService';

const { useParams } = RouterDOM;

const SpotDetails: React.FC = () => {
  const { id } = useParams();
  const [spot, setSpot] = useState<Spot | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [echos, setEchos] = useState<Echo[]>([]);
  const [completions, setCompletions] = useState<MissionCompletion[]>([]);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [completingMissionId, setCompletingMissionId] = useState<string | null>(null);
  const [isSpiritActive, setIsSpiritActive] = useState(false);
  const [spiritText, setSpiritText] = useState('');
  const [newEcho, setNewEcho] = useState('');
  const [isSendingEcho, setIsSendingEcho] = useState(false);
  const [isAdopting, setIsAdopting] = useState(false);
  const [customPersonality, setCustomPersonality] = useState('');
  const [isEditingPersonality, setIsEditingPersonality] = useState(false);
  const spiritSession = useRef<SpiritOfForestSession | null>(null);

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    const s = await db.getSpot(id);
    if (s) {
      setSpot(s);
      setCustomPersonality(s.spirit_personality || '');
      const [m, c, e, w, p] = await Promise.all([
        db.getMissionsForSpot(s.id),
        db.getCompletions(),
        db.getEchos(s.id),
        db.getCurrentWeather(),
        db.getProfile()
      ]);
      setMissions(m);
      setCompletions(c.filter(comp => m.some(mi => mi.id === comp.mission_id)));
      setEchos(e);
      setWeather(w);
      setProfile(p);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const toggleSpirit = async () => {
    if (isSpiritActive) {
      spiritSession.current?.stop();
      setIsSpiritActive(false);
      setSpiritText('');
    } else {
      setIsSpiritActive(true);
      setSpiritText('Initialisation du lien neuronal...');
      spiritSession.current = new SpiritOfForestSession();
      
      const instruction = `Tu es l'Esprit de la Forêt pour le spot "${spot?.name}". 
        ${spot?.owner_name ? `Ton Protecteur Titulaire est ${spot.owner_name}.` : ''}
        Ta personnalité : ${spot?.spirit_personality || "Ancestrale, protectrice, s'exprime par énigmes courtes."}
        Lieu : ${spot?.description}. 
        Missions disponibles : ${missions.map(m => m.title).join(', ')}.
        Sois mystérieux et bienveillant.`;
      
      try {
        await spiritSession.current.start(instruction, {
          onMessage: (text) => setSpiritText(prev => (prev === 'Initialisation du lien neuronal...' ? text : prev + text)),
          onError: (err) => {
            console.error(err);
            setIsSpiritActive(false);
          }
        });
      } catch (err) {
        console.error(err);
        setIsSpiritActive(false);
      }
    }
  };

  const handleAdopt = async () => {
    if (!spot || !profile) return;
    setIsAdopting(true);
    try {
      await db.adoptSpot(spot.id);
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsAdopting(false);
    }
  };

  const handleSavePersonality = async () => {
    if (!spot) return;
    try {
      await db.updateSpiritPersonality(spot.id, customPersonality);
      setIsEditingPersonality(false);
      await fetchData();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleCompleteMission = async (mId: string) => {
    setCompletingMissionId(mId);
    try {
      await db.completeMission(mId);
      const c = await db.getCompletions();
      setCompletions(c.filter(comp => missions.some(mi => mi.id === comp.mission_id)));
    } catch (e) {
      alert("Erreur de liaison.");
    } finally {
      setCompletingMissionId(null);
    }
  };

  const handleSendEcho = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEcho.trim() || !spot) return;
    setIsSendingEcho(true);
    try {
      const poetized = await poetizeEcho(newEcho);
      await db.addEcho(spot.id, poetized, newEcho);
      const updatedEchos = await db.getEchos(spot.id);
      setEchos(updatedEchos);
      setNewEcho('');
    } catch (err) {
      alert("Échec de la résonance.");
    } finally {
      setIsSendingEcho(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-12 h-12 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
      <p className="text-xs font-mono text-green-500 animate-pulse uppercase tracking-widest">Analyse du Sanctuaire...</p>
    </div>
  );
  
  if (!spot) return <div className="p-8 text-center text-red-400">Signal corrompu.</div>;

  const isOwner = profile?.id === spot.owner_id;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-12">
      <div className="relative h-48 rounded-2xl overflow-hidden glass-panel border-green-500/40">
        <img src={`https://picsum.photos/seed/${spot.id}/800/400`} className="w-full h-full object-cover opacity-50" alt={spot.name} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
        {spot.owner_id && (
           <div className="absolute top-4 right-4 bg-yellow-500/20 border border-yellow-500/50 text-yellow-400 text-[8px] font-bold px-2 py-1 rounded-full uppercase tracking-widest backdrop-blur-sm">
             <i className="fas fa-fort-awesome mr-1"></i> Sanctuaire Gardé par {spot.owner_name}
           </div>
        )}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-lg bg-green-500/80 text-black flex items-center justify-center text-xl shadow-lg shadow-green-500/20">
              {ICONS[spot.type as keyof typeof ICONS]}
             </div>
             <div>
               <h1 className="text-xl font-bold text-white leading-none">{spot.name}</h1>
               <p className="text-xs text-green-400 font-mono mt-1 uppercase tracking-tighter">COORDS: {spot.latitude.toFixed(3)}, {spot.longitude.toFixed(3)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Mode Sanctuaire: Adoption / Customization */}
      {!spot.owner_id && profile && profile.level >= 10 && (
        <div className="glass-panel p-4 rounded-xl border-yellow-500/30 bg-yellow-500/5 animate-pulse">
           <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-2">Opportunité de Sanctuaire</h3>
           <p className="text-[10px] text-slate-400 mb-3">Votre niveau de résonance (Niveau {profile.level}) vous permet d'adopter ce lieu. Devenez son Protecteur Titulaire.</p>
           <button 
            onClick={handleAdopt}
            disabled={isAdopting}
            className="w-full py-2 bg-yellow-500 text-black text-[10px] font-bold uppercase rounded-lg hover:bg-yellow-400 transition-all"
           >
             {isAdopting ? "Liaison en cours..." : "Adopter le Sanctuaire"}
           </button>
        </div>
      )}

      {isOwner && (
        <div className="glass-panel p-4 rounded-xl border-blue-500/30 bg-blue-500/5">
           <div className="flex justify-between items-center mb-3">
             <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest">Contrôle de l'Esprit</h3>
             <button 
              onClick={() => setIsEditingPersonality(!isEditingPersonality)}
              className="text-[9px] text-slate-500 hover:text-white uppercase font-bold"
             >
               {isEditingPersonality ? 'Fermer' : 'Éditer'}
             </button>
           </div>
           {isEditingPersonality ? (
             <div className="space-y-3">
               <textarea 
                value={customPersonality}
                onChange={(e) => setCustomPersonality(e.target.value)}
                placeholder="Décrivez la personnalité de l'Esprit de ce lieu..."
                className="w-full bg-black/50 border border-blue-900/40 rounded-lg p-3 text-xs text-blue-200 focus:outline-none focus:border-blue-400 resize-none h-24"
               />
               <button 
                onClick={handleSavePersonality}
                className="w-full py-2 bg-blue-500 text-black text-[10px] font-bold uppercase rounded-lg"
               >
                 Synchroniser la Personnalité
               </button>
             </div>
           ) : (
             <p className="text-[10px] italic text-slate-400">" {spot.spirit_personality} "</p>
           )}
        </div>
      )}

      <button 
        onClick={toggleSpirit}
        disabled={loading}
        className={`w-full py-4 px-6 rounded-xl flex items-center justify-between transition-all border-2 ${
          isSpiritActive 
          ? 'bg-green-500 border-green-300 text-black neon-glow' 
          : 'bg-slate-900/50 border-green-900/30 text-green-400 hover:border-green-500/50'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`text-2xl ${isSpiritActive ? 'animate-bounce' : ''}`}>{ICONS.SPIRIT}</span>
          <div className="text-left">
            <span className="block font-bold uppercase tracking-wider text-sm">
              {isSpiritActive ? 'Esprit Unifié' : "Invoquer l'Esprit"}
            </span>
            <span className={`text-[10px] ${isSpiritActive ? 'text-black/70' : 'text-slate-500'}`}>
              Lien neuronal {isSpiritActive ? 'établi' : 'inactif'}
            </span>
          </div>
        </div>
        <i className={`fas ${isSpiritActive ? 'fa-circle' : 'fa-wave-square'} text-sm ${isSpiritActive ? 'animate-pulse text-red-600' : ''}`}></i>
      </button>

      {isSpiritActive && (
        <div className="glass-panel p-4 rounded-xl border-green-400 animate-in zoom-in-95 duration-300">
          <p className="text-sm italic text-slate-200 leading-relaxed">"{spiritText || "L'Ancien attend..."}"</p>
        </div>
      )}

      {/* Missions Section */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1 border-l-2 border-green-900 ml-1">Missions Locales</h2>
        {missions.map(m => {
          const isDone = completions.some(c => c.mission_id === m.id);
          const isCompleting = completingMissionId === m.id;
          return (
            <div key={m.id} className={`glass-panel p-4 rounded-xl border-l-4 transition-all ${
              isDone ? 'border-l-green-500 bg-green-950/10' : 'border-l-slate-800'
            }`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className={`font-bold ${isDone ? 'text-slate-500' : 'text-white'}`}>{m.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{m.description}</p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-mono text-green-400">+{m.xp_reward}XP</span>
                </div>
              </div>
              {!isDone && (
                <button 
                  onClick={() => handleCompleteMission(m.id)}
                  className={`w-full mt-3 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg bg-green-500 text-black`}
                >
                  {isCompleting ? "Synchronisation..." : "Valider"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Echos Section */}
      <div className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 px-1 border-l-2 border-green-500/50 ml-1">Résonances Temporelles</h2>
        <form onSubmit={handleSendEcho} className="glass-panel p-4 rounded-xl border-green-900/30">
          <textarea 
            value={newEcho}
            onChange={(e) => setNewEcho(e.target.value)}
            disabled={isSendingEcho}
            placeholder="Diffuser un écho..."
            className="w-full bg-black/40 border border-green-900/20 rounded-lg p-3 text-sm text-green-300 placeholder:text-slate-700 focus:outline-none focus:border-green-500/50 resize-none h-16 font-mono"
          />
          <button 
            type="submit"
            className="w-full mt-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest bg-green-900/40 text-green-400 border border-green-500/20"
          >
            Émettre
          </button>
        </form>
        <div className="space-y-3">
          {echos.map(echo => (
            <div key={echo.id} className="pl-4 border-l-2 border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-green-600 uppercase">{echo.username}</span>
              </div>
              <p className="text-xs text-slate-300 italic">"{echo.content}"</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SpotDetails;
