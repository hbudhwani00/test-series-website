import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import LatexRenderer from '../../components/LatexRenderer';
import './ManageNEETDemoTest.css';
import { API_URL } from '../../services/api';
import { getChapters, getTopics } from '../../data/chaptersTopics';

const ManageNEETDemoTest = () => {
  const [neetTest, setNEETTest] = useState(null);
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingQuestionId, setEditingQuestionId] = useState(null);
  const [allQuestions, setAllQuestions] = useState([]);
  
  const [questionForm, setQuestionForm] = useState({
    questionNumber: '',
    subject: 'Physics',
    chapter: '',
    topic: '',
    source: 'Practice',
    questionType: 'single',
    section: 'A',
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

  const [imageSizes, setImageSizes] = useState({
    question: 100,
    option0: 100,
    option1: 100,
    option2: 100,
    option3: 100,
    explanation: 100
  });

  useEffect(() => {
    fetchNEETTest();
    fetchAllQuestions();
  }, []);

  const fetchAllQuestions = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/questions?limit=1000&examType=NEET`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllQuestions(data.questions || []);
    } catch (error) {
      console.error('Failed to fetch questions:', error);
    }
  };

  const fetchNEETTest = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/neet-demo-test/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNEETTest(data.neetTest);
    } catch (error) {
      if (error.response?.status === 404) {
        // Test doesn't exist, offer to create one
        console.log('No NEET demo test found');
      } else {
        toast.error('Failed to fetch NEET demo test');
        console.error('Error:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNEETTest = async () => {
    const title = prompt('Enter NEET Demo Test Title:', 'NEET 2026 Demo Test');
    if (!title) return;

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API_URL}/admin/neet-demo-test/create`,
        {
          title,
          description: 'Official NEET Demo Test - 180 Questions',
          examType: 'NEET',
          duration: 180, // 3 hours (actual NEET exam duration)
          totalMarks: 720
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('NEET demo test created successfully!');
      fetchNEETTest();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create NEET demo test');
    }
  };

  const handleImageUpload = async (file, type, index = null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formDataObj = new FormData();
      formDataObj.append('image', file);

      const response = await axios.post(`${API_URL}/questions/upload-image`, formDataObj, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const imageUrl = response.data.imageUrl;

      if (type === 'question') {
        setQuestionForm(prev => ({ ...prev, questionImage: imageUrl }));
        toast.success('Question image uploaded');
      } else if (type === 'option' && index !== null) {
        const newOptionImages = [...questionForm.optionImages];
        newOptionImages[index] = imageUrl;
        setQuestionForm(prev => ({ ...prev, optionImages: newOptionImages }));
        toast.success(`Option ${String.fromCharCode(65 + index)} image uploaded`);
      } else if (type === 'explanation') {
        setQuestionForm(prev => ({ ...prev, explanationImage: imageUrl }));
        toast.success('Explanation image uploaded');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    }
  };

  const handlePaste = async (e, type, index = null) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault();
        
        const blob = items[i].getAsFile();
        if (blob) {
          toast.info('Uploading pasted image...');
          
          // Upload image and get URL
          try {
            const token = localStorage.getItem('token');
            const formDataObj = new FormData();
            formDataObj.append('image', blob);

            const response = await axios.post(`${API_URL}/questions/upload-image`, formDataObj, {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data'
              }
            });

            const imageUrl = response.data.imageUrl;
            // Use HTML img tag with width control (default 20%)
            const imageMarkdown = `<img src="${imageUrl}" style="width: 20%; max-width: 100%;" alt="image" />`;
            
            // Get cursor position and insert image URL at that position
            const target = e.target;
            const startPos = target.selectionStart;
            const endPos = target.selectionEnd;
            
            if (type === 'question') {
              const currentText = questionForm.question;
              const newText = currentText.substring(0, startPos) + imageMarkdown + currentText.substring(endPos);
              setQuestionForm(prev => ({ ...prev, question: newText }));
              
              // Set cursor position after inserted image
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = startPos + imageMarkdown.length;
                target.focus();
              }, 0);
            } else if (type === 'option' && index !== null) {
              const newOptions = [...questionForm.options];
              const currentText = newOptions[index];
              newOptions[index] = currentText.substring(0, startPos) + imageMarkdown + currentText.substring(endPos);
              setQuestionForm(prev => ({ ...prev, options: newOptions }));
              
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = startPos + imageMarkdown.length;
                target.focus();
              }, 0);
            } else if (type === 'explanation') {
              const currentText = questionForm.explanation;
              const newText = currentText.substring(0, startPos) + imageMarkdown + currentText.substring(endPos);
              setQuestionForm(prev => ({ ...prev, explanation: newText }));
              
              setTimeout(() => {
                target.selectionStart = target.selectionEnd = startPos + imageMarkdown.length;
                target.focus();
              }, 0);
            }
            
            toast.success('Image inserted at cursor position');
          } catch (error) {
            console.error('Image upload error:', error);
            toast.error('Failed to upload image');
          }
        }
        break;
      }
    }
  };

  const handleImageSizeChange = (type, index = null, value) => {
    const key = index !== null ? `${type}${index}` : type;
    setImageSizes(prev => ({ ...prev, [key]: parseInt(value) }));
  };

  const removeImage = (type, index = null) => {
    if (type === 'question') {
      setQuestionForm(prev => ({ ...prev, questionImage: '' }));
      setImageSizes(prev => ({ ...prev, question: 100 }));
    } else if (type === 'option' && index !== null) {
      const newOptionImages = [...questionForm.optionImages];
      newOptionImages[index] = '';
      setQuestionForm(prev => ({ ...prev, optionImages: newOptionImages }));
      setImageSizes(prev => ({ ...prev, [`option${index}`]: 100 }));
    } else if (type === 'explanation') {
      setQuestionForm(prev => ({ ...prev, explanationImage: '' }));
      setImageSizes(prev => ({ ...prev, explanation: 100 }));
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    
    if (!questionForm.question.trim()) {
      toast.error('Please enter a question');
      return;
    }

    if (!questionForm.questionNumber || questionForm.questionNumber === '') {
      toast.error('Please enter a question number');
      return;
    }

    // Check for duplicate question number (only when adding new, not editing)
    if (!editingQuestionId) {
      const questionNumber = parseInt(questionForm.questionNumber);
      
      // Fetch fresh test data to ensure we have the latest questions
      try {
        const token = localStorage.getItem('token');
        const { data } = await axios.get(`${API_URL}/admin/neet-demo-test`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const isDuplicate = data.neetTest?.questions?.some(q => 
          parseInt(q.questionNumber) === questionNumber
        );
        
        if (isDuplicate) {
          toast.error(`Question number ${questionNumber} already exists! Please use a different number.`);
          return;
        }
      } catch (err) {
        console.error('Error checking duplicates:', err);
      }
    } else {
      // When editing, check if another question (not this one) has the same number
      const questionNumber = parseInt(questionForm.questionNumber);
      const isDuplicate = neetTest?.questions?.some(q => 
        q._id !== editingQuestionId && parseInt(q.questionNumber) === questionNumber
      );
      
      if (isDuplicate) {
        toast.error(`Question number ${questionNumber} is already used by another question!`);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      const payload = {
        ...questionForm,
        testId: neetTest._id, // Add the testId here
        questionImage: questionForm.questionImage || '',
        optionImages: questionForm.optionImages || ['', '', '', ''],
        explanationImage: questionForm.explanationImage || ''
      };

      if (editingQuestionId) {
        await axios.put(
          `${API_URL}/admin/neet-demo-test/update-question/${editingQuestionId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Question updated successfully!');
        setEditingQuestionId(null);
      } else {
        await axios.post(
          `${API_URL}/admin/neet-demo-test/add-question`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Question added successfully!');
      }

      setShowQuestionForm(false);
      setShowPreview(false);
      
      // Save last used values before resetting
      const lastSubject = questionForm.subject;
      const lastChapter = questionForm.chapter;
      const lastTopic = questionForm.topic;
      const lastSource = questionForm.source;
      const lastDifficulty = questionForm.difficulty;
      
      resetForm(lastSubject, lastChapter, lastTopic, lastSource, lastDifficulty);
      fetchNEETTest();
    } catch (error) {
      console.error('Error saving question:', error);
      toast.error(error.response?.data?.message || 'Failed to save question');
    }
  };

  const handleEditQuestion = (question) => {
    setEditingQuestionId(question._id);
    setQuestionForm({
      questionNumber: question.questionNumber || '',
      subject: question.subject,
      chapter: question.chapter,
      topic: question.topic,
      source: question.source || 'Practice',
      questionType: question.questionType,
      section: question.section,
      question: question.question,
      questionImage: question.questionImage || '',
      options: question.options.length ? question.options : ['', '', '', ''],
      optionImages: question.optionImages?.length ? question.optionImages : ['', '', '', ''],
      correctAnswer: question.correctAnswer,
      explanation: question.explanation || '',
      explanationImage: question.explanationImage || '',
      difficulty: question.difficulty,
      marks: question.marks,
      negativeMarks: question.negativeMarks
    });
    setShowQuestionForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingQuestionId(null);
    setShowQuestionForm(false);
    setShowPreview(false);
    resetForm();
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to remove this question?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/admin/neet-demo-test/remove-question/${questionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Question removed successfully!');
      fetchNEETTest();
    } catch (error) {
      toast.error('Failed to remove question');
    }
  };

  const resetForm = (keepSubject = 'Physics', keepChapter = '', keepTopic = '', keepSource = 'Practice', keepDifficulty = 'medium') => {
    setQuestionForm({
      questionNumber: '',
      subject: keepSubject,
      chapter: keepChapter,
      topic: keepTopic,
      source: keepSource,
      questionType: 'single',
      section: 'A',
      question: '',
      questionImage: '',
      options: ['', '', '', ''],
      optionImages: ['', '', '', ''],
      correctAnswer: '',
      explanation: '',
      explanationImage: '',
      difficulty: keepDifficulty,
      marks: 4,
      negativeMarks: -1
    });
    setImageSizes({
      question: 100,
      option0: 100,
      option1: 100,
      option2: 100,
      option3: 100,
      explanation: 100
    });
  };

  if (loading) {
    return <div className="manage-neet-test loading">Loading...</div>;
  }

  return (
    <div className="manage-neet-test">
      <div className="header">
        <h1>🔬 Manage NEET Demo Test</h1>
        {!neetTest && (
          <button className="btn btn-primary" onClick={handleCreateNEETTest}>
            Create NEET Demo Test
          </button>
        )}
      </div>

      {neetTest && (
        <>
          <div className="neet-test-info card">
            <h2>{neetTest.title}</h2>
            <p>{neetTest.description}</p>
            <div className="test-stats">
              <span>Duration: {neetTest.duration} minutes</span>
              <span>Total Marks: {neetTest.totalMarks}</span>
              <span>Questions: {neetTest.questions?.length || 0} / 180</span>
            </div>
            <div className="section-breakdown">
              <div className="section-stat">
                <strong>Physics:</strong> {neetTest.questions?.filter(q => q.subject === 'Physics').length || 0} / 45
              </div>
              <div className="section-stat">
                <strong>Chemistry:</strong> {neetTest.questions?.filter(q => q.subject === 'Chemistry').length || 0} / 45
              </div>
              <div className="section-stat">
                <strong>Biology:</strong> {neetTest.questions?.filter(q => q.subject === 'Biology').length || 0} / 90
              </div>
            </div>
          </div>

          <div className="actions">
            <button 
              className="btn btn-success" 
              onClick={() => setShowQuestionForm(!showQuestionForm)}
            >
              {showQuestionForm ? 'Cancel' : '+ Add Question'}
            </button>
          </div>

          {showQuestionForm && (
            <div className="question-form card">
              <h3>{editingQuestionId ? 'Edit Question' : 'Add New NEET Question'}</h3>
              <form onSubmit={handleAddQuestion}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Subject *</label>
                    <select
                      value={questionForm.subject}
                      onChange={(e) => setQuestionForm({ ...questionForm, subject: e.target.value })}
                      required
                    >
                      <option value="Physics">Physics (45 Qs)</option>
                      <option value="Chemistry">Chemistry (45 Qs)</option>
                      <option value="Biology">Biology (90 Qs)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Question Number *</label>
                    <input
                      type="number"
                      value={questionForm.questionNumber}
                      onChange={(e) => setQuestionForm({ ...questionForm, questionNumber: e.target.value })}
                      onWheel={(e) => e.target.blur()} 
                      placeholder="e.g., 1 to 180"
                      min="1"
                      max="180"
                      required
                    />
                    {questionForm.questionNumber && !editingQuestionId && neetTest?.questions?.some(q => parseInt(q.questionNumber) === parseInt(questionForm.questionNumber)) && (
                      <small style={{ color: '#ef4444', display: 'block', marginTop: '4px' }}>
                        ⚠️ This question number is already used!
                      </small>
                    )}
                    <small style={{ color: '#6b7280', display: 'block', marginTop: '4px' }}>
                      Used numbers: {neetTest?.questions?.map(q => q.questionNumber).sort((a, b) => a - b).join(', ') || 'None'}
                    </small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Chapter *</label>
                    <select
                      value={questionForm.chapter}
                      onChange={(e) => setQuestionForm({ ...questionForm, chapter: e.target.value, topic: '' })}
                      required
                    >
                      <option value="">Select Chapter</option>
                      {/* Show current value even if not in list */}
                      {questionForm.chapter && !getChapters(questionForm.subject).includes(questionForm.chapter) && (
                        <option value={questionForm.chapter}>{questionForm.chapter} (current)</option>
                      )}
                      {getChapters(questionForm.subject).map((chapter) => (
                        <option key={chapter} value={chapter}>
                          {chapter}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Topic *</label>
                    <select
                      value={questionForm.topic}
                      onChange={(e) => setQuestionForm({ ...questionForm, topic: e.target.value })}
                      disabled={!questionForm.chapter}
                      required
                    >
                      <option value="">Select Topic</option>
                      {/* Show current value even if not in list */}
                      {questionForm.topic && questionForm.chapter && !getTopics(questionForm.subject, questionForm.chapter).includes(questionForm.topic) && (
                        <option value={questionForm.topic}>{questionForm.topic} (current)</option>
                      )}
                      {questionForm.chapter && getTopics(questionForm.subject, questionForm.chapter).map((topic) => (
                        <option key={topic} value={topic}>
                          {topic}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Source *</label>
                  <input
                    type="text"
                    value={questionForm.source}
                    onChange={(e) => setQuestionForm({ ...questionForm, source: e.target.value })}
                    placeholder="e.g., NEET 2024, Practice, AIIMS"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Question * <span style={{ fontSize: '12px', color: '#666' }}>(Paste images with Ctrl+V)</span></label>
                  <textarea
                    value={questionForm.question}
                    onChange={(e) => setQuestionForm({ ...questionForm, question: e.target.value })}
                    onPaste={(e) => handlePaste(e, 'question')}
                    placeholder="Enter question text..."
                    rows="4"
                    required
                  />
                  {questionForm.questionImage && (
                    <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px' }}>Size: {imageSizes.question}%</label>
                        <input
                          type="range"
                          min="20"
                          max="150"
                          value={imageSizes.question}
                          onChange={(e) => handleImageSizeChange('question', null, e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage('question')}
                          style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                      <img src={questionForm.questionImage} alt="Question" style={{ width: `${imageSizes.question}%`, maxWidth: '100%' }} />
                    </div>
                  )}
                </div>

                <label>Options * <span style={{ fontSize: '12px', color: '#666' }}>(Paste images with Ctrl+V)</span></label>
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
                      onPaste={(e) => handlePaste(e, 'option', index)}
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                      required
                    />
                    {questionForm.optionImages[index] && (
                      <div style={{ marginTop: '8px', padding: '8px', background: '#f9f9f9', borderRadius: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <label style={{ fontSize: '11px' }}>Size: {imageSizes[`option${index}`]}%</label>
                          <input
                            type="range"
                            min="20"
                            max="150"
                            value={imageSizes[`option${index}`]}
                            onChange={(e) => handleImageSizeChange('option', index, e.target.value)}
                            style={{ flex: 1 }}
                          />
                          <button
                            type="button"
                            onClick={() => removeImage('option', index)}
                            style={{ padding: '3px 8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '11px' }}
                          >
                            Remove
                          </button>
                        </div>
                        <img src={questionForm.optionImages[index]} alt={`Option ${String.fromCharCode(65 + index)}`} style={{ width: `${imageSizes[`option${index}`]}%`, maxWidth: '100%' }} />
                      </div>
                    )}
                  </div>
                ))}

                <div className="form-row">
                  <div className="form-group">
                    <label>Correct Answer *</label>
                    <select
                      value={questionForm.correctAnswer}
                      onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                      required
                    >
                      <option value="">Select</option>
                      <option value="0">Option A</option>
                      <option value="1">Option B</option>
                      <option value="2">Option C</option>
                      <option value="3">Option D</option>
                    </select>
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
                  <label>Solution/Explanation * <span style={{ fontSize: '12px', color: '#666' }}>(Paste images with Ctrl+V)</span></label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    onPaste={(e) => handlePaste(e, 'explanation')}
                    placeholder="Enter detailed solution..."
                    rows="3"
                    required
                  />
                  {questionForm.explanationImage && (
                    <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                        <label style={{ fontSize: '12px' }}>Size: {imageSizes.explanation}%</label>
                        <input
                          type="range"
                          min="20"
                          max="150"
                          value={imageSizes.explanation}
                          onChange={(e) => handleImageSizeChange('explanation', null, e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <button
                          type="button"
                          onClick={() => removeImage('explanation')}
                          style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                        >
                          Remove
                        </button>
                      </div>
                      <img src={questionForm.explanationImage} alt="Solution" style={{ width: `${imageSizes.explanation}%`, maxWidth: '100%' }} />
                    </div>
                  )}
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? 'Hide Preview' : '👁️ Preview'}
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
                    {editingQuestionId ? 'Update' : 'Add'} Question
                  </button>
                </div>

                {showPreview && (
                  <div className="question-preview">
                    <h4>📋 Preview - How Students Will See This</h4>
                    <div style={{ padding: '20px', background: '#f9fafb', borderRadius: '8px', marginTop: '12px' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <strong>Q{questionForm.questionNumber}. {questionForm.subject} - {questionForm.chapter}</strong>
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        {questionForm.question && <LatexRenderer content={questionForm.question} />}
                        {questionForm.questionImage && <img src={questionForm.questionImage} alt="Q" style={{ maxWidth: '100%', marginTop: '12px' }} />}
                      </div>
                      <div style={{ marginBottom: '20px' }}>
                        {questionForm.options.map((opt, idx) => (
                          <div key={idx} style={{ marginBottom: '10px', padding: '10px', background: 'white', borderRadius: '4px', border: questionForm.correctAnswer == idx ? '2px solid #22c55e' : '1px solid #e5e7eb' }}>
                            <strong>({String.fromCharCode(65 + idx)})</strong> {opt && <LatexRenderer content={opt} />}
                            {questionForm.optionImages[idx] && <img src={questionForm.optionImages[idx]} alt="opt" style={{ maxWidth: '100%', marginTop: '8px' }} />}
                            {questionForm.correctAnswer == idx && <span style={{ color: '#22c55e', float: 'right' }}>✓ Correct</span>}
                          </div>
                        ))}
                      </div>
                      {questionForm.explanation && (
                        <div style={{ padding: '12px', background: '#fffbeb', borderRadius: '4px', borderLeft: '4px solid #f59e0b' }}>
                          <strong>Solution:</strong>
                          <LatexRenderer content={questionForm.explanation} />
                          {questionForm.explanationImage && <img src={questionForm.explanationImage} alt="sol" style={{ maxWidth: '100%', marginTop: '8px' }} />}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          <div className="questions-list">
            <h3>Questions Added ({neetTest.questions?.length || 0}/180)</h3>
            {neetTest.questions && neetTest.questions.length > 0 ? (
              neetTest.questions.map((q, index) => (
                <div key={q._id} className="question-card card">
                  <div className="question-header">
                    <span className="question-number">Q{q.questionNumber}</span>
                    <span className="badge">{q.subject}</span>
                    <span className="badge">{q.chapter}</span>
                    <div className="question-actions">
                      <button className="btn-edit" onClick={() => handleEditQuestion(q)}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDeleteQuestion(q._id)}>×</button>
                    </div>
                  </div>
                  <div className="question-text">
                    <LatexRenderer content={q.question.substring(0, 100)} />
                  </div>
                </div>
              ))
            ) : (
              <p>No questions added yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ManageNEETDemoTest;
