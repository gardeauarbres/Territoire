
import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { FeedItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import { audioService } from '../services/audioService';

const SymbiosisFlow: React.FC = () => {
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [resonatingId, setResonatingId] = useState<string | null>(null);

  const loadFeed = async () => {
    try {
      const data = await db.getSymbiosisFeed();
      setFeed(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeed();
    const interval = setInterval(loadFeed, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleResonate = async (item: FeedItem) => {
    setResonatingId(item.activity_id);
    audioService.playClick();
    try {
      const success = await db.resonate(item);
      if (success) {
        // Mise à jour optimiste de l'UI
        setFeed(prev => prev.map(f => 
            f.activity_id === item.activity_id 
            ? { ...f, resonance_count: (f.resonance_count || 0) + 1 } 
            : f
        ));
        
        audioService.vibrate(50);
        // Petit feedback visuel de succès (pourrait être un toast)
      } else {
        // Feedback si déjà résonné ou erreur
        audioService.vibrate([10, 50, 10]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setResonatingId(null);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
      <div className="w-10 h-10 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
      <p className="text-[10px] font-mono text-green-500 uppercase tracking-widest">Réception du Flux de Symbiose...</p>
    </div>
  );

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-bold tracking-[0.3em] uppercase text-white neon-text">Flux de Symbiose</h2>
        <p className="text-[10px] font-mono text-green-700 uppercase tracking-widest">Interactions Mycéliennes Globales</p>
      </div>

      <div className="space-y-6 relative">
        <div className="absolute left-[20px] top-4 bottom-4 w-px bg-green-500/10"></div>
        
        <AnimatePresence>
          {feed.map((item, idx) => (
            <motion.div 
              key={`${item.type}-${item.activity_id}`} 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="relative pl-10"
            >
              <div className="absolute left-[13px] top-2 w-3.5 h-3.5 rounded-full bg-black border border-green-500/30 flex items-center justify-center z-10">
                 <div className={`w-1.5 h-1.5 rounded-full ${item.type === 'SCAN' ? 'bg-green-500' : 'bg-blue-500'} animate-pulse`}></div>
              </div>

              <div className="glass-panel p-5 rounded-3xl border-slate-900/50 hover:border-green-500/20 transition-all duration-500">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 rounded-full border border-green-500/20 overflow-hidden bg-black/40">
                       <img src={item.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${item.username}`} className="w-full h-full object-cover grayscale" alt={item.username} />
                    </div>
                    <div className="flex-1">
                       <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold text-green-500 uppercase tracking-wider">{item.username}</span>
                          <span className="text-[8px] font-mono text-slate-600">{new Date(item.created_at).toLocaleTimeString()}</span>
                       </div>
                       <div className="text-[7px] text-slate-500 uppercase font-bold tracking-widest">
                          {item.type === 'SCAN' ? 'BIO-DÉCOUVERTE' : 'MISSION ACCOMPLIE'}
                       </div>
                    </div>
                 </div>

                 <h3 className="text-lg font-bold text-white uppercase tracking-tight mb-1">{item.title}</h3>
                 <p className="text-[9px] font-mono text-green-900 uppercase mb-3">{item.subtitle}</p>
                 
                 <p className="text-xs text-slate-400 italic leading-relaxed mb-4">"{item.description}"</p>

                 <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1">
                       <i className="fas fa-heart text-[8px] text-green-900"></i>
                       <span className="text-[10px] font-mono text-green-900">{item.resonance_count || 0}</span>
                    </div>
                    
                    <button 
                      onClick={() => handleResonate(item)}
                      disabled={resonatingId === item.activity_id}
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${
                          resonatingId === item.activity_id 
                          ? 'border-green-500 bg-green-500 text-black' 
                          : 'border-green-900/30 text-green-800 hover:border-green-500 hover:text-green-400'
                      }`}
                    >
                      <i className={`fas fa-wave-square ${resonatingId === item.activity_id ? 'animate-bounce' : ''}`}></i>
                      {resonatingId === item.activity_id ? 'Résonance...' : 'Résonner'}
                    </button>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {feed.length === 0 && (
          <div className="text-center py-20 opacity-20">
             <i className="fas fa-satellite-dish text-4xl mb-4"></i>
             <p className="text-xs font-mono uppercase">Aucune activité captée dans le flux de symbiose.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SymbiosisFlow;
