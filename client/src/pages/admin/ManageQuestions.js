import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { adminService } from '../../services/api';
import LatexRenderer from '../../components/LatexRenderer';
import './ManageQuestions.css';

const ManageQuestions = () => {
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({
    examType: '',
    subject: '',
    chapter: '',
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchQuestions();
  }, [filters, page]);

  const fetchQuestions = async () => {
    try {
      const response = await adminService.getQuestions({ ...filters, page });
      setQuestions(response.data.questions);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        await adminService.deleteQuestion(id);
        toast.success('Question deleted successfully');
        fetchQuestions();
      } catch (error) {
        toast.error('Failed to delete question');
      }
    }
  };

  return (
    <div className="container">
      <h1>Manage Questions</h1>

      <div className="card filters">
        <div className="filter-row">
          <div className="form-group">
            <label>Exam Type</label>
            <select
              value={filters.examType}
              onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
            >
              <option value="">All</option>
              <option value="JEE">JEE</option>
              <option value="NEET">NEET</option>
            </select>
          </div>

          <div className="form-group">
            <label>Subject</label>
            <select
              value={filters.subject}
              onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
            >
              <option value="">All</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
              <option value="Mathematics">Mathematics</option>
              <option value="Biology">Biology</option>
            </select>
          </div>

          <div className="form-group">
            <label>Chapter</label>
            <input
              type="text"
              value={filters.chapter}
              onChange={(e) => setFilters({ ...filters, chapter: e.target.value })}
              placeholder="Filter by chapter"
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              setFilters({ examType: '', subject: '', chapter: '' });
              setPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading questions...</div>
      ) : (
        <>
          <div className="questions-list">
            {questions.map((q) => (
              <div key={q._id} className="card question-card">
                <div className="question-header">
                  <div className="question-meta">
                    <span className="badge">{q.examType}</span>
                    <span className="badge">{q.subject}</span>
                    <span className="badge">{q.chapter}</span>
                    <span className="badge">{q.questionType}</span>
                    <span className="badge">{q.difficulty}</span>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDelete(q._id)}
                  >
                    Delete
                  </button>
                </div>
                <div className="question-text">
                  <LatexRenderer content={q.question} />
                  {q.questionImage && (
                    <div className="mt-2">
                      <img 
                        src={q.questionImage} 
                        alt="Question diagram" 
                        className="max-w-md max-h-48 object-contain border rounded"
                      />
                    </div>
                  )}
                </div>
                {q.options && q.options.length > 0 && (
                  <div className="question-options">
                    {q.options.map((opt, idx) => (
                      <div key={idx} className="option">
                        {String.fromCharCode(65 + idx)}. <LatexRenderer content={opt} />
                        {q.optionImages && q.optionImages[idx] && (
                          <div className="ml-4 mt-1">
                            <img 
                              src={q.optionImages[idx]} 
                              alt={`Option ${String.fromCharCode(65 + idx)}`} 
                              className="max-w-xs max-h-24 object-contain border rounded"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="question-footer">
                  <strong>Answer:</strong> {JSON.stringify(q.correctAnswer)}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ManageQuestions;
