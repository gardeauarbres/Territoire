
import React, { useState, useRef, useEffect } from 'react';
import * as RouterDOM from 'react-router-dom';
import { ICONS } from '../constants';
import { identifySpecies } from '../services/geminiService';
import { getLocalSpeciesFromINPN } from '../services/ecologyService';
import { BioScanResult, Artifact } from '../types';
import { db } from '../services/db';
import { motion, AnimatePresence } from 'framer-motion';
import MagneticButton from '../components/MagneticButton';
import { audioService } from '../services/audioService';

const { useNavigate } = RouterDOM;

const Scan: React.FC = () => {
  const [mode, setMode] = useState<'qr' | 'bio'>('qr');
  const [code, setCode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<(BioScanResult & { isVerified?: boolean }) | null>(null);
  const [newArtifact, setNewArtifact] = useState<Artifact | null>(null);
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
      if (videoRef.current) videoRef.current.srcObject = stream;
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
    if (mode === 'bio') startCamera();
    else stopCamera();
    return () => stopCamera();
  }, [mode]);

  const captureAndIdentify = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsScanning(true);
    setScanResult(null);
    setNewArtifact(null);

    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(video, 0, 0);

    const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];

    try {
      const result = await identifySpecies(base64);
      let isVerified = false;
      
      // Utilisation de la position GPS réelle pour la vérification INPN
      const getLocationAndVerify = () => {
        return new Promise<boolean>((resolve) => {
          navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
              const localSpecies = await getLocalSpeciesFromINPN(pos.coords.latitude, pos.coords.longitude);
              const verified = localSpecies.some(s => 
                  s.scientificName.toLowerCase().includes(result.scientificName.toLowerCase()) ||
                  result.scientificName.toLowerCase().includes(s.scientificName.toLowerCase())
              );
              resolve(verified);
            } catch (e) { resolve(false); }
          }, () => resolve(false));
        });
      };

      isVerified = await getLocationAndVerify();

      const finalResult = { ...result, isVerified };
      setScanResult(finalResult);
      
      if (isVerified) {
        audioService.vibrate([100, 50, 100]);
        await db.addXp(150);
        const art = await db.addArtifact({
            name: `Relique de ${result.commonName}`,
            description: `Fragment bio-numérique pur collecté dans le Nexus local via GPS.`,
            imageUrl: canvas.toDataURL('image/jpeg', 0.5),
            rarity: 'RARE',
            power_text: "Boost de résonance du Mycélium."
        });
        setNewArtifact(art);
      } else {
        audioService.vibrate(50);
        await db.addXp(50);
      }
      await db.addScannedSpecies(finalResult);
    } catch (err) {
      alert("L'Esprit est embrumé...");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="flex flex-col items-center space-y-8 pb-20">
      <div className="glass-panel p-1.5 rounded-2xl border-white/10 w-full max-w-xs flex z-20">
        <button onClick={() => { setMode('qr'); audioService.playClick(); }} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'qr' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Liaison QR</button>
        <button onClick={() => { setMode('bio'); audioService.playClick(); }} className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all ${mode === 'bio' ? 'bg-green-500 text-black shadow-lg shadow-green-500/20' : 'text-slate-500 hover:text-slate-300'}`}>Bio-Scan</button>
      </div>

      <AnimatePresence mode="wait">
        {mode === 'bio' ? (
          <motion.div 
            key="bio-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full space-y-8"
          >
            <div className="relative group max-w-sm mx-auto">
              <div className={`aspect-square w-full border-2 rounded-[40px] overflow-hidden bg-black relative shadow-2xl transition-all duration-700 ${scanResult?.isVerified ? 'border-yellow-500 shadow-yellow-500/20' : 'border-green-500/30'}`}>
                 <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover grayscale brightness-90 contrast-125" />
                 {isScanning && (
                   <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md z-30">
                      <div className="w-16 h-16 border-4 border-green-500/10 border-t-green-500 rounded-full animate-spin"></div>
                      <p className="mt-6 text-[10px] font-mono text-green-500 uppercase tracking-[0.3em] animate-pulse font-bold">Bio-Séquençage...</p>
                   </div>
                 )}
                 <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
                    <button onClick={captureAndIdentify} disabled={isScanning} className="w-20 h-20 rounded-full border-8 border-white/5 p-1 hover:scale-110 active:scale-90 transition-all">
                      <div className="w-full h-full rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.5)]">
                         <i className="fas fa-microscope text-black text-2xl"></i>
                      </div>
                    </button>
                 </div>
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </div>

            {scanResult && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`glass-panel p-8 rounded-[32px] border-2 ${scanResult.isVerified ? 'border-yellow-500 bg-yellow-950/5' : 'border-green-400/30'}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl bg-black/40 flex items-center justify-center text-2xl border ${scanResult.isVerified ? 'text-yellow-500 border-yellow-500/30' : 'text-green-500 border-green-500/10'}`}>
                      <i className={scanResult.isVerified ? "fas fa-award" : "fas fa-dna"}></i>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white uppercase tracking-tight">{scanResult.commonName}</h3>
                      <p className="text-[10px] font-mono italic text-green-700 font-bold">{scanResult.scientificName}</p>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mb-6">
                  <p className="text-sm text-slate-200 leading-relaxed italic font-serif">"{scanResult.ecologyFact}"</p>
                </div>
                {newArtifact && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl flex items-center gap-4"
                  >
                    <img src={newArtifact.imageUrl} className="w-14 h-14 rounded-xl object-cover border border-yellow-500/40" />
                    <div>
                      <div className="text-[8px] font-bold text-yellow-500 uppercase tracking-widest">Artefact Rare Découvert</div>
                      <div className="text-xs font-bold text-white uppercase">{newArtifact.name}</div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="qr-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="w-full space-y-10"
          >
            <div className="relative">
              <div className="w-72 h-72 border-2 border-green-500/20 rounded-[40px] flex items-center justify-center overflow-hidden bg-black/40 relative mx-auto shadow-2xl">
                <div className="absolute inset-x-0 top-0 h-1 bg-green-500 shadow-[0_0_20px_#22c55e] animate-[scan_3s_infinite_linear] z-20"></div>
                <div className="text-7xl text-green-900/20">{ICONS.SCAN}</div>
              </div>
            </div>
            <div className="text-center space-y-3 px-6">
              <h2 className="text-2xl font-bold text-white tracking-[0.2em] uppercase neon-text">Liaison de Spot</h2>
              <p className="text-xs text-slate-500 leading-relaxed italic">Alignez le code physique pour synchroniser le Nexus local.</p>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); if(code) navigate(`/spot/${code}`); }} className="w-full max-w-xs mx-auto flex gap-3">
              <input 
                value={code} 
                onChange={e => setCode(e.target.value.toUpperCase())} 
                placeholder="ID NEXUS" 
                className="flex-1 bg-black/60 border border-white/5 rounded-2xl px-6 py-4 text-green-400 font-mono text-center tracking-[0.5em] focus:outline-none focus:border-green-500/50 transition-all" 
              />
              <button type="submit" className="w-14 h-14 bg-green-500 text-black rounded-2xl font-bold shadow-lg shadow-green-500/20 hover:bg-green-400 active:scale-90 transition-all">
                <i className="fas fa-arrow-right"></i>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Scan;
