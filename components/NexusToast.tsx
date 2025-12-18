
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ToastMessage {
  id: string;
  type: 'MISSION' | 'SCAN' | 'ECHO' | 'LEVEL';
  title: string;
  message: string;
  icon: string;
}

interface NexusToastProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

const NexusToast: React.FC<NexusToastProps> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed top-20 inset-x-0 z-[100] pointer-events-none flex flex-col items-center gap-2 px-4">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -20, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className="w-full max-w-xs pointer-events-auto"
            onClick={() => onRemove(toast.id)}
          >
            <div className="glass-panel p-4 rounded-2xl border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-4 relative overflow-hidden group">
              {/* Animated Progress Bar (Autoclose) */}
              <motion.div 
                initial={{ width: "100%" }}
                animate={{ width: "0%" }}
                transition={{ duration: 4, ease: "linear" }}
                onAnimationComplete={() => onRemove(toast.id)}
                className={`absolute bottom-0 left-0 h-0.5 opacity-40 ${
                  toast.type === 'MISSION' ? 'bg-green-500' : 
                  toast.type === 'SCAN' ? 'bg-blue-500' : 'bg-purple-500'
                }`}
              />
              
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border ${
                toast.type === 'MISSION' ? 'text-green-500 border-green-500/20 bg-green-500/5' : 
                toast.type === 'SCAN' ? 'text-blue-500 border-blue-500/20 bg-blue-500/5' : 
                'text-purple-500 border-purple-500/20 bg-purple-500/5'
              }`}>
                <i className={toast.icon}></i>
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="text-[8px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-0.5">Flux de Symbiose</div>
                <div className="text-[11px] font-bold text-white uppercase truncate">{toast.title}</div>
                <div className="text-[9px] text-slate-400 italic truncate">{toast.message}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NexusToast;
