import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import LatexRenderer from '../../components/LatexRenderer';
import OMRSheet from '../../components/OMRSheet';
import { API_URL } from '../../services/api';
import './NEETTestPage.css';

const NEETTestPage = () => {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(12000); // 200 minutes (3 hours 20 min)
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [testId]);

  useEffect(() => {
    if (!test || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, timeRemaining]);

  const fetchTest = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/demo/neet-test${testId ? `/${testId}` : ''}`);
      
      if (!response.data.test) {
        toast.error('NEET demo test not found');
        navigate('/demo-tests');
        return;
      }

      setTest(response.data.test);
    } catch (error) {
      console.error('Error fetching NEET test:', error);
      toast.error(error.response?.data?.message || 'Failed to load test');
      navigate('/demo-tests');
    } finally {
      setLoading(false);
    }
  };

  const currentQuestion = test?.questions[currentQuestionIndex];

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleAnswerSelect = (optionIndex) => {
    const answerValue = String.fromCharCode(65 + optionIndex); // A, B, C, D
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: answerValue
    }));
  };

  const toggleMarkForReview = () => {
    setMarkedForReview(prev => ({
      ...prev,
      [currentQuestionIndex]: !prev[currentQuestionIndex]
    }));
  };

  const handleNavigate = (index) => {
    if (index >= 0 && index < test.questions.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const toggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          await elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) {
          await elem.webkitRequestFullscreen();
        }
        setIsFullscreen(true);
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        }
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit the test?')) {
      return;
    }

    try {
      const totalMarks = Object.values(answers).length * 4; // 4 marks per correct answer

      const submitData = {
        testId,
        testType: 'neet_demo',
        answers: Object.entries(answers).map(([index, answer]) => ({
          questionIndex: parseInt(index),
          answer,
          question: test.questions[index],
          isCorrect: answer === test.questions[index].correctAnswer
        })),
        totalMarks,
        score: Object.entries(answers).filter(([index, answer]) => 
          answer === test.questions[index].correctAnswer
        ).length * 4,
        timeSpent: 12000 - timeRemaining,
        markedForReview
      };

      const response = await axios.post(`${API_URL}/results/submit-demo`, submitData);

      toast.success('Test submitted successfully!');
      navigate(`/student/demo-result/${response.data.result._id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.response?.data?.message || 'Failed to submit test');
    }
  };

  if (loading) {
    return (
      <div className="neet-test-loading">
        <div className="spinner"></div>
        <p>Loading NEET Demo Test...</p>
      </div>
    );
  }

  if (!test || !currentQuestion) {
    return (
      <div className="neet-test-error">
        <p>Test data not available</p>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(a => a !== undefined).length;
  const markedCount = Object.values(markedForReview).filter(m => m).length;

  return (
    <div className="neet-test-container">
      {/* Header Bar */}
      <div className="neet-test-header">
        <div className="header-left">
          <h2>{test.title || 'NEET Demo Test'}</h2>
        </div>
        <div className="header-center">
          <div className={`timer ${timeRemaining < 600 ? 'warning' : ''}`}>
            ⏱️ {formatTime(timeRemaining)}
          </div>
        </div>
        <div className="header-right">
          <button className="header-btn" onClick={toggleFullscreen}>
            {isFullscreen ? '⛔ Exit' : '🖥️'} Fullscreen
          </button>
          <button className="header-btn submit-btn" onClick={handleSubmit}>
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="neet-test-content">
        {/* Question Panel (75%) */}
        <div className="neet-question-panel">
          <div className="question-header">
            <h3>Question {currentQuestionIndex + 1} of {test.questions.length}</h3>
            <div className="question-meta">
              <span className="badge">{currentQuestion.subject}</span>
              <span className="badge">{currentQuestion.chapter}</span>
              <span className="marks">4 marks</span>
            </div>
          </div>

          {/* Question Text & Image */}
          <div className="question-content">
            <div className="question-text">
              <LatexRenderer content={currentQuestion.question} />
              {currentQuestion.questionImage && (
                <div className="question-image-container">
                  <img 
                    src={currentQuestion.questionImage} 
                    alt="Question" 
                    className="question-image"
                  />
                </div>
              )}
            </div>

            {/* Options */}
            <div className="options-container">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = answers[currentQuestionIndex] === String.fromCharCode(65 + idx);
                return (
                  <div
                    key={idx}
                    className={`option ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleAnswerSelect(idx)}
                  >
                    <div className="option-bubble">
                      {isSelected && <span className="check-mark">✓</span>}
                    </div>
                    <div className="option-content">
                      <span className="option-label">{String.fromCharCode(65 + idx)}.</span>
                      <LatexRenderer content={option} />
                      {currentQuestion.optionImages && currentQuestion.optionImages[idx] && (
                        <img 
                          src={currentQuestion.optionImages[idx]} 
                          alt={`Option ${String.fromCharCode(65 + idx)}`}
                          className="option-image"
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="question-actions">
            <button 
              className="action-btn"
              onClick={() => handleNavigate(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
            >
              ← Previous
            </button>
            <button 
              className={`action-btn mark-btn ${markedForReview[currentQuestionIndex] ? 'marked' : ''}`}
              onClick={toggleMarkForReview}
            >
              {markedForReview[currentQuestionIndex] ? '📌 Marked' : '📌 Mark for Review'}
            </button>
            <button 
              className="action-btn"
              onClick={() => setAnswers(prev => {
                const updated = { ...prev };
                delete updated[currentQuestionIndex];
                return updated;
              })}
            >
              Clear
            </button>
            <button 
              className="action-btn"
              onClick={() => handleNavigate(currentQuestionIndex + 1)}
              disabled={currentQuestionIndex === test.questions.length - 1}
            >
              Next →
            </button>
          </div>
        </div>

        {/* OMR Sheet Panel (25%) */}
        <div className="neet-omr-panel">
          <OMRSheet
            totalQuestions={test.questions.length}
            answers={answers}
            markedForReview={markedForReview}
            currentQuestionIndex={currentQuestionIndex}
            onQuestionClick={handleNavigate}
          />

          {/* Quick Stats */}
          <div className="quick-stats">
            <div className="stat">
              <span className="stat-label">Attempted</span>
              <span className="stat-value">{answeredCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Marked</span>
              <span className="stat-value">{markedCount}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Left</span>
              <span className="stat-value">{test.questions.length - answeredCount}</span>
            </div>
          </div>

          {/* Section Navigation */}
          <div className="section-nav">
            <div className="section-nav-item">
              <strong>Physics (1-45)</strong>
              <button onClick={() => handleNavigate(0)} className="nav-jump">Jump</button>
            </div>
            <div className="section-nav-item">
              <strong>Chemistry (46-90)</strong>
              <button onClick={() => handleNavigate(45)} className="nav-jump">Jump</button>
            </div>
            <div className="section-nav-item">
              <strong>Biology (91-180)</strong>
              <button onClick={() => handleNavigate(90)} className="nav-jump">Jump</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NEETTestPage;
