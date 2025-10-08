import React from 'react';
import { Link, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState } from 'react';
import './Navigation.css';

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [shouldRedirect, setShouldRedirect] = useState(false);

  const handleLogout = () => {
    logout();
    setShouldRedirect(true);
  };

  if (shouldRedirect) {
    return <Navigate to="/auth" replace />;
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <nav className="navigation">
      <Link to="/" className="nav-brand" style={{ textDecoration: 'none', color: 'inherit' }}>
        <img src="/logos/gnits-logo.jpeg" alt="GNITS" className="nav-logo" />
        <span>GNITS Clubs</span>
      </Link>

      <div className="nav-links">
        <Link 
          to="/"
          className={`nav-link ${isActive('/')}`}
          style={{ textDecoration: 'none' }}
        >
          Dashboard
        </Link>
        
        {user.role === 'student' && (
          <>
            <Link 
              to="/events"
              className={`nav-link ${isActive('/events')}`}
              style={{ textDecoration: 'none' }}
            >
              Events
            </Link>
            <Link 
              to="/recruitments"
              className={`nav-link ${isActive('/recruitments')}`}
              style={{ textDecoration: 'none' }}
            >
              Recruitments
            </Link>
            <Link 
              to="/my-registrations"
              className={`nav-link ${isActive('/my-registrations')}`}
              style={{ textDecoration: 'none' }}
            >
              My Applications
            </Link>
          </>
        )}

        {user.role === 'club_admin' && (
          <>
            <Link 
              to="/manage-events"
              className={`nav-link ${isActive('/manage-events')}`}
              style={{ textDecoration: 'none' }}
            >
              Manage Events
            </Link>
            <Link 
              to="/manage-recruitments"
              className={`nav-link ${isActive('/manage-recruitments')}`}
              style={{ textDecoration: 'none' }}
            >
              Manage Recruitments
            </Link>
            <Link 
              to="/registrations"
              className={`nav-link ${isActive('/registrations')}`}
              style={{ textDecoration: 'none' }}
            >
              View Applications
            </Link>
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