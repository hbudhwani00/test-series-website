import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Card, Button } from '../../components/ui';

const API_URL = 'https://test-series-backend-dyfc.onrender.com/api';  // ✅ ADD THIS

const UploadQuestion = () => {
  const [formData, setFormData] = useState({
    examType: 'JEE',
    subject: 'Physics',
    chapter: '',
    questionType: 'single',
    section: 'A',
    question: '',
    questionImage: '',
    options: ['', '', '', ''],
    optionImages: ['', '', '', ''],
    correctAnswer: '',
    numericalRange: { min: '', max: '' },
    explanation: '',
    explanationImage: '',
    difficulty: 'medium',
    marks: 4,
    negativeMarks: 1,
    hasNegativeMarking: true
  });

  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  
  // Image size state (percentage of original size)
  const [imageSizes, setImageSizes] = useState({
    question: 100,
    option0: 100,
    option1: 100,
    option2: 100,
    option3: 100,
    explanation: 100
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData(prev => ({ ...prev, options: newOptions }));
  };

  const handleImageUpload = async (file, type, index = null) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    setUploadingImage(true);
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

      // Update the appropriate field based on type
      if (type === 'question') {
        setFormData(prev => ({ ...prev, questionImage: fullImageUrl }));
        toast.success('Question image uploaded');
      } else if (type === 'option' && index !== null) {
        const newOptionImages = [...formData.optionImages];
        newOptionImages[index] = fullImageUrl;
        setFormData(prev => ({ ...prev, optionImages: newOptionImages }));
        toast.success(`Option ${String.fromCharCode(65 + index)} image uploaded`);
      } else if (type === 'explanation') {
        setFormData(prev => ({ ...prev, explanationImage: fullImageUrl }));
        toast.success('Explanation image uploaded');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = (type, index = null) => {
    if (type === 'question') {
      setFormData(prev => ({ ...prev, questionImage: '' }));
      setImageSizes(prev => ({ ...prev, question: 100 }));
    } else if (type === 'option' && index !== null) {
      const newOptionImages = [...formData.optionImages];
      newOptionImages[index] = '';
      setFormData(prev => ({ ...prev, optionImages: newOptionImages }));
      setImageSizes(prev => ({ ...prev, [`option${index}`]: 100 }));
    } else if (type === 'explanation') {
      setFormData(prev => ({ ...prev, explanationImage: '' }));
      setImageSizes(prev => ({ ...prev, explanation: 100 }));
    }
  };

  const handleImageSizeChange = (type, index = null, value) => {
    const key = index !== null ? `${type}${index}` : type;
    setImageSizes(prev => ({ ...prev, [key]: parseInt(value) }));
  };

  // Handle paste event for images
  const handlePaste = async (e, type, index = null) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Look for image in clipboard
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        e.preventDefault(); // Prevent default paste behavior for images
        
        const blob = items[i].getAsFile();
        if (blob) {
          toast.info('Uploading pasted image...');
          await handleImageUpload(blob, type, index);
        }
        break;
      }
    }
  };

  const handleNumericalRangeChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      numericalRange: { ...prev.numericalRange, [field]: value }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.question.trim()) {
      toast.error('Question text is required');
      return;
    }

    if (!formData.chapter.trim()) {
      toast.error('Chapter is required');
      return;
    }

    if (formData.questionType === 'single' || formData.questionType === 'multiple') {
      // Check if all options are filled
      if (formData.options.some(opt => !opt.trim())) {
        toast.error('All options must be filled for MCQ questions');
        return;
      }
      
      // Check if correct answer is provided
      if (formData.correctAnswer === '' || formData.correctAnswer === null) {
        toast.error('Correct answer must be selected');
        return;
      }
    }

    if (formData.questionType === 'numerical') {
      if (formData.correctAnswer === '' || formData.correctAnswer === null) {
        toast.error('Numerical answer is required');
        return;
      }
    }

    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare data based on question type
      const dataToSubmit = {
        examType: formData.examType,
        subject: formData.subject,
        chapter: formData.chapter.trim(),
        questionType: formData.questionType,
        section: formData.section,
        question: formData.question.trim(),
        questionImage: formData.questionImage || null,
        difficulty: formData.difficulty,
        marks: Number(formData.marks),
        negativeMarks: Number(formData.negativeMarks),
        hasNegativeMarking: formData.hasNegativeMarking,
        explanation: formData.explanation.trim(),
        explanationImage: formData.explanationImage || null
      };

      // Add options and correct answer for MCQ
      if (formData.questionType === 'single' || formData.questionType === 'multiple') {
        dataToSubmit.options = formData.options;
        dataToSubmit.optionImages = formData.optionImages;
        dataToSubmit.correctAnswer = Number(formData.correctAnswer);
      }

      // Add numerical answer and range for numerical questions
      if (formData.questionType === 'numerical') {
        dataToSubmit.correctAnswer = Number(formData.correctAnswer);
        
        if (formData.numericalRange.min !== '' && formData.numericalRange.max !== '') {
          dataToSubmit.numericalRange = {
            min: Number(formData.numericalRange.min),
            max: Number(formData.numericalRange.max)
          };
        }
      }

      await axios.post(`${API_URL}/questions/upload`, dataToSubmit, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Question uploaded successfully!');
      
      // Reset form
      setFormData({
        examType: 'JEE',
        subject: 'Physics',
        chapter: '',
        questionType: 'single',
        section: 'A',
        question: '',
        questionImage: '',
        options: ['', '', '', ''],
        optionImages: ['', '', '', ''],
        correctAnswer: '',
        numericalRange: { min: '', max: '' },
        explanation: '',
        explanationImage: '',
        difficulty: 'medium',
        marks: 4,
        negativeMarks: 1,
        hasNegativeMarking: true
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Failed to upload question');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <h1 className="text-3xl font-bold mb-6">Upload Question</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Exam Type</label>
                <select
                  name="examType"
                  value={formData.examType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="JEE">JEE</option>
                  <option value="NEET">NEET</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Physics">Physics</option>
                  <option value="Chemistry">Chemistry</option>
                  <option value="Mathematics">Mathematics</option>
                  {formData.examType === 'NEET' && <option value="Biology">Biology</option>}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Chapter *</label>
                <input
                  type="text"
                  name="chapter"
                  value={formData.chapter}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Mechanics, Thermodynamics"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Question Type</label>
                <select
                  name="questionType"
                  value={formData.questionType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="single">Single Correct (MCQ)</option>
                  <option value="numerical">Numerical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Section</label>
                <select
                  name="section"
                  value={formData.section}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="A">Section A (MCQ - 20 questions)</option>
                  <option value="B">Section B (Numerical - 5 questions)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium mb-2">Question Text * (You can paste images here with Ctrl+V)</label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleChange}
                onPaste={(e) => handlePaste(e, 'question')}
                rows="4"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the question text... (You can also paste images directly)"
                required
              />
            </div>

            {/* Question Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Question Image/Diagram (Optional)</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'question')}
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  disabled={uploadingImage}
                />
                {formData.questionImage && (
                  <button
                    type="button"
                    onClick={() => removeImage('question')}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              {formData.questionImage && (
                <div className="mt-3 p-3 border rounded bg-gray-50">
                  <div className="mb-2 flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Image Size: {imageSizes.question}%</label>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      value={imageSizes.question}
                      onChange={(e) => handleImageSizeChange('question', null, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <img 
                    src={formData.questionImage} 
                    alt="Question diagram" 
                    style={{ width: `${imageSizes.question}%`, maxWidth: '100%' }}
                    className="object-contain border rounded bg-white"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">💡 Tip: You can paste images directly in the question text area above using Ctrl+V</p>
            </div>

            {/* Options for MCQ */}
            {(formData.questionType === 'single' || formData.questionType === 'multiple') && (
              <>
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Options * (Paste images in option fields with Ctrl+V)</label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="font-semibold w-8">({String.fromCharCode(65 + index)})</span>
                        <input
                          type="text"
                          value={option}
                          onChange={(e) => handleOptionChange(index, e.target.value)}
                          onPaste={(e) => handlePaste(e, 'option', index)}
                          className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                          placeholder={`Option ${String.fromCharCode(65 + index)} (or paste image)`}
                          required
                        />
                      </div>
                      <div className="ml-11 flex items-center gap-2">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e.target.files[0], 'option', index)}
                          className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 text-sm"
                          disabled={uploadingImage}
                        />
                        {formData.optionImages[index] && (
                          <button
                            type="button"
                            onClick={() => removeImage('option', index)}
                            className="px-2 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                      {formData.optionImages[index] && (
                        <div className="ml-11 mt-2 p-2 border rounded bg-gray-50">
                          <div className="mb-2 flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-700">Size: {imageSizes[`option${index}`]}%</label>
                            <input
                              type="range"
                              min="20"
                              max="150"
                              value={imageSizes[`option${index}`]}
                              onChange={(e) => handleImageSizeChange('option', index, e.target.value)}
                              className="flex-1"
                            />
                          </div>
                          <img 
                            src={formData.optionImages[index]} 
                            alt={`Option ${String.fromCharCode(65 + index)}`} 
                            style={{ width: `${imageSizes[`option${index}`]}%`, maxWidth: '100%' }}
                            className="object-contain border rounded bg-white"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Correct Answer *</label>
                  <select
                    name="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select correct option</option>
                    <option value="0">A</option>
                    <option value="1">B</option>
                    <option value="2">C</option>
                    <option value="3">D</option>
                  </select>
                </div>
              </>
            )}

            {/* Numerical Answer */}
            {formData.questionType === 'numerical' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Numerical Answer *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="correctAnswer"
                    value={formData.correctAnswer}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 5.0, 12.5"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Min Value (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.numericalRange.min}
                      onChange={(e) => handleNumericalRangeChange('min', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 4.9"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Value (Optional)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.numericalRange.max}
                      onChange={(e) => handleNumericalRangeChange('max', e.target.value)}
                      className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 5.1"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Marks */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Marks</label>
                <input
                  type="number"
                  name="marks"
                  value={formData.marks}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Negative Marks</label>
                <input
                  type="number"
                  name="negativeMarks"
                  value={formData.negativeMarks}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.25"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="hasNegativeMarking"
                checked={formData.hasNegativeMarking}
                onChange={handleChange}
                className="mr-2"
              />
              <label className="text-sm font-medium">Has Negative Marking</label>
            </div>

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium mb-2">Explanation (Optional - Paste images with Ctrl+V)</label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                onPaste={(e) => handlePaste(e, 'explanation')}
                rows="3"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Explain the solution... (You can also paste images directly)"
              />
            </div>

            {/* Explanation Image Upload */}
            <div>
              <label className="block text-sm font-medium mb-2">Explanation/Solution Image (Optional)</label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e.target.files[0], 'explanation')}
                  className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                  disabled={uploadingImage}
                />
                {formData.explanationImage && (
                  <button
                    type="button"
                    onClick={() => removeImage('explanation')}
                    className="px-3 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              {formData.explanationImage && (
                <div className="mt-3 p-3 border rounded bg-gray-50">
                  <div className="mb-2 flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">Image Size: {imageSizes.explanation}%</label>
                    <input
                      type="range"
                      min="20"
                      max="150"
                      value={imageSizes.explanation}
                      onChange={(e) => handleImageSizeChange('explanation', null, e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <img 
                    src={formData.explanationImage} 
                    alt="Solution diagram" 
                    style={{ width: `${imageSizes.explanation}%`, maxWidth: '100%' }}
                    className="object-contain border rounded bg-white"
                  />
                </div>
              )}
              <p className="text-xs text-gray-500 mt-1">💡 Tip: You can paste images directly in the explanation text area above using Ctrl+V</p>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {submitting ? 'Uploading...' : 'Upload Question'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default UploadQuestion;

