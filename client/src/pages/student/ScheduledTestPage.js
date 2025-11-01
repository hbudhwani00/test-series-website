import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../services/api';
import './JEEMainTest.css';

const ScheduledTestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [answers, setAnswers] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (test && timeRemaining > 0) {
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
  }, [test, timeRemaining]);

  const fetchTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/scheduled-tests/student/test/${testId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setTest(data.test);
      setTimeRemaining(data.test.duration * 60);
    } catch (error) {
      toast.error('Failed to load test');
      console.error(error);
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (optionIndex) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: String.fromCharCode(65 + optionIndex) // Store as A, B, C, D
    });
  };

  const handleNumericalAnswer = (value) => {
    setAnswers({
      ...answers,
      [currentQuestionIndex]: value
    });
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit the test?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      // Format answers to map questionId to answer
      const formattedAnswers = {};
      test.questions.forEach((question, index) => {
        let answer = answers[index];
        
        // Convert letter answers (A, B, C, D) to numeric indices (0, 1, 2, 3)
        if (typeof answer === 'string' && answer.length === 1 && answer >= 'A' && answer <= 'Z') {
          answer = answer.charCodeAt(0) - 65;
        }
        
        formattedAnswers[question._id] = answer !== undefined ? answer : null;
      });

      const response = await axios.post(
        "${API_URL}/scheduled-tests/submit',
        {
          testId: test._id,
          answers: formattedAnswers,
          timeTaken: (test.duration * 60) - timeRemaining
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Test submitted successfully!');
      navigate(`/student/scheduled-result/${response.data.result.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit test');
      console.error(error);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading test...</div>;
  }

  if (!test) {
    return <div className="container">Test not found</div>;
  }

  const currentQuestion = test.questions[currentQuestionIndex];
  const totalQuestions = test.questions.length;
  const attemptedCount = Object.keys(answers).length;

  return (
    <div className="jee-test-container">
      {/* Header */}
      {!isFullscreen && (
        <div className="test-header">
          <div className="test-title">
            <h2>{test.title}</h2>
            <p>{test.examType} • {test.subject || 'All Subjects'}</p>
          </div>
          <div className="test-stats">
            <div className="timer">
              <span className="timer-icon">⏱️</span>
              <span className={timeRemaining < 300 ? 'time-critical' : ''}>{formatTime(timeRemaining)}</span>
            </div>
            <button className="btn btn-primary btn-sm" onClick={toggleFullscreen}>
              🖥️ Fullscreen
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleSubmit}>
              Submit Test
            </button>
          </div>
        </div>
      )}

      <div className="test-content">
        {/* Sidebar - Question Palette */}
        <div className="question-palette">
          <h3>Questions</h3>
          <div className="palette-stats">
            <p>Attempted: {attemptedCount}/{totalQuestions}</p>
          </div>
          <div className="palette-grid">
            {test.questions.map((q, idx) => (
              <button
                key={idx}
                className={`palette-btn ${currentQuestionIndex === idx ? 'active' : ''} ${answers[idx] !== undefined ? 'attempted' : ''}`}
                onClick={() => setCurrentQuestionIndex(idx)}
              >
                {q.questionNumber || idx + 1}
              </button>
            ))}
          </div>
          <div className="palette-legend">
            <div><span className="legend-box attempted"></span> Attempted</div>
            <div><span className="legend-box unattempted"></span> Unattempted</div>
            <div><span className="legend-box active"></span> Current</div>
          </div>
        </div>

        {/* Main Question Area */}
        <div className="question-area">
          <div className="question-header">
            <h3>Question {currentQuestion.questionNumber || currentQuestionIndex + 1}</h3>
            <div className="question-meta">
              <span className="badge">{currentQuestion.subject}</span>
              <span className="badge">{currentQuestion.chapter}</span>
              <span className="badge">{currentQuestion.marks} marks</span>
              {currentQuestion.hasNegativeMarking && <span className="badge badge-danger">-1 for wrong</span>}
            </div>
          </div>

          <div className="question-content">
            <p className="question-text">{currentQuestion.question}</p>
            
            {currentQuestion.questionType === 'mcq' ? (
              <div className="options">
                {currentQuestion.options.map((option, idx) => (
                  <div
                    key={idx}
                    className={`option ${answers[currentQuestionIndex] === String.fromCharCode(65 + idx) ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(idx)}
                  >
                    <span className="option-label">{String.fromCharCode(65 + idx)}.</span>
                    <span className="option-text">{option}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="numerical-answer">
                <label>Enter your answer:</label>
                <input
                  type="number"
                  step="any"
                  value={answers[currentQuestionIndex] || ''}
                  onChange={(e) => handleNumericalAnswer(e.target.value)}
                  placeholder="Enter numerical answer"
                  className="numerical-input"
                />
              </div>
            )}
          </div>

          <div className="question-navigation">
            <button
              className="btn btn-outline"
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setAnswers({ ...answers, [currentQuestionIndex]: answers[currentQuestionIndex] || null })}
            >
              Clear Response
            </button>
            <button
              className="btn btn-outline"
              onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))}
              disabled={currentQuestionIndex === totalQuestions - 1}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {isFullscreen && (
        <div className="fullscreen-controls">
          <div className="timer-fullscreen">⏱️ {formatTime(timeRemaining)}</div>
          <button className="btn btn-sm btn-outline" onClick={toggleFullscreen}>
            Exit Fullscreen
          </button>
          <button className="btn btn-sm btn-danger" onClick={handleSubmit}>
            Submit
          </button>
        </div>
      )}
    </div>
  );
};

export default ScheduledTestPage;

