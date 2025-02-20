import React from 'react';
import './EternalPass.css';

export const EternalPass: React.FC = () => {
  return (
    <div className="eternal-pass-container">
      <h2 className="eternal-pass-title">Eternal Pass Purchases</h2>
      <div className="eternal-pass-content">
        <p className="eternal-pass-text">
          Eternal Pass purchase statistics will be displayed here.
        </p>
      </div>
    </div>
  );
};
