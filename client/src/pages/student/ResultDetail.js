import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { resultService, API_URL } from '../../services/api';
import LatexRenderer from '../../components/LatexRenderer';
import './DemoResultDetail.css'; // Use same CSS as Demo

const ResultDetail = () => {
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
      const response = await resultService.getResult(resultId);
      setResult(response.data.result);
    } catch (error) {
      toast.error('Failed to load result details');
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
    return <div className="demo-loading">Loading your results...</div>;
  }

  if (!result) {
    return (
      <div className="demo-result-container">
        <div className="demo-card">
          <h2>Result not found</h2>
          <p>The requested result could not be found.</p>
          <Link to="/student/results" className="topic-btn primary">Back to Results</Link>
        </div>
      </div>
    );
  }

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

  return (
    <div className="demo-result-container">
        
        {/* Dashboard Grid */}
        <div className="demo-dashboard-grid">
          
          {/* Student Performance Card - Circular Progress */}
          <div className="demo-card">
            <h3 className="demo-card-title">📊 {result.testId?.isAIGenerated ? 'AI Test' : 'Test'} Performance</h3>
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
                {result.testId?.title || 'Test Result'}
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
            <Link to="/student/results" className="topic-btn primary" style={{ marginTop: '20px', width: '100%', textAlign: 'center' }}>
              Back to Results
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

        {/* Solutions Toggle */}
        <div className="demo-card" style={{ marginTop: '30px' }}>
          <div className="solutions-header">
            <h3 className="demo-card-title">📝 Question-wise Analysis</h3>
            <button 
              className="toggle-solutions-btn"
              onClick={() => setShowSolutions(!showSolutions)}
            >
              {showSolutions ? '🙈 Hide Solutions' : '👁️ Show Solutions'}
            </button>
          </div>
          {result.answers.map((answer, index) => (
            <div
              key={answer._id}
              className={`answer-card card ${
                answer.isCorrect ? 'correct' : answer.userAnswer ? 'incorrect' : 'unattempted'
              }`}
            >
              <div className="answer-header">
                <span className="question-number">Question {index + 1}</span>
                <span className={`answer-status ${answer.isCorrect ? 'correct' : 'incorrect'}`}>
                  {answer.isCorrect ? '✓ Correct' : answer.userAnswer ? '✗ Incorrect' : '- Unattempted'}
                </span>
                <span className="marks-awarded">
                  Marks: {answer.marksAwarded > 0 ? '+' : ''}{answer.marksAwarded}
                </span>
              </div>

              <div className="question-content">
                <p className="question-text">
                  <LatexRenderer content={answer.questionId.question} />
                </p>
                {answer.questionId.questionImage && (
                  <div style={{ marginTop: '1rem' }}>
                    <img 
                      src={answer.questionId.questionImage} 
                      alt="Question diagram" 
                      style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                  </div>
                )}

                {answer.questionId.questionType === 'numerical' ? (
                  <div className="numerical-answer">
                    <p>
                      <strong>Your Answer:</strong> {answer.userAnswer || 'Not Attempted'}
                    </p>
                    <p>
                      <strong>Correct Answer:</strong> {answer.questionId.correctAnswer}
                    </p>
                  </div>
                ) : (
                  <div className="options-review">
                    {answer.questionId.options.map((option, optIndex) => {
                      const optionKey = String.fromCharCode(65 + optIndex);
                      const isUserAnswer = Array.isArray(answer.userAnswer)
                        ? answer.userAnswer.includes(optionKey)
                        : answer.userAnswer === optionKey;
                      const isCorrectAnswer = Array.isArray(answer.questionId.correctAnswer)
                        ? answer.questionId.correctAnswer.includes(optionKey)
                        : answer.questionId.correctAnswer === optionKey;

                      return (
                        <div
                          key={optIndex}
                          className={`option-review ${
                            isCorrectAnswer ? 'correct-option' : ''
                          } ${isUserAnswer && !isCorrectAnswer ? 'incorrect-option' : ''}`}
                        >
                          <span className="option-key">{optionKey}</span>
                          <span className="option-text">
                            <LatexRenderer content={option} />
                            {answer.questionId.optionImages && answer.questionId.optionImages[optIndex] && (
                              <div style={{ marginTop: '0.5rem', marginLeft: '1rem' }}>
                                <img 
                                  src={answer.questionId.optionImages[optIndex]} 
                                  alt={`Option ${optionKey}`} 
                                  style={{ maxWidth: '250px', maxHeight: '120px', objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                                />
                              </div>
                            )}
                          </span>
                          {isCorrectAnswer && <span className="badge correct">✓ Correct</span>}
                          {isUserAnswer && !isCorrectAnswer && (
                            <span className="badge incorrect">Your Answer</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {answer.questionId.explanation && (
                  <div className="explanation">
                    <strong>Explanation:</strong>
                    <p>
                      <LatexRenderer content={answer.questionId.explanation} />
                    </p>
                    {answer.questionId.explanationImage && (
                      <div style={{ marginTop: '1rem' }}>
                        <img 
                          src={answer.questionId.explanationImage} 
                          alt="Solution diagram" 
                          style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
    </div>
  );
};

export default ResultDetail;
