
import React, { useState, useEffect } from 'react';
import * as RouterDOM from 'react-router-dom';
import Layout from './components/Layout';
import MapExplorer from './views/MapExplorer';
import Scan from './views/Scan';
import Profile from './views/Profile';
import SpotDetails from './views/SpotDetails';
import Auth from './views/Auth';
import Ritual from './views/Ritual';

const { BrowserRouter: Router, Routes, Route, Navigate } = RouterDOM;

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // Vérifier si une session existe
    const session = localStorage.getItem('tv_auth_session');
    setIsAuthenticated(!!session);
  }, []);

  const handleLogin = (username: string) => {
    localStorage.setItem('tv_auth_session', JSON.stringify({ username, id: 'u1' }));
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('tv_auth_session');
    setIsAuthenticated(false);
  };

  if (isAuthenticated === null) return null; // Loading state

  return (
    <Router>
      {!isAuthenticated ? (
        <Auth onLogin={handleLogin} />
      ) : (
        <Layout onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<MapExplorer />} />
            <Route path="/ritual" element={<Ritual />} />
            <Route path="/scan" element={<Scan />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/spot/:id" element={<SpotDetails />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </Layout>
      )}
    </Router>
  );
};

export default App;
