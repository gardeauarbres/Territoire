
import React, { useState, useEffect } from 'react';
import * as RouterDOM from 'react-router-dom';
import { ICONS } from '../constants';
import { db } from '../services/db';
import { WeatherData, WeatherType } from '../types';
import { generateWeatherAdvice } from '../services/geminiService';

const { Link, useLocation } = RouterDOM;

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();
  const [syncStatus, setSyncStatus] = useState<'online' | 'syncing' | 'offline'>('online');
  const [weather, setWeather] = useState<WeatherData | null>(null);

  useEffect(() => {
    const initWeather = async () => {
      const current = await db.getCurrentWeather();
      setWeather(current);
      
      // Update advice via Gemini if it's the default one
      if (current.advice === "La nature respire, synchronisez vos actions.") {
        try {
          const advice = await generateWeatherAdvice(current.type, current.temperature);
          const updated = { ...current, advice };
          setWeather(updated);
          await db.setWeather(updated);
        } catch (e) {
          console.error("Gemini failed to give weather advice", e);
        }
      }
    };
    initWeather();

    const interval = setInterval(() => {
      setSyncStatus('syncing');
      setTimeout(() => setSyncStatus('online'), 1500);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { path: '/', icon: ICONS.MAP, label: 'Carte' },
    { path: '/ritual', icon: <i className="fas fa-fire-alt"></i>, label: 'Rituel' },
    { path: '/scan', icon: ICONS.SCAN, label: 'Scan' },
    { path: '/profile', icon: ICONS.PROFILE, label: 'Profil' },
  ];

  const weatherIcons: Record<WeatherType, string> = {
    SUNNY: 'fa-sun text-yellow-500',
    RAINY: 'fa-cloud-showers-heavy text-blue-500',
    CLOUDY: 'fa-cloud text-slate-400',
    STORM: 'fa-bolt text-purple-500',
    MISTY: 'fa-smog text-slate-300'
  };

  const weatherFilters: Record<WeatherType, string> = {
    SUNNY: 'sepia(0.2) saturate(1.2)',
    RAINY: 'hue-rotate(180deg) brightness(0.8)',
    CLOUDY: 'contrast(0.9) brightness(0.9)',
    STORM: 'contrast(1.2) brightness(0.7) hue-rotate(220deg)',
    MISTY: 'blur(1px) brightness(1.1)'
  };

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative border-x border-green-900/30 bg-[#050801] overflow-hidden">
      {/* Weather Overlay Effects */}
      {weather?.type === 'RAINY' && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/rain.png')] animate-[rain_1s_linear_infinite]"></div>
      )}
      {weather?.type === 'MISTY' && (
        <div className="absolute inset-0 pointer-events-none z-0 opacity-10 bg-gradient-to-t from-slate-500 via-transparent to-transparent"></div>
      )}

      {/* Header */}
      <header className="sticky top-0 z-50 p-4 glass-panel border-b border-green-500/20">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-wider neon-text text-green-500 leading-none">
              TERRITOIRE <span className="text-white">VIVANT</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1.5 h-1.5 rounded-full ${
                syncStatus === 'syncing' ? 'bg-yellow-400 animate-pulse' : 'bg-green-500'
              } shadow-[0_0_5px_currentColor]`}></div>
              <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">
                {syncStatus === 'syncing' ? 'Synchronisation...' : 'Liaison Stable'}
              </span>
            </div>
          </div>
          
          {/* Weather HUD */}
          {weather && (
            <div className="flex flex-col items-end gap-1 px-3 py-1.5 rounded-xl bg-black/40 border border-white/5 mr-4">
               <div className="flex items-center gap-2">
                 <i className={`fas ${weatherIcons[weather.type]} text-xs animate-pulse`}></i>
                 <span className="text-[10px] font-bold text-white uppercase">{weather.temperature}°C</span>
               </div>
               <span className="text-[7px] font-mono text-green-500/70 uppercase tracking-tighter max-w-[80px] text-right line-clamp-1">
                 {weather.advice}
               </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button 
              onClick={onLogout}
              className="group flex flex-col items-center"
            >
              <i className="fas fa-power-off text-red-500/50 group-hover:text-red-400 transition-colors"></i>
              <span className="text-[7px] font-bold text-red-900 uppercase mt-1">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className="flex-1 pb-24 p-4 overflow-y-auto relative z-10 transition-all duration-1000"
        style={{ filter: weather ? weatherFilters[weather.type] : 'none' }}
      >
        {children}
      </main>

      {/* Persistent Nav Bar */}
      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-panel border-t border-green-500/20 p-2 z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isActive ? 'text-green-400 scale-110' : 'text-slate-500'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest">{item.label}</span>
                {isActive && <div className="w-1 h-1 bg-green-400 rounded-full neon-glow" />}
              </Link>
            );
          })}
        </div>
      </nav>

      <style>{`
        @keyframes rain {
          from { background-position: 0 0; }
          to { background-position: 10% 100%; }
        }
      `}</style>
    </div>
  );
};

export default Layout;
