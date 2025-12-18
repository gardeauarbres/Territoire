
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Territory, ImpactStats } from '../types';
import { generatePredictiveAnalysis } from '../services/geminiService';
import MagneticButton from '../components/MagneticButton';
import { motion } from 'framer-motion';

const EcosystemDashboard: React.FC = () => {
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [impact, setImpact] = useState<ImpactStats | null>(null);
  const [species, setSpecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    const [t, i, s] = await Promise.all([
      db.getTerritory(),
      db.getImpactStats(),
      db.getScannedSpecies()
    ]);
    setTerritory(t);
    setImpact(i);
    setSpecies(s);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);

  const isCritical = (territory?.stability_score || 100) < 40;

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-10 h-10 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-10">
      <div className="text-center">
        <h2 className={`text-2xl font-bold tracking-[0.4em] uppercase transition-all duration-500 ${isCritical ? 'text-red-500' : 'text-white neon-text'}`}>
           Dashboard Nexus
        </h2>
        <p className="text-[10px] font-mono text-green-700 uppercase tracking-widest mt-1">Diagnostic Bio-Séquentiel</p>
      </div>

      {/* Neon Tube Gauges */}
      <div className="grid grid-cols-1 gap-6">
         <div className="glass-panel p-6 rounded-3xl border-white/5">
            <div className="flex justify-between items-end mb-4">
               <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Stabilité du Territoire</div>
                  <div className={`text-3xl font-bold transition-all ${isCritical ? 'text-red-500 neon-text' : 'text-blue-400'}`}>
                    {territory?.stability_score}%
                  </div>
               </div>
               <i className={`fas fa-wave-square text-xl ${isCritical ? 'text-red-600 animate-bounce' : 'text-blue-600'}`}></i>
            </div>
            
            <div className="neon-tube">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${territory?.stability_score}%` }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 className="neon-tube-fill"
                 style={{ 
                    backgroundColor: isCritical ? '#dc2626' : '#3b82f6',
                    color: isCritical ? 'rgba(220,38,38,0.5)' : 'rgba(59,130,246,0.5)' 
                 }}
               />
            </div>
         </div>

         <div className="glass-panel p-6 rounded-3xl border-white/5">
            <div className="flex justify-between items-end mb-4">
               <div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Densité Bio-Active</div>
                  <div className="text-3xl font-bold text-green-400">
                    {species.length} <span className="text-sm text-green-900">SPÉCIMENS</span>
                  </div>
               </div>
               <i className="fas fa-microscope text-xl text-green-600"></i>
            </div>
            
            <div className="neon-tube">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${(species.length / 20) * 100}%` }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 className="neon-tube-fill"
                 style={{ backgroundColor: '#22c55e', color: 'rgba(34,197,94,0.5)' }}
               />
            </div>
         </div>
      </div>

      {/* IA Predictive Analysis Section */}
      <div className="relative group">
         <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-blue-600 rounded-3xl blur opacity-10 group-hover:opacity-30 transition duration-1000"></div>
         <div className="relative glass-panel p-8 rounded-3xl border-white/5">
            <h3 className="text-[10px] font-bold text-green-500 uppercase tracking-[0.3em] mb-4">Moteur de Prédiction Bio-Neuronal</h3>
            
            {prediction ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <p className="text-lg italic text-slate-200 leading-relaxed font-serif text-center">"{prediction}"</p>
                <div className="flex justify-center">
                   <button onClick={() => setPrediction(null)} className="text-[10px] font-bold text-slate-600 uppercase hover:text-white transition-colors">Ré-analyser le Flux</button>
                </div>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center gap-6">
                 <p className="text-xs text-slate-500 text-center px-4 italic leading-relaxed">
                   Synchronisez les données du Territoire pour obtenir une prophétie sur l'évolution du Nexus local.
                 </p>
                 <MagneticButton 
                   onClick={async () => {
                     if (!territory || !impact) return;
                     setIsGenerating(true);
                     const res = await generatePredictiveAnalysis(territory, impact, species.length);
                     setPrediction(res);
                     setIsGenerating(false);
                   }}
                   disabled={isGenerating}
                   className="px-8 py-4 bg-green-500 text-black font-bold uppercase text-[11px] tracking-widest rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.3)]"
                 >
                   {isGenerating ? "Calcul Séquentiel..." : "Générer la Prophétie"}
                 </MagneticButton>
              </div>
            )}
         </div>
      </div>

      {/* Log Feed */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] ml-2">Flux de Données Brutes</h3>
        <div className="space-y-3">
          {species.map((s, i) => (
            <motion.div 
              key={s.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-panel p-4 rounded-2xl border-white/5 flex items-center justify-between"
            >
               <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-black/40 border border-green-500/10 flex items-center justify-center text-green-500">
                    <i className="fas fa-dna text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white uppercase">{s.commonName}</div>
                    <div className="text-[9px] font-mono text-slate-500 uppercase">{s.scientificName}</div>
                  </div>
               </div>
               <div className="text-[9px] font-mono text-green-900">#BIO_{1024 + i}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EcosystemDashboard;
