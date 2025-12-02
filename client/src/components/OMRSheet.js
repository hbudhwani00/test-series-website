import React from 'react';
import './OMRSheet.css';

const OMRSheet = ({ totalQuestions = 180, questions = [], answers = {}, markedForReview = {}, currentQuestionIndex, onQuestionClick, onAnswerSelect }) => {
  // Group questions by subject and sort by questionNumber
  const physicsQuestions = questions.filter(q => q.subject === 'Physics').sort((a, b) => a.questionNumber - b.questionNumber);
  const chemistryQuestions = questions.filter(q => q.subject === 'Chemistry').sort((a, b) => a.questionNumber - b.questionNumber);
  const biologyQuestions = questions.filter(q => q.subject === 'Biology').sort((a, b) => a.questionNumber - b.questionNumber);

  const sections = [
    { name: 'Physics', questions: physicsQuestions, range: 'Q1-45' },
    { name: 'Chemistry', questions: chemistryQuestions, range: 'Q46-90' },
    { name: 'Biology', questions: biologyQuestions, range: 'Q91-180' }
  ];

  // Normalize an answer (which may be a letter like 'A' or a numeric index 0..3) to a letter 'A'..'Z'
  const normalizeAnswerToLetter = (ans) => {
    if (ans === null || ans === undefined || ans === '') return null;
    if (typeof ans === 'number') return String.fromCharCode(65 + Number(ans));
    if (typeof ans === 'string') {
      const trimmed = ans.trim();
      // If it's a single letter like 'A'
      if (/^[A-Za-z]$/.test(trimmed)) return trimmed.toUpperCase();
      // If it's a numeric string like '0','1'
      if (/^\d+$/.test(trimmed)) return String.fromCharCode(65 + Number(trimmed));
    }
    return null;
  };

  const getAnswerStatus = (questionIndex, optionIndex) => {
    const q = questions[questionIndex];
    const byIndex = answers && Object.prototype.hasOwnProperty.call(answers, questionIndex) ? answers[questionIndex] : undefined;
    const byId = q && q._id && answers && Object.prototype.hasOwnProperty.call(answers, q._id) ? answers[q._id] : undefined;
    const answerLetter = normalizeAnswerToLetter(byIndex !== undefined ? byIndex : byId);
    if (!answerLetter) return 'unanswered';
    const optionLetter = String.fromCharCode(65 + optionIndex);
    return answerLetter === optionLetter ? 'answered' : 'unanswered';
  };

  const handleOptionClick = (questionIndex, optionIndex, questionId) => {
    const optionLetter = String.fromCharCode(65 + optionIndex);

    // Call the answer select handler if provided. Pass both index and id when available.
    if (onAnswerSelect) {
      onAnswerSelect(questionIndex, optionLetter, questionId);
    }
  };

  // Compute answered count by iterating questions to avoid double-counting index-keyed and id-keyed entries
  const answeredCount = sections.reduce((sum, section) => {
    return sum + section.questions.reduce((s, q) => {
      const idx = questions.indexOf(q);
      const byIndex = answers && Object.prototype.hasOwnProperty.call(answers, idx) ? answers[idx] : undefined;
      const byId = q && q._id && answers && Object.prototype.hasOwnProperty.call(answers, q._id) ? answers[q._id] : undefined;
      const letter = normalizeAnswerToLetter(byIndex !== undefined ? byIndex : byId);
      return s + (letter ? 1 : 0);
    }, 0);
  }, 0);

  const markedCount = Object.values(markedForReview || {}).filter(m => m).length;
  const unattemptedCount = Math.max(0, totalQuestions - answeredCount);

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
                const isMarked = !!markedForReview[questionIndex];
                const rawByIndex = answers && Object.prototype.hasOwnProperty.call(answers, questionIndex) ? answers[questionIndex] : undefined;
                const rawById = question && question._id && answers && Object.prototype.hasOwnProperty.call(answers, question._id) ? answers[question._id] : undefined;
                const answer = normalizeAnswerToLetter(rawByIndex !== undefined ? rawByIndex : rawById);
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
                            onClick={() => handleOptionClick(questionIndex, idx, question._id)}
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