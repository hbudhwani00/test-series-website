import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../services/api';
import LatexRenderer from '../../components/LatexRenderer';
import './DemoResultDetail.css'; // Use same CSS as Demo

const ScheduledResultDetail = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showSolutions, setShowSolutions] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/results/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(response.data.result);
    } catch (error) {
      toast.error('Failed to load result details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAIFeedback = async () => {
    setLoadingAI(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/ai/performance-feedback`,
        { resultId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      setAiFeedback(response.data.feedback);
      
      if (response.data.source === 'gemini') {
        toast.success('AI analysis generated successfully!');
      } else {
        toast.info('AI analysis generated (fallback mode)');
      }
    } catch (error) {
      console.error('Error fetching AI feedback:', error);
      toast.error('Failed to generate AI feedback. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading result...</div>;
  }

  if (!result) {
    return <div className="container">Result not found</div>;
  }

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: '#10b981' };
    if (percentage >= 80) return { grade: 'A', color: '#059669' };
    if (percentage >= 70) return { grade: 'B+', color: '#3b82f6' };
    if (percentage >= 60) return { grade: 'B', color: '#6366f1' };
    if (percentage >= 50) return { grade: 'C', color: '#f59e0b' };
    return { grade: 'D', color: '#ef4444' };
  };

  const gradeInfo = getGrade(result.percentage);

  // Calculate circular progress
  const radius = 84;
  const circumference = 2 * Math.PI * radius;
  const displayPercentage = result.percentage;
  const progressPercentage = Math.max(0, Math.min(100, result.percentage));
  const progressOffset = circumference - (progressPercentage / 100) * circumference;

  // Calculate topic performance
  const getTopicPerformance = () => {
    const topicStats = {};
    
    if (result.answers) {
      result.answers.forEach((answer) => {
        const topicKey = `${answer.subject}/${answer.chapter}/${answer.topic}`;
        
        if (!topicStats[topicKey]) {
          topicStats[topicKey] = {
            subject: answer.subject || 'General',
            chapter: answer.chapter || 'General',
            topic: answer.topic || 'General',
            total: 0,
            correct: 0,
            incorrect: 0,
            unattempted: 0
          };
        }
        
        topicStats[topicKey].total++;
        if (answer.isCorrect) {
          topicStats[topicKey].correct++;
        } else if (answer.userAnswer === null || answer.userAnswer === undefined) {
          topicStats[topicKey].unattempted++;
        } else {
          topicStats[topicKey].incorrect++;
        }
      });
    }
    
    return Object.values(topicStats);
  };

  const topicPerformance = getTopicPerformance();
  const weakTopics = topicPerformance.filter(t => t.incorrect > 0).sort((a, b) => b.incorrect - a.incorrect).slice(0, 5);
  const strengthTopics = topicPerformance.filter(t => t.correct > 0 && t.incorrect === 0).sort((a, b) => b.correct - a.correct).slice(0, 5);
  const recommendedTopics = topicPerformance.filter(t => t.unattempted > 0 || t.incorrect > 0).sort((a, b) => (b.incorrect + b.unattempted) - (a.incorrect + a.unattempted)).slice(0, 4);

  // Group answers by subject, chapter, and topic
  const groupedAnswers = {};
  if (result.answers) {
    result.answers.forEach((answer) => {
      const subject = answer.subject || 'General';
      const chapter = answer.chapter || 'General';
      const topic = answer.topic || 'General';
      
      if (!groupedAnswers[subject]) {
        groupedAnswers[subject] = {};
      }
      if (!groupedAnswers[subject][chapter]) {
        groupedAnswers[subject][chapter] = {};
      }
      if (!groupedAnswers[subject][chapter][topic]) {
        groupedAnswers[subject][chapter][topic] = [];
      }
      
      groupedAnswers[subject][chapter][topic].push(answer);
    });
  }

  return (
    <div className="demo-result-container">
        
        {/* Dashboard Grid */}
        <div className="demo-dashboard-grid">
          
          {/* Student Performance Card - Circular Progress */}
          <div className="demo-card">
            <h3 className="demo-card-title">📅 Scheduled Test Performance</h3>
            <div className="circular-progress-container">
              <div className="circular-progress">
                <svg width="200" height="200" className="progress-ring">
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="16"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={progressPercentage >= 70 ? '#22C55E' : progressPercentage >= 40 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    className="progress-ring-circle"
                  />
                </svg>
                <div className="progress-value">{displayPercentage >= 0 ? Math.round(displayPercentage) : displayPercentage.toFixed(1)}%</div>
              </div>
              <div className="progress-label">Overall Score</div>
              <div className="progress-sublabel">
                {result.testId?.title || 'Scheduled Test'}
              </div>
              <div className="progress-sublabel" style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: gradeInfo.color,
                marginTop: '10px'
              }}>
                Grade: {gradeInfo.grade}
              </div>
              <div className="progress-sublabel">
                Time: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
              </div>
            </div>
            
            {/* Mini Stats Grid */}
            <div className="stats-mini-grid">
              <div className="stat-mini-card">
                <div className="stat-mini-value" style={{ color: '#22C55E' }}>{result.correctAnswers}</div>
                <div className="stat-mini-label">Correct</div>
              </div>
              <div className="stat-mini-card">
                <div className="stat-mini-value" style={{ color: '#EF4444' }}>{result.incorrectAnswers}</div>
                <div className="stat-mini-label">Incorrect</div>
              </div>
              <div className="stat-mini-card">
                <div className="stat-mini-value" style={{ color: '#F59E0B' }}>{result.unattempted}</div>
                <div className="stat-mini-label">Skipped</div>
              </div>
            </div>

            {/* AI Suggestions Section */}
            <div className="ai-suggestion-section">
              <button 
                className="ai-suggestion-btn"
                onClick={fetchAIFeedback}
                disabled={loadingAI}
              >
                {loadingAI ? '🤖 Analyzing Performance...' : '🤖 Get AI Performance Insights'}
              </button>
              
              {aiFeedback && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-header">
                    <span>🤖 AI Performance Analysis</span>
                    <button 
                      className="close-feedback-btn" 
                      onClick={() => setAiFeedback(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="ai-feedback-content">
                    {aiFeedback}
                  </div>
                </div>
              )}
            </div>

            {/* Back Button */}
            <Link to="/student/scheduled-tests" className="topic-btn primary" style={{ marginTop: '20px', width: '100%', textAlign: 'center' }}>
              Back to Scheduled Tests
            </Link>
          </div>

          {/* Weak Topics Card */}
          <div className="demo-card">
            <h3 className="demo-card-title">
              <span style={{ fontSize: '1.5rem' }}>📉</span> Weak Topics
            </h3>
            {weakTopics.length > 0 ? (
              <>
                <ul className="weak-topics-list">
                  {weakTopics.map((topic, idx) => (
                    <li key={idx} className="weak-topic-item">
                      <span className="topic-bullet"></span>
                      <span className="topic-name">{topic.topic}</span>
                      <span className="topic-count">{topic.incorrect} wrong</span>
                    </li>
                  ))}
                </ul>
                <div className="topic-actions">
                  <button className="topic-btn">Practice More</button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                🎉 Great! No weak topics identified. Keep up the excellent work!
              </p>
            )}
          </div>

          {/* Strength Areas Card */}
          <div className="demo-card">
            <h3 className="demo-card-title">
              <span style={{ fontSize: '1.5rem' }}>✅</span> Strength Topics
            </h3>
            {strengthTopics.length > 0 ? (
              <>
                <ul className="weak-topics-list">
                  {strengthTopics.map((topic, idx) => (
                    <li key={idx} className="weak-topic-item">
                      <span className="topic-bullet strength"></span>
                      <span className="topic-name">{topic.topic}</span>
                      <span className="topic-count">{topic.correct} correct</span>
                    </li>
                  ))}
                </ul>
                <div className="topic-actions">
                  <button className="topic-btn primary">View Progress</button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                Keep practicing to build your strengths!
              </p>
            )}
          </div>

          {/* Recommended Practice Card */}
          <div className="demo-card">
            <h3 className="demo-card-title">
              <span style={{ fontSize: '1.5rem' }}>🎯</span> Recommended Practice
            </h3>
            {recommendedTopics.length > 0 ? (
              <>
                <div className="practice-chart">
                  {recommendedTopics.map((topic, idx) => {
                    const needsPractice = topic.incorrect + topic.unattempted;
                    const percentage = (needsPractice / topic.total) * 100;
                    return (
                      <div key={idx} className="chart-bar-item">
                        <div className="chart-bar-header">
                          <span className="chart-bar-label">{topic.topic}</span>
                          <span className="chart-bar-value">{needsPractice} questions</span>
                        </div>
                        <div className="chart-bar-bg">
                          <div 
                            className="chart-bar-fill" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="topic-actions">
                  <button className="topic-btn">Generate AI Test</button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                Excellent! You've mastered all topics in this test.
              </p>
            )}
          </div>
        </div>

        {/* Performance Summary Card */}
        <div className="demo-card" style={{ marginTop: '30px' }}>
          <h2>📊 Performance Summary</h2>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '1.1rem', color: '#333', lineHeight: '1.8', marginBottom: '30px' }}>
              {result.percentage >= 80 ? 
                '🎉 Excellent performance! You have a strong understanding of the concepts.' :
                result.percentage >= 60 ?
                '👍 Good effort! Focus on your weak areas to improve further.' :
                result.percentage >= 40 ?
                '📚 You need more practice. Review the concepts and attempt more questions.' :
                '⚠️ Consider revising the fundamentals thoroughly before attempting more tests.'
              }
            </p>

            {/* Performance Tables - Same as DemoResultDetail */}
            {(() => {
              const strongTopics = {};
              const needImprovementTopics = {};
              const uncoveredTopics = {};

              // Categorize answers - group by subject first
              if (result.answers) {
                result.answers.forEach((answer) => {
                  const key = `${answer.subject}|${answer.chapter}|${answer.topic}`;
                  
                  if (answer.isCorrect) {
                    if (!strongTopics[answer.subject]) {
                      strongTopics[answer.subject] = {};
                    }
                    if (!strongTopics[answer.subject][key]) {
                      strongTopics[answer.subject][key] = {
                        subject: answer.subject,
                        chapter: answer.chapter,
                        topic: answer.topic,
                        count: 0
                      };
                    }
                    strongTopics[answer.subject][key].count++;
                  } else if (answer.userAnswer === null || answer.userAnswer === undefined) {
                    if (!uncoveredTopics[answer.subject]) {
                      uncoveredTopics[answer.subject] = {};
                    }
                    if (!uncoveredTopics[answer.subject][key]) {
                      uncoveredTopics[answer.subject][key] = {
                        subject: answer.subject,
                        chapter: answer.chapter,
                        topic: answer.topic,
                        count: 0
                      };
                    }
                    uncoveredTopics[answer.subject][key].count++;
                  } else {
                    if (!needImprovementTopics[answer.subject]) {
                      needImprovementTopics[answer.subject] = {};
                    }
                    if (!needImprovementTopics[answer.subject][key]) {
                      needImprovementTopics[answer.subject][key] = {
                        subject: answer.subject,
                        chapter: answer.chapter,
                        topic: answer.topic,
                        count: 0
                      };
                    }
                    needImprovementTopics[answer.subject][key].count++;
                  }
                });
              }

              return (
                <>
                  {/* Strong Topics */}
                  {Object.keys(strongTopics).length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ 
                        color: '#10b981', 
                        fontSize: '1.2rem', 
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>✅</span> Perfect, these are your strong topics
                      </h3>
                      <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        border: '2px solid #10b981',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse'
                        }}>
                          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '20%' }}>Subject</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '30%' }}>Chapter</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '35%' }}>Topic</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '15%' }}>Correct</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(strongTopics).map((subject, subjectIdx) => {
                              const topics = Object.values(strongTopics[subject]);
                              return topics.map((item, idx) => (
                                <tr 
                                  key={`${subjectIdx}-${idx}`} 
                                  style={{ 
                                    background: subjectIdx % 2 === 0 ? '#f0fdf4' : '#ffffff',
                                    borderBottom: '1px solid #d1fae5',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#dcfce7'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = subjectIdx % 2 === 0 ? '#f0fdf4' : '#ffffff'}
                                >
                                  {idx === 0 && (
                                    <td 
                                      rowSpan={topics.length} 
                                      style={{ 
                                        padding: '10px 12px', 
                                        color: '#065f46',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        verticalAlign: 'middle',
                                        background: subjectIdx % 2 === 0 ? '#d1fae5' : '#ecfdf5',
                                        borderRight: '2px solid #10b981'
                                      }}
                                    >
                                      {item.subject}
                                    </td>
                                  )}
                                  <td style={{ padding: '8px 12px', color: '#047857', fontSize: '0.9rem' }}>{item.chapter}</td>
                                  <td style={{ padding: '8px 12px', color: '#065f46', fontSize: '0.9rem' }}>{item.topic}</td>
                                  <td style={{ 
                                    padding: '8px 12px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold', 
                                    color: '#10b981',
                                    fontSize: '1rem',
                                    background: subjectIdx % 2 === 0 ? '#ecfdf5' : '#f7fee7'
                                  }}>
                                    {item.count}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Need Improvement Topics */}
                  {Object.keys(needImprovementTopics).length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ 
                        color: '#ef4444', 
                        fontSize: '1.2rem', 
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>⚠️</span> These chapters & topics need improvement
                      </h3>
                      <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        border: '2px solid #ef4444',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse'
                        }}>
                          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '20%' }}>Subject</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '30%' }}>Chapter</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '35%' }}>Topic</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '15%' }}>Incorrect</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(needImprovementTopics).map((subject, subjectIdx) => {
                              const topics = Object.values(needImprovementTopics[subject]);
                              return topics.map((item, idx) => (
                                <tr 
                                  key={`${subjectIdx}-${idx}`} 
                                  style={{ 
                                    background: subjectIdx % 2 === 0 ? '#fef2f2' : '#ffffff',
                                    borderBottom: '1px solid #fee2e2',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = subjectIdx % 2 === 0 ? '#fef2f2' : '#ffffff'}
                                >
                                  {idx === 0 && (
                                    <td 
                                      rowSpan={topics.length} 
                                      style={{ 
                                        padding: '10px 12px', 
                                        color: '#991b1b',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        verticalAlign: 'middle',
                                        background: subjectIdx % 2 === 0 ? '#fee2e2' : '#fef2f2',
                                        borderRight: '2px solid #ef4444'
                                      }}
                                    >
                                      {item.subject}
                                    </td>
                                  )}
                                  <td style={{ padding: '8px 12px', color: '#b91c1c', fontSize: '0.9rem' }}>{item.chapter}</td>
                                  <td style={{ padding: '8px 12px', color: '#991b1b', fontSize: '0.9rem' }}>{item.topic}</td>
                                  <td style={{ 
                                    padding: '8px 12px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold', 
                                    color: '#ef4444',
                                    fontSize: '1rem',
                                    background: subjectIdx % 2 === 0 ? '#fef2f2' : '#ffe4e6'
                                  }}>
                                    {item.count}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Uncovered Topics */}
                  {Object.keys(uncoveredTopics).length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ 
                        color: '#f59e0b', 
                        fontSize: '1.2rem', 
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>📚</span> You need to cover the theory of these chapters and topics
                      </h3>
                      <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        border: '2px solid #f59e0b',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse'
                        }}>
                          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '20%' }}>Subject</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '30%' }}>Chapter</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '35%' }}>Topic</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '15%' }}>Unattempted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(uncoveredTopics).map((subject, subjectIdx) => {
                              const topics = Object.values(uncoveredTopics[subject]);
                              return topics.map((item, idx) => (
                                <tr 
                                  key={`${subjectIdx}-${idx}`} 
                                  style={{ 
                                    background: subjectIdx % 2 === 0 ? '#fffbeb' : '#ffffff',
                                    borderBottom: '1px solid #fef3c7',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = subjectIdx % 2 === 0 ? '#fffbeb' : '#ffffff'}
                                >
                                  {idx === 0 && (
                                    <td 
                                      rowSpan={topics.length} 
                                      style={{ 
                                        padding: '10px 12px', 
                                        color: '#78350f',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        verticalAlign: 'middle',
                                        background: subjectIdx % 2 === 0 ? '#fef3c7' : '#fffbeb',
                                        borderRight: '2px solid #f59e0b'
                                      }}
                                    >
                                      {item.subject}
                                    </td>
                                  )}
                                  <td style={{ padding: '8px 12px', color: '#92400e', fontSize: '0.9rem' }}>{item.chapter}</td>
                                  <td style={{ padding: '8px 12px', color: '#78350f', fontSize: '0.9rem' }}>{item.topic}</td>
                                  <td style={{ 
                                    padding: '8px 12px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold', 
                                    color: '#f59e0b',
                                    fontSize: '1rem',
                                    background: subjectIdx % 2 === 0 ? '#fffbeb' : '#fef3c7'
                                  }}>
                                    {item.count}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Detailed Solutions Section */}
        <div className="solutions-section">
          <div 
            className="solutions-toggle"
            onClick={() => setShowSolutions(!showSolutions)}
          >
            <h2>📝 Detailed Analysis - Questions with Solutions</h2>
            <span className={`toggle-icon ${showSolutions ? 'open' : ''}`}>▼</span>
          </div>

          {showSolutions && (
            <>
              {Object.keys(groupedAnswers).map((subject, subIdx) => (
                <div key={subIdx}>
                  <h3 className="subject-header">{subject}</h3>
                  
                  {Object.keys(groupedAnswers[subject]).map((chapter, chIdx) => (
                    <div key={chIdx}>
                      <h4 className="chapter-header">📖 Chapter: {chapter}</h4>
                      
                      {Object.keys(groupedAnswers[subject][chapter]).map((topic, topIdx) => {
                        const topicAnswers = groupedAnswers[subject][chapter][topic];
                        
                        return (
                          <div key={topIdx}>
                            <h5 className="topic-header">🎯 Topic: {topic}</h5>
                            
                            {topicAnswers.map((answer, qIdx) => {
                              const isCorrect = answer.isCorrect;
                              const isUnattempted = answer.userAnswer === null || answer.userAnswer === undefined;
                              const questionClass = isCorrect ? 'correct' : (isUnattempted ? 'unattempted' : 'incorrect');
                              
                              return (
                                <div key={qIdx} className={`question-card ${questionClass}`}>
                                  <span className={`question-status-badge ${questionClass}`}>
                                    {isCorrect ? '✓ CORRECT' : (isUnattempted ? '− UNATTEMPTED' : '✗ INCORRECT')}
                                    {' • '}
                                    Marks: {answer.marksAwarded > 0 ? `+${answer.marksAwarded}` : answer.marksAwarded}
                                  </span>
                                  
                                  <p className="question-text">
                                    <LatexRenderer content={answer.questionId?.question || 'Question not available'} />
                                  </p>
                                  
                                  {answer.questionId?.questionImage && (
                                    <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                                      <img 
                                        src={answer.questionId.questionImage} 
                                        alt="Question diagram" 
                                        style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px' }} 
                                      />
                                    </div>
                                  )}
                                  
                                  <div style={{ 
                                    padding: '15px', 
                                    background: 'var(--light-bg)', 
                                    borderRadius: '10px', 
                                    marginBottom: '15px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                  }}>
                                    <div>
                                      <strong>Your Answer: </strong>
                                      <span style={{ color: isUnattempted ? 'var(--orange-accent)' : 'var(--text-primary)' }}>
                                        {isUnattempted ? 
                                          'Not Attempted' : 
                                          (answer.questionId?.questionType === 'numerical' ? 
                                            answer.userAnswer : 
                                            (typeof answer.userAnswer === 'string' && answer.userAnswer.length === 1 && answer.userAnswer.match(/[A-Z]/i) ?
                                              `Option ${answer.userAnswer.toUpperCase()}` :
                                              (typeof answer.userAnswer === 'number' || !isNaN(answer.userAnswer) ?
                                                `Option ${String.fromCharCode(65 + parseInt(answer.userAnswer))}` :
                                                answer.userAnswer
                                              )
                                            )
                                          )
                                        }
                                      </span>
                                    </div>
                                    <div>
                                      <strong>Correct Answer: </strong>
                                      <span style={{ color: 'var(--success-green)', fontWeight: '600' }}>
                                        {answer.questionId?.questionType === 'numerical' ? 
                                          answer.correctAnswer : 
                                          (typeof answer.correctAnswer === 'string' && answer.correctAnswer.length === 1 && answer.correctAnswer.match(/[A-Z]/i) ?
                                            `Option ${answer.correctAnswer.toUpperCase()}` :
                                            (typeof answer.correctAnswer === 'number' || !isNaN(answer.correctAnswer) ?
                                              `Option ${String.fromCharCode(65 + parseInt(answer.correctAnswer))}` :
                                              answer.correctAnswer
                                            )
                                          )
                                        }
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {answer.questionId?.options && answer.questionId.options.length > 0 && (
                                    <ul className="options-list">
                                      {answer.questionId.options.map((option, optIdx) => {
                                        const normalizedUserAnswer = typeof answer.userAnswer === 'string' && answer.userAnswer.length === 1 ? 
                                          answer.userAnswer.charCodeAt(0) - 65 : 
                                          parseInt(answer.userAnswer);
                                        
                                        const normalizedCorrectAnswer = typeof answer.correctAnswer === 'string' && answer.correctAnswer.length === 1 ? 
                                          answer.correctAnswer.charCodeAt(0) - 65 :
                                          parseInt(answer.correctAnswer);
                                        
                                        const isCorrectOption = optIdx === normalizedCorrectAnswer;
                                        const isUserOption = optIdx === normalizedUserAnswer;
                                        
                                        return (
                                          <li 
                                            key={optIdx}
                                            className={`option-item ${isCorrectOption ? 'correct-option' : ''} ${isUserOption && !isCorrectOption ? 'user-option' : ''}`}
                                          >
                                            <strong>{String.fromCharCode(65 + optIdx)}.</strong> 
                                            <span style={{ marginLeft: '8px' }}>
                                              <LatexRenderer content={option} />
                                            </span>
                                            {answer.questionId?.optionImages && answer.questionId.optionImages[optIdx] && (
                                              <div style={{ marginTop: '8px', marginLeft: '24px' }}>
                                                <img 
                                                  src={answer.questionId.optionImages[optIdx]} 
                                                  alt={`Option ${String.fromCharCode(65 + optIdx)} diagram`} 
                                                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px' }} 
                                                />
                                              </div>
                                            )}
                                            {isCorrectOption && <span style={{ color: 'var(--success-green)', marginLeft: '10px', fontWeight: 'bold' }}>✓</span>}
                                            {isUserOption && !isCorrectOption && <span style={{ color: 'var(--warning-red)', marginLeft: '10px', fontWeight: 'bold' }}>✗ Your Answer</span>}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                  
                                  {answer.questionId?.questionType === 'numerical' && (
                                    <div style={{ 
                                      marginBottom: '15px', 
                                      padding: '12px', 
                                      background: 'var(--light-bg)', 
                                      borderRadius: '8px',
                                      borderLeft: '4px solid var(--navy-primary)'
                                    }}>
                                      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                        <strong>Type:</strong> Numerical Answer Question
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div className="solution-box">
                                    <h6>💡 Solution:</h6>
                                    <p>
                                      <LatexRenderer content={answer.explanation || 'Solution not available'} />
                                    </p>
                                    {answer.questionId?.explanationImage && (
                                      <div style={{ marginTop: '1rem' }}>
                                        <img 
                                          src={answer.questionId.explanationImage} 
                                          alt="Solution diagram" 
                                          style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px' }} 
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}
        </div>
    </div>
  );
};

export default ScheduledResultDetail;

