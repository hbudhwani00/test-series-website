import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resultService, paymentService } from '../../services/api';
import './Dashboard.css';

const StudentDashboard = () => {
  const [analytics, setAnalytics] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [analyticsRes, subsRes] = await Promise.all([
        resultService.getUserAnalytics(),
        paymentService.getSubscriptionStatus(),
      ]);

      setAnalytics(analyticsRes.data);
      setSubscriptions(subsRes.data.subscriptions);

      // Dashboard is ONLY for subscribed students
      const activeSubscriptions = subsRes.data.subscriptions?.filter(
        sub => sub.isActive && new Date(sub.expiryDate) > new Date()
      );
      
      // Non-subscribed students should NOT access dashboard
      if (!activeSubscriptions || activeSubscriptions.length === 0) {
        const selectedExam = localStorage.getItem('selectedExam');
        // Redirect to exam patterns (where demo tests are shown)
        if (selectedExam) {
          navigate('/student/exam-patterns');
        } else {
          // First time user - let them select exam type
          navigate('/student/exam-selection');
        }
        return;
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Check if exam is already selected
  const selectedExam = localStorage.getItem('selectedExam');

  if (loading) {
    return (
      <div className="modern-loading">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const firstName = user.name?.split(' ')[0] || 'Student';

  return (
    <div className="modern-dashboard">
      {/* Hero Welcome Section */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="hero-title">
            Welcome back, <span className="gradient-text">{firstName}</span>! 👋
          </h1>
          <p className="hero-subtitle">Let's continue your learning journey and achieve your goals</p>
        </div>
        <div className="hero-actions">
          <Link to="/student/ai-test" className="hero-btn primary">
            <span className="btn-icon">🤖</span>
            <span className="btn-content">
              <span className="btn-title">AI Test</span>
              <span className="btn-desc">Smart personalized test</span>
            </span>
          </Link>
          <Link to="/student/exam-patterns" className="hero-btn secondary">
            <span className="btn-icon">📝</span>
            <span className="btn-content">
              <span className="btn-title">Practice Tests</span>
              <span className="btn-desc">Subject & topic wise</span>
            </span>
          </Link>
        </div>
      </div>

      {/* Stats Cards Row */}
      {analytics && analytics.totalTests > 0 && (
        <div className="stats-grid">
          <div className="stat-card purple">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Tests Taken</div>
              <div className="stat-value">{analytics.totalTests}</div>
              <div className="stat-trend positive">+{analytics.totalTests} this month</div>
            </div>
          </div>

          <div className="stat-card blue">
            <div className="stat-icon">🎯</div>
            <div className="stat-content">
              <div className="stat-label">Average Score</div>
              <div className="stat-value">{analytics.averageScore}%</div>
              <div className="stat-progress">
                <div className="progress-bar" style={{ width: `${analytics.averageScore}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card green">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <div className="stat-label">Correct Answers</div>
              <div className="stat-value">{analytics.totalCorrect}</div>
              <div className="stat-trend positive">Great progress!</div>
            </div>
          </div>

          <div className="stat-card orange">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-label">Total Questions</div>
              <div className="stat-value">{analytics.totalCorrect + analytics.totalIncorrect}</div>
              <div className="stat-trend neutral">Keep practicing</div>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* Left Column */}
        <div className="content-left">
          {/* Subject Performance */}
          {analytics && analytics.totalTests > 0 && (
            <div className="modern-card subject-card">
              <div className="card-header">
                <h2 className="card-title">📚 Subject Performance</h2>
                <span className="card-badge">Analytics</span>
              </div>
              <div className="subject-list">
                {Object.keys(analytics.subjectPerformance).map((subject) => {
                  const score = analytics.subjectPerformance[subject].averageScore;
                  const getScoreColor = (score) => {
                    if (score >= 80) return 'green';
                    if (score >= 60) return 'blue';
                    if (score >= 40) return 'orange';
                    return 'red';
                  };
                  
                  return (
                    <div key={subject} className="subject-item-modern">
                      <div className="subject-info">
                        <span className="subject-name">{subject}</span>
                        <span className={`subject-score ${getScoreColor(score)}`}>
                          {score.toFixed(1)}%
                        </span>
                      </div>
                      <div className="subject-progress-bar">
                        <div 
                          className={`progress-fill ${getScoreColor(score)}`}
                          style={{ width: `${score}%` }}
                        ></div>
                      </div>
                      <div className="subject-stats">
                        <span className="stat-item">
                          {analytics.subjectPerformance[subject].totalTests} tests
                        </span>
                        <span className="stat-item">
                          {analytics.subjectPerformance[subject].correct} correct
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="modern-card actions-card">
            <div className="card-header">
              <h2 className="card-title">⚡ Quick Actions</h2>
            </div>
            <div className="action-grid">
              {!selectedExam && (
                <Link to="/student/exam-selection" className="action-item purple">
                  <div className="action-icon">🎯</div>
                  <div className="action-content">
                    <div className="action-title">Select Exam</div>
                    <div className="action-desc">Choose your target exam</div>
                  </div>
                </Link>
              )}
              <Link to="/student/ai-test" className="action-item blue">
                <div className="action-icon">🤖</div>
                <div className="action-content">
                  <div className="action-title">AI Test</div>
                  <div className="action-desc">Smart personalized test</div>
                </div>
              </Link>
              <Link to="/student/results" className="action-item green">
                <div className="action-icon">📊</div>
                <div className="action-content">
                  <div className="action-title">View Results</div>
                  <div className="action-desc">Track your progress</div>
                </div>
              </Link>
              <Link to="/student/subscription" className="action-item orange">
                <div className="action-icon">💎</div>
                <div className="action-content">
                  <div className="action-title">Subscription</div>
                  <div className="action-desc">Manage your plan</div>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="content-right">
          {/* Subscription Card */}
          <div className="modern-card subscription-card">
            <div className="card-header">
              <h2 className="card-title">💎 Subscriptions</h2>
              {subscriptions.length > 0 && <span className="card-badge active">Active</span>}
            </div>
            {subscriptions.length > 0 ? (
              <div className="subscription-list">
                {subscriptions.map((sub, index) => (
                  <div key={index} className="subscription-item-modern">
                    <div className="sub-header">
                      <div className="sub-icon">🎓</div>
                      <div className="sub-info">
                        <div className="sub-name">{sub.examType.replace('_', ' ')}</div>
                        <div className="sub-status active">● Active</div>
                      </div>
                    </div>
                    <div className="sub-details">
                      <div className="sub-detail">
                        <span className="detail-label">Expires on</span>
                        <span className="detail-value">
                          {new Date(sub.expiryDate).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <p className="empty-text">No active subscriptions</p>
                <Link to="/student/subscription" className="subscribe-btn">
                  Subscribe Now
                </Link>
              </div>
            )}
          </div>

          {/* Motivational Card */}
          <div className="modern-card motivation-card">
            <div className="motivation-content">
              <div className="motivation-icon">🚀</div>
              <h3 className="motivation-title">Keep Going!</h3>
              <p className="motivation-text">
                Consistency is the key to success. Practice daily to achieve your goals.
              </p>
              <div className="motivation-stats">
                <div className="motivation-stat">
                  <div className="stat-number">
                    {analytics ? Math.ceil(analytics.averageScore / 10) : 7}
                  </div>
                  <div className="stat-label">Day Streak 🔥</div>
                </div>
              </div>
            </div>
          </div>

          {/* Tips Card */}
          <div className="modern-card tips-card">
            <div className="card-header">
              <h2 className="card-title">💡 Study Tips</h2>
            </div>
            <div className="tips-list">
              <div className="tip-item">
                <span className="tip-icon">⏰</span>
                <span className="tip-text">Take tests in a distraction-free environment</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">📖</span>
                <span className="tip-text">Review incorrect answers thoroughly</span>
              </div>
              <div className="tip-item">
                <span className="tip-icon">🎯</span>
                <span className="tip-text">Focus on weak topics identified by AI</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
