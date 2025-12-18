
import React, { useMemo } from 'react';
import { Spot, SpotType } from '../types';

interface BioRadarProps {
  spots: Spot[];
  activeFilter: string;
}

const BioRadar: React.FC<BioRadarProps> = ({ spots, activeFilter }) => {
  const signals = useMemo(() => {
    return spots.map(s => ({
      id: s.id,
      x: ((s.longitude * 1000) % 80) + 10,
      y: ((s.latitude * 1000) % 80) + 10,
      type: s.type,
      active: activeFilter === 'all' || s.type === activeFilter,
      lastActivity: s.last_activity,
      connectedTo: s.connected_spot_ids
    }));
  }, [spots, activeFilter]);

  const connections = useMemo(() => {
    const lines: { x1: number, y1: number, x2: number, y2: number, active: boolean, id: string }[] = [];
    signals.forEach(sig => {
      sig.connectedTo?.forEach(targetId => {
        const target = signals.find(s => s.id === targetId);
        if (target) {
          // Check if connection is "hot" (recent activity on both ends)
          const isHot = (sig.lastActivity && new Date().getTime() - new Date(sig.lastActivity).getTime() < 3600000) &&
                        (target.lastActivity && new Date().getTime() - new Date(target.lastActivity).getTime() < 3600000);
          
          lines.push({
            id: `${sig.id}-${targetId}`,
            x1: sig.x,
            y1: sig.y,
            x2: target.x,
            y2: target.y,
            active: isHot
          });
        }
      });
    });
    return lines;
  }, [signals]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a140a] rounded-xl border border-green-500/20">
      <div className="absolute inset-0" style={{
        backgroundImage: 'radial-gradient(circle, #1a2e1a 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }}></div>
      
      {/* Mycelium Threads (SVG) */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {connections.map(line => (
          <line
            key={line.id}
            x1={`${line.x1}%`}
            y1={`${line.y1}%`}
            x2={`${line.x2}%`}
            y2={`${line.y2}%`}
            stroke={line.active ? '#4ade80' : '#14532d'}
            strokeWidth={line.active ? '1.5' : '0.5'}
            strokeDasharray={line.active ? 'none' : '4 2'}
            className={line.active ? 'animate-pulse shadow-green-500' : ''}
            style={{ filter: line.active ? 'drop-shadow(0 0 4px #22c55e)' : 'none' }}
          />
        ))}
      </svg>

      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/5 to-transparent w-1/2 h-full animate-[radar-sweep_4s_infinite_linear] border-r border-green-500/10 origin-left"></div>

      {signals.map(sig => (
        <div 
          key={sig.id}
          className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 transition-all duration-700 ${
            sig.active ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
          }`}
          style={{ left: `${sig.x}%`, top: `${sig.y}%` }}
        >
          <div className={`absolute inset-0 rounded-full animate-ping opacity-20 ${
            sig.type === SpotType.TREE ? 'bg-green-500' : 
            sig.type === SpotType.WATER ? 'bg-blue-500' : 'bg-lime-500'
          }`}></div>
          <div className={`w-full h-full rounded-full shadow-[0_0_10px_currentColor] border border-white/20 ${
            sig.type === SpotType.TREE ? 'bg-green-400' : 
            sig.type === SpotType.WATER ? 'bg-blue-400' : 'bg-lime-400'
          }`}></div>
        </div>
      ))}

      <div className="absolute top-2 left-2 flex flex-col gap-1">
        <div className="text-[7px] font-mono text-green-500 uppercase tracking-widest bg-black/60 px-1 py-0.5 rounded border border-green-900/30">
          MYCÉLIUM: {connections.filter(c => c.active).length} LIAISONS ACTIVES
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
