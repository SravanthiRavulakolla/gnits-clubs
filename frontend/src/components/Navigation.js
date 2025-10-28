import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <div className="nav-brand" onClick={() => navigate('/')}>
        <img src="/logos/gnits-logo.jpeg" alt="GNITS" className="nav-logo" />
        <span>GNITS Clubs</span>
      </div>

      <div className="nav-links">
        <button 
          className={`nav-link ${isActive('/')}`}
          onClick={() => navigate('/')}
        >
          Dashboard
        </button>
        
        {user.role === 'student' && (
          <>
            <button
              className={`nav-link ${isActive('/events')}`}
              onClick={() => navigate('/events')}
            >
              Events
            </button>
            <button
              className={`nav-link ${isActive('/my-registrations')}`}
              onClick={() => navigate('/my-registrations')}
            >
              My Registrations
            </button>
          </>
        )}

        {user.role === 'club_admin' && (
          <>
            <button
              className={`nav-link ${isActive('/manage-events')}`}
              onClick={() => navigate('/manage-events')}
            >
              Manage Events
            </button>
            <button
              className={`nav-link ${isActive('/registrations')}`}
              onClick={() => navigate('/registrations')}
            >
              View Registrations
            </button>
          </>
        )}
      </div>

      <div className="nav-user">
        <span className="user-name">{user.name}</span>
        <span className="user-role">({user.role === 'club_admin' ? 'Admin' : 'Student'})</span>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
};

export default Navigation;