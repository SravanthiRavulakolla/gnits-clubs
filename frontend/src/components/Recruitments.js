import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import RecruitmentApplication from './RecruitmentApplication';
import './Recruitments.css';

const Recruitments = () => {
  const [recruitments, setRecruitments] = useState([]);
  const [filteredRecruitments, setFilteredRecruitments] = useState([]);
  const [selectedClub, setSelectedClub] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showApplication, setShowApplication] = useState(false);
  const [selectedRecruitment, setSelectedRecruitment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchRecruitments();
  }, []);

  useEffect(() => {
    filterRecruitments();
  }, [recruitments, selectedClub, searchTerm]);

  const fetchRecruitments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recruitments`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRecruitments(data.recruitments || []);
      } else {
        setError('Failed to load recruitments');
      }
    } catch (error) {
      setError('Error loading recruitments');
      console.error('Fetch recruitments error:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRecruitments = () => {
    let filtered = recruitments;

    if (selectedClub !== 'all') {
      filtered = filtered.filter(recruitment => recruitment.clubName === selectedClub);
    }

    if (searchTerm) {
      filtered = filtered.filter(recruitment =>
        recruitment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recruitment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recruitment.clubName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by deadline (active first, then by deadline date)
    filtered.sort((a, b) => {
      const aActive = !a.deadline || new Date(a.deadline) > new Date();
      const bActive = !b.deadline || new Date(b.deadline) > new Date();
      
      if (aActive && !bActive) return -1;
      if (!aActive && bActive) return 1;
      
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    setFilteredRecruitments(filtered);
  };

  const handleApply = (recruitment) => {
    setSelectedRecruitment(recruitment);
    setShowApplication(true);
  };

  const handleApplicationComplete = () => {
    setShowApplication(false);
    setSelectedRecruitment(null);
    // Refresh recruitments to update application status
    fetchRecruitments();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isDeadlinePassed = (deadline) => {
    if (!deadline) return false;
    return new Date(deadline) < new Date();
  };

  if (loading) {
    return <div className="loading">Loading recruitments...</div>;
  }

  return (
    <div className="recruitments-page">
      <div className="recruitments-header">
        <h1>Club Recruitments</h1>
        <p>Join your favorite clubs and contribute to the GNITS community</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="recruitments-filters">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search recruitments..."
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
      </div>

      <div className="recruitments-grid">
        {filteredRecruitments.length === 0 ? (
          <div className="empty-state">
            <h3>No recruitments found</h3>
            <p>Try adjusting your filters or check back later for new opportunities.</p>
          </div>
        ) : (
          filteredRecruitments.map(recruitment => (
            <div key={recruitment._id} className={`recruitment-card ${isDeadlinePassed(recruitment.deadline) ? 'closed' : ''}`}>
              <div className="recruitment-card-header">
                <div className="club-badge">{recruitment.clubName}</div>
                <div className="status-badge">
                  {isDeadlinePassed(recruitment.deadline) ? (
                    <span className="status-closed">Closed</span>
                  ) : (
                    <span className="status-open">Open</span>
                  )}
                </div>
              </div>

              <h3>{recruitment.title}</h3>
              <p className="recruitment-description">{recruitment.description}</p>

              <div className="recruitment-info">
                {recruitment.requirements && (
                  <div className="info-item">
                    <strong>📋 Requirements:</strong> {recruitment.requirements}
                  </div>
                )}
                {recruitment.responsibilities && (
                  <div className="info-item">
                    <strong>💼 Responsibilities:</strong> {recruitment.responsibilities}
                  </div>
                )}
                {recruitment.deadline && (
                  <div className="info-item">
                    <strong>⏳ Application Deadline:</strong> {formatDate(recruitment.deadline)}
                  </div>
                )}
                {recruitment.questions && recruitment.questions.length > 0 && (
                  <div className="info-item">
                    <strong>❓ Custom Questions:</strong> {recruitment.questions.length} questions to answer
                  </div>
                )}
              </div>

              {recruitment.questions && recruitment.questions.length > 0 && (
                <div className="questions-preview">
                  <strong>Sample Questions:</strong>
                  <ul>
                    {recruitment.questions.slice(0, 2).map((q, index) => (
                      <li key={index}>{q.question}</li>
                    ))}
                    {recruitment.questions.length > 2 && <li>... and {recruitment.questions.length - 2} more</li>}
                  </ul>
                </div>
              )}

              {user.role === 'student' && (
                <div className="recruitment-actions">
                  {isDeadlinePassed(recruitment.deadline) ? (
                    <div className="status-label closed">Applications Closed</div>
                  ) : recruitment.hasApplied ? (
                    <div className="status-label applied">✅ Applied</div>
                  ) : (
                    <button
                      className="apply-btn"
                      onClick={() => handleApply(recruitment)}
                    >
                      Apply Now
                    </button>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {showApplication && selectedRecruitment && (
        <RecruitmentApplication
          recruitment={selectedRecruitment}
          onClose={() => setShowApplication(false)}
          onComplete={handleApplicationComplete}
        />
      )}
    </div>
  );
};

export default Recruitments;