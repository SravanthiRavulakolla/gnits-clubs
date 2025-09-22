import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './MyRegistrations.css';

const MyRegistrations = () => {
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [clubApplications, setClubApplications] = useState([]);
  const [activeTab, setActiveTab] = useState('events');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (user?.role === 'student') {
      fetchRegistrations();
    }
  }, [user]);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      // Fetch event registrations
      const eventsResponse = await fetch(`${API_BASE_URL}/registrations/events/my`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEventRegistrations(eventsData.registrations || []);
      }

      // Fetch club applications
      const appsResponse = await fetch(`${API_BASE_URL}/registrations/recruitments/my`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (appsResponse.ok) {
        const appsData = await appsResponse.json();
        setClubApplications(appsData.applications || []);
      }

    } catch (error) {
      setError('Error loading registrations');
      console.error('Fetch registrations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'registered':
      case 'applied':
        return '#3182ce';
      case 'confirmed':
      case 'shortlisted':
        return '#38b2ac';
      case 'attended':
      case 'selected':
        return '#48bb78';
      case 'cancelled':
      case 'rejected':
        return '#e53e3e';
      default:
        return '#718096';
    }
  };

  const cancelRegistration = async (eventId) => {
    if (!window.confirm('Are you sure you want to cancel this registration?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/registrations/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        alert('Registration cancelled successfully');
        fetchRegistrations(); // Refresh the list
      } else {
        alert('Failed to cancel registration');
      }
    } catch (error) {
      alert('Error cancelling registration');
      console.error('Cancel registration error:', error);
    }
  };

  if (loading) {
    return <div className="loading">Loading your registrations...</div>;
  }

  return (
    <div className="my-registrations">
      <div className="registrations-header">
        <h1>My Registrations</h1>
        <p>Track your event registrations and club applications</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          Event Registrations ({eventRegistrations.length})
        </button>
        <button 
          className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
          onClick={() => setActiveTab('applications')}
        >
          Club Applications ({clubApplications.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'events' ? (
          <div className="events-tab">
            {eventRegistrations.length === 0 ? (
              <div className="empty-state">
                <h3>No Event Registrations</h3>
                <p>You haven't registered for any events yet.</p>
              </div>
            ) : (
              <div className="registrations-grid">
                {eventRegistrations.map(registration => (
                  <div key={registration._id} className="registration-card">
                    <div className="registration-header">
                      <h3>{registration.event?.title}</h3>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(registration.status) }}
                      >
                        {registration.status}
                      </span>
                    </div>
                    
                    <div className="registration-details">
                      <p><strong>Club:</strong> {registration.event?.clubName}</p>
                      <p><strong>Date:</strong> {formatDate(registration.event?.date)}</p>
                      <p><strong>Time:</strong> {registration.event?.time}</p>
                      <p><strong>Venue:</strong> {registration.event?.venue}</p>
                      <p><strong>Registered On:</strong> {formatDate(registration.createdAt)}</p>
                    </div>

                    {registration.status === 'registered' && (
                      <div className="registration-actions">
                        <button 
                          className="cancel-btn"
                          onClick={() => cancelRegistration(registration.event._id)}
                        >
                          Cancel Registration
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="applications-tab">
            {clubApplications.length === 0 ? (
              <div className="empty-state">
                <h3>No Club Applications</h3>
                <p>You haven't applied to any clubs yet.</p>
              </div>
            ) : (
              <div className="registrations-grid">
                {clubApplications.map(application => (
                  <div key={application._id} className="registration-card">
                    <div className="registration-header">
                      <h3>{application.recruitment?.title}</h3>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(application.status) }}
                      >
                        {application.status.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="registration-details">
                      <p><strong>Club:</strong> {application.recruitment?.clubName}</p>
                      <p><strong>Position:</strong> {application.appliedPosition}</p>
                      <p><strong>Applied On:</strong> {formatDate(application.createdAt)}</p>
                      <p><strong>Deadline:</strong> {formatDate(application.recruitment?.applicationDeadline)}</p>
                      {application.interviewDate && (
                        <p><strong>Interview Date:</strong> {formatDate(application.interviewDate)}</p>
                      )}
                      {application.feedback && (
                        <p><strong>Feedback:</strong> {application.feedback}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRegistrations;