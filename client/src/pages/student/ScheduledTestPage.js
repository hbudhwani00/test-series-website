import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import LatexRenderer from '../../components/LatexRenderer';
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
      const { data } = await axios.get(`${API_URL}/scheduled-tests/student/test/${testId}`, {
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
        `${API_URL}/scheduled-tests/submit`,
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
    <div className="jee-main-test bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4">
        <div className="jee-test-layout">
          {/* Question Panel */}
          <div className="jee-question-panel">
            <div className="bg-gray-100 px-2 py-2 mb-4 border-b-2 border-gray-300">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-gray-800">{test.subject || 'All Subjects'}</h3>
                  <p className="text-xs text-gray-600">{test.title} • {test.examType}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="px-3 py-1 rounded text-xs font-semibold bg-green-100 text-green-800">Time: {formatTime(timeRemaining)}</div>
                  <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleSubmit}>Submit Test</button>
                </div>
              </div>
            </div>

            <div className="px-4">
              <div className="mb-6">
                <p className="text-xs text-gray-600">Question {currentQuestion.questionNumber || (currentQuestionIndex + 1)}:</p>
                <div className="text-base leading-relaxed mb-6 min-h-[100px]">
                  <LatexRenderer content={currentQuestion.question} />
                  {currentQuestion.questionImage && (
                    <div className="mt-4">
                      <img src={currentQuestion.questionImage} alt="Question diagram" className="max-w-full max-h-80 object-contain border rounded shadow-sm" />
                    </div>
                  )}
                </div>
              </div>

              {currentQuestion.questionType === 'mcq' && (
                <div className="space-y-6 mb-6">
                  {currentQuestion.options.map((option, idx) => (
                    <div key={idx} onClick={() => handleAnswerSelect(idx)} className={`flex items-start p-3 rounded border-2 cursor-pointer transition-all ${answers[currentQuestionIndex] === String.fromCharCode(65 + idx) ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-300 hover:bg-gray-50'}`}>
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 mt-0.5 ${answers[currentQuestionIndex] === String.fromCharCode(65 + idx) ? 'border-blue-500 bg-blue-500' : 'border-gray-400 bg-white'}`}>
                        {answers[currentQuestionIndex] === String.fromCharCode(65 + idx) && <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold mr-2">({String.fromCharCode(65 + idx)})</span>
                        <LatexRenderer content={option} />
                        {currentQuestion.optionImages && currentQuestion.optionImages[idx] && (
                          <div className="mt-2 ml-8">
                            <img src={currentQuestion.optionImages[idx]} alt={`Option ${String.fromCharCode(65 + idx)}`} className="max-w-sm max-h-40 object-contain border rounded" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {currentQuestion.questionType !== 'mcq' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-2 text-gray-700">Enter your answer (numerical):</label>
                  <input type="text" value={answers[currentQuestionIndex] || ''} onChange={(e) => handleNumericalAnswer(e.target.value)} className="w-full max-w-xs px-4 py-3 border-2 border-gray-300 rounded focus:border-blue-500 focus:outline-none text-xl text-center font-semibold" />
                </div>
              )}

              <div className="border-t-2 border-gray-200 px-4 py-4 mt-6">
                <div className="flex gap-2">
                  <button onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))} className="px-5 py-2 bg-gray-200 text-gray-700 rounded">Previous</button>
                  <button onClick={() => setAnswers({ ...answers, [currentQuestionIndex]: answers[currentQuestionIndex] || null })} className="px-5 py-2 bg-gray-200 text-gray-700 rounded">Clear Response</button>
                  <button onClick={() => setCurrentQuestionIndex(Math.min(totalQuestions - 1, currentQuestionIndex + 1))} className="px-5 py-2 bg-blue-600 text-white rounded">Next →</button>
                </div>
              </div>
            </div>
          </div>

          {/* Palette Panel */}
          <div className="jee-palette-panel">
            <div className="sticky top-24 bg-white p-4 border rounded">
              <div className="mb-4 px-2">
                <button onClick={toggleFullscreen} className="w-full bg-gray-100 py-2 rounded mb-2">{isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}</button>
                <button onClick={handleSubmit} className="w-full bg-red-600 text-white py-2 rounded">SUBMIT TEST</button>
              </div>

              <div className="bg-gray-800 text-white px-4 py-3 mb-4 text-center">
                <p className="text-xs mb-1">Time Left</p>
                <div className={`text-2xl font-bold ${timeRemaining < 600 ? 'text-red-400' : ''}`}>{formatTime(timeRemaining)}</div>
              </div>

              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-600 mb-3 px-2">Question Palette:</p>
                <div className="grid grid-cols-5 gap-2 px-2 max-h-96 overflow-y-auto question-palette-grid">
                  {test.questions.map((q, index) => (
                    <button key={index} onClick={() => setCurrentQuestionIndex(index)} className={`w-full aspect-square rounded font-bold text-sm transition-all question-palette-btn ${currentQuestionIndex === index ? 'ring-4 ring-blue-400 ring-offset-2' : ''} ${answers[index] !== undefined ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
                      {q.questionNumber || (index + 1)}
                    </button>
                  ))}
                </div>
              </div>


            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduledTestPage;

