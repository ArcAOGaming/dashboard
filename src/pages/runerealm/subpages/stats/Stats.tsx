import React from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import './Stats.css';

export const Stats: React.FC = () => {
  const location = useLocation();
  const isMainStats = location.pathname === '/runerealm/stats';

  return (
    <section>
      <h2 className="stats-title">Stats</h2>
      {isMainStats ? (
        <div className="stats-container">
          <div className="stats-links">
            <Link to="eternal-pass" className="stats-link">
              View Eternal Pass Purchase Stats
            </Link>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </section>
  );
};
