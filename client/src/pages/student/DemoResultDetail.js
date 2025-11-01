import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../services/api';
import './DemoResultDetail.css';

const DemoResultDetail = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSolutions, setShowSolutions] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/results/public/${resultId}`);
      setResult(response.data.result);
    } catch (error) {
      toast.error('Failed to load result details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="demo-loading">Loading your results</div>;
  }

  if (!result) {
    return (
      <div className="demo-result-container">
        <div className="demo-card">
          <h2>Result not found</h2>
          <p>The requested result could not be found.</p>
          <Link to="/" className="topic-btn primary">Go to Home</Link>
        </div>
      </div>
    );
  }

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

  // Circular progress calculation
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  const progressOffset = circumference - (result.percentage / 100) * circumference;

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: '#10b981' };
    if (percentage >= 80) return { grade: 'A', color: '#059669' };
    if (percentage >= 70) return { grade: 'B+', color: '#3b82f6' };
    if (percentage >= 60) return { grade: 'B', color: '#6366f1' };
    if (percentage >= 50) return { grade: 'C', color: '#f59e0b' };
    return { grade: 'D', color: '#ef4444' };
  };

  const gradeInfo = getGrade(result.percentage);

  // Group answers for detailed solutions
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
    <div>
      {/* Hero Header */}
      <div className="demo-result-hero">
        <h1>Unlock Your Potential with Personalized AI Learning</h1>
        <p className="subtitle">India's 1st AI Test Series - Tailored to Your Performance</p>
        <Link to="/register" className="cta-button">
          Start Free Test
        </Link>
      </div>

      {/* Main Dashboard Container */}
      <div className="demo-result-container">
        
        {/* Dashboard Grid */}
        <div className="demo-dashboard-grid">
          
          {/* Student Performance Card - Circular Progress */}
          <div className="demo-card">
            <h3 className="demo-card-title">📊 Student Performance</h3>
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
                    stroke={result.percentage >= 70 ? '#22C55E' : result.percentage >= 40 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    className="progress-ring-circle"
                  />
                </svg>
                <div className="progress-value">{Math.round(result.percentage)}%</div>
              </div>
              <div className="progress-label">Overall Score</div>
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
                  <button className="topic-btn">Secondary</button>
                  <button className="topic-btn">Diagnostic</button>
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
                  <button className="topic-btn">Technical test</button>
                  <button className="topic-btn">Data skill</button>
                </div>
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                Excellent! You've mastered all topics in this test.
              </p>
            )}
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
                                    {answer.questionId?.question || 'Question not available'}
                                  </p>
                                  
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
                                            <strong>{String.fromCharCode(65 + optIdx)}.</strong> {option}
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
                                    <p>{answer.explanation || 'Solution not available'}</p>
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

        {/* CTA Section */}
        <div style={{ 
          marginTop: '50px', 
          textAlign: 'center', 
          paddingBottom: '60px',
          background: 'linear-gradient(135deg, var(--navy-primary) 0%, var(--navy-dark) 100%)',
          padding: '60px 40px',
          borderRadius: '25px',
          color: 'white'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Ready to Master Your Exam?</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
            Join thousands of students using AI-powered personalized learning
          </p>
          <Link to="/register" className="cta-button">
            🚀 Register for Full Access & More Tests
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DemoResultDetail;

