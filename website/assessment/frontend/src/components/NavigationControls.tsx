import React from 'react'

interface NavigationControlsProps {
  canGoBack: boolean
  canGoForward: boolean
  isLastQuestion: boolean
  onPrevious: () => void
  onNext: () => void
  isLoading?: boolean
}

const NavigationControls: React.FC<NavigationControlsProps> = ({
  canGoBack,
  canGoForward,
  isLastQuestion,
  onPrevious,
  onNext,
  isLoading = false
}) => {
  return (
    <div className="navigation-controls">
      <div className="nav-buttons">
        <button
          className="btn btn-outline nav-button"
          onClick={onPrevious}
          disabled={!canGoBack || isLoading}
        >
          <i className="fas fa-arrow-left"></i>
          Previous
        </button>

        <button
          className={`btn ${isLastQuestion ? 'btn-success' : 'btn-primary'} nav-button`}
          onClick={onNext}
          disabled={!canGoForward || isLoading}
        >
          {isLoading ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Processing...
            </>
          ) : isLastQuestion ? (
            <>
              <i className="fas fa-check"></i>
              Complete Assessment
            </>
          ) : (
            <>
              Next
              <i className="fas fa-arrow-right"></i>
            </>
          )}
        </button>
      </div>

      <div className="nav-help">
        {!canGoForward && (
          <div className="help-message">
            <i className="fas fa-info-circle"></i>
            <span>Please answer the question to continue</span>
          </div>
        )}
      </div>

      <div className="keyboard-shortcuts">
        <div className="shortcut-hint">
          <span className="shortcut-key">Enter</span>
          <span className="shortcut-action">Next question</span>
        </div>
        {canGoBack && (
          <div className="shortcut-hint">
            <span className="shortcut-key">Backspace</span>
            <span className="shortcut-action">Previous question</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default NavigationControls