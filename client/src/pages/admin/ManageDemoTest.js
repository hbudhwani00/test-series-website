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
  const [allQuestions, setAllQuestions] = useState([]);
  
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

  const [imageSizes, setImageSizes] = useState({
    question: 100,
    option0: 100,
    option1: 100,
    option2: 100,
    option3: 100,
    explanation: 100
  });

  useEffect(() => {
    fetchDemoTest();
    fetchAllQuestions();
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

  const checkDuplicate = (questionText) => {
    const normalizedInput = questionText.trim().toLowerCase();
    
    if (demoTest?.questions) {
      const duplicate = demoTest.questions.find(
        q => q.question.trim().toLowerCase() === normalizedInput
      );
      if (duplicate) return { isDuplicate: true, source: 'Demo Test' };
    }
    
    return { isDuplicate: false };
  };

  const handleQuestionTextChange = (e) => {
    const questionText = e.target.value;
    setQuestionForm({ ...questionForm, question: questionText });
    
    if (questionText.trim().length > 20) {
      const normalizedInput = questionText.trim().toLowerCase();
      const matchingQuestion = allQuestions.find(
        q => q.question.trim().toLowerCase() === normalizedInput
      );
      
      if (matchingQuestion) {
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
      const fullImageUrl = `${API_URL.replace('/api', '')}${imageUrl}`;

      if (type === 'question') {
        setQuestionForm(prev => ({ ...prev, questionImage: fullImageUrl }));
        toast.success('Question image uploaded');
      } else if (type === 'option' && index !== null) {
        const newOptionImages = [...questionForm.optionImages];
        newOptionImages[index] = fullImageUrl;
        setQuestionForm(prev => ({ ...prev, optionImages: newOptionImages }));
        toast.success(`Option ${String.fromCharCode(65 + index)} image uploaded`);
      } else if (type === 'explanation') {
        setQuestionForm(prev => ({ ...prev, explanationImage: fullImageUrl }));
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
          await handleImageUpload(blob, type, index);
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
    
    if (!editingQuestionId) {
      const duplicateCheck = checkDuplicate(questionForm.question);
      if (duplicateCheck.isDuplicate) {
        toast.error(`This question already exists in ${duplicateCheck.source}!`);
        return;
      }
    }
    
    try {
      const token = localStorage.getItem('token');
      
      // FIXED: Include all image URLs in the payload
      const payload = {
        ...questionForm,
        questionImage: questionForm.questionImage || '',
        optionImages: questionForm.optionImages || ['', '', '', ''],
        explanationImage: questionForm.explanationImage || ''
      };

      console.log('Submitting question with images:', {
        questionImage: payload.questionImage,
        optionImages: payload.optionImages,
        explanationImage: payload.explanationImage
      });
      
      if (editingQuestionId) {
        await axios.put(
          `${API_URL}/admin/demo-test/update-question/${editingQuestionId}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Question updated successfully!');
        setEditingQuestionId(null);
      } else {
        await axios.post(
          `${API_URL}/admin/demo-test/add-question`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Question added successfully!');
      }
      
      setShowQuestionForm(false);
      setShowPreview(false);
      
      // Reset form
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
      
      // Reset image sizes
      setImageSizes({
        question: 100,
        option0: 100,
        option1: 100,
        option2: 100,
        option3: 100,
        explanation: 100
      });
      
      fetchDemoTest();
    } catch (error) {
      console.error('Error saving question:', error);
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
    setImageSizes({
      question: 100,
      option0: 100,
      option1: 100,
      option2: 100,
      option3: 100,
      explanation: 100
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
      const questionNumbers = bulkQuestions
        .split(/[\n,]/)
        .map(num => num.trim())
        .filter(num => num && !isNaN(num))
        .map(num => parseInt(num));

      if (questionNumbers.length === 0) {
        toast.error('No valid question numbers found');
        return;
      }

      const questionsToAdd = [];
      const notFound = [];

      for (const qNum of questionNumbers) {
        const found = allQuestions.find(q => q.questionNumber === qNum);
        if (found) {
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
                  <label>Question * <span style={{ fontSize: '12px', color: '#666' }}>(Auto-fills if question exists - Paste images with Ctrl+V)</span></label>
                  <textarea
                    value={questionForm.question}
                    onChange={handleQuestionTextChange}
                    onPaste={(e) => handlePaste(e, 'question')}
                    placeholder="Enter question text (will auto-fill if found in question bank, or paste images directly)"
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
                      <img 
                        src={questionForm.questionImage} 
                        alt="Question" 
                        style={{ width: `${imageSizes.question}%`, maxWidth: '100%' }}
                      />
                    </div>
                  )}
                </div>

                {questionForm.questionType === 'single' && (
                  <>
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
                          placeholder={`Option ${String.fromCharCode(65 + index)} (or paste image)`}
                          required
                        />
                        {questionForm.optionImages[index] && (
                          <div style={{ marginTop: '10px', padding: '10px', border: '1px solid #ddd', borderRadius: '5px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                              <label style={{ fontSize: '12px' }}>Size: {imageSizes[`option${index}`]}%</label>
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
                                style={{ padding: '5px 10px', background: '#f44336', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                              >
                                Remove
                              </button>
                            </div>
                            <img 
                              src={questionForm.optionImages[index]} 
                              alt={`Option ${String.fromCharCode(65 + index)}`} 
                              style={{ width: `${imageSizes[`option${index}`]}%`, maxWidth: '100%' }}
                            />
                          </div>
                        )}
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
                  <label>Solution/Explanation * <span style={{ fontSize: '12px', color: '#666' }}>(Paste images with Ctrl+V)</span></label>
                  <textarea
                    value={questionForm.explanation}
                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                    onPaste={(e) => handlePaste(e, 'explanation')}
                    placeholder="Enter detailed solution (or paste images directly)"
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
                      <img 
                        src={questionForm.explanationImage} 
                        alt="Solution" 
                        style={{ width: `${imageSizes.explanation}%`, maxWidth: '100%' }}
                      />
                    </div>
                  )}
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
                          <div style={{ marginTop: '15px' }}>
                            <img 
                              src={questionForm.questionImage} 
                              alt="Question diagram" 
                              style={{ width: `${imageSizes.question}%`, maxWidth: '100%', objectFit: 'contain' }}
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
                              <div style={{ flex: 1 }}>
                                <span className="option-text">
                                  {option ? (
                                    <LatexRenderer content={option} />
                                  ) : (
                                    <em>Option {index + 1} will appear here...</em>
                                  )}
                                </span>
                                {questionForm.optionImages && questionForm.optionImages[index] && (
                                  <div style={{ marginTop: '10px' }}>
                                    <img 
                                      src={questionForm.optionImages[index]} 
                                      alt={`Option ${String.fromCharCode(65 + index)}`} 
                                      style={{ width: `${imageSizes[`option${index}`]}%`, maxWidth: '100%', objectFit: 'contain' }}
                                    />
                                  </div>
                                )}
                              </div>
                              {questionForm.correctAnswer == index && <span className="correct-indicator">✓ Correct</span>}
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
                          <div style={{ marginTop: '15px' }}>
                            <img 
                              src={questionForm.explanationImage} 
                              alt="Solution diagram" 
                              style={{ width: `${imageSizes.explanation}%`, maxWidth: '100%', objectFit: 'contain' }}
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
                    {q.questionImage && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={q.questionImage} 
                          alt="Question" 
                          style={{ maxWidth: '400px', width: '100%' }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="question-footer">
                    <span>Type: {q.questionType}</span>
                    <span>Section: {q.section}</span>
                    <span>Marks: {q.marks}</span>
                    {(q.questionImage || q.optionImages?.some(img => img) || q.explanationImage) && (
                      <span style={{ color: '#4CAF50', fontWeight: 'bold' }}>📷 Has Images</span>
                    )}
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