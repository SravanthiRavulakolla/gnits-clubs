import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './EventManagement.css';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    maxParticipants: '',
    registrationDeadline: '',
    eventType: 'other',
    tags: ''
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/club/${user.clubName}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: '',
      time: '',
      venue: '',
      maxParticipants: '',
      registrationDeadline: '',
      eventType: 'other',
      tags: ''
    });
    setEditingEvent(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const eventData = {
        ...formData,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : []
      };

      const url = editingEvent 
        ? `${API_BASE_URL}/events/${editingEvent._id}`
        : `${API_BASE_URL}/events`;

      const method = editingEvent ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(eventData)
      });

      const data = await response.json();

      if (response.ok) {
        await fetchEvents();
        resetForm();
      } else {
        setError(data.message || 'Failed to save event');
      }
    } catch (error) {
      setError('Error saving event');
      console.error('Save event error:', error);
    }
  };

  const handleEdit = (event) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date ? new Date(event.date).toISOString().split('T')[0] : '',
      time: event.time,
      venue: event.venue,
      maxParticipants: event.maxParticipants || '',
      registrationDeadline: event.registrationDeadline 
        ? new Date(event.registrationDeadline).toISOString().split('T')[0] 
        : '',
      eventType: event.eventType || 'other',
      tags: event.tags ? event.tags.join(', ') : ''
    });
    setShowForm(true);
  };

  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchEvents();
      } else {
        setError('Failed to delete event');
      }
    } catch (error) {
      setError('Error deleting event');
      console.error('Delete event error:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className="loading">Loading events...</div>;
  }

  return (
    <div className="event-management">
      <div className="management-header">
        <h2>Event Management</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          Create New Event
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-overlay">
          <div className="event-form">
            <div className="form-header">
              <h3>{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <button type="button" className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Event Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Event Type</label>
                  <select
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                  >
                    <option value="workshop">Workshop</option>
                    <option value="seminar">Seminar</option>
                    <option value="competition">Competition</option>
                    <option value="cultural">Cultural</option>
                    <option value="technical">Technical</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Date *</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Time *</label>
                  <input
                    type="time"
                    name="time"
                    value={formData.time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Venue *</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Max Participants</label>
                  <input
                    type="number"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    min="1"
                  />
                </div>
                
                <div className="form-group">
                  <label>Registration Deadline</label>
                  <input
                    type="date"
                    name="registrationDeadline"
                    value={formData.registrationDeadline}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="e.g. AI, Machine Learning, Workshop"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="events-list">
        {events.length === 0 ? (
          <div className="empty-state">
            <p>No events created yet. Create your first event to get started!</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event._id} className="event-card">
              <div className="event-header">
                <h3>{event.title}</h3>
              </div>
              
              <p className="event-description">{event.description}</p>
              
              <div className="event-details">
                <div className="detail-item">
                  <strong>Date:</strong> {formatDate(event.date)} at {event.time}
                </div>
                <div className="detail-item">
                  <strong>Venue:</strong> {event.venue}
                </div>
                {event.maxParticipants && (
                  <div className="detail-item">
                    <strong>Max Participants:</strong> {event.maxParticipants}
                  </div>
                )}
                {event.registrationDeadline && (
                  <div className="detail-item">
                    <strong>Registration Deadline:</strong> {formatDate(event.registrationDeadline)}
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

              <div className="event-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(event)}
                >
                  Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(event._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EventManagement;