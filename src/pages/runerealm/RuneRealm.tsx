import { Outlet } from 'react-router-dom';
import './RuneRealm.css';

export const RuneRealm: React.FC = () => {
  return (
    <div className="runerealm-page">
      <div className="content-wrapper">
        <h1 className="runerealm-title">RuneRealm</h1>
        <Outlet />
      </div>
    </div>
  );
};

export const RuneRealmHome: React.FC = () => {
  return (
    <section className="runerealm-section">
      <p className="runerealm-text">
        Welcome to RuneRealm - your gateway to the mystical world of blockchain gaming.
      </p>
    </section>
  );
};
