import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Club.css';

const Club = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    venue: '',
    eventType: 'other',
    maxParticipants: '',
    registrationDeadline: ''
  });

  const getClubName = (id) => {
    const clubs = {
      'csi': 'CSI',
      'gdsc': 'GDSC',
      'aptnus-gana': 'Aptnus Gana'
    };
    return clubs[id] || 'Unknown Club';
  };

  const clubName = getClubName(clubId);
  const isAdmin = user?.role === 'club_admin' && user?.clubName === clubName;

  useEffect(() => {
    fetchEvents();
  }, [clubName]);

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/club/${clubName}`);
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (eventId) => {
    const eventToEdit = events.find(event => event._id === eventId);
    if (eventToEdit) {
      setEditingEventId(eventId);
      setFormData({
        title: eventToEdit.title,
        description: eventToEdit.description,
        date: eventToEdit.date.split('T')[0],
        time: eventToEdit.time,
        venue: eventToEdit.venue,
        eventType: eventToEdit.eventType || 'other',
        maxParticipants: eventToEdit.maxParticipants || '',
        registrationDeadline: eventToEdit.registrationDeadline ? eventToEdit.registrationDeadline.split('T')[0] : ''
      });
      setShowPostForm(true);
    }
  };

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/events/${eventId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setEvents(events.filter(event => event._id !== eventId));
        } else {
          alert('Failed to delete event. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting event:', error);
        alert('Error deleting event. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const method = editingEventId ? 'PUT' : 'POST';
      const url = editingEventId 
        ? `${API_BASE_URL}/events/${editingEventId}`
        : `${API_BASE_URL}/events`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : null,
          clubName
        })
      });

      if (response.ok) {
        setFormData({ title: '', description: '', date: '', time: '', venue: '', eventType: 'other', maxParticipants: '', registrationDeadline: '' });
        setShowPostForm(false);
        setEditingEventId(null);
        fetchEvents();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  return (
    <div className="club-page">
      <div className="club-header">
        <button className="back-btn" onClick={() => navigate('/')}> Back</button>
        <h1>{clubName}</h1>
        {isAdmin && (
          <button className="post-event-btn" onClick={() => {
            setEditingEventId(null);
            setFormData({ title: '', description: '', date: '', time: '', venue: '', eventType: 'other', maxParticipants: '', registrationDeadline: '' });
            setShowPostForm(true);
          }}>
            Post Event
          </button>
        )}
      </div>

      {showPostForm && (
        <div className="modal-overlay">
          <div className="post-event-form">
            <div className="form-header">
              <h2>{editingEventId ? 'Edit Event' : 'Post New Event'}</h2>
              <button type="button" className="close-btn" onClick={() => {
                setShowPostForm(false);
                setEditingEventId(null);
                setFormData({ title: '', description: '', date: '', time: '', venue: '', eventType: 'other', maxParticipants: '', registrationDeadline: '' });
              }}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="title"
                placeholder="Event Title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
              <textarea
                name="description"
                placeholder="Event Description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
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
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                required
              />
              <input
                type="text"
                name="venue"
                placeholder="Venue"
                value={formData.venue}
                onChange={handleInputChange}
                required
              />
              <input
                type="number"
                name="maxParticipants"
                placeholder="Max Participants (optional)"
                value={formData.maxParticipants}
                onChange={handleInputChange}
                min="1"
              />
              <input
                type="date"
                name="registrationDeadline"
                placeholder="Registration Deadline (optional)"
                value={formData.registrationDeadline}
                onChange={handleInputChange}
              />
              <div className="form-buttons">
                <button type="submit">
                  {editingEventId ? 'Save Changes' : 'Post Event'}
                </button>
                <button type="button" onClick={() => {
                  setShowPostForm(false);
                  setEditingEventId(null);
                  setFormData({ title: '', description: '', date: '', time: '', venue: '', eventType: 'other', maxParticipants: '', registrationDeadline: '' });
                }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="events-section">
        <h2>Events</h2>
        {events.length === 0 ? (
          <p className="no-events">No events posted yet.</p>
        ) : (
          <div className="events-grid">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                {isAdmin && (
                  <div className="event-actions">
                    <button className="edit-btn" onClick={() => handleEdit(event._id)}>
                      Edit
                    </button>
                    <button className="delete-btn" onClick={() => handleDelete(event._id)}>
                      Delete
                    </button>
                  </div>
                )}
                <h3>{event.title}</h3>
                <p className="event-description">{event.description}</p>
                <div className="event-details">
                  <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> {event.time}</p>
                  <p><strong>Venue:</strong> {event.venue}</p>
                  {event.maxParticipants && (
                    <p><strong>Max Participants:</strong> {event.maxParticipants}</p>
                  )}
                  {event.registrationDeadline && (
                    <p><strong>Registration Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Club;
