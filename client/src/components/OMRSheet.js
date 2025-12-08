import React, { useEffect, forwardRef } from "react";
import "./OMRSheet.css";

const OMRSheet = forwardRef(
  (
    {
      totalQuestions,
      questions,
      answers,
      markedForReview,
      currentQuestionIndex,
      onQuestionClick,
      onAnswerSelect,
    },
    ref
  ) => {
    // ⭐ AUTO SCROLL OMR ⭐
    useEffect(() => {
      const target = document.getElementById(`omr-question-${currentQuestionIndex}`);
      const container = ref.current;
    
      if (!target || !container) return;
    
      // ⭐ Height of stats + legend (auto-detect)
      const stats = document.querySelector(".omr-stats")?.offsetHeight || 0;
      const legend = document.querySelector(".omr-legend")?.offsetHeight || 0;
      const TOP_BUFFER = stats + legend + 230; // Extra 10px spacing
    
      const newScrollTop = target.offsetTop - TOP_BUFFER;
    
      container.scrollTo({
        top: newScrollTop < 0 ? 0 : newScrollTop,
        behavior: "smooth",
      });
    }, [currentQuestionIndex]);
    
    const physicsQuestions = questions
      .filter((q) => q.subject === "Physics")
      .sort((a, b) => a.questionNumber - b.questionNumber);

    const chemistryQuestions = questions
      .filter((q) => q.subject === "Chemistry")
      .sort((a, b) => a.questionNumber - b.questionNumber);

    const biologyQuestions = questions
      .filter((q) => q.subject === "Biology")
      .sort((a, b) => a.questionNumber - b.questionNumber);

    const sections = [
      { name: "Physics", questions: physicsQuestions, range: "Q1-45" },
      { name: "Chemistry", questions: chemistryQuestions, range: "Q46-90" },
      { name: "Biology", questions: biologyQuestions, range: "Q91-180" },
    ];

    const answeredCount = Object.values(answers).filter(Boolean).length;
    const markedCount = Object.values(markedForReview).filter(Boolean).length;
    const unattemptedCount = totalQuestions - answeredCount;

    return (
      <div className="omr-sheet-container">
        {/* Stats */}
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

        {/* ⭐ OMR Scrollable Container */}
        <div className="omr-sections" ref={ref}>
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

                  return (
                    <div
                      key={questionIndex}
                      id={`omr-question-${questionIndex}`}
                      className={`omr-question-row ${
                        isCurrent ? "current" : ""
                      } ${isMarked ? "marked" : ""}`}
                    >
                      <div
                        className="question-num"
                        onClick={() => onQuestionClick(questionIndex)}
                      >
                        Q{question.questionNumber}
                      </div>

                      <div className="question-options">
                        {["A", "B", "C", "D"].map((option) => (
                          <div
                            key={option}
                            className={`option-bubble-omr ${
                              answer === option ? "selected" : ""
                            }`}
                            onClick={() =>
                              onAnswerSelect(questionIndex, option)
                            }
                          >
                            {option}
                          </div>
                        ))}
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
  }
);

// Ensure the component is correctly exported
export default OMRSheet;
