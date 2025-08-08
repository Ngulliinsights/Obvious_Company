import React, { useState } from 'react'
import { AssessmentResults } from '../types/assessment'
import ResultsDashboard from './ResultsDashboard'
import PersonaProfile from './PersonaProfile'
import IndustryInsights from './IndustryInsights'
import ActionPlan from './ActionPlan'

interface ResultsPresentationProps {
  results: AssessmentResults
  onRetakeAssessment?: () => void
  onScheduleConsultation?: () => void
  onExportResults?: () => void
  onViewPrograms?: () => void
  onViewCaseStudies?: () => void
  onDownloadPlan?: () => void
}

const ResultsPresentation: React.FC<ResultsPresentationProps> = ({
  results,
  onRetakeAssessment,
  onScheduleConsultation,
  onExportResults,
  onViewPrograms,
  onViewCaseStudies,
  onDownloadPlan
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'persona' | 'industry' | 'action'>('dashboard')

  const tabs = [
    {
      id: 'dashboard' as const,
      label: 'Overview',
      icon: 'fas fa-chart-pie',
      description: 'Your comprehensive assessment results and dimensional analysis'
    },
    {
      id: 'persona' as const,
      label: 'Strategic Profile',
      icon: 'fas fa-user-tie',
      description: 'Your strategic persona classification and characteristics'
    },
    {
      id: 'industry' as const,
      label: 'Industry Insights',
      icon: 'fas fa-industry',
      description: 'Sector-specific analysis and implementation guidance'
    },
    {
      id: 'action' as const,
      label: 'Action Plan',
      icon: 'fas fa-tasks',
      description: 'Your personalized roadmap for strategic AI integration'
    }
  ]

  const renderActiveComponent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <ResultsDashboard
            results={results}
            onExportResults={onExportResults}
            onScheduleConsultation={onScheduleConsultation}
          />
        )
      case 'persona':
        return (
          <PersonaProfile
            results={results}
            onViewPrograms={onViewPrograms}
          />
        )
      case 'industry':
        return (
          <IndustryInsights
            results={results}
            onViewCaseStudies={onViewCaseStudies}
          />
        )
      case 'action':
        return (
          <ActionPlan
            results={results}
            onScheduleConsultation={onScheduleConsultation}
            onDownloadPlan={onDownloadPlan}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="results-presentation">
      <div className="results-header">
        <div className="header-content">
          <h1 className="results-main-title">Your Strategic Assessment Results</h1>
          <p className="results-subtitle">
            Comprehensive insights into your AI integration readiness and strategic amplification opportunities
          </p>
        </div>
        
        <div className="header-actions">
          {onRetakeAssessment && (
            <button type="button" className="btn btn-outline" onClick={onRetakeAssessment}>
              <i className="fas fa-redo"></i>
              Retake Assessment
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onScheduleConsultation}>
            <i className="fas fa-calendar"></i>
            Schedule Consultation
          </button>
        </div>
      </div>

      <div className="results-navigation">
        <div className="nav-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <div className="tab-icon">
                <i className={tab.icon}></i>
              </div>
              <div className="tab-content">
                <div className="tab-label">{tab.label}</div>
                <div className="tab-description">{tab.description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="results-content">
        {renderActiveComponent()}
      </div>

      <div className="results-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Next Steps</h4>
            <p>Ready to transform your strategic capabilities with AI?</p>
            <div className="footer-actions">
              <button type="button" className="btn btn-primary" onClick={onScheduleConsultation}>
                <i className="fas fa-phone"></i>
                Schedule Free Consultation
              </button>
              <button type="button" className="btn btn-outline" onClick={onViewPrograms}>
                <i className="fas fa-graduation-cap"></i>
                Explore Programs
              </button>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Share Your Results</h4>
            <p>Share your assessment insights with your team or stakeholders.</p>
            <div className="share-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={onExportResults}>
                <i className="fas fa-download"></i>
                Export PDF
              </button>
              <button type="button" className="btn btn-outline btn-sm">
                <i className="fas fa-share"></i>
                Share Link
              </button>
              <button type="button" className="btn btn-outline btn-sm">
                <i className="fas fa-envelope"></i>
                Email Results
              </button>
            </div>
          </div>
        </div>
        
        <div className="footer-disclaimer">
          <p>
            <i className="fas fa-info-circle"></i>
            These results are based on your assessment responses and provide strategic guidance. 
            For personalized implementation support, schedule a consultation with our strategic team.
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResultsPresentation