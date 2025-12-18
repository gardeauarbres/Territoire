
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { Chronicle } from '../types';
import { generateChronicle } from '../services/geminiService';

const Chronicles: React.FC = () => {
  const [chronicles, setChronicles] = useState<Chronicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = async () => {
    const data = await db.getChronicles();
    setChronicles(data);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const territory = await db.getTerritory();
      const swarms = await db.getSwarms();
      const species = await db.getScannedSpecies();
      
      const newChronicleData = await generateChronicle(territory, swarms, species);
      await db.addChronicle(newChronicleData);
      await loadData();
    } catch (e) {
      console.error(e);
      alert("Erreur lors de l'archivage du temps...");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-8 h-8 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-[0.3em] uppercase text-white neon-text">Les Chroniques</h2>
        <p className="text-[10px] font-mono text-green-700 uppercase tracking-widest">Archives Narrationnelles du Territoire</p>
      </div>

      {/* Generation HUD */}
      <div className="px-1">
        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className={`w-full py-4 glass-panel border border-dashed border-green-500/30 rounded-2xl flex items-center justify-center gap-4 group hover:border-green-500 transition-all ${isGenerating ? 'animate-pulse' : ''}`}
        >
          <div className="w-10 h-10 rounded-full bg-green-950/40 flex items-center justify-center border border-green-500/20 group-hover:neon-glow">
             <i className="fas fa-quill-pen text-green-500"></i>
          </div>
          <div className="text-left">
             <div className="text-[10px] font-bold text-white uppercase tracking-widest">
                {isGenerating ? "Scription Bio-Neuronal en cours..." : "Invoquer une Nouvelle Chronique"}
             </div>
             <div className="text-[8px] text-slate-500 uppercase tracking-tighter">Génération par le Moteur de Conscience</div>
          </div>
        </button>
      </div>

      {/* Chronicle Feed */}
      <div className="space-y-10 relative">
        {/* Timeline Line */}
        <div className="absolute left-[23px] top-4 bottom-4 w-px bg-gradient-to-b from-green-500/50 via-green-900/10 to-transparent"></div>

        {chronicles.map((c, idx) => (
          <div key={c.id} className="relative pl-12 group">
             {/* Timeline Node */}
             <div className="absolute left-[14px] top-1.5 w-[20px] h-[20px] rounded-full bg-black border border-green-500/50 flex items-center justify-center z-10 group-hover:shadow-[0_0_10px_#22c55e] transition-all">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
             </div>

             <div className="glass-panel p-6 rounded-3xl border-slate-900/50 hover:border-green-500/30 transition-all duration-500 relative overflow-hidden">
                {/* Background Glow */}
                <div className={`absolute top-0 right-0 p-10 opacity-5 pointer-events-none transition-all duration-1000 group-hover:opacity-10 ${
                   c.threat_level === 'CRITICAL' ? 'text-red-600' : 'text-green-500'
                }`}>
                   <i className={`fas ${c.threat_level === 'CRITICAL' ? 'fa-skull' : 'fa-scroll'} text-8xl`}></i>
                </div>

                <div className="flex justify-between items-start mb-4">
                   <div className="text-[9px] font-mono text-slate-500 uppercase">
                      {new Date(c.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                   </div>
                   <div className={`text-[8px] font-bold px-2 py-0.5 rounded border ${
                      c.threat_level === 'CRITICAL' ? 'border-red-500 text-red-500 bg-red-950/20' : 
                      c.threat_level === 'MEDIUM' ? 'border-yellow-500 text-yellow-500 bg-yellow-950/20' :
                      'border-green-900/40 text-green-700'
                   }`}>
                      {c.threat_level} ALERT
                   </div>
                </div>

                <h3 className="text-xl font-bold text-white uppercase tracking-tight mb-4 leading-tight group-hover:text-green-400 transition-colors">
                   {c.title}
                </h3>

                <p className="text-sm text-slate-300 italic font-serif leading-relaxed mb-6">
                   "{c.content}"
                </p>

                <div className="flex items-center justify-between border-t border-slate-900 pt-4">
                   <div className="flex items-center gap-2">
                      <div className="text-[8px] font-bold text-slate-600 uppercase">Essaim à l'honneur:</div>
                      <div className="text-[9px] font-bold text-green-500 uppercase tracking-widest">{c.highlighted_swarm_name}</div>
                   </div>
                   <button className="text-[8px] font-bold text-slate-700 uppercase hover:text-white transition-colors">
                      <i className="fas fa-share-alt mr-1"></i> Diffuser
                   </button>
                </div>
             </div>
          </div>
        ))}
      </div>
      
      {chronicles.length === 0 && (
        <div className="text-center py-20 opacity-30">
           <i className="fas fa-box-open text-4xl mb-4"></i>
           <p className="text-xs font-mono uppercase">Aucune archive temporelle détectée.</p>
        </div>
      )}
    </div>
  );
};

export default Chronicles;
