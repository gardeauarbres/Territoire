
import React, { useRef, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { audioService } from '../services/audioService';

interface MagneticButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}

const MagneticButton: React.FC<MagneticButtonProps> = ({ children, onClick, className, disabled }) => {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 15, stiffness: 150 };
  const springX = useSpring(x, springConfig);
  const springY = useSpring(y, springConfig);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current || disabled) return;
    const { clientX, clientY } = e;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    x.set((clientX - centerX) * 0.4);
    y.set((clientY - centerY) * 0.4);
  };

  const handleMouseEnter = () => {
    if (!disabled) audioService.playHover();
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleClick = () => {
    if (!disabled) {
      audioService.playClick();
      onClick?.();
    }
  };

  return (
    <div 
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block"
    >
      <motion.button
        style={{ x: springX, y: springY }}
        onClick={handleClick}
        disabled={disabled}
        className={`relative overflow-hidden group transition-all active:scale-95 ${className}`}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        {children}
      </motion.button>
    </div>
  );
};

export default MagneticButton;
