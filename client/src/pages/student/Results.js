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
      
      // Show all results - don't filter by exam selection
      // Users should see all tests they've taken
      setResults(response.data.results || []);
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
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
          <h2 style={{ marginBottom: '1rem', color: '#1f2937' }}>No Results Yet</h2>
          <p style={{ marginBottom: '2rem', color: '#6b7280', fontSize: '1.1rem' }}>
            Take your first test to see your performance and detailed analytics here!
          </p>
          <Link to="/student/exam-patterns" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '0.75rem 2rem' }}>
            Browse Tests
          </Link>
        </div>
      ) : (
        <div className="results-list">
          {results.map((result) => {
            // Determine test title with better fallback logic
            let testTitle = result.testId?.title;
            
            if (!testTitle) {
              // Fallback based on testType or totalMarks
              if (result.testType === 'neet_demo' || result.onModel === 'NEETDemoTest' || result.totalMarks === 720) {
                testTitle = 'NEET Demo Test';
              } else if (result.testType === 'jee_demo' || result.onModel === 'DemoTest' || result.totalMarks === 300) {
                testTitle = 'JEE Main Demo Test';
              } else if (result.isAIGenerated) {
                testTitle = 'AI Generated Test';
              } else if (result.isScheduled) {
                testTitle = 'Scheduled Test';
              } else {
                testTitle = result.isDemo ? 'Demo Test' : 'Test';
              }
            }
            
            return (
              <div key={result._id} className="result-card card">
                <div className="result-header">
                  <h3>
                    {result.isDemo && '🎯 '}
                    {result.isAIGenerated && '🤖 '}
                    {result.isScheduled && '📅 '}
                    {testTitle}
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

              {/* Subject-wise Marks Table */}
              {result.answers && result.answers.length > 0 && (() => {
                const subjectMarks = {};
                result.answers.forEach(ans => {
                  const subject = ans.subject || 'General';
                  if (!subjectMarks[subject]) {
                    subjectMarks[subject] = { correct: 0, incorrect: 0, unattempted: 0, score: 0, total: 0 };
                  }
                  subjectMarks[subject].total++;
                  if (ans.isCorrect) {
                    subjectMarks[subject].correct++;
                    subjectMarks[subject].score += (ans.marksAwarded || 4);
                  } else if (ans.userAnswer === null || ans.userAnswer === undefined || ans.userAnswer === '') {
                    subjectMarks[subject].unattempted++;
                  } else {
                    subjectMarks[subject].incorrect++;
                    subjectMarks[subject].score += (ans.marksAwarded || -1);
                  }
                });
                
                const hasMultipleSubjects = Object.keys(subjectMarks).length > 1;
                const subjects = Object.keys(subjectMarks).sort();
                
                return hasMultipleSubjects ? (
                  <div className="subject-breakdown" style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
                    <h4 style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.75rem', fontWeight: '600' }}>📊 Subject-wise Marks</h4>
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                        <thead>
                          <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
                            <th style={{ padding: '0.5rem', textAlign: 'left', fontWeight: '600', color: '#6b7280' }}>Metric</th>
                            {subjects.map(subject => (
                              <th key={subject} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '600', color: '#374151' }}>{subject}</th>
                            ))}
                            <th style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#1f2937', backgroundColor: '#f3f4f6' }}>Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.5rem', fontWeight: '500', color: '#6b7280' }}>Marks</td>
                            {subjects.map(subject => {
                              const maxMarks = subjectMarks[subject].total * 4;
                              return (
                                <td key={subject} style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: subjectMarks[subject].score >= 0 ? '#059669' : '#dc2626' }}>
                                  {subjectMarks[subject].score}/{maxMarks}
                                </td>
                              );
                            })}
                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '800', color: result.score >= 0 ? '#059669' : '#dc2626', backgroundColor: '#f3f4f6', fontSize: '0.95rem' }}>
                              {result.score}/{result.totalMarks}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.5rem', fontWeight: '500', color: '#6b7280' }}>Correct</td>
                            {subjects.map(subject => (
                              <td key={subject} style={{ padding: '0.5rem', textAlign: 'center', color: '#22c55e', fontWeight: '600' }}>
                                {subjectMarks[subject].correct}
                              </td>
                            ))}
                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#22c55e', backgroundColor: '#f3f4f6' }}>
                              {result.correctAnswers}
                            </td>
                          </tr>
                          <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            <td style={{ padding: '0.5rem', fontWeight: '500', color: '#6b7280' }}>Incorrect</td>
                            {subjects.map(subject => (
                              <td key={subject} style={{ padding: '0.5rem', textAlign: 'center', color: '#ef4444', fontWeight: '600' }}>
                                {subjectMarks[subject].incorrect}
                              </td>
                            ))}
                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#ef4444', backgroundColor: '#f3f4f6' }}>
                              {result.incorrectAnswers}
                            </td>
                          </tr>
                          <tr>
                            <td style={{ padding: '0.5rem', fontWeight: '500', color: '#6b7280' }}>Unattempted</td>
                            {subjects.map(subject => (
                              <td key={subject} style={{ padding: '0.5rem', textAlign: 'center', color: '#f59e0b', fontWeight: '600' }}>
                                {subjectMarks[subject].unattempted}
                              </td>
                            ))}
                            <td style={{ padding: '0.5rem', textAlign: 'center', fontWeight: '700', color: '#f59e0b', backgroundColor: '#f3f4f6' }}>
                              {result.unattempted}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null;
              })()}

              <Link
                to={result.isDemo ? `/student/demo-result/${result._id}` : `/student/result/${result._id}`}
                className="btn btn-primary"
              >
                View Detailed Analysis
              </Link>
            </div>
          );
          })}
        </div>
      )}
    </div>
  );
};

export default Results;
