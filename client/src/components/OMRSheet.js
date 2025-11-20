import React from 'react';
import './OMRSheet.css';

const OMRSheet = ({ totalQuestions = 180, answers, markedForReview, currentQuestionIndex, onQuestionClick, onAnswerSelect }) => {
  const sections = [
    { name: 'Physics', start: 1, end: 45 },
    { name: 'Chemistry', start: 46, end: 90 },
    { name: 'Biology', start: 91, end: 180 }
  ];

  const getAnswerStatus = (questionNum, optionIndex) => {
    const index = questionNum - 1;
    const answer = answers[index];
    if (!answer) return 'unanswered';
    const optionLetter = String.fromCharCode(65 + optionIndex);
    return answer === optionLetter ? 'answered' : 'unanswered';
  };

  const handleOptionClick = (questionNum, optionIndex) => {
    const index = questionNum - 1;
    const optionLetter = String.fromCharCode(65 + optionIndex);
    
    // Call the answer select handler if provided
    if (onAnswerSelect) {
      onAnswerSelect(index, optionLetter);
    }
  };

  const answeredCount = Object.values(answers).filter(a => a !== undefined && a !== null).length;
  const markedCount = Object.values(markedForReview).filter(m => m).length;
  const unattemptedCount = totalQuestions - answeredCount;

  return (
    <div className="omr-sheet-container">
      {/* Stats Bar */}
      <div className="omr-stats">
        <div className="stat-item">
          <strong>{answeredCount}</strong>
          <span>Answered</span>
        </div>
        <div className="stat-item">
          <strong>{markedCount}</strong>
          <span>Marked</span>
        </div>
        <div className="stat-item">
          <strong>{unattemptedCount}</strong>
          <span>Unattempted</span>
        </div>
      </div>

      {/* Legend */}
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
      </div>

      {/* OMR Sections with Questions and Options */}
      <div className="omr-sections">
        {sections.map((section) => (
          <div key={section.name} className="omr-section">
            <div className="section-header">
              <span className="section-name">{section.name}</span>
              <span className="section-range">Q{section.start}-{section.end}</span>
            </div>
            
            <div className="omr-questions-list">
              {Array.from({ length: section.end - section.start + 1 }, (_, i) => {
                const questionNum = section.start + i;
                const index = questionNum - 1;
                const isCurrent = currentQuestionIndex === index;
                const isMarked = markedForReview[index];
                const answer = answers[index];
                
                return (
                  <div
                    key={questionNum}
                    className={`omr-question-row ${isCurrent ? 'current' : ''} ${isMarked ? 'marked' : ''}`}
                  >
                    <div className="question-num">Q{questionNum}</div>
                    
                    <div className="question-options">
                      {['A', 'B', 'C', 'D'].map((option, idx) => {
                        const isSelected = answer === option;
                        return (
                          <div
                            key={option}
                            className={`option-bubble-omr ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleOptionClick(questionNum, idx)}
                            title={`Q${questionNum} Option ${option}`}
                          >
                            {option}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OMRSheet;
