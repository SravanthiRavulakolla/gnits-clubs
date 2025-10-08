import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [adminStats, setAdminStats] = useState(null);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  
  const clubs = [
    { 
      id: 'csi', 
      name: 'CSI', 
      logo: '/logos/csi-logo.jpg',
      description: 'Computer Society of India - Advancing technology and innovation',
      color: "blue"
    },
    { 
      id: 'gdsc', 
      name: 'GDSC', 
      logo: '/logos/gdsc-logo.png',
      description: 'Google Developer Student Clubs - Learn, build, and grow together',
      color: "blue"
    },
    { 
      id: 'aptnus-gana', 
      name: 'Aptnus Gana', 
      logo: '/logos/aptus-gana-logo.jpg',
      description: 'Cultural and arts club - Express your creativity',
      color: "blue"
    }
  ];


  const handleLogout = () => {
    logout();
  };

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

        {user?.role === 'student' && (
          <div className="clubs-section">
            <h2 className="section-title">Explore Our Clubs</h2>
            <div className="clubs-grid">
              {clubs.map((club) => (
                <Link
                  to={`/club/${club.id}`}
                  key={club.id}
                  className="club-card"
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div className="club-logo">
                    <img src={club.logo} alt={`${club.name} Logo`} />
                  </div>
                  <h2>{club.name}</h2>
                  <p className="club-description">{club.description}</p>
                  <div className="student-actions">
                    <span className="action-hint">Click to explore events & join</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        
        {user?.role === 'student' && (
          <div className="student-features">
            <h2 className="section-title">Quick Actions</h2>
            <div className="feature-cards">
              <div className="feature-card">
                <h3>📅 My Registrations</h3>
                <p>View all your event registrations and club applications</p>
                <Link 
                  to="/my-registrations"
                  className="feature-button" 
                  style={{ textDecoration: 'none' }}
                >
                  View My Registrations
                </Link>
              </div>
              <div className="feature-card">
                <h3>🎯 Upcoming Events</h3>
                <p>Don't miss out on exciting events from all clubs</p>
                <Link 
                  to="/events"
                  className="feature-button" 
                  style={{ textDecoration: 'none' }}
                >
                  View Events
                </Link>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'club_admin' && (
          <div className="admin-features">
            <h2 className="section-title">Club Management</h2>
            
            {adminStats && (
              <div className="admin-stats">
                <div className="stats-grid">
                  <div className="stat-card">
                    <h3>📊 Total Events</h3>
                    <div className="stat-number">{adminStats.totalEvents || 0}</div>
                    <p>Events created</p>
                  </div>
                  <Link to="/registrations" className="stat-card" style={{textDecoration: 'none', color: 'inherit', cursor: 'pointer'}}>
                    <h3>👥 Event Registrations</h3>
                    <div className="stat-number">{adminStats.totalRegistrations || 0}</div>
                    <p>Click to view registrations</p>
                  </Link>
              <Link to="/registrations" className="stat-card" style={{textDecoration: 'none', color: 'inherit', cursor: 'pointer'}}>
                <h3>📝 Membership Applications</h3>
                <div className="stat-number">{adminStats.membershipApplications || 0}</div>
                <p>Click to view applications</p>
              </Link>
                  <div className="stat-card">
                    <h3>🎯 Upcoming Events</h3>
                    <div className="stat-number">{adminStats.upcomingEvents || 0}</div>
                    <p>Events scheduled</p>
                  </div>
                </div>
              </div>
            )}
            
           
            
            <div className="feature-cards">
              <div className="feature-card">
                <h3>📅 Manage Events</h3>
                <p>Create, edit, and delete events for your club</p>
                <Link 
                  to="/manage-events"
                  className="feature-button"
                  style={{ textDecoration: 'none' }}
                >
                  Manage Events
                </Link>
              </div>
              <div className="feature-card">
                <h3>👥 View Registrations</h3>
                <p>See who registered for your events</p>
                <Link 
                  to="/registrations"
                  className="feature-button"
                  style={{ textDecoration: 'none' }}
                >
                  View Registrations
                </Link>
              </div>
              <div className="feature-card">
                <h3>🎯 Recruitment Drives</h3>
                <p>Manage membership recruitment campaigns</p>
                <Link 
                  to="/manage-recruitments"
                  className="feature-button"
                  style={{ textDecoration: 'none' }}
                >
                  Manage Recruitments
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
