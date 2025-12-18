
import React, { useState } from 'react';
import { ICONS } from '../constants';

const Auth: React.FC<{ onLogin: (username: string) => void }> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation de l'appel API Supabase
    if (isLogin) {
      onLogin(username || "Gardien_Alpha");
    } else {
      onLogin(username);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4">
      <div className="glass-panel w-full max-w-sm p-8 rounded-3xl border-green-500/30 relative overflow-hidden">
        {/* Scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
        
        <div className="text-center mb-8">
          <div className="text-4xl text-green-500 mb-4 inline-block neon-glow p-3 rounded-full bg-green-950/20">
            {ICONS.ZONE}
          </div>
          <h2 className="text-xl font-bold tracking-[0.3em] uppercase text-white">
            {isLogin ? 'Accès Terminal' : 'Initialisation'}
          </h2>
          <p className="text-[10px] text-green-500 font-mono mt-2 uppercase tracking-widest">
            Protocole de connexion biologique
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {!isLogin && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nom du Gardien</label>
              <input 
                type="text" 
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="EX: ANTIGRAVITY"
                className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-green-400 font-mono focus:outline-none focus:border-green-500 transition-all"
              />
            </div>
          )}
          
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Identifiant Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@territoire.live"
              className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-green-400 font-mono focus:outline-none focus:border-green-500 transition-all"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Clé d'accès</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-black/50 border border-green-900/50 rounded-xl px-4 py-3 text-green-400 font-mono focus:outline-none focus:border-green-500 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-green-500 text-black py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-green-400 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)] mt-4"
          >
            {isLogin ? 'Établir la liaison' : 'Créer le profil'}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-green-400 transition-colors"
          >
            {isLogin ? "Pas encore de profil ? S'enregistrer" : "Déjà enregistré ? Se connecter"}
          </button>
        </div>
      </div>
      
      <div className="mt-8 flex gap-6 opacity-30 grayscale grayscale-100">
         <i className="fab fa-bluetooth-b text-xl"></i>
         <i className="fas fa-satellite text-xl"></i>
         <i className="fas fa-microchip text-xl"></i>
      </div>
    </div>
  );
};

export default Auth;
