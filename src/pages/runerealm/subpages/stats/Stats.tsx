import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import './Stats.css';

export const Stats: React.FC = () => {
  const location = useLocation();
  const isMainStats = location.pathname === '/runerealm/stats';

  return (
    <section>
      <h2 className="stats-title">Stats</h2>
      {isMainStats ? (
        <div className="stats-grid">
          <div className="stats-card">
            <h3 className="stats-title">Players</h3>
            <p className="stats-text">
              Active players statistics will be displayed here
            </p>
          </div>
          <div className="stats-card">
            <h3 className="stats-title">Transactions</h3>
            <p className="stats-text">
              Transaction statistics will be displayed here
            </p>
          </div>
          <div className="stats-card">
            <h3 className="stats-title">Performance</h3>
            <p className="stats-text">
              Performance metrics will be displayed here
            </p>
          </div>
        </div>
      ) : (
        <Outlet />
      )}
    </section>
  );
};
