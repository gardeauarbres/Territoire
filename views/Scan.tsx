
import React, { useState, useRef, useEffect } from 'react';
import * as RouterDOM from 'react-router-dom';
import { ICONS } from '../constants';
import { identifySpecies } from '../services/geminiService';
import { BioScanResult } from '../types';
import { db } from '../services/db';

const { useNavigate } = RouterDOM;

const Scan: React.FC = () => {
  const [mode, setMode] = useState<'qr' | 'bio'>('qr');
  const [code, setCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<BioScanResult | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access denied", err);
      setMode('qr');
    }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach(track => track.stop());
    setCameraStream(null);
  };

  useEffect(() => {
    if (mode === 'bio') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      navigate(`/spot/${code.trim()}`);
    }
  };

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsScanning(true);
    setScanResult(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      const result = await identifySpecies(base64);
      setScanResult(result);
      
      // Bonus XP for new discovery (mock)
      const profile = await db.getProfile();
      profile.xp += 50;
      localStorage.setItem('tv_profile', JSON.stringify(profile));
      
    } catch (err) {
      console.error("Identification failed", err);
      alert("Erreur de reconnaissance. L'Esprit est embrumé.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-6 pb-10">
      {/* Mode Switcher */}
      <div className="flex bg-slate-900/50 p-1 rounded-xl border border-green-900/30 w-full max-w-xs">
        <button 
          onClick={() => { setMode('qr'); setScanResult(null); }}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            mode === 'qr' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-500'
          }`}
        >
          Liaison QR
        </button>
        <button 
          onClick={() => { setMode('bio'); setScanResult(null); }}
          className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
            mode === 'bio' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-500'
          }`}
        >
          Bio-Scan
        </button>
      </div>

      {mode === 'bio' ? (
        <div className="w-full space-y-6 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative group">
            <div className="w-full aspect-square max-w-sm mx-auto border-2 border-green-500/30 rounded-3xl overflow-hidden bg-black relative shadow-2xl">
               <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover grayscale brightness-75 contrast-125 group-hover:grayscale-0 transition-all duration-700"
               />
               
               {/* Scan overlays */}
               <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none"></div>
               <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-green-500"></div>
               <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-green-500"></div>
               <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-green-500"></div>
               <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-green-500"></div>

               {isScanning && (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-30">
                    <div className="w-16 h-16 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="mt-4 text-[10px] font-mono text-green-500 uppercase tracking-widest animate-pulse">Analyse Bio-Séquentielle...</p>
                 </div>
               )}

               <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
                  <button 
                    onClick={captureAndIdentify}
                    disabled={isScanning}
                    className="w-16 h-16 rounded-full border-4 border-white/20 p-1 hover:scale-110 active:scale-95 transition-all"
                  >
                    <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.5)]">
                       <i className="fas fa-camera text-black text-xl"></i>
                    </div>
                  </button>
               </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {scanResult ? (
            <div className="glass-panel p-6 rounded-2xl border-green-400 animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded bg-green-950/50 flex items-center justify-center text-green-500 text-xl border border-green-500/20">
                  <i className="fas fa-microscope"></i>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white uppercase tracking-tight">{scanResult.commonName}</h3>
                  <p className="text-[10px] font-mono italic text-green-500">{scanResult.scientificName}</p>
                </div>
              </div>
              
              <div className="p-3 bg-black/40 rounded-xl border border-green-900/30 mb-4">
                <div className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mb-1">Bio-Data</div>
                <p className="text-sm text-slate-200 leading-relaxed italic">"{scanResult.ecologyFact}"</p>
              </div>

              <div className="flex justify-between items-center">
                <div className="flex gap-1 items-center">
                  <i className="fas fa-shield-alt text-[10px] text-green-700"></i>
                  <span className="text-[9px] font-mono text-green-900 uppercase">Indice de confiance: {Math.round(scanResult.confidence * 100)}%</span>
                </div>
                <div className="text-[10px] font-bold text-green-400 animate-pulse">+50 XP EXPLORATEUR</div>
              </div>
            </div>
          ) : (
            <div className="text-center px-8">
               <p className="text-xs text-slate-500 italic">Capturez une plante, un arbre ou un animal pour synchroniser ses données avec le Territoire.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full space-y-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="relative">
            <div className="w-64 h-64 border-2 border-green-500/30 rounded-3xl flex items-center justify-center overflow-hidden bg-black relative mx-auto">
              <div className="absolute inset-x-0 top-0 h-1 bg-green-500/80 shadow-[0_0_15px_rgba(34,197,94,1)] animate-[scan_2s_linear_infinite] z-20"></div>
              <div className="text-6xl text-green-900/50">{ICONS.SCAN}</div>
              <div className="absolute top-4 left-4 w-6 h-6 border-t-4 border-l-4 border-green-500 rounded-tl-lg"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-4 border-r-4 border-green-500 rounded-tr-lg"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-4 border-l-4 border-green-500 rounded-bl-lg"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-4 border-r-4 border-green-500 rounded-br-lg"></div>
            </div>
            <div className="absolute -inset-4 bg-green-500/5 blur-2xl -z-10 rounded-full"></div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold text-white tracking-widest uppercase">Liaison de Spot</h2>
            <p className="text-sm text-slate-500 px-8">Scannez le QR Code d'un marqueur physique pour accéder à ses missions.</p>
          </div>

          <div className="w-full max-w-xs mx-auto space-y-4">
            <div className="flex items-center gap-2 text-slate-600">
              <div className="h-px bg-slate-800 flex-1"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest">Ou saisie manuelle</span>
              <div className="h-px bg-slate-800 flex-1"></div>
            </div>
            
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input 
                type="text" 
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="EX: OAK1"
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-green-400 font-mono focus:outline-none focus:border-green-500 transition-colors uppercase"
              />
              <button 
                type="submit"
                className="bg-green-500 text-black px-4 rounded-lg font-bold hover:bg-green-400 transition-colors"
              >
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
      `}</style>
    </div>
  );
};

export default Scan;
