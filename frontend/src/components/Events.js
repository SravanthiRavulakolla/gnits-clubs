import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './Events.css';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [selectedClub, setSelectedClub] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [registering, setRegistering] = useState(null);

  const { user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchEvents();
    
    // Set up interval to refresh events every 30 seconds
    const interval = setInterval(fetchEvents, 30000);
    
    // Listen for focus events to refresh when user returns to tab
    const handleFocus = () => fetchEvents();
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, selectedClub, selectedType, searchTerm]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        setError('Failed to load events');
      }
    } catch (error) {
      setError('Error loading events');
      console.error('Fetch events error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    if (selectedClub !== 'all') {
      filtered = filtered.filter(event => event.clubName === selectedClub);
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter(event => event.eventType === selectedType);
    }

    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by date
    filtered.sort((a, b) => new Date(a.date) - new Date(b.date));

    setFilteredEvents(filtered);
  };

  const handleRegister = async (eventId) => {
    if (user.role !== 'student') return;
    
    if (registering === eventId) return; // Prevent multiple clicks
    
    setRegistering(eventId);
    setError('');

    try {
      const response = await fetch(`${API_BASE_URL}/registrations/events/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok) {
        alert('Successfully registered for the event!');
        // Remove the event from the list or mark as registered
        setFilteredEvents(prev => prev.map(event => 
          event._id === eventId 
            ? { ...event, isRegistered: true }
            : event
        ));
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      alert('Error during registration. Please try again.');
      console.error('Registration error:', error);
    } finally {
      setRegistering(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isEventPast = (dateString) => {
    return new Date(dateString) < new Date();
  };

  const isRegistrationClosed = (event) => {
    if (!event.registrationDeadline) return false;
    return new Date(event.registrationDeadline) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="events-page">
      <div className="events-header">
        <div className="header-content">
          <div>
            <h1>Upcoming Events</h1>
            <p>Discover exciting events from all clubs at GNITS</p>
          </div>
          <button 
            className="refresh-btn" 
            onClick={fetchEvents}
            disabled={loading}
          >
            {loading ? '🔄' : '↻'} Refresh
          </button>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="events-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-group">
          <select
            value={selectedClub}
            onChange={(e) => setSelectedClub(e.target.value)}
          >
            <option value="all">All Clubs</option>
            <option value="CSI">CSI</option>
            <option value="GDSC">GDSC</option>
            <option value="Aptnus Gana">Aptnus Gana</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="workshop">Workshop</option>
            <option value="seminar">Seminar</option>
            <option value="competition">Competition</option>
            <option value="cultural">Cultural</option>
            <option value="technical">Technical</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="events-grid">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <h3>No events found</h3>
            <p>Try adjusting your filters or check back later for new events.</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div key={event._id} className={`event-card ${isEventPast(event.date) ? 'past-event' : ''}`}>
              <div className="event-card-header">
                <div className="club-badge">{event.clubName}</div>
              </div>

              <h3>{event.title}</h3>
              <p className="event-description">{event.description}</p>

              <div className="event-info">
                <div className="info-item">
                  <strong>📅 Date:</strong> {formatDate(event.date)}
                </div>
                <div className="info-item">
                  <strong>⏰ Time:</strong> {event.time}
                </div>
                <div className="info-item">
                  <strong>📍 Venue:</strong> {event.venue}
                </div>
                {event.maxParticipants && (
                  <div className="info-item">
                    <strong>👥 Max Participants:</strong> {event.maxParticipants}
                  </div>
                )}
                {event.registrationDeadline && (
                  <div className="info-item">
                    <strong>⏳ Registration Deadline:</strong> {formatDate(event.registrationDeadline)}
                  </div>
                )}
              </div>

              {event.tags && event.tags.length > 0 && (
                <div className="event-tags">
                  {event.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              )}

              {user.role === 'student' && (
                <div className="event-actions">
                  {isEventPast(event.date) ? (
                    <div className="status-label past-event">Event Completed</div>
                  ) : isRegistrationClosed(event) ? (
                    <div className="status-label closed">Registration Closed</div>
                  ) : event.isRegistered ? (
                    <div className="status-label registered">✅ Registered</div>
                  ) : (
                    <button
                      className="register-btn"
                      onClick={() => handleRegister(event._id)}
                      disabled={registering === event._id}
                    >
                      {registering === event._id ? 'Registering...' : 'Register Now'}
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Events;