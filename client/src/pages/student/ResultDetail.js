import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resultService } from '../../services/api';
import LatexRenderer from '../../components/LatexRenderer';
import './ResultDetail.css';

const ResultDetail = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

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
