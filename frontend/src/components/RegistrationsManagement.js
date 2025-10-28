import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './RegistrationsManagement.css';

const RegistrationsManagement = () => {
  const [eventRegistrations, setEventRegistrations] = useState([]);
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
      setError('');

      console.log(`Fetching event registrations for club: ${user.clubName}`);

      // Fetch event registrations
      const eventRegResponse = await fetch(`${API_BASE_URL}/admin/event-registrations/${user.clubName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (eventRegResponse.ok) {
        const eventRegData = await eventRegResponse.json();
        console.log(`Found ${eventRegData.totalRegistrations} event registrations for ${user.clubName}`);
        setEventRegistrations(eventRegData.registrations || []);
      } else {
        console.warn('Failed to fetch event registrations');
        setEventRegistrations([]);
        setError('Failed to fetch event registrations');
      }

    } catch (error) {
      const errorMessage = `Error loading registrations: ${error.message}`;
      setError(errorMessage);
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
    const eventTitle = reg.event?.title || 'Unknown Event';
    if (!acc[eventTitle]) {
      acc[eventTitle] = {
        event: reg.event,
        registrations: []
      };
    }
    acc[eventTitle].registrations.push(reg);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading registrations...</div>;
  }

  return (
    <div className="registrations-management">
      <div className="management-header">
        <h2>Event Registrations</h2>
      </div>

      {error && <div className="error-message">{error}</div>}

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
                        <h4>{registration.student?.name || registration.studentName}</h4>
                        <p className="student-email">{registration.student?.email || registration.email}</p>
                        <p className="student-details">
                          {registration.rollNumber} | {registration.department}
                        </p>
                      </div>

                      <div className="registration-details">
                        <div className="detail-item">
                          <strong>Registered:</strong> {formatDate(registration.createdAt)}
                        </div>
                        <div className="detail-item">
                          <strong>Status:</strong>
                          <span className={`status-${registration.status}`}>{registration.status}</span>
                        </div>
                        {registration.phone && (
                          <div className="detail-item">
                            <strong>Phone:</strong> {registration.phone}
                          </div>
                        )}
                        {registration.additionalInfo && (
                          <div className="detail-item">
                            <strong>Additional Info:</strong> {registration.additionalInfo}
                          </div>
                        )}
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

      {showDetails && selectedRegistration && (
        <div className="details-overlay">
          <div className="details-modal">
            <div className="modal-header">
              <h3>Registration Details</h3>
              <button className="close-btn" onClick={() => setShowDetails(false)}>×</button>
            </div>

            <div className="modal-content">
              <div className="student-section">
                <h4>Student Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Name:</strong> {selectedRegistration.student?.name || selectedRegistration.studentName}
                  </div>
                  <div className="info-item">
                    <strong>Email:</strong> {selectedRegistration.student?.email || selectedRegistration.email}
                  </div>
                  <div className="info-item">
                    <strong>Roll Number:</strong> {selectedRegistration.rollNumber}
                  </div>
                  <div className="info-item">
                    <strong>Department:</strong> {selectedRegistration.department}
                  </div>
                  <div className="info-item">
                    <strong>Phone:</strong> {selectedRegistration.phone || 'Not provided'}
                  </div>
                </div>
              </div>

              <div className="activity-section">
                <h4>Event Information</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Registered On:</strong> {formatDate(selectedRegistration.createdAt)}
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong>
                    <span className={`status-${selectedRegistration.status}`}>
                      {selectedRegistration.status}
                    </span>
                  </div>
                  {selectedRegistration.additionalInfo && (
                    <div className="info-item">
                      <strong>Additional Info:</strong> {selectedRegistration.additionalInfo}
                    </div>
                  )}
                </div>
              </div>
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