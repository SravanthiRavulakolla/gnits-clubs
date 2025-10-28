import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Club.css';

const Club = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [clubData, setClubData] = useState(null);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const [showPostForm, setShowPostForm] = useState(false);
  const [editingEventId, setEditingEventId] = useState(null);
  const [registering, setRegistering] = useState(null);
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
    fetchClubData();
  }, [clubName]);

  const fetchClubData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/clubs/${clubName}`);
      if (response.ok) {
        const data = await response.json();
        setClubData(data.club);
        setUpcomingEvents(data.upcomingEvents || []);
        setPastEvents(data.pastEvents || []);
      }
    } catch (error) {
      console.error('Error fetching club data:', error);
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/events/club/${clubName}`);
      if (response.ok) {
        const data = await response.json();
        const currentDate = new Date();
        const upcoming = data.events?.filter(event => new Date(event.date) >= currentDate) || [];
        const past = data.events?.filter(event => new Date(event.date) < currentDate) || [];
        setUpcomingEvents(upcoming);
        setPastEvents(past);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleEdit = (eventId) => {
    const allEvents = [...upcomingEvents, ...pastEvents];
    const eventToEdit = allEvents.find(event => event._id === eventId);
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
          fetchClubData();
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
        fetchClubData();
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to save event');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event. Please try again.');
    }
  };

  const handleRegister = async (eventId) => {
    if (!user || user.role !== 'student') {
      alert('Only students can register for events');
      return;
    }

    setRegistering(eventId);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/registrations/events/${eventId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({})
      });

      const data = await response.json();

      if (response.ok) {
        alert('Successfully registered for the event!');
        fetchClubData(); // Refresh to show updated registration status
      } else {
        alert(data.message || 'Failed to register for event');
      }
    } catch (error) {
      console.error('Error registering for event:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setRegistering(null);
    }
  };

  const isRegistrationClosed = (event) => {
    if (!event.registrationDeadline) return false;
    return new Date(event.registrationDeadline) < new Date();
  };

  if (!clubData) {
    return (
      <div className="club-page">
        <div className="loading">Loading club information...</div>
      </div>
    );
  }

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

      <div className="club-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab ${activeTab === 'people' ? 'active' : ''}`}
          onClick={() => setActiveTab('people')}
        >
          Popular People
        </button>
        <button 
          className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming Events
        </button>
        <button
          className={`tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Events
        </button>
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

      <div className="club-content">
        {activeTab === 'overview' && (
          <div className="overview-section">
            <h2>About {clubName}</h2>
            <p className="club-description">{clubData.description}</p>
          </div>
        )}

        {activeTab === 'people' && (
          <div className="people-section">
            <h2>Popular People</h2>
            <div className="people-grid">
              {clubData.popularPeople?.map((person, index) => (
                <div key={index} className="person-card">
                  <div className="person-avatar">
                    {person.name.charAt(0)}
                  </div>
                  <h3>{person.name}</h3>
                  <p className="person-position">{person.position}</p>
                  <p className="person-bio">{person.bio}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <div className="events-section">
            <h2>Upcoming Events</h2>
            {upcomingEvents.length === 0 ? (
              <p className="no-events">No upcoming events.</p>
            ) : (
              <div className="events-grid">
                {upcomingEvents.map((event) => (
                  <div key={event._id} className="event-card">
                    {isAdmin && (
                      <div className="event-actions">
                        <button className="edit-btn" onClick={() => handleEdit(event._id)}>Edit</button>
                        <button className="delete-btn" onClick={() => handleDelete(event._id)}>Delete</button>
                      </div>
                    )}
                    <h3>{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    <div className="event-details">
                      <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {event.time}</p>
                      <p><strong>Venue:</strong> {event.venue}</p>
                      {event.maxParticipants && <p><strong>Max Participants:</strong> {event.maxParticipants}</p>}
                      {event.registrationDeadline && <p><strong>Registration Deadline:</strong> {new Date(event.registrationDeadline).toLocaleDateString()}</p>}
                    </div>
                    {user?.role === 'student' && (
                      <div className="student-event-actions">
                        {isRegistrationClosed(event) ? (
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
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="events-section">
            <h2>Past Events</h2>
            {pastEvents.length === 0 ? (
              <p className="no-events">No past events.</p>
            ) : (
              <div className="events-grid">
                {pastEvents.map((event) => (
                  <div key={event._id} className="event-card past-event">
                    <h3>{event.title}</h3>
                    <p className="event-description">{event.description}</p>
                    <div className="event-details">
                      <p><strong>Date:</strong> {new Date(event.date).toLocaleDateString()}</p>
                      <p><strong>Time:</strong> {event.time}</p>
                      <p><strong>Venue:</strong> {event.venue}</p>
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

export default Club;
