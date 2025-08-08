import React from 'react'
import { AssessmentResults } from '../types/assessment'

interface IndustryInsightsProps {
  results: AssessmentResults
  onViewCaseStudies?: () => void
}

const IndustryInsights: React.FC<IndustryInsightsProps> = ({
  results,
  onViewCaseStudies
}) => {
  const getIndustryIcon = (sector: string): string => {
    const icons: Record<string, string> = {
      'Financial Services': 'fas fa-university',
      'Manufacturing': 'fas fa-industry',
      'Healthcare': 'fas fa-heartbeat',
      'Government': 'fas fa-landmark',
      'Technology': 'fas fa-microchip',
      'Professional Services': 'fas fa-briefcase',
      'Education': 'fas fa-graduation-cap',
      'Retail': 'fas fa-shopping-cart',
      'Energy': 'fas fa-bolt',
      'Transportation': 'fas fa-truck'
    }
    return icons[sector] || 'fas fa-building'
  }

  const getIndustryUseCases = (sector: string): string[] => {
    const useCases: Record<string, string[]> = {
      'Financial Services': [
        'Risk modeling and credit assessment automation',
        'Fraud detection and prevention systems',
        'Customer analytics and personalized services',
        'Regulatory compliance monitoring',
        'Investment portfolio optimization'
      ],
      'Manufacturing': [
        'Predictive maintenance and equipment optimization',
        'Supply chain intelligence and demand forecasting',
        'Quality control and defect detection',
        'Production planning and resource allocation',
        'Safety monitoring and incident prevention'
      ],
      'Healthcare': [
        'Diagnostic support and medical imaging analysis',
        'Patient outcome prediction and care optimization',
        'Drug discovery and clinical trial optimization',
        'Administrative workflow automation',
        'Population health management'
      ],
      'Government': [
        'Citizen service delivery optimization',
        'Policy impact analysis and simulation',
        'Resource allocation and budget optimization',
        'Public safety and emergency response',
        'Transparency and accountability reporting'
      ],
      'Technology': [
        'Product development acceleration',
        'Customer experience optimization',
        'Code quality and security analysis',
        'Market intelligence and competitive analysis',
        'Innovation pipeline management'
      ],
      'Professional Services': [
        'Client relationship management optimization',
        'Service delivery automation and enhancement',
        'Knowledge management and expertise sharing',
        'Project management and resource allocation',
        'Business development and market analysis'
      ]
    }
    return useCases[sector] || [
      'Process optimization and efficiency gains',
      'Data-driven decision making',
      'Customer experience enhancement',
      'Risk management and compliance',
      'Innovation and competitive advantage'
    ]
  }

  const getRegulatoryConsiderations = (sector: string): string[] => {
    const considerations: Record<string, string[]> = {
      'Financial Services': [
        'Basel III capital requirements and stress testing',
        'GDPR and data privacy compliance',
        'Anti-money laundering (AML) regulations',
        'Consumer protection and fair lending',
        'Algorithmic bias and explainability requirements'
      ],
      'Healthcare': [
        'HIPAA privacy and security requirements',
        'FDA medical device regulations',
        'Clinical trial and research ethics',
        'Patient consent and data governance',
        'Medical liability and malpractice considerations'
      ],
      'Government': [
        'Public transparency and accountability',
        'Citizen privacy and civil liberties',
        'Procurement and vendor management',
        'Accessibility and digital equity',
        'National security and data sovereignty'
      ],
      'Manufacturing': [
        'Workplace safety and OSHA compliance',
        'Environmental regulations and sustainability',
        'Product liability and quality standards',
        'International trade and export controls',
        'Labor relations and workforce protection'
      ]
    }
    return considerations[sector] || [
      'Data privacy and protection requirements',
      'Industry-specific compliance standards',
      'Ethical AI and algorithmic fairness',
      'Security and risk management',
      'Stakeholder transparency and accountability'
    ]
  }

  const getImplementationPriorities = (sector: string, readiness: number): string[] => {
    const basePriorities: Record<string, string[]> = {
      'Financial Services': [
        'Risk management system enhancement',
        'Customer analytics and personalization',
        'Regulatory compliance automation',
        'Fraud detection and prevention'
      ],
      'Manufacturing': [
        'Predictive maintenance implementation',
        'Supply chain optimization',
        'Quality control automation',
        'Production planning enhancement'
      ],
      'Healthcare': [
        'Clinical decision support systems',
        'Administrative workflow optimization',
        'Patient care coordination',
        'Population health analytics'
      ]
    }

    const priorities = basePriorities[sector] || [
      'Data infrastructure development',
      'Process automation opportunities',
      'Decision support systems',
      'Customer experience enhancement'
    ]

    // Adjust priorities based on readiness level
    if (readiness < 50) {
      return [
        'Foundation building and data infrastructure',
        'Team training and capability development',
        ...priorities.slice(0, 2)
      ]
    } else if (readiness < 75) {
      return [
        'Pilot program implementation',
        ...priorities.slice(0, 3),
        'Change management and adoption'
      ]
    } else {
      return [
        'Strategic transformation initiatives',
        ...priorities,
        'Innovation and competitive advantage'
      ]
    }
  }

  const getReadinessColor = (readiness: number): string => {
    if (readiness >= 75) return 'var(--insight-green)'
    if (readiness >= 50) return 'var(--clarity-blue)'
    if (readiness >= 25) return 'var(--energy-amber)'
    return '#e74c3c'
  }

  const getReadinessLabel = (readiness: number): string => {
    if (readiness >= 75) return 'High Readiness'
    if (readiness >= 50) return 'Moderate Readiness'
    if (readiness >= 25) return 'Developing Readiness'
    return 'Foundation Building'
  }

  return (
    <div className="industry-insights">
      <div className="insights-header">
        <div className="industry-identity">
          <div className="industry-icon">
            <i className={getIndustryIcon(results.industryInsights.sector)}></i>
          </div>
          <div className="industry-info">
            <h3 className="industry-title">{results.industryInsights.sector} Insights</h3>
            <div className="readiness-indicator">
              <span className="readiness-label">Industry Readiness:</span>
              <div className="readiness-bar">
                <div 
                  className="readiness-fill"
                  style={{ 
                    width: `${results.industryInsights.readiness}%`,
                    background: getReadinessColor(results.industryInsights.readiness)
                  }}
                />
              </div>
              <span className="readiness-value">
                {getReadinessLabel(results.industryInsights.readiness)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="use-cases-section">
        <h4>Strategic AI Applications in {results.industryInsights.sector}</h4>
        <div className="use-cases-grid">
          {getIndustryUseCases(results.industryInsights.sector).map((useCase, index) => (
            <div key={index} className="use-case-card">
              <div className="use-case-icon">
                <i className="fas fa-lightbulb"></i>
              </div>
              <div className="use-case-content">
                <p>{useCase}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="regulatory-section">
        <h4>Regulatory & Compliance Considerations</h4>
        <div className="regulatory-grid">
          {getRegulatoryConsiderations(results.industryInsights.sector).map((consideration, index) => (
            <div key={index} className="regulatory-item">
              <div className="regulatory-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <span>{consideration}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="priorities-section">
        <h4>Implementation Priorities</h4>
        <p className="priorities-description">
          Based on your industry context and readiness level, these are the recommended 
          strategic priorities for AI integration:
        </p>
        <div className="priorities-list">
          {getImplementationPriorities(results.industryInsights.sector, results.industryInsights.readiness)
            .map((priority, index) => (
              <div key={index} className="priority-item">
                <div className="priority-number">{index + 1}</div>
                <div className="priority-content">
                  <span>{priority}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      <div className="recommendations-section">
        <h4>Industry-Specific Recommendations</h4>
        <div className="recommendations-grid">
          {results.industryInsights.recommendations.map((recommendation, index) => (
            <div key={index} className="recommendation-card">
              <div className="recommendation-header">
                <i className="fas fa-star"></i>
                <h5>Strategic Recommendation {index + 1}</h5>
              </div>
              <p>{recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="industry-benchmarks">
        <h4>Industry Benchmarks & Competitive Analysis</h4>
        <div className="benchmarks-grid">
          <div className="benchmark-card">
            <div className="benchmark-icon">
              <i className="fas fa-chart-bar"></i>
            </div>
            <div className="benchmark-content">
              <div className="benchmark-value">{results.industryInsights.readiness}%</div>
              <div className="benchmark-label">Your Readiness</div>
              <div className="benchmark-trend">
                <i className="fas fa-arrow-up"></i>
                <span>Above sector average</span>
              </div>
            </div>
          </div>
          
          <div className="benchmark-card">
            <div className="benchmark-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="benchmark-content">
              <div className="benchmark-value">
                {results.industryInsights.readiness > 60 ? 'Top 25%' : 
                 results.industryInsights.readiness > 40 ? 'Top 50%' : 'Developing'}
              </div>
              <div className="benchmark-label">Industry Percentile</div>
              <div className="benchmark-context">
                {results.industryInsights.sector} sector positioning
              </div>
            </div>
          </div>
          
          <div className="benchmark-card">
            <div className="benchmark-icon">
              <i className="fas fa-rocket"></i>
            </div>
            <div className="benchmark-content">
              <div className="benchmark-value">
                {results.industryInsights.readiness > 75 ? '6-12 mo' :
                 results.industryInsights.readiness > 50 ? '12-18 mo' : '18-24 mo'}
              </div>
              <div className="benchmark-label">Implementation Timeline</div>
              <div className="benchmark-confidence">
                High confidence estimate
              </div>
            </div>
          </div>
          
          <div className="benchmark-card">
            <div className="benchmark-icon">
              <i className="fas fa-trophy"></i>
            </div>
            <div className="benchmark-content">
              <div className="benchmark-value">
                {results.industryInsights.readiness > 70 ? 'Leader' :
                 results.industryInsights.readiness > 50 ? 'Fast Follower' : 'Emerging'}
              </div>
              <div className="benchmark-label">Market Position</div>
              <div className="benchmark-opportunity">
                Strategic advantage potential
              </div>
            </div>
          </div>
        </div>
        
        <div className="competitive-analysis">
          <h5>Competitive Landscape Analysis</h5>
          <div className="analysis-insights">
            <div className="insight-card">
              <div className="insight-header">
                <i className="fas fa-lightbulb"></i>
                <span>Market Opportunity</span>
              </div>
              <p>
                Your {results.industryInsights.readiness}% readiness score positions you 
                {results.industryInsights.readiness > 60 ? ' ahead of most competitors' : 
                 ' with significant growth potential'} in the {results.industryInsights.sector} sector.
              </p>
            </div>
            <div className="insight-card">
              <div className="insight-header">
                <i className="fas fa-shield-alt"></i>
                <span>Risk Assessment</span>
              </div>
              <p>
                {results.industryInsights.readiness > 70 ? 'Low risk of competitive disruption' :
                 results.industryInsights.readiness > 50 ? 'Moderate risk requires strategic action' :
                 'High urgency for AI integration to maintain competitiveness'}.
              </p>
            </div>
          </div>
        </div>
      </div>

      {onViewCaseStudies && (
        <div className="insights-footer">
          <button type="button" className="btn btn-primary" onClick={onViewCaseStudies}>
            <i className="fas fa-book-open"></i>
            View {results.industryInsights.sector} Case Studies
          </button>
        </div>
      )}
    </div>
  )
}

export default IndustryInsights