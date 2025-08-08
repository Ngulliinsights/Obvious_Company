export interface Question {
  id: string
  type: 'scale' | 'multiple' | 'single' | 'text' | 'scenario' | 'visual' | 'behavioral'
  question: string
  description?: string
  scale?: {
    min: number
    max: number
    labels: Record<number, string>
  }
  options?: Array<{
    id: string
    text: string
    value?: string
  }>
  scenario?: {
    title: string
    description: string
    context: string
    choices: Array<{
      id: string
      text: string
      outcome: string
    }>
  }
  visual?: {
    type: 'workflow' | 'pattern' | 'diagram'
    elements: Array<{
      id: string
      type: string
      position: { x: number; y: number }
      content: string
    }>
  }
}

export interface Assessment {
  id: string
  title: string
  description: string
  duration: string
  questions: Question[]
  type: 'questionnaire' | 'scenario' | 'conversational' | 'visual' | 'behavioral'
}

export interface AssessmentResponse {
  questionId: string
  value: string | string[] | number
  timestamp: Date
  timeSpent: number
}

export interface AssessmentSession {
  id: string
  assessmentId: string
  currentQuestionIndex: number
  responses: AssessmentResponse[]
  startTime: Date
  status: 'in_progress' | 'completed' | 'abandoned'
}

export interface AssessmentResults {
  sessionId: string
  overallScore: number
  dimensionScores: Record<string, number>
  personaClassification: {
    primary: string
    confidence: number
    characteristics: string[]
  }
  industryInsights: {
    sector: string
    readiness: number
    recommendations: string[]
  }
  actionPlan: {
    nextSteps: string[]
    timeline: string
    resources: string[]
  }
}