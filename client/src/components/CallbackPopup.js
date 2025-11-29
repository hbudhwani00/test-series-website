import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './CallbackPopup.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CallbackPopup = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await axios.post(`${API_URL}/callback-request`, formData);
      toast.success('Request submitted! Our team will call you soon.');
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit request');
      setSubmitting(false);
    }
  };

  return (
    <div className="callback-popup-overlay" onClick={onClose}>
      <div className="callback-popup" onClick={(e) => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="popup-header">
          <h2>Enquiry Form</h2>
          <p>Free for First 99 Users</p>
          <p>Fill this form our team will call you to help you</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Your Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone Number *</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Enter your phone number"
              pattern="[0-9]{10}"
              required
            />
            <small>10-digit mobile number</small>
          </div>

          <div className="form-group">
            <label>Message (Optional)</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Any specific query?"
              rows="3"
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn" 
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>

        <p className="popup-footer">
          We'll call you within 24 hours to discuss your preparation needs!
        </p>
      </div>
    </div>
  );
};

export default CallbackPopup;
