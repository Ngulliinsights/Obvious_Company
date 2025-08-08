import React, { useState, useRef, useEffect } from 'react'
import { AssessmentResponse } from '../types/assessment'

interface WorkflowElement {
  id: string
  type: 'process' | 'decision' | 'data' | 'system' | 'person'
  label: string
  position: { x: number; y: number }
  connections: string[]
  metadata?: {
    efficiency?: number
    automation_potential?: number
    strategic_value?: number
  }
}

interface PatternRecognitionTask {
  id: string
  title: string
  description: string
  type: 'workflow_optimization' | 'pattern_identification' | 'system_design'
  elements: WorkflowElement[]
  instructions: string
  expectedInsights: string[]
}

interface VisualPatternInterfaceProps {
  task: PatternRecognitionTask
  onResponse: (response: AssessmentResponse) => void
  onComplete: (insights: any) => void
}

const VisualPatternInterface: React.FC<VisualPatternInterfaceProps> = ({
  task,
  onResponse,
  onComplete
}) => {
  const [selectedElements, setSelectedElements] = useState<string[]>([])
  const [connections, setConnections] = useState<Array<{ from: string; to: string }>>([])
  const [annotations, setAnnotations] = useState<Record<string, string>>({})
  const [currentMode, setCurrentMode] = useState<'select' | 'connect' | 'annotate'>('select')
  const [draggedElement, setDraggedElement] = useState<string | null>(null)
  const [insights, setInsights] = useState<any>({})
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setCanvasSize({ width: rect.width, height: rect.height })
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  const handleElementClick = (elementId: string) => {
    switch (currentMode) {
      case 'select':
        handleElementSelect(elementId)
        break
      case 'connect':
        handleElementConnect(elementId)
        break
      case 'annotate':
        handleElementAnnotate(elementId)
        break
    }
  }

  const handleElementSelect = (elementId: string) => {
    setSelectedElements(prev => {
      const isSelected = prev.includes(elementId)
      const newSelection = isSelected 
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
      
      // Generate insights based on selection
      const element = task.elements.find(e => e.id === elementId)
      if (element && !isSelected) {
        analyzeElementSelection(element)
      }
      
      return newSelection
    })
  }

  const handleElementConnect = (elementId: string) => {
    // Implementation for connecting elements
    // This would handle creating connections between workflow elements
  }

  const handleElementAnnotate = (elementId: string) => {
    const annotation = prompt('Add your insight about this element:')
    if (annotation) {
      setAnnotations(prev => ({
        ...prev,
        [elementId]: annotation
      }))
      
      // Create assessment response for annotation
      const response: AssessmentResponse = {
        questionId: `annotation_${elementId}`,
        value: annotation,
        timestamp: new Date(),
        timeSpent: 0
      }
      onResponse(response)
    }
  }

  const analyzeElementSelection = (element: WorkflowElement) => {
    // Analyze the strategic thinking behind element selection
    const analysis = {
      elementType: element.type,
      strategicValue: element.metadata?.strategic_value || 0,
      automationPotential: element.metadata?.automation_potential || 0,
      selectionReasoning: inferSelectionReasoning(element)
    }
    
    setInsights(prev => ({
      ...prev,
      selections: [...(prev.selections || []), analysis]
    }))
  }

  const inferSelectionReasoning = (element: WorkflowElement): string => {
    if (element.metadata?.automation_potential && element.metadata.automation_potential > 0.7) {
      return 'high_automation_potential'
    }
    if (element.metadata?.strategic_value && element.metadata.strategic_value > 0.8) {
      return 'strategic_importance'
    }
    if (element.type === 'decision') {
      return 'decision_point_focus'
    }
    return 'general_interest'
  }

  const getElementIcon = (type: string): string => {
    switch (type) {
      case 'process': return 'fas fa-cogs'
      case 'decision': return 'fas fa-code-branch'
      case 'data': return 'fas fa-database'
      case 'system': return 'fas fa-server'
      case 'person': return 'fas fa-user'
      default: return 'fas fa-circle'
    }
  }

  const getElementColor = (element: WorkflowElement): string => {
    if (selectedElements.includes(element.id)) {
      return 'var(--clarity-blue)'
    }
    
    switch (element.type) {
      case 'process': return 'var(--insight-green)'
      case 'decision': return 'var(--energy-amber)'
      case 'data': return 'var(--clarity-blue)'
      case 'system': return 'var(--calm-gray)'
      case 'person': return '#e74c3c'
      default: return 'var(--calm-gray)'
    }
  }

  const handleCompleteAnalysis = () => {
    const finalInsights = {
      selectedElements: selectedElements.map(id => {
        const element = task.elements.find(e => e.id === id)
        return {
          id,
          type: element?.type,
          strategicReasoning: inferSelectionReasoning(element!)
        }
      }),
      annotations,
      connections,
      patternRecognitionScore: calculatePatternRecognitionScore(),
      strategicThinkingProfile: generateStrategicProfile()
    }
    
    onComplete(finalInsights)
  }

  const calculatePatternRecognitionScore = (): number => {
    // Calculate score based on how well the user identified key patterns
    let score = 0
    
    // Points for selecting high-value elements
    selectedElements.forEach(elementId => {
      const element = task.elements.find(e => e.id === elementId)
      if (element?.metadata?.strategic_value) {
        score += element.metadata.strategic_value * 20
      }
    })
    
    // Points for annotations
    score += Object.keys(annotations).length * 10
    
    return Math.min(100, score)
  }

  const generateStrategicProfile = () => {
    const profile = {
      focusAreas: [] as string[],
      thinkingStyle: 'analytical',
      automationOrientation: 'moderate'
    }
    
    // Analyze focus areas based on selections
    const typeCount = selectedElements.reduce((acc, elementId) => {
      const element = task.elements.find(e => e.id === elementId)
      if (element) {
        acc[element.type] = (acc[element.type] || 0) + 1
      }
      return acc
    }, {} as Record<string, number>)
    
    profile.focusAreas = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type)
    
    return profile
  }

  return (
    <div className="visual-pattern-interface">
      <div className="interface-header">
        <div className="task-info">
          <h2 className="task-title">{task.title}</h2>
          <p className="task-description">{task.description}</p>
          <div className="task-instructions">
            <i className="fas fa-info-circle"></i>
            <span>{task.instructions}</span>
          </div>
        </div>
        
        <div className="interface-controls">
          <div className="mode-selector">
            <button
              type="button"
              className={`mode-button ${currentMode === 'select' ? 'active' : ''}`}
              onClick={() => setCurrentMode('select')}
            >
              <i className="fas fa-mouse-pointer"></i>
              Select
            </button>
            <button
              type="button"
              className={`mode-button ${currentMode === 'connect' ? 'active' : ''}`}
              onClick={() => setCurrentMode('connect')}
            >
              <i className="fas fa-link"></i>
              Connect
            </button>
            <button
              type="button"
              className={`mode-button ${currentMode === 'annotate' ? 'active' : ''}`}
              onClick={() => setCurrentMode('annotate')}
            >
              <i className="fas fa-comment"></i>
              Annotate
            </button>
          </div>
          
          <div className="analysis-stats">
            <div className="stat">
              <span className="stat-label">Selected:</span>
              <span className="stat-value">{selectedElements.length}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Annotated:</span>
              <span className="stat-value">{Object.keys(annotations).length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="workflow-canvas" ref={canvasRef}>
        <svg className="connection-layer" width="100%" height="100%">
          {/* Render connections between elements */}
          {connections.map((connection, index) => {
            const fromElement = task.elements.find(e => e.id === connection.from)
            const toElement = task.elements.find(e => e.id === connection.to)
            
            if (!fromElement || !toElement) return null
            
            return (
              <line
                key={index}
                x1={fromElement.position.x + 50}
                y1={fromElement.position.y + 25}
                x2={toElement.position.x + 50}
                y2={toElement.position.y + 25}
                stroke="var(--calm-gray)"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )
          })}
        </svg>
        
        <div className="elements-layer">
          {task.elements.map(element => (
            <div
              key={element.id}
              className={`workflow-element ${selectedElements.includes(element.id) ? 'selected' : ''}`}
              style={{
                left: element.position.x,
                top: element.position.y,
                borderColor: getElementColor(element)
              }}
              onClick={() => handleElementClick(element.id)}
            >
              <div className="element-icon">
                <i className={getElementIcon(element.type)} style={{ color: getElementColor(element) }}></i>
              </div>
              <div className="element-label">{element.label}</div>
              
              {element.metadata && (
                <div className="element-metadata">
                  {element.metadata.efficiency && (
                    <div className="metadata-item">
                      <span>Efficiency: {Math.round(element.metadata.efficiency * 100)}%</span>
                    </div>
                  )}
                  {element.metadata.automation_potential && (
                    <div className="metadata-item">
                      <span>AI Potential: {Math.round(element.metadata.automation_potential * 100)}%</span>
                    </div>
                  )}
                </div>
              )}
              
              {annotations[element.id] && (
                <div className="element-annotation">
                  <i className="fas fa-comment"></i>
                  <div className="annotation-tooltip">{annotations[element.id]}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="interface-sidebar">
        <div className="legend">
          <h4>Element Types</h4>
          <div className="legend-items">
            <div className="legend-item">
              <i className="fas fa-cogs" style={{ color: 'var(--insight-green)' }}></i>
              <span>Process</span>
            </div>
            <div className="legend-item">
              <i className="fas fa-code-branch" style={{ color: 'var(--energy-amber)' }}></i>
              <span>Decision</span>
            </div>
            <div className="legend-item">
              <i className="fas fa-database" style={{ color: 'var(--clarity-blue)' }}></i>
              <span>Data</span>
            </div>
            <div className="legend-item">
              <i className="fas fa-server" style={{ color: 'var(--calm-gray)' }}></i>
              <span>System</span>
            </div>
            <div className="legend-item">
              <i className="fas fa-user" style={{ color: '#e74c3c' }}></i>
              <span>Person</span>
            </div>
          </div>
        </div>
        
        <div className="selected-elements">
          <h4>Selected Elements</h4>
          <div className="selected-list">
            {selectedElements.map(elementId => {
              const element = task.elements.find(e => e.id === elementId)
              return element ? (
                <div key={elementId} className="selected-item">
                  <i className={getElementIcon(element.type)}></i>
                  <span>{element.label}</span>
                </div>
              ) : null
            })}
          </div>
        </div>
        
        <div className="insights-preview">
          <h4>Pattern Insights</h4>
          <div className="insight-items">
            {task.expectedInsights.map((insight, index) => (
              <div key={index} className="insight-item">
                <i className="fas fa-lightbulb"></i>
                <span>{insight}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="interface-actions">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setSelectedElements([])
            setAnnotations({})
            setConnections([])
          }}
        >
          <i className="fas fa-undo"></i>
          Reset
        </button>
        
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleCompleteAnalysis}
          disabled={selectedElements.length === 0}
        >
          <i className="fas fa-chart-line"></i>
          Complete Analysis
        </button>
      </div>
    </div>
  )
}

// Sample visual pattern task
export const sampleVisualTasks: PatternRecognitionTask[] = [
  {
    id: 'workflow_optimization',
    title: 'Strategic Workflow Analysis',
    description: 'Analyze this business workflow and identify opportunities for AI-powered optimization',
    type: 'workflow_optimization',
    instructions: 'Select elements that you believe have the highest potential for AI enhancement. Consider strategic value, automation potential, and impact on overall efficiency.',
    expectedInsights: [
      'Identify bottlenecks in decision-making processes',
      'Recognize data-rich processes suitable for AI',
      'Spot opportunities for predictive analytics',
      'Find areas where human expertise should be preserved'
    ],
    elements: [
      {
        id: 'customer_inquiry',
        type: 'process',
        label: 'Customer Inquiry',
        position: { x: 50, y: 100 },
        connections: ['initial_assessment'],
        metadata: { efficiency: 0.6, automation_potential: 0.8, strategic_value: 0.7 }
      },
      {
        id: 'initial_assessment',
        type: 'decision',
        label: 'Initial Assessment',
        position: { x: 250, y: 100 },
        connections: ['data_gathering', 'escalation'],
        metadata: { efficiency: 0.4, automation_potential: 0.9, strategic_value: 0.8 }
      },
      {
        id: 'data_gathering',
        type: 'data',
        label: 'Data Gathering',
        position: { x: 450, y: 50 },
        connections: ['analysis'],
        metadata: { efficiency: 0.3, automation_potential: 0.95, strategic_value: 0.6 }
      },
      {
        id: 'analysis',
        type: 'process',
        label: 'Analysis & Modeling',
        position: { x: 650, y: 50 },
        connections: ['recommendation'],
        metadata: { efficiency: 0.5, automation_potential: 0.85, strategic_value: 0.9 }
      },
      {
        id: 'recommendation',
        type: 'decision',
        label: 'Strategic Recommendation',
        position: { x: 650, y: 200 },
        connections: ['implementation'],
        metadata: { efficiency: 0.7, automation_potential: 0.3, strategic_value: 0.95 }
      },
      {
        id: 'escalation',
        type: 'person',
        label: 'Expert Consultation',
        position: { x: 250, y: 200 },
        connections: ['recommendation'],
        metadata: { efficiency: 0.8, automation_potential: 0.2, strategic_value: 0.9 }
      },
      {
        id: 'implementation',
        type: 'system',
        label: 'Implementation',
        position: { x: 450, y: 300 },
        connections: [],
        metadata: { efficiency: 0.6, automation_potential: 0.7, strategic_value: 0.8 }
      }
    ]
  }
]

export default VisualPatternInterface