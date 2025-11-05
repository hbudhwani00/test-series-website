import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { resultService } from '../../services/api';
import './Results.css';

const Results = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      console.log('Fetching results...');
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      
      const response = await resultService.getAllResults();
      console.log('Results response:', response.data);
      console.log('Number of results:', response.data.results?.length);
      
      setResults(response.data.results);
    } catch (error) {
      console.error('Error fetching results:', error);
      console.error('Error response:', error.response?.data);
      toast.error('Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading results...</div>;
  }

  return (
    <div className="container">
      <h1>My Test Results</h1>

      {results.length === 0 ? (
        <div className="card">
          <p>No test results found. Take a test to see your results here.</p>
          <Link to="/student/generate-test" className="btn btn-primary">
            Generate Test
          </Link>
        </div>
      ) : (
        <div className="results-list">
          {results.map((result) => (
            <div key={result._id} className="result-card card">
              <div className="result-header">
                <h3>
                  {result.isDemo && '🎯 '}
                  {result.testId?.title || 'JEE Main Demo Test'}
                  {result.isDemo && ' (Demo)'}
                </h3>
                <span className="result-date">
                  {new Date(result.submittedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="result-stats">
                <div className="stat">
                  <span className="stat-label">Score</span>
                  <span className="stat-value">
                    {result.score}/{result.totalMarks}
                  </span>
                </div>
                <div className="stat">
                  <span className="stat-label">Percentage</span>
                  <span className="stat-value">{result.percentage.toFixed(2)}%</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Correct</span>
                  <span className="stat-value correct">{result.correctAnswers}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Incorrect</span>
                  <span className="stat-value incorrect">{result.incorrectAnswers}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Unattempted</span>
                  <span className="stat-value">{result.unattempted}</span>
                </div>
              </div>

              <Link
                to={result.isDemo ? `/student/demo-result/${result._id}` : `/student/result/${result._id}`}
                className="btn btn-primary"
              >
                View Detailed Analysis
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Results;
