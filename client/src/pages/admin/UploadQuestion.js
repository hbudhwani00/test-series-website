import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Card, Button } from '../../components/ui';

const UploadQuestion = () => {
  const [formData, setFormData] = useState({
    examType: 'JEE',
    subject: 'Physics',
    chapter: '',
    questionType: 'single',
    section: 'A',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: '',
    numericalRange: { min: '', max: '' },
    explanation: '',
    difficulty: 'medium',
    marks: 4,
    negativeMarks: 1,
    hasNegativeMarking: true
  });

  const [submitting, setSubmitting] = useState(false);

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
        difficulty: formData.difficulty,
        marks: Number(formData.marks),
        negativeMarks: Number(formData.negativeMarks),
        hasNegativeMarking: formData.hasNegativeMarking,
        explanation: formData.explanation.trim()
      };

      // Add options and correct answer for MCQ
      if (formData.questionType === 'single' || formData.questionType === 'multiple') {
        dataToSubmit.options = formData.options;
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

      await axios.post('http://localhost:5000/api/questions/upload', dataToSubmit, {
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
        options: ['', '', '', ''],
        correctAnswer: '',
        numericalRange: { min: '', max: '' },
        explanation: '',
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
              <label className="block text-sm font-medium mb-2">Question Text *</label>
              <textarea
                name="question"
                value={formData.question}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the question text..."
                required
              />
            </div>

            {/* Options for MCQ */}
            {(formData.questionType === 'single' || formData.questionType === 'multiple') && (
              <>
                <div className="space-y-3">
                  <label className="block text-sm font-medium">Options *</label>
                  {formData.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <span className="font-semibold w-8">({String.fromCharCode(65 + index)})</span>
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="flex-1 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${String.fromCharCode(65 + index)}`}
                        required
                      />
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
              <label className="block text-sm font-medium mb-2">Explanation (Optional)</label>
              <textarea
                name="explanation"
                value={formData.explanation}
                onChange={handleChange}
                rows="3"
                className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                placeholder="Explain the solution..."
              />
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
