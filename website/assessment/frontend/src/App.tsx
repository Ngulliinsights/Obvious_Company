import React, { useState } from 'react'
import AssessmentContainer from './components/AssessmentContainer'
import ResultsPresentation from './components/ResultsPresentation'
import { AssessmentResults } from './types/assessment'
import './styles/assessment.css'

function App() {
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResults | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleAssessmentComplete = (results: AssessmentResults) => {
    setAssessmentResults(results)
    setShowResults(true)
  }

  const handleRetakeAssessment = () => {
    setAssessmentResults(null)
    setShowResults(false)
  }

  const handleScheduleConsultation = () => {
    // Redirect to consultation scheduling
    window.open('/contact.html', '_blank')
  }

  const handleExportResults = () => {
    if (!assessmentResults) return
    
    // Generate PDF export (placeholder implementation)
    const resultsData = JSON.stringify(assessmentResults, null, 2)
    const blob = new Blob([resultsData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'assessment-results.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleViewPrograms = () => {
    // Redirect to programs page
    window.open('/learn/', '_blank')
  }

  const handleViewCaseStudies = () => {
    // Redirect to case studies
    window.open('/insights/case-studies/', '_blank')
  }

  const handleDownloadPlan = () => {
    if (!assessmentResults) return
    
    // Generate action plan PDF (placeholder implementation)
    const planData = JSON.stringify(assessmentResults.actionPlan, null, 2)
    const blob = new Blob([planData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'action-plan.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="App">
      {showResults && assessmentResults ? (
        <ResultsPresentation
          results={assessmentResults}
          onRetakeAssessment={handleRetakeAssessment}
          onScheduleConsultation={handleScheduleConsultation}
          onExportResults={handleExportResults}
          onViewPrograms={handleViewPrograms}
          onViewCaseStudies={handleViewCaseStudies}
          onDownloadPlan={handleDownloadPlan}
        />
      ) : (
        <AssessmentContainer onComplete={handleAssessmentComplete} />
      )}
    </div>
  )
}

export default App