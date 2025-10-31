import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import './ManageDemoTest.css';

const ManageScheduledTest = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState(null);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState(null);
  
  const [testData, setTestData] = useState({
    title: '',
    examType: 'JEE_MAIN',
    subject: '',
    chapter: '',
    duration: 180,
    totalMarks: 300,
    testType: 'sunday_full',
    scheduleType: 'one-time',
    startDate: '',
    endDate: ''
  });

  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionNumber: 1,
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    marks: 4,
    hasNegativeMarking: true,
    difficulty: 'medium',
    subject: '',
    chapter: '',
    topic: '',
    explanation: '',
    questionType: 'mcq',
    source: 'Practice'
  });

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get('http://localhost:5000/api/scheduled-tests/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTests(data.scheduledTests);
    } catch (error) {
      toast.error('Failed to fetch scheduled tests');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    if (!currentQuestion.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (currentQuestion.questionType === 'mcq') {
      const validOptions = currentQuestion.options.filter(opt => opt.trim());
      if (validOptions.length < 2) {
        toast.error('Please provide at least 2 options');
        return;
      }
    }

    if (editingQuestionIndex !== null) {
      // Update existing question
      const updated = [...questions];
      updated[editingQuestionIndex] = { ...currentQuestion };
      setQuestions(updated);
      setEditingQuestionIndex(null);
      toast.success(`Question ${editingQuestionIndex + 1} updated`);
    } else {
      // Add new question
      setQuestions([...questions, { ...currentQuestion, questionNumber: questions.length + 1 }]);
      toast.success(`Question ${questions.length + 1} added`);
    }
    
    // Reset current question
    setCurrentQuestion({
      questionNumber: questions.length + (editingQuestionIndex !== null ? 1 : 2),
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 4,
      hasNegativeMarking: true,
      difficulty: 'medium',
      subject: testData.subject,
      chapter: testData.chapter,
      topic: '',
      explanation: '',
      questionType: 'mcq'
    });
  };

  const handleEditQuestion = (index) => {
    const questionToEdit = questions[index];
    setCurrentQuestion({ ...questionToEdit });
    setEditingQuestionIndex(index);
    toast.info(`Editing Question ${index + 1}`);
  };

  const handleCancelEdit = () => {
    setEditingQuestionIndex(null);
    setCurrentQuestion({
      questionNumber: questions.length + 1,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 4,
      hasNegativeMarking: true,
      difficulty: 'medium',
      subject: testData.subject,
      chapter: testData.chapter,
      topic: '',
      explanation: '',
      questionType: 'mcq'
    });
    toast.info('Edit cancelled');
  };

  const handleRemoveQuestion = (index) => {
    const updated = questions.filter((_, i) => i !== index);
    // Renumber questions
    const renumbered = updated.map((q, idx) => ({ ...q, questionNumber: idx + 1 }));
    setQuestions(renumbered);
    setCurrentQuestion({ ...currentQuestion, questionNumber: renumbered.length + 1 });
    toast.info('Question removed');
  };

  const handleCreateTest = async () => {
    if (!testData.title.trim()) {
      toast.error('Please enter test title');
      return;
    }

    if (questions.length === 0) {
      toast.error('Please add at least one question');
      return;
    }

    if (!testData.startDate) {
      toast.error('Please select start date');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...testData,
        questions: questions
      };

      if (editingTest) {
        await axios.put(
          `http://localhost:5000/api/scheduled-tests/${editingTest._id}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Test updated successfully!');
      } else {
        const { data } = await axios.post(
          'http://localhost:5000/api/scheduled-tests/create',
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(`Test created! ${data.totalQuestions} questions, ${data.totalScheduledDates} scheduled dates`);
      }

      setShowModal(false);
      resetForm();
      fetchTests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create test');
      console.error(error);
    }
  };

  const handleDeleteTest = async (id) => {
    if (!window.confirm('Are you sure? This will delete the test and all associated questions.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/scheduled-tests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Test deleted successfully');
      fetchTests();
    } catch (error) {
      toast.error('Failed to delete test');
      console.error(error);
    }
  };

  const handleEditTest = async (test) => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`http://localhost:5000/api/scheduled-tests/${test._id}/full`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Load test metadata
      setTestData({
        title: data.title,
        examType: data.examType,
        subject: data.subject || '',
        chapter: data.chapter || '',
        duration: data.duration,
        totalMarks: data.totalMarks,
        testType: data.testType,
        scheduleType: data.scheduleType,
        startDate: data.startDate ? new Date(data.startDate).toISOString().slice(0, 16) : '',
        endDate: data.endDate ? new Date(data.endDate).toISOString().slice(0, 16) : ''
      });

      // Load questions
      const formattedQuestions = data.questions.map((q, idx) => ({
        questionNumber: idx + 1,
        question: q.question,
        options: q.options || ['', '', '', ''],
        correctAnswer: q.correctAnswer,
        marks: q.marks,
        hasNegativeMarking: q.hasNegativeMarking,
        difficulty: q.difficulty,
        subject: q.subject,
        chapter: q.chapter || '',
        questionType: q.questionType,
        topic: q.topic || '',
        numericalAnswer: q.numericalAnswer || '',
        source: q.source || 'Practice'
      }));
      setQuestions(formattedQuestions);

      setEditingTest(data);
      setShowModal(true);
      toast.info(`Editing: ${data.title}`);
    } catch (error) {
      toast.error('Failed to load test data');
      console.error(error);
    }
  };

  const resetForm = () => {
    setTestData({
      title: '',
      examType: 'JEE_MAIN',
      subject: '',
      chapter: '',
      duration: 180,
      totalMarks: 300,
      testType: 'sunday_full',
      scheduleType: 'one-time',
      startDate: '',
      endDate: ''
    });
    setQuestions([]);
    setCurrentQuestion({
      questionNumber: 1,
      question: '',
      options: ['', '', '', ''],
      correctAnswer: 0,
      marks: 4,
      hasNegativeMarking: true,
      difficulty: 'medium',
      subject: '',
      chapter: '',
      topic: '',
      explanation: '',
      questionType: 'mcq',
      source: 'Practice'
    });
    setEditingTest(null);
  };

  return (
    <div className="manage-demo-test">
      <div className="header-section">
        <h1>📅 Manage Scheduled Tests</h1>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          + Create New Scheduled Test
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading tests...</div>
      ) : (
        <div className="tests-grid">
          {tests.length === 0 ? (
            <div className="no-tests">
              <p>No scheduled tests yet. Create your first one!</p>
            </div>
          ) : (
            tests.map((test) => (
              <motion.div
                key={test._id}
                className="test-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="test-card-header">
                  <h3>{test.title}</h3>
                  <span className={`badge ${test.isActive ? 'badge-success' : 'badge-danger'}`}>
                    {test.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="test-card-body">
                  <div className="test-info">
                    <p><strong>Exam:</strong> {test.examType}</p>
                    <p><strong>Subject:</strong> {test.subject || 'All'}</p>
                    <p><strong>Chapter:</strong> {test.chapter || 'All'}</p>
                    <p><strong>Schedule:</strong> {test.scheduleType}</p>
                    <p><strong>Duration:</strong> {test.duration} minutes</p>
                    <p><strong>Total Marks:</strong> {test.totalMarks}</p>
                    <p><strong>Questions:</strong> {test.questions?.length || 0}</p>
                    <p><strong>Scheduled Dates:</strong> {test.scheduledDates?.length || 0}</p>
                    <p><strong>Start Date:</strong> {new Date(test.startDate).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="test-card-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleEditTest(test)}>
                    Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteTest(test._id)}>
                    Delete
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              className="modal-content large-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h2>{editingTest ? 'Edit Scheduled Test' : 'Create New Scheduled Test'}</h2>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>

              <div className="modal-body">
                {/* Test Information */}
                <div className="form-section">
                  <h3>📝 Test Information</h3>
                  
                  <div className="form-row">
                    <div className="form-group">
                      <label>Test Title *</label>
                      <input
                        type="text"
                        value={testData.title}
                        onChange={(e) => setTestData({ ...testData, title: e.target.value })}
                        placeholder="e.g., Sunday Full Test - Week 1"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Exam Type *</label>
                      <select
                        value={testData.examType}
                        onChange={(e) => setTestData({ ...testData, examType: e.target.value })}
                      >
                        <option value="JEE_MAIN">JEE Main</option>
                        <option value="JEE_MAIN_ADVANCED">JEE Main + Advanced</option>
                        <option value="NEET">NEET</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Test Type *</label>
                      <select
                        value={testData.testType}
                        onChange={(e) => setTestData({ ...testData, testType: e.target.value })}
                      >
                        <option value="sunday_full">Sunday Full Test (3 hrs)</option>
                        <option value="alternate_day">Alternate Day Test (1 hr)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Subject (Optional)</label>
                      <select
                        value={testData.subject}
                        onChange={(e) => setTestData({ ...testData, subject: e.target.value })}
                      >
                        <option value="">All Subjects</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Biology">Biology</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Chapter (Optional)</label>
                      <input
                        type="text"
                        value={testData.chapter}
                        onChange={(e) => setTestData({ ...testData, chapter: e.target.value })}
                        placeholder="e.g., Thermodynamics"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Duration (minutes) *</label>
                      <input
                        type="number"
                        value={testData.duration}
                        onChange={(e) => setTestData({ ...testData, duration: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Total Marks *</label>
                      <input
                        type="number"
                        value={testData.totalMarks}
                        onChange={(e) => setTestData({ ...testData, totalMarks: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Schedule Type *</label>
                      <select
                        value={testData.scheduleType}
                        onChange={(e) => setTestData({ ...testData, scheduleType: e.target.value })}
                      >
                        <option value="one-time">One Time</option>
                        <option value="weekly">Weekly</option>
                        <option value="alternate-days">Alternate Days</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Start Date *</label>
                      <input
                        type="date"
                        value={testData.startDate}
                        onChange={(e) => setTestData({ ...testData, startDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>

                  {testData.scheduleType !== 'one-time' && (
                    <div className="form-row">
                      <div className="form-group">
                        <label>End Date *</label>
                        <input
                          type="date"
                          value={testData.endDate}
                          onChange={(e) => setTestData({ ...testData, endDate: e.target.value })}
                          min={testData.startDate || new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Questions Section */}
                <div className="form-section">
                  <h3>❓ {editingQuestionIndex !== null ? `Edit Question ${editingQuestionIndex + 1}` : `Add Questions (${questions.length} added)`}</h3>
                  
                  {editingQuestionIndex !== null && (
                    <div style={{ 
                      background: '#fff3cd', 
                      border: '1px solid #ffc107', 
                      padding: '10px', 
                      borderRadius: '6px', 
                      marginBottom: '15px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span style={{ color: '#856404' }}>
                        ✏️ Editing Question {editingQuestionIndex + 1}
                      </span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline" 
                        onClick={handleCancelEdit}
                      >
                        Cancel Edit
                      </button>
                    </div>
                  )}
                  
                  <div className="question-form">
                    <div className="form-group">
                      <label>Question Number</label>
                      <input
                        type="number"
                        value={currentQuestion.questionNumber}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionNumber: parseInt(e.target.value) })}
                        min="1"
                      />
                    </div>

                    <div className="form-group">
                      <label>Question Type</label>
                      <select
                        value={currentQuestion.questionType}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, questionType: e.target.value })}
                      >
                        <option value="mcq">Multiple Choice (MCQ)</option>
                        <option value="numerical">Numerical Answer</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Question *</label>
                      <textarea
                        value={currentQuestion.question}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, question: e.target.value })}
                        placeholder="Enter your question here..."
                        rows="3"
                      />
                    </div>

                    {currentQuestion.questionType === 'mcq' && (
                      <>
                        <div className="form-group">
                          <label>Options *</label>
                          {currentQuestion.options.map((option, idx) => (
                            <div key={idx} className="option-input">
                              <span>{String.fromCharCode(65 + idx)}.</span>
                              <input
                                type="text"
                                value={option}
                                onChange={(e) => {
                                  const newOptions = [...currentQuestion.options];
                                  newOptions[idx] = e.target.value;
                                  setCurrentQuestion({ ...currentQuestion, options: newOptions });
                                }}
                                placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                              />
                            </div>
                          ))}
                        </div>

                        <div className="form-group">
                          <label>Correct Answer *</label>
                          <select
                            value={currentQuestion.correctAnswer}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseInt(e.target.value) })}
                          >
                            {currentQuestion.options.map((_, idx) => (
                              <option key={idx} value={idx}>
                                Option {String.fromCharCode(65 + idx)}
                              </option>
                            ))}
                          </select>
                        </div>
                      </>
                    )}

                    {currentQuestion.questionType === 'numerical' && (
                      <div className="form-group">
                        <label>Correct Answer (Numerical) *</label>
                        <input
                          type="number"
                          step="any"
                          value={currentQuestion.correctAnswer}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, correctAnswer: parseFloat(e.target.value) })}
                          placeholder="Enter numerical answer"
                        />
                      </div>
                    )}

                    <div className="form-row">
                      <div className="form-group">
                        <label>Subject</label>
                        <select
                          value={currentQuestion.subject}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, subject: e.target.value })}
                        >
                          <option value="">Select Subject</option>
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
                          value={currentQuestion.chapter}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, chapter: e.target.value })}
                          placeholder="e.g., Thermodynamics"
                        />
                      </div>

                      <div className="form-group">
                        <label>Topic</label>
                        <input
                          type="text"
                          value={currentQuestion.topic}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, topic: e.target.value })}
                          placeholder="e.g., First Law"
                        />
                      </div>

                      <div className="form-group">
                        <label>Source</label>
                        <input
                          type="text"
                          value={currentQuestion.source}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, source: e.target.value })}
                          placeholder="e.g., NCERT, Previous Year, Mock Test"
                        />
                      </div>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Marks</label>
                        <input
                          type="number"
                          value={currentQuestion.marks}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, marks: parseInt(e.target.value) })}
                          min="1"
                        />
                      </div>

                      <div className="form-group">
                        <label>Difficulty</label>
                        <select
                          value={currentQuestion.difficulty}
                          onChange={(e) => setCurrentQuestion({ ...currentQuestion, difficulty: e.target.value })}
                        >
                          <option value="easy">Easy</option>
                          <option value="medium">Medium</option>
                          <option value="hard">Hard</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>
                          <input
                            type="checkbox"
                            checked={currentQuestion.hasNegativeMarking}
                            onChange={(e) => setCurrentQuestion({ ...currentQuestion, hasNegativeMarking: e.target.checked })}
                          />
                          Negative Marking (-1)
                        </label>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Explanation</label>
                      <textarea
                        value={currentQuestion.explanation}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, explanation: e.target.value })}
                        placeholder="Explain the solution..."
                        rows="3"
                      />
                    </div>

                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="button" className="btn btn-primary" onClick={handleAddQuestion}>
                        {editingQuestionIndex !== null ? '✓ Update Question' : '+ Add Question'}
                      </button>
                      {editingQuestionIndex !== null && (
                        <button type="button" className="btn btn-outline" onClick={handleCancelEdit}>
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Added Questions List */}
                  {questions.length > 0 && (
                    <div className="added-questions">
                      <h4>Added Questions:</h4>
                      <div className="questions-list">
                        {questions.map((q, idx) => (
                          <div key={idx} className="question-item" style={{
                            background: editingQuestionIndex === idx ? '#fff3cd' : 'white',
                            border: editingQuestionIndex === idx ? '2px solid #ffc107' : '1px solid #e5e7eb'
                          }}>
                            <div className="question-number">Q{q.questionNumber}</div>
                            <div className="question-preview">
                              <strong>{q.question.substring(0, 100)}...</strong>
                              <div className="question-meta">
                                <span>{q.subject}</span>
                                <span>{q.chapter}</span>
                                <span>{q.topic}</span>
                                <span>{q.marks} marks</span>
                                <span>{q.questionType === 'mcq' ? 'MCQ' : 'Numerical'}</span>
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '5px' }}>
                              <button 
                                className="btn btn-primary btn-sm" 
                                onClick={() => handleEditQuestion(idx)}
                                disabled={editingQuestionIndex !== null && editingQuestionIndex !== idx}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-danger btn-sm" 
                                onClick={() => handleRemoveQuestion(idx)}
                                disabled={editingQuestionIndex !== null}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button className="btn btn-success" onClick={handleCreateTest}>
                  {editingTest ? 'Update Test' : 'Create Test'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ManageScheduledTest;
