
import React from 'react';
import { Territory } from '../types';

interface EmergencyOverlayProps {
  territory: Territory | null;
}

const EmergencyOverlay: React.FC<EmergencyOverlayProps> = ({ territory }) => {
  if (!territory || territory.stability_score >= 30) return null;

  return (
    <div className="fixed inset-x-0 top-16 z-[100] pointer-events-none">
      <div className="bg-red-600/90 backdrop-blur-md text-white py-2 px-4 flex items-center justify-between border-y border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.5)]">
        <div className="flex items-center gap-3">
          <i className="fas fa-radiation animate-spin duration-[3s] text-lg"></i>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest leading-none">Alerte Stabilité Critique</div>
            <div className="text-[8px] font-mono opacity-80 uppercase tracking-tighter">Nexus compromis : {territory.stability_score}%</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
           <span className="text-[10px] font-bold uppercase tracking-widest">Urgence Collective</span>
        </div>
      </div>
      
      {/* Glitch Overlay Effect */}
      <div className="fixed inset-0 bg-red-600/5 mix-blend-overlay animate-[glitch-flicker_0.1s_infinite] pointer-events-none"></div>
      
      <style>{`
        @keyframes glitch-flicker {
          0% { opacity: 0.05; }
          50% { opacity: 0.1; }
          100% { opacity: 0.05; }
        }
      `}</style>
    </div>
  );
};

export default EmergencyOverlay;
