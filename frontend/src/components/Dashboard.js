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

  const handleClubClick = (clubId) => {
    navigate(`/club/${clubId}`);
  };

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
                <div
                  key={club.id}
                  className="club-card"
                  onClick={() => handleClubClick(club.id)}
                >
                  <div className="club-logo">
                    <img src={club.logo} alt={`${club.name} Logo`} />
                  </div>
                  <h2>{club.name}</h2>
                  <p className="club-description">{club.description}</p>
                  <div className="student-actions">
                    <span className="action-hint">Click to explore events & join</span>
                  </div>
                </div>
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
                  <div className="stat-card" onClick={() => navigate('/registrations')} style={{cursor: 'pointer'}}>
                    <h3>👥 Event Registrations</h3>
                    <div className="stat-number">{adminStats.totalRegistrations || 0}</div>
                    <p>Click to view registrations</p>
                  </div>
              <div className="stat-card" onClick={() => navigate('/registrations')} style={{cursor: 'pointer'}}>
                <h3>📝 Membership Applications</h3>
                <div className="stat-number">{adminStats.membershipApplications || 0}</div>
                <p>Click to view applications</p>
              </div>
                  <div className="stat-card">
                    <h3>🎯 Upcoming Events</h3>
                    <div className="stat-number">{adminStats.upcomingEvents || 0}</div>
                    <p>Events scheduled</p>
                  </div>
                </div>
              </div>
            )}
            
            {adminStats && adminStats.recentApplications && adminStats.recentApplications.length > 0 && (
              <div className="recent-applications">
                <h3>Recent Applications</h3>
                <div className="applications-preview">
                  {adminStats.recentApplications.map(app => (
                    <div key={app._id} className="application-preview-card">
                      <div className="applicant-info">
                        <strong>{app.student?.name || app.studentName}</strong>
                        <span className="recruitment-title">Applied to: {app.recruitment?.title}</span>
                        <span className="application-date">
                          {new Date(app.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  className="view-all-btn"
                  onClick={() => navigate('/registrations')}
                >
                  View All Applications
                </button>
              </div>
            )}
            
            <div className="feature-cards">
              <div className="feature-card">
                <h3>📅 Manage Events</h3>
                <p>Create, edit, and delete events for your club</p>
                <button 
                  className="feature-button" 
                  onClick={() => navigate('/manage-events')}
                >
                  Manage Events
                </button>
              </div>
              <div className="feature-card">
                <h3>👥 View Registrations</h3>
                <p>See who registered for your events</p>
                <button 
                  className="feature-button" 
                  onClick={() => navigate('/registrations')}
                >
                  View Registrations
                </button>
              </div>
              <div className="feature-card">
                <h3>🎯 Recruitment Drives</h3>
                <p>Manage membership recruitment campaigns</p>
                <button 
                  className="feature-button" 
                  onClick={() => navigate('/manage-recruitments')}
                >
                  Manage Recruitments
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