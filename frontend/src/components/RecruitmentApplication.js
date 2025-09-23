import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './RecruitmentApplication.css';

const RecruitmentApplication = ({ recruitment, onClose, onComplete }) => {
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Clear any existing errors when component mounts
  useEffect(() => {
    setError('');
  }, []);

  const handleInputChange = (questionId, value) => {
    // Clear error when user starts typing
    if (error) setError('');
    
    setFormData(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Validate required questions
      const missingRequired = recruitment.questions?.filter(q => 
        q.required && (!formData[q._id] || formData[q._id].toString().trim() === '')
      );

      if (missingRequired && missingRequired.length > 0) {
        setError(`Please answer all required questions: ${missingRequired.map(q => q.question).join(', ')}`);
        setSubmitting(false);
        return;
      }

      const applicationData = {
        recruitmentId: recruitment._id,
        responses: recruitment.questions?.map(question => ({
          questionId: question._id,
          question: question.question,
          answer: formData[question._id] || ''
        })) || []
      };

      const response = await fetch(`${API_BASE_URL}/registrations/recruitments/${recruitment._id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(applicationData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Application submitted successfully!');
        onComplete();
      } else {
        setError(data.message || 'Failed to submit application');
      }
    } catch (error) {
      setError('Error submitting application. Please try again.');
      console.error('Application submission error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question) => {
    const questionId = question._id || question.question; // Fallback for ID
    
    switch (question.type) {
      case 'textarea':
        return (
          <textarea
            value={formData[questionId] || ''}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            rows="4"
            placeholder="Enter your answer..."
            required={question.required}
          />
        );
      case 'email':
        return (
          <input
            type="email"
            value={formData[questionId] || ''}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            placeholder="Enter your email..."
            required={question.required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={formData[questionId] || ''}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            placeholder="Enter a number..."
            required={question.required}
          />
        );
      default: // text
        return (
          <input
            type="text"
            value={formData[questionId] || ''}
            onChange={(e) => handleInputChange(questionId, e.target.value)}
            placeholder="Enter your answer..."
            required={question.required}
          />
        );
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="application-overlay">
      <div className="application-form">
        <div className="application-header">
          <h2>Apply to {recruitment.title}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="recruitment-summary">
          <div className="summary-item">
            <strong>Club:</strong> {recruitment.clubName}
          </div>
          {recruitment.deadline && (
            <div className="summary-item">
              <strong>Deadline:</strong> {formatDate(recruitment.deadline)}
            </div>
          )}
          <div className="summary-item">
            <strong>Description:</strong> {recruitment.description}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="personal-info">
            <h3>Personal Information</h3>
            <div className="info-display">
              <div className="info-item">
                <strong>Name:</strong> {user.name || user.username}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {user.email}
              </div>
              <div className="info-item">
                <strong>Role:</strong> {user.role}
              </div>
            </div>
          </div>

          {recruitment.questions && recruitment.questions.length > 0 && (
            <div className="custom-questions">
              <h3>Application Questions</h3>
              {recruitment.questions.map((question, index) => (
                <div key={question._id || index} className="question-group">
                  <label>
                    {question.question}
                    {question.required && <span className="required">*</span>}
                  </label>
                  {renderQuestion(question)}
                </div>
              ))}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
            <button
              type="button"
              className="cancel-btn"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecruitmentApplication;