import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Auth.css';

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login, register, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
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

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === 'role') {
      if (value === 'student') {
        setFormData(prev => ({ ...prev, clubName: '' }));
      } else if (value === 'club_admin') {
        setFormData(prev => ({ ...prev, rollNumber: '', department: '' }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      if (!formData.email || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
      const result = await login(formData.email, formData.password);
      if (!result.success) {
        setError(result.error || 'Failed to sign in');
      }
    } else {
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
      if (formData.role === 'student' && (!formData.rollNumber || !formData.department)) {
        setError('Roll number and department are required for students');
        return;
      }
      if (formData.role === 'club_admin' && !formData.clubName) {
        setError('Club name is required for club admins');
        return;
      }

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
      }
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: '',
      rollNumber: '',
      department: '',
      clubName: ''
    });
  };

  return (
    <div className="auth-container">
      <div className={`auth-card ${!isLogin ? 'register-card' : ''}`}>
        <div className="auth-header">
          <h2>{isLogin ? 'Welcome Back!' : 'Join GNITS Clubs'}</h2>
          <p>{isLogin ? 'Sign in to your GNITS Clubs account' : 'Create your account to get started'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
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
          )}

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

          {!isLogin && (
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
          )}

          {!isLogin && formData.role === 'student' && (
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

          {!isLogin && formData.role === 'club_admin' && (
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
              placeholder={isLogin ? "Enter your password" : "Create a password (min. 6 characters)"}
              required
            />
          </div>

          {!isLogin && (
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
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button type="button" className="switch-auth-button" onClick={switchMode}>
              {isLogin ? 'Create Account' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;