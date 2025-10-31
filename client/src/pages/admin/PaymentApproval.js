import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import { API_URL } from '../../services/api';

const PaymentApproval = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('PENDING');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      const endpoint = filter === 'PENDING' 
        ? `${API_URL}/payment/pending`
        : `${API_URL}/payment/all?status=${filter}`;
        
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setPayments(response.data.payments);
    } catch (error) {
      toast.error('Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    if (!window.confirm('Approve this payment and activate subscription?')) {
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/payment/${paymentId}/approve`,
        {},
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Payment approved and subscription activated!');
      fetchPayments();
      setSelectedPayment(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    }
  };

  const handleReject = async (paymentId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide rejection reason');
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/payment/${paymentId}/reject`,
        { reason: rejectionReason },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Payment rejected');
      fetchPayments();
      setSelectedPayment(null);
      setRejectionReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject payment');
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800'
    };
    return <Badge variant={status === 'APPROVED' ? 'success' : status === 'REJECTED' ? 'danger' : 'warning'}>
      {status}
    </Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading payments...</div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Payment Approvals</h1>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={filter === 'PENDING' ? 'primary' : 'secondary'}
            onClick={() => setFilter('PENDING')}
          >
            Pending
          </Button>
          <Button
            variant={filter === 'APPROVED' ? 'primary' : 'secondary'}
            onClick={() => setFilter('APPROVED')}
          >
            Approved
          </Button>
          <Button
            variant={filter === 'REJECTED' ? 'primary' : 'secondary'}
            onClick={() => setFilter('REJECTED')}
          >
            Rejected
          </Button>
        </div>

        {/* Payments List */}
        {payments.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No {filter.toLowerCase()} payments found
          </Card>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <Card key={payment._id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      {payment.examType.replace(/_/g, ' ')}
                    </h3>
                    <p className="text-sm text-gray-600">
                      Student: {payment.userId?.name} ({payment.userId?.email})
                    </p>
                    {payment.userId?.phone && (
                      <p className="text-sm text-gray-600">
                        Phone: {payment.userId.phone}
                      </p>
                    )}
                  </div>
                  {getStatusBadge(payment.status)}
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Original Amount:</span>
                    <p className="font-semibold">₹{payment.originalAmount}</p>
                  </div>
                  {payment.promoCode && (
                    <div>
                      <span className="text-sm text-gray-600">Promo Code:</span>
                      <p className="font-semibold text-green-600">{payment.promoCode}</p>
                      <p className="text-sm">Discount: ₹{payment.discount}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-sm text-gray-600">Final Amount:</span>
                    <p className="font-bold text-lg text-primary">₹{payment.amount}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-gray-600">Transaction ID:</span>
                    <p className="font-mono text-sm">{payment.transactionId || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-600">Submitted:</span>
                    <p className="text-sm">{new Date(payment.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {payment.notes && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600">Notes:</span>
                    <p className="text-sm">{payment.notes}</p>
                  </div>
                )}

                {payment.screenshot && (
                  <div className="mb-4">
                    <span className="text-sm text-gray-600 block mb-2">Payment Screenshot:</span>
                    <img 
                      src={payment.screenshot} 
                      alt="Payment proof" 
                      className="max-w-md rounded border cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => window.open(payment.screenshot, '_blank')}
                    />
                  </div>
                )}

                {payment.status === 'PENDING' && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="primary"
                      onClick={() => handleApprove(payment._id)}
                    >
                      ✅ Approve & Activate
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setSelectedPayment(payment)}
                    >
                      ❌ Reject
                    </Button>
                  </div>
                )}

                {payment.status === 'APPROVED' && payment.approvedAt && (
                  <div className="mt-4 p-3 bg-green-50 rounded">
                    <p className="text-sm text-green-700">
                      Approved by {payment.approvedBy?.name} on {new Date(payment.approvedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {payment.status === 'REJECTED' && (
                  <div className="mt-4 p-3 bg-red-50 rounded">
                    <p className="text-sm text-red-700">
                      Rejected: {payment.rejectionReason}
                    </p>
                    {payment.approvedAt && (
                      <p className="text-xs text-gray-600 mt-1">
                        on {new Date(payment.approvedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedPayment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full p-6">
              <h3 className="text-xl font-bold mb-4">Reject Payment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Student: {selectedPayment.userId?.name}<br />
                Amount: ₹{selectedPayment.amount}
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows="4"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-primary"
              />
              <div className="flex gap-2">
                <Button
                  variant="danger"
                  onClick={() => handleReject(selectedPayment._id)}
                  className="flex-1"
                >
                  Reject Payment
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSelectedPayment(null);
                    setRejectionReason('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentApproval;
