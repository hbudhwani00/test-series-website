import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../services/api';
import LatexRenderer from '../../components/LatexRenderer';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './DemoResultDetail.css';

const DemoResultDetail = () => {
  const { resultId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSolutions, setShowSolutions] = useState(true);
  const [aiFeedback, setAiFeedback] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [showAllRecommended, setShowAllRecommended] = useState(false);
  const [showAllWeak, setShowAllWeak] = useState(false);
  const [showAllStrength, setShowAllStrength] = useState(false);
  
  // Lead capture states
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [submittingLead, setSubmittingLead] = useState(false);

  useEffect(() => {
    fetchResult();
  }, [resultId]);

  const fetchResult = async () => {
    try {
      const response = await axios.get(`${API_URL}/results/public/${resultId}`);
      setResult(response.data.result);
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      
      // Check if lead info already submitted for this session
      const leadSubmitted = sessionStorage.getItem(`lead_submitted_${resultId}`);
      
      // Show lead form ONLY if:
      // 1. User is NOT logged in (no token)
      // 2. Lead info NOT already submitted in this session
      if (!token && !leadSubmitted) {
        setShowLeadForm(true);
      }
    } catch (error) {
      toast.error('Failed to load result details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!leadName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!leadPhone.trim()) {
      toast.error('Please enter your phone number');
      return;
    }
    
    // Indian phone number validation
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(leadPhone.trim())) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }
    
    setSubmittingLead(true);
    
    try {
      const response = await axios.post(`${API_URL}/demo/save-lead`, {
        name: leadName.trim(),
        phone: leadPhone.trim(),
        email: leadEmail.trim() || undefined,
        resultId: resultId
      });
      
      // Mark as submitted in session
      sessionStorage.setItem(`lead_submitted_${resultId}`, 'true');
      
      toast.success(response.data.message || 'Thank you! You can now view your results.');
      setShowLeadForm(false);
      
    } catch (error) {
      console.error('Error submitting lead:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save information. Please try again.';
      toast.error(errorMessage);
    } finally {
      setSubmittingLead(false);
    }
  };

  const fetchAIFeedback = async () => {
    setLoadingAI(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/ai/performance-feedback`,
        { resultId },
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      setAiFeedback(response.data.feedback);
      
      if (response.data.source === 'gemini') {
        toast.success('AI analysis generated successfully!');
      } else {
        toast.info('AI analysis generated (fallback mode)');
      }
    } catch (error) {
      console.error('Error fetching AI feedback:', error);
      toast.error('Failed to generate AI feedback. Please try again.');
    } finally {
      setLoadingAI(false);
    }
  };

  const exportToPDF = async () => {
    const element = document.querySelector('.demo-result-container');
    if (!element) {
      toast.error('Unable to find the results container.');
      console.error('Element not found: .demo-result-container');
      return;
    }

    console.log('Element found:', element);

    try {
      const canvas = await html2canvas(element, {
        scale: 2, // Adjust scale for better quality
        useCORS: true, // Enable CORS to handle cross-origin images
        logging: true, // Enable logging for debugging
        backgroundColor: null, // Ensure transparent background
      });

      // Debugging: Append the canvas to the DOM to verify rendering
      document.body.appendChild(canvas);
      canvas.style.position = 'absolute';
      canvas.style.top = '0';
      canvas.style.left = '0';
      canvas.style.zIndex = '1000';
      canvas.style.border = '2px solid red';

      console.log('Canvas dimensions:', canvas.width, canvas.height);

      const imgData = canvas.toDataURL('image/png');
      console.log('Image data generated:', imgData.substring(0, 100)); // Log first 100 characters

      const pdf = new jsPDF('p', 'mm', 'a4');

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      if (pdfHeight > pdf.internal.pageSize.getHeight()) {
        // Handle large content by splitting into multiple pages
        let y = 0;
        while (y < canvas.height) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(canvas.height - y, pdf.internal.pageSize.getHeight() * (canvas.width / pdfWidth));
          const pageCtx = pageCanvas.getContext('2d');
          pageCtx.drawImage(canvas, 0, y, canvas.width, pageCanvas.height, 0, 0, canvas.width, pageCanvas.height);
          const pageImgData = pageCanvas.toDataURL('image/png');
          pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, (pageCanvas.height * pdfWidth) / canvas.width);
          y += pageCanvas.height;
          if (y < canvas.height) pdf.addPage();
        }
      } else {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      }

      pdf.save('Detailed_Analysis.pdf');
      toast.success('PDF exported successfully!');

      // Remove the debug canvas after exporting
      document.body.removeChild(canvas);
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      toast.error('Failed to export PDF. Please try again.');
    }
  };

  if (loading) {
    return <div className="demo-loading">Loading your results</div>;
  }

  if (!result) {
    return (
      <div className="demo-result-container">
        <div className="demo-card">
          <h2>Result not found</h2>
          <p>The requested result could not be found.</p>
          <Link to="/" className="topic-btn primary">Go to Home</Link>
        </div>
      </div>
    );
  }

  // Calculate topic performance
  const getTopicPerformance = () => {
    const topicStats = {};
    
    if (result.answers) {
      result.answers.forEach((answer) => {
        const topicKey = `${answer.subject}/${answer.chapter}/${answer.topic}`;
        
        if (!topicStats[topicKey]) {
          topicStats[topicKey] = {
            subject: answer.subject || 'General',
            chapter: answer.chapter || 'General',
            topic: answer.topic || 'General',
            total: 0,
            correct: 0,
            incorrect: 0,
            unattempted: 0
          };
        }
        
        topicStats[topicKey].total++;
        if (answer.isCorrect) {
          topicStats[topicKey].correct++;
        } else if (answer.userAnswer === null || answer.userAnswer === undefined) {
          topicStats[topicKey].unattempted++;
        } else {
          topicStats[topicKey].incorrect++;
        }
      });
    }
    
    return Object.values(topicStats);
  };

  const topicPerformance = getTopicPerformance();
  const weakTopics = topicPerformance.filter(t => t.incorrect > 0).sort((a, b) => b.incorrect - a.incorrect);
  const strengthTopics = topicPerformance.filter(t => t.correct > 0 && t.incorrect === 0).sort((a, b) => b.correct - a.correct);
  
  // Group weak topics by chapter
  const weakByChapter = {};
  weakTopics.forEach(topic => {
    const chapterKey = `${topic.subject}/${topic.chapter}`;
    if (!weakByChapter[chapterKey]) {
      weakByChapter[chapterKey] = {
        subject: topic.subject,
        chapter: topic.chapter,
        topics: [],
        totalIncorrect: 0
      };
    }
    weakByChapter[chapterKey].topics.push(topic.topic);
    weakByChapter[chapterKey].totalIncorrect += topic.incorrect;
  });
  const weakChapters = Object.values(weakByChapter).sort((a, b) => b.totalIncorrect - a.totalIncorrect);
  
  // Group strength topics by chapter
  const strengthByChapter = {};
  strengthTopics.forEach(topic => {
    const chapterKey = `${topic.subject}/${topic.chapter}`;
    if (!strengthByChapter[chapterKey]) {
      strengthByChapter[chapterKey] = {
        subject: topic.subject,
        chapter: topic.chapter,
        topics: [],
        totalCorrect: 0
      };
    }
    strengthByChapter[chapterKey].topics.push(topic.topic);
    strengthByChapter[chapterKey].totalCorrect += topic.correct;
  });
  const strengthChapters = Object.values(strengthByChapter).sort((a, b) => b.totalCorrect - a.totalCorrect);
  const recommendedTopics = topicPerformance.filter(t => t.unattempted > 0 || t.incorrect > 0).sort((a, b) => (b.incorrect + b.unattempted) - (a.incorrect + a.unattempted));

  // Group recommended topics by chapter
  const recommendedByChapter = {};
  recommendedTopics.forEach(topic => {
    const chapterKey = `${topic.subject}/${topic.chapter}`;
    if (!recommendedByChapter[chapterKey]) {
      recommendedByChapter[chapterKey] = {
        subject: topic.subject,
        chapter: topic.chapter,
        topics: [],
        totalIncorrect: 0,
        totalUnattempted: 0,
        totalQuestions: 0
      };
    }
    recommendedByChapter[chapterKey].topics.push(topic.topic);
    recommendedByChapter[chapterKey].totalIncorrect += topic.incorrect;
    recommendedByChapter[chapterKey].totalUnattempted += topic.unattempted;
    recommendedByChapter[chapterKey].totalQuestions += topic.total;
  });
  
  const recommendedChapters = Object.values(recommendedByChapter).sort((a, b) => 
    (b.totalIncorrect + b.totalUnattempted) - (a.totalIncorrect + a.totalUnattempted)
  );

  // Get slow questions (>3 minutes = 180 seconds)
  const slowQuestions = result.answers 
    ? result.answers
        .map((answer, index) => ({ ...answer, originalIndex: index }))
        .filter(answer => answer.timeBreakdown && answer.timeBreakdown.totalTime > 180)
        .sort((a, b) => b.timeBreakdown.totalTime - a.timeBreakdown.totalTime)
    : [];

  // Calculate subject-wise average time
    const subjectTimeStats = {};
if (result.answers) {
  result.answers.forEach(answer => {
    const subject = answer.subject || 'General';
    
    // DEBUG: Log first question of each subject
    if (!subjectTimeStats[subject]) {
      console.log(`First ${subject} question:`, {
        subject: answer.subject,
        hasTimeBreakdown: !!answer.timeBreakdown,
        timeData: answer.timeBreakdown
      });
      subjectTimeStats[subject] = { totalTime: 0, count: 0 };
    }
    
    // Only count questions that have time data
    if (answer.timeBreakdown && answer.timeBreakdown.totalTime > 0) {
      subjectTimeStats[subject].totalTime += answer.timeBreakdown.totalTime;
      subjectTimeStats[subject].count++;
    }
  });
}

console.log('Final subject stats:', subjectTimeStats); // ADD THIS

// Rest of the code stays the same...

// Sort subjects alphabetically and filter out subjects with no time data
const subjectAverages = Object.keys(subjectTimeStats)
  .filter(subject => subjectTimeStats[subject].count > 0) // Only show subjects with time data
  .sort()
  .map(subject => ({
    subject,
    avgTime: Math.round(subjectTimeStats[subject].totalTime / subjectTimeStats[subject].count),
    questionCount: subjectTimeStats[subject].count
  }));
  // Circular progress calculation
  const radius = 85;
  const circumference = 2 * Math.PI * radius;
  
  // Handle negative percentages - show 0% progress but display actual percentage
  const displayPercentage = result.percentage;
  const progressPercentage = Math.max(0, Math.min(100, result.percentage)); // Clamp between 0-100 for visual
  const progressOffset = circumference - (progressPercentage / 100) * circumference;

  const getGrade = (percentage) => {
    if (percentage >= 90) return { grade: 'A+', color: '#10b981' };
    if (percentage >= 80) return { grade: 'A', color: '#059669' };
    if (percentage >= 70) return { grade: 'B+', color: '#3b82f6' };
    if (percentage >= 60) return { grade: 'B', color: '#6366f1' };
    if (percentage >= 50) return { grade: 'C', color: '#f59e0b' };
    return { grade: 'D', color: '#ef4444' };
  };

  const gradeInfo = getGrade(result.percentage);

  // Sort answers by question number for sequential display
  const sortedAnswers = result.answers ? [...result.answers].map((answer, index) => ({
    ...answer,
    displayIndex: index + 1 // Fallback index starting from 1
  })).sort((a, b) => {
    // Use questionNumber if available, otherwise use displayIndex
    const numA = a.questionNumber !== null && a.questionNumber !== undefined ? a.questionNumber : a.displayIndex;
    const numB = b.questionNumber !== null && b.questionNumber !== undefined ? b.questionNumber : b.displayIndex;
    return numA - numB;
  }) : [];

  return (
    <div className="demo-result-container">
        
        {/* Lead Capture Modal - Only for non-logged-in users - BLOCKS ACCESS TO RESULTS */}
        {showLeadForm && (
          <div className="lead-modal-overlay non-dismissible">
            <div className="lead-modal">
              <div className="lead-modal-header">
                <h2>🎉 Congratulations on Completing the Test!</h2>
                <p>Please enter your details to unlock and view your detailed performance report</p>
              </div>
              
              <form onSubmit={handleLeadSubmit} className="lead-form">
                <div className="form-group">
                  <label htmlFor="leadName">Full Name *</label>
                  <input
                    type="text"
                    id="leadName"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    placeholder="Enter your full name"
                    className="form-input"
                    required
                    autoFocus
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="leadPhone">Mobile Number *</label>
                  <input
                    type="tel"
                    id="leadPhone"
                    value={leadPhone}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, ''); // Only digits
                      if (value.length <= 10) {
                        setLeadPhone(value);
                      }
                    }}
                    placeholder="Enter 10-digit mobile number"
                    className="form-input"
                    maxLength="10"
                    pattern="[6-9][0-9]{9}"
                    required
                  />
                  <small className="form-hint">📱 Get updates on new tests & study tips</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="leadEmail">Email (Optional)</label>
                  <input
                    type="email"
                    id="leadEmail"
                    value={leadEmail}
                    onChange={(e) => setLeadEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    className="form-input"
                  />
                </div>
                
                <button 
                  type="submit" 
                  className="lead-submit-btn"
                  disabled={submittingLead}
                >
                  {submittingLead ? '⏳ Submitting...' : '🚀 Unlock My Results'}
                </button>
                
                <p className="lead-privacy-note">
                  🔒 Your information is secure. We respect your privacy and won't spam you.
                </p>
              </form>
            </div>
          </div>
        )}
        
        {/* Results Dashboard - Blurred when modal is showing */}
        <div className={`results-content ${showLeadForm ? 'blurred' : ''}`}>
        
        {/* Subject-wise Scorecard - Top Section */}
        {(() => {
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
            <div style={{ 
              marginBottom: '2rem', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white', 
              padding: '2rem', 
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
            }}>
              <h3 style={{ color: 'white', fontSize: '1.4rem', marginBottom: '1.5rem', fontWeight: '700', textAlign: 'center' }}>📊 Subject-wise Scorecard</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '0.95rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                      <th style={{ padding: '0.9rem', textAlign: 'left', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>Metric</th>
                      {subjects.map(subject => (
                        <th key={subject} style={{ padding: '0.9rem', textAlign: 'center', fontWeight: '700', color: 'white', borderBottom: '2px solid rgba(255, 255, 255, 0.2)' }}>{subject}</th>
                      ))}
                      <th style={{ padding: '0.9rem', textAlign: 'center', fontWeight: '800', color: 'white', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderBottom: '2px solid rgba(255, 255, 255, 0.3)' }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <td style={{ padding: '0.9rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>Marks Scored</td>
                      {subjects.map(subject => {
                        const maxMarks = subjectMarks[subject].total * 4;
                        const percentage = ((subjectMarks[subject].score / maxMarks) * 100).toFixed(0);
                        return (
                          <td key={subject} style={{ padding: '0.9rem', textAlign: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                            <div style={{ fontWeight: '800', fontSize: '1.2rem', color: 'white', marginBottom: '0.25rem' }}>
                              {subjectMarks[subject].score}/{maxMarks}
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'rgba(255, 255, 255, 0.7)' }}>{percentage}%</div>
                          </td>
                        );
                      })}
                      <td style={{ padding: '0.9rem', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                        <div style={{ fontWeight: '900', fontSize: '1.4rem', color: 'white', marginBottom: '0.25rem' }}>
                          {result.score}/{result.totalMarks}
                        </div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.8)' }}>{result.percentage.toFixed(1)}%</div>
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'rgba(34, 197, 94, 0.15)' }}>
                      <td style={{ padding: '0.9rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>✓ Correct</td>
                      {subjects.map(subject => (
                        <td key={subject} style={{ padding: '0.9rem', textAlign: 'center', color: '#86efac', fontWeight: '700', fontSize: '1.1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          {subjectMarks[subject].correct}
                        </td>
                      ))}
                      <td style={{ padding: '0.9rem', textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#86efac', backgroundColor: 'rgba(34, 197, 94, 0.2)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                        {result.correctAnswers}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)' }}>
                      <td style={{ padding: '0.9rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>✗ Incorrect</td>
                      {subjects.map(subject => (
                        <td key={subject} style={{ padding: '0.9rem', textAlign: 'center', color: '#fca5a5', fontWeight: '700', fontSize: '1.1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          {subjectMarks[subject].incorrect}
                        </td>
                      ))}
                      <td style={{ padding: '0.9rem', textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.2)', borderBottom: '1px solid rgba(255, 255, 255, 0.2)' }}>
                        {result.incorrectAnswers}
                      </td>
                    </tr>
                    <tr style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)' }}>
                      <td style={{ padding: '0.9rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>○ Unattempted</td>
                      {subjects.map(subject => (
                        <td key={subject} style={{ padding: '0.9rem', textAlign: 'center', color: '#fcd34d', fontWeight: '700', fontSize: '1.1rem' }}>
                          {subjectMarks[subject].unattempted}
                        </td>
                      ))}
                      <td style={{ padding: '0.9rem', textAlign: 'center', fontWeight: '800', fontSize: '1.2rem', color: '#fcd34d', backgroundColor: 'rgba(245, 158, 11, 0.2)' }}>
                        {result.unattempted}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ) : null;
        })()}
        
        {/* Dashboard Grid */}
        <div className="demo-dashboard-grid">
          
          {/* Student Performance Card - Circular Progress */}
          <div className="demo-card">
            <h3 className="demo-card-title">📊 Student Performance</h3>
            <div className="circular-progress-container">
              <div className="circular-progress">
                <svg width="200" height="200" className="progress-ring">
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="16"
                  />
                  <circle
                    cx="100"
                    cy="100"
                    r={radius}
                    fill="none"
                    stroke={progressPercentage >= 70 ? '#22C55E' : progressPercentage >= 40 ? '#F59E0B' : '#EF4444'}
                    strokeWidth="16"
                    strokeDasharray={circumference}
                    strokeDashoffset={progressOffset}
                    strokeLinecap="round"
                    className="progress-ring-circle"
                  />
                </svg>
                <div className="progress-value">{displayPercentage.toFixed(1)}%</div>
              </div>
              <div className="progress-label">Overall Score</div>
              <div className="progress-sublabel">
                Time: {Math.floor(result.timeTaken / 60)}m {result.timeTaken % 60}s
              </div>
            </div>
            
            {/* Mini Stats Grid */}
            <div className="stats-mini-grid">
              <div className="stat-mini-card">
                <div className="stat-mini-value" style={{ color: '#22C55E' }}>{result.correctAnswers}</div>
                <div className="stat-mini-label">Correct</div>
              </div>
              <div className="stat-mini-card">
                <div className="stat-mini-value" style={{ color: '#EF4444' }}>{result.incorrectAnswers}</div>
                <div className="stat-mini-label">Incorrect</div>
              </div>
              <div className="stat-mini-card">
                <div className="stat-mini-value" style={{ color: '#F59E0B' }}>{result.unattempted}</div>
                <div className="stat-mini-label">Skipped</div>
              </div>
            </div>

            {/* AI Suggestions Section */}
            <div className="ai-suggestion-section">
              <button 
                className="ai-suggestion-btn"
                onClick={fetchAIFeedback}
                disabled={loadingAI}
              >
                {loadingAI ? '🤖 Analyzing Performance...' : '🤖 Get AI Performance Insights'}
              </button>
              
              {aiFeedback && (
                <div className="ai-feedback-box">
                  <div className="ai-feedback-header">
                    <span>🤖 AI Performance Analysis</span>
                    <button 
                      className="close-feedback-btn" 
                      onClick={() => setAiFeedback(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="ai-feedback-content">
                    {aiFeedback}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Time Analysis Cards */}
          {slowQuestions.length > 0 && (
            <div className="demo-card" style={{ borderLeft: '4px solid #ff9800' }}>
              <h3 className="demo-card-title">
                <span style={{ fontSize: '1.5rem' }}>⚠️</span> Slow Questions ({">"} 3 minutes)
              </h3>
              <p style={{ color: '#d84315', marginBottom: '15px', fontSize: '0.95rem' }}>
                These questions took longer than expected. Practice similar problems to improve speed.
              </p>
              <ul className="weak-topics-list">
                {slowQuestions.map((question, idx) => (
                  <li key={idx} className="weak-topic-item">
                    <span className="topic-bullet" style={{ background: '#ff9800' }}></span>
                    <span className="topic-name">
                      Q{question.questionNumber || (question.originalIndex + 1)} - {question.subject}
                      {question.topic && question.topic !== 'General' && ` (${question.topic})`}
                    </span>
                    <span className="topic-count" style={{ color: '#d84315', fontWeight: '600' }}>
                      {Math.floor(question.timeBreakdown.totalTime / 60)}m {question.timeBreakdown.totalTime % 60}s
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {subjectAverages.length > 0 && (
            <div className="demo-card">
              <h3 className="demo-card-title">
                <span style={{ fontSize: '1.5rem' }}>📊</span> Average Time per Subject
              </h3>
              <div className="practice-chart">
                {subjectAverages.map((stat, idx) => (
                  <div key={idx} className="chart-bar-item">
                    <div className="chart-bar-header">
                      <span className="chart-bar-label">{stat.subject}</span>
                      <span className="chart-bar-value">
                        {Math.floor(stat.avgTime / 60)}m {stat.avgTime % 60}s avg ({stat.questionCount} questions)
                      </span>
                    </div>
                    <div className="chart-bar-bg">
                      <div 
                        className="chart-bar-fill" 
                        style={{ 
                          width: `${Math.min((stat.avgTime / 240) * 100, 100)}%`,
                          background: stat.avgTime > 180 ? '#ff9800' : '#17a2b8'
                        }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weak Topics Card */}
          <div className="demo-card">
            <h3 className="demo-card-title">
              <span style={{ fontSize: '1.5rem' }}>📉</span> Weak Topics
            </h3>
            {weakChapters.length > 0 ? (
              <>
                <ul className="weak-topics-list">
                  {weakChapters.slice(0, showAllWeak ? weakChapters.length : 3).map((chapter, idx) => {
                    const topicsDisplay = chapter.topics.length > 1 
                      ? chapter.topics.join(', ') 
                      : chapter.topics[0];
                    
                    return (
                      <li key={idx} className="weak-topic-item">
                        <span className="topic-bullet"></span>
                        <span className="topic-name">{chapter.chapter} ({topicsDisplay})</span>
                        <span className="topic-count">{chapter.totalIncorrect} wrong</span>
                      </li>
                    );
                  })}
                </ul>
                
                {weakChapters.length > 3 && (
                  <button 
                    onClick={() => setShowAllWeak(!showAllWeak)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '1rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#374151',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e5e7eb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {showAllWeak ? '▲ Show Less' : `▼ Show More (${weakChapters.length - 3} more)`}
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                🎉 Great! No weak topics identified. Keep up the excellent work!
              </p>
            )}
          </div>

          {/* Strength Areas Card */}
          <div className="demo-card">
            <h3 className="demo-card-title">
              <span style={{ fontSize: '1.5rem' }}>✅</span> Strength Topics
            </h3>
            {strengthChapters.length > 0 ? (
              <>
                <ul className="weak-topics-list">
                  {strengthChapters.slice(0, showAllStrength ? strengthChapters.length : 3).map((chapter, idx) => {
                    const topicsDisplay = chapter.topics.length > 1 
                      ? chapter.topics.join(', ') 
                      : chapter.topics[0];
                    
                    return (
                      <li key={idx} className="weak-topic-item">
                        <span className="topic-bullet strength"></span>
                        <span className="topic-name">{chapter.chapter} ({topicsDisplay})</span>
                        <span className="topic-count">{chapter.totalCorrect} correct</span>
                      </li>
                    );
                  })}
                </ul>
                
                {strengthChapters.length > 3 && (
                  <button 
                    onClick={() => setShowAllStrength(!showAllStrength)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '1rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#374151',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e5e7eb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {showAllStrength ? '▲ Show Less' : `▼ Show More (${strengthChapters.length - 3} more)`}
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                Keep practicing to build your strengths!
              </p>
            )}
          </div>

          {/* Recommended Practice Card */}
          <div className="demo-card">
            <h3 className="demo-card-title">
              <span style={{ fontSize: '1.5rem' }}>🎯</span> Recommended Practice
            </h3>
            {recommendedChapters.length > 0 ? (
              <>
                <div className="practice-chart">
                  {recommendedChapters.slice(0, showAllRecommended ? recommendedChapters.length : 3).map((chapter, idx) => {
                    const needsPractice = chapter.totalIncorrect + chapter.totalUnattempted;
                    const percentage = (needsPractice / chapter.totalQuestions) * 100;
                    const topicsDisplay = chapter.topics.length > 1 
                      ? chapter.topics.join(', ') 
                      : chapter.topics[0];
                    
                    return (
                      <div key={idx} className="chart-bar-item">
                        <div className="chart-bar-header">
                          <span className="chart-bar-label">
                            {chapter.chapter} ({topicsDisplay})
                          </span>
                          <span className="chart-bar-value">{needsPractice} questions</span>
                        </div>
                        <div className="chart-bar-bg">
                          <div 
                            className="chart-bar-fill" 
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {recommendedChapters.length > 3 && (
                  <button 
                    onClick={() => setShowAllRecommended(!showAllRecommended)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      marginTop: '1rem',
                      backgroundColor: '#f3f4f6',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: '#374151',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#e5e7eb';
                      e.target.style.borderColor = '#d1d5db';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f3f4f6';
                      e.target.style.borderColor = '#e5e7eb';
                    }}
                  >
                    {showAllRecommended ? '▲ Show Less' : `▼ Show More (${recommendedChapters.length - 3} more)`}
                  </button>
                )}
              </>
            ) : (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>
                Excellent! You've mastered all topics in this test.
              </p>
            )}
          </div>
        </div>

        {/* Detailed Solutions Section */}
        <div className="solutions-section">
          <div 
            className="solutions-toggle"
            onClick={() => setShowSolutions(!showSolutions)}
          >
            <h2>📝 Detailed Analysis - Questions with Solutions</h2>
            <span className={`toggle-icon ${showSolutions ? 'open' : ''}`}>▼</span>
          </div>

          <div style={{ textAlign: 'right', marginBottom: '1rem' }}>
            <button 
              onClick={exportToPDF} 
              style={{ 
                padding: '0.5rem 1rem', 
                backgroundColor: '#3b82f6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '8px', 
                cursor: 'pointer', 
                fontWeight: '600' 
              }}
            >
              📄 Export to PDF
            </button>
          </div>

          {showSolutions && (
            <>
              {sortedAnswers.map((answer, qIdx) => {
                const isCorrect = answer.isCorrect;
                const isUnattempted = answer.userAnswer === null || answer.userAnswer === undefined;
                const questionClass = isCorrect ? 'correct' : (isUnattempted ? 'unattempted' : 'incorrect');
                
                return (
                  <div key={qIdx} className={`question-card ${questionClass}`}>
                    {/* Subject/Chapter/Topic Badge */}
                    <div style={{ marginBottom: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {answer.subject && (
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          backgroundColor: '#3b82f6', 
                          color: 'white', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600' 
                        }}>
                          {answer.subject}
                        </span>
                      )}
                      {answer.chapter && (
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          backgroundColor: '#8b5cf6', 
                          color: 'white', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600' 
                        }}>
                          {answer.chapter}
                        </span>
                      )}
                      {answer.topic && (
                        <span style={{ 
                          padding: '0.25rem 0.75rem', 
                          backgroundColor: '#ec4899', 
                          color: 'white', 
                          borderRadius: '12px', 
                          fontSize: '0.75rem', 
                          fontWeight: '600' 
                        }}>
                          {answer.topic}
                        </span>
                      )}
                    </div>

                    <span className={`question-status-badge ${questionClass}`}>
                      {isCorrect ? '✓ CORRECT' : (isUnattempted ? '− UNATTEMPTED' : '✗ INCORRECT')}
                      {' • '}
                      Marks: {answer.marksAwarded > 0 ? `+${answer.marksAwarded}` : answer.marksAwarded}
                    </span>

                    <p className="question-text">
                      {/* Show question number (prefer snapshot) and question text (snapshot or populated) */}
                      <strong style={{ display: 'block', marginBottom: '6px' }}>
                        Q{answer.questionNumber || (qIdx + 1)}
                      </strong>
                      <LatexRenderer content={answer.questionText || answer.questionId?.question || 'Question not available'} />
                    </p>

                    {(answer.questionId?.questionImage || answer.questionImage) && (
                      <div style={{ marginTop: '1rem', marginBottom: '1rem' }}>
                        <img 
                          src={answer.questionImage || answer.questionId?.questionImage} 
                          alt="Question diagram" 
                          style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px' }} 
                        />
                      </div>
                    )}
                    
                    <div style={{ 
                      padding: '15px', 
                      background: 'var(--light-bg)', 
                      borderRadius: '10px', 
                      marginBottom: '15px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}>
                      <div>
                        <strong>Your Answer: </strong>
                        <span style={{ color: isUnattempted ? 'var(--orange-accent)' : 'var(--text-primary)' }}>
                          {isUnattempted ? 
                            'Not Attempted' : 
                            ((answer.questionType || answer.questionId?.questionType) === 'numerical' ? 
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
                                      <span style={{ color: 'var(--success-green)', fontWeight: '600' }}>
                                        {((answer.questionType || answer.questionId?.questionType) === 'numerical') ? 
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
                                  
                                  {/* Time Tracking Display */}
                                  {answer.timeBreakdown && answer.timeBreakdown.totalTime > 0 && (
                                    <div style={{ 
                                      padding: '12px 15px', 
                                      background: answer.timeBreakdown.totalTime > 180 ? '#fff3cd' : '#d1ecf1', 
                                      borderRadius: '8px', 
                                      marginBottom: '15px',
                                      borderLeft: `4px solid ${answer.timeBreakdown.totalTime > 180 ? '#ff9800' : '#17a2b8'}`
                                    }}>
                                      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', fontSize: '0.9rem' }}>
                                        <div>
                                          <strong>⏱️ First Visit: </strong>
                                          <span>{answer.timeBreakdown.firstVisit}s</span>
                                        </div>
                                        {answer.timeBreakdown.revisits && answer.timeBreakdown.revisits.length > 0 && (
                                          <div>
                                            <strong>🔄 Revisits: </strong>
                                            <span>{answer.timeBreakdown.revisits.join('s, ')}s ({answer.timeBreakdown.revisits.length} times)</span>
                                          </div>
                                        )}
                                        <div>
                                          <strong>📊 Total Time: </strong>
                                          <span style={{ 
                                            color: answer.timeBreakdown.totalTime > 180 ? '#d84315' : '#00695c',
                                            fontWeight: '600'
                                          }}>
                                            {answer.timeBreakdown.totalTime}s
                                            {answer.timeBreakdown.totalTime > 180 && ' ⚠️ Slow'}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {(answer.options || answer.questionId?.options) && (answer.options || answer.questionId?.options).length > 0 && (
                                    <ul className="options-list">
                                      {(answer.options || answer.questionId?.options).map((option, optIdx) => {
                                        // Normalize user answer to index (0-3)
                                        let normalizedUserAnswer;
                                        if (typeof answer.userAnswer === 'string' && answer.userAnswer.length === 1 && answer.userAnswer.match(/[A-D]/i)) {
                                          normalizedUserAnswer = answer.userAnswer.toUpperCase().charCodeAt(0) - 65;
                                        } else if (!isNaN(answer.userAnswer)) {
                                          normalizedUserAnswer = parseInt(answer.userAnswer);
                                        } else {
                                          normalizedUserAnswer = -1;
                                        }
                                        
                                        // Normalize correct answer to index (0-3)
                                        let normalizedCorrectAnswer;
                                        if (typeof answer.correctAnswer === 'string' && answer.correctAnswer.length === 1 && answer.correctAnswer.match(/[A-D]/i)) {
                                          normalizedCorrectAnswer = answer.correctAnswer.toUpperCase().charCodeAt(0) - 65;
                                        } else if (!isNaN(answer.correctAnswer)) {
                                          normalizedCorrectAnswer = parseInt(answer.correctAnswer);
                                        } else {
                                          normalizedCorrectAnswer = -1;
                                        }
                                        
                                        const isCorrectOption = optIdx === normalizedCorrectAnswer;
                                        const isUserOption = optIdx === normalizedUserAnswer;
                                        
                                        // Debug logging for the first option
                                        if (qIdx === 0 && optIdx === 0) {
                                          console.log('DEBUG Answer comparison:', {
                                            questionNumber: answer.questionNumber,
                                            userAnswer: answer.userAnswer,
                                            userAnswerType: typeof answer.userAnswer,
                                            correctAnswer: answer.correctAnswer,
                                            correctAnswerType: typeof answer.correctAnswer,
                                            normalizedUser: normalizedUserAnswer,
                                            normalizedCorrect: normalizedCorrectAnswer,
                                            isCorrect: answer.isCorrect,
                                            optIdx: optIdx,
                                            isCorrectOption,
                                            isUserOption
                                          });
                                        }
                                        
                                        const optionImages = answer.optionImages || answer.questionId?.optionImages;
                                        
                                        return (
                                          <li 
                                            key={optIdx}
                                            className={`option-item ${isCorrectOption ? 'correct-option' : ''} ${isUserOption && !isCorrectOption ? 'user-option' : ''}`}
                                          >
                                            <strong>{String.fromCharCode(65 + optIdx)}.</strong> 
                                            <span style={{ marginLeft: '8px' }}>
                                              <LatexRenderer content={option} />
                                            </span>
                                            {optionImages && optionImages[optIdx] && (
                                              <div style={{ marginTop: '8px', marginLeft: '24px' }}>
                                                <img 
                                                  src={optionImages[optIdx]} 
                                                  alt={`Option ${String.fromCharCode(65 + optIdx)} diagram`} 
                                                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px' }} 
                                                />
                                              </div>
                                            )}
                                            {isCorrectOption && <span style={{ color: 'var(--success-green)', marginLeft: '10px', fontWeight: 'bold' }}>✓</span>}
                                            {isUserOption && !isCorrectOption && <span style={{ color: 'var(--warning-red)', marginLeft: '10px', fontWeight: 'bold' }}>✗ Your Answer</span>}
                                            {isUserOption && isCorrectOption && <span style={{ color: 'var(--success-green)', marginLeft: '10px', fontWeight: 'bold' }}>✓ Your Answer</span>}
                                          </li>
                                        );
                                      })}
                                    </ul>
                                  )}
                                  
                                  {answer.questionId?.questionType === 'numerical' && (
                                    <div style={{ 
                                      marginBottom: '15px', 
                                      padding: '12px', 
                                      background: 'var(--light-bg)', 
                                      borderRadius: '8px',
                                      borderLeft: '4px solid var(--navy-primary)'
                                    }}>
                                      <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                                        <strong>Type:</strong> Numerical Answer Question
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div className="solution-box">
                                    <h6>💡 Solution:</h6>
                                    <p>
                                      <LatexRenderer content={answer.explanation || 'Solution not available'} />
                                    </p>
                                    {(answer.explanationImage || answer.questionId?.explanationImage) && (
                                      <div style={{ marginTop: '1rem' }}>
                                        <img 
                                          src={answer.explanationImage || answer.questionId?.explanationImage} 
                                          alt="Solution diagram" 
                                          style={{ maxWidth: '100%', maxHeight: '320px', borderRadius: '8px' }} 
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
            </>
          )}
        </div>

        {/* CTA Section */}
        <div style={{ 
          marginTop: '50px', 
          textAlign: 'center', 
          paddingBottom: '60px',
          background: 'linear-gradient(135deg, var(--navy-primary) 0%, var(--navy-dark) 100%)',
          padding: '60px 40px',
          borderRadius: '25px',
          color: 'white'
        }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '15px' }}>Ready to Master Your Exam?</h2>
          <p style={{ fontSize: '1.2rem', marginBottom: '30px', opacity: 0.9 }}>
            Join thousands of students using AI-powered personalized learning
          </p>
          <Link to="/register" className="cta-button">
            🚀 Register for Full Access & More Tests
          </Link>
        </div>
        
      </div>
      </div>
    
  );
};

export default DemoResultDetail;

