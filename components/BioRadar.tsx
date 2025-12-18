
import React, { useMemo } from 'react';
import { Spot, SpotType } from '../types';

interface BioRadarProps {
  spots: Spot[];
  activeFilter: string;
}

const BioRadar: React.FC<BioRadarProps> = ({ spots, activeFilter }) => {
  // Simulation de coordonnées relatives pour le radar (0-100)
  const signals = useMemo(() => {
    return spots.map(s => ({
      id: s.id,
      x: ((s.longitude * 1000) % 80) + 10, // Mock positioning logic
      y: ((s.latitude * 1000) % 80) + 10,
      type: s.type,
      active: activeFilter === 'all' || s.type === activeFilter
    }));
  }, [spots, activeFilter]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a140a] rounded-xl border border-green-500/20">
      {/* Grid Background */}
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #1a2e1a 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>
      
      {/* Radar Scan Line */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent w-1/2 h-full animate-[radar-sweep_4s_infinite_linear] border-r border-green-500/10 origin-left"></div>

      {/* Signals / Spots */}
      {signals.map(sig => (
        <div 
          key={sig.id}
          className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
            sig.active ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
          style={{ left: `${sig.x}%`, top: `${sig.y}%` }}
        >
          {/* Pulsing signal */}
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
            sig.type === SpotType.TREE ? 'bg-green-500' : 
            sig.type === SpotType.WATER ? 'bg-blue-500' : 'bg-lime-500'
          }`}></div>
          <div className={`w-full h-full rounded-full shadow-[0_0_10px_currentColor] ${
            sig.type === SpotType.TREE ? 'bg-green-400' : 
            sig.type === SpotType.WATER ? 'bg-blue-400' : 'bg-lime-400'
          }`}></div>
        </div>
      ))}

      {/* HUD Overlays */}
      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <div className="text-[7px] font-mono text-green-500 uppercase tracking-widest bg-black/60 px-1 py-0.5 rounded border border-green-900/30">
          SIGNAL: STABLE (98.4%)
        </div>
        <div className="text-[7px] font-mono text-green-500 uppercase tracking-widest bg-black/60 px-1 py-0.5 rounded border border-green-900/30">
          DENSITÉ BIO: {spots.length * 12}.4 U/m²
        </div>
      </div>

      <div className="absolute bottom-2 right-2">
        <div className="text-[8px] font-mono text-green-700 animate-pulse">
          AUTOSCAN_ACTIVE...
        </div>
      </div>

      <style>{`
        @keyframes radar-sweep {
          from { transform: translateX(-100%) skewX(-20deg); }
          to { transform: translateX(200%) skewX(-20deg); }
        }
      `}</style>
    </div>
  );
};

export default BioRadar;
