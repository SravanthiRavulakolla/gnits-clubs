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
      setError('');
      
      console.log(`Fetching registrations for club: ${user.clubName}`);
      
      // First get all recruitments for this club
      const recruitmentsResponse = await fetch(`${API_BASE_URL}/recruitments/club/${user.clubName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      let allApplications = [];
      
      if (recruitmentsResponse.ok) {
        const recruitmentsData = await recruitmentsResponse.json();
        const recruitments = recruitmentsData.recruitments || [];
        
        console.log(`Found ${recruitments.length} recruitments for ${user.clubName}:`, recruitments.map(r => ({id: r._id, title: r.title})));
        
        // For each recruitment, fetch its applications
        for (const recruitment of recruitments) {
          try {
            console.log(`Fetching applications for recruitment: ${recruitment.title} (${recruitment._id})`);
            const appsResponse = await fetch(`${API_BASE_URL}/registrations/recruitments/${recruitment._id}/applications`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            });
            
            if (appsResponse.ok) {
              const appsData = await appsResponse.json();
              const applications = (appsData.applications || []).map(app => ({
                ...app,
                recruitmentTitle: recruitment.title,
                recruitmentDeadline: recruitment.deadline
              }));
              console.log(`Found ${applications.length} applications for ${recruitment.title}`);
              allApplications = [...allApplications, ...applications];
            } else {
              const errorData = await appsResponse.json();
              console.warn(`Failed to fetch applications for ${recruitment.title}:`, errorData);
            }
          } catch (error) {
            console.error(`Error fetching applications for recruitment ${recruitment._id}:`, error);
          }
        }
      } else {
        const errorData = await recruitmentsResponse.json();
        console.error('Failed to fetch recruitments:', errorData);
        setError(`Failed to fetch recruitments: ${errorData.message || 'Unknown error'}`);
      }
      
      console.log(`Total applications found: ${allApplications.length}`);
      setRecruitmentApplications(allApplications);
      
      // Fetch event registrations
      try {
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
        }
      } catch (error) {
        console.error('Error fetching event registrations:', error);
        setEventRegistrations([]);
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

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`${API_BASE_URL}/registrations/recruitments/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        alert('Application status updated successfully!');
        // Update the selected registration status
        setSelectedRegistration(prev => ({ ...prev, status: newStatus }));
        // Refresh the applications list
        fetchRegistrations();
      } else {
        const data = await response.json();
        alert(data.message || 'Failed to update application status');
      }
    } catch (error) {
      alert('Error updating application status');
      console.error('Update status error:', error);
    }
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

  const groupedRecruitmentApplications = recruitmentApplications.reduce((acc, app) => {
    const recruitmentTitle = app.recruitmentTitle || app.recruitment?.title || 'Unknown Recruitment';
    if (!acc[recruitmentTitle]) {
      acc[recruitmentTitle] = {
        recruitment: app.recruitment,
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
      )}

      {activeTab === 'recruitments' && (
        <div className="recruitments-tab">
          {Object.keys(groupedRecruitmentApplications).length === 0 ? (
            <div className="empty-state">
              <h3>No Recruitment Applications</h3>
              <p>No students have applied for your recruitment posts yet.</p>
              <div className="empty-state-help">
                <p><strong>To get applications:</strong></p>
                <ul>
                  <li>Make sure you have active recruitment posts</li>
                  <li>Check that your recruitments haven't expired</li>
                  <li>Share your recruitment links with students</li>
                </ul>
                <button 
                  className="feature-button" 
                  onClick={() => window.location.href = '/manage-recruitments'}
                >
                  Manage Recruitments
                </button>
              </div>
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
                          <h4>{application.student?.name || application.studentName}</h4>
                          <p className="student-email">{application.student?.email || application.email}</p>
                          <p className="student-details">
                            {application.rollNumber} | {application.department}
                          </p>
                        </div>
                        
                        <div className="application-details">
                          <div className="detail-item">
                            <strong>Applied:</strong> {formatDate(application.createdAt)}
                          </div>
                          <div className="detail-item">
                            <strong>Position:</strong> {application.appliedPosition}
                          </div>
                          <div className="detail-item">
                            <strong>Status:</strong> 
                            <span className={`status-${application.status}`}>
                              {application.status.replace('_', ' ')}
                            </span>
                          </div>
                          <div className="detail-item">
                            <strong>Questions Answered:</strong> {application.answers?.length || 0}
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
                <h4>
                  {activeTab === 'events' ? 'Event Information' : 'Application Information'}
                </h4>
                <div className="info-grid">
                  <div className="info-item">
                    <strong>Position Applied:</strong> {selectedRegistration.appliedPosition}
                  </div>
                  <div className="info-item">
                    <strong>Applied On:</strong> {formatDate(selectedRegistration.createdAt)}
                  </div>
                  <div className="info-item">
                    <strong>Status:</strong> 
                    <span className={`status-${selectedRegistration.status}`}>
                      {selectedRegistration.status.replace('_', ' ')}
                    </span>
                  </div>
                  {selectedRegistration.experience && (
                    <div className="info-item">
                      <strong>Experience:</strong> {selectedRegistration.experience}
                    </div>
                  )}
                  {selectedRegistration.skills && (
                    <div className="info-item">
                      <strong>Skills:</strong> {selectedRegistration.skills}
                    </div>
                  )}
                  <div className="info-item">
                    <strong>Why Join:</strong> {selectedRegistration.whyJoin}
                  </div>
                  {selectedRegistration.portfolio && (
                    <div className="info-item">
                      <strong>Portfolio:</strong> 
                      <a href={selectedRegistration.portfolio} target="_blank" rel="noopener noreferrer">
                        View Portfolio
                      </a>
                    </div>
                  )}
                  {selectedRegistration.resume && (
                    <div className="info-item">
                      <strong>Resume:</strong> 
                      <a href={selectedRegistration.resume} target="_blank" rel="noopener noreferrer">
                        View Resume
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {activeTab === 'recruitments' && selectedRegistration.answers && selectedRegistration.answers.length > 0 && (
                <div className="responses-section">
                  <h4>Additional Questions & Answers</h4>
                  <div className="responses-list">
                    {selectedRegistration.answers.map((response, index) => (
                      <div key={index} className="response-item">
                        <div className="question">
                          <strong>Q:</strong> {response.questionText}
                        </div>
                        <div className="answer">
                          <strong>A:</strong> {response.answer || 'No response'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {activeTab === 'recruitments' && (
                <div className="status-actions">
                  <h4>Update Application Status</h4>
                  <div className="status-buttons">
                    <button 
                      className="status-btn under-review"
                      onClick={() => updateApplicationStatus(selectedRegistration._id, 'under_review')}
                    >
                      Under Review
                    </button>
                    <button 
                      className="status-btn shortlisted"
                      onClick={() => updateApplicationStatus(selectedRegistration._id, 'shortlisted')}
                    >
                      Shortlist
                    </button>
                    <button 
                      className="status-btn selected"
                      onClick={() => updateApplicationStatus(selectedRegistration._id, 'selected')}
                    >
                      Select
                    </button>
                    <button 
                      className="status-btn rejected"
                      onClick={() => updateApplicationStatus(selectedRegistration._id, 'rejected')}
                    >
                      Reject
                    </button>
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