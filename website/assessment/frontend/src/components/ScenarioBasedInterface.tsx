import React, { useState, useEffect } from 'react'
import { AssessmentResponse } from '../types/assessment'

interface BusinessScenario {
  id: string
  title: string
  description: string
  context: string
  industry: string
  complexity: 'low' | 'medium' | 'high'
  timeLimit?: number // in seconds
  decisions: Array<{
    id: string
    phase: string
    question: string
    options: Array<{
      id: string
      text: string
      impact: string
      consequences: string[]
    }>
  }>
}

interface ScenarioBasedInterfaceProps {
  scenario: BusinessScenario
  onResponse: (response: AssessmentResponse) => void
  onComplete: (responses: AssessmentResponse[]) => void
}

const ScenarioBasedInterface: React.FC<ScenarioBasedInterfaceProps> = ({
  scenario,
  onResponse,
  onComplete
}) => {
  const [currentDecision, setCurrentDecision] = useState(0)
  const [responses, setResponses] = useState<AssessmentResponse[]>([])
  const [timeRemaining, setTimeRemaining] = useState(scenario.timeLimit || 0)
  const [selectedChoices, setSelectedChoices] = useState<Record<string, string>>({})
  const [showConsequences, setShowConsequences] = useState(false)

  useEffect(() => {
    if (scenario.timeLimit && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp()
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [timeRemaining, scenario.timeLimit])

  const handleTimeUp = () => {
    // Auto-submit current responses when time runs out
    onComplete(responses)
  }

  const handleChoiceSelect = (decisionId: string, choiceId: string) => {
    const decision = scenario.decisions[currentDecision]
    const choice = decision.options.find(opt => opt.id === choiceId)
    
    if (!choice) return

    const newResponse: AssessmentResponse = {
      questionId: `${scenario.id}_${decisionId}`,
      value: choiceId,
      timestamp: new Date(),
      timeSpent: 0 // This would be calculated based on decision start time
    }

    setSelectedChoices(prev => ({
      ...prev,
      [decisionId]: choiceId
    }))

    setResponses(prev => {
      const updated = [...prev]
      const existingIndex = updated.findIndex(r => r.questionId === newResponse.questionId)
      
      if (existingIndex >= 0) {
        updated[existingIndex] = newResponse
      } else {
        updated.push(newResponse)
      }
      
      return updated
    })

    onResponse(newResponse)
    
    // Show consequences briefly before moving to next decision
    setShowConsequences(true)
    setTimeout(() => {
      setShowConsequences(false)
      if (currentDecision < scenario.decisions.length - 1) {
        setCurrentDecision(prev => prev + 1)
      } else {
        onComplete(responses)
      }
    }, 3000)
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentDecisionData = scenario.decisions[currentDecision]
  const selectedChoice = selectedChoices[currentDecisionData?.id]
  const selectedOption = currentDecisionData?.options.find(opt => opt.id === selectedChoice)

  return (
    <div className="scenario-based-interface">
      <div className="scenario-header">
        <div className="scenario-meta">
          <div className="scenario-industry">
            <i className="fas fa-building"></i>
            <span>{scenario.industry}</span>
          </div>
          <div className={`scenario-complexity complexity-${scenario.complexity}`}>
            <i className="fas fa-layer-group"></i>
            <span>{scenario.complexity} complexity</span>
          </div>
          {scenario.timeLimit && (
            <div className={`scenario-timer ${timeRemaining < 60 ? 'urgent' : ''}`}>
              <i className="fas fa-clock"></i>
              <span>{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>
        
        <h2 className="scenario-title">{scenario.title}</h2>
        <p className="scenario-description">{scenario.description}</p>
      </div>

      <div className="scenario-context">
        <div className="context-card">
          <div className="context-header">
            <i className="fas fa-info-circle"></i>
            <h3>Business Context</h3>
          </div>
          <p>{scenario.context}</p>
        </div>
      </div>

      <div className="scenario-progress">
        <div className="progress-steps">
          {scenario.decisions.map((_, index) => (
            <div
              key={index}
              className={`progress-step ${
                index < currentDecision ? 'completed' : 
                index === currentDecision ? 'current' : 'upcoming'
              }`}
            >
              <div className="step-number">{index + 1}</div>
              <div className="step-label">
                {index < currentDecision ? 'Completed' : 
                 index === currentDecision ? 'Current' : 'Upcoming'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!showConsequences ? (
        <div className="decision-phase">
          <div className="phase-header">
            <h3 className="phase-title">{currentDecisionData.phase}</h3>
            <p className="phase-question">{currentDecisionData.question}</p>
          </div>

          <div className="decision-options">
            {currentDecisionData.options.map(option => (
              <div
                key={option.id}
                className={`decision-option ${selectedChoice === option.id ? 'selected' : ''}`}
                onClick={() => handleChoiceSelect(currentDecisionData.id, option.id)}
              >
                <div className="option-content">
                  <div className="option-header">
                    <div className="option-indicator">
                      <div className="radio-button">
                        {selectedChoice === option.id && <div className="radio-selected" />}
                      </div>
                    </div>
                    <h4 className="option-title">{option.text}</h4>
                  </div>
                  <p className="option-impact">{option.impact}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="decision-help">
            <div className="help-tip">
              <i className="fas fa-lightbulb"></i>
              <span>Consider the long-term strategic implications of your choice</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="consequences-display">
          <div className="consequences-header">
            <i className="fas fa-chart-line"></i>
            <h3>Decision Impact</h3>
          </div>
          
          <div className="selected-choice">
            <h4>Your Choice: {selectedOption?.text}</h4>
            <p className="choice-impact">{selectedOption?.impact}</p>
          </div>

          <div className="consequences-list">
            <h5>Consequences:</h5>
            <ul>
              {selectedOption?.consequences.map((consequence, index) => (
                <li key={index}>{consequence}</li>
              ))}
            </ul>
          </div>

          <div className="loading-next">
            <div className="loading-spinner">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p>Analyzing impact and preparing next decision...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// Sample scenario data
export const sampleScenarios: BusinessScenario[] = [
  {
    id: 'ai_implementation_crisis',
    title: 'AI Implementation Crisis',
    description: 'Your AI pilot project has encountered unexpected challenges that threaten the entire initiative.',
    context: 'Three months into your AI implementation, the system is producing inconsistent results, the team is frustrated, and executives are questioning the investment. You need to make critical decisions to save the project.',
    industry: 'Technology',
    complexity: 'high',
    timeLimit: 300, // 5 minutes
    decisions: [
      {
        id: 'immediate_response',
        phase: 'Crisis Management',
        question: 'What is your immediate response to the crisis?',
        options: [
          {
            id: 'pause_investigate',
            text: 'Pause implementation and conduct thorough investigation',
            impact: 'Reduces immediate risk but may damage stakeholder confidence',
            consequences: [
              'Project timeline extended by 6-8 weeks',
              'Team morale may improve with clear direction',
              'Executive confidence requires rebuilding'
            ]
          },
          {
            id: 'pivot_approach',
            text: 'Pivot to a different AI approach or vendor',
            impact: 'Shows adaptability but increases costs and complexity',
            consequences: [
              'Additional budget required for new solution',
              'Team needs retraining on new platform',
              'Potential for faster results with proven solution'
            ]
          },
          {
            id: 'double_down',
            text: 'Double down with additional resources and expertise',
            impact: 'Demonstrates commitment but increases risk exposure',
            consequences: [
              'Higher financial investment required',
              'Pressure to deliver results intensifies',
              'Potential for breakthrough with focused effort'
            ]
          }
        ]
      },
      {
        id: 'stakeholder_communication',
        phase: 'Stakeholder Management',
        question: 'How do you communicate with stakeholders about the situation?',
        options: [
          {
            id: 'transparent_update',
            text: 'Provide transparent update with detailed recovery plan',
            impact: 'Builds trust through honesty but may increase scrutiny',
            consequences: [
              'Stakeholders appreciate transparency',
              'Increased oversight and reporting requirements',
              'Opportunity to reset expectations realistically'
            ]
          },
          {
            id: 'focus_positives',
            text: 'Focus on positive outcomes and learning opportunities',
            impact: 'Maintains optimism but may seem disconnected from reality',
            consequences: [
              'Short-term confidence preservation',
              'Risk of credibility loss if problems persist',
              'May miss opportunity for stakeholder support'
            ]
          },
          {
            id: 'request_support',
            text: 'Request additional support and resources from leadership',
            impact: 'Shows leadership engagement but may signal project weakness',
            consequences: [
              'Potential for increased budget and resources',
              'Leadership becomes more invested in success',
              'Higher expectations for results and accountability'
            ]
          }
        ]
      }
    ]
  }
]

export default ScenarioBasedInterface