import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { API_URL } from '../../services/api';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';

const PromoCodeManagement = () => {
  const [promoCodes, setPromoCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    discount: '',
    discountType: 'FIXED',
    expiryDate: '',
    maxUses: '',
    description: '',
    applicableExams: []
  });

  useEffect(() => {
    fetchPromoCodes();
  }, []);

  const fetchPromoCodes = async () => {
    try {
      const response = await axios.get("${API_URL}/promocodes', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setPromoCodes(response.data.promoCodes);
    } catch (error) {
      toast.error('Failed to fetch promo codes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "${API_URL}/promocodes',
        {
          ...formData,
          discount: Number(formData.discount),
          maxUses: formData.maxUses ? Number(formData.maxUses) : null
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Promo code created successfully');
      setShowForm(false);
      setFormData({
        code: '',
        discount: '',
        discountType: 'FIXED',
        expiryDate: '',
        maxUses: '',
        description: '',
        applicableExams: []
      });
      fetchPromoCodes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create promo code');
    }
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      await axios.put(
        `http://localhost:5000/api/promocodes/${id}`,
        { isActive: !currentStatus },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success(`Promo code ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to update promo code');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this promo code?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/promocodes/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      toast.success('Promo code deleted');
      fetchPromoCodes();
    } catch (error) {
      toast.error('Failed to delete promo code');
    }
  };

  const handleExamToggle = (exam) => {
    setFormData(prev => ({
      ...prev,
      applicableExams: prev.applicableExams.includes(exam)
        ? prev.applicableExams.filter(e => e !== exam)
        : [...prev.applicableExams, exam]
    }));
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading promo codes...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Promo Code Management</h1>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Create Promo Code'}
          </Button>
        </div>

        {/* Create Form */}
        {showForm && (
          <Card className="p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">Create New Promo Code</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-2">Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., NEW, SAVE50"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">Discount Type *</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  >
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium mb-2">
                    Discount {formData.discountType === 'FIXED' ? '(₹)' : '(%)'} *
                  </label>
                  <input
                    type="number"
                    value={formData.discount}
                    onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                    placeholder={formData.discountType === 'FIXED' ? '290' : '50'}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">Max Uses (optional)</label>
                  <input
                    type="number"
                    value={formData.maxUses}
                    onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                    placeholder="Leave empty for unlimited"
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-2">Expiry Date (optional)</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium mb-2">Applicable Exams</label>
                <div className="flex gap-4">
                  {['JEE_MAIN', 'JEE_MAIN_ADVANCED', 'NEET'].map(exam => (
                    <label key={exam} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.applicableExams.includes(exam)}
                        onChange={() => handleExamToggle(exam)}
                        className="mr-2"
                      />
                      {exam.replace(/_/g, ' ')}
                    </label>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-1">Leave unchecked for all exams</p>
              </div>

              <div>
                <label className="block font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Special discount for new users"
                  rows="2"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button type="submit" className="w-full" size="lg">
                Create Promo Code
              </Button>
            </form>
          </Card>
        )}

        {/* Promo Codes List */}
        <div className="grid gap-4">
          {promoCodes.map((promo) => (
            <Card key={promo._id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold font-mono">{promo.code}</h3>
                    <Badge variant={promo.isActive ? 'success' : 'secondary'}>
                      {promo.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {promo.description && (
                    <p className="text-gray-600">{promo.description}</p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary mb-1">
                    {promo.discountType === 'FIXED' ? `₹${promo.discount}` : `${promo.discount}%`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {promo.discountType === 'FIXED' ? 'Fixed' : 'Percentage'}
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-600">Used:</span>
                  <p className="font-semibold">{promo.usedCount} {promo.maxUses ? `/ ${promo.maxUses}` : ''}</p>
                </div>
                <div>
                  <span className="text-gray-600">Expiry:</span>
                  <p className="font-semibold">
                    {promo.expiryDate ? new Date(promo.expiryDate).toLocaleDateString() : 'Never'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <p className="font-semibold">{new Date(promo.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Applicable:</span>
                  <p className="font-semibold">
                    {promo.applicableExams.length > 0 
                      ? promo.applicableExams.join(', ').replace(/_/g, ' ')
                      : 'All Exams'}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant={promo.isActive ? 'secondary' : 'primary'}
                  onClick={() => toggleActive(promo._id, promo.isActive)}
                  size="sm"
                >
                  {promo.isActive ? 'Deactivate' : 'Activate'}
                </Button>
                <Button
                  variant="danger"
                  onClick={() => handleDelete(promo._id)}
                  size="sm"
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {promoCodes.length === 0 && (
          <Card className="p-8 text-center text-gray-500">
            No promo codes created yet. Click "Create Promo Code" to add one.
          </Card>
        )}
      </div>
    </div>
  );
};

export default PromoCodeManagement;

