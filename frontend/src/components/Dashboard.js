import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  const clubs = [
    { 
      id: 'csi', 
      name: 'CSI', 
      logo: '/logos/csi-logo.jpg',
      description: 'Computer Society of India - Advancing technology and innovation'
    },
    { 
      id: 'gdsc', 
      name: 'GDSC', 
      logo: '/logos/gdsc-logo.png',
      description: 'Google Developer Student Clubs - Learn, build, and grow together'
    },
    { 
      id: 'aptnus-gana', 
      name: 'Aptnus Gana', 
      logo: '/logos/aptus-gana-logo.jpg',
      description: 'Cultural and arts club - Express your creativity'
    }
  ];

  const handleClubClick = (clubId) => {
    navigate(`/club/${clubId}`);
  };

  const handleLogout = () => {
    logout();
  };

  const getWelcomeMessage = () => {
    if (user?.role === 'student') {
      return `Welcome back, ${user.name}! Ready to explore clubs and events?`;
    } else if (user?.role === 'club_admin') {
      return `Welcome back, ${user.name}! Manage your ${user.clubName} club activities.`;
    }
    return 'Welcome to GNITS Clubs!';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="header">
          <img src="/logos/gnits-logo.jpeg" alt="GNITS Logo" className="gnits-logo" />
          <h1>GNITS Clubs</h1>
        </div>
        
        <div className="welcome-message">
          {getWelcomeMessage()}
        </div>

        <div className="clubs-section">
          <h2 className="section-title">
            {user?.role === 'club_admin' ? 'Manage Clubs' : 'Explore Our Clubs'}
          </h2>
          <div className="clubs-grid">
            {clubs.map((club) => {
              const isUserClub = user?.role === 'club_admin' && user?.clubName === club.name;
              const isClickable = user?.role === 'student' || isUserClub;
              
              return (
                <div
                  key={club.id}
                  className={`club-card ${!isClickable ? 'disabled' : ''} ${isUserClub ? 'my-club' : ''}`}
                  onClick={isClickable ? () => handleClubClick(club.id) : undefined}
                >
                  <div className="club-logo">
                    <img src={club.logo} alt={`${club.name} Logo`} />
                  </div>
                  <h2>{club.name}</h2>
                  <p className="club-description">{club.description}</p>
                  {user?.role === 'club_admin' && (
                    <div className="club-admin-badge">
                      {isUserClub ? (
                        <span className="my-club-badge">Your Club</span>
                      ) : (
                        <span className="other-club-badge">Other Club</span>
                      )}
                    </div>
                  )}
                  {user?.role === 'student' && (
                    <div className="student-actions">
                      <span className="action-hint">Click to explore events & join</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {user?.role === 'student' && (
          <div className="student-features">
            <h2 className="section-title">Quick Actions</h2>
            <div className="feature-cards">
              <div className="feature-card">
                <h3>📅 My Registrations</h3>
                <p>View all your event registrations and club applications</p>
                <button 
                  className="feature-button" 
                  onClick={() => navigate('/my-registrations')}
                >
                  View My Registrations
                </button>
              </div>
              <div className="feature-card">
                <h3>🎯 Upcoming Events</h3>
                <p>Don't miss out on exciting events from all clubs</p>
                <button 
                  className="feature-button" 
                  onClick={() => navigate('/events')}
                >
                  View Events
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;