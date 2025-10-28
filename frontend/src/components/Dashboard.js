import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [adminStats, setAdminStats] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

  useEffect(() => {
    if (user?.role === 'club_admin') {
      fetchAdminStats();
    }
  }, [user]);

  const fetchAdminStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/admin/stats/${user.clubName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdminStats(data);
      }
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    }
  };

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
          <div className="header-text">
            <h1>{user?.role === 'club_admin' ? `${user.clubName} Admin Dashboard` : 'GNITS Clubs'}</h1>
            <div className="welcome-message">
              {getWelcomeMessage()}
            </div>
          </div>
        </div>

        {user?.role === 'club_admin' && adminStats && (
          <div className="admin-stats">
            <h2 className="section-title">Club Statistics</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Total Events</h3>
                <div className="stat-number">{adminStats.totalEvents}</div>
              </div>
              <div className="stat-card">
                <h3>Upcoming Events</h3>
                <div className="stat-number">{adminStats.upcomingEvents}</div>
              </div>
              <div className="stat-card">
                <h3>Event Registrations</h3>
                <div className="stat-number">{adminStats.totalRegistrations}</div>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'student' && (
          <div className="clubs-section">
            <h2 className="section-title">Explore Our Clubs</h2>
            <div className="clubs-grid">
              {clubs.map((club) => (
                <div
                  key={club.id}
                  className="club-card"
                  onClick={() => handleClubClick(club.id)}
                >
                  <div className="club-logo">
                    <img src={club.logo} alt={`${club.name} Logo`} />
                  </div>
                  <h2>{club.name}</h2>
                  <p className="club-description" style={{color:"black"}}>{club.description}</p>
                  <div className="student-actions">
                    <span className="action-hint">Click to explore events & join</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Dashboard;