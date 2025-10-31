import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { testService } from '../../services/api';
import './TestGeneration.css';

const TestGeneration = () => {
  const [examType, setExamType] = useState('JEE');
  const [structure, setStructure] = useState({});
  const [formData, setFormData] = useState({
    subject: '',
    chapter: '',
    difficulty: '',
    questionCount: 30,
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStructure();
  }, [examType]);

  const fetchStructure = async () => {
    try {
      const response = await testService.getTestStructure(examType);
      setStructure(response.data.structure);
    } catch (error) {
      toast.error('Failed to load test structure');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await testService.generateTest({
        examType,
        ...formData,
      });

      toast.success('Test generated successfully!');
      navigate(`/student/test/${response.data.test.id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate test');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="test-generation">
        <h1>Generate AI-Powered Test</h1>
        <p>Customize your test by selecting subjects, chapters, and difficulty</p>

        <form onSubmit={handleGenerate} className="card">
          <div className="form-group">
            <label>Exam Type</label>
            <select
              value={examType}
              onChange={(e) => setExamType(e.target.value)}
              required
            >
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <select
              value={formData.subject}
              onChange={(e) =>
                setFormData({ ...formData, subject: e.target.value, chapter: '' })
              }
              required
            >
              <option value="">Select Subject</option>
              {Object.keys(structure).map((subject) => (
                <option key={subject} value={subject}>
                  {subject}
                </option>
              ))}
            </select>
          </div>

          {formData.subject && (
            <div className="form-group">
              <label>Chapter (Optional)</label>
              <select
                value={formData.chapter}
                onChange={(e) =>
                  setFormData({ ...formData, chapter: e.target.value })
                }
              >
                <option value="">All Chapters</option>
                {structure[formData.subject]?.map((chapter) => (
                  <option key={chapter} value={chapter}>
                    {chapter}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Difficulty (Optional)</label>
            <select
              value={formData.difficulty}
              onChange={(e) =>
                setFormData({ ...formData, difficulty: e.target.value })
              }
            >
              <option value="">All Levels</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div className="form-group">
            <label>Number of Questions</label>
            <input
              type="number"
              value={formData.questionCount}
              onChange={(e) =>
                setFormData({ ...formData, questionCount: parseInt(e.target.value) })
              }
              min="10"
              max="100"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Generating Test...' : 'Generate Test'}
          </button>
        </form>

        <div className="info-card card">
          <h3>📋 Test Information</h3>
          <ul>
            <li>Tests are auto-generated from our question bank using AI</li>
            <li>Questions include Single Choice, Multiple Choice, and Numerical types</li>
            <li>Each question carries 4 marks with -1 negative marking</li>
            <li>Results are calculated automatically after submission</li>
            <li>You can review answers and explanations after completing the test</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestGeneration;
