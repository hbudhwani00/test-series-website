import React, { useState, useEffect, useRef } from 'react';
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
  // Mobile orientation state
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(true);
  // Time tracking per question
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimeTracking, setQuestionTimeTracking] = useState({}); // { questionIndex: { firstVisit: time, revisits: [time1, time2], visited: boolean } }
  // Mobile/orientation detection
  useEffect(() => {
    const checkMobileAndOrientation = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;
      const isLandscapeMode = window.innerWidth > window.innerHeight;
      setIsMobile(isMobileDevice);
      setIsLandscape(isLandscapeMode);
    };
    checkMobileAndOrientation();
    window.addEventListener('resize', checkMobileAndOrientation);
    window.addEventListener('orientationchange', checkMobileAndOrientation);
    return () => {
      window.removeEventListener('resize', checkMobileAndOrientation);
      window.removeEventListener('orientationchange', checkMobileAndOrientation);
    };
  }, []);

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

  // Helper to compute subject range like Q1-45 for a given subject
  const getSubjectRange = (subjectName) => {
    if (!test || !test.questions) return null;
    const subjectQuestions = test.questions.filter(q => q.subject && q.subject.toLowerCase() === String(subjectName).toLowerCase());
    if (!subjectQuestions || subjectQuestions.length === 0) return null;
    const numbers = subjectQuestions.map(q => q.questionNumber || (test.questions.indexOf(q) + 1)).filter(Boolean);
    const min = Math.min(...numbers);
    const max = Math.max(...numbers);
    return { min, max };
  };

  const currentSubject = currentQuestion?.subject || (test && test.questions && test.questions.length ? test.questions[0].subject : '');
  const currentRange = getSubjectRange(currentSubject);

  // Initialize visibleSubject when test loads so the sticky band shows immediately
  useEffect(() => {
    if (!test) return;
    // Prefer the subject of the first question if observer hasn't set it yet
    if (!visibleSubject) {
      const firstSubj = test.questions && test.questions.length ? (test.questions[0].subject || '') : '';
      setVisibleSubject(firstSubj);
    }
  }, [test]);

  // Track which subject-section is currently visible inside the scroll container
  const [visibleSubject, setVisibleSubject] = useState(null);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!test) return;
    const container = document.querySelector('.all-questions-container');
    scrollContainerRef.current = container;
    if (!container) return;

    const sections = container.querySelectorAll('.subject-section');
    if (!sections || sections.length === 0) return;

    const observer = new IntersectionObserver((entries) => {
      // Find the entry with largest intersectionRatio that's intersecting
      const visible = Array.from(entries).filter(e => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible && visible.target) {
        const subj = visible.target.getAttribute('data-subject');
        if (subj) setVisibleSubject(subj);
      }
    }, {
      root: container,
      threshold: [0.25, 0.5, 0.75]
    });

    sections.forEach(s => observer.observe(s));

    return () => {
      observer.disconnect();
    };
  }, [test]);

  // Track time when changing questions
    // Track time when changing questions
