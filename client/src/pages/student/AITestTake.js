import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import LatexRenderer from '../../components/LatexRenderer';
import './JEEMainTest.css';
import { API_URL } from '../../services/api';

const AITestTake = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const testData = location.state?.testData;

  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!testData) {
      toast.error('No test data found');
      navigate('/student/ai-test');
      return;
    }

    setTimeRemaining(testData.duration * 60); // Convert to seconds
  }, [testData, navigate]);

  useEffect(() => {
    if (timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeRemaining]);

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({ ...answers, [questionId]: answer });
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit the test?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const timeTaken = (testData.duration * 60) - timeRemaining;

      const response = await axios.post(
        `${API_URL}/ai/submit-test`,
        {
          questions: testData.questions,
          answers: answers,
          timeTaken: timeTaken,
          subject: testData.subject
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Test submitted successfully!');
      navigate(`/student/scheduled-result/${response.data.result.id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error('Failed to submit test');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!testData) {
    return <div className="loading">Loading test...</div>;
  }

  const currentQuestion = testData.questions[currentQuestionIndex];
  const answered = Object.keys(answers).length;
  const unanswered = testData.questions.length - answered;

  return (
    <div className="ai-test-page" style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8fafc, #e2e8f0)' }}>
      {/* Fixed Header */}
      <div style={{
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        padding: '1rem 2rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div style={{ fontSize: '2rem' }}>🤖</div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>AI Generated Test</h1>
              <div style={{ display: 'flex', gap: '1rem', fontSize: '0.9rem', marginTop: '0.25rem', opacity: 0.95 }}>
                <span>📚 {testData.subject}</span>
                <span>|</span>
                <span>📝 {testData.totalQuestions} Questions</span>
                <span>|</span>
                <span>💯 {testData.totalMarks} Marks</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              background: timeRemaining < 300 ? '#ef4444' : 'rgba(255,255,255,0.2)',
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              backdropFilter: 'blur(10px)',
              animation: timeRemaining < 300 ? 'pulse 2s ease-in-out infinite' : 'none'
            }}>
              ⏰ {formatTime(timeRemaining)}
            </div>
            <button 
              onClick={toggleFullscreen}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1.25rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
            >
              {isFullscreen ? '🗗 Exit Fullscreen' : '⛶ Fullscreen'}
            </button>
            <button 
              onClick={handleSubmit}
              style={{
                background: '#10b981',
                border: 'none',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 4px 6px rgba(0,0,0,0.2)',
                transition: 'all 0.3s'
              }}
              onMouseEnter={(e) => e.target.style.background = '#059669'}
              onMouseLeave={(e) => e.target.style.background = '#10b981'}
            >
              ✓ Submit Test
            </button>
          </div>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '350px 1fr', 
        gap: '1.5rem', 
        maxWidth: '1400px', 
        margin: '0 auto',
        padding: '1.5rem',
        minHeight: 'calc(100vh - 100px)'
      }}>
        {/* Question Palette Sidebar */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '1.5rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          height: 'fit-content',
          position: 'sticky',
          top: '120px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>
            Question Palette
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', background: '#10b981', borderRadius: '6px' }}></span>
              <span>Answered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', background: '#e5e7eb', borderRadius: '6px', border: '2px solid #d1d5db' }}></span>
              <span>Not Answered</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '24px', height: '24px', background: '#3b82f6', borderRadius: '6px' }}></span>
              <span>Current</span>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '0.5rem',
            marginBottom: '1.5rem'
          }}>
            {testData.questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                style={{
                  width: '48px',
                  height: '48px',
                  border: idx === currentQuestionIndex ? '3px solid #3b82f6' : 'none',
                  background: idx === currentQuestionIndex ? '#3b82f6' : (answers[q._id] !== undefined ? '#10b981' : '#e5e7eb'),
                  color: (idx === currentQuestionIndex || answers[q._id] !== undefined) ? 'white' : '#6b7280',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '1rem'
                }}
                onMouseEnter={(e) => {
                  if (idx !== currentQuestionIndex) {
                    e.target.style.transform = 'scale(1.1)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.boxShadow = 'none';
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div style={{ 
            borderTop: '2px solid #e5e7eb', 
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'space-around',
            fontSize: '0.875rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{answered}</div>
              <div style={{ color: '#6b7280' }}>Answered</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280' }}>{unanswered}</div>
              <div style={{ color: '#6b7280' }}>Remaining</div>
            </div>
          </div>
        </div>

        {/* Question Area */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          padding: '2rem',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
          minHeight: '600px',
          display: 'flex',
          flexDirection: 'column'
        }}>
          {/* Question Header */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937' }}>
                Question {currentQuestionIndex + 1} of {testData.totalQuestions}
              </h2>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ 
                  background: '#eff6ff', 
                  color: '#2563eb', 
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '6px', 
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {currentQuestion.subject}
                </span>
                <span style={{ 
                  background: '#f3e8ff', 
                  color: '#7c3aed', 
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '6px', 
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {currentQuestion.chapter}
                </span>
                <span style={{ 
                  background: '#dbeafe', 
                  color: '#1e40af', 
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '6px', 
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {currentQuestion.topic}
                </span>
                <span style={{ 
                  background: currentQuestion.difficulty === 'Easy' ? '#d1fae5' : currentQuestion.difficulty === 'Medium' ? '#fef3c7' : '#fee2e2',
                  color: currentQuestion.difficulty === 'Easy' ? '#065f46' : currentQuestion.difficulty === 'Medium' ? '#92400e' : '#991b1b',
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '6px', 
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  {currentQuestion.difficulty}
                </span>
                <span style={{ 
                  background: '#fef3c7', 
                  color: '#92400e', 
                  padding: '0.4rem 0.8rem', 
                  borderRadius: '6px', 
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  +{currentQuestion.marks} marks
                </span>
              </div>
            </div>
          </div>

          {/* Question Content */}
          <div style={{ flex: 1, marginBottom: '2rem' }}>
            <div style={{ 
              background: '#f9fafb', 
              padding: '1.5rem', 
              borderRadius: '12px', 
              marginBottom: '1.5rem',
              border: '2px solid #e5e7eb',
              fontSize: '1.1rem',
              lineHeight: '1.8',
              color: '#1f2937'
            }}>
              <LatexRenderer content={currentQuestion.question} />
            </div>

            {currentQuestion.questionType === 'single' || currentQuestion.questionType === 'mcq' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {currentQuestion.options.map((option, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleAnswerChange(currentQuestion._id, idx)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '1rem',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: answers[currentQuestion._id] === idx ? '3px solid #3b82f6' : '2px solid #e5e7eb',
                      background: answers[currentQuestion._id] === idx ? '#eff6ff' : 'white',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontSize: '1rem'
                    }}
                    onMouseEnter={(e) => {
                      if (answers[currentQuestion._id] !== idx) {
                        e.currentTarget.style.borderColor = '#cbd5e1';
                        e.currentTarget.style.background = '#f8fafc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (answers[currentQuestion._id] !== idx) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.background = 'white';
                      }
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestion._id}`}
                      checked={answers[currentQuestion._id] === idx}
                      onChange={() => handleAnswerChange(currentQuestion._id, idx)}
                      style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                    />
                    <span style={{ 
                      fontWeight: 'bold', 
                      color: answers[currentQuestion._id] === idx ? '#2563eb' : '#6b7280',
                      minWidth: '30px'
                    }}>
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <span style={{ flex: 1, color: '#1f2937' }}>
                      <LatexRenderer content={option} />
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                background: '#f9fafb', 
                padding: '1.5rem', 
                borderRadius: '12px',
                border: '2px solid #e5e7eb'
              }}>
                <label style={{ 
                  display: 'block', 
                  marginBottom: '0.75rem', 
                  fontWeight: '600',
                  color: '#374151',
                  fontSize: '1rem'
                }}>
                  Enter your numerical answer:
                </label>
                <input
                  type="number"
                  step="any"
                  value={answers[currentQuestion._id] || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion._id, parseFloat(e.target.value))}
                  placeholder="Type your answer here..."
                  style={{
                    width: '100%',
                    padding: '1rem',
                    fontSize: '1.25rem',
                    borderRadius: '8px',
                    border: '2px solid #cbd5e1',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
                />
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            gap: '1rem',
            paddingTop: '1.5rem',
            borderTop: '2px solid #e5e7eb'
          }}>
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                background: currentQuestionIndex === 0 ? '#f3f4f6' : 'white',
                color: currentQuestionIndex === 0 ? '#9ca3af' : '#374151',
                fontWeight: '600',
                cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                if (currentQuestionIndex !== 0) {
                  e.target.style.background = '#f9fafb';
                  e.target.style.borderColor = '#cbd5e1';
                }
              }}
              onMouseLeave={(e) => {
                if (currentQuestionIndex !== 0) {
                  e.target.style.background = 'white';
                  e.target.style.borderColor = '#e5e7eb';
                }
              }}
            >
              ← Previous
            </button>

            <button
              onClick={() => handleAnswerChange(currentQuestion._id, null)}
              style={{
                padding: '0.875rem 1.5rem',
                borderRadius: '8px',
                border: '2px solid #f59e0b',
                background: 'white',
                color: '#f59e0b',
                fontWeight: '600',
                cursor: 'pointer',
                fontSize: '1rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.background = '#fef3c7';
                e.target.style.borderColor = '#d97706';
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'white';
                e.target.style.borderColor = '#f59e0b';
              }}
            >
              🗑 Clear Response
            </button>

            {currentQuestionIndex < testData.questions.length - 1 ? (
              <button
                onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                style={{
                  padding: '0.875rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#3b82f6',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(59, 130, 246, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#2563eb';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#3b82f6';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.3)';
                }}
              >
                Save & Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                style={{
                  padding: '0.875rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#10b981',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.2s',
                  boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#059669';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#10b981';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 2px 4px rgba(16, 185, 129, 0.3)';
                }}
              >
                ✓ Submit Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AITestTake;


