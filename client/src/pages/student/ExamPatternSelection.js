import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { API_URL } from '../../services/api';

const ExamPatternSelection = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // If no token, user is not logged in - show no subscriptions
      if (!token) {
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      const response = await axios.get("${API_URL}/payment/subscription-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSubscriptions(response.data.subscriptions);
    } catch (error) {
      console.error('Subscription fetch error:', error);
      // If error, assume no subscriptions
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const getAvailablePatterns = () => {
    const patterns = [];

    subscriptions.forEach(sub => {
      if (sub.isActive && new Date(sub.expiryDate) > new Date()) {
        if (sub.examType === 'JEE_MAIN') {
          // Only JEE Main pattern
          if (!patterns.find(p => p.type === 'JEE_MAIN')) {
            patterns.push({
              type: 'JEE_MAIN',
              name: 'JEE Main',
              icon: '📐',
              description: 'Official JEE Main 2026 Pattern',
              details: [
                '75 Questions (25 each: Physics, Chemistry, Mathematics)',
                '20 MCQs (One Correct Out of Four) - 4 marks, -1 negative',
                '5 Numerical Answer Questions - 4 marks, no negative',
                'Total: 300 marks',
                'Duration: 3 hours'
              ],
              color: 'blue'
            });
          }
        } else if (sub.examType === 'JEE_MAIN_ADVANCED') {
          // Both JEE Main and Advanced patterns
          if (!patterns.find(p => p.type === 'JEE_MAIN')) {
            patterns.push({
              type: 'JEE_MAIN',
              name: 'JEE Main',
              icon: '📐',
              description: 'Official JEE Main 2026 Pattern',
              details: [
                '75 Questions (25 each: Physics, Chemistry, Mathematics)',
                '20 MCQs (One Correct Out of Four) - 4 marks, -1 negative',
                '5 Numerical Answer Questions - 4 marks, no negative',
                'Total: 300 marks',
                'Duration: 3 hours'
              ],
              color: 'blue'
            });
          }
          if (!patterns.find(p => p.type === 'JEE_ADVANCED')) {
            patterns.push({
              type: 'JEE_ADVANCED',
              name: 'JEE Advanced',
              icon: '🎓',
              description: 'Official JEE Advanced Pattern',
              details: [
                'Two Papers: Paper 1 and Paper 2',
                'Each paper: 3 subjects (Physics, Chemistry, Mathematics)',
                'Multiple question types: MCQ, Multiple Correct, Integer',
                'Each paper: 3 hours',
                'Negative marking varies by question type'
              ],
              color: 'purple'
            });
          }
        } else if (sub.examType === 'NEET') {
          if (!patterns.find(p => p.type === 'NEET')) {
            patterns.push({
              type: 'NEET',
              name: 'NEET',
              icon: '🔬',
              description: 'Official NEET Pattern',
              details: [
                '180 Questions (Physics, Chemistry, Biology)',
                'Section A: 35 MCQs per subject (4 marks, -1 negative)',
                'Section B: 15 MCQs per subject (Attempt any 10)',
                'Total: 720 marks',
                'Duration: 3 hours 20 minutes'
              ],
              color: 'green'
            });
          }
        }
      }
    });

    return patterns;
  };

  const handlePatternSelect = async (patternType) => {
    if (patternType === 'JEE_MAIN') {
      // Directly start the demo test (no modal, no login required)
      await handleStartTest();
    } else if (patternType === 'JEE_ADVANCED') {
      toast.info('JEE Advanced pattern coming soon!');
    } else if (patternType === 'NEET') {
      toast.info('NEET pattern coming soon!');
    }
  };

  const handleDemoTest = async () => {
    try {
      // Use the permanent demo test endpoint
      const response = await axios.get("${API_URL}/demo/test');
      console.log('Demo test response:', response.data);
      
      if (!response.data.test) {
        toast.error('Demo test not available. Please contact admin.');
        return;
      }
      
      navigate(`/student/demo-test/${response.data.test._id}`);
    } catch (error) {
      console.error('Demo test error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 'Failed to load demo test';
      toast.error(errorMsg);
      
      if (errorMsg.includes('No demo test available')) {
        toast.error('Demo test is not set up yet. Please contact admin.', {
          duration: 5000
        });
      }
    }
  };

  const handleStartTest = async () => {
    // Always start demo test (no login required)
    await handleDemoTest();
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  const availablePatterns = getAvailablePatterns();

  // Show demo test option for everyone (logged in or not)
  const showDemoOnly = availablePatterns.length === 0;

  if (showDemoOnly) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2">Try JEE Main Demo Test</h1>
            <p className="text-gray-600">Experience our test platform with a free demo test</p>
          </div>

          <Card className="p-8">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🎯</div>
              <h2 className="text-2xl font-bold mb-2">JEE Main 2026 Demo Test</h2>
              <p className="text-gray-600 mb-4">Complete Official Pattern - Free Access</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-bold mb-3 text-lg">Test Details:</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>75 Questions (25 each: Physics, Chemistry, Mathematics)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>20 MCQs + 5 Numerical per subject</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Total: 300 marks</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Duration: 3 hours (180 minutes)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>Official JEE Main 2026 Pattern</span>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold mb-3 text-lg">Why Try Demo?</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Experience our question quality</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Get familiar with the test interface</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>Real exam-like experience</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">✓</span>
                    <span>No registration required</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">ℹ</span>
                    <span className="font-semibold">Completely Free</span>
                  </li>
                </ul>
              </div>
            </div>

            <Button 
              onClick={handleDemoTest} 
              size="lg" 
              className="w-full mb-4"
            >
              Start Free Demo Test
            </Button>

            <div className="text-center pt-4 border-t">
              <p className="text-gray-600 mb-3">
                Want unlimited tests with fresh questions every time?
              </p>
              <Button 
                onClick={() => navigate('/student/subscription')} 
                variant="secondary"
                size="sm"
              >
                View Subscription Plans
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Select Test Type</h1>
          <p className="text-gray-600">Choose the official exam pattern or create a custom test</p>
        </div>

        {/* Official Patterns */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {availablePatterns.map((pattern) => (
            <Card 
              key={pattern.type} 
              className="p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 hover:border-primary"
              onClick={() => handlePatternSelect(pattern.type)}
            >
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">{pattern.icon}</div>
                <h3 className="text-2xl font-bold mb-2">{pattern.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{pattern.description}</p>
              </div>

              <ul className="space-y-2 mb-6">
                {pattern.details.map((detail, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start">
                    <span className="text-primary mr-2">✓</span>
                    <span>{detail}</span>
                  </li>
                ))}
              </ul>

              <Button className="w-full" size="lg" onClick={() => handlePatternSelect(pattern.type)}>
                Start {pattern.name} Test
              </Button>
            </Card>
          ))}
        </div>

        {/* AI Powered Test & Test Series */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-6 text-center">Additional Test Options</h2>
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* AI Powered Test */}
            <Card className="p-6 hover:shadow-xl transition-shadow border-2 hover:border-purple-500">
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">🤖</div>
                <h3 className="text-2xl font-bold mb-2 text-purple-600">AI Powered Test</h3>
                <p className="text-sm text-gray-600 mb-4">Personalized based on your performance</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="text-sm text-gray-700 flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Questions from topics you got wrong</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Focus on unattempted topics</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Adaptive difficulty based on your level</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Personalized learning path</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start">
                  <span className="text-purple-500 mr-2">✓</span>
                  <span>Smart revision suggestions</span>
                </li>
              </ul>

              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700" 
                size="lg"
                onClick={() => navigate('/student/ai-test')}
              >
                Generate AI Test
              </Button>
            </Card>

            {/* Test Series */}
            <Card className="p-6 hover:shadow-xl transition-shadow border-2 hover:border-green-500">
              <div className="text-center mb-4">
                <div className="text-6xl mb-3">📅</div>
                <h3 className="text-2xl font-bold mb-2 text-green-600">Test Series</h3>
                <p className="text-sm text-gray-600 mb-4">Scheduled tests by admin</p>
              </div>

              <ul className="space-y-2 mb-6">
                <li className="text-sm text-gray-700 flex items-start">
                  <span className="text-green-500 mr-2">📌</span>
                  <span className="font-semibold">Sunday Full Test</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start pl-6">
                  <span className="text-gray-500 mr-2">•</span>
                  <span>3 hours, Full syllabus coverage</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start pl-6">
                  <span className="text-gray-500 mr-2">•</span>
                  <span>75 questions (MCQ + Numerical)</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start mt-3">
                  <span className="text-green-500 mr-2">📌</span>
                  <span className="font-semibold">Alternate Day Test</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start pl-6">
                  <span className="text-gray-500 mr-2">•</span>
                  <span>1 hour, 30 MCQs (10 per subject)</span>
                </li>
                <li className="text-sm text-gray-700 flex items-start pl-6">
                  <span className="text-gray-500 mr-2">•</span>
                  <span>No numerical questions</span>
                </li>
              </ul>

              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                size="lg"
                onClick={() => navigate('/student/test-series')}
              >
                View Test Series
              </Button>
            </Card>

          </div>
        </div>

        {/* Active Subscriptions Info */}
        {subscriptions.length > 0 && (
          <Card className="mt-6 p-6 bg-green-50">
            <h3 className="font-bold text-lg mb-3 text-green-800">✅ Your Active Subscriptions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {subscriptions.map((sub, idx) => (
                <div key={idx} className="p-3 bg-white rounded-lg shadow-sm">
                  <div className="font-bold">{sub.examType.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-gray-600">
                    Expires: {new Date(sub.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ExamPatternSelection;

