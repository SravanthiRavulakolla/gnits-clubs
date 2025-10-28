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

      // Prepare answers in the format expected by backend
      const answers = recruitment.questions?.map(question => ({
        questionText: question.question,
        answer: formData[question._id] || ''
      })) || [];

      console.log('Form data before processing:', formData);
      console.log('User data:', { name: user.name, email: user.email, phone: user.phone });
      
      // Clean up portfolio and resume URLs - remove placeholder values
      let portfolioUrl = formData.portfolio || '';
      if (portfolioUrl === 'https://your-portfolio.com' || portfolioUrl.trim() === '') {
        portfolioUrl = '';
      }
      
      let resumeUrl = formData.resume || '';
      if (resumeUrl === 'https://link-to-your-resume.com' || resumeUrl.trim() === '') {
        resumeUrl = '';
      }
      
      const applicationData = {
        phone: formData.phone || user.phone || '',
        appliedPosition: recruitment.title || recruitment.positions?.[0]?.role || 'Member',
        experience: formData.experience || '',
        skills: formData.skills || '',
        whyJoin: formData.whyJoin || '',
        portfolio: portfolioUrl,
        resume: resumeUrl,
        answers: answers
      };
      
      console.log('Final application data:', applicationData);
      
      // Validate required fields to match backend validation
      const errors = [];
      
      if (!applicationData.appliedPosition || applicationData.appliedPosition.trim() === '') {
        errors.push('Applied position is required');
      }
      if (!applicationData.whyJoin || applicationData.whyJoin.trim() === '') {
        errors.push('Please explain why you want to join this club');
      }
      
      // Check phone validation if provided
      if (applicationData.phone && applicationData.phone.trim() !== '') {
        // Basic phone validation
        const phoneRegex = /^[\d\s\+\-\(\)]{10,}$/;
        if (!phoneRegex.test(applicationData.phone.replace(/\s/g, ''))) {
          errors.push('Please enter a valid phone number');
        }
      }
      
      if (errors.length > 0) {
        const errorMessage = `Please fix the following errors:\n${errors.join('\n')}`;
        setError(errorMessage);
        setSubmitting(false);
        return;
      }

      console.log('=== FRONTEND APPLICATION SUBMISSION ===');
      console.log('Recruitment ID:', recruitment._id);
      console.log('Recruitment Title:', recruitment.title);
      console.log('Club Name:', recruitment.clubName);
      console.log('User:', user.name, user.email);
      console.log('API Base URL:', API_BASE_URL);
      console.log('Token exists:', !!localStorage.getItem('token'));
      console.log('Submitting application data:', applicationData);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }
      
      const url = `${API_BASE_URL}/registrations/recruitments/${recruitment._id}`;
      console.log('Making request to:', url);
      
      let response;
      try {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(applicationData)
        });
        console.log('Response received:', response.status, response.statusText);
      } catch (fetchError) {
        console.error('Fetch request failed:', fetchError);
        throw new Error(`Network request failed: ${fetchError.message}`);
      }

      let data;
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      if (!responseText) {
        throw new Error('Empty response from server');
      }
      
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('Failed to parse response JSON:', parseError);
        console.error('Response text:', responseText);
        throw new Error(`Invalid JSON response from server: ${responseText.substring(0, 100)}`);
      }
      console.log('Parsed response data:', data);

      if (response.ok) {
        console.log('✅ Application submitted successfully');
        alert(`Application submitted successfully to ${recruitment.clubName}!`);
        onComplete();
      } else {
        console.error('❌ Application failed:', response.status, data);
        
        // Log and display detailed validation errors
        if (data.errors && Array.isArray(data.errors)) {
          console.error('Validation errors:', data.errors);
          const errorDetails = data.errors.map(err => `- ${err.msg || err.message || err}`).join('\n');
          const errorMessage = `Validation Failed:\n${errorDetails}`;
          setError(errorMessage);
          
          // Also show in alert for immediate visibility
          alert(`Application failed due to validation errors:\n${errorDetails}`);
        } else {
          const errorMessage = data.message || data.error || `Failed to submit application (${response.status})`;
          setError(errorMessage);
        }
      }
    } catch (error) {
      console.error('❌ Application submission error:', error);
      const errorMessage = error.message || 'Error submitting application. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
      console.log('=== APPLICATION SUBMISSION END ===\n');
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

          {/* Basic Application Fields */}
          <div className="basic-fields">
            <h3>Application Details</h3>
            
            <div className="question-group">
              <label>
                Phone Number <span className="required">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>

            <div className="question-group">
              <label>
                Why do you want to join this club? <span className="required">*</span>
              </label>
              <textarea
                value={formData.whyJoin || ''}
                onChange={(e) => handleInputChange('whyJoin', e.target.value)}
                rows="3"
                placeholder="Tell us why you're interested in joining..."
                required
              />
            </div>

            <div className="question-group">
              <label>Experience (Optional)</label>
              <textarea
                value={formData.experience || ''}
                onChange={(e) => handleInputChange('experience', e.target.value)}
                rows="2"
                placeholder="Any relevant experience..."
              />
            </div>

            <div className="question-group">
              <label>Skills (Optional)</label>
              <input
                type="text"
                value={formData.skills || ''}
                onChange={(e) => handleInputChange('skills', e.target.value)}
                placeholder="List your relevant skills..."
              />
            </div>

            <div className="question-group">
              <label>Portfolio URL (Optional)</label>
              <input
                type="url"
                value={formData.portfolio || ''}
                onChange={(e) => handleInputChange('portfolio', e.target.value)}
                placeholder="https://your-portfolio.com"
              />
            </div>

            <div className="question-group">
              <label>Resume URL (Optional)</label>
              <input
                type="url"
                value={formData.resume || ''}
                onChange={(e) => handleInputChange('resume', e.target.value)}
                placeholder="https://link-to-your-resume.com"
              />
            </div>
          </div>

          {recruitment.questions && recruitment.questions.length > 0 && (
            <div className="custom-questions">
              <h3>Additional Questions</h3>
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
              className="test-btn"
              onClick={async () => {
                console.log('🧪 TESTING API CONNECTION...');
                try {
                  console.log('Testing API endpoint:', `${API_BASE_URL}/api`);
                  const testResponse = await fetch(`${API_BASE_URL}/api`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                  });
                  console.log('Test response status:', testResponse.status);
                  const testData = await testResponse.json();
                  console.log('✅ API Test successful:', testData);
                  alert('API connection test successful!');
                } catch (err) {
                  console.error('❌ API Test failed:', err);
                  alert(`API test failed: ${err.message}`);
                }
              }}
              disabled={submitting}
              style={{backgroundColor: '#ff9500', marginLeft: '10px'}}
            >
              Test API
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