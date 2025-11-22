import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { authService, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authService.login(formData);
      const { token, user } = response.data;

      login(token, user);
      toast.success('Login successful!');

      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        // Check if student has selected exam preference
        const selectedExam = localStorage.getItem('selectedExam');
        
        // Check if student has active subscription
        try {
          const subResponse = await axios.get(`${API_URL}/payment/subscription-status`, {
            headers: { Authorization: `Bearer ${token}` }
          });

          const activeSubscriptions = subResponse.data.subscriptions?.filter(
            sub => sub.isActive && new Date(sub.expiryDate) > new Date()
          );

          if (activeSubscriptions && activeSubscriptions.length > 0) {
            // Has subscription - go to dashboard
            navigate('/student/dashboard');
          } else {
            // No subscription - check if exam is already selected
            if (selectedExam) {
              // Exam already selected, go to test patterns page
              navigate('/student/exam-patterns');
            } else {
              // No exam selected, go to exam selection
              navigate('/student/exam-selection');
            }
          }
        } catch (error) {
          // If subscription check fails, check for exam selection
          console.error('Subscription check error:', error);
          if (selectedExam) {
            navigate('/student/exam-patterns');
          } else {
            navigate('/student/exam-selection');
          }
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
