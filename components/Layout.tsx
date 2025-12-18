
import React, { useState, useEffect } from 'react';
import * as RouterDOM from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ICONS } from '../constants';
import { db } from '../services/db';
import { WeatherData, WeatherType } from '../types';
import { generateWeatherAdvice } from '../services/geminiService';
import { audioService } from '../services/audioService';

const { Link, useLocation } = RouterDOM;

interface LayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, onLogout }) => {
  const location = useLocation();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isNight, setIsNight] = useState(db.isNightTime());

  useEffect(() => {
    const checkTime = () => setIsNight(db.isNightTime());
    const timeInterval = setInterval(checkTime, 60000);

    const initWeather = async () => {
      const current = await db.getCurrentWeather();
      setWeather(current);
      if (current.advice === "La nature respire, synchronisez vos actions.") {
        try {
          const advice = await generateWeatherAdvice(current.type, current.temperature);
          setWeather({ ...current, advice });
        } catch (e) { console.error(e); }
      }
    };
    initWeather();

    return () => clearInterval(timeInterval);
  }, []);

  const navItems = [
    { path: '/', icon: ICONS.MAP, label: 'Carte' },
    { path: '/symbiosis', icon: <i className="fas fa-wave-square"></i>, label: 'Flux' },
    { path: '/ritual', icon: <i className="fas fa-magic"></i>, label: 'Rituel' },
    { path: '/ecosystem', icon: <i className="fas fa-project-diagram"></i>, label: 'Nexus' },
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

  return (
    <div className={`min-h-screen flex flex-col max-w-md mx-auto relative border-x border-white/5 transition-all duration-1000`}>
      
      {/* Aurora Animated Background */}
      <div className="aurora-bg">
        <div className="aurora-blob bg-green-500" style={{ top: '10%', left: '10%', animationDuration: '25s' }}></div>
        <div className="aurora-blob bg-blue-600" style={{ bottom: '20%', right: '10%', animationDuration: '35s', animationDelay: '-5s' }}></div>
        {isNight && (
          <div className="aurora-blob bg-purple-700" style={{ top: '40%', right: '30%', animationDuration: '40s', opacity: 0.1 }}></div>
        )}
      </div>

      <header className="sticky top-0 z-[60] p-4 glass-panel border-b border-white/5">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h1 className={`text-xl font-bold tracking-wider leading-none transition-all duration-1000 ${
              isNight ? 'text-purple-400' : 'text-green-500 neon-text'
            }`}>
              TERRITOIRE <span className="text-white">VIVANT</span>
            </h1>
            <div className="flex items-center gap-1.5 mt-1">
              <div className={`w-1 h-1 rounded-full animate-pulse ${isNight ? 'bg-purple-500' : 'bg-green-500'}`}></div>
              <span className="text-[7px] font-mono uppercase tracking-[0.3em] text-slate-500">
                Nexus Link v1.0.4 • Audio Actif
              </span>
            </div>
          </div>
          
          {weather && (
            <div className="flex flex-col items-end gap-1 px-3 py-1 bg-black/40 rounded-xl border border-white/5">
               <div className="flex items-center gap-2">
                 <i className={`fas ${weatherIcons[weather.type]} text-[10px]`}></i>
                 <span className="text-[10px] font-bold text-white uppercase">{weather.temperature}°C</span>
               </div>
               <span className="text-[7px] font-mono uppercase text-slate-400 truncate max-w-[100px]">{weather.advice}</span>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 pb-24 relative z-10 p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md glass-panel border-t border-white/5 p-2 z-[60]">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => audioService.playClick()}
                onMouseEnter={() => audioService.playHover()}
                className={`relative flex flex-col items-center gap-1 transition-all duration-500 ${
                  isActive ? 'text-white scale-110' : 'text-slate-500'
                }`}
              >
                <span className={`text-xl transition-all ${isActive ? (isNight ? 'text-purple-400 shadow-[0_0_10px_rgba(168,85,247,0.5)]' : 'text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]') : ''}`}>
                   {item.icon}
                </span>
                <span className="text-[9px] uppercase font-bold tracking-widest">{item.label}</span>
                {isActive && (
                   <motion.div 
                     layoutId="nav-indicator"
                     className={`absolute -bottom-1 w-1 h-1 rounded-full ${isNight ? 'bg-purple-500' : 'bg-green-500'}`}
                   />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
