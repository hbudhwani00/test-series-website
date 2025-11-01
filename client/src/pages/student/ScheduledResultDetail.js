import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../services/api';
import './ResultDetail.css';

const ScheduledResultDetail = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/results/${resultId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setResult(response.data.result);
    } catch (error) {
      toast.error('Failed to load result details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading result...</div>;
  }

  if (!result) {
    return <div className="container">Result not found</div>;
  }

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: '#10b981' };
    if (percentage >= 80) return { grade: 'A', color: '#059669' };
    if (percentage >= 70) return { grade: 'B+', color: '#3b82f6' };
    if (percentage >= 60) return { grade: 'B', color: '#6366f1' };
    if (percentage >= 50) return { grade: 'C', color: '#f59e0b' };
    return { grade: 'D', color: '#ef4444' };
  };

  const gradeInfo = getGrade(result.percentage);

  // Group answers by subject, chapter, and topic
  const groupedAnswers = {};
  if (result.answers) {
    result.answers.forEach((answer) => {
      const subject = answer.subject || 'General';
      const chapter = answer.chapter || 'General';
      const topic = answer.topic || 'General';
      
      if (!groupedAnswers[subject]) {
        groupedAnswers[subject] = {};
      }
      if (!groupedAnswers[subject][chapter]) {
        groupedAnswers[subject][chapter] = {};
      }
      if (!groupedAnswers[subject][chapter][topic]) {
        groupedAnswers[subject][chapter][topic] = [];
      }
      
      groupedAnswers[subject][chapter][topic].push(answer);
    });
  }

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div className="result-detail">
        <div className="result-summary card">
          <h1>📅 Scheduled Test Result</h1>
          <h2>{result.testId?.title || 'Scheduled Test'}</h2>

          <div className="summary-stats">
            <div className="summary-stat">
              <div className="summary-value">{result.score}</div>
              <div className="summary-label">Total Score</div>
            </div>
            <div className="summary-stat">
              <div className="summary-value">{result.percentage.toFixed(2)}%</div>
              <div className="summary-label">Percentage</div>
            </div>
            <div className="summary-stat">
              <div className="summary-value" style={{ color: gradeInfo.color, fontSize: '2.5rem' }}>
                {gradeInfo.grade}
              </div>
              <div className="summary-label">Grade</div>
            </div>
          </div>

          <div className="summary-stats" style={{ marginTop: '20px' }}>
            <div className="summary-stat">
              <div className="summary-value correct">{result.correctAnswers}</div>
              <div className="summary-label">✓ Correct</div>
            </div>
            <div className="summary-stat">
              <div className="summary-value incorrect">{result.incorrectAnswers}</div>
              <div className="summary-label">✗ Incorrect</div>
            </div>
            <div className="summary-stat">
              <div className="summary-value">{result.unattempted}</div>
              <div className="summary-label">− Unattempted</div>
            </div>
          </div>

          <div className="time-info" style={{ marginTop: '20px', textAlign: 'center', color: '#666' }}>
            <p>⏱️ Time Taken: {Math.floor(result.timeTaken / 60)} minutes {result.timeTaken % 60} seconds</p>
          </div>
        </div>

        <div className="card" style={{ marginTop: '20px' }}>
          <h2>📊 Performance Summary</h2>
          <div style={{ padding: '20px' }}>
            <p style={{ fontSize: '1.1rem', color: '#333', lineHeight: '1.8', marginBottom: '30px' }}>
              {result.percentage >= 80 ? 
                '🎉 Excellent performance! You have a strong understanding of the concepts.' :
                result.percentage >= 60 ?
                '👍 Good effort! Focus on your weak areas to improve further.' :
                result.percentage >= 40 ?
                '📚 You need more practice. Review the concepts and attempt more questions.' :
                '⚠️ Consider revising the fundamentals thoroughly before attempting more tests.'
              }
            </p>

            {/* Performance Tables - Same as DemoResultDetail */}
            {(() => {
              const strongTopics = {};
              const needImprovementTopics = {};
              const uncoveredTopics = {};

              // Categorize answers - group by subject first
              if (result.answers) {
                result.answers.forEach((answer) => {
                  const key = `${answer.subject}|${answer.chapter}|${answer.topic}`;
                  
                  if (answer.isCorrect) {
                    if (!strongTopics[answer.subject]) {
                      strongTopics[answer.subject] = {};
                    }
                    if (!strongTopics[answer.subject][key]) {
                      strongTopics[answer.subject][key] = {
                        subject: answer.subject,
                        chapter: answer.chapter,
                        topic: answer.topic,
                        count: 0
                      };
                    }
                    strongTopics[answer.subject][key].count++;
                  } else if (answer.userAnswer === null || answer.userAnswer === undefined) {
                    if (!uncoveredTopics[answer.subject]) {
                      uncoveredTopics[answer.subject] = {};
                    }
                    if (!uncoveredTopics[answer.subject][key]) {
                      uncoveredTopics[answer.subject][key] = {
                        subject: answer.subject,
                        chapter: answer.chapter,
                        topic: answer.topic,
                        count: 0
                      };
                    }
                    uncoveredTopics[answer.subject][key].count++;
                  } else {
                    if (!needImprovementTopics[answer.subject]) {
                      needImprovementTopics[answer.subject] = {};
                    }
                    if (!needImprovementTopics[answer.subject][key]) {
                      needImprovementTopics[answer.subject][key] = {
                        subject: answer.subject,
                        chapter: answer.chapter,
                        topic: answer.topic,
                        count: 0
                      };
                    }
                    needImprovementTopics[answer.subject][key].count++;
                  }
                });
              }

              return (
                <>
                  {/* Strong Topics */}
                  {Object.keys(strongTopics).length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ 
                        color: '#10b981', 
                        fontSize: '1.2rem', 
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>✅</span> Perfect, these are your strong topics
                      </h3>
                      <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        border: '2px solid #10b981',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse'
                        }}>
                          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '20%' }}>Subject</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '30%' }}>Chapter</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '35%' }}>Topic</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '15%' }}>Correct</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(strongTopics).map((subject, subjectIdx) => {
                              const topics = Object.values(strongTopics[subject]);
                              return topics.map((item, idx) => (
                                <tr 
                                  key={`${subjectIdx}-${idx}`} 
                                  style={{ 
                                    background: subjectIdx % 2 === 0 ? '#f0fdf4' : '#ffffff',
                                    borderBottom: '1px solid #d1fae5',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#dcfce7'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = subjectIdx % 2 === 0 ? '#f0fdf4' : '#ffffff'}
                                >
                                  {idx === 0 && (
                                    <td 
                                      rowSpan={topics.length} 
                                      style={{ 
                                        padding: '10px 12px', 
                                        color: '#065f46',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        verticalAlign: 'middle',
                                        background: subjectIdx % 2 === 0 ? '#d1fae5' : '#ecfdf5',
                                        borderRight: '2px solid #10b981'
                                      }}
                                    >
                                      {item.subject}
                                    </td>
                                  )}
                                  <td style={{ padding: '8px 12px', color: '#047857', fontSize: '0.9rem' }}>{item.chapter}</td>
                                  <td style={{ padding: '8px 12px', color: '#065f46', fontSize: '0.9rem' }}>{item.topic}</td>
                                  <td style={{ 
                                    padding: '8px 12px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold', 
                                    color: '#10b981',
                                    fontSize: '1rem',
                                    background: subjectIdx % 2 === 0 ? '#ecfdf5' : '#f7fee7'
                                  }}>
                                    {item.count}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Need Improvement Topics */}
                  {Object.keys(needImprovementTopics).length > 0 && (
                    <div style={{ marginBottom: '30px' }}>
                      <h3 style={{ 
                        color: '#ef4444', 
                        fontSize: '1.2rem', 
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>⚠️</span> These chapters & topics need improvement
                      </h3>
                      <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        border: '2px solid #ef4444',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse'
                        }}>
                          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '20%' }}>Subject</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '30%' }}>Chapter</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '35%' }}>Topic</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '15%' }}>Incorrect</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(needImprovementTopics).map((subject, subjectIdx) => {
                              const topics = Object.values(needImprovementTopics[subject]);
                              return topics.map((item, idx) => (
                                <tr 
                                  key={`${subjectIdx}-${idx}`} 
                                  style={{ 
                                    background: subjectIdx % 2 === 0 ? '#fef2f2' : '#ffffff',
                                    borderBottom: '1px solid #fee2e2',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#fecaca'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = subjectIdx % 2 === 0 ? '#fef2f2' : '#ffffff'}
                                >
                                  {idx === 0 && (
                                    <td 
                                      rowSpan={topics.length} 
                                      style={{ 
                                        padding: '10px 12px', 
                                        color: '#991b1b',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        verticalAlign: 'middle',
                                        background: subjectIdx % 2 === 0 ? '#fee2e2' : '#fef2f2',
                                        borderRight: '2px solid #ef4444'
                                      }}
                                    >
                                      {item.subject}
                                    </td>
                                  )}
                                  <td style={{ padding: '8px 12px', color: '#b91c1c', fontSize: '0.9rem' }}>{item.chapter}</td>
                                  <td style={{ padding: '8px 12px', color: '#991b1b', fontSize: '0.9rem' }}>{item.topic}</td>
                                  <td style={{ 
                                    padding: '8px 12px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold', 
                                    color: '#ef4444',
                                    fontSize: '1rem',
                                    background: subjectIdx % 2 === 0 ? '#fef2f2' : '#ffe4e6'
                                  }}>
                                    {item.count}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Uncovered Topics */}
                  {Object.keys(uncoveredTopics).length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h3 style={{ 
                        color: '#f59e0b', 
                        fontSize: '1.2rem', 
                        marginBottom: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                      }}>
                        <span style={{ fontSize: '1.4rem' }}>📚</span> You need to cover the theory of these chapters and topics
                      </h3>
                      <div style={{ 
                        maxHeight: '400px', 
                        overflowY: 'auto',
                        border: '2px solid #f59e0b',
                        borderRadius: '8px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <table style={{ 
                          width: '100%', 
                          borderCollapse: 'collapse'
                        }}>
                          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' }}>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '20%' }}>Subject</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '30%' }}>Chapter</th>
                              <th style={{ padding: '10px 12px', textAlign: 'left', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '35%' }}>Topic</th>
                              <th style={{ padding: '10px 12px', textAlign: 'center', color: '#fff', fontWeight: '600', fontSize: '0.9rem', width: '15%' }}>Unattempted</th>
                            </tr>
                          </thead>
                          <tbody>
                            {Object.keys(uncoveredTopics).map((subject, subjectIdx) => {
                              const topics = Object.values(uncoveredTopics[subject]);
                              return topics.map((item, idx) => (
                                <tr 
                                  key={`${subjectIdx}-${idx}`} 
                                  style={{ 
                                    background: subjectIdx % 2 === 0 ? '#fffbeb' : '#ffffff',
                                    borderBottom: '1px solid #fef3c7',
                                    transition: 'background-color 0.2s'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = '#fde68a'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = subjectIdx % 2 === 0 ? '#fffbeb' : '#ffffff'}
                                >
                                  {idx === 0 && (
                                    <td 
                                      rowSpan={topics.length} 
                                      style={{ 
                                        padding: '10px 12px', 
                                        color: '#78350f',
                                        fontWeight: '700',
                                        fontSize: '0.95rem',
                                        verticalAlign: 'middle',
                                        background: subjectIdx % 2 === 0 ? '#fef3c7' : '#fffbeb',
                                        borderRight: '2px solid #f59e0b'
                                      }}
                                    >
                                      {item.subject}
                                    </td>
                                  )}
                                  <td style={{ padding: '8px 12px', color: '#92400e', fontSize: '0.9rem' }}>{item.chapter}</td>
                                  <td style={{ padding: '8px 12px', color: '#78350f', fontSize: '0.9rem' }}>{item.topic}</td>
                                  <td style={{ 
                                    padding: '8px 12px', 
                                    textAlign: 'center', 
                                    fontWeight: 'bold', 
                                    color: '#f59e0b',
                                    fontSize: '1rem',
                                    background: subjectIdx % 2 === 0 ? '#fffbeb' : '#fef3c7'
                                  }}>
                                    {item.count}
                                  </td>
                                </tr>
                              ));
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

        {/* Detailed Solutions - Same structure as DemoResultDetail */}
        <div className="card" style={{ marginTop: '30px' }}>
          <h2>📝 Detailed Analysis - Questions with Solutions</h2>
          
          {Object.keys(groupedAnswers).map((subject, subIdx) => (
            <div key={subIdx} style={{ marginTop: '20px' }}>
              <h3 style={{ 
                background: '#3b82f6', 
                color: 'white', 
                padding: '12px 20px', 
                borderRadius: '8px',
                marginBottom: '15px'
              }}>
                {subject}
              </h3>
              
              {Object.keys(groupedAnswers[subject]).map((chapter, chIdx) => (
                <div key={chIdx} style={{ marginLeft: '15px', marginBottom: '20px' }}>
                  <h4 style={{ 
                    background: '#e0f2fe', 
                    color: '#0369a1', 
                    padding: '10px 15px', 
                    borderRadius: '6px',
                    marginBottom: '10px',
                    borderLeft: '4px solid #0369a1'
                  }}>
                    📖 Chapter: {chapter}
                  </h4>
                  
                  {Object.keys(groupedAnswers[subject][chapter]).map((topic, topIdx) => {
                    const topicAnswers = groupedAnswers[subject][chapter][topic];
                    
                    return (
                    <div key={topIdx} style={{ marginLeft: '15px', marginBottom: '15px' }}>
                      <h5 style={{ 
                        background: '#fef3c7', 
                        color: '#92400e', 
                        padding: '8px 12px', 
                        borderRadius: '4px',
                        marginBottom: '10px',
                        borderLeft: '3px solid #f59e0b'
                      }}>
                        🎯 Topic: {topic}
                      </h5>
                      
                      {topicAnswers.map((answer, qIdx) => {
                        return (
                        <div
                          key={qIdx} 
                          style={{ 
                            marginLeft: '15px',
                            marginBottom: '20px',
                            padding: '20px',
                            background: answer.isCorrect ? '#f0fdf4' : (answer.userAnswer === null ? '#fef3c7' : '#fef2f2'),
                            borderRadius: '8px',
                            border: `2px solid ${answer.isCorrect ? '#10b981' : (answer.userAnswer === null ? '#f59e0b' : '#ef4444')}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                            <span style={{ 
                              background: answer.isCorrect ? '#10b981' : (answer.userAnswer === null ? '#f59e0b' : '#ef4444'),
                              color: 'white',
                              padding: '5px 10px',
                              borderRadius: '5px',
                              fontWeight: 'bold',
                              marginRight: '10px'
                            }}>
                              {answer.isCorrect ? '✓ CORRECT' : (answer.userAnswer === null ? '− UNATTEMPTED' : '✗ INCORRECT')}
                            </span>
                            <span style={{ color: '#666' }}>
                              Marks: {answer.marksAwarded > 0 ? `+${answer.marksAwarded}` : answer.marksAwarded}
                            </span>
                          </div>
                          
                          <div style={{ marginBottom: '15px' }}>
                            <p style={{ fontWeight: '600', fontSize: '1.05rem', color: '#1f2937', lineHeight: '1.6' }}>
                              {answer.questionId?.question || 'Question not available'}
                            </p>
                          </div>
                          
                          {/* Show user's answer and correct answer info */}
                          <div style={{ marginBottom: '15px', padding: '10px', background: '#f3f4f6', borderRadius: '6px' }}>
                            <div style={{ marginBottom: '5px' }}>
                              <strong>Your Answer: </strong>
                              <span style={{ color: answer.userAnswer === null ? '#f59e0b' : '#1f2937' }}>
                                {answer.userAnswer === null || answer.userAnswer === undefined || answer.userAnswer === '' ? 
                                  'Not Attempted' : 
                                  (answer.questionId?.questionType === 'numerical' ? 
                                    answer.userAnswer : 
                                    (typeof answer.userAnswer === 'string' && answer.userAnswer.length === 1 && answer.userAnswer.match(/[A-Z]/i) ?
                                      `Option ${answer.userAnswer.toUpperCase()}` :
                                      (typeof answer.userAnswer === 'number' || !isNaN(answer.userAnswer) ?
                                        `Option ${String.fromCharCode(65 + parseInt(answer.userAnswer))}` :
                                        answer.userAnswer
                                      )
                                    )
                                  )
                                }
                              </span>
                            </div>
                            <div>
                              <strong>Correct Answer: </strong>
                              <span style={{ color: '#10b981', fontWeight: '600' }}>
                                {answer.questionId?.questionType === 'numerical' ? 
                                  answer.correctAnswer : 
                                  (typeof answer.correctAnswer === 'string' && answer.correctAnswer.length === 1 && answer.correctAnswer.match(/[A-Z]/i) ?
                                    `Option ${answer.correctAnswer.toUpperCase()}` :
                                    (typeof answer.correctAnswer === 'number' || !isNaN(answer.correctAnswer) ?
                                      `Option ${String.fromCharCode(65 + parseInt(answer.correctAnswer))}` :
                                      answer.correctAnswer
                                    )
                                  )
                                }
                              </span>
                            </div>
                          </div>
                          
                          {answer.questionId?.options && answer.questionId.options.length > 0 && (
                            <div style={{ marginBottom: '15px' }}>
                              <h6 style={{ fontWeight: '600', marginBottom: '10px', color: '#374151' }}>Options:</h6>
                              {answer.questionId.options.map((option, optIdx) => {
                                const normalizedUserAnswer = typeof answer.userAnswer === 'string' && answer.userAnswer.length === 1 ? 
                                  answer.userAnswer.charCodeAt(0) - 65 :
                                  parseInt(answer.userAnswer);
                                
                                const normalizedCorrectAnswer = typeof answer.correctAnswer === 'string' && answer.correctAnswer.length === 1 ? 
                                  answer.correctAnswer.charCodeAt(0) - 65 :
                                  parseInt(answer.correctAnswer);
                                
                                const isCorrectOption = optIdx === normalizedCorrectAnswer;
                                const isUserOption = optIdx === normalizedUserAnswer;
                                
                                return (
                                <div 
                                  key={optIdx}
                                  style={{
                                    padding: '10px',
                                    margin: '5px 0',
                                    background: isCorrectOption ? '#d1fae5' : 
                                               isUserOption ? '#fee2e2' : '#f9fafb',
                                    border: isCorrectOption ? '2px solid #10b981' :
                                           isUserOption ? '2px solid #ef4444' : '1px solid #e5e7eb',
                                    borderRadius: '6px'
                                  }}
                                >
                                  <strong>{String.fromCharCode(65 + optIdx)}.</strong> {option}
                                  {isCorrectOption && <span style={{ color: '#10b981', marginLeft: '10px', fontWeight: 'bold' }}>✓ Correct Answer</span>}
                                  {isUserOption && !isCorrectOption && <span style={{ color: '#ef4444', marginLeft: '10px', fontWeight: 'bold' }}>✗ Your Answer</span>}
                                </div>
                                );
                              })}
                            </div>
                          )}
                          
                          {answer.questionId?.questionType === 'numerical' && (
                            <div style={{ 
                              marginBottom: '15px', 
                              padding: '12px', 
                              background: '#f3f4f6', 
                              borderRadius: '6px',
                              borderLeft: '4px solid #6366f1'
                            }}>
                              <p style={{ color: '#4b5563' }}>
                                <strong>Type:</strong> Numerical Answer Question
                              </p>
                            </div>
                          )}
                          
                          <div style={{ 
                            background: '#fffbeb', 
                            padding: '15px', 
                            borderRadius: '6px',
                            borderLeft: '4px solid #f59e0b',
                            marginTop: '15px'
                          }}>
                            <h6 style={{ color: '#92400e', marginBottom: '8px', fontWeight: '600' }}>💡 Solution:</h6>
                            <p style={{ color: '#78350f', lineHeight: '1.6' }}>
                              {answer.explanation || 'Solution not available'}
                            </p>
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    );
                  })}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="actions" style={{ marginTop: '30px', textAlign: 'center', paddingBottom: '40px' }}>
          <Link to="/student/dashboard" className="btn btn-primary" style={{ 
            padding: '15px 40px', 
            fontSize: '1.2rem',
            textDecoration: 'none',
            display: 'inline-block'
          }}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ScheduledResultDetail;

