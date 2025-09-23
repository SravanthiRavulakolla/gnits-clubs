import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './RegistrationsManagement.css';

const RegistrationsManagement = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [eventRegistrations, setEventRegistrations] = useState([]);
  const [recruitmentApplications, setRecruitmentApplications] = useState([]);
  const [selectedRegistration, setSelectedRegistration] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      
      // Fetch event registrations
      const eventsResponse = await fetch(`${API_BASE_URL}/registrations/events/club/${user.clubName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setEventRegistrations(eventsData.registrations || []);
      }

      // Fetch recruitment applications
      const recruitmentsResponse = await fetch(`${API_BASE_URL}/registrations/recruitments/club/${user.clubName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (recruitmentsResponse.ok) {
        const recruitmentsData = await recruitmentsResponse.json();
        setRecruitmentApplications(recruitmentsData.applications || []);
      }
    } catch (error) {
      setError('Error loading registrations');
      console.error('Fetch registrations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (registration) => {
    setSelectedRegistration(registration);
    setShowDetails(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const groupedEventRegistrations = eventRegistrations.reduce((acc, reg) => {
    const eventTitle = reg.eventId?.title || 'Unknown Event';
    if (!acc[eventTitle]) {
      acc[eventTitle] = {
        event: reg.eventId,
        registrations: []
      };
    }
    acc[eventTitle].registrations.push(reg);
    return acc;
  }, {});

  const groupedRecruitmentApplications = recruitmentApplications.reduce((acc, app) => {
    const recruitmentTitle = app.recruitmentId?.title || 'Unknown Recruitment';
    if (!acc[recruitmentTitle]) {
      acc[recruitmentTitle] = {
        recruitment: app.recruitmentId,
        applications: []
      };
    }
    acc[recruitmentTitle].applications.push(app);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading registrations...</div>;
  }

  return (
    <div className="registrations-management">
      <div className="management-header">
        <h2>Registrations & Applications</h2>
        <div className="tab-buttons">
          <button 
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Event Registrations ({eventRegistrations.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'recruitments' ? 'active' : ''}`}
            onClick={() => setActiveTab('recruitments')}
          >
            Recruitment Applications ({recruitmentApplications.length})
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === 'events' && (
        <div className="events-tab">
          {Object.keys(groupedEventRegistrations).length === 0 ? (
            <div className="empty-state">
              <h3>No Event Registrations</h3>
              <p>No students have registered for your events yet.</p>
            </div>
          ) : (
            <div className="registrations-list">
              {Object.entries(groupedEventRegistrations).map(([eventTitle, data]) => (
                <div key={eventTitle} className="registration-group">
                  <div className="group-header">
                    <h3>{eventTitle}</h3>
                    <div className="group-stats">
                      <span className="registration-count">
                        {data.registrations.length} registration{data.registrations.length !== 1 ? 's' : ''}
                      </span>
                      {data.event?.date && (
                        <span className="event-date">
                          Event: {formatDate(data.event.date)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="registrations-grid">
                    {data.registrations.map(registration => (
                      <div key={registration._id} className="registration-card">
                        <div className="student-info">
                          <h4>{registration.userId?.name || registration.userId?.username}</h4>
                          <p className="student-email">{registration.userId?.email}</p>
                        </div>
                        
                        <div className="registration-details">
                          <div className="detail-item">
                            <strong>Registered:</strong> {formatDate(registration.registeredAt)}
                          </div>
                          <div className="detail-item">
                            <strong>Status:</strong> 
                            <span className="status-confirmed">Confirmed</span>
                          </div>
                        </div>

                        <div className="card-actions">
                          <button 
                            className="view-btn"
                            onClick={() => handleViewDetails(registration)}
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'recruitments' && (
        <div className="recruitments-tab">
          {Object.keys(groupedRecruitmentApplications).length === 0 ? (
            <div className="empty-state">
              <h3>No Recruitment Applications</h3>
              <p>No students have applied for your recruitment posts yet.</p>
            </div>
          ) : (
            <div className="applications-list">
              {Object.entries(groupedRecruitmentApplications).map(([recruitmentTitle, data]) => (
                <div key={recruitmentTitle} className="application-group">
                  <div className="group-header">
                    <h3>{recruitmentTitle}</h3>
                    <div className="group-stats">
                      <span className="application-count">
                        {data.applications.length} application{data.applications.length !== 1 ? 's' : ''}
                      </span>
                      {data.recruitment?.deadline && (
                        <span className="deadline-info">
                          Deadline: {formatDate(data.recruitment.deadline)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="applications-grid">
                    {data.applications.map(application => (
                      <div key={application._id} className="application-card">
                        <div className="student-info">
                          <h4>{application.userId?.name || application.userId?.username}</h4>
                          <p className="student-email">{application.userId?.email}</p>
                        </div>
                        
                        <div className="application-details">
                          <div className="detail-item">
                            <strong>Applied:</strong> {formatDate(application.appliedAt)}
                          </div>
                          <div className="detail-item">
                            <strong>Questions Answered:</strong> {application.responses?.length || 0}
                          </div>
                        </div>

                        <div className="card-actions">
                          <button 
                            className="view-btn"
                            onClick={() => handleViewDetails(application)}
                          >
                            View Application
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showDetails && selectedRegistration && (
        <div className="details-overlay">
          <div className="details-modal">
            <div className="modal-header">
              <h3>
                {activeTab === 'events' ? 'Registration Details' : 'Application Details'}
              </h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="student-section">
                <h4>Student Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Name:</strong> {selectedRegistration.userId?.name || selectedRegistration.userId?.username}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {selectedRegistration.userId?.email}
                  </div>
                  <div className="info-item">
                    <strong>Role:</strong> {selectedRegistration.userId?.role}
                  </div>
                </div>
              </div>

              <div className="activity-section">
                <h4>
                  {activeTab === 'events' ? 'Event Information' : 'Recruitment Information'}
                </h4>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Title:</strong> 
                    {activeTab === 'events' 
                      ? selectedRegistration.eventId?.title 
                      : selectedRegistration.recruitmentId?.title}
                  </div>
                  <div className="info-item">
                    <strong>
                      {activeTab === 'events' ? 'Registered' : 'Applied'} On:
                    </strong> 
                    {formatDate(selectedRegistration.registeredAt || selectedRegistration.appliedAt)}
                  </div>
                </div>
              </div>

              {activeTab === 'recruitments' && selectedRegistration.responses && (
                <div className="responses-section">
                  <h4>Application Responses</h4>
                  <div className="responses-list">
                    {selectedRegistration.responses.map((response, index) => (
                      <div key={index} className="response-item">
                        <div className="question">
                          <strong>Q:</strong> {response.question}
                        </div>
                        <div className="answer">
                          <strong>A:</strong> {response.answer || 'No response'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button className="close-modal-btn" onClick={() => setShowDetails(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationsManagement;