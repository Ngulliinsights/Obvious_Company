import React from 'react'
import { AssessmentResults } from '../types/assessment'

interface ResultsDashboardProps {
  results: AssessmentResults
  onExportResults?: () => void
  onScheduleConsultation?: () => void
}

const ResultsDashboard: React.FC<ResultsDashboardProps> = ({
  results,
  onExportResults,
  onScheduleConsultation
}) => {
  const getDimensionColor = (score: number): string => {
    if (score >= 80) return 'var(--insight-green)'
    if (score >= 60) return 'var(--clarity-blue)'
    if (score >= 40) return 'var(--energy-amber)'
    return '#e74c3c'
  }

  const getDimensionLabel = (key: string): string => {
    const labels: Record<string, string> = {
      strategicAuthority: 'Strategic Authority',
      organizationalInfluence: 'Organizational Influence', 
      resourceAvailability: 'Resource Availability',
      implementationReadiness: 'Implementation Readiness',
      culturalAlignment: 'Cultural Alignment'
    }
    return labels[key] || key
  }

  const getOverallRating = (score: number): string => {
    if (score >= 85) return 'Exceptional'
    if (score >= 70) return 'Strong'
    if (score >= 55) return 'Moderate'
    if (score >= 40) return 'Developing'
    return 'Foundation'
  }

  return (
    <div className="results-dashboard">
      <div className="dashboard-header">
        <div className="results-overview">
          <h2 className="results-title">Your Strategic Assessment Results</h2>
          <div className="overall-score">
            <div className="score-circle">
              <svg className="score-ring" width="120" height="120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke={getDimensionColor(results.overallScore)}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(results.overallScore / 100) * 314} 314`}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className="score-content">
                <div className="score-value">{Math.round(results.overallScore)}</div>
                <div className="score-label">Overall Score</div>
              </div>
            </div>
            <div className="score-interpretation">
              <div className="rating-badge" style={{ background: getDimensionColor(results.overallScore) }}>
                {getOverallRating(results.overallScore)}
              </div>
              <p className="rating-description">
                Your assessment indicates {getOverallRating(results.overallScore).toLowerCase()} readiness 
                for strategic AI integration across multiple dimensions.
              </p>
              <div className="score-insights">
                <div className="insight-item">
                  <i className="fas fa-chart-line"></i>
                  <span>Strategic Intelligence Amplification Focus</span>
                </div>
                <div className="insight-item">
                  <i className="fas fa-users"></i>
                  <span>Human-AI Collaboration Emphasis</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="dashboard-actions">
          {onExportResults && (
            <button type="button" className="btn btn-outline" onClick={onExportResults}>
              <i className="fas fa-download"></i>
              Export Results
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

      <div className="dimensions-analysis">
        <h3 className="section-title">Dimensional Analysis</h3>
        <div className="dimensions-grid">
          {Object.entries(results.dimensionScores).map(([key, score]) => (
            <div key={key} className="dimension-card">
              <div className="dimension-header">
                <h4 className="dimension-name">{getDimensionLabel(key)}</h4>
                <div className="dimension-score-visual">
                  <svg className="dimension-ring" width="60" height="60">
                    <circle
                      cx="30"
                      cy="30"
                      r="25"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="4"
                    />
                    <circle
                      cx="30"
                      cy="30"
                      r="25"
                      fill="none"
                      stroke={getDimensionColor(score)}
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(score / 100) * 157} 157`}
                      transform="rotate(-90 30 30)"
                    />
                  </svg>
                  <div className="dimension-score" style={{ color: getDimensionColor(score) }}>
                    {Math.round(score)}%
                  </div>
                </div>
              </div>
              
              <div className="dimension-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ 
                      width: `${score}%`,
                      background: `linear-gradient(90deg, ${getDimensionColor(score)}, ${getDimensionColor(score)}88)`
                    }}
                  />
                </div>
              </div>
              
              <div className="dimension-insight">
                {score >= 80 && (
                  <div className="insight-item positive">
                    <i className="fas fa-check-circle"></i>
                    <span>Strong foundation for strategic implementation</span>
                  </div>
                )}
                {score >= 60 && score < 80 && (
                  <div className="insight-item moderate">
                    <i className="fas fa-arrow-up"></i>
                    <span>Good potential with targeted improvements</span>
                  </div>
                )}
                {score < 60 && (
                  <div className="insight-item developing">
                    <i className="fas fa-lightbulb"></i>
                    <span>Opportunity for strategic development</span>
                  </div>
                )}
              </div>
              
              <div className="dimension-details">
                <div className="detail-metric">
                  <span className="metric-label">Impact Level:</span>
                  <span className="metric-value">
                    {score >= 75 ? 'High' : score >= 50 ? 'Medium' : 'Developing'}
                  </span>
                </div>
                <div className="detail-metric">
                  <span className="metric-label">Priority:</span>
                  <span className="metric-value">
                    {score < 60 ? 'Immediate' : score < 80 ? 'Short-term' : 'Optimization'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="results-summary">
        <div className="summary-card">
          <div className="summary-header">
            <i className="fas fa-chart-line"></i>
            <h4>Key Strengths</h4>
          </div>
          <ul className="summary-list">
            {Object.entries(results.dimensionScores)
              .filter(([, score]) => score >= 70)
              .map(([key]) => (
                <li key={key}>
                  <i className="fas fa-star"></i>
                  {getDimensionLabel(key)}
                </li>
              ))}
          </ul>
        </div>

        <div className="summary-card">
          <div className="summary-header">
            <i className="fas fa-target"></i>
            <h4>Growth Opportunities</h4>
          </div>
          <ul className="summary-list">
            {Object.entries(results.dimensionScores)
              .filter(([, score]) => score < 70)
              .map(([key]) => (
                <li key={key}>
                  <i className="fas fa-arrow-up"></i>
                  {getDimensionLabel(key)}
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default ResultsDashboard