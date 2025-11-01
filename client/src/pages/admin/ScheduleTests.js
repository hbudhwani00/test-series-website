import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, LoadingSpinner } from '../../components/ui';
import './admin.css';

const ScheduleTests = () => {
  const [tests, setTests] = useState([]);
  const [scheduledTests, setScheduledTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    testTitle: '',
    testType: 'sunday_full',
    examType: 'JEE_MAIN',
    scheduleType: 'one-time',
    startDate: '',
    startTime: '10:00',
    endDate: '',
    endTime: '10:00',
    customDays: []
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchTests();
    fetchScheduledTests();
  }, []);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      // You'll need to add an endpoint to get all tests
      // For now, we'll use a placeholder
      const { data } = await axios.get("${API_URL}/admin/questions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // This is temporary - you should create a proper endpoint to fetch all available tests
      setTests([]);
    } catch (error) {
      console.error('Failed to fetch tests');
    }
  };

  const fetchScheduledTests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get("${API_URL}/admin/scheduled-tests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScheduledTests(data.scheduledTests);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch scheduled tests');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      
      if (editingId) {
        // Update existing schedule
        await axios.put(
          `http://localhost:5000/api/admin/scheduled-tests/${editingId}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Test schedule updated successfully!');
      } else {
        // Create new schedule
        const { data } = await axios.post(
          "${API_URL}/admin/scheduled-tests',
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success(`Test scheduled successfully! ${data.totalScheduledDates} dates created.`);
      }
      
      setShowModal(false);
      fetchScheduledTests();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to schedule test');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled test?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:5000/api/admin/scheduled-tests/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Scheduled test deleted successfully!');
      fetchScheduledTests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete scheduled test');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/scheduled-tests/${id}`,
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Schedule status updated!');
      fetchScheduledTests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update schedule');
    }
  };

  const resetForm = () => {
    setFormData({
      testTitle: '',
      testType: 'sunday_full',
      examType: 'JEE_MAIN',
      scheduleType: 'one-time',
      startDate: '',
      startTime: '10:00',
      endDate: '',
      endTime: '10:00',
      customDays: []
    });
    setEditingId(null);
  };

  const handleEdit = (schedule) => {
    const startDateTime = new Date(schedule.startDate);
    const endDateTime = schedule.endDate ? new Date(schedule.endDate) : null;
    
    setFormData({
      testTitle: schedule.testId?.title || '',
      testType: schedule.testType,
      examType: schedule.examType,
      scheduleType: schedule.scheduleType,
      startDate: startDateTime.toISOString().split('T')[0],
      startTime: startDateTime.toTimeString().slice(0, 5),
      endDate: endDateTime ? endDateTime.toISOString().split('T')[0] : '',
      endTime: schedule.endTime || '10:00',
      customDays: schedule.customDays || []
    });
    setEditingId(schedule._id);
    setShowModal(true);
  };

  const handleCustomDayToggle = (day) => {
    const days = [...formData.customDays];
    const index = days.indexOf(day);
    
    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(day);
    }
    
    setFormData({ ...formData, customDays: days });
  };

  const getScheduleTypeLabel = (type) => {
    const labels = {
      'one-time': 'One Time',
      'alternate-days': 'Alternate Days',
      'weekends': 'Weekends',
      'custom': 'Custom'
    };
    return labels[type] || type;
  };

  const getDayName = (dayNum) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  if (loading && scheduledTests.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-textPrimary mb-2">Schedule Tests</h1>
            <p className="text-gray-600">Create recurring or one-time test schedules</p>
          </div>
          <Button variant="success" onClick={() => setShowModal(true)}>
            + Create Schedule
          </Button>
        </div>

        {/* Scheduled Tests List */}
        <div className="space-y-4">
          {scheduledTests.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">No scheduled tests yet</p>
            </Card>
          ) : (
            scheduledTests.map((schedule) => (
              <motion.div
                key={schedule._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card hover>
                  <div className="flex flex-col space-y-4">
                    {/* Schedule Header */}
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-textPrimary">
                            {schedule.testId?.title || 'Test'}
                          </h3>
                          <Badge variant={schedule.isActive ? 'success' : 'default'}>
                            {schedule.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="info">{getScheduleTypeLabel(schedule.scheduleType)}</Badge>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>Exam: {schedule.examType}</span>
                          <span>Subject: {schedule.testId?.subject}</span>
                          <span>Duration: {schedule.testId?.duration} mins</span>
                          <span>Marks: {schedule.testId?.totalMarks}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          variant="primary"
                          size="small"
                          onClick={() => handleEdit(schedule)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => handleToggleActive(schedule._id, schedule.isActive)}
                        >
                          {schedule.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="danger"
                          size="small"
                          onClick={() => handleDeleteSchedule(schedule._id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>

                    {/* Schedule Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Start Date</p>
                        <p className="font-semibold">
                          {new Date(schedule.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      {schedule.endDate && (
                        <div>
                          <p className="text-sm text-gray-500 mb-1">End Date</p>
                          <p className="font-semibold">
                            {new Date(schedule.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Total Dates</p>
                        <p className="font-semibold">{schedule.scheduledDates?.length || 0}</p>
                      </div>
                    </div>

                    {/* Custom Days */}
                    {schedule.scheduleType === 'custom' && schedule.customDays?.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Custom Days:</p>
                        <div className="flex flex-wrap gap-2">
                          {schedule.customDays.map((day) => (
                            <Badge key={day} variant="info">
                              {getDayName(day)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Upcoming Dates Preview */}
                    {schedule.scheduledDates && schedule.scheduledDates.length > 0 && (
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Upcoming Dates:</p>
                        <div className="flex flex-wrap gap-2">
                          {schedule.scheduledDates
                            .filter(sd => new Date(sd.date) >= new Date() && !sd.isCompleted)
                            .slice(0, 5)
                            .map((sd, index) => (
                              <span
                                key={index}
                                className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-full"
                              >
                                {new Date(sd.date).toLocaleDateString()}
                              </span>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Create Schedule Modal */}
        <AnimatePresence>
          {showModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4">
                  {editingId ? 'Edit Test Schedule' : 'Create Test Schedule'}
                </h2>

                <form onSubmit={handleCreateSchedule}>
                  <div className="space-y-4">
                    {/* Test Title */}
                    <div className="form-group">
                      <label>Test Title <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={formData.testTitle}
                        onChange={(e) => setFormData({ ...formData, testTitle: e.target.value })}
                        placeholder="e.g., Sunday Full Test Week 1"
                        className="input-field"
                        required
                      />
                    </div>

                    {/* Test Type */}
                    <div className="form-group">
                      <label>Test Type <span className="text-red-500">*</span></label>
                      <select
                        value={formData.testType}
                        onChange={(e) => setFormData({ ...formData, testType: e.target.value })}
                        className="input-field"
                        required
                      >
                        <option value="sunday_full">Sunday Full Test (3 hrs, 75 questions)</option>
                        <option value="alternate_day">Alternate Day Test (1 hr, 30 MCQs)</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        {formData.testType === 'sunday_full' 
                          ? '75 questions: 20 MCQs + 5 Numerical per subject'
                          : '30 MCQs: 10 per subject, No numerical questions'
                        }
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label>Exam Type <span className="text-red-500">*</span></label>
                        <select
                          value={formData.examType}
                          onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                          className="input-field"
                          required
                        >
                          <option value="JEE_MAIN">JEE Main</option>
                          <option value="JEE_MAIN_ADVANCED">JEE Main + Advanced</option>
                          <option value="NEET">NEET</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Schedule Type <span className="text-red-500">*</span></label>
                        <select
                          value={formData.scheduleType}
                          onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                          className="input-field"
                          required
                        >
                          <option value="one-time">One Time</option>
                          <option value="alternate-days">Alternate Days</option>
                          <option value="weekends">Weekends Only</option>
                          <option value="custom">Custom Days</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="form-group">
                        <label>Start Date <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          className="input-field"
                          min={new Date().toISOString().split('T')[0]}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Start Time <span className="text-red-500">*</span></label>
                        <input
                          type="time"
                          value={formData.startTime}
                          onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                          className="input-field"
                          required
                        />
                      </div>
                    </div>

                    {formData.scheduleType !== 'one-time' && (
                      <>
                        <div className="form-group">
                          <label>End Date <span className="text-red-500">*</span></label>
                          <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="input-field"
                            min={formData.startDate || new Date().toISOString().split('T')[0]}
                            required={formData.scheduleType !== 'one-time'}
                          />
                        </div>
                        <div className="form-group">
                          <label>End Time</label>
                          <input
                            type="time"
                            value={formData.endTime}
                            onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                            className="input-field"
                          />
                        </div>
                      </>
                    )}

                    {/* Custom Days Selection */}
                    {formData.scheduleType === 'custom' && (
                      <div className="form-group">
                        <label>Select Days <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-7 gap-2 mt-2">
                          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
                            <button
                              key={day}
                              type="button"
                              onClick={() => handleCustomDayToggle(day)}
                              className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                                formData.customDays.includes(day)
                                  ? 'bg-primary text-white'
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {getDayName(day).slice(0, 3)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Schedule Preview */}
                    {formData.scheduleType !== 'one-time' && formData.startDate && formData.endDate && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800">
                          <strong>Preview:</strong> This will create a recurring schedule from{' '}
                          {new Date(formData.startDate).toLocaleDateString()} to{' '}
                          {new Date(formData.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    <div className="flex space-x-3 mt-6">
                      <Button type="submit" variant="success" className="flex-1">
                        {editingId ? 'Update Schedule' : 'Create Schedule'}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowModal(false);
                          resetForm();
                        }}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ScheduleTests;

