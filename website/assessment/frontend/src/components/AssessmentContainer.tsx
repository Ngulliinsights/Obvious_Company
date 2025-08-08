import React, { useState, useEffect } from 'react'
import { Assessment, AssessmentSession, AssessmentResponse, Question } from '../types/assessment'
import ProgressIndicator from './ProgressIndicator'
import QuestionRenderer from './QuestionRenderer'
import NavigationControls from './NavigationControls'
import ScenarioBasedInterface, { sampleScenarios } from './ScenarioBasedInterface'
import ConversationalInterface from './ConversationalInterface'
import VisualPatternInterface, { sampleVisualTasks } from './VisualPatternInterface'
import BehavioralObservationInterface, { sampleBehavioralTasks } from './BehavioralObservationInterface'
import { assessmentData } from '../data/assessments'

interface AssessmentContainerProps {
  assessmentId?: string
  onComplete?: (results: any) => void
}

type AssessmentModality = 'questionnaire' | 'scenario' | 'conversational' | 'visual' | 'behavioral'

const AssessmentContainer: React.FC<AssessmentContainerProps> = ({ 
  assessmentId = 'strategic-readiness',
  onComplete 
}) => {
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [session, setSession] = useState<AssessmentSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedModality, setSelectedModality] = useState<AssessmentModality | null>(null)
  const [showModalitySelector, setShowModalitySelector] = useState(true)

  useEffect(() => {
    initializeAssessment()
  }, [assessmentId])

  const initializeAssessment = async () => {
    try {
      setIsLoading(true)
      
      // Get assessment data
      const assessmentData = getAssessmentById(assessmentId)
      if (!assessmentData) {
        throw new Error('Assessment not found')
      }

      setAssessment(assessmentData)

      // Create new session
      const newSession: AssessmentSession = {
        id: generateSessionId(),
        assessmentId,
        currentQuestionIndex: 0,
        responses: [],
        startTime: new Date(),
        status: 'in_progress'
      }

      setSession(newSession)
      setCurrentQuestion(assessmentData.questions[0])
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize assessment')
      setIsLoading(false)
    }
  }

  const getAssessmentById = (id: string): Assessment | null => {
    return assessmentData.find(a => a.id === id) || null
  }

  const generateSessionId = (): string => {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const handleResponse = (response: AssessmentResponse) => {
    if (!session || !assessment) return

    const updatedResponses = [...session.responses]
    const existingIndex = updatedResponses.findIndex(r => r.questionId === response.questionId)
    
    if (existingIndex >= 0) {
      updatedResponses[existingIndex] = response
    } else {
      updatedResponses.push(response)
    }

    setSession({
      ...session,
      responses: updatedResponses
    })
  }

  const navigateToQuestion = (index: number) => {
    if (!assessment || index < 0 || index >= assessment.questions.length) return

    setSession(prev => prev ? { ...prev, currentQuestionIndex: index } : null)
    setCurrentQuestion(assessment.questions[index])
  }

  const handleNext = () => {
    if (!session || !assessment) return

    const nextIndex = session.currentQuestionIndex + 1
    
    if (nextIndex >= assessment.questions.length) {
      completeAssessment()
    } else {
      navigateToQuestion(nextIndex)
    }
  }

  const handlePrevious = () => {
    if (!session) return
    
    const prevIndex = session.currentQuestionIndex - 1
    if (prevIndex >= 0) {
      navigateToQuestion(prevIndex)
    }
  }

  const completeAssessment = async () => {
    if (!session) return

    try {
      const completedSession = {
        ...session,
        status: 'completed' as const
      }

      setSession(completedSession)

      // Calculate results (this would typically be done on the server)
      const results = await calculateResults(completedSession)
      
      if (onComplete) {
        onComplete(results)
      }
    } catch (err) {
      setError('Failed to complete assessment')
    }
  }

  const calculateResults = async (session: AssessmentSession) => {
    // This is a simplified calculation - in a real app, this would be done on the server
    const personas = ['Strategic Architect', 'Strategic Catalyst', 'Strategic Contributor', 'Strategic Explorer', 'Strategic Observer']
    const industries = ['Financial Services', 'Manufacturing', 'Healthcare', 'Government', 'Technology', 'Professional Services']
    
    return {
      sessionId: session.id,
      overallScore: Math.floor(Math.random() * 40) + 60, // 60-100 range for demo
      dimensionScores: {
        strategicAuthority: Math.floor(Math.random() * 40) + 60,
        organizationalInfluence: Math.floor(Math.random() * 40) + 50,
        resourceAvailability: Math.floor(Math.random() * 40) + 70,
        implementationReadiness: Math.floor(Math.random() * 40) + 55,
        culturalAlignment: Math.floor(Math.random() * 40) + 65
      },
      personaClassification: {
        primary: personas[Math.floor(Math.random() * personas.length)],
        confidence: Math.random() * 0.3 + 0.7, // 0.7-1.0 range
        characteristics: [
          'Strategic thinking capability',
          'Change leadership potential',
          'Resource optimization focus'
        ]
      },
      industryInsights: {
        sector: industries[Math.floor(Math.random() * industries.length)],
        readiness: Math.floor(Math.random() * 40) + 60,
        recommendations: [
          'Focus on strategic intelligence amplification over simple automation',
          'Develop cross-functional AI integration capabilities',
          'Establish governance frameworks for responsible AI implementation',
          'Build organizational change management capacity'
        ]
      },
      actionPlan: {
        nextSteps: [
          'Schedule strategic consultation to review assessment results',
          'Identify immediate quick-win opportunities for AI integration',
          'Develop 90-day pilot program based on highest-scoring dimensions',
          'Establish success metrics and measurement frameworks'
        ],
        timeline: '6-12 months for comprehensive strategic implementation',
        resources: [
          'Strategic AI Leadership Program',
          'Industry-specific implementation guide',
          'Change management toolkit',
          'ROI measurement framework'
        ]
      }
    }
  }

  const getCurrentResponse = (): AssessmentResponse | undefined => {
    if (!session || !currentQuestion) return undefined
    return session.responses.find(r => r.questionId === currentQuestion.id)
  }

  const isCurrentQuestionAnswered = (): boolean => {
    const response = getCurrentResponse()
    return response !== undefined && (
      (typeof response.value === 'string' && response.value.length > 0) ||
      (Array.isArray(response.value) && response.value.length > 0) ||
      (typeof response.value === 'number')
    )
  }

  const handleModalitySelect = (modality: AssessmentModality) => {
    setSelectedModality(modality)
    setShowModalitySelector(false)
  }

  const handleAlternativeComplete = (results: any) => {
    // Process results from alternative modalities
    if (onComplete) {
      onComplete(results)
    }
  }

  const renderModalitySelector = () => {
    const modalities = [
      {
        id: 'questionnaire' as AssessmentModality,
        title: 'Traditional Questionnaire',
        description: 'Structured questions with multiple choice and scale responses',
        icon: 'fas fa-list-ul',
        duration: '10-15 minutes',
        features: ['Comprehensive coverage', 'Easy to complete', 'Standardized scoring']
      },
      {
        id: 'scenario' as AssessmentModality,
        title: 'Interactive Business Scenarios',
        description: 'Real-world business situations requiring strategic decisions',
        icon: 'fas fa-briefcase',
        duration: '15-20 minutes',
        features: ['Realistic contexts', 'Decision-making focus', 'Immediate feedback']
      },
      {
        id: 'conversational' as AssessmentModality,
        title: 'AI-Powered Conversation',
        description: 'Natural dialogue with an AI strategic advisor',
        icon: 'fas fa-comments',
        duration: '10-15 minutes',
        features: ['Natural interaction', 'Adaptive questioning', 'Voice input support']
      },
      {
        id: 'visual' as AssessmentModality,
        title: 'Visual Pattern Recognition',
        description: 'Analyze workflows and identify optimization opportunities',
        icon: 'fas fa-project-diagram',
        duration: '15-25 minutes',
        features: ['Visual thinking', 'Pattern analysis', 'Strategic insights']
      },
      {
        id: 'behavioral' as AssessmentModality,
        title: 'Behavioral Observation',
        description: 'Assessment through interaction patterns and decision timing',
        icon: 'fas fa-eye',
        duration: '20-30 minutes',
        features: ['Behavioral analysis', 'Engagement tracking', 'Decision patterns']
      }
    ]

    return (
      <div className="modality-selector">
        <div className="selector-header">
          <h2>Choose Your Assessment Approach</h2>
          <p>Select the assessment method that best matches your preferred learning and interaction style.</p>
        </div>
        
        <div className="modality-grid">
          {modalities.map(modality => (
            <div
              key={modality.id}
              className="modality-card"
              onClick={() => handleModalitySelect(modality.id)}
            >
              <div className="modality-icon">
                <i className={modality.icon}></i>
              </div>
              <div className="modality-content">
                <h3 className="modality-title">{modality.title}</h3>
                <p className="modality-description">{modality.description}</p>
                <div className="modality-duration">
                  <i className="fas fa-clock"></i>
                  <span>{modality.duration}</span>
                </div>
                <div className="modality-features">
                  {modality.features.map((feature, index) => (
                    <div key={index} className="feature-item">
                      <i className="fas fa-check"></i>
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modality-action">
                <span>Start Assessment</span>
                <i className="fas fa-arrow-right"></i>
              </div>
            </div>
          ))}
        </div>
        
        <div className="selector-help">
          <div className="help-tip">
            <i className="fas fa-lightbulb"></i>
            <span>Not sure which approach to choose? The traditional questionnaire provides the most comprehensive baseline assessment.</span>
          </div>
        </div>
      </div>
    )
  }

  const renderAlternativeInterface = () => {
    switch (selectedModality) {
      case 'scenario':
        return (
          <ScenarioBasedInterface
            scenario={sampleScenarios[0]}
            onResponse={handleResponse}
            onComplete={handleAlternativeComplete}
          />
        )
      case 'conversational':
        return (
          <ConversationalInterface
            assessmentId={assessmentId}
            onResponse={handleResponse}
            onComplete={handleAlternativeComplete}
          />
        )
      case 'visual':
        return (
          <VisualPatternInterface
            task={sampleVisualTasks[0]}
            onResponse={handleResponse}
            onComplete={handleAlternativeComplete}
          />
        )
      case 'behavioral':
        return (
          <BehavioralObservationInterface
            task={sampleBehavioralTasks[0]}
            onResponse={handleResponse}
            onComplete={handleAlternativeComplete}
          />
        )
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="assessment-container loading">
        <div className="loading-spinner">
          <i className="fas fa-spinner fa-spin"></i>
          <p>Loading assessment...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="assessment-container error">
        <div className="error-message">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>Assessment Error</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={initializeAssessment}>
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // Show modality selector if no modality is selected
  if (showModalitySelector) {
    return (
      <div className="assessment-container">
        {renderModalitySelector()}
      </div>
    )
  }

  // Show alternative interface if selected
  if (selectedModality && selectedModality !== 'questionnaire') {
    return (
      <div className="assessment-container">
        <div className="assessment-header">
          <div className="modality-info">
            <button 
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setShowModalitySelector(true)}
            >
              <i className="fas fa-arrow-left"></i>
              Change Assessment Type
            </button>
            <div className="current-modality">
              <span>Assessment Mode: </span>
              <strong>{selectedModality.charAt(0).toUpperCase() + selectedModality.slice(1)}</strong>
            </div>
          </div>
        </div>
        
        <div className="alternative-interface">
          {renderAlternativeInterface()}
        </div>
      </div>
    )
  }

  // Traditional questionnaire interface
  if (!assessment || !session || !currentQuestion) {
    return (
      <div className="assessment-container error">
        <div className="error-message">
          <p>Assessment data not available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="assessment-container">
      <div className="assessment-header">
        <div className="modality-info">
          <button 
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setShowModalitySelector(true)}
          >
            <i className="fas fa-arrow-left"></i>
            Change Assessment Type
          </button>
          <div className="current-modality">
            <span>Assessment Mode: </span>
            <strong>Traditional Questionnaire</strong>
          </div>
        </div>
        <h1 className="assessment-title">{assessment.title}</h1>
        <p className="assessment-description">{assessment.description}</p>
      </div>

      <ProgressIndicator
        currentQuestion={session.currentQuestionIndex + 1}
        totalQuestions={assessment.questions.length}
        progress={(session.currentQuestionIndex + 1) / assessment.questions.length * 100}
      />

      <div className="assessment-content">
        <QuestionRenderer
          question={currentQuestion}
          response={getCurrentResponse()}
          onResponse={handleResponse}
        />
      </div>

      <NavigationControls
        canGoBack={session.currentQuestionIndex > 0}
        canGoForward={isCurrentQuestionAnswered()}
        isLastQuestion={session.currentQuestionIndex === assessment.questions.length - 1}
        onPrevious={handlePrevious}
        onNext={handleNext}
      />
    </div>
  )
}

export default AssessmentContainer