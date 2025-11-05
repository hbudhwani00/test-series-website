import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { testService, resultService } from '../../services/api';
import Card from '../../components/ui/Card';
import './TakeTest.css';

const TakeTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visitedQuestions, setVisitedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [startTime] = useState(Date.now());
  const [loading, setLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    fetchTest();
  }, [testId]);

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
    if (test && test.questions.length > 0) {
      // Mark first question as visited
      setVisitedQuestions({ 0: true });
      
      // Enter fullscreen when test is loaded
      enterFullscreen();
      
      // Prevent ALL exit attempts
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'You must submit the test to exit. Test progress will be lost if you leave.';
        return e.returnValue;
      };

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && test) {
          // Force re-enter fullscreen immediately
          toast.error('Fullscreen mode is mandatory! Re-entering fullscreen...');
          setTimeout(() => enterFullscreen(), 50);
        }
      };

      // Prevent ALL keyboard shortcuts
      const handleKeyDown = (e) => {
        // Block F11, Escape, Alt+Tab, Windows Key, Alt+F4, Ctrl+W, Ctrl+T, etc.
        if (
          e.key === 'F11' || 
          e.key === 'Escape' || 
          e.keyCode === 27 || // Escape keyCode
          e.which === 27 ||   // Escape which
          e.key === 'Meta' || 
          e.key === 'Alt' ||
          (e.altKey && e.key === 'Tab') ||
          (e.altKey && e.key === 'F4') ||
          (e.ctrlKey && e.key === 'w') ||
          (e.ctrlKey && e.key === 't') ||
          (e.ctrlKey && e.key === 'n') ||
          (e.ctrlKey && e.shiftKey && e.key === 'N') ||
          e.keyCode === 91 || // Windows key
          e.keyCode === 92 || // Windows key
          e.keyCode === 93    // Context menu key
        ) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          toast.warning('Keyboard shortcuts are disabled during the test. Use Submit button to exit.');
          return false;
        }
      };

      const handleKeyPress = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27 || e.which === 27) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      };

      const handleKeyUp = (e) => {
        if (e.key === 'Escape' || e.keyCode === 27 || e.which === 27) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          return false;
        }
      };

      // Prevent right-click context menu
      const handleContextMenu = (e) => {
        e.preventDefault();
        toast.warning('Right-click is disabled during the test');
        return false;
      };

      // Prevent browser back button
      const handlePopState = (e) => {
        e.preventDefault();
        window.history.pushState(null, '', window.location.href);
        toast.warning('Navigation is disabled. Use Submit button to exit the test.');
      };

      // Push initial state
      window.history.pushState(null, '', window.location.href);

      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);
      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('keypress', handleKeyPress, true);
      document.addEventListener('keyup', handleKeyUp, true);
      window.addEventListener('keydown', handleKeyDown, true);
      window.addEventListener('keypress', handleKeyPress, true);
      window.addEventListener('keyup', handleKeyUp, true);
      document.addEventListener('contextmenu', handleContextMenu);
      window.addEventListener('popstate', handlePopState);

      return () => {
        window.removeEventListener('beforeunload', handleBeforeUnload);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        document.removeEventListener('keydown', handleKeyDown, true);
        document.removeEventListener('keypress', handleKeyPress, true);
        document.removeEventListener('keyup', handleKeyUp, true);
        window.removeEventListener('keydown', handleKeyDown, true);
        window.removeEventListener('keypress', handleKeyPress, true);
        window.removeEventListener('keyup', handleKeyUp, true);
        document.removeEventListener('contextmenu', handleContextMenu);
        window.removeEventListener('popstate', handlePopState);
      };
    }
  }, [test]);

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

  // Fullscreen functions
  const enterFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log('Error attempting to enable fullscreen:', err);
      });
    } else if (elem.webkitRequestFullscreen) { /* Safari */
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { /* IE11 */
      elem.msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.fullscreenElement || document.webkitFullscreenElement || 
          document.mozFullScreenElement || document.msFullscreenElement) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => console.log('Fullscreen exit error:', err));
        } else if (document.webkitExitFullscreen) { /* Safari */
          document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) { /* Firefox */
          document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) { /* IE11 */
          document.msExitFullscreen();
        }
      }
    } catch (err) {
      console.log('Error exiting fullscreen:', err);
    }
  };

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

  const handleSaveAndNext = () => {
    if (currentQuestion < test.questions.length - 1) {
      const nextIndex = currentQuestion + 1;
      setCurrentQuestion(nextIndex);
      setVisitedQuestions({ ...visitedQuestions, [nextIndex]: true });
    }
  };

  const handleMarkForReview = () => {
    const questionId = test.questions[currentQuestion]?.questionId._id;
    setMarkedForReview({
      ...markedForReview,
      [questionId]: !markedForReview[questionId],
    });
    handleSaveAndNext();
  };

  const handleClearResponse = () => {
    const questionId = test.questions[currentQuestion]?.questionId._id;
    const newAnswers = { ...answers };
    delete newAnswers[questionId];
    setAnswers(newAnswers);
  };

  const jumpToQuestion = (index) => {
    setCurrentQuestion(index);
    setVisitedQuestions({ ...visitedQuestions, [index]: true });
  };

  const getQuestionStatus = (index) => {
    const questionId = test.questions[index]?.questionId._id;
    const isMarked = markedForReview[questionId];
    const hasAnswer = answers[questionId];
    const isVisited = visitedQuestions[index];

    if (isMarked && hasAnswer) return 'marked';
    if (isMarked && !hasAnswer) return 'marked-not-answered';
    if (hasAnswer) return 'answered';
    if (isVisited && !hasAnswer) return 'not-answered';
    return 'not-visited';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'answered':
        return 'bg-green-600 text-white';
      case 'not-answered':
        return 'bg-red-600 text-white';
      case 'marked':
        return 'bg-purple-600 text-white';
      case 'marked-not-answered':
        return 'bg-orange-500 text-white';
      case 'not-visited':
        return 'bg-gray-300 text-gray-700';
      default:
        return 'bg-gray-300 text-gray-700';
    }
  };

  const getQuestionCount = (status) => {
    return test.questions.filter((_, index) => getQuestionStatus(index) === status).length;
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

        // Exit fullscreen after successful submission (with delay to ensure navigation)
        setTimeout(() => {
          exitFullscreen();
        }, 100);

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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-xl text-gray-600">Loading test...</p>
        </div>
      </div>
    );
  }

  // Show rotation prompt for mobile devices in portrait mode
  if (isMobile && !isLandscape) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700">
        <div className="text-center text-white p-8 max-w-md mx-4">
          <div className="mb-6 flex justify-center">
            <svg 
              className="w-24 h-24 animate-spin-slow" 
              style={{ animation: 'spin 3s linear infinite' }}
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor"
            >
              <rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="2"/>
              <path d="M12 2v3M12 19v3" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-4">Please Rotate Your Device</h2>
          <p className="text-lg opacity-90 mb-2">
            This test requires landscape mode for better visibility
          </p>
          <p className="text-sm opacity-75">
            Rotate your phone horizontally to continue
          </p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center py-8">
          <p className="text-xl text-red-600">Test not found</p>
        </div>
      </div>
    );
  }

  const question = test.questions[currentQuestion]?.questionId;

  return (
    <div className="min-h-screen bg-gray-50" style={{ paddingTop: 0 }}>
      {/* Header - Fixed at top, no Navbar interference */}
      <div className="bg-white border-b-2 border-gray-200 fixed top-0 left-0 right-0 z-20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-800">{test.title}</h2>
              <p className="text-sm text-gray-600">{test.description}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-600 animate-pulse' : 'text-blue-600'}`}>
                {formatTime(timeLeft)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4" style={{ marginTop: '80px' }}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 test-layout-grid">
          {/* Left Panel - Main Question Area */}
          <div className="lg:col-span-2 order-2 lg:order-1 question-panel">
            <Card>
              {/* Question Header */}
              <div className="bg-gray-100 px-4 py-3 mb-4 border-b-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-base font-bold text-gray-800">
                      Question No. {currentQuestion + 1}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {question?.questionType === 'single' && 'Single Choice'}
                      {question?.questionType === 'multiple' && 'Multiple Choice'}
                      {question?.questionType === 'numerical' && 'Numerical Type'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                      Marks: {question?.marks || 4}
                    </span>
                    {question?.negativeMarks && (
                      <span className="px-3 py-1 rounded text-xs font-semibold bg-red-100 text-red-800">
                        Negative: -{question.negativeMarks}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Question Content */}
              {question && (
                <div className="px-4">
                  <div className="mb-6">
                    <p className="text-sm text-gray-600 mb-2">Question:</p>
                    <div 
                      className="text-base leading-relaxed mb-6 min-h-[100px]"
                      dangerouslySetInnerHTML={{ __html: question.question }}
                    />
                  </div>

                  {/* Options for MCQ */}
                  {(question.questionType === 'single' || question.questionType === 'multiple') && question.options && (
                    <div className="space-y-2 mb-6">
                      {question.options.map((option, index) => {
                        const optionLabel = String.fromCharCode(65 + index);
                        const isSelected = question.questionType === 'multiple'
                          ? answers[question._id]?.answer?.includes(optionLabel)
                          : answers[question._id]?.answer === optionLabel;

                        return (
                          <div
                            key={index}
                            onClick={() => {
                              if (question.questionType === 'multiple') {
                                const currentAnswers = answers[question._id]?.answer || [];
                                const newAnswers = currentAnswers.includes(optionLabel)
                                  ? currentAnswers.filter((a) => a !== optionLabel)
                                  : [...currentAnswers, optionLabel];
                                handleAnswerChange(question._id, newAnswers);
                              } else {
                                handleAnswerChange(question._id, optionLabel);
                              }
                            }}
                            className={`flex items-start p-3 rounded border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'
                            }`}
                          >
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 ${
                              isSelected 
                                ? 'border-blue-500 bg-blue-500' 
                                : 'border-gray-400 bg-white'
                            }`}>
                              {isSelected && (
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-semibold mr-2">({optionLabel})</span>
                              <span>{option}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Numerical Input */}
                  {question.questionType === 'numerical' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Enter your answer (numerical value):
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={answers[question._id]?.answer || ''}
                        onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                        className="w-full max-w-md px-4 py-2 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-lg"
                        placeholder="Enter numerical value"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        * Use decimal point if needed (e.g., 12.5, 0.33). Round off to 2 decimal places.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Navigation Buttons - Official NTA Style */}
              <div className="border-t-2 border-gray-200 px-4 py-4 mt-6">
                <div className="flex flex-wrap justify-between items-center gap-3">
                  <div className="flex gap-2">
                    <button
                      onClick={handleMarkForReview}
                      className="px-5 py-2 bg-orange-500 text-white rounded font-medium hover:bg-orange-600 transition-all"
                    >
                      Mark for Review & Next
                    </button>
                    <button
                      onClick={handleClearResponse}
                      className="px-5 py-2 bg-gray-200 text-gray-700 rounded font-medium hover:bg-gray-300 transition-all"
                    >
                      Clear Response
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveAndNext}
                      className="px-6 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700 transition-all"
                    >
                      Save & Next
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Panel - Question Palette (Official NTA Style) */}
          <div className="lg:col-span-1 order-1 lg:order-2 palette-panel">
            <Card className="sticky top-24">
              {/* Profile Section */}
              <div className="bg-gray-100 px-4 py-3 mb-4 border-b-2 border-gray-300">
                <h3 className="font-bold text-sm text-gray-800">Test Progress</h3>
                <p className="text-xs text-gray-600">Total: {test.questions.length} Questions</p>
              </div>

              {/* Timer */}
              <div className="bg-gray-800 text-white px-4 py-3 mb-4 text-center">
                <p className="text-xs mb-1">Time Left</p>
                <div className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-400' : ''}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>

              {/* Question Palette Grid */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-3 px-2">Question Palette:</p>
                <div className="grid grid-cols-5 gap-2 px-2">
                  {test.questions.map((q, index) => {
                    const status = getQuestionStatus(index);
                    const isActive = index === currentQuestion;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => jumpToQuestion(index)}
                        className={`w-full aspect-square rounded font-bold text-sm transition-all ${
                          getStatusColor(status)
                        } ${isActive ? 'ring-4 ring-blue-400 ring-offset-2' : ''} hover:scale-110`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Legend - Official NTA Colors */}
              <div className="border-t-2 border-gray-200 pt-4 px-2">
                <p className="text-xs font-semibold text-gray-600 mb-3">Legend:</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-green-600 rounded flex items-center justify-center text-white font-bold">1</div>
                    <span>Answered ({getQuestionCount('answered')})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center text-white font-bold">2</div>
                    <span>Not Answered ({getQuestionCount('not-answered')})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-gray-700 font-bold">3</div>
                    <span>Not Visited ({getQuestionCount('not-visited')})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-600 rounded flex items-center justify-center text-white font-bold">4</div>
                    <span>Marked & Answered ({getQuestionCount('marked')})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center text-white font-bold">5</div>
                    <span>Marked (Not Answered) ({getQuestionCount('marked-not-answered')})</span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="mt-6 px-2">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-red-600 text-white py-3 rounded font-bold text-sm hover:bg-red-700 transition-all"
                >
                  SUBMIT TEST
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TakeTest;
