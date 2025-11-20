import React from 'react';
import './OMRSheet.css';

const OMRSheet = ({ totalQuestions = 180, answers, markedForReview, currentQuestionIndex, onQuestionClick }) => {
  const sections = [
    { name: 'Physics', start: 1, end: 45 },
    { name: 'Chemistry', start: 46, end: 90 },
    { name: 'Biology', start: 91, end: 180 }
  ];

  const getQuestionStatus = (questionNum) => {
    const index = questionNum - 1;
    if (markedForReview[index]) return 'marked';
    if (answers[index] !== undefined && answers[index] !== null) return 'answered';
    return 'unanswered';
  };

  return (
    <div className="omr-sheet-container">
      <h3 className="omr-title">OMR Sheet</h3>
      
      <div className="omr-legend">
        <div className="legend-item">
          <div className="legend-box unanswered"></div>
          <span>Unanswered</span>
        </div>
        <div className="legend-item">
          <div className="legend-box answered"></div>
          <span>Answered</span>
        </div>
        <div className="legend-item">
          <div className="legend-box marked"></div>
          <span>Marked</span>
        </div>
        <div className="legend-item">
          <div className="legend-box current"></div>
          <span>Current</span>
        </div>
      </div>

      <div className="omr-sections">
        {sections.map((section) => (
          <div key={section.name} className="omr-section">
            <div className="section-header">
              <span className="section-name">{section.name}</span>
              <span className="section-range">Q{section.start}-{section.end}</span>
            </div>
            
            <div className="omr-bubbles">
              {Array.from({ length: section.end - section.start + 1 }, (_, i) => {
                const questionNum = section.start + i;
                const status = getQuestionStatus(questionNum);
                const isCurrent = currentQuestionIndex === questionNum - 1;
                
                return (
                  <div
                    key={questionNum}
                    className={`omr-bubble ${status} ${isCurrent ? 'current' : ''}`}
                    onClick={() => onQuestionClick(questionNum - 1)}
                    title={`Q${questionNum} - ${status}`}
                  >
                    <span className="bubble-number">{questionNum}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="omr-stats">
        <div className="stat-item">
          <strong>Answered:</strong> {Object.values(answers).filter(a => a !== undefined && a !== null).length}
        </div>
        <div className="stat-item">
          <strong>Marked:</strong> {Object.values(markedForReview).filter(m => m).length}
        </div>
        <div className="stat-item">
          <strong>Unattempted:</strong> {totalQuestions - Object.values(answers).filter(a => a !== undefined && a !== null).length}
        </div>
      </div>
    </div>
  );
};

export default OMRSheet;
