import React, { useState } from 'react'
import { AssessmentResults } from '../types/assessment'

interface ActionPlanProps {
  results: AssessmentResults
  onScheduleConsultation?: () => void
  onDownloadPlan?: () => void
}

const ActionPlan: React.FC<ActionPlanProps> = ({
  results,
  onScheduleConsultation,
  onDownloadPlan
}) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'immediate' | 'short' | 'medium' | 'long'>('immediate')

  const getTimeframedActions = (timeframe: string): Array<{title: string, description: string, priority: 'high' | 'medium' | 'low'}> => {
    const overallScore = results.overallScore
    const persona = results.personaClassification.primary
    
    const actionsByTimeframe: Record<string, Array<{title: string, description: string, priority: 'high' | 'medium' | 'low'}>> = {
      immediate: [
        {
          title: 'Complete Strategic Assessment Review',
          description: 'Review your assessment results with key stakeholders and identify immediate opportunities for strategic intelligence amplification.',
          priority: 'high'
        },
        {
          title: 'Identify Quick Wins',
          description: 'Focus on low-hanging fruit that can demonstrate immediate value and build momentum for broader AI integration.',
          priority: 'high'
        },
        {
          title: 'Establish AI Governance Framework',
          description: 'Create basic policies and guidelines for responsible AI implementation within your organization.',
          priority: 'medium'
        },
        {
          title: 'Begin Team Education',
          description: 'Start foundational AI literacy training for key team members to build organizational capability.',
          priority: 'medium'
        }
      ],
      short: [
        {
          title: 'Launch Pilot Program',
          description: 'Implement a focused pilot project in your highest-scoring dimension to demonstrate strategic value.',
          priority: 'high'
        },
        {
          title: 'Develop Implementation Roadmap',
          description: 'Create a detailed 6-12 month plan for strategic AI integration based on your assessment results.',
          priority: 'high'
        },
        {
          title: 'Build Strategic Partnerships',
          description: 'Identify and engage with AI solution providers and strategic consultants aligned with your needs.',
          priority: 'medium'
        },
        {
          title: 'Establish Success Metrics',
          description: 'Define clear KPIs and measurement frameworks to track the impact of your AI initiatives.',
          priority: 'medium'
        }
      ],
      medium: [
        {
          title: 'Scale Successful Pilots',
          description: 'Expand proven AI applications across broader organizational functions and departments.',
          priority: 'high'
        },
        {
          title: 'Advanced Capability Development',
          description: 'Invest in advanced AI capabilities and specialized training for your strategic team members.',
          priority: 'high'
        },
        {
          title: 'Cultural Transformation',
          description: 'Drive organizational culture change to embrace AI-augmented decision making and strategic thinking.',
          priority: 'medium'
        },
        {
          title: 'Innovation Pipeline Development',
          description: 'Establish systematic processes for identifying and evaluating new AI opportunities.',
          priority: 'low'
        }
      ],
      long: [
        {
          title: 'Strategic Intelligence Mastery',
          description: 'Achieve organization-wide strategic intelligence amplification with AI as a core competitive advantage.',
          priority: 'high'
        },
        {
          title: 'Industry Leadership Position',
          description: 'Establish your organization as a thought leader in AI-driven strategic transformation.',
          priority: 'medium'
        },
        {
          title: 'Ecosystem Development',
          description: 'Build strategic partnerships and ecosystem relationships that amplify your AI capabilities.',
          priority: 'medium'
        },
        {
          title: 'Continuous Innovation',
          description: 'Maintain cutting-edge AI capabilities through ongoing research, development, and strategic partnerships.',
          priority: 'low'
        }
      ]
    }

    return actionsByTimeframe[timeframe] || []
  }

  const getTimeframeLabel = (timeframe: string): string => {
    const labels: Record<string, string> = {
      immediate: 'Next 30 Days',
      short: '3-6 Months', 
      medium: '6-18 Months',
      long: '18+ Months'
    }
    return labels[timeframe] || timeframe
  }

  const getResourceRecommendations = (): Array<{type: string, title: string, description: string, link?: string}> => {
    const persona = results.personaClassification.primary
    const overallScore = results.overallScore

    const baseResources = [
      {
        type: 'Assessment',
        title: 'Strategic Readiness Deep Dive',
        description: 'Comprehensive analysis of your assessment results with personalized recommendations.'
      },
      {
        type: 'Consultation',
        title: 'Strategic Planning Session',
        description: 'One-on-one consultation to develop your personalized AI integration strategy.'
      },
      {
        type: 'Training',
        title: 'AI Leadership Fundamentals',
        description: 'Essential training program for leaders driving AI transformation initiatives.'
      }
    ]

    // Add persona-specific resources
    if (persona === 'Strategic Architect') {
      baseResources.push({
        type: 'Program',
        title: 'Executive AI Transformation',
        description: 'Comprehensive program for C-suite leaders driving enterprise-wide AI adoption.'
      })
    } else if (persona === 'Strategic Catalyst') {
      baseResources.push({
        type: 'Program', 
        title: 'Change Leadership for AI',
        description: 'Specialized program for leaders driving organizational AI transformation.'
      })
    }

    return baseResources
  }

  const getPriorityColor = (priority: 'high' | 'medium' | 'low'): string => {
    const colors = {
      high: 'var(--insight-green)',
      medium: 'var(--energy-amber)', 
      low: 'var(--clarity-blue)'
    }
    return colors[priority]
  }

  const getPriorityIcon = (priority: 'high' | 'medium' | 'low'): string => {
    const icons = {
      high: 'fas fa-exclamation-circle',
      medium: 'fas fa-clock',
      low: 'fas fa-info-circle'
    }
    return icons[priority]
  }

  return (
    <div className="action-plan">
      <div className="plan-header">
        <div className="plan-title-section">
          <h3 className="plan-title">Your Strategic Action Plan</h3>
          <p className="plan-description">
            A personalized roadmap for implementing strategic AI integration based on your assessment results.
          </p>
        </div>
        
        <div className="plan-actions">
          {onDownloadPlan && (
            <button type="button" className="btn btn-outline" onClick={onDownloadPlan}>
              <i className="fas fa-download"></i>
              Download Plan
            </button>
          )}
          {onScheduleConsultation && (
            <button type="button" className="btn btn-primary" onClick={onScheduleConsultation}>
              <i className="fas fa-calendar"></i>
              Schedule Consultation
            </button>
          )}
        </div>
      </div>

      <div className="timeline-selector">
        <h4>Select Timeframe</h4>
        <div className="timeline-buttons">
          {(['immediate', 'short', 'medium', 'long'] as const).map((timeframe) => (
            <button
              key={timeframe}
              type="button"
              className={`timeline-button ${selectedTimeframe === timeframe ? 'active' : ''}`}
              onClick={() => setSelectedTimeframe(timeframe)}
            >
              <div className="timeline-label">{getTimeframeLabel(timeframe)}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="actions-section">
        <h4>Recommended Actions - {getTimeframeLabel(selectedTimeframe)}</h4>
        <div className="actions-list">
          {getTimeframedActions(selectedTimeframe).map((action, index) => (
            <div key={index} className="action-item">
              <div className="action-priority">
                <div 
                  className="priority-indicator"
                  style={{ background: getPriorityColor(action.priority) }}
                >
                  <i className={getPriorityIcon(action.priority)}></i>
                </div>
                <span className="priority-label">{action.priority.toUpperCase()}</span>
              </div>
              
              <div className="action-content">
                <h5 className="action-title">{action.title}</h5>
                <p className="action-description">{action.description}</p>
              </div>
              
              <div className="action-controls">
                <button type="button" className="btn btn-sm btn-outline">
                  <i className="fas fa-plus"></i>
                  Add to Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="next-steps-section">
        <h4>Immediate Next Steps</h4>
        <div className="next-steps-grid">
          {results.actionPlan.nextSteps.map((step, index) => (
            <div key={index} className="next-step-card">
              <div className="step-number">{index + 1}</div>
              <div className="step-content">
                <p>{step}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="resources-section">
        <h4>Recommended Resources & Investment Framework</h4>
        <div className="resources-grid">
          {getResourceRecommendations().map((resource, index) => (
            <div key={index} className="resource-card">
              <div className="resource-header">
                <div className="resource-type-badge" data-type={resource.type.toLowerCase()}>
                  {resource.type}
                </div>
                <h5 className="resource-title">{resource.title}</h5>
              </div>
              <p className="resource-description">{resource.description}</p>
              
              <div className="resource-metrics">
                <div className="metric-item">
                  <span className="metric-label">ROI Timeline:</span>
                  <span className="metric-value">
                    {resource.type === 'Program' ? '6-12 months' :
                     resource.type === 'Consultation' ? '1-3 months' :
                     resource.type === 'Training' ? '3-6 months' : '2-4 months'}
                  </span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Strategic Impact:</span>
                  <span className="metric-value">
                    {resource.type === 'Program' ? 'Transformational' :
                     resource.type === 'Consultation' ? 'High' :
                     resource.type === 'Training' ? 'Foundational' : 'Targeted'}
                  </span>
                </div>
              </div>
              
              <div className="resource-actions">
                <button type="button" className="btn btn-sm btn-primary">
                  <i className="fas fa-arrow-right"></i>
                  Learn More
                </button>
                <button type="button" className="btn btn-sm btn-outline">
                  <i className="fas fa-calendar"></i>
                  Schedule Call
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="investment-guidance">
          <h5>Investment Guidance</h5>
          <div className="guidance-content">
            <div className="guidance-item">
              <div className="guidance-icon">
                <i className="fas fa-chart-line"></i>
              </div>
              <div className="guidance-text">
                <strong>Strategic Clarity ($10K-15K):</strong> Foundation building with immediate tactical wins
              </div>
            </div>
            <div className="guidance-item">
              <div className="guidance-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <div className="guidance-text">
                <strong>Strategic Systems ($25K-40K):</strong> Comprehensive implementation with organizational change
              </div>
            </div>
            <div className="guidance-item">
              <div className="guidance-icon">
                <i className="fas fa-rocket"></i>
              </div>
              <div className="guidance-text">
                <strong>Strategic Advantage ($50K-75K):</strong> Enterprise transformation with competitive positioning
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="timeline-overview">
        <h4>Implementation Timeline</h4>
        <div className="timeline-visual">
          <div className="timeline-track">
            {(['immediate', 'short', 'medium', 'long'] as const).map((timeframe, index) => (
              <div key={timeframe} className="timeline-milestone">
                <div className="milestone-marker">
                  <div className="milestone-number">{index + 1}</div>
                </div>
                <div className="milestone-content">
                  <div className="milestone-timeframe">{getTimeframeLabel(timeframe)}</div>
                  <div className="milestone-actions">
                    {getTimeframedActions(timeframe).length} actions planned
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="timeline-summary">
          <p>
            <strong>Estimated Timeline:</strong> {results.actionPlan.timeline}
          </p>
          <p>
            <strong>Success Factors:</strong> Consistent execution, stakeholder alignment, and continuous learning
          </p>
        </div>
      </div>

      <div className="plan-footer">
        <div className="footer-message">
          <i className="fas fa-lightbulb"></i>
          <p>
            This action plan is personalized based on your assessment results. 
            Schedule a consultation to refine and customize your strategic approach.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ActionPlan