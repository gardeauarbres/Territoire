
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Profile as ProfileType, Badge, MissionCompletion, ImpactStats, Artifact, BioScanResult } from '../types';
import { ICONS } from '../constants';
import * as RouterDOM from 'react-router-dom';
import { GoogleGenAI } from '@google/genai';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '../components/MagneticButton';
import { audioService } from '../services/audioService';

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<ProfileType | null>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [completions, setCompletions] = useState<MissionCompletion[]>([]);
  const [impact, setImpact] = useState<ImpactStats>({ carbon: 0, water: 0, biodiversity: 0 });
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [scannedSpecies, setScannedSpecies] = useState<BioScanResult[]>([]);
  const [symbiosisReport, setSymbiosisReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [viewTab, setViewTab] = useState<'main' | 'atlas' | 'artifacts'>('main');

  useEffect(() => {
    const load = async () => {
      try {
        const [p, b, c, i, art, species] = await Promise.all([
          db.getProfile(),
          db.getBadges(),
          db.getCompletions(),
          db.getImpactStats(),
          db.getArtifacts(),
          db.getScannedSpecies()
        ]);
        setProfile(p);
        setBadges(b);
        setCompletions(c);
        setImpact(i);
        setArtifacts(art);
        setScannedSpecies(species);
      } catch (e) {
        console.error("Erreur de chargement profil", e);
      }
    };
    load();
  }, []);

  const generateReport = async () => {
    if (!profile) return;
    setIsGeneratingReport(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Oracle du Territoire Vivant. Analyse: ${profile.username}, Niv ${profile.level}, Impact Eau ${impact.water}L, Carbone ${impact.carbon}kg. Rapport prophétique court (max 40 mots).`,
      });
      setSymbiosisReport(response.text || "Les fréquences sont floues, Gardien.");
    } catch (e) {
      console.error(e);
      setSymbiosisReport("L'Oracle est silencieux pour le moment.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  if (!profile) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );

  const xpProgress = ((profile.xp || 0) % 500) / 5;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-col items-center gap-6 py-6">
        <div className="relative">
          <motion.div 
            animate={{ boxShadow: ["0 0 20px rgba(34,197,94,0.1)", "0 0 40px rgba(34,197,94,0.3)", "0 0 20px rgba(34,197,94,0.1)"] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-28 h-28 rounded-[35%] border-2 border-green-500/40 p-1.5 overflow-hidden bg-green-950/20 rotate-[10deg]"
          >
            <div className="w-full h-full rounded-[30%] overflow-hidden -rotate-[10deg]">
              <img src={profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`} className="w-full h-full grayscale hover:grayscale-0 transition-all object-cover scale-110" alt="Avatar" />
            </div>
          </motion.div>
          <div className="absolute -bottom-2 -right-2 bg-green-500 text-black font-bold text-sm w-10 h-10 flex items-center justify-center rounded-2xl border-4 border-[#050801] shadow-[0_0_20px_rgba(34,197,94,0.4)]">
            {profile.level}
          </div>
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-widest text-white uppercase neon-text">{profile.username}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             <p className="text-[10px] font-mono text-green-700 uppercase tracking-widest font-bold">
               Séquence de Protection Active
             </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 p-1 glass-panel rounded-2xl border-white/5 mx-auto max-w-xs">
         {(['main', 'atlas', 'artifacts'] as const).map(tab => (
           <button 
             key={tab}
             onClick={() => { setViewTab(tab); audioService.playClick(); }}
             className={`flex-1 py-2 text-[8px] font-bold uppercase tracking-widest rounded-xl transition-all ${
               viewTab === tab ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-500'
             }`}
           >
             {tab === 'main' ? 'Profil' : tab === 'atlas' ? 'Bio-Atlas' : 'Reliques'}
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {viewTab === 'main' && (
          <motion.div 
            key="main"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="glass-panel p-6 rounded-[32px] border-white/5 bg-black/20">
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-bold">Bio-Réserve d'Énergie</span>
                    <div className="text-3xl font-bold text-white leading-none mt-1">{profile.xp || 0} <span className="text-xs text-green-900">XP</span></div>
                  </div>
                  <div className="text-[10px] font-mono text-green-500">{Math.round(xpProgress)}%</div>
                </div>
                <div className="neon-tube">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    className="neon-tube-fill"
                    style={{ backgroundColor: '#22c55e', color: 'rgba(34,197,94,0.5)' }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel p-5 rounded-[28px] border-white/5 bg-blue-950/5">
                  <div className="text-2xl text-blue-500 mb-2">{ICONS.WATER}</div>
                  <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Impact Eau</div>
                  <div className="text-xl font-bold text-white font-mono">{impact.water || 0}L</div>
              </div>
              <div className="glass-panel p-5 rounded-[28px] border-white/5 bg-green-950/5">
                  <div className="text-2xl text-green-600 mb-2"><i className="fas fa-leaf"></i></div>
                  <div className="text-[8px] text-slate-500 uppercase font-bold mb-1">Carbone Séquestré</div>
                  <div className="text-xl font-bold text-white font-mono">{impact.carbon || 0}kg</div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-900 rounded-[32px] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative glass-panel p-8 rounded-[32px] border-white/5 text-center">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-500 mb-6">Prophétie de Symbiose</h3>
                  {symbiosisReport ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                      <p className="text-lg italic text-slate-200 leading-relaxed font-serif">"{symbiosisReport}"</p>
                      <button onClick={() => setSymbiosisReport(null)} className="text-[8px] text-slate-600 uppercase font-bold hover:text-white transition-colors">Ré-interroger l'Oracle</button>
                    </motion.div>
                  ) : (
                    <MagneticButton 
                      onClick={generateReport}
                      disabled={isGeneratingReport}
                      className="w-full py-4 bg-green-500 text-black font-bold uppercase text-[10px] tracking-[0.2em] rounded-2xl shadow-xl shadow-green-500/20"
                    >
                      {isGeneratingReport ? "Séquençage des Destins..." : "Ouvrir le Canal Oracle"}
                    </MagneticButton>
                  )}
              </div>
            </div>
          </motion.div>
        )}

        {viewTab === 'atlas' && (
          <motion.div 
            key="atlas"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="flex justify-between items-center px-1">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-600">Bio-Atlas Personnel</h3>
              <span className="text-[8px] font-mono text-slate-500">{scannedSpecies.length} ESPÈCES SÉQUENCÉES</span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {scannedSpecies.map((s, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="glass-panel p-5 rounded-3xl border-white/5 flex gap-4 items-center group hover:border-green-500/30 transition-all"
                >
                  <div className="w-16 h-16 rounded-2xl bg-black border border-green-500/10 flex items-center justify-center text-green-500 group-hover:neon-glow transition-all">
                    <i className="fas fa-dna text-2xl"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-white text-base uppercase tracking-tight truncate">{s.commonName}</h4>
                    <p className="text-[9px] font-mono text-green-800 italic uppercase mb-2 truncate">{s.scientificName}</p>
                    <p className="text-[10px] text-slate-400 italic font-serif line-clamp-2">"{s.ecologyFact}"</p>
                  </div>
                </motion.div>
              ))}
              {scannedSpecies.length === 0 && (
                <div className="p-12 text-center glass-panel rounded-3xl border-dashed border-white/5 opacity-40">
                  <i className="fas fa-microscope text-3xl mb-4 text-green-900"></i>
                  <p className="text-[9px] uppercase tracking-widest font-bold text-slate-700">Aucun séquençage bio-data détecté</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {viewTab === 'artifacts' && (
          <motion.div 
            key="artifacts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-green-600 ml-1">Artefacts & Reliques</h3>
            <div className="grid grid-cols-4 gap-3 px-1">
              {artifacts.length > 0 ? (
                artifacts.map(art => (
                  <motion.button 
                    key={art.id} 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    onClick={() => setSelectedArtifact(art)}
                    className={`aspect-square rounded-2xl border bg-black/40 overflow-hidden relative ${
                      art.rarity === 'LEGENDARY' ? 'border-yellow-500/50 shadow-[0_0_15px_rgba(234,179,8,0.2)]' :
                      art.rarity === 'RARE' ? 'border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.1)]' : 'border-white/5'
                    }`}
                  >
                    <img src={art.imageUrl} className="w-full h-full object-cover p-1 rounded-2xl" alt={art.name} />
                  </motion.button>
                ))
              ) : (
                <div className="col-span-4 p-12 text-center glass-panel rounded-3xl border-dashed border-white/5">
                  <p className="text-[9px] text-slate-700 uppercase italic">Aucun artefact bio-luminescent</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Artifact Detail Modal */}
      {selectedArtifact && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className={`glass-panel w-full max-w-sm p-8 rounded-[40px] border-2 relative ${
               selectedArtifact.rarity === 'LEGENDARY' ? 'border-yellow-500 shadow-[0_0_50px_rgba(234,179,8,0.2)]' : 
               selectedArtifact.rarity === 'RARE' ? 'border-blue-500' : 'border-green-500/20'
             }`}
           >
              <button onClick={() => setSelectedArtifact(null)} className="absolute top-6 right-6 text-slate-500 hover:text-white transition-colors"><i className="fas fa-times"></i></button>
              
              <div className="w-full aspect-square rounded-3xl overflow-hidden mb-8 border border-white/10 p-2 bg-black/50">
                 <img src={selectedArtifact.imageUrl} className="w-full h-full object-cover rounded-2xl shadow-2xl" alt={selectedArtifact.name} />
              </div>
              
              <div className="text-center space-y-3 mb-8">
                 <div className={`text-[9px] font-bold uppercase tracking-[0.4em] ${
                   selectedArtifact.rarity === 'LEGENDARY' ? 'text-yellow-500' : 
                   selectedArtifact.rarity === 'RARE' ? 'text-blue-500' : 'text-slate-500'
                 }`}>{selectedArtifact.rarity} ARTEFACT</div>
                 <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{selectedArtifact.name}</h3>
                 <p className="text-sm italic text-slate-300 font-serif leading-relaxed px-4">"{selectedArtifact.description}"</p>
              </div>

              <div className="p-5 bg-black/60 rounded-3xl border border-white/5">
                 <div className="text-[8px] font-bold text-green-500 uppercase mb-2 tracking-widest">Résonance Bio-Active</div>
                 <p className="text-xs text-slate-300 leading-relaxed">{selectedArtifact.power_text}</p>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};

export default Profile;
