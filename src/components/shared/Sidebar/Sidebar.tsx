import { NavLink } from 'react-router-dom';
import { useState, Dispatch, SetStateAction } from 'react';
import './Sidebar.css';

interface SidebarProps {
  onToggle: Dispatch<SetStateAction<boolean>>;
}

export const Sidebar: React.FC<SidebarProps> = ({ onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    onToggle(!isCollapsed);
  };

  const handleLinkClick = () => {
    setIsCollapsed(true);
    onToggle(true);
  };

  return (
    <>
      <button 
        className={`sidebar-toggle ${isCollapsed ? 'collapsed' : ''}`}
        onClick={toggleSidebar}
        aria-label={isCollapsed ? 'Open menu' : 'Close menu'}
      >
        {isCollapsed ? '☰' : '×'}
      </button>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <nav>
          <ul className="sidebar-nav">
            <li>
              <NavLink 
                to="/runerealm" 
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={handleLinkClick}
              >
                RuneRealm
              </NavLink>
              <ul className="sidebar-subnav">
                <li>
                  <NavLink 
                    to="/runerealm/stats" 
                    className={({ isActive }) => 
                      `sidebar-link ${isActive ? 'active' : ''}`
                    }
                    onClick={handleLinkClick}
                    end
                  >
                    Stats
                  </NavLink>
                  <ul className="sidebar-subnav">
                    <li>
                      <NavLink 
                        to="/runerealm/stats/eternal-pass" 
                        className={({ isActive }) => 
                          `sidebar-link ${isActive ? 'active' : ''}`
                        }
                        onClick={handleLinkClick}
                      >
                        Eternal Pass
                      </NavLink>
                    </li>
                  </ul>
                </li>
              </ul>
            </li>
            <li>
              <NavLink 
                to="/randao" 
                className={({ isActive }) => 
                  `sidebar-link ${isActive ? 'active' : ''}`
                }
                onClick={handleLinkClick}
              >
                Randao
              </NavLink>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};
