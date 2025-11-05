import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';
import api from '../../services/api';
import './Dashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await adminService.getDashboard();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateDemoTest = async () => {
    if (!window.confirm('Are you sure you want to regenerate the demo test? This will replace all existing demo questions with new ones.')) {
      return;
    }

    try {
      setRegenerating(true);
      const response = await api.post('/tests/admin/regenerate-demo');
      toast.success(`Demo test regenerated successfully! Total: ${response.data.totalQuestions} questions`);
    } catch (error) {
      console.error('Error regenerating demo test:', error);
      toast.error(error.response?.data?.message || 'Failed to regenerate demo test');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>

      <div className="admin-grid">
        <div className="card stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalStudents}</div>
            <div className="stat-label">Total Students</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <div className="stat-value">{stats.totalQuestions}</div>
            <div className="stat-label">Total Questions</div>
          </div>
        </div>

        <div className="card stat-card">
          <div className="stat-icon">💳</div>
          <div className="stat-info">
            <div className="stat-value">{stats.activeSubscriptions}</div>
            <div className="stat-label">Active Subscriptions</div>
          </div>
        </div>

        <div className="card">
          <h3>Questions by Exam</h3>
          {stats.questionsByExam.map((exam) => (
            <div key={exam._id} className="exam-stat">
              <span>{exam._id}</span>
              <span className="exam-count">{exam.count}</span>
            </div>
          ))}
        </div>

        <div className="card quick-actions">
          <h3>Quick Actions</h3>
          <Link to="/admin/demo-test" className="btn btn-primary">
            📋 Manage Demo Test
          </Link>
          <Link to="/admin/demo-leads" className="btn btn-success">
            📊 View Demo Leads
          </Link>
          <Link to="/admin/manage-scheduled-tests" className="btn btn-primary">
            📅 Manage Scheduled Tests
          </Link>
          <Link to="/admin/student-analytics" className="btn btn-success">
            📊 Student Performance Analytics
          </Link>
          <Link to="/admin/upload-questions" className="btn btn-primary">
            Upload Questions
          </Link>
          <Link to="/admin/manage-questions" className="btn btn-secondary">
            Manage Questions
          </Link>
          <Link to="/admin/students" className="btn btn-success">
            View Students
          </Link>
          <button 
            onClick={handleRegenerateDemoTest} 
            className="btn btn-warning"
            disabled={regenerating}
          >
            {regenerating ? '🔄 Regenerating...' : '🔄 Regenerate Demo Test'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
