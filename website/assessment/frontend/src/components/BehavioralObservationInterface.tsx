import React, { useState, useEffect, useRef } from 'react'
import { AssessmentResponse } from '../types/assessment'

interface BehavioralMetrics {
  timeSpent: number
  clickPatterns: Array<{ timestamp: number; element: string; position: { x: number; y: number } }>
  scrollBehavior: Array<{ timestamp: number; scrollY: number; direction: 'up' | 'down' }>
  focusPatterns: Array<{ timestamp: number; element: string; duration: number }>
  responseLatency: Array<{ questionId: string; latency: number }>
  engagementLevel: number
  attentionSpan: number
  decisionSpeed: number
  explorationDepth: number
}

interface BehavioralTask {
  id: string
  title: string
  description: string
  instructions: string
  duration: number // in seconds
  tasks: Array<{
    id: string
    type: 'attention' | 'decision' | 'exploration' | 'prioritization'
    prompt: string
    elements: any[]
    expectedBehavior: string[]
  }>
}

interface BehavioralObservationInterfaceProps {
  task: BehavioralTask
  onResponse: (response: AssessmentResponse) => void
  onComplete: (behavioralProfile: any) => void
}

const BehavioralObservationInterface: React.FC<BehavioralObservationInterfaceProps> = ({
  task,
  onResponse,
  onComplete
}) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0)
  const [metrics, setMetrics] = useState<BehavioralMetrics>({
    timeSpent: 0,
    clickPatterns: [],
    scrollBehavior: [],
    focusPatterns: [],
    responseLatency: [],
    engagementLevel: 0,
    attentionSpan: 0,
    decisionSpeed: 0,
    explorationDepth: 0
  })
  const [startTime] = useState(Date.now())
  const [taskStartTime, setTaskStartTime] = useState(Date.now())
  const [isTracking, setIsTracking] = useState(true)
  const [currentFocus, setCurrentFocus] = useState<string | null>(null)
  const [focusStartTime, setFocusStartTime] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const mousePositionRef = useRef({ x: 0, y: 0 })

  useEffect(() => {
    if (!isTracking) return

    const trackMouseMovement = (e: MouseEvent) => {
      mousePositionRef.current = { x: e.clientX, y: e.clientY }
    }

    const trackClicks = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const elementId = target.id || target.className || target.tagName
      
      setMetrics(prev => ({
        ...prev,
        clickPatterns: [...prev.clickPatterns, {
          timestamp: Date.now() - startTime,
          element: elementId,
          position: { x: e.clientX, y: e.clientY }
        }]
      }))
    }

    const trackScroll = () => {
      const scrollY = window.scrollY
      const lastScroll = metrics.scrollBehavior[metrics.scrollBehavior.length - 1]
      const direction = lastScroll && scrollY > lastScroll.scrollY ? 'down' : 'up'
      
      setMetrics(prev => ({
        ...prev,
        scrollBehavior: [...prev.scrollBehavior, {
          timestamp: Date.now() - startTime,
          scrollY,
          direction
        }]
      }))
    }

    const trackFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      const elementId = target.id || target.className || target.tagName
      
      if (currentFocus && focusStartTime) {
        // Record the previous focus duration
        setMetrics(prev => ({
          ...prev,
          focusPatterns: [...prev.focusPatterns, {
            timestamp: focusStartTime - startTime,
            element: currentFocus,
            duration: Date.now() - focusStartTime
          }]
        }))
      }
      
      setCurrentFocus(elementId)
      setFocusStartTime(Date.now())
    }

    document.addEventListener('mousemove', trackMouseMovement)
    document.addEventListener('click', trackClicks)
    document.addEventListener('scroll', trackScroll)
    document.addEventListener('focusin', trackFocus)

    return () => {
      document.removeEventListener('mousemove', trackMouseMovement)
      document.removeEventListener('click', trackClicks)
      document.removeEventListener('scroll', trackScroll)
      document.removeEventListener('focusin', trackFocus)
    }
  }, [isTracking, currentFocus, focusStartTime, startTime, metrics.scrollBehavior])

  useEffect(() => {
    // Update time spent every second
    const timer = setInterval(() => {
      setMetrics(prev => ({
        ...prev,
        timeSpent: Date.now() - startTime
      }))
    }, 1000)

    return () => clearInterval(timer)
  }, [startTime])

  const handleTaskResponse = (response: any) => {
    const responseTime = Date.now() - taskStartTime
    
    // Record response latency
    setMetrics(prev => ({
      ...prev,
      responseLatency: [...prev.responseLatency, {
        questionId: task.tasks[currentTaskIndex].id,
        latency: responseTime
      }]
    }))

    // Create assessment response
    const assessmentResponse: AssessmentResponse = {
      questionId: `behavioral_${task.tasks[currentTaskIndex].id}`,
      value: JSON.stringify(response),
      timestamp: new Date(),
      timeSpent: responseTime
    }

    onResponse(assessmentResponse)

    // Move to next task or complete
    if (currentTaskIndex < task.tasks.length - 1) {
      setCurrentTaskIndex(prev => prev + 1)
      setTaskStartTime(Date.now())
    } else {
      completeAssessment()
    }
  }

  const completeAssessment = () => {
    setIsTracking(false)
    
    const behavioralProfile = analyzeBehavioralPatterns(metrics)
    onComplete(behavioralProfile)
  }

  const analyzeBehavioralPatterns = (metrics: BehavioralMetrics) => {
    // Calculate engagement level based on interaction patterns
    const engagementLevel = calculateEngagementLevel(metrics)
    
    // Calculate attention span based on focus patterns
    const attentionSpan = calculateAttentionSpan(metrics)
    
    // Calculate decision speed based on response latency
    const decisionSpeed = calculateDecisionSpeed(metrics)
    
    // Calculate exploration depth based on click and scroll patterns
    const explorationDepth = calculateExplorationDepth(metrics)

    return {
      engagementLevel,
      attentionSpan,
      decisionSpeed,
      explorationDepth,
      behavioralType: classifyBehavioralType(engagementLevel, attentionSpan, decisionSpeed, explorationDepth),
      detailedMetrics: metrics,
      insights: generateBehavioralInsights(metrics)
    }
  }

  const calculateEngagementLevel = (metrics: BehavioralMetrics): number => {
    const clicksPerMinute = (metrics.clickPatterns.length / (metrics.timeSpent / 60000)) || 0
    const scrollActivity = metrics.scrollBehavior.length
    const focusChanges = metrics.focusPatterns.length
    
    // Normalize and combine metrics (0-100 scale)
    const clickScore = Math.min(clicksPerMinute * 10, 40)
    const scrollScore = Math.min(scrollActivity * 2, 30)
    const focusScore = Math.min(focusChanges * 3, 30)
    
    return Math.round(clickScore + scrollScore + focusScore)
  }

  const calculateAttentionSpan = (metrics: BehavioralMetrics): number => {
    if (metrics.focusPatterns.length === 0) return 50
    
    const averageFocusDuration = metrics.focusPatterns.reduce((sum, pattern) => sum + pattern.duration, 0) / metrics.focusPatterns.length
    
    // Convert to 0-100 scale (longer focus = higher score)
    return Math.min(Math.round(averageFocusDuration / 1000 * 10), 100)
  }

  const calculateDecisionSpeed = (metrics: BehavioralMetrics): number => {
    if (metrics.responseLatency.length === 0) return 50
    
    const averageLatency = metrics.responseLatency.reduce((sum, response) => sum + response.latency, 0) / metrics.responseLatency.length
    
    // Convert to 0-100 scale (faster decisions = higher score, but not too fast)
    const optimalRange = 15000 // 15 seconds
    const score = Math.max(0, 100 - Math.abs(averageLatency - optimalRange) / 1000)
    
    return Math.round(score)
  }

  const calculateExplorationDepth = (metrics: BehavioralMetrics): number => {
    const uniqueElements = new Set(metrics.clickPatterns.map(click => click.element)).size
    const scrollRange = metrics.scrollBehavior.length > 0 ? 
      Math.max(...metrics.scrollBehavior.map(s => s.scrollY)) - Math.min(...metrics.scrollBehavior.map(s => s.scrollY)) : 0
    
    // Combine unique interactions and scroll exploration
    const elementScore = Math.min(uniqueElements * 10, 60)
    const scrollScore = Math.min(scrollRange / 100, 40)
    
    return Math.round(elementScore + scrollScore)
  }

  const classifyBehavioralType = (engagement: number, attention: number, speed: number, exploration: number): string => {
    if (engagement > 70 && attention > 70) return 'Deep Analyzer'
    if (speed > 80 && exploration < 40) return 'Quick Decider'
    if (exploration > 80 && attention > 60) return 'Thorough Explorer'
    if (engagement < 40 && speed < 40) return 'Cautious Observer'
    return 'Balanced Processor'
  }

  const generateBehavioralInsights = (metrics: BehavioralMetrics): string[] => {
    const insights = []
    
    if (metrics.clickPatterns.length > 20) {
      insights.push('Shows high interaction engagement with interface elements')
    }
    
    if (metrics.focusPatterns.some(p => p.duration > 30000)) {
      insights.push('Demonstrates sustained attention on complex elements')
    }
    
    if (metrics.responseLatency.every(r => r.latency < 10000)) {
      insights.push('Exhibits quick decision-making patterns')
    }
    
    if (metrics.scrollBehavior.length > 50) {
      insights.push('Shows thorough exploration of available information')
    }
    
    return insights
  }

  const renderCurrentTask = () => {
    const currentTask = task.tasks[currentTaskIndex]
    
    switch (currentTask.type) {
      case 'attention':
        return renderAttentionTask(currentTask)
      case 'decision':
        return renderDecisionTask(currentTask)
      case 'exploration':
        return renderExplorationTask(currentTask)
      case 'prioritization':
        return renderPrioritizationTask(currentTask)
      default:
        return <div>Unknown task type</div>
    }
  }

  const renderAttentionTask = (taskData: any) => {
    return (
      <div className="attention-task">
        <h3>{taskData.prompt}</h3>
        <div className="attention-elements">
          {taskData.elements.map((element: any, index: number) => (
            <div
              key={index}
              className="attention-element"
              id={`attention-element-${index}`}
              onClick={() => handleTaskResponse({ selectedElement: index, type: 'attention' })}
            >
              <div className="element-content">
                <i className={element.icon}></i>
                <span>{element.text}</span>
              </div>
              {element.highlight && (
                <div className="element-highlight">
                  <i className="fas fa-star"></i>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderDecisionTask = (taskData: any) => {
    return (
      <div className="decision-task">
        <h3>{taskData.prompt}</h3>
        <div className="decision-options">
          {taskData.elements.map((option: any, index: number) => (
            <div
              key={index}
              className="decision-option"
              id={`decision-option-${index}`}
              onClick={() => handleTaskResponse({ selectedOption: index, type: 'decision' })}
            >
              <div className="option-header">
                <h4>{option.title}</h4>
                <div className="option-metadata">
                  <span className="risk-level">Risk: {option.risk}</span>
                  <span className="impact-level">Impact: {option.impact}</span>
                </div>
              </div>
              <p className="option-description">{option.description}</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderExplorationTask = (taskData: any) => {
    return (
      <div className="exploration-task">
        <h3>{taskData.prompt}</h3>
        <div className="exploration-area">
          {taskData.elements.map((area: any, index: number) => (
            <div
              key={index}
              className="exploration-area-item"
              id={`exploration-area-${index}`}
            >
              <div className="area-header">
                <i className={area.icon}></i>
                <h4>{area.title}</h4>
              </div>
              <div className="area-content">
                <p>{area.description}</p>
                <div className="area-details">
                  {area.details.map((detail: string, detailIndex: number) => (
                    <div key={detailIndex} className="detail-item">
                      <i className="fas fa-chevron-right"></i>
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleTaskResponse({ type: 'exploration', completed: true })}
        >
          Complete Exploration
        </button>
      </div>
    )
  }

  const renderPrioritizationTask = (taskData: any) => {
    const [priorities, setPriorities] = useState<number[]>([])
    
    const handlePriorityChange = (index: number, priority: number) => {
      const newPriorities = [...priorities]
      newPriorities[index] = priority
      setPriorities(newPriorities)
    }
    
    return (
      <div className="prioritization-task">
        <h3>{taskData.prompt}</h3>
        <div className="prioritization-items">
          {taskData.elements.map((item: any, index: number) => (
            <div
              key={index}
              className="prioritization-item"
              id={`priority-item-${index}`}
            >
              <div className="item-content">
                <h4>{item.title}</h4>
                <p>{item.description}</p>
              </div>
              <div className="priority-selector">
                <label htmlFor={`priority-${index}`}>Priority:</label>
                <select
                  id={`priority-${index}`}
                  value={priorities[index] || ''}
                  onChange={(e) => handlePriorityChange(index, parseInt(e.target.value))}
                >
                  <option value="">Select...</option>
                  <option value="1">High</option>
                  <option value="2">Medium</option>
                  <option value="3">Low</option>
                </select>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleTaskResponse({ type: 'prioritization', priorities })}
          disabled={priorities.length !== taskData.elements.length}
        >
          Submit Priorities
        </button>
      </div>
    )
  }

  return (
    <div className="behavioral-observation-interface" ref={containerRef}>
      <div className="interface-header">
        <div className="task-info">
          <h2>{task.title}</h2>
          <p>{task.description}</p>
          <div className="task-instructions">
            <i className="fas fa-info-circle"></i>
            <span>{task.instructions}</span>
          </div>
        </div>
        
        <div className="behavioral-metrics">
          <div className="metric">
            <span className="metric-label">Time:</span>
            <span className="metric-value">{Math.round(metrics.timeSpent / 1000)}s</span>
          </div>
          <div className="metric">
            <span className="metric-label">Interactions:</span>
            <span className="metric-value">{metrics.clickPatterns.length}</span>
          </div>
          <div className="metric">
            <span className="metric-label">Task:</span>
            <span className="metric-value">{currentTaskIndex + 1}/{task.tasks.length}</span>
          </div>
        </div>
      </div>

      <div className="task-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${((currentTaskIndex + 1) / task.tasks.length) * 100}%` }}
          />
        </div>
        <div className="progress-text">
          Task {currentTaskIndex + 1} of {task.tasks.length}
        </div>
      </div>

      <div className="task-content">
        {renderCurrentTask()}
      </div>

      <div className="behavioral-indicators">
        <div className="indicator">
          <i className="fas fa-eye"></i>
          <span>Tracking engagement patterns</span>
        </div>
        <div className="indicator">
          <i className="fas fa-mouse-pointer"></i>
          <span>Analyzing interaction behavior</span>
        </div>
        <div className="indicator">
          <i className="fas fa-clock"></i>
          <span>Measuring decision timing</span>
        </div>
      </div>
    </div>
  )
}

// Sample behavioral task
export const sampleBehavioralTasks: BehavioralTask[] = [
  {
    id: 'strategic_decision_behavior',
    title: 'Strategic Decision-Making Behavior',
    description: 'This assessment observes how you approach strategic decisions through your interaction patterns',
    instructions: 'Complete the tasks naturally - we\'re observing your decision-making patterns, not testing for right answers',
    duration: 300, // 5 minutes
    tasks: [
      {
        id: 'attention_priorities',
        type: 'attention',
        prompt: 'Which of these strategic elements would you focus on first?',
        elements: [
          { icon: 'fas fa-chart-line', text: 'Market Analysis', highlight: false },
          { icon: 'fas fa-users', text: 'Team Capabilities', highlight: true },
          { icon: 'fas fa-dollar-sign', text: 'Financial Resources', highlight: false },
          { icon: 'fas fa-cogs', text: 'Technology Infrastructure', highlight: false },
          { icon: 'fas fa-lightbulb', text: 'Innovation Opportunities', highlight: true }
        ],
        expectedBehavior: ['Focus on highlighted elements', 'Quick initial scan', 'Deliberate selection']
      },
      {
        id: 'risk_decision',
        type: 'decision',
        prompt: 'Your organization faces a strategic AI implementation decision. Choose your approach:',
        elements: [
          {
            title: 'Conservative Approach',
            description: 'Start with small pilot projects and gradual expansion',
            risk: 'Low',
            impact: 'Medium'
          },
          {
            title: 'Aggressive Approach',
            description: 'Full-scale implementation across multiple departments',
            risk: 'High',
            impact: 'High'
          },
          {
            title: 'Balanced Approach',
            description: 'Strategic implementation in key areas with measured expansion',
            risk: 'Medium',
            impact: 'High'
          }
        ],
        expectedBehavior: ['Careful consideration of risk/impact', 'Reading all options', 'Thoughtful selection']
      }
    ]
  }
]

export default BehavioralObservationInterface