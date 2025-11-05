import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { resultService, API_URL } from '../../services/api';
import LatexRenderer from '../../components/LatexRenderer';
import './ResultDetail.css';

const ResultDetail = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);

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
    return <div className="loading">Loading result...</div>;
  }

  if (!result) {
    return <div className="container">Result not found</div>;
  }

  return (
    <div className="container">
      <div className="result-detail">
        <div className="result-summary card">
          <h1>Test Result</h1>
          <h2>{result.testId.title}</h2>

          <div className="summary-stats">
            <div className="summary-stat">
              <div className="summary-value">{result.score}</div>
              <div className="summary-label">Total Score</div>
            </div>
            <div className="summary-stat">
              <div className="summary-value">{result.percentage.toFixed(2)}%</div>
              <div className="summary-label">Percentage</div>
            </div>
            <div className="summary-stat">
              <div className="summary-value correct">{result.correctAnswers}</div>
              <div className="summary-label">Correct</div>
            </div>
            <div className="summary-stat">
              <div className="summary-value incorrect">{result.incorrectAnswers}</div>
              <div className="summary-label">Incorrect</div>
            </div>
            <div className="summary-stat">
              <div className="summary-value">{result.unattempted}</div>
              <div className="summary-label">Unattempted</div>
            </div>
          </div>

          <div className="ai-suggestion-section" style={{ marginTop: '25px', paddingTop: '20px', borderTop: '2px dashed #e5e7eb' }}>
            <button 
              className="btn btn-primary"
              onClick={fetchAIFeedback}
              disabled={loadingAI}
              style={{ 
                width: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none',
                padding: '15px',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              {loadingAI ? '🤖 Analyzing Performance...' : '🤖 Get AI Performance Insights'}
            </button>
            
            {aiFeedback && (
              <div style={{
                marginTop: '20px',
                background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                borderRadius: '12px',
                padding: '20px',
                border: '2px solid #667eea',
                boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px',
                  paddingBottom: '10px',
                  borderBottom: '2px solid #667eea',
                  fontWeight: '700',
                  fontSize: '1.1rem',
                  color: '#667eea'
                }}>
                  <span>🤖 AI Performance Analysis</span>
                  <button 
                    onClick={() => setAiFeedback(null)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.5rem',
                      cursor: 'pointer',
                      color: '#6c757d'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div style={{
                  whiteSpace: 'pre-wrap',
                  lineHeight: '1.8',
                  color: '#212529',
                  fontSize: '0.95rem'
                }}>
                  {aiFeedback}
                </div>
              </div>
            )}
          </div>

          <Link to="/student/results" className="btn btn-secondary">
            Back to Results
          </Link>
        </div>

        <div className="answers-review">
          <h2>Answer Review</h2>
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
    </div>
  );
};

export default ResultDetail;
