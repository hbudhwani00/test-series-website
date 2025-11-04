import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import LatexRenderer from '../../components/LatexRenderer';
import './ManageDemoTest.css';
import { API_URL } from '../../services/api';

const ManageDemoTest = () => {
  const [demoTest, setDemoTest] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [bulkQuestions, setBulkQuestions] = useState('');
  const [allQuestions, setAllQuestions] = useState([]); // Store all questions from DB
  
  const [questionForm, setQuestionForm] = useState({
    examType: 'JEE',
    subject: 'Physics',
    chapter: '',
    topic: '',
    source: 'Practice',
    questionType: 'single',
    section: 'A',
    questionNumber: '',
    question: '',
    questionImage: '',
    options: ['', '', '', ''],
    optionImages: ['', '', '', ''],
    correctAnswer: '',
    explanation: '',
    explanationImage: '',
    difficulty: 'medium',
    marks: 4,
    negativeMarks: -1
  });

  useEffect(() => {
    fetchDemoTest();
    fetchAllQuestions(); // Fetch all questions for auto-fill
  }, []);

  const fetchAllQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/questions?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const fetchDemoTest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/demo-test`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDemoTest(data.demoTest);
    } catch (error) {
      if (error.response?.status === 404) {
        toast.info('No demo test found. Create one first.');
      } else {
        toast.error('Failed to fetch demo test');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDemoTest = async () => {
    const title = prompt('Enter Demo Test Title:', 'JEE Main 2026 Demo Test');
    if (!title) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/demo-test/create`,
        {
          title,
          description: 'Official Demo Test',
          examType: 'JEE',
          duration: 180,
          totalMarks: 300
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Demo test created successfully!');
      fetchDemoTest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create demo test');
    }
  };

  // Check for duplicate question
  const checkDuplicate = (questionText) => {
    const normalizedInput = questionText.trim().toLowerCase();
    
    // Check in demo test questions
    if (demoTest?.questions) {
      const duplicate = demoTest.questions.find(
        q => q.question.trim().toLowerCase() === normalizedInput
      );
      if (duplicate) return { isDuplicate: true, source: 'Demo Test' };
    }
    
    return { isDuplicate: false };
  };

  // Auto-fill from existing questions
  const handleQuestionTextChange = (e) => {
    const questionText = e.target.value;
    setQuestionForm({ ...questionForm, question: questionText });
    
    // If text is long enough, try to find matching question
    if (questionText.trim().length > 20) {
      const normalizedInput = questionText.trim().toLowerCase();
      const matchingQuestion = allQuestions.find(
        q => q.question.trim().toLowerCase() === normalizedInput
      );
      
      if (matchingQuestion) {
        // Auto-fill all fields
        toast.info('Question found! Auto-filling details...', { autoClose: 2000 });
        setQuestionForm({
          ...questionForm,
          question: matchingQuestion.question,
          questionImage: matchingQuestion.questionImage || '',
          examType: matchingQuestion.examType || 'JEE',
          subject: matchingQuestion.subject || 'Physics',
          chapter: matchingQuestion.chapter || '',
          topic: matchingQuestion.topic || '',
          source: matchingQuestion.source || 'Practice',
          questionType: matchingQuestion.questionType || 'single',
          options: matchingQuestion.options?.length ? matchingQuestion.options : ['', '', '', ''],
          optionImages: matchingQuestion.optionImages?.length ? matchingQuestion.optionImages : ['', '', '', ''],
          correctAnswer: matchingQuestion.correctAnswer !== undefined ? matchingQuestion.correctAnswer.toString() : '',
          explanation: matchingQuestion.explanation || '',
          explanationImage: matchingQuestion.explanationImage || '',
          difficulty: matchingQuestion.difficulty || 'medium',
        });
      }
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    
    // Check for duplicates before adding
    if (!editingQuestionId) {
      const duplicateCheck = checkDuplicate(questionForm.question);
      if (duplicateCheck.isDuplicate) {
        toast.error(`This question already exists in ${duplicateCheck.source}!`);
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingQuestionId) {
        // Update existing question
        await axios.put(
          `${API_URL}/admin/demo-test/update-question/${editingQuestionId}`,
          questionForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Question updated successfully!');
        setEditingQuestionId(null);
      } else {
        // Add new question
        await axios.post(
          `${API_URL}/admin/demo-test/add-question`,
          questionForm,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Question added successfully!');
      }
      
      setShowQuestionForm(false);
      setShowPreview(false);
      setQuestionForm({
        examType: 'JEE',
        subject: 'Physics',
        chapter: '',
        topic: '',
        source: 'Practice',
        questionType: 'single',
        section: 'A',
        questionNumber: '',
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        explanation: '',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: -1
      });
      fetchDemoTest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save question');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question._id);
    setQuestionForm({
      examType: question.examType,
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      source: question.source || 'Practice',
      questionType: question.questionType,
      section: question.section,
      questionNumber: question.questionNumber || '',
      question: question.question,
      options: question.options.length ? question.options : ['', '', '', ''],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      difficulty: question.difficulty,
      marks: question.marks,
      negativeMarks: question.negativeMarks
    });
    setShowQuestionForm(true);
    setShowPreview(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setShowQuestionForm(false);
    setShowPreview(false);
    setQuestionForm({
      examType: 'JEE',
      subject: 'Physics',
      chapter: '',
      topic: '',
      source: 'Practice',
      questionType: 'single',
      section: 'A',
      questionNumber: '',
      question: '',
      options: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      difficulty: 'medium',
      marks: 4,
      negativeMarks: -1
    });
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to remove this question?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/admin/demo-test/remove-question/${questionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Question removed successfully!');
      fetchDemoTest();
    } catch (error) {
      toast.error('Failed to remove question');
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkQuestions.trim()) {
      toast.error('Please paste question numbers');
      return;
    }

    try {
      // Parse question numbers from input
      const questionNumbers = bulkQuestions
        .split(/[\n,]/)
        .map(num => num.trim())
        .filter(num => num && !isNaN(num))
        .map(num => parseInt(num));

      if (questionNumbers.length === 0) {
        toast.error('No valid question numbers found');
        return;
      }

      // Find questions from allQuestions that match the question numbers
      const questionsToAdd = [];
      const notFound = [];

      for (const qNum of questionNumbers) {
        const found = allQuestions.find(q => q.questionNumber === qNum);
        if (found) {
          // Check if already in demo test
          const duplicate = demoTest.questions.find(
            dq => dq.question.trim().toLowerCase() === found.question.trim().toLowerCase()
          );
          if (!duplicate) {
            questionsToAdd.push(found);
          }
        } else {
          notFound.push(qNum);
        }
      }

      if (questionsToAdd.length === 0) {
        toast.warning('All questions are either duplicates or not found');
        return;
      }

      // Add questions one by one
      const token = localStorage.getItem('token');
      let successCount = 0;

      for (const question of questionsToAdd) {
        try {
          await axios.post(
            `${API_URL}/admin/demo-test/add-question`,
            question,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to add question ${question.questionNumber}:`, error);
        }
      }

      toast.success(`${successCount} questions added successfully!`);
      if (notFound.length > 0) {
        toast.warning(`Question numbers not found: ${notFound.join(', ')}`);
      }

      setBulkQuestions('');
      setShowBulkUpload(false);
      fetchDemoTest();
    } catch (error) {
      toast.error('Bulk upload failed');
      console.error(error);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="manage-demo-test">
      <div className="header">
        <h1>Manage Demo Test</h1>
        {!demoTest && (
          <button className="btn btn-primary" onClick={handleCreateDemoTest}>
            Create Demo Test
          </button>
        )}
      </div>

      {demoTest && (
        <>
          <div className="demo-test-info card">
            <h2>{demoTest.title}</h2>
            <p>{demoTest.description}</p>
            <div className="test-stats">
              <span>Duration: {demoTest.duration} minutes</span>
              <span>Total Marks: {demoTest.totalMarks}</span>
              <span>Questions: {demoTest.questions?.length || 0}</span>
            </div>
          </div>

          <div className="actions">
            <button 
              className="btn btn-success" 
              onClick={() => {
                setShowQuestionForm(!showQuestionForm);
                setShowBulkUpload(false);
              }}
            >
              {showQuestionForm ? 'Cancel' : '+ Add Question'}
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setShowBulkUpload(!showBulkUpload);
                setShowQuestionForm(false);
              }}
              style={{ marginLeft: '10px' }}
            >
              {showBulkUpload ? 'Cancel' : '📋 Bulk Upload'}
            </button>
          </div>

          {showBulkUpload && (
            <div className="bulk-upload-form card">
              <h3>Bulk Upload Questions</h3>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Enter question numbers (comma or newline separated) to add from your question bank:
              </p>
              <textarea
                value={bulkQuestions}
                onChange={(e) => setBulkQuestions(e.target.value)}
                placeholder="Example:&#10;1, 5, 12, 23&#10;or&#10;1&#10;5&#10;12&#10;23"
                rows="6"
                style={{ width: '100%', padding: '10px', fontSize: '14px' }}
              />
              <div className="form-actions" style={{ marginTop: '15px' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowBulkUpload(false);
                    setBulkQuestions('');
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleBulkUpload}
                >
                  Upload Questions
                </button>
              </div>
            </div>
          )}

          {showQuestionForm && (
            <div className="question-form card">
              <h3>{editingQuestionId ? 'Edit Question' : 'Add New Question'}</h3>
              <form onSubmit={handleAddQuestion}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Subject *</label>
                    <select
                      value={questionForm.subject}
                      onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value })}
                      required
                    >
                      <option value="Physics">Physics</option>
                      <option value="Chemistry">Chemistry</option>
                      <option value="Mathematics">Mathematics</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Question Type *</label>
                    <select
                      value={questionForm.questionType}
                      onChange={(e) => setQuestionForm({ ...questionForm, questionType: e.target.value })}
                      required
                    >
                      <option value="single">Single Choice (MCQ)</option>
                      <option value="numerical">Numerical</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Section *</label>
                    <select
                      value={questionForm.section}
                      onChange={(e) => setQuestionForm({ ...questionForm, section: e.target.value })}
                      required
                    >
                      <option value="A">Section A (MCQ with -ve marking)</option>
                      <option value="B">Section B (Numerical, no -ve)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Question Number *</label>
                    <input
                      type="number"
                      value={questionForm.questionNumber}
                      onChange={(e) => setQuestionForm({ ...questionForm, questionNumber: e.target.value })}
                      placeholder="e.g., 1, 5, 23"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Chapter *</label>
                    <input
                      type="text"
                      value={questionForm.chapter}
                      onChange={(e) => setQuestionForm({ ...questionForm, chapter: e.target.value })}
                      placeholder="e.g., Kinematics"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Topic *</label>
                    <input
                      type="text"
                      value={questionForm.topic}
                      onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                      placeholder="e.g., Projectile Motion"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Source *</label>
                    <input
                      type="text"
                      value={questionForm.source}
                      onChange={(e) => setQuestionForm({ ...questionForm, source: e.target.value })}
                      placeholder="e.g., NCERT, PYQ, Practice"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Question * <span style={{ fontSize: '12px', color: '#666' }}>(Auto-fills if question exists)</span></label>
                  <textarea
                    value={questionForm.question}
                    onChange={handleQuestionTextChange}
                    placeholder="Enter question text (will auto-fill if found in question bank)"
                    rows="4"
                    required
                  />
                </div>

                {questionForm.questionType === 'single' && (
                  <>
                    <label>Options *</label>
                    {questionForm.options.map((option, index) => (
                      <div key={index} className="form-group">
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...questionForm.options];
                            newOptions[index] = e.target.value;
                            setQuestionForm({ ...questionForm, options: newOptions });
                          }}
                          placeholder={`Option ${index + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Correct Answer *</label>
                    <input
                      type="text"
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      placeholder={questionForm.questionType === 'single' ? '0, 1, 2, or 3' : 'Numerical value'}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Difficulty *</label>
                    <select
                      value={questionForm.difficulty}
                      onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                      required
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Solution/Explanation *</label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    placeholder="Enter detailed solution"
                    rows="3"
                    required
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide Preview' : '👁️ Preview Question'}
                  </button>
                  {editingQuestionId && (
                    <button 
                      type="button" 
                      className="btn btn-cancel"
                      onClick={handleCancelEdit}
                    >
                      Cancel Edit
                    </button>
                  )}
                  <button type="submit" className="btn btn-primary">
                    {editingQuestionId ? 'Update Question' : 'Add Question'}
                  </button>
                </div>

                {showPreview && (
                  <div className="question-preview">
                    <h4>📋 Preview - How Students Will See This</h4>
                    <div className="preview-container">
                      <div className="preview-header">
                        <span className="preview-number">Q{questionForm.questionNumber || '?'}</span>
                        <span className="preview-badge">{questionForm.subject}</span>
                        <span className="preview-badge">{questionForm.chapter}</span>
                        <span className="preview-badge">{questionForm.topic}</span>
                        <span className="preview-badge">Section {questionForm.section}</span>
                        <span className="preview-marks">{questionForm.marks} marks</span>
                        {questionForm.section === 'A' && (
                          <span className="preview-negative">(-{Math.abs(questionForm.negativeMarks)} for wrong)</span>
                        )}
                      </div>

                      <div className="preview-question">
                        <div className="preview-question-text">
                          {questionForm.question ? (
                            <LatexRenderer content={questionForm.question} />
                          ) : (
                            <em>Question text will appear here...</em>
                          )}
                        </div>
                        {questionForm.questionImage && (
                          <div className="preview-image mt-3">
                            <img 
                              src={questionForm.questionImage} 
                              alt="Question diagram" 
                              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                            />
                          </div>
                        )}
                      </div>

                      {questionForm.questionType === 'single' && (
                        <div className="preview-options">
                          {questionForm.options.map((option, index) => (
                            <div 
                              key={index} 
                              className={`preview-option ${questionForm.correctAnswer == index ? 'correct-answer' : ''}`}
                            >
                              <span className="option-label">{String.fromCharCode(65 + index)})</span>
                              <span className="option-text">
                                {option ? (
                                  <LatexRenderer content={option} />
                                ) : (
                                  <em>Option {index + 1} will appear here...</em>
                                )}
                              </span>
                              {questionForm.correctAnswer == index && <span className="correct-indicator">✓ Correct</span>}
                              {questionForm.optionImages && questionForm.optionImages[index] && (
                                <div className="option-image mt-2">
                                  <img 
                                    src={questionForm.optionImages[index]} 
                                    alt={`Option ${String.fromCharCode(65 + index)}`} 
                                    style={{ maxWidth: '300px', maxHeight: '150px', objectFit: 'contain' }}
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {questionForm.questionType === 'numerical' && (
                        <div className="preview-numerical">
                          <input 
                            type="text" 
                            placeholder="Student will type numerical answer here..." 
                            className="preview-input"
                            disabled
                          />
                          <p className="preview-hint">Correct Answer: <strong>{questionForm.correctAnswer || 'Not set'}</strong></p>
                        </div>
                      )}

                      <div className="preview-solution">
                        <h5>Solution:</h5>
                        <div>
                          {questionForm.explanation ? (
                            <LatexRenderer content={questionForm.explanation} />
                          ) : (
                            <em>Solution will appear here after submission...</em>
                          )}
                        </div>
                        {questionForm.explanationImage && (
                          <div className="preview-image mt-3">
                            <img 
                              src={questionForm.explanationImage} 
                              alt="Solution diagram" 
                              style={{ maxWidth: '100%', maxHeight: '300px', objectFit: 'contain' }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="questions-list">
            <h3>Questions ({demoTest.questions?.length || 0})</h3>
            {demoTest.questions && demoTest.questions.length > 0 ? (
              demoTest.questions.map((q, index) => (
                <div key={q._id} className="question-card card">
                  <div className="question-header">
                    <span className="question-number">Q{q.questionNumber || (index + 1)}</span>
                    <span className="badge">{q.subject}</span>
                    <span className="badge">{q.chapter}</span>
                    <span className="badge">{q.topic}</span>
                    <div className="question-actions">
                      <button 
                        className="btn-edit"
                        onClick={() => handleEditQuestion(q)}
                        title="Edit Question"
                      >
                        ✏️
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteQuestion(q._id)}
                        title="Delete Question"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="question-text">
                    <LatexRenderer content={q.question} />
                  </div>
                  <div className="question-footer">
                    <span>Type: {q.questionType}</span>
                    <span>Section: {q.section}</span>
                    <span>Marks: {q.marks}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-questions">No questions added yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ManageDemoTest;

