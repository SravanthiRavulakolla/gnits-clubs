import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './RecruitmentManagement.css';

const RecruitmentManagement = () => {
  const [recruitments, setRecruitments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRecruitment, setEditingRecruitment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    responsibilities: '',
    deadline: '',
    questions: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    fetchRecruitments();
  }, []);

  const fetchRecruitments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/recruitments/club/${user.clubName}`, {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleQuestionChange = (index, field, value) => {
    const updatedQuestions = [...formData.questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setFormData(prev => ({ ...prev, questions: updatedQuestions }));
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [...prev.questions, { question: '', type: 'text', required: true }]
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      requirements: '',
      responsibilities: '',
      deadline: '',
      questions: []
    });
    setEditingRecruitment(null);
    setShowForm(false);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const url = editingRecruitment 
        ? `${API_BASE_URL}/recruitments/${editingRecruitment._id}`
        : `${API_BASE_URL}/recruitments`;

      const method = editingRecruitment ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        await fetchRecruitments();
        resetForm();
      } else {
        setError(data.message || 'Failed to save recruitment');
      }
    } catch (error) {
      setError('Error saving recruitment');
      console.error('Save recruitment error:', error);
    }
  };

  const handleEdit = (recruitment) => {
    setEditingRecruitment(recruitment);
    setFormData({
      title: recruitment.title,
      description: recruitment.description,
      requirements: recruitment.requirements || '',
      responsibilities: recruitment.responsibilities || '',
      deadline: recruitment.deadline ? new Date(recruitment.deadline).toISOString().split('T')[0] : '',
      questions: recruitment.questions || []
    });
    setShowForm(true);
  };

  const handleDelete = async (recruitmentId) => {
    if (!window.confirm('Are you sure you want to delete this recruitment?')) return;

    try {
      const response = await fetch(`${API_BASE_URL}/recruitments/${recruitmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await fetchRecruitments();
      } else {
        setError('Failed to delete recruitment');
      }
    } catch (error) {
      setError('Error deleting recruitment');
      console.error('Delete recruitment error:', error);
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
    return <div className="loading">Loading recruitments...</div>;
  }

  return (
    <div className="recruitment-management">
      <div className="management-header">
        <h2>Recruitment Management</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
        >
          Post New Recruitment
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {showForm && (
        <div className="form-overlay">
          <div className="recruitment-form">
            <div className="form-header">
              <h3>{editingRecruitment ? 'Edit Recruitment' : 'Post New Recruitment'}</h3>
              <button type="button" className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Recruitment Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Web Development Team Member"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  required
                  placeholder="Describe the role and what you're looking for..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Requirements</label>
                  <textarea
                    name="requirements"
                    value={formData.requirements}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Skills, experience, or qualifications needed..."
                  />
                </div>
                
                <div className="form-group">
                  <label>Responsibilities</label>
                  <textarea
                    name="responsibilities"
                    value={formData.responsibilities}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="What the person will be doing..."
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Application Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleInputChange}
                />
              </div>

              <div className="questions-section">
                <div className="questions-header">
                  <label>Custom Questions</label>
                  <button type="button" className="add-question-btn" onClick={addQuestion}>
                    + Add Question
                  </button>
                </div>
                
                {formData.questions.map((question, index) => (
                  <div key={index} className="question-item">
                    <div className="question-controls">
                      <input
                        type="text"
                        placeholder="Enter your question"
                        value={question.question}
                        onChange={(e) => handleQuestionChange(index, 'question', e.target.value)}
                        required
                      />
                      <select
                        value={question.type}
                        onChange={(e) => handleQuestionChange(index, 'type', e.target.value)}
                      >
                        <option value="text">Text</option>
                        <option value="textarea">Long Text</option>
                        <option value="email">Email</option>
                        <option value="number">Number</option>
                      </select>
                      <label>
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) => handleQuestionChange(index, 'required', e.target.checked)}
                        />
                        Required
                      </label>
                      <button type="button" className="remove-question-btn" onClick={() => removeQuestion(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  {editingRecruitment ? 'Update Recruitment' : 'Post Recruitment'}
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="recruitments-list">
        {recruitments.length === 0 ? (
          <div className="empty-state">
            <p>No recruitments posted yet. Post your first recruitment to get started!</p>
          </div>
        ) : (
          recruitments.map(recruitment => (
            <div key={recruitment._id} className="recruitment-card">
              <div className="recruitment-header">
                <h3>{recruitment.title}</h3>
                <div className="recruitment-status">
                  {recruitment.deadline && new Date(recruitment.deadline) > new Date() ? (
                    <span className="status-open">Open</span>
                  ) : (
                    <span className="status-closed">Closed</span>
                  )}
                </div>
              </div>
              
              <p className="recruitment-description">{recruitment.description}</p>
              
              <div className="recruitment-details">
                {recruitment.requirements && (
                  <div className="detail-item">
                    <strong>Requirements:</strong> {recruitment.requirements}
                  </div>
                )}
                {recruitment.responsibilities && (
                  <div className="detail-item">
                    <strong>Responsibilities:</strong> {recruitment.responsibilities}
                  </div>
                )}
                {recruitment.deadline && (
                  <div className="detail-item">
                    <strong>Application Deadline:</strong> {formatDate(recruitment.deadline)}
                  </div>
                )}
                <div className="detail-item">
                  <strong>Applications Received:</strong> {recruitment.applicationsCount || 0}
                </div>
              </div>

              {recruitment.questions && recruitment.questions.length > 0 && (
                <div className="questions-preview">
                  <strong>Custom Questions ({recruitment.questions.length}):</strong>
                  <ul>
                    {recruitment.questions.slice(0, 3).map((q, index) => (
                      <li key={index}>{q.question}</li>
                    ))}
                    {recruitment.questions.length > 3 && <li>... and {recruitment.questions.length - 3} more</li>}
                  </ul>
                </div>
              )}

              <div className="recruitment-actions">
                <button 
                  className="btn-edit"
                  onClick={() => handleEdit(recruitment)}
                >
                  Edit
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDelete(recruitment._id)}
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

export default RecruitmentManagement;