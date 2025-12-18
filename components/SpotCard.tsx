
import React from 'react';
import { Spot } from '../types';
import { ICONS } from '../constants';
import * as RouterDOM from 'react-router-dom';

const { Link } = RouterDOM;

const SpotCard: React.FC<{ spot: Spot }> = ({ spot }) => {
  return (
    <Link to={`/spot/${spot.id}`} className="block">
      <div className="glass-panel p-4 rounded-xl hover:border-green-400/50 transition-all group">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-green-900/40 flex items-center justify-center text-green-400 text-xl group-hover:neon-glow transition-all">
            {ICONS[spot.type as keyof typeof ICONS] || ICONS.ZONE}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white group-hover:text-green-300 transition-colors">{spot.name}</h3>
            <p className="text-sm text-slate-400 line-clamp-2">{spot.description}</p>
            <div className="mt-2 flex items-center gap-3">
              <span className="text-[10px] font-mono text-green-500 bg-green-950/50 px-1.5 py-0.5 rounded">
                CODE: {spot.short_code}
              </span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest">
                <i className="fas fa-location-arrow mr-1"></i> {spot.latitude.toFixed(3)}, {spot.longitude.toFixed(3)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default SpotCard;
