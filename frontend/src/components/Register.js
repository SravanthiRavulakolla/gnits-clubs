import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Register = ({ onSwitchToLogin }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    rollNumber: '',
    department: '',
    clubName: ''
  });
  const [error, setError] = useState('');
  const [errors, setErrors] = useState([]);

  const { register, loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    // Clear role-specific fields when role changes
    if (name === 'role') {
      if (value === 'student') {
        setFormData(prev => ({ ...prev, clubName: '', [name]: value }));
      } else if (value === 'club_admin') {
        setFormData(prev => ({ ...prev, rollNumber: '', department: '', [name]: value }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setErrors([]);

    // Basic validation
    if (!formData.name || !formData.email || !formData.password || !formData.role) {
      setError('Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Role-specific validation
    if (formData.role === 'student' && (!formData.rollNumber || !formData.department)) {
      setError('Roll number and department are required for students');
      return;
    }

    if (formData.role === 'club_admin' && !formData.clubName) {
      setError('Club name is required for club admins');
      return;
    }

    // Prepare data for submission
    const submitData = {
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: formData.role
    };

    if (formData.role === 'student') {
      submitData.rollNumber = formData.rollNumber;
      submitData.department = formData.department;
    } else if (formData.role === 'club_admin') {
      submitData.clubName = formData.clubName;
    }

    const result = await register(submitData);
    if (!result.success) {
      setError(result.error);
      if (result.errors) {
        setErrors(result.errors);
      }
    } else {
      navigate('/');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card register-card">
        <div className="auth-header">
          <h2>Join GNITS Clubs</h2>
          <p>Create your account to get started</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {errors.length > 0 && (
          <div className="error-message">
            <ul>
              {errors.map((err, index) => (
                <li key={index}>{err.msg}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">I am a</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select your role</option>
              <option value="student">Student</option>
              <option value="club_admin">Club Admin</option>
            </select>
          </div>

          {/* Student specific fields */}
          {formData.role === 'student' && (
            <>
              <div className="form-group">
                <label htmlFor="rollNumber">Roll Number</label>
                <input
                  type="text"
                  id="rollNumber"
                  name="rollNumber"
                  value={formData.rollNumber}
                  onChange={handleChange}
                  placeholder="Enter your roll number"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="department">Department</label>
                <input
                  type="text"
                  id="department"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Enter your department"
                  required
                />
              </div>
            </>
          )}

          {/* Club admin specific fields */}
          {formData.role === 'club_admin' && (
            <div className="form-group">
              <label htmlFor="clubName">Club</label>
              <select
                id="clubName"
                name="clubName"
                value={formData.clubName}
                onChange={handleChange}
                required
              >
                <option value="">Select your club</option>
                <option value="CSI">CSI</option>
                <option value="GDSC">GDSC</option>
                <option value="Aptnus Gana">Aptnus Gana</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 6 characters)"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm your password"
              required
            />
          </div>

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <button 
              type="button"
              className="switch-auth-button"
              onClick={(e) => {
                e.preventDefault();
                console.log('Sign In button clicked');
                onSwitchToLogin(e);
              }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;