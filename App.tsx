
import React, { useState, useEffect } from 'react';
import * as RouterDOM from 'react-router-dom';
import Layout from './components/Layout';
import MapExplorer from './views/MapExplorer';
import Scan from './views/Scan';
import Profile from './views/Profile';
import SpotDetails from './views/SpotDetails';
import Auth from './views/Auth';
import Ritual from './views/Ritual';
import EcosystemDashboard from './views/EcosystemDashboard';
import SwarmManager from './views/SwarmManager';
import Chronicles from './views/Chronicles';
import SymbiosisFlow from './views/SymbiosisFlow';
import EmergencyOverlay from './components/EmergencyOverlay';
import NexusToast, { ToastMessage } from './components/NexusToast';
import { supabase } from './services/supabase';
import { db } from './services/db';
import { Territory } from './types';
import { audioService } from './services/audioService';

const { BrowserRouter: Router, Routes, Route, Navigate } = RouterDOM;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [territory, setTerritory] = useState<Territory | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { ...toast, id }]);
    audioService.playHover();
    audioService.vibrate(50);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    const loadTerritory = async () => {
        try {
            const t = await db.getTerritory();
            setTerritory(t);
            if (t.stability_score < 30) {
              audioService.toggleAlarm(true);
            } else {
              audioService.toggleAlarm(false);
            }
        } catch (e) {
            console.error("Nexus offline");
        }
    };
    loadTerritory();

    // -- REALTIME SUBSCRIPTIONS --
    const missionsChannel = supabase.channel('global-nexus')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mission_completions' }, async (payload) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (payload.new.user_id === user?.id) return;

        const { data: profile } = await supabase.from('profiles').select('username').eq('id', payload.new.user_id).single();
        
        // Récupérer le titre de la mission
        const { data: mission } = await supabase.from('missions').select('title').eq('id', payload.new.mission_id).single();

        addToast({
            type: 'MISSION',
            title: profile?.username || 'Un Gardien',
            message: `a accompli : ${mission?.title || 'une mission'}`,
            icon: 'fas fa-bolt'
        });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'scanned_species' }, async (payload) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (payload.new.user_id === user?.id) return;

        const { data: profile } = await supabase.from('profiles').select('username').eq('id', payload.new.user_id).single();
        addToast({
            type: 'SCAN',
            title: profile?.username || 'Un Gardien',
            message: `a découvert : ${payload.new.common_name}`, // Correction snake_case
            icon: 'fas fa-dna'
        });
      })
      .subscribe();

    const handleFirstClick = () => {
      audioService.init();
      window.removeEventListener('click', handleFirstClick);
    };
    window.addEventListener('click', handleFirstClick);

    return () => {
        subscription.unsubscribe();
        supabase.removeChannel(missionsChannel);
        window.removeEventListener('click', handleFirstClick);
    };
  }, []);

  useEffect(() => {
    let interval: any;
    if (territory && territory.stability_score < 30) {
      interval = setInterval(() => {
        audioService.vibrate([150, 50, 150]);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [territory]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-[#020401] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-green-500/20 border-t-green-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      {!isAuthenticated ? (
        <Auth />
      ) : (
        <>
          <EmergencyOverlay territory={territory} />
          <NexusToast toasts={toasts} onRemove={removeToast} />
          <Layout onLogout={handleLogout}>
            <Routes>
              <Route path="/" element={<MapExplorer />} />
              <Route path="/ritual" element={<Ritual />} />
              <Route path="/ecosystem" element={<EcosystemDashboard />} />
              <Route path="/swarms" element={<SwarmManager />} />
              <Route path="/chronicles" element={<Chronicles />} />
              <Route path="/symbiosis" element={<SymbiosisFlow />} />
              <Route path="/scan" element={<Scan />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/spot/:id" element={<SpotDetails />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </Layout>
        </>
      )}
    </Router>
  );
};

export default App;
