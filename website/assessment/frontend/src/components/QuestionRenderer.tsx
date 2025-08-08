import React, { useState, useEffect } from 'react'
import { Question, AssessmentResponse } from '../types/assessment'

interface QuestionRendererProps {
  question: Question
  response?: AssessmentResponse
  onResponse: (response: AssessmentResponse) => void
}

const QuestionRenderer: React.FC<QuestionRendererProps> = ({
  question,
  response,
  onResponse
}) => {
  const [startTime] = useState(Date.now())

  const handleResponseChange = (value: string | string[] | number) => {
    const newResponse: AssessmentResponse = {
      questionId: question.id,
      value,
      timestamp: new Date(),
      timeSpent: Date.now() - startTime
    }
    onResponse(newResponse)
  }

  const renderQuestionContent = () => {
    switch (question.type) {
      case 'scale':
        return renderScaleQuestion()
      case 'multiple':
        return renderMultipleChoiceQuestion()
      case 'single':
        return renderSingleChoiceQuestion()
      case 'text':
        return renderTextQuestion()
      case 'scenario':
        return renderScenarioQuestion()
      case 'visual':
        return renderVisualQuestion()
      case 'behavioral':
        return renderBehavioralQuestion()
      default:
        return <div>Unsupported question type</div>
    }
  }

  const renderScaleQuestion = () => {
    if (!question.scale) return null

    const currentValue = typeof response?.value === 'number' ? response.value : null

    return (
      <div className="scale-question">
        <div className="scale-container">
          {Array.from(
            { length: question.scale.max - question.scale.min + 1 },
            (_, index) => {
              const value = question.scale!.min + index
              return (
                <div
                  key={value}
                  className={`scale-option ${currentValue === value ? 'selected' : ''}`}
                  onClick={() => handleResponseChange(value)}
                >
                  <div className="scale-number">{value}</div>
                  <div className="scale-label">
                    {question.scale!.labels[value]}
                  </div>
                </div>
              )
            }
          )}
        </div>
      </div>
    )
  }

  const renderMultipleChoiceQuestion = () => {
    if (!question.options) return null

    const currentValues = Array.isArray(response?.value) ? response.value : []

    const handleCheckboxChange = (optionId: string, checked: boolean) => {
      let newValues: string[]
      if (checked) {
        newValues = [...currentValues, optionId]
      } else {
        newValues = currentValues.filter(v => v !== optionId)
      }
      handleResponseChange(newValues)
    }

    return (
      <div className="multiple-choice-question">
        <div className="options-container">
          {question.options.map(option => (
            <div
              key={option.id}
              className={`option-item ${currentValues.includes(option.id) ? 'selected' : ''}`}
            >
              <label className="option-label">
                <input
                  type="checkbox"
                  checked={currentValues.includes(option.id)}
                  onChange={(e) => handleCheckboxChange(option.id, e.target.checked)}
                />
                <span className="option-text">{option.text}</span>
                <div className="option-indicator">
                  <i className="fas fa-check"></i>
                </div>
              </label>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSingleChoiceQuestion = () => {
    if (!question.options) return null

    const currentValue = typeof response?.value === 'string' ? response.value : null

    return (
      <div className="single-choice-question">
        <div className="options-container">
          {question.options.map(option => (
            <div
              key={option.id}
              className={`option-item ${currentValue === option.id ? 'selected' : ''}`}
              onClick={() => handleResponseChange(option.id)}
            >
              <div className="option-content">
                <div className="option-indicator">
                  <div className="radio-button">
                    {currentValue === option.id && <div className="radio-selected" />}
                  </div>
                </div>
                <span className="option-text">{option.text}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderTextQuestion = () => {
    const currentValue = typeof response?.value === 'string' ? response.value : ''

    return (
      <div className="text-question">
        <textarea
          className="text-input"
          value={currentValue}
          onChange={(e) => handleResponseChange(e.target.value)}
          placeholder="Please share your thoughts..."
          rows={4}
        />
        <div className="character-count">
          {currentValue.length} characters
        </div>
      </div>
    )
  }

  const renderScenarioQuestion = () => {
    if (!question.scenario) return null

    const currentValue = typeof response?.value === 'string' ? response.value : null

    return (
      <div className="scenario-question">
        <div className="scenario-header">
          <h4 className="scenario-title">{question.scenario.title}</h4>
          <p className="scenario-description">{question.scenario.description}</p>
        </div>
        
        <div className="scenario-context">
          <div className="context-box">
            <i className="fas fa-lightbulb"></i>
            <p>{question.scenario.context}</p>
          </div>
        </div>

        <div className="scenario-choices">
          <h5>How would you approach this situation?</h5>
          {question.scenario.choices.map(choice => (
            <div
              key={choice.id}
              className={`scenario-choice ${currentValue === choice.id ? 'selected' : ''}`}
              onClick={() => handleResponseChange(choice.id)}
            >
              <div className="choice-content">
                <div className="choice-indicator">
                  <div className="radio-button">
                    {currentValue === choice.id && <div className="radio-selected" />}
                  </div>
                </div>
                <div className="choice-text">
                  <p className="choice-action">{choice.text}</p>
                  <p className="choice-outcome">{choice.outcome}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderVisualQuestion = () => {
    if (!question.visual) return null

    return (
      <div className="visual-question">
        <div className="visual-container">
          <p>Visual assessment component would be rendered here</p>
          <p>Type: {question.visual.type}</p>
          {/* This would contain the actual visual assessment interface */}
        </div>
      </div>
    )
  }

  const renderBehavioralQuestion = () => {
    return (
      <div className="behavioral-question">
        <div className="behavioral-container">
          <p>Behavioral assessment component would be rendered here</p>
          {/* This would contain engagement tracking and behavioral analysis */}
        </div>
      </div>
    )
  }

  return (
    <div className="question-renderer">
      <div className="question-header">
        <h2 className="question-title">{question.question}</h2>
        {question.description && (
          <p className="question-description">{question.description}</p>
        )}
      </div>

      <div className="question-content">
        {renderQuestionContent()}
      </div>

      {question.type === 'multiple' && (
        <div className="question-hint">
          <i className="fas fa-info-circle"></i>
          <span>Select all that apply</span>
        </div>
      )}
    </div>
  )
}

export default QuestionRenderer