import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { paymentService, API_URL } from '../../services/api';
import axios from 'axios';
import QRCode from 'qrcode';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import './Subscription.css';

const Subscription = () => {
  const [plans] = useState([
    { type: 'JEE_MAIN', name: 'JEE Main', amount: 299, duration: 120 },
    { type: 'JEE_MAIN_ADVANCED', name: 'JEE Main + Advanced', amount: 399, duration: 180 },
    { type: 'NEET', name: 'NEET', amount: 399, duration: 180 }
  ]);
  
  const [subscriptions, setSubscriptions] = useState([]);
  const [myPayments, setMyPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [promoCode, setPromoCode] = useState('');
  const [promoApplied, setPromoApplied] = useState(null);
  const [finalAmount, setFinalAmount] = useState(0);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentId, setPaymentId] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [subsRes, paymentsRes] = await Promise.all([
        paymentService.getSubscriptionStatus(),
        axios.get(`${API_URL}/payment/my-payments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      setSubscriptions(subsRes.data.subscriptions);
      setMyPayments(paymentsRes.data.payments);
    } catch (error) {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyPromoCode = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    try {
      const response = await axios.post(
        `${API_URL}/promocodes/validate`,
        {
          code: promoCode,
          examType: selectedPlan.type,
          originalAmount: selectedPlan.amount
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setPromoApplied(response.data.promoCode);
      setFinalAmount(response.data.finalAmount);
      toast.success(`Promo code applied! You save ₹${response.data.discount}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid promo code');
      setPromoApplied(null);
      setFinalAmount(selectedPlan.amount);
    }
  };

  const handleSubscribe = async (plan) => {
    setSelectedPlan(plan);
    setFinalAmount(plan.amount);
    setPromoCode('');
    setPromoApplied(null);
    setQrCodeUrl('');
    setPaymentId(null);
    setTransactionId('');
    setScreenshot('');
    setNotes('');
  };

  const generateQRCode = async () => {
    try {
      const amount = promoApplied ? finalAmount : selectedPlan.amount;
      
      // Initiate payment
      const response = await axios.post(
        `${API_URL}/payment/upi/initiate`,
        {
          examType: selectedPlan.type,
          amount: amount,
          originalAmount: selectedPlan.amount,
          promoCode: promoApplied ? promoCode : null,
          discount: promoApplied ? selectedPlan.amount - amount : 0
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      setPaymentId(response.data.payment._id);

      // Generate UPI QR Code
      const upiString = `upi://pay?pa=8278662431@ptaxis&pn=TestSeries&am=${amount}&cu=INR&tn=Subscription_${selectedPlan.type}`;
      const qrUrl = await QRCode.toDataURL(upiString);
      setQrCodeUrl(qrUrl);
      
      toast.success('QR Code generated! Please complete the payment');
    } catch (error) {
      toast.error('Failed to generate QR code');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size should be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshot(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitPayment = async () => {
    if (!transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    if (!screenshot) {
      toast.error('Please upload payment screenshot');
      return;
    }

    try {
      await axios.post(
        `${API_URL}/payment/upi/${paymentId}/submit`,
        {
          transactionId,
          screenshot,
          notes
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );

      toast.success('Payment proof submitted! Admin will review within 30 minutes.');
      setSelectedPlan(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit payment');
    }
  };

  const cancelPayment = () => {
    setSelectedPlan(null);
    setQrCodeUrl('');
    setPaymentId(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Loading...</div>
    </div>;
  }

  // Payment Modal View
  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="secondary" 
            onClick={cancelPayment}
            className="mb-4"
          >
            ← Back to Plans
          </Button>

          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">{selectedPlan.name} Subscription</h2>
            
            {/* Promo Code Section */}
            {!qrCodeUrl && (
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold mb-3">Have a Promo Code?</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code"
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                  />
                  <Button onClick={handleApplyPromoCode}>
                    Apply
                  </Button>
                </div>
                {promoApplied && (
                  <div className="mt-2 text-green-600 font-medium">
                    ✅ Promo code "{promoApplied.code}" applied!
                  </div>
                )}
              </div>
            )}

            {/* Price Summary */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between mb-2">
                <span>Original Amount:</span>
                <span className={promoApplied ? 'line-through text-gray-500' : 'font-bold'}>
                  ₹{selectedPlan.amount}
                </span>
              </div>
              {promoApplied && (
                <>
                  <div className="flex justify-between mb-2 text-green-600">
                    <span>Discount ({promoApplied.code}):</span>
                    <span>- ₹{selectedPlan.amount - finalAmount}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg border-t pt-2">
                    <span>Final Amount:</span>
                    <span className="text-primary">₹{finalAmount}</span>
                  </div>
                </>
              )}
            </div>

            {!qrCodeUrl ? (
              <Button 
                onClick={generateQRCode}
                className="w-full"
                size="lg"
              >
                Generate UPI QR Code
              </Button>
            ) : (
              <div className="space-y-6">
                {/* QR Code Display */}
                <div className="text-center p-6 bg-white border-2 border-dashed border-primary rounded-lg">
                  <h3 className="font-bold text-lg mb-4">Scan QR Code to Pay</h3>
                  <img 
                    src={qrCodeUrl} 
                    alt="UPI QR Code" 
                    className="mx-auto w-64 h-64 mb-4"
                  />
                  <div className="text-lg font-bold text-primary mb-2">
                    ₹{promoApplied ? finalAmount : selectedPlan.amount}
                  </div>
                  <div className="text-sm text-gray-600">
                    UPI ID: <span className="font-mono font-semibold">8278662431@ptaxis</span>
                  </div>
                </div>

                {/* Payment Proof Submission */}
                <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h3 className="font-bold text-lg mb-4">Submit Payment Proof</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block font-medium mb-2">Transaction ID / UPI Ref No. *</label>
                      <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="e.g., 123456789012"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block font-medium mb-2">Payment Screenshot *</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                      {screenshot && (
                        <div className="mt-2">
                          <img src={screenshot} alt="Preview" className="max-w-xs rounded border" />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-medium mb-2">Additional Notes (Optional)</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any additional information..."
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <Button 
                      onClick={handleSubmitPayment}
                      className="w-full"
                      size="lg"
                    >
                      Submit Payment Proof
                    </Button>

                    <p className="text-sm text-gray-600 text-center">
                      ⏱️ Your payment will be verified within 30 minutes
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">Subscription Plans</h1>
        <p className="text-center text-gray-600 mb-8">Choose the perfect plan for your exam preparation</p>

        {/* Active Subscriptions */}
        {subscriptions.length > 0 && (
          <Card className="mb-8 p-6 bg-green-50 border-green-200">
            <h3 className="text-xl font-bold mb-4 text-green-800">✅ Your Active Subscriptions</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {subscriptions.map((sub, index) => (
                <div key={index} className="p-4 bg-white rounded-lg shadow-sm">
                  <div className="font-bold text-lg">{sub.examType.replace(/_/g, ' ')}</div>
                  <div className="text-sm text-gray-600 mt-1">
                    Expires: {new Date(sub.expiryDate).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pending Payments */}
        {myPayments.filter(p => p.status === 'PENDING').length > 0 && (
          <Card className="mb-8 p-6 bg-yellow-50 border-yellow-200">
            <h3 className="text-xl font-bold mb-4 text-yellow-800">⏳ Pending Payments</h3>
            <div className="space-y-3">
              {myPayments.filter(p => p.status === 'PENDING').map((payment) => (
                <div key={payment._id} className="p-4 bg-white rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <div className="font-bold">{payment.examType.replace(/_/g, ' ')}</div>
                    <div className="text-sm text-gray-600">Amount: ₹{payment.amount}</div>
                    <div className="text-sm text-gray-600">
                      Submitted: {new Date(payment.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-yellow-600 font-medium">Under Review</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card key={plan.type} className="p-6 hover:shadow-xl transition-shadow">
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="text-4xl font-bold text-primary mb-2">₹{plan.amount}</div>
              <p className="text-gray-600 mb-4">Valid for {plan.duration} days</p>

              <ul className="space-y-2 mb-6 text-sm">
                <li className="flex items-center">✅ Complete question bank</li>
                <li className="flex items-center">✅ Unlimited test generation</li>
                <li className="flex items-center">✅ Detailed analytics</li>
                <li className="flex items-center">✅ Subject & chapter-wise tests</li>
                <li className="flex items-center">✅ Instant results</li>
                <li className="flex items-center">✅ JEE Main pattern tests</li>
              </ul>

              <Button
                onClick={() => handleSubscribe(plan)}
                className="w-full"
                size="lg"
              >
                Subscribe Now
              </Button>
            </Card>
          ))}
        </div>

        {/* Payment Info */}
        <Card className="p-6 bg-blue-50">
          <h3 className="text-xl font-bold mb-3">💳 Payment Information</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li>✅ Pay via UPI (Google Pay, PhonePe, Paytm, etc.)</li>
            <li>✅ Secure payment through UPI QR Code</li>
            <li>✅ Payment verification within 30 minutes</li>
            <li>✅ Use promo code "NEW" for ₹100 discount (₹299 → ₹199)</li>
            <li>📧 For support, contact: <strong>support@testseries.com</strong></li>
          </ul>
        </Card>
      </div>
    </div>
  );
};

export default Subscription;

