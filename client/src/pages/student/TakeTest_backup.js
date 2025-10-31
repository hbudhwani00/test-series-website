// Backup of original TakeTest.js - Created on 2025-10-27
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { testService, resultService } from '../../services/api';
import './TakeTest.css';

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const fetchTest = async () => {
    try {
      const response = await testService.getTest(testId);
      setTest(response.data.test);
      setTimeLeft(response.data.test.duration * 60); // Convert to seconds
    } catch (error) {
      toast.error('Failed to load test');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers({
      ...answers,
      [questionId]: {
        questionId,
        answer,
        timeTaken: Math.floor((Date.now() - startTime) / 1000),
      },
    });
  };

  const handleSubmit = async () => {
    if (window.confirm('Are you sure you want to submit the test?')) {
      try {
        const answersArray = Object.values(answers);
        const totalTime = Math.floor((Date.now() - startTime) / 1000);

        const response = await resultService.submitTest({
          testId,
          answers: answersArray,
          timeTaken: totalTime,
        });

        toast.success('Test submitted successfully!');
        navigate(`/student/result/${response.data.result.id}`);
      } catch (error) {
        toast.error('Failed to submit test');
      }
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading">Loading test...</div>;
  }

  if (!test) {
    return <div className="container">Test not found</div>;
  }

  const question = test.questions[currentQuestion]?.questionId;

  return (
    <div className="take-test">
      <div className="test-header">
        <div className="test-info">
          <h2>{test.title}</h2>
          <p>
            Question {currentQuestion + 1} of {test.questions.length}
          </p>
        </div>
        <div className="timer">
          <span className={timeLeft < 300 ? 'timer-warning' : ''}>
            ⏱️ {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="test-content">
        <div className="question-panel">
          {question && (
            <div className="question">
              <div className="question-header">
                <span className="question-type">
                  {question.questionType === 'single'
                    ? 'Single Choice'
                    : question.questionType === 'multiple'
                    ? 'Multiple Choice'
                    : 'Numerical'}
                </span>
                <span className="question-marks">Marks: {question.marks}</span>
              </div>

              <p className="question-text">{question.question}</p>

              {question.questionType === 'numerical' ? (
                <div className="numerical-input">
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Enter your answer"
                    value={answers[question._id]?.answer || ''}
                    onChange={(e) =>
                      handleAnswerChange(question._id, e.target.value)
                    }
                  />
                </div>
              ) : (
                <div className="options">
                  {question.options.map((option, index) => {
                    const optionKey = String.fromCharCode(65 + index);
                    const isSelected = question.questionType === 'multiple'
                      ? answers[question._id]?.answer?.includes(optionKey)
                      : answers[question._id]?.answer === optionKey;

                    return (
                      <div
                        key={index}
                        className={`option ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (question.questionType === 'multiple') {
                            const currentAnswers =
                              answers[question._id]?.answer || [];
                            const newAnswers = currentAnswers.includes(
                              optionKey
                            )
                              ? currentAnswers.filter((a) => a !== optionKey)
                              : [...currentAnswers, optionKey];
                            handleAnswerChange(question._id, newAnswers);
                          } else {
                            handleAnswerChange(question._id, optionKey);
                          }
                        }}
                      >
                        <div className="option-key">{optionKey}</div>
                        <div className="option-text">{option}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="navigation-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
            >
              Previous
            </button>
            {currentQuestion < test.questions.length - 1 ? (
              <button
                className="btn btn-primary"
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
              >
                Next
              </button>
            ) : (
              <button className="btn btn-success" onClick={handleSubmit}>
                Submit Test
              </button>
            )}
          </div>
        </div>

        <div className="question-palette">
          <h3>Question Palette</h3>
          <div className="palette-grid">
            {test.questions.map((q, index) => (
              <div
                key={index}
                className={`palette-item ${
                  index === currentQuestion ? 'active' : ''
                } ${answers[q.questionId._id] ? 'answered' : ''}`}
                onClick={() => setCurrentQuestion(index)}
              >
                {index + 1}
              </div>
            ))}
          </div>
          <div className="palette-legend">
            <div>
              <span className="legend-box answered"></span> Answered
            </div>
            <div>
              <span className="legend-box"></span> Not Answered
            </div>
            <div>
              <span className="legend-box active"></span> Current
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
