import React, { createContext, useContext, useReducer, useEffect } from 'react';

const AuthContext = createContext();

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null
};

// Actions
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_LOADING':
      return {
        ...state,
        loading: true,
        error: null
      };
    case 'AUTH_SUCCESS':
      localStorage.setItem('token', action.payload.token);

      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null
      };
    case 'AUTH_ERROR':
      if (action.payload === 'Invalid token') {
        localStorage.removeItem('token');
      }
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: action.payload === 'Invalid token' ? null : state.token,
        loading: false,
        error: action.payload
      };
    case 'LOGOUT':
      localStorage.removeItem('token');
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        loading: false,
        error: null
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        dispatch({ type: 'AUTH_ERROR', payload: null });
        return;
      }

      dispatch({ type: 'AUTH_LOADING' });

      try {
        const response = await fetch(`${API_BASE_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: data.user,
              token: token
            }
          });
        } else {
          dispatch({ type: 'AUTH_ERROR', payload: 'Invalid token' });
        }
      } catch (error) {
        dispatch({ type: 'AUTH_ERROR', payload: error.message });
      }
    };

    checkAuth();
  }, [API_BASE_URL]);

  // Login function
  const login = async (email, password) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      console.log('Login attempt:', { email, password: '***' });
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();
      console.log('Login response status:', response.status);
      console.log('Login response data:', JSON.stringify(data, null, 2));

      if (response.ok) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: data.user,
            token: data.token
          }
        });
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: data.message });
        return { success: false, error: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: 'AUTH_LOADING' });
    try {
      console.log('Register attempt:', userData);
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });

      const data = await response.json();
      console.log('Register response status:', response.status);
      console.log('Register response data:', JSON.stringify(data, null, 2));

      if (response.ok) {
        dispatch({
          type: 'AUTH_SUCCESS',
          payload: {
            user: data.user,
            token: data.token
          }
        });
        return { success: true };
      } else {
        dispatch({ type: 'AUTH_ERROR', payload: data.message });
        return { success: false, error: data.message, errors: data.errors };
      }
    } catch (error) {
      console.error('Register error:', error);
      dispatch({ type: 'AUTH_ERROR', payload: error.message });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};