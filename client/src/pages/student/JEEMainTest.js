import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Card, Button } from '../../components/ui';
import LatexRenderer from '../../components/LatexRenderer';
import './JEEMainTest.css';
import { API_URL } from '../../services/api';

// Helper to ensure option/question image URLs are absolute and publicly accessible
const resolveImageUrl = (url) => {
  if (!url) return null;
  try {
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
  } catch (e) {
    // ignore
  }
  return `${API_URL.replace('/api', '')}${url}`;
};

const JEEMainTest = () => {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [test, setTest] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState({});
  const [visited, setVisited] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(180 * 60); // 180 minutes in seconds
  const [showInstructions, setShowInstructions] = useState(true);
  const [loading, setLoading] = useState(true);
  const [isLandscape, setIsLandscape] = useState(true);
  const [isDemoTest, setIsDemoTest] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Time tracking per question
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [questionTimeTracking, setQuestionTimeTracking] = useState({});

  // Check if device is mobile and orientation
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testId]);

  // Enter fullscreen when test starts and prevent exit
  useEffect(() => {
    if (!showInstructions) {
      enterFullscreen();
      
      // Disable page scrolling - prevent body scroll only
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100vh';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      
      // Prevent ALL exit attempts
      const handleBeforeUnload = (e) => {
        e.preventDefault();
        e.returnValue = 'You must submit the test to exit. Test progress will be lost if you leave.';
        return e.returnValue;
      };

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && !showInstructions) {
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
        // Re-enable scrolling when test ends
        document.body.style.overflow = '';
        document.body.style.height = '';
        document.body.style.position = '';
        document.body.style.width = '';
        
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
  }, [showInstructions]);

  useEffect(() => {
    if (!showInstructions && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInstructions, timeRemaining]);

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
      const token = localStorage.getItem('token');
      const isDemo = location.pathname.includes('/demo-test/');
      setIsDemoTest(isDemo);
      
      let endpoint;
      let response;
      
      if (isDemo) {
        // For demo test, fetch from demo endpoint (no auth required)
        response = await axios.get(`${API_URL}/demo/test`);
        setTest(response.data.test);
      } else {
        // For regular test
        endpoint = `${API_URL}/tests/${testId}`;
        
        // If testId is "new", fetch from the /new endpoint to generate a new test
        if (testId === 'new') {
          endpoint = `${API_URL}/tests/new`;
        }
        
        response = await axios.get(endpoint, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        
        setTest(response.data.test);
        
        // If we generated a new test, update the URL with the actual test ID
        if (testId === 'new' && response.data.test._id) {
          window.history.replaceState(null, '', `/student/jee-main-test/${response.data.test._id}`);
        }
      }
      
      // Initialize visited for first question
      setVisited({ '0': true });
    } catch (error) {
      console.error('Failed to load test:', error);
      toast.error(error.response?.data?.message || 'Failed to load test');
      navigate('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Flatten all questions into a single array (1-75)
  const getAllQuestions = () => {
    if (!test) return [];
    
    // Handle demo test structure (flat questions array)
    if (test.questions && Array.isArray(test.questions)) {
      return test.questions.map((q, idx) => ({
        ...q,
        overallNumber: idx + 1
      }));
    }
    
    // Handle regular JEE test structure (nested by subject and section)
    if (!test.jeeMainStructure) return [];
    
    const allQuestions = [];
    const subjects = ['Physics', 'Chemistry', 'Mathematics'];
    
    subjects.forEach(subject => {
      // Section A - 20 MCQ questions
      const sectionA = test.jeeMainStructure[subject]?.sectionA || [];
      sectionA.forEach((q, idx) => {
        allQuestions.push({
          ...q,
          subject,
          section: 'A',
          subjectQuestionNumber: idx + 1,
          overallNumber: allQuestions.length + 1
        });
      });
      
      // Section B - 5 Numerical questions
      const sectionB = test.jeeMainStructure[subject]?.sectionB || [];
      sectionB.forEach((q, idx) => {
        allQuestions.push({
          ...q,
          subject,
          section: 'B',
          subjectQuestionNumber: idx + 1,
          overallNumber: allQuestions.length + 1
        });
      });
    });
    
    console.log('All questions:', allQuestions);
    console.log('First question:', allQuestions[0]);
    return allQuestions;
  };

  const getCurrentQuestion = () => {
    const allQuestions = getAllQuestions();
    return allQuestions[currentQuestionIndex];
  };

  const getQuestionKey = () => {
    return currentQuestionIndex.toString();
  };

  // Track time spent on a question before navigating away
  const trackQuestionTime = (fromIndex) => {
    if (questionStartTime === null) return;
    
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000); // Convert to seconds
    
    setQuestionTimeTracking(prev => {
      const existing = prev[fromIndex] || { visited: false, firstVisit: 0, revisits: [] };
      
      if (!existing.visited) {
        // First time visiting this question
        return {
          ...prev,
          [fromIndex]: {
            visited: true,
            firstVisit: timeSpent,
            revisits: []
          }
        };
      } else {
        // Revisiting the question
        return {
          ...prev,
          [fromIndex]: {
            ...existing,
            revisits: [...existing.revisits, timeSpent]
          }
        };
      }
    });
  };

  // Navigate to a question and track time
  const navigateToQuestion = (index) => {
    // Track time for current question before leaving
    trackQuestionTime(currentQuestionIndex);
    
    // Navigate to new question
    setCurrentQuestionIndex(index);
    const key = index.toString();
    setVisited(prev => ({ ...prev, [key]: true }));
    
    // Reset timer for new question
    setQuestionStartTime(Date.now());
  };

  const handleAnswer = (answer) => {
    const key = getQuestionKey();
    setAnswers(prev => ({ ...prev, [key]: answer }));
    setVisited(prev => ({ ...prev, [key]: true }));
  };

  const handleMarkForReview = () => {
    const key = getQuestionKey();
    setMarkedForReview(prev => ({ ...prev, [key]: !prev[key] }));
    setVisited(prev => ({ ...prev, [key]: true }));
  };

  const handleSaveAndNext = () => {
    const key = getQuestionKey();
    setVisited(prev => ({ ...prev, [key]: true }));
    navigateNext();
  };

  const handleClearResponse = () => {
    const key = getQuestionKey();
    setAnswers(prev => {
      const newAnswers = { ...prev };
      delete newAnswers[key];
      return newAnswers;
    });
  };

  const navigateNext = () => {
    const allQuestions = getAllQuestions();
    if (currentQuestionIndex < allQuestions.length - 1) {
      navigateToQuestion(currentQuestionIndex + 1);
    }
  };

  const jumpToQuestion = (index) => {
    navigateToQuestion(index);
  };

  // Jump to the first question of a given subject (Physics/Chemistry/Mathematics)
  const jumpToSubject = (subject) => {
    const allQuestions = getAllQuestions();
    // Try to find a question that already has a subject field (structured test)
    let idx = allQuestions.findIndex(q => q.subject === subject);
    if (idx !== -1) {
      jumpToQuestion(idx);
      return;
    }

    // Fallback for flat/demo tests: compute start index using per-subject count
    const total = allQuestions.length;
    // Prefer 25 if full JEE (75 questions), otherwise split evenly
    const per = total >= 75 ? 25 : Math.ceil(total / 3);
    const subjects = ['Physics', 'Chemistry', 'Mathematics'];
    const sIndex = subjects.indexOf(subject);
    if (sIndex === -1) return;
    idx = Math.min(sIndex * per, Math.max(0, total - 1));
    jumpToQuestion(idx);
  };

  // Determine subject name for a given question index (used to mark active tab)
  const getSubjectForIndex = (index) => {
    const allQuestions = getAllQuestions();
    if (!allQuestions || allQuestions.length === 0) return null;
    const q = allQuestions[index];
    if (q && q.subject) return q.subject;

    // Fallback when subject not present (demo/flat): derive by ranges
    const total = allQuestions.length;
    const per = total >= 75 ? 25 : Math.ceil(total / 3);
    if (index < per) return 'Physics';
    if (index < per * 2) return 'Chemistry';
    return 'Mathematics';
  };

  const getQuestionStatus = (index) => {
    const key = index.toString();
    
    const isMarked = markedForReview[key];
    const hasAnswer = answers[key];
    const isVisited = visited[key];
    
    // Match official JEE Main interface colors
    if (isMarked && hasAnswer) return 'marked'; // Purple - Marked and Answered
    if (isMarked && !hasAnswer) return 'marked-not-answered'; // Orange - Marked but not answered
    if (hasAnswer) return 'answered'; // Green - Answered
    if (isVisited && !hasAnswer) return 'not-answered'; // Red - Visited but not answered
    return 'not-visited'; // Gray - Not visited
  };

  const getStatusColor = (status) => {
    const colors = {
      'answered': 'bg-green-600 text-white', // Green for answered
      'not-answered': 'bg-red-600 text-white', // Red for visited but not answered
      'marked': 'bg-purple-600 text-white', // Purple for marked & answered
      'marked-not-answered': 'bg-orange-500 text-white', // Orange for marked but not answered
      'not-visited': 'bg-gray-300 text-gray-700' // Gray for not visited
    };
    return colors[status] || 'bg-gray-300 text-gray-700';
  };

  const getQuestionCount = (status) => {
    let count = 0;
    const totalQuestions = getAllQuestions().length;
    
    for (let i = 0; i < totalQuestions; i++) {
      if (getQuestionStatus(i) === status) {
        count++;
      }
    }
    return count;
  };

  const handleAutoSubmit = async () => {
    toast.info('Time is up! Submitting test...');
    await handleSubmit();
  };

  const handleSubmit = async () => {
    if (!window.confirm('Are you sure you want to submit the test?')) return;

    // Track time for the current question before submitting
    trackQuestionTime(currentQuestionIndex);

    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const allQuestions = getAllQuestions();
      const formattedAnswers = {};
      
      // Convert index-based answers to questionId-based answers for regular test
      // OR keep as index-based for demo test
      if (isDemoTest) {
        // For demo test, keep answers as index-based { 0: 'A', 1: 'B', etc }
        Object.keys(answers).forEach(key => {
          formattedAnswers[key] = answers[key];
        });
      } else {
        // For regular test, convert to questionId-based
        Object.keys(answers).forEach(key => {
          const index = parseInt(key);
          const question = allQuestions[index];
          if (question && question._id) {
            let answer = answers[key];
            
            // Convert letter answers (A, B, C, D) to numeric indices (0, 1, 2, 3)
            if (typeof answer === 'string' && answer.length === 1 && answer >= 'A' && answer <= 'Z') {
              answer = answer.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1, 'C' -> 2, 'D' -> 3
            }
            
            formattedAnswers[question._id] = answer;
          }
        });
      }

      let response;
      
      if (isDemoTest) {
        // Demo test submission - use submit-demo endpoint
        console.log('JEE Demo Test Submit - User from localStorage:', user);
        console.log('JEE Demo Test Submit - userId to send:', user._id || null);
        
        const submitPayload = {
          testId: test._id,
          testType: 'jee_demo',
          answers: formattedAnswers,
          timeSpent: (180 * 60) - timeRemaining,
          markedForReview: {},
          userId: user._id || null, // Include userId if logged in
          questionTimeTracking // Include detailed time tracking data
        };
        
        console.log('JEE Demo Test Submit - Payload:', { ...submitPayload, answers: `[${Object.keys(submitPayload.answers).length} answers]` });
        
        response = await axios.post(
          `${API_URL}/results/submit-demo`,
          submitPayload
        );
        
        console.log('JEE Demo Test Submit - Response:', response.data);
      } else {
        // Regular test submission
        response = await axios.post(
          `${API_URL}/results/submit`,
          {
            testId: test._id,
            answers: formattedAnswers,
            timeTaken: (180 * 60) - timeRemaining
          },
          { headers: token ? { Authorization: `Bearer ${token}` } : {} }
        );
      }

      // Exit fullscreen after successful submission (with delay to ensure navigation)
      setTimeout(() => {
        exitFullscreen();
      }, 100);
      
      toast.success('Test submitted successfully!');
      
      // Navigate to appropriate result page
      if (isDemoTest) {
        navigate(`/student/demo-result/${response.data.result.id}`);
      } else {
        navigate(`/student/result/${response.data.result.id}`);
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit test');
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return <div className="loading-spinner">Loading test...</div>;
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

  if (showInstructions) {
    return (
      <div className="jee-main-instructions min-h-screen bg-background p-6">
        <Card className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-center mb-6 text-primary">
            JEE Main Mock Test - Instructions
          </h1>

          {test?.instructions?.map((section, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-xl font-semibold mb-3 text-textPrimary">{section.title}</h2>
              <ul className="list-disc list-inside space-y-2">
                {section.points.map((point, idx) => (
                  <li key={idx} className="text-gray-700">{point}</li>
                ))}
              </ul>
            </div>
          ))}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">Question Paper Summary:</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {['Physics', 'Chemistry', 'Mathematics'].map(subject => (
                <div key={subject} className="bg-white p-3 rounded">
                  <h4 className="font-semibold text-primary">{subject}</h4>
                  <p className="text-sm">Section A: 20 MCQs (Compulsory)</p>
                  <p className="text-sm">Section B: 5 Numerical (Compulsory)</p>
                  <p className="text-sm font-semibold">Total: 100 Marks</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Important Notice - Strict Fullscreen Mode:</h3>
            <ul className="text-sm text-red-700 space-y-1">
              <li>• The test will start in <strong>mandatory fullscreen mode</strong></li>
              <li>• <strong>You CANNOT exit</strong> fullscreen in any way during the test</li>
              <li>• <strong>ALL keyboard shortcuts are disabled</strong> (ESC, F11, Alt+Tab, etc.)</li>
              <li>• <strong>Right-click menu is disabled</strong></li>
              <li>• <strong>Browser back button is disabled</strong></li>
              <li>• <strong>ONLY way to exit:</strong> Click the "SUBMIT TEST" button</li>
              <li>• Any attempt to exit will force re-entry to fullscreen</li>
            </ul>
          </div>

          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => navigate('/student/dashboard')}>
              Cancel
            </Button>
            <Button variant="success" onClick={() => setShowInstructions(false)}>
              I am ready to begin (Fullscreen) →
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const currentQuestion = getCurrentQuestion();

  return (
    <div className="jee-main-test bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <div className="jee-test-layout">
          {/* Question Panel */}
          <div className="jee-question-panel">
            <Card>
              {/* Question Header */}
              <div className="bg-gray-100 px-2 py-2 mb-4 border-b-2 border-gray-300">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-gray-800">
                      {currentQuestion?.subject || 'Physics'}
                    </h3>
                    <p className="text-xs text-gray-600">
                      Section {currentQuestion?.section || 'A'}: Question No. {currentQuestion?.questionNumber || (currentQuestionIndex + 1)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                      currentQuestion?.section === 'A' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {currentQuestion?.section === 'A' ? 'Negative Marking: -1' : 'No Negative Marking'}
                    </span>
                    <span className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">
                      Marks: +4
                    </span>
                  </div>
                </div>
              </div>

              {/* Section Tabs - jump to subject start */}
              <div className="px-2 mb-4">
                <div className="flex gap-2">
                  {['Physics', 'Chemistry', 'Mathematics'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => jumpToSubject(sub)}
                      className={`px-3 py-1 rounded-md font-semibold transition-all ${getSubjectForIndex(currentQuestionIndex) === sub ? 'bg-blue-600 text-white shadow' : 'bg-white border border-gray-300 text-gray-800 hover:bg-blue-50'}`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Content */}
              {currentQuestion ? (
                <div className="px-4">
                  <div className="mb-6">
                    <p className="text-xs text-gray-600">Question {currentQuestion?.questionNumber || (currentQuestionIndex + 1)}:</p>
                    
                    {/* Debug info - remove this after fixing */}
                    {!currentQuestion.question && (
                      <div className="bg-yellow-100 p-4 mb-4 rounded">
                        <p className="font-semibold text-yellow-800">⚠️ Debug Info:</p>
                        <pre className="text-xs mt-2 overflow-auto">{JSON.stringify(currentQuestion, null, 2)}</pre>
                      </div>
                    )}
                    
                    <div className="text-base leading-relaxed mb-6 min-h-[100px]">
                      {currentQuestion.question ? (
                        <>
                          <LatexRenderer 
                            content={currentQuestion.question.replace(/^(Physics|Chemistry|Mathematics)\s+(MCQ|Numerical)\s+Question\s+\d+:\s*/, '')} 
                          />
                          {currentQuestion.questionImage && (
                            <div className="mt-4">
                              <img 
                                src={resolveImageUrl(currentQuestion.questionImage)} 
                                alt="Question diagram" 
                                className="max-w-full max-h-80 object-contain border rounded shadow-sm"
                              />
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-red-500">Question text not available</p>
                      )}
                    </div>
                  </div>

                  {/* Options for MCQ (Section A) */}
                  {currentQuestion.section === 'A' && currentQuestion.options && (
                    <div className="space-y-6 mb-6">
                      {currentQuestion.options.map((option, index) => {
                        const optionLabel = String.fromCharCode(65 + index);
                        const key = getQuestionKey();
                        const isSelected = answers[key] === optionLabel;

                        return (
                          <div
                            key={index}
                            onClick={() => handleAnswer(optionLabel)}
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
                              <LatexRenderer content={option} />
                              {currentQuestion.optionImages && currentQuestion.optionImages[index] && (
                                <div className="mt-2 ml-8">
                                  <img 
                                    src={resolveImageUrl(currentQuestion.optionImages[index])} 
                                    alt={`Option ${optionLabel}`} 
                                    className="max-w-sm max-h-40 object-contain border rounded"
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Numerical Input (Section B) */}
                  {currentQuestion.section === 'B' && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Enter your answer (numerical value between 0 and 9999):
                      </label>
                      
                      {/* Answer Input - Top */}
                      <input
                        type="text"
                        inputMode="none"
                        value={answers[getQuestionKey()] || ''}
                        onChange={(e) => handleAnswer(e.target.value)}
                        className="w-full max-w-xs px-4 py-3 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-xl text-center font-semibold mb-3"
                        placeholder="Enter numerical value"
                        readOnly
                      />
                      <p className="text-xs text-gray-500 mb-3">
                        * Use decimal point if needed (e.g., 12.5, 0.33). Round off to 2 decimal places.
                      </p>
                      
                      {/* Virtual Numpad - Below input (3-column keypad) */}
                      <div className="bg-gray-100 p-3 rounded-lg virtual-numpad" style={{ width: '200px' }}>
                        <div className="virtual-numpad-grid">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                              key={num}
                              onClick={() => {
                                const currentValue = answers[getQuestionKey()] || '';
                                if (currentValue.length < 6) {
                                  handleAnswer(currentValue + num);
                                }
                              }}
                              className="vn-btn"
                            >
                              {num}
                            </button>
                          ))}

                          {/* Last row: 0 and Enter (Enter spans two columns) */}
                          <button
                            onClick={() => {
                              const currentValue = answers[getQuestionKey()] || '';
                              if (currentValue.length < 6) {
                                handleAnswer(currentValue + '0');
                              }
                            }}
                            className="vn-btn"
                          >
                            0
                          </button>

                          <button
                            onClick={() => handleAnswer('')}
                            className="vn-btn enter-btn"
                          >
                            Enter
                          </button>
                        </div>

                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => {
                              const currentValue = answers[getQuestionKey()] || '';
                              handleAnswer(currentValue.slice(0, -1));
                            }}
                            className="flex-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white border border-red-600 rounded py-2 text-sm font-semibold transition-colors"
                          >
                            ⌫
                          </button>
                          <button
                            onClick={() => handleAnswer('')}
                            className="flex-1 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white border border-orange-600 rounded py-2 text-xs font-semibold transition-colors"
                          >
                            Clear All
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="px-4">
                  <div className="bg-red-100 p-4 rounded">
                    <p className="text-red-800 font-semibold">⚠️ No question found at index {currentQuestionIndex}</p>
                    <p className="text-sm mt-2">Total questions loaded: {getAllQuestions().length}</p>
                  </div>
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
                      Mark for Review
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
                    {currentQuestionIndex === getAllQuestions().length - 1 ? (
                      <button
                        onClick={handleSubmit}
                        className="px-5 py-2 bg-red-600 text-white rounded font-medium hover:bg-red-700 transition-all"
                      >
                        Submit Test
                      </button>
                    ) : (
                      <button
                        onClick={navigateNext}
                        className="px-5 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 transition-all"
                      >
                        Next →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
                  

          {/* Palette Panel */}
          <div className="jee-palette-panel">
            <Card className="sticky top-24">
              {/* Profile Section */}
              <div className="bg-gray-100 px-4 py-3 mb-4 border-b-2 border-gray-300">
                <h3 className="font-bold text-sm text-gray-800">Candidate Name</h3>
                <p className="text-xs text-gray-600">Roll No: XXXXXXXX</p>
              </div>

              {/* Submit Button - Moved to top */}
              <div className="mb-4 px-2">
                <button
                  onClick={handleSubmit}
                  className="w-full bg-red-600 text-white py-3 rounded font-bold text-sm hover:bg-red-700 transition-all"
                >
                  SUBMIT TEST
                </button>
              </div>

              {/* Timer */}
              <div className="bg-gray-800 text-white px-4 py-3 mb-4 text-center">
                <p className="text-xs mb-1">Time Left</p>
                <div className={`text-2xl font-bold ${timeRemaining < 600 ? 'text-red-400' : ''}`}>
                  {formatTime(timeRemaining)}
                </div>
              </div>

              {/* Question Palette Grid - All 75 Questions */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-3 px-2">Question Palette:</p>
                <div className="grid grid-cols-5 gap-2 px-2 max-h-96 overflow-y-auto question-palette-grid">
                  {getAllQuestions().map((q, index) => {
                    const status = getQuestionStatus(index);
                    const isActive = index === currentQuestionIndex;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => jumpToQuestion(index)}
                        className={`w-full aspect-square rounded font-bold text-sm transition-all question-palette-btn ${
                          getStatusColor(status)
                        } ${isActive ? 'ring-4 ring-blue-400 ring-offset-2' : ''} hover:scale-110`}
                      >
                        {q?.questionNumber || (index + 1)}
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

            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JEEMainTest;