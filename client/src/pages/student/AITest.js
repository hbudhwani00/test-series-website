import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';

const AITest = () => {
  const [generating, setGenerating] = useState(false);
  const [subject, setSubject] = useState('');
  const [questionCount, setQuestionCount] = useState(20);
  const navigate = useNavigate();

  const subjects = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];

  const handleGenerateTest = async () => {
    if (!subject) {
      toast.warning('Please select a subject');
      return;
    }

    try {
      setGenerating(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        'http://localhost:5000/api/ai/generate-test',
        { 
          subject: subject,
          questionCount: questionCount 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('AI test generated successfully!');
      
      navigate('/student/ai-test-take', { 
        state: { 
          testData: response.data 
        } 
      });
    } catch (error) {
      console.error('Error generating AI test:', error);
      toast.error(error.response?.data?.message || 'Failed to generate test');
    } finally {
      setGenerating(false);
    }
  };

  if (generating) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-24 w-24 border-b-4 border-purple-600 mx-auto mb-6"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl">
              
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">AI is analyzing your performance...</h2>
          <p className="text-gray-600">Selecting best questions for you</p>
          <div className="mt-4 flex justify-center gap-2">
            <div className="animate-bounce delay-0"></div>
            <div className="animate-bounce delay-100"></div>
            <div className="animate-bounce delay-200"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce"></div>
          <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            AI Powered Test
          </h1>
          <p className="text-xl text-gray-700">
            Personalized questions based on your weak areas
          </p>
        </div>

        <Card className="p-6 mb-6 bg-white shadow-xl border-2 border-purple-200">
          <div className="flex items-start gap-4">
            <div className="text-4xl"></div>
            <div>
              <h3 className="font-bold text-lg mb-2 text-purple-700">How AI Test Works:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1"></span>
                  <span>AI analyzes your past performance (Demo tests & Test Series)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1"></span>
                  <span>Identifies topics where you scored below 90%</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1"></span>
                  <span>Prioritizes questions you got wrong or left unattempted</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1"></span>
                  <span>Arranges questions from Easy  Medium  Hard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1"></span>
                  <span>2 minutes per question (Maximum 60 minutes)</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-white shadow-xl">
          <h2 className="text-2xl font-bold mb-6 text-center">Configure Your AI Test</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                Select Subject <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {subjects.map((sub) => (
                  <button
                    key={sub}
                    onClick={() => setSubject(sub)}
                    className={`p-4 rounded-xl border-2 transition-all duration-300 SilentlyContinue{
                      subject === sub
                        ? 'border-purple-600 bg-purple-50 shadow-lg transform scale-105'
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'
                    }`}
                  >
                    <div className="text-3xl mb-2">
                      {sub === 'Physics' && ''}
                      {sub === 'Chemistry' && ''}
                      {sub === 'Mathematics' && ''}
                      {sub === 'Biology' && ''}
                    </div>
                    <div className={`font-semibold SilentlyContinue{subject === sub ? 'text-purple-700' : 'text-gray-700'}`}>
                      {sub}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-3 text-gray-700">
                Number of Questions <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="30"
                  step="5"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                  className="flex-1 h-3 bg-purple-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg">
                  <span className="text-2xl font-bold text-purple-700">{questionCount}</span>
                  <span className="text-sm text-gray-600">questions</span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                <span>10 questions (20 min)</span>
                <span>20 questions (40 min)</span>
                <span>30 questions (60 min)</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl mb-1"></div>
                  <div className="text-sm text-gray-600">Duration</div>
                  <div className="font-bold text-purple-700">{questionCount * 2} min</div>
                </div>
                <div>
                  <div className="text-2xl mb-1"></div>
                  <div className="text-sm text-gray-600">Total Marks</div>
                  <div className="font-bold text-purple-700">{questionCount * 4}</div>
                </div>
                <div>
                  <div className="text-2xl mb-1"></div>
                  <div className="text-sm text-gray-600">Questions</div>
                  <div className="font-bold text-purple-700">{questionCount}</div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateTest}
              disabled={!subject || generating}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 text-lg font-bold shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
            >
              {generating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                   Generate AI Test
                </span>
              )}
            </Button>
          </div>
        </Card>

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/student/exam-patterns')}
            className="text-purple-600 hover:text-purple-800 font-semibold"
          >
             Back to Tests
          </button>
        </div>
      </div>
    </div>
  );
};

export default AITest;
