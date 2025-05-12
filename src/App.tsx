import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import { Sidebar } from './components/shared/Sidebar';
import { RuneRealm, RuneRealmHome, Stats } from './pages/runerealm';
import { Randao } from './pages/randao';
import { EternalPass } from './pages/runerealm/subpages/stats/subpages/eternal-pass';
import { PermawebIndex } from './pages/permaweb-index';

function App() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Router>
      <div className="app-container">
        <Sidebar onToggle={setIsSidebarCollapsed} />
        <div className={`app-content ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Routes>
            <Route path="/" element={<Navigate to="/runerealm" replace />} />
            
            <Route path="/runerealm" element={<RuneRealm />}>
              <Route index element={<RuneRealmHome />} />
              <Route path="stats" element={<Stats />}>
                <Route path="eternal-pass" element={<EternalPass />} />
              </Route>
            </Route>
            
            <Route path="/randao" element={<Randao />} />
            <Route path="/permaweb-index" element={<PermawebIndex />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
