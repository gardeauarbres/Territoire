
import React, { useState } from 'react';
import { Spot, SpotType } from '../types';
import { ICONS } from '../constants';
import * as RouterDOM from 'react-router-dom';
import { db } from '../services/db';
import { motion } from 'framer-motion';

const { Link } = RouterDOM;

const SpotCard: React.FC<{ spot: Spot }> = ({ spot }) => {
  const isNight = db.isNightTime();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const getNightColor = (type: SpotType) => {
    switch(type) {
      case SpotType.TREE: return 'text-green-400 border-green-500/30';
      case SpotType.WATER: return 'text-blue-400 border-blue-500/30';
      case SpotType.ZONE: return 'text-pink-400 border-pink-500/30';
      case SpotType.PATH: return 'text-orange-400 border-orange-500/30';
      default: return 'text-green-400 border-green-500/30';
    }
  };

  return (
    <Link to={`/spot/${spot.id}`} className="block">
      <motion.div 
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="glass-panel p-5 rounded-3xl border border-white/5 transition-all group relative overflow-hidden"
        whileHover={{ scale: 1.02 }}
      >
        {/* Spotlight Effect */}
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
          style={{
            opacity: isHovered ? 0.15 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, ${isNight ? '#a855f7' : '#22c55e'}, transparent 40%)`
          }}
        ></div>

        <div className="flex items-start gap-4 relative z-20">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-all border bg-black/40 ${
            isNight ? getNightColor(spot.type) : 'text-green-400 border-green-500/20'
          } group-hover:scale-110 group-hover:neon-text`}>
            {ICONS[spot.type as keyof typeof ICONS] || ICONS.ZONE}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white group-hover:neon-text transition-all">{spot.name}</h3>
            <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 italic">"{spot.description}"</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[8px] font-mono px-2 py-0.5 rounded bg-white/5 text-slate-500 border border-white/5 uppercase">
                {spot.short_code}
              </span>
              {isNight && (
                <span className="text-[8px] text-purple-400 uppercase font-bold animate-pulse tracking-tighter">
                   Lueur Onirique Active
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default SpotCard;
