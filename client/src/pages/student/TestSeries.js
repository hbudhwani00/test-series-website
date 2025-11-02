import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const TestSeries = () => {
  const [sundayTests, setSundayTests] = useState([]);
  const [alternateDayTests, setAlternateDayTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTestSeries();
  }, []);

  const fetchTestSeries = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('Please login to access test series');
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/test-series/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setSundayTests(response.data.sundayTests || []);
      setAlternateDayTests(response.data.alternateDayTests || []);
    } catch (error) {
      console.error('Error fetching test series:', error);
      toast.error('Failed to load test series');
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = (test) => {
    // If test has questions (new system), use ScheduledTestPage
    if (test.hasQuestions) {
      navigate(`/student/scheduled-test/${test.scheduledTestId}`);
    } else {
      // Old system - use existing JEE Main test page
      navigate(`/student/jee-main-test/${test._id}`);
    }
  };

  const getTestStatus = (test) => {
    const now = new Date();
    const scheduledDate = new Date(test.scheduledDate);
    const endDate = new Date(scheduledDate.getTime() + test.duration * 60000);

    if (now < scheduledDate) {
      return { status: 'upcoming', label: 'Upcoming', color: 'blue' };
    } else if (now >= scheduledDate && now <= endDate) {
      return { status: 'live', label: 'Live Now', color: 'green' };
    } else {
      return { status: 'completed', label: 'Completed', color: 'gray' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test series...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">📅</div>
          <h1 className="text-4xl font-bold mb-2">Test Series</h1>
          <p className="text-gray-600">Scheduled tests by admin - Practice like the real exam</p>
        </div>

        {/* Sunday Full Tests */}
        <div className="mb-10">
          <div className="flex items-center mb-4">
            <h2 className="text-3xl font-bold text-green-700">Sunday Full Tests</h2>
            <span className="ml-3 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
              3 Hours • Full Syllabus
            </span>
          </div>
          
          <p className="text-gray-600 mb-6">
            Complete JEE Main pattern test every Sunday - 75 questions covering all subjects with MCQs and Numerical questions
          </p>

          {sundayTests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No Sunday tests scheduled yet. Check back soon!</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sundayTests.map((test) => {
                const testStatus = getTestStatus(test);
                return (
                  <Card key={test._id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">{test.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold bg-${testStatus.color}-100 text-${testStatus.color}-800`}>
                        {testStatus.label}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>{new Date(test.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🕐</span>
                        <span>{new Date(test.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">⏱️</span>
                        <span>{test.duration} minutes</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📝</span>
                        <span>75 Questions • 300 Marks</span>
                      </div>
                    </div>

                    {testStatus.status === 'live' && (
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700"
                        onClick={() => handleStartTest(test)}
                      >
                        Start Test Now
                      </Button>
                    )}
                    {testStatus.status === 'upcoming' && (
                      <Button 
                        className="w-full" 
                        variant="secondary"
                        disabled
                      >
                        Starts {new Date(test.scheduledDate).toLocaleDateString()}
                      </Button>
                    )}
                    {testStatus.status === 'completed' && (
                      <Button 
                        className="w-full" 
                        variant="secondary"
                        onClick={() => navigate(`/student/results/${test._id}`)}
                      >
                        View Results
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Alternate Day Tests */}
        <div>
          <div className="flex items-center mb-4">
            <h2 className="text-3xl font-bold text-blue-700">Alternate Day Tests</h2>
            <span className="ml-3 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
              1 Hour • 30 MCQs
            </span>
          </div>
          
          <p className="text-gray-600 mb-6">
            Quick practice tests every alternate day - 10 MCQs from each subject (Physics, Chemistry, Mathematics)
          </p>

          {alternateDayTests.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No alternate day tests scheduled yet. Check back soon!</p>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {alternateDayTests.map((test) => {
                const testStatus = getTestStatus(test);
                return (
                  <Card key={test._id} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold">{test.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs font-semibold bg-${testStatus.color}-100 text-${testStatus.color}-800`}>
                        {testStatus.label}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className="mr-2">📅</span>
                        <span>{new Date(test.scheduledDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">🕐</span>
                        <span>{new Date(test.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">⏱️</span>
                        <span>{test.duration} minutes</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-2">📝</span>
                        <span>30 MCQs • 120 Marks</span>
                      </div>
                    </div>

                    {testStatus.status === 'live' && (
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleStartTest(test)}
                      >
                        Start Test Now
                      </Button>
                    )}
                    {testStatus.status === 'upcoming' && (
                      <Button 
                        className="w-full" 
                        variant="secondary"
                        disabled
                      >
                        Starts {new Date(test.scheduledDate).toLocaleDateString()}
                      </Button>
                    )}
                    {testStatus.status === 'completed' && (
                      <Button 
                        className="w-full" 
                        variant="secondary"
                        onClick={() => navigate(`/student/results/${test._id}`)}
                      >
                        View Results
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestSeries;

