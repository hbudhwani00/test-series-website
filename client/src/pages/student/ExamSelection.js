import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ExamSelection.css';

const ExamSelection = () => {
  const [selectedExam, setSelectedExam] = useState('');
  const navigate = useNavigate();

  const handleExamSelect = (examType) => {
    setSelectedExam(examType);
    localStorage.setItem('selectedExam', examType);
    setTimeout(() => {
      navigate('/student/subscription');
    }, 500);
  };

  return (
    <div className="container">
      <div className="exam-selection">
        <h1>Select Your Exam</h1>
        <p>Choose the exam you want to prepare for</p>

        <div className="exam-cards">
          <div
            className={`exam-card ${selectedExam === 'JEE' ? 'selected' : ''}`}
            onClick={() => handleExamSelect('JEE')}
          >
            <div className="exam-icon">📐</div>
            <h2>JEE</h2>
            <p>Joint Entrance Examination</p>
            <ul>
              <li>Physics</li>
              <li>Chemistry</li>
              <li>Mathematics</li>
            </ul>
            <button className="btn btn-primary">Select JEE</button>
          </div>

          <div
            className={`exam-card ${selectedExam === 'NEET' ? 'selected' : ''}`}
            onClick={() => handleExamSelect('NEET')}
          >
            <div className="exam-icon">🔬</div>
            <h2>NEET</h2>
            <p>National Eligibility cum Entrance Test</p>
            <ul>
              <li>Physics</li>
              <li>Chemistry</li>
              <li>Biology</li>
            </ul>
            <button className="btn btn-primary">Select NEET</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamSelection;
