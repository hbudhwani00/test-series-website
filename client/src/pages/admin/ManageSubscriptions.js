import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Card, Badge, LoadingSpinner } from '../../components/ui';
import './admin.css';

const ManageSubscriptions = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    examType: '',
    status: '',
    search: ''
  });
  const [showModal, setShowModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [formData, setFormData] = useState({
    examType: 'JEE_MAIN',
    expiryDate: '',
    amount: 0
  });

  useEffect(() => {
    fetchStudents();
  }, [filters]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/admin/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      setStudents(data.students);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantSubscription = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(
        `${API_URL}/admin/subscriptions/${selectedStudent._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Subscription granted successfully!');
      setShowModal(false);
      fetchStudents();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to grant subscription');
    }
  };

  const handleUpdateSubscription = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const subscription = selectedStudent.subscriptions.find(sub => sub.examType === formData.examType);
      
      const { data } = await axios.put(
        `${API_URL}/admin/subscriptions/${selectedStudent._id}/${subscription._id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Subscription updated successfully!');
      setShowModal(false);
      fetchStudents();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update subscription');
    }
  };

  const handleDeleteSubscription = async (studentId, subscriptionId) => {
    if (!window.confirm('Are you sure you want to delete this subscription?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(
        `${API_URL}/admin/subscriptions/${studentId}/${subscriptionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Subscription deleted successfully!');
      fetchStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete subscription');
    }
  };

  const openModal = (student, mode, subscription = null) => {
    setSelectedStudent(student);
    setModalMode(mode);
    
    if (mode === 'edit' && subscription) {
      setFormData({
        examType: subscription.examType,
        expiryDate: new Date(subscription.expiryDate).toISOString().split('T')[0],
        amount: subscription.amount || 0,
        isActive: subscription.isActive
      });
    } else {
      resetForm();
    }
    
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      examType: 'JEE_MAIN',
      expiryDate: '',
      amount: 0,
      isActive: true
    });
    setSelectedStudent(null);
  };

  const getStatusBadge = (subscription) => {
    const expiryDate = new Date(subscription.expiryDate);
    const today = new Date();
    
    if (!subscription.isActive) {
      return <Badge variant="default">Inactive</Badge>;
    } else if (expiryDate > today) {
      return <Badge variant="success">Active</Badge>;
    } else {
      return <Badge variant="danger">Expired</Badge>;
    }
  };

  const getExamTypeLabel = (examType) => {
    const labels = {
      'JEE_MAIN': 'JEE Main',
      'JEE_MAIN_ADVANCED': 'JEE Main + Advanced',
      'NEET': 'NEET'
    };
    return labels[examType] || examType;
  };

  if (loading && students.length === 0) {
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-textPrimary mb-2">Manage Subscriptions</h1>
          <p className="text-gray-600">Grant and manage student subscriptions manually</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="input-field"
            />
            
            <select
              value={filters.examType}
              onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
              className="input-field"
            >
              <option value="">All Exam Types</option>
              <option value="JEE_MAIN">JEE Main</option>
              <option value="JEE_MAIN_ADVANCED">JEE Main + Advanced</option>
              <option value="NEET">NEET</option>
            </select>

            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="inactive">Inactive</option>
            </select>

            <Button onClick={() => setFilters({ examType: '', status: '', search: '' })}>
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Students List */}
        <div className="space-y-4">
          {students.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 py-8">No students found</p>
            </Card>
          ) : (
            students.map((student) => (
              <motion.div
                key={student._id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card hover>
                  <div className="flex flex-col space-y-4">
                    {/* Student Info */}
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold text-textPrimary">{student.name}</h3>
                        <p className="text-gray-600">{student.email}</p>
                        <p className="text-gray-500">{student.phone}</p>
                      </div>
                      <Button
                        variant="primary"
                        onClick={() => openModal(student, 'add')}
                      >
                        Grant Subscription
                      </Button>
                    </div>

                    {/* Subscriptions */}
                    {student.subscriptions && student.subscriptions.length > 0 ? (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Subscriptions:</h4>
                        {student.subscriptions.map((sub) => (
                          <div
                            key={sub._id}
                            className="flex items-center justify-between bg-gray-50 p-3 rounded-lg"
                          >
                            <div className="flex items-center space-x-4">
                              <Badge variant="info">{getExamTypeLabel(sub.examType)}</Badge>
                              {getStatusBadge(sub)}
                              <span className="text-sm text-gray-600">
                                Expires: {new Date(sub.expiryDate).toLocaleDateString()}
                              </span>
                              {sub.amount > 0 && (
                                <span className="text-sm text-gray-600">₹{sub.amount}</span>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                size="small"
                                onClick={() => openModal(student, 'edit', sub)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="danger"
                                size="small"
                                onClick={() => handleDeleteSubscription(student._id, sub._id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">No subscriptions</p>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Modal */}
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
                className="bg-white rounded-xl p-6 max-w-md w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold mb-4">
                  {modalMode === 'add' ? 'Grant Subscription' : 'Update Subscription'}
                </h2>
                
                {selectedStudent && (
                  <div className="mb-4">
                    <p className="text-gray-600">Student: <strong>{selectedStudent.name}</strong></p>
                    <p className="text-gray-500">{selectedStudent.email}</p>
                  </div>
                )}

                <form onSubmit={modalMode === 'add' ? handleGrantSubscription : handleUpdateSubscription}>
                  <div className="space-y-4">
                    <div className="form-group">
                      <label>Exam Type</label>
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
                      <label>Expiry Date</label>
                      <input
                        type="date"
                        value={formData.expiryDate}
                        onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                        className="input-field"
                        min={new Date().toISOString().split('T')[0]}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Amount (Optional)</label>
                      <input
                        type="number"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                        className="input-field"
                        min="0"
                      />
                    </div>

                    {modalMode === 'edit' && (
                      <div className="form-group">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4"
                          />
                          <span>Active</span>
                        </label>
                      </div>
                    )}

                    <div className="flex space-x-3 mt-6">
                      <Button type="submit" variant="success" className="flex-1">
                        {modalMode === 'add' ? 'Grant Subscription' : 'Update Subscription'}
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

export default ManageSubscriptions;

