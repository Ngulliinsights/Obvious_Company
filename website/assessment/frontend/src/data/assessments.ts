import { Assessment } from '../types/assessment'

export const assessmentData: Assessment[] = [
  {
    id: 'strategic-readiness',
    title: 'Strategic Readiness Assessment',
    description: 'Evaluate your AI integration readiness across five critical dimensions',
    duration: '15-20 minutes',
    type: 'questionnaire',
    questions: [
      {
        id: 'strategic_authority',
        type: 'scale',
        question: 'How much decision-making authority do you have regarding AI implementation in your organization?',
        description: 'Consider your ability to allocate budget, approve new technologies, and drive strategic initiatives.',
        scale: {
          min: 1,
          max: 5,
          labels: {
            1: 'Limited - Need approval for most decisions',
            2: 'Some - Can make small-scale decisions',
            3: 'Moderate - Can approve departmental initiatives',
            4: 'Significant - Can drive organization-wide changes',
            5: 'Complete - Full strategic authority'
          }
        }
      },
      {
        id: 'organizational_influence',
        type: 'scale',
        question: 'How effectively can you influence others in your organization to adopt new approaches?',
        description: 'Think about your ability to build consensus, manage change, and inspire adoption.',
        scale: {
          min: 1,
          max: 5,
          labels: {
            1: 'Minimal - Struggle to get buy-in',
            2: 'Limited - Can influence immediate team',
            3: 'Moderate - Can influence across departments',
            4: 'Strong - Recognized change leader',
            5: 'Exceptional - Organization-wide influence'
          }
        }
      },
      {
        id: 'resource_availability',
        type: 'multiple',
        question: 'What resources do you have available for AI implementation?',
        description: 'Select all that apply to your current situation.',
        options: [
          { id: 'budget_10k', text: 'Budget allocation of $10,000+' },
          { id: 'budget_50k', text: 'Budget allocation of $50,000+' },
          { id: 'dedicated_time', text: 'Dedicated time for implementation (10+ hours/week)' },
          { id: 'team_support', text: 'Team members who can assist with implementation' },
          { id: 'technical_expertise', text: 'Access to technical expertise (internal or external)' },
          { id: 'executive_support', text: 'Executive sponsorship and support' },
          { id: 'change_budget', text: 'Budget for training and change management' }
        ]
      },
      {
        id: 'current_challenges',
        type: 'multiple',
        question: 'Which challenges are currently consuming significant time and energy?',
        description: 'Identify areas where AI could potentially provide the most impact.',
        options: [
          { id: 'data_analysis', text: 'Data analysis and reporting' },
          { id: 'content_creation', text: 'Content creation and communication' },
          { id: 'process_optimization', text: 'Process optimization and workflow management' },
          { id: 'decision_support', text: 'Decision support and strategic analysis' },
          { id: 'customer_service', text: 'Customer service and engagement' },
          { id: 'project_management', text: 'Project management and coordination' },
          { id: 'research_insights', text: 'Research and market insights' },
          { id: 'administrative_tasks', text: 'Administrative and routine tasks' }
        ]
      },
      {
        id: 'implementation_timeline',
        type: 'single',
        question: 'What is your preferred timeline for AI implementation?',
        description: 'Consider your current priorities and capacity for change.',
        options: [
          { id: 'immediate', text: 'Immediate (within 30 days)' },
          { id: 'short_term', text: 'Short-term (1-3 months)' },
          { id: 'medium_term', text: 'Medium-term (3-6 months)' },
          { id: 'long_term', text: 'Long-term (6-12 months)' },
          { id: 'exploratory', text: 'Exploratory (timeline flexible)' }
        ]
      }
    ]
  },
  {
    id: 'scenario-based',
    title: 'Strategic Scenario Assessment',
    description: 'Navigate realistic business situations to reveal your strategic thinking patterns',
    duration: '20-25 minutes',
    type: 'scenario',
    questions: [
      {
        id: 'budget_allocation_scenario',
        type: 'scenario',
        question: 'Strategic Budget Allocation Challenge',
        description: 'How would you approach this strategic decision?',
        scenario: {
          title: 'AI Investment Decision',
          description: 'Your organization has allocated $100,000 for AI initiatives this quarter.',
          context: 'Three departments have submitted compelling proposals: Marketing wants AI-powered customer analytics ($45K), Operations wants process automation ($60K), and HR wants AI-assisted recruitment ($35K). You can only fund two initiatives.',
          choices: [
            {
              id: 'data_driven',
              text: 'Request detailed ROI projections and choose based on quantitative analysis',
              outcome: 'Demonstrates analytical approach and risk management'
            },
            {
              id: 'strategic_alignment',
              text: 'Evaluate which initiatives best align with long-term strategic objectives',
              outcome: 'Shows strategic thinking and organizational vision'
            },
            {
              id: 'pilot_approach',
              text: 'Fund smaller pilots from all three departments to test effectiveness',
              outcome: 'Indicates experimental mindset and risk distribution'
            },
            {
              id: 'stakeholder_consensus',
              text: 'Facilitate cross-departmental discussion to build consensus',
              outcome: 'Reveals collaborative leadership and change management skills'
            }
          ]
        }
      }
    ]
  }
]