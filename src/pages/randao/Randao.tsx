import React from 'react';
import './Randao.css';

export const Randao: React.FC = () => {
  return (
    <div className="randao-page">
      <div className="content-wrapper">
        <h1 className="randao-title">Randao</h1>
        <section className="randao-section">
          <p className="randao-text">
            Welcome to Randao - a decentralized random number generator platform.
          </p>
        </section>
        <div className="randao-grid">
          <section className="randao-section">
            <h2 className="randao-title">Features</h2>
            <p className="randao-text">
              Future Randao features and capabilities will be displayed here.
            </p>
          </section>
          <section className="randao-section">
            <h2 className="randao-title">Documentation</h2>
            <p className="randao-text">
              Documentation and guides will be available here.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