const trackQuestionTime = (fromIndex) => {
  const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000); // Convert to seconds
  const questionId = test.questions[fromIndex]._id; // GET THE QUESTION ID
  
  setQuestionTimeTracking(prev => {
    const existing = prev[questionId] || { visited: false, firstVisit: 0, revisits: [] }; // USE questionId
    
    if (!existing.visited) {
      // First visit
      return {
        ...prev,
        [questionId]: { // USE questionId
          visited: true,
          firstVisit: timeSpent,
          revisits: []
        }
      };
    } else {
      // Revisit
      return {
        ...prev,
        [questionId]: { // USE questionId
          ...existing,
          revisits: [...existing.revisits, timeSpent]
        }
      };
    }
  });
};

  const navigateToQuestion = (index) => {
    if (index === currentQuestionIndex) return;
    
    // Track time before leaving current question
    trackQuestionTime(currentQuestionIndex);
    
    // Navigate to new question
    setCurrentQuestionIndex(index);
    setQuestionStartTime(Date.now());
  };

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
        trackQuestionTime(currentQuestionIndex);
        setCurrentQuestionIndex(questionIndexOrOptionIndex);
        setQuestionStartTime(Date.now());
        // Scroll the question into view inside the questions container.
        // Use a short timeout to ensure the DOM has updated, and try multiple fallbacks.
        const targetIndex = Number(questionIndexOrOptionIndex);
        setTimeout(() => {
          const el = document.getElementById(`question-${targetIndex}`);
          const container = document.querySelector('.all-questions-container');
          try {
            if (el && container) {
              // Preferred: let the container smoothly scroll so the element is centered
              el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
              // Fallback: also nudge container.scrollTop in case scrollIntoView doesn't affect the container
              const containerRect = container.getBoundingClientRect();
              const elRect = el.getBoundingClientRect();
              const offset = elRect.top - containerRect.top - 20;
              container.scrollTo({ top: container.scrollTop + offset, behavior: 'smooth' });
            } else if (el) {
              // No scrollable container found, let the page scroll
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          } catch (err) {
            // final fallback: immediate jump
            if (el) el.scrollIntoView();
          }
        }, 60);
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
      navigateToQuestion(index);
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

    // Track time for the current question before submitting
    trackQuestionTime(currentQuestionIndex);

    try {
      // Get userId if user is logged in
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const userId = user.id || user._id || null; // Backend returns 'id', not '_id'

      // Convert answers from index keys to questionId keys and letters to numbers
      const formattedAnswers = {};
      if (test && test.questions) {
        test.questions.forEach((question, index) => {
          const indexKey = index.toString();
          let answer = answers[indexKey];
          // Convert letter answers (A, B, C, D) to numeric indices (0, 1, 2, 3)
          if (typeof answer === 'string' && answer.length === 1 && answer >= 'A' && answer <= 'Z') {
            answer = answer.charCodeAt(0) - 65;
          }
          formattedAnswers[question._id] = answer !== undefined ? answer : null;
        });
      }

      console.log('NEET Test Submit - User from localStorage:', user);
      console.log('NEET Test Submit - userId to send:', userId);
      console.log('NEET Test Submit - Formatted answers:', formattedAnswers);

      const submitData = {
        testId,
        testType: 'neet_demo',
        answers: formattedAnswers,
        timeSpent: 12000 - timeRemaining,
        markedForReview,
        userId: userId, // Include userId if logged in
        questionTimeTracking // Include detailed time tracking data
      };

      console.log('NEET Test Submit - Complete submitData:', { ...submitData, answers: `[${Object.keys(submitData.answers).length} answers]` });

      const response = await axios.post(`${API_URL}/results/submit-demo`, submitData);

      console.log('NEET Test Submit - Response:', response.data);

      toast.success('Test submitted successfully!');
      navigate(`/student/demo-result/${response.data.result.id}`);
    } catch (error) {
      console.error('Error submitting test:', error);
      toast.error(error.response?.data?.message || 'Failed to submit test');
    }
  };

  // Show rotation prompt for mobile devices in portrait mode
  if (isMobile && !isLandscape) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 z-50">
        <div className="text-center text-white p-8 max-w-md mx-4">
          <div className="mb-6 flex justify-center">
            <svg className="w-24 h-24 animate-spin-slow" style={{ animation: 'spin 3s linear infinite' }} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2"/>
              <path d="M12 2v3M12 19v3" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">Please Rotate Your Device</h2>
          <p className="text-lg opacity-90 mb-2">This test requires landscape mode for better visibility</p>
          <p className="text-sm opacity-75">Rotate your phone horizontally to continue</p>
        </div>
      </div>
    );
  }

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

      {/* Top sticky subject band that reflects the subject currently visible in the scroll container */}
      {/* <div className="subject-sticky-top" aria-hidden={false}>
        <div className="subject-sticky-inner">
          <div className="subject-name">{String(visibleSubject || currentSubject || '').toUpperCase()}</div>
        </div>
      </div> */}

      {/* Main Content Area */}
      <div className="neet-test-content">
        {/* Question Panel (80%) - All Questions Scrollable */}
        <div className="neet-question-panel">
          <div className="all-questions-container">
            {/* Physics Section */}
            <div className="subject-section" data-subject="Physics">
              <div className="subject-header">PHYSICS</div>
              {test.questions.filter(q => q.subject === 'Physics').sort((a, b) => a.questionNumber - b.questionNumber).map((question) => {
                const qIndex = test.questions.indexOf(question);
                const isSelected = (optIdx) => answers[qIndex] === String.fromCharCode(65 + optIdx);

                return (
                  <div 
                    key={qIndex} 
                    className={`question-card ${qIndex === currentQuestionIndex ? 'active-question' : ''}`}
                    id={`question-${qIndex}`}
                  >
                    <div className="question-subject-tag">{String(question.subject || '').toUpperCase()}</div>
                    <div className="question-header-card">
                      <h3>Question {question.questionNumber || (qIndex + 1)}</h3>
                      <div className="question-meta">
                        <span className="badge">{question.subject}</span>
                        <span className="marks">4 marks</span>
                      </div>
                    </div>

                    <div className="question-content">
                      <div className="question-text">
                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                          <strong style={{color: '#111827', flexShrink: 0}}>Q{question.questionNumber || (qIndex + 1)}.</strong>
                          <span style={{flex: 1}}><LatexRenderer content={question.question} /></span>
                        </div>
                        {question.questionImage && (
                          <div className="question-image-container">
                            <img 
                              src={question.questionImage} 
                              alt={`Question ${question.questionNumber || (qIndex + 1)}`} 
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
            <div className="subject-section" data-subject="Chemistry">
              <div className="subject-header">CHEMISTRY</div>
              {test.questions.filter(q => q.subject === 'Chemistry').sort((a, b) => a.questionNumber - b.questionNumber).map((question) => {
                const qIndex = test.questions.indexOf(question);
                const isSelected = (optIdx) => answers[qIndex] === String.fromCharCode(65 + optIdx);

                return (
                  <div 
                    key={qIndex} 
                    className={`question-card ${qIndex === currentQuestionIndex ? 'active-question' : ''}`}
                    id={`question-${qIndex}`}
                  >
                    <div className="question-subject-tag">{String(question.subject || '').toUpperCase()}</div>
                    <div className="question-header-card">
                      <h3>Question {question.questionNumber || (qIndex + 1)}</h3>
                      <div className="question-meta">
                        <span className="badge">{question.subject}</span>
                        <span className="marks">4 marks</span>
                      </div>
                    </div>

                    <div className="question-content">
                      <div className="question-text">
                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                          <strong style={{color: '#111827', flexShrink: 0}}>Q{question.questionNumber || (qIndex + 1)}.</strong>
                          <span style={{flex: 1}}><LatexRenderer content={question.question} /></span>
                        </div>
                        {question.questionImage && (
                          <div className="question-image-container">
                            <img 
                              src={question.questionImage} 
                              alt={`Question ${question.questionNumber || (qIndex + 1)}`} 
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
            <div className="subject-section" data-subject="Biology">
              <div className="subject-header">BIOLOGY</div>
              {test.questions.filter(q => q.subject === 'Biology').sort((a, b) => a.questionNumber - b.questionNumber).map((question) => {
                const qIndex = test.questions.indexOf(question);
                const isSelected = (optIdx) => answers[qIndex] === String.fromCharCode(65 + optIdx);

                return (
                  <div 
                    key={qIndex} 
                    className={`question-card ${qIndex === currentQuestionIndex ? 'active-question' : ''}`}
                    id={`question-${qIndex}`}
                  >
                    <div className="question-subject-tag">{String(question.subject || '').toUpperCase()}</div>
                    <div className="question-header-card">
                      <h3>Question {question.questionNumber || (qIndex + 1)}</h3>
                      <div className="question-meta">
                        <span className="badge">{question.subject}</span>
                        <span className="marks">4 marks</span>
                      </div>
                    </div>

                    <div className="question-content">
                      <div className="question-text">
                        <div style={{display: 'flex', alignItems: 'flex-start', gap: '6px'}}>
                          <strong style={{color: '#111827', flexShrink: 0}}>Q{question.questionNumber || (qIndex + 1)}.</strong>
                          <span style={{flex: 1}}><LatexRenderer content={question.question} /></span>
                        </div>
                        {question.questionImage && (
                          <div className="question-image-container">
                            <img 
                              src={question.questionImage} 
                              alt={`Question ${question.questionNumber || (qIndex + 1)}`} 
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
            questions={test.questions}
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
