import React from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../services/api';
import './DemoTestSelectionModal.css';

const DemoTestSelectionModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleSelectExam = async (examType) => {
    try {
      if (examType === 'JEE') {
        // Fetch JEE demo test
        const response = await axios.get(`${API_URL}/demo/test`);
        if (!response.data.test) {
          toast.error('JEE demo test not available');
          return;
        }
        navigate(`/student/demo-test/${response.data.test._id}`);
      } else if (examType === 'NEET') {
        // Fetch active NEET demo test
        const response = await axios.get(`${API_URL}/demo/neet-test`);
        if (!response.data.neetTest) {
          toast.error('NEET demo test not available yet. Please try JEE.');
          return;
        }
        navigate(`/student/neet-demo-test/${response.data.neetTest._id}`);
      }
      onClose();
    } catch (error) {
      console.error('Error loading demo test:', error);
      toast.error(error.response?.data?.message || 'Failed to load demo test');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="demo-selection-overlay">
      <div className="demo-selection-modal">
        <button className="demo-selection-close" onClick={onClose}>×</button>
        
        <h2>Select Your Exam Type</h2>
        <p>Choose which entrance exam demo you'd like to try first</p>

        <div className="exam-options-grid">
          {/* JEE Option */}
          <div className="exam-option-card jee-card" onClick={() => handleSelectExam('JEE')}>
            <div className="exam-icon">📐</div>
            <h3>JEE Main</h3>
            <ul className="exam-specs">
              <li>75 Questions</li>
              <li>3 Hours</li>
              <li>300 Marks</li>
              <li>Physics • Chemistry • Mathematics</li>
            </ul>
            <button className="exam-cta">Start JEE Demo Test</button>
          </div>

          {/* NEET Option */}
          <div className="exam-option-card neet-card" onClick={() => handleSelectExam('NEET')}>
            <div className="exam-icon">🔬</div>
            <h3>NEET</h3>
            <ul className="exam-specs">
              <li>180 Questions</li>
              <li>3 Hours 20 Minutes</li>
              <li>720 Marks</li>
              <li>Physics • Chemistry • Biology</li>
            </ul>
            <button className="exam-cta">Start NEET Demo Test</button>
          </div>
        </div>

        <p className="demo-selection-footer">Both demos are completely free. No login required!</p>
      </div>
    </div>
  );
};

export default DemoTestSelectionModal;
