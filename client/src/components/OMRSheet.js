import React from 'react';
import './OMRSheet.css';

const OMRSheet = ({ totalQuestions = 180, questions = [], answers, markedForReview, currentQuestionIndex, onQuestionClick, onAnswerSelect }) => {
  // Group questions by subject and sort by questionNumber
  const physicsQuestions = questions.filter(q => q.subject === 'Physics').sort((a, b) => a.questionNumber - b.questionNumber);
  const chemistryQuestions = questions.filter(q => q.subject === 'Chemistry').sort((a, b) => a.questionNumber - b.questionNumber);
  const biologyQuestions = questions.filter(q => q.subject === 'Biology').sort((a, b) => a.questionNumber - b.questionNumber);

  const sections = [
    { name: 'Physics', questions: physicsQuestions, range: 'Q1-45' },
    { name: 'Chemistry', questions: chemistryQuestions, range: 'Q46-90' },
    { name: 'Biology', questions: biologyQuestions, range: 'Q91-180' }
  ];

  const getAnswerStatus = (questionIndex, optionIndex) => {
    const answer = answers[questionIndex];
    if (!answer) return 'unanswered';
    const optionLetter = String.fromCharCode(65 + optionIndex);
    return answer === optionLetter ? 'answered' : 'unanswered';
  };

  const handleOptionClick = (questionIndex, optionIndex) => {
    const optionLetter = String.fromCharCode(65 + optionIndex);
    
    // Call the answer select handler if provided
    if (onAnswerSelect) {
      onAnswerSelect(questionIndex, optionLetter);
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
              <span className="section-range">{section.range}</span>
            </div>
            
            <div className="omr-questions-list">
              {section.questions.map((question) => {
                const questionIndex = questions.indexOf(question);
                const isCurrent = currentQuestionIndex === questionIndex;
                const isMarked = markedForReview[questionIndex];
                const answer = answers[questionIndex];
                const displayNumber = question.questionNumber || (questionIndex + 1);
                
                return (
                  <div
                    key={questionIndex}
                    className={`omr-question-row ${isCurrent ? 'current' : ''} ${isMarked ? 'marked' : ''}`}
                  >
                    <div 
                      className="question-num"
                      onClick={() => {
                        if (onQuestionClick) {
                          onQuestionClick(questionIndex);
                          // Scroll to the question
                          const questionElement = document.getElementById(`question-${questionIndex}`);
                          if (questionElement) {
                            questionElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      Q{displayNumber}
                    </div>
                    
                    <div className="question-options">
                      {['A', 'B', 'C', 'D'].map((option, idx) => {
                        const isSelected = answer === option;
                        return (
                          <div
                            key={option}
                            className={`option-bubble-omr ${isSelected ? 'selected' : ''}`}
                            onClick={() => handleOptionClick(questionIndex, idx)}
                            title={`Q${displayNumber} Option ${option}`}
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