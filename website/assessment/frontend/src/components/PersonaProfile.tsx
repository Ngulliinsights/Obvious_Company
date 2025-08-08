import React from 'react'
import { AssessmentResults } from '../types/assessment'

interface PersonaProfileProps {
  results: AssessmentResults
  onViewPrograms?: () => void
}

const PersonaProfile: React.FC<PersonaProfileProps> = ({
  results,
  onViewPrograms
}) => {
  const getPersonaIcon = (persona: string): string => {
    const icons: Record<string, string> = {
      'Strategic Architect': 'fas fa-chess-king',
      'Strategic Catalyst': 'fas fa-rocket',
      'Strategic Contributor': 'fas fa-cogs',
      'Strategic Explorer': 'fas fa-compass',
      'Strategic Observer': 'fas fa-eye'
    }
    return icons[persona] || 'fas fa-user'
  }

  const getPersonaDescription = (persona: string): string => {
    const descriptions: Record<string, string> = {
      'Strategic Architect': 'C-suite executives with enterprise-wide authority and comprehensive strategic vision. You have the power to drive organization-wide AI transformation.',
      'Strategic Catalyst': 'Senior leaders with significant influence and change leadership capability. You excel at driving strategic initiatives and inspiring organizational transformation.',
      'Strategic Contributor': 'Department leaders with tactical implementation focus. You translate strategic vision into actionable plans and drive execution excellence.',
      'Strategic Explorer': 'Emerging leaders with development potential. You are positioned to grow your strategic influence and expand your AI integration capabilities.',
      'Strategic Observer': 'Functional specialists with assessment-based consultation needs. You provide valuable expertise and insights to support strategic decision-making.'
    }
    return descriptions[persona] || 'Strategic professional with unique capabilities and growth potential.'
  }

  const getPersonaCharacteristics = (persona: string): string[] => {
    const characteristics: Record<string, string[]> = {
      'Strategic Architect': [
        'Enterprise-wide decision authority',
        'Comprehensive strategic vision',
        'High resource allocation power',
        'Change leadership capability',
        'Long-term transformation focus'
      ],
      'Strategic Catalyst': [
        'Significant organizational influence',
        'Change management expertise',
        'Cross-functional collaboration',
        'Innovation leadership',
        'Strategic initiative ownership'
      ],
      'Strategic Contributor': [
        'Tactical implementation strength',
        'Operational excellence focus',
        'Team leadership capability',
        'Process optimization skills',
        'Results-driven approach'
      ],
      'Strategic Explorer': [
        'Growth-oriented mindset',
        'Learning agility',
        'Emerging leadership potential',
        'Adaptability and flexibility',
        'Strategic curiosity'
      ],
      'Strategic Observer': [
        'Specialized expertise',
        'Analytical thinking',
        'Quality assurance focus',
        'Risk assessment capability',
        'Advisory role strength'
      ]
    }
    return characteristics[persona] || ['Strategic thinking', 'Professional expertise', 'Growth potential']
  }

  const getRecommendedPrograms = (persona: string): Array<{title: string, description: string, investment: string}> => {
    const programs: Record<string, Array<{title: string, description: string, investment: string}>> = {
      'Strategic Architect': [
        {
          title: 'Strategic Advantage Program',
          description: 'Comprehensive enterprise AI transformation with full strategic support',
          investment: '$50K-75K'
        },
        {
          title: 'Executive AI Leadership',
          description: 'C-suite focused strategic intelligence amplification',
          investment: '$25K-40K'
        }
      ],
      'Strategic Catalyst': [
        {
          title: 'Strategic Systems Program', 
          description: 'Advanced strategic implementation with change leadership focus',
          investment: '$25K-40K'
        },
        {
          title: 'Innovation Catalyst Track',
          description: 'Specialized program for driving organizational innovation',
          investment: '$15K-25K'
        }
      ],
      'Strategic Contributor': [
        {
          title: 'Strategic Clarity Program',
          description: 'Foundational strategic intelligence with implementation focus',
          investment: '$10K-15K'
        },
        {
          title: 'Tactical Excellence Track',
          description: 'Operational AI integration with team leadership development',
          investment: '$8K-12K'
        }
      ],
      'Strategic Explorer': [
        {
          title: 'Strategic Foundation Program',
          description: 'Comprehensive AI literacy with leadership development',
          investment: '$5K-10K'
        },
        {
          title: 'Emerging Leader Track',
          description: 'Growth-focused program with mentorship and strategic development',
          investment: '$3K-7K'
        }
      ],
      'Strategic Observer': [
        {
          title: 'Strategic Assessment Consultation',
          description: 'Specialized consultation based on assessment insights',
          investment: '$2K-5K'
        },
        {
          title: 'Expert Advisory Program',
          description: 'Ongoing strategic advisory with specialized focus',
          investment: '$1K-3K'
        }
      ]
    }
    return programs[persona] || []
  }

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'var(--insight-green)'
    if (confidence >= 0.6) return 'var(--clarity-blue)'
    return 'var(--energy-amber)'
  }

  return (
    <div className="persona-profile">
      <div className="profile-header">
        <div className="persona-identity">
          <div className="persona-icon">
            <i className={getPersonaIcon(results.personaClassification.primary)}></i>
          </div>
          <div className="persona-info">
            <h3 className="persona-title">{results.personaClassification.primary}</h3>
            <div className="confidence-indicator">
              <span className="confidence-label">Classification Confidence:</span>
              <div className="confidence-bar">
                <div 
                  className="confidence-fill"
                  style={{ 
                    width: `${results.personaClassification.confidence * 100}%`,
                    background: getConfidenceColor(results.personaClassification.confidence)
                  }}
                />
              </div>
              <span className="confidence-value">
                {Math.round(results.personaClassification.confidence * 100)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="persona-description">
        <h4>Your Strategic Profile</h4>
        <p>{getPersonaDescription(results.personaClassification.primary)}</p>
      </div>

      <div className="persona-characteristics">
        <h4>Key Characteristics</h4>
        <div className="characteristics-grid">
          {getPersonaCharacteristics(results.personaClassification.primary).map((characteristic, index) => (
            <div key={index} className="characteristic-item">
              <div className="characteristic-icon">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="characteristic-content">
                <span className="characteristic-text">{characteristic}</span>
                <div className="characteristic-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill"
                      style={{ 
                        width: `${85 + (index * 3)}%`,
                        background: 'var(--insight-green)'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="persona-strengths-summary">
          <div className="strength-category">
            <h5>Leadership Capacity</h5>
            <div className="capacity-indicators">
              <div className="capacity-item">
                <span>Decision Authority</span>
                <div className="capacity-level">
                  {results.personaClassification.primary === 'Strategic Architect' ? 'Enterprise' :
                   results.personaClassification.primary === 'Strategic Catalyst' ? 'Departmental' :
                   results.personaClassification.primary === 'Strategic Contributor' ? 'Team' :
                   results.personaClassification.primary === 'Strategic Explorer' ? 'Individual' : 'Advisory'}
                </div>
              </div>
              <div className="capacity-item">
                <span>Change Influence</span>
                <div className="capacity-level">
                  {results.personaClassification.primary === 'Strategic Architect' ? 'Transformational' :
                   results.personaClassification.primary === 'Strategic Catalyst' ? 'Significant' :
                   results.personaClassification.primary === 'Strategic Contributor' ? 'Operational' :
                   results.personaClassification.primary === 'Strategic Explorer' ? 'Emerging' : 'Consultative'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {results.personaClassification.characteristics.length > 0 && (
        <div className="secondary-traits">
          <h4>Secondary Traits</h4>
          <div className="traits-list">
            {results.personaClassification.characteristics.map((trait, index) => (
              <div key={index} className="trait-badge">
                {trait}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="recommended-programs">
        <div className="programs-header">
          <h4>Recommended Programs</h4>
          <p>Based on your strategic profile and assessment results</p>
        </div>
        
        <div className="programs-grid">
          {getRecommendedPrograms(results.personaClassification.primary).map((program, index) => (
            <div key={index} className="program-card">
              <div className="program-header">
                <h5 className="program-title">{program.title}</h5>
                <div className="program-investment">{program.investment}</div>
              </div>
              <p className="program-description">{program.description}</p>
              <div className="program-actions">
                <button type="button" className="btn btn-outline btn-sm">
                  <i className="fas fa-info-circle"></i>
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>

        {onViewPrograms && (
          <div className="programs-footer">
            <button type="button" className="btn btn-primary" onClick={onViewPrograms}>
              <i className="fas fa-graduation-cap"></i>
              View All Programs
            </button>
          </div>
        )}
      </div>

      <div className="persona-insights">
        <div className="insight-card">
          <div className="insight-header">
            <i className="fas fa-lightbulb"></i>
            <h5>Strategic Insight</h5>
          </div>
          <p>
            As a {results.personaClassification.primary}, your greatest opportunity lies in leveraging 
            your {results.personaClassification.primary === 'Strategic Architect' ? 'enterprise authority' : 
                  results.personaClassification.primary === 'Strategic Catalyst' ? 'change leadership' :
                  results.personaClassification.primary === 'Strategic Contributor' ? 'implementation expertise' :
                  results.personaClassification.primary === 'Strategic Explorer' ? 'growth potential' : 
                  'specialized knowledge'} to drive meaningful AI integration that amplifies strategic intelligence 
            rather than simply automating tasks.
          </p>
        </div>
      </div>
    </div>
  )
}

export default PersonaProfile