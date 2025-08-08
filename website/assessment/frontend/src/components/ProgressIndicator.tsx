import React from 'react'

interface ProgressIndicatorProps {
  currentQuestion: number
  totalQuestions: number
  progress: number
  showSteps?: boolean
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentQuestion,
  totalQuestions,
  progress,
  showSteps = false
}) => {
  return (
    <div className="progress-indicator">
      <div className="progress-header">
        <div className="progress-text">
          <span className="current-step">Question {currentQuestion}</span>
          <span className="total-steps">of {totalQuestions}</span>
        </div>
        <div className="progress-percentage">
          {Math.round(progress)}%
        </div>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {showSteps && (
        <div className="progress-steps">
          {Array.from({ length: totalQuestions }, (_, index) => (
            <div
              key={index}
              className={`progress-step ${
                index < currentQuestion - 1 ? 'completed' : 
                index === currentQuestion - 1 ? 'current' : 'upcoming'
              }`}
            >
              <div className="step-indicator">
                {index < currentQuestion - 1 ? (
                  <i className="fas fa-check"></i>
                ) : (
                  <span>{index + 1}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="progress-estimate">
        <i className="fas fa-clock"></i>
        <span>
          {Math.ceil((totalQuestions - currentQuestion + 1) * 1.5)} min remaining
        </span>
      </div>
    </div>
  )
}

export default ProgressIndicator