import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';
import './UploadQuestions.css';

const UploadQuestions = () => {
  const [mode, setMode] = useState('single'); // single or bulk
  const [singleQuestion, setSingleQuestion] = useState({
    examType: 'JEE',
    subject: 'Physics',
    chapter: '',
    questionType: 'single',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    difficulty: 'medium',
    marks: 4,
    negativeMarks: -1,
  });
  const [bulkData, setBulkData] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await adminService.uploadQuestion(singleQuestion);
      toast.success('Question uploaded successfully!');
      // Reset form
      setSingleQuestion({
        ...singleQuestion,
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        chapter: '',
      });
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload question');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const questions = JSON.parse(bulkData);
      await adminService.bulkUploadQuestions({ questions });
      toast.success('Questions uploaded successfully!');
      setBulkData('');
    } catch (error) {
      if (error instanceof SyntaxError) {
        toast.error('Invalid JSON format');
      } else {
        toast.error(error.response?.data?.message || 'Failed to upload questions');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>Upload Questions</h1>

      <div className="mode-selector">
        <button
          className={`btn ${mode === 'single' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('single')}
        >
          Single Question
        </button>
        <button
          className={`btn ${mode === 'bulk' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('bulk')}
        >
          Bulk Upload
        </button>
      </div>

      {mode === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="card">
          <div className="form-row">
            <div className="form-group">
              <label>Exam Type</label>
              <select
                value={singleQuestion.examType}
                onChange={(e) =>
                  setSingleQuestion({ ...singleQuestion, examType: e.target.value })
                }
                required
              >
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
              </select>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <select
                value={singleQuestion.subject}
                onChange={(e) =>
                  setSingleQuestion({ ...singleQuestion, subject: e.target.value })
                }
                required
              >
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Mathematics">Mathematics</option>
                <option value="Biology">Biology</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Chapter</label>
            <input
              type="text"
              value={singleQuestion.chapter}
              onChange={(e) =>
                setSingleQuestion({ ...singleQuestion, chapter: e.target.value })
              }
              placeholder="Enter chapter name"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Question Type</label>
              <select
                value={singleQuestion.questionType}
                onChange={(e) =>
                  setSingleQuestion({ ...singleQuestion, questionType: e.target.value })
                }
                required
              >
                <option value="single">Single Choice</option>
                <option value="multiple">Multiple Choice</option>
                <option value="numerical">Numerical</option>
              </select>
            </div>

            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={singleQuestion.difficulty}
                onChange={(e) =>
                  setSingleQuestion({ ...singleQuestion, difficulty: e.target.value })
                }
                required
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Question</label>
            <textarea
              value={singleQuestion.question}
              onChange={(e) =>
                setSingleQuestion({ ...singleQuestion, question: e.target.value })
              }
              placeholder="Enter question"
              rows="4"
              required
            />
          </div>

          {singleQuestion.questionType !== 'numerical' && (
            <>
              <label>Options</label>
              {singleQuestion.options.map((option, index) => (
                <div key={index} className="form-group">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...singleQuestion.options];
                      newOptions[index] = e.target.value;
                      setSingleQuestion({ ...singleQuestion, options: newOptions });
                    }}
                    placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    required
                  />
                </div>
              ))}
            </>
          )}

          <div className="form-group">
            <label>
              Correct Answer{' '}
              {singleQuestion.questionType === 'multiple'
                ? '(e.g., A,B for multiple answers)'
                : singleQuestion.questionType === 'numerical'
                ? '(numerical value)'
                : '(A, B, C, or D)'}
            </label>
            <input
              type="text"
              value={singleQuestion.correctAnswer}
              onChange={(e) =>
                setSingleQuestion({ ...singleQuestion, correctAnswer: e.target.value })
              }
              placeholder="Enter correct answer"
              required
            />
          </div>

          <div className="form-group">
            <label>Explanation (Optional)</label>
            <textarea
              value={singleQuestion.explanation}
              onChange={(e) =>
                setSingleQuestion({ ...singleQuestion, explanation: e.target.value })
              }
              placeholder="Enter explanation"
              rows="3"
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Question'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBulkSubmit} className="card">
          <div className="form-group">
            <label>JSON Data</label>
            <textarea
              value={bulkData}
              onChange={(e) => setBulkData(e.target.value)}
              placeholder='[{"examType":"JEE","subject":"Physics","chapter":"Mechanics","questionType":"single","question":"...","options":["..."],"correctAnswer":"A","explanation":"...","difficulty":"medium"}]'
              rows="15"
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Uploading...' : 'Upload Questions'}
          </button>
        </form>
      )}
    </div>
  );
};

export default UploadQuestions;
