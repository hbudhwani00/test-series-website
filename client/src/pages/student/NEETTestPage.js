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

  // Auto-enter fullscreen when test loads
  useEffect(() => {
    const enterFullscreen = async () => {
      if (test && !isFullscreen) {
        try {
          const elem = document.documentElement;
          if (elem.requestFullscreen) {
            await elem.requestFullscreen();
          } else if (elem.webkitRequestFullscreen) {
            await elem.webkitRequestFullscreen();
          }
          setIsFullscreen(true);
        } catch (error) {
          console.error('Auto fullscreen error:', error);
        }
      }
    };
    
    enterFullscreen();
  }, [test]);

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
      // Fetch by testId if provided, otherwise fetch active test
      const url = testId 
        ? `${API_URL}/demo/neet-test/test/${testId}`
        : `${API_URL}/demo/neet-test`;
      
      const response = await axios.get(url);
      
      if (!response.data.neetTest) {
        toast.error('NEET demo test not found');
        navigate('/demo-tests');
        return;
      }

      setTest(response.data.neetTest);
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

  const handleAnswerSelect = (questionIndexOrOptionIndex, answerLetter) => {
    // Handle both cases: from question panel (just optionIndex) or from OMR (index, letter)
    if (answerLetter) {
      // Called from OMR sheet with (questionIndex, 'A'/'B'/'C'/'D')
      setAnswers(prev => ({
        ...prev,
        [questionIndexOrOptionIndex]: answerLetter
      }));
      // Auto-navigate to the question when marked from OMR
      if (questionIndexOrOptionIndex !== currentQuestionIndex) {
        setCurrentQuestionIndex(questionIndexOrOptionIndex);
      }
    } else {
      // Called from question panel with just optionIndex
      const answerValue = String.fromCharCode(65 + questionIndexOrOptionIndex); // A, B, C, D
      setAnswers(prev => ({
        ...prev,
        [currentQuestionIndex]: answerValue
      }));
    }
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
          <button className="header-btn submit-btn" onClick={handleSubmit}>
            Submit Test
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="neet-test-content">
        {/* Question Panel (80%) - All Questions Scrollable */}
        <div className="neet-question-panel">
          <div className="all-questions-container">
            {/* Physics Section */}
            <div className="subject-section">
              <div className="subject-header">PHYSICS (Q1-45)</div>
              {test.questions.slice(0, 45).map((question, idx) => {
                const qIndex = idx;
                const isSelected = (optIdx) => answers[qIndex] === String.fromCharCode(65 + optIdx);
                
                return (
                  <div 
                    key={qIndex} 
                    className={`question-card ${qIndex === currentQuestionIndex ? 'active-question' : ''}`}
                    id={`question-${qIndex}`}
                  >
                    <div className="question-header-card">
                      <h3>Question {qIndex + 1}</h3>
                      <div className="question-meta">
                        <span className="badge">{question.subject}</span>
                        <span className="marks">4 marks</span>
                      </div>
                    </div>

                    <div className="question-content">
                      <div className="question-text">
                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                          <strong style={{color: '#2D3E82', flexShrink: 0}}>Q{qIndex + 1}.</strong>
                          <span style={{flex: 1}}><LatexRenderer content={question.question} /></span>
                        </div>
                        {question.questionImage && (
                          <div className="question-image-container">
                            <img 
                              src={question.questionImage} 
                              alt={`Question ${qIndex + 1}`} 
                              className="question-image"
                            />
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="options-container">
                        {question.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={`option ${isSelected(idx) ? 'selected' : ''}`}
                            onClick={() => {
                              const answerLetter = String.fromCharCode(65 + idx);
                              setAnswers(prev => ({
                                ...prev,
                                [qIndex]: answerLetter
                              }));
                            }}
                          >
                            <div className="option-bubble">
                              {isSelected(idx) && <span className="check-mark">✓</span>}
                            </div>
                            <div className="option-content" style={{display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1}}>
                              <span className="option-label" style={{flexShrink: 0}}>{String.fromCharCode(65 + idx)}.</span>
                              <span style={{flex: 1}}>
                                <LatexRenderer content={option} />
                                {question.optionImages && question.optionImages[idx] && (
                                  <img 
                                    src={question.optionImages[idx]} 
                                    alt={`Option ${String.fromCharCode(65 + idx)}`}
                                    className="option-image"
                                  />
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mark for Review Button - Bottom Right */}
                      <div style={{display: 'flex', justifyContent: 'flex-end', padding: '12px 0 8px'}}>
                        <button 
                          className={`mark-review-btn ${markedForReview[qIndex] ? 'marked' : ''}`}
                          onClick={() => {
                            setMarkedForReview(prev => ({
                              ...prev,
                              [qIndex]: !prev[qIndex]
                            }));
                          }}
                        >
                          {markedForReview[qIndex] ? '📌 Marked for Review' : '📌 Mark for Review'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Chemistry Section */}
            <div className="subject-section">
              <div className="subject-header">CHEMISTRY (Q46-90)</div>
              {test.questions.slice(45, 90).map((question, idx) => {
                const qIndex = idx + 45;
                const isSelected = (optIdx) => answers[qIndex] === String.fromCharCode(65 + optIdx);
                
                return (
                  <div 
                    key={qIndex} 
                    className={`question-card ${qIndex === currentQuestionIndex ? 'active-question' : ''}`}
                    id={`question-${qIndex}`}
                  >
                    <div className="question-header-card">
                      <h3>Question {qIndex + 1}</h3>
                      <div className="question-meta">
                        <span className="badge">{question.subject}</span>
                        <span className="marks">4 marks</span>
                      </div>
                    </div>

                    <div className="question-content">
                      <div className="question-text">
                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                          <strong style={{color: '#2D3E82', flexShrink: 0}}>Q{qIndex + 1}.</strong>
                          <span style={{flex: 1}}><LatexRenderer content={question.question} /></span>
                        </div>
                        {question.questionImage && (
                          <div className="question-image-container">
                            <img 
                              src={question.questionImage} 
                              alt={`Question ${qIndex + 1}`} 
                              className="question-image"
                            />
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="options-container">
                        {question.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={`option ${isSelected(idx) ? 'selected' : ''}`}
                            onClick={() => {
                              const answerLetter = String.fromCharCode(65 + idx);
                              setAnswers(prev => ({
                                ...prev,
                                [qIndex]: answerLetter
                              }));
                            }}
                          >
                            <div className="option-bubble">
                              {isSelected(idx) && <span className="check-mark">✓</span>}
                            </div>
                            <div className="option-content" style={{display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1}}>
                              <span className="option-label" style={{flexShrink: 0}}>{String.fromCharCode(65 + idx)}.</span>
                              <span style={{flex: 1}}>
                                <LatexRenderer content={option} />
                                {question.optionImages && question.optionImages[idx] && (
                                  <img 
                                    src={question.optionImages[idx]} 
                                    alt={`Option ${String.fromCharCode(65 + idx)}`}
                                    className="option-image"
                                  />
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mark for Review Button - Bottom Right */}
                      <div style={{display: 'flex', justifyContent: 'flex-end', padding: '12px 0 8px'}}>
                        <button 
                          className={`mark-review-btn ${markedForReview[qIndex] ? 'marked' : ''}`}
                          onClick={() => {
                            setMarkedForReview(prev => ({
                              ...prev,
                              [qIndex]: !prev[qIndex]
                            }));
                          }}
                        >
                          {markedForReview[qIndex] ? '📌 Marked for Review' : '📌 Mark for Review'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Biology Section */}
            <div className="subject-section">
              <div className="subject-header">BIOLOGY (Q91-180)</div>
              {test.questions.slice(90, 180).map((question, idx) => {
                const qIndex = idx + 90;
                const isSelected = (optIdx) => answers[qIndex] === String.fromCharCode(65 + optIdx);
                
                return (
                  <div 
                    key={qIndex} 
                    className={`question-card ${qIndex === currentQuestionIndex ? 'active-question' : ''}`}
                    id={`question-${qIndex}`}
                  >
                    <div className="question-header-card">
                      <h3>Question {qIndex + 1}</h3>
                      <div className="question-meta">
                        <span className="badge">{question.subject}</span>
                        <span className="marks">4 marks</span>
                      </div>
                    </div>

                    <div className="question-content">
                      <div className="question-text">
                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                          <strong style={{color: '#2D3E82', flexShrink: 0}}>Q{qIndex + 1}.</strong>
                          <span style={{flex: 1}}><LatexRenderer content={question.question} /></span>
                        </div>
                        {question.questionImage && (
                          <div className="question-image-container">
                            <img 
                              src={question.questionImage} 
                              alt={`Question ${qIndex + 1}`} 
                              className="question-image"
                            />
                          </div>
                        )}
                      </div>

                      {/* Options */}
                      <div className="options-container">
                        {question.options.map((option, idx) => (
                          <div
                            key={idx}
                            className={`option ${isSelected(idx) ? 'selected' : ''}`}
                            onClick={() => {
                              const answerLetter = String.fromCharCode(65 + idx);
                              setAnswers(prev => ({
                                ...prev,
                                [qIndex]: answerLetter
                              }));
                            }}
                          >
                            <div className="option-bubble">
                              {isSelected(idx) && <span className="check-mark">✓</span>}
                            </div>
                            <div className="option-content" style={{display: 'flex', alignItems: 'flex-start', gap: '6px', flex: 1}}>
                              <span className="option-label" style={{flexShrink: 0}}>{String.fromCharCode(65 + idx)}.</span>
                              <span style={{flex: 1}}>
                                <LatexRenderer content={option} />
                                {question.optionImages && question.optionImages[idx] && (
                                  <img 
                                    src={question.optionImages[idx]} 
                                    alt={`Option ${String.fromCharCode(65 + idx)}`}
                                    className="option-image"
                                  />
                                )}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Mark for Review Button - Bottom Right */}
                      <div style={{display: 'flex', justifyContent: 'flex-end', padding: '12px 0 8px'}}>
                        <button 
                          className={`mark-review-btn ${markedForReview[qIndex] ? 'marked' : ''}`}
                          onClick={() => {
                            setMarkedForReview(prev => ({
                              ...prev,
                              [qIndex]: !prev[qIndex]
                            }));
                          }}
                        >
                          {markedForReview[qIndex] ? '📌 Marked for Review' : '📌 Mark for Review'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* OMR Sheet Panel (30%) */}
        <div className="neet-omr-panel">
          <OMRSheet
            totalQuestions={test.questions.length}
            answers={answers}
            markedForReview={markedForReview}
            currentQuestionIndex={currentQuestionIndex}
            onQuestionClick={handleNavigate}
            onAnswerSelect={handleAnswerSelect}
          />
        </div>
      </div>
    </div>
  );
};

export default NEETTestPage;
