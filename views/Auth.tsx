
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { ICONS } from '../constants';
import MagneticButton from '../components/MagneticButton';
import { motion } from 'framer-motion';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
      } else {
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { username } }
        });
        if (authError) throw authError;
        setError("Lien d'activation envoyé ! Vérifiez votre boîte mail.");
      }
    } catch (err: any) {
      setError(err.message || "Échec de la liaison au Nexus.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Local Aurora Blobs for Auth */}
      <div className="aurora-bg">
        <motion.div 
          animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
          transition={{ duration: 20, repeat: Infinity }}
          className="aurora-blob bg-green-500/10 top-0 left-0" 
        />
        <motion.div 
          animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="aurora-blob bg-blue-500/10 bottom-0 right-0" 
        />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-panel w-full max-w-sm p-8 rounded-[40px] border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.5)] z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
            transition={{ duration: 5, repeat: Infinity }}
            className="text-5xl text-green-500 mb-6 inline-block p-4 rounded-3xl bg-green-950/20 shadow-[0_0_30px_rgba(34,197,94,0.2)] border border-green-500/20"
          >
            {ICONS.ZONE}
          </motion.div>
          <h2 className="text-2xl font-bold tracking-[0.2em] uppercase text-white neon-text">
            {isLogin ? 'Accès Terminal' : 'Initialisation'}
          </h2>
          <p className="text-[9px] text-green-700 font-mono mt-2 uppercase tracking-widest font-bold">
            {loading ? 'Synchronisation Bio-Data...' : 'Nexus Link Protocol Active'}
          </p>
        </div>

        {error && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className={`mb-6 p-4 border rounded-2xl text-[10px] font-mono uppercase text-center ${
              error.includes("mail") ? "bg-blue-950/20 border-blue-500/40 text-blue-400" : "bg-red-950/20 border-red-500/40 text-red-400"
            }`}
          >
             {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="space-y-1">
              <input 
                type="text" required value={username} onChange={(e) => setUsername(e.target.value)}
                placeholder="ALIAS DU GARDIEN"
                className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-green-400 font-mono text-sm focus:outline-none focus:border-green-500/50 focus:bg-black/60 transition-all placeholder:text-slate-700"
              />
            </div>
          )}
          
          <input 
            type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="LIAISON EMAIL"
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-green-400 font-mono text-sm focus:outline-none focus:border-green-500/50 focus:bg-black/60 transition-all placeholder:text-slate-700"
          />

          <input 
            type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            placeholder="CLÉ D'ACCÈS"
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-5 py-4 text-green-400 font-mono text-sm focus:outline-none focus:border-green-500/50 focus:bg-black/60 transition-all placeholder:text-slate-700"
          />

          <div className="flex justify-center pt-4">
            <MagneticButton 
              disabled={loading}
              className="px-10 bg-green-500 text-black py-5 rounded-2xl font-bold uppercase tracking-[0.2em] shadow-[0_15px_30px_rgba(34,197,94,0.3)] hover:bg-green-400 transition-all active:scale-95 text-xs whitespace-nowrap"
            >
              {loading ? 'Transmission...' : (isLogin ? 'Établir la liaison' : 'Inscrire le Gardien')}
            </MagneticButton>
          </div>
        </form>

        <div className="mt-10 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 hover:text-green-400 transition-colors"
          >
            {isLogin ? "Nouveau biosignal ? Créer un profil" : "Déjà enregistré ? Accéder au Terminal"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
