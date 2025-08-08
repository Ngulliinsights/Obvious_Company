/**
 * Comprehensive Assessment Question Bank
 * Strategic Intelligence Amplification Assessment
 */

const assessmentQuestions = {
  // Strategic Authority Dimension (20% weight)
  strategic_authority: [
    {
      id: 'sa_001',
      type: 'multiple_choice',
      text: 'What is your primary role in AI decision-making within your organization?',
      description: 'This helps us understand your level of authority and influence in AI initiatives.',
      options: [
        { id: 'sa_001_1', text: 'I make final decisions on AI investments and strategy', value: 10, weight: 1.0 },
        { id: 'sa_001_2', text: 'I significantly influence AI strategy and resource allocation', value: 8, weight: 1.0 },
        { id: 'sa_001_3', text: 'I contribute to AI discussions and provide input', value: 6, weight: 1.0 },
        { id: 'sa_001_4', text: 'I implement AI decisions made by others', value: 4, weight: 1.0 },
        { id: 'sa_001_5', text: 'I observe AI developments but have limited input', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your role in AI decision-making' }
      ],
      dimension: 'strategic_authority',
      weight: 1.2,
      order: 1
    },
    {
      id: 'sa_002',
      type: 'scale_rating',
      text: 'How much influence do you have over your organization\'s strategic direction?',
      description: 'Consider your ability to shape long-term goals, resource allocation, and major initiatives.',
      options: [
        { id: 'scale_1', text: 'No influence', value: 1 },
        { id: 'scale_2', text: 'Minimal influence', value: 2 },
        { id: 'scale_3', text: 'Some influence', value: 3 },
        { id: 'scale_4', text: 'Moderate influence', value: 4 },
        { id: 'scale_5', text: 'Significant influence', value: 5 },
        { id: 'scale_6', text: 'Strong influence', value: 6 },
        { id: 'scale_7', text: 'Very strong influence', value: 7 },
        { id: 'scale_8', text: 'Major influence', value: 8 },
        { id: 'scale_9', text: 'Dominant influence', value: 9 },
        { id: 'scale_10', text: 'Complete control', value: 10 }
      ],
      validation: [
        { type: 'required', message: 'Please rate your strategic influence' },
        { type: 'range', min: 1, max: 10, message: 'Rating must be between 1 and 10' }
      ],
      dimension: 'strategic_authority',
      weight: 1.0,
      order: 2
    },
    {
      id: 'sa_003',
      type: 'multiple_choice',
      text: 'When your organization faces major strategic decisions, what is your typical involvement?',
      description: 'Think about recent major decisions like budget allocation, new initiatives, or strategic partnerships.',
      options: [
        { id: 'sa_003_1', text: 'I lead the decision-making process and final approval', value: 10, weight: 1.0 },
        { id: 'sa_003_2', text: 'I\'m a key stakeholder consulted throughout the process', value: 8, weight: 1.0 },
        { id: 'sa_003_3', text: 'I provide input when asked but don\'t drive decisions', value: 6, weight: 1.0 },
        { id: 'sa_003_4', text: 'I\'m informed of decisions but rarely consulted', value: 4, weight: 1.0 },
        { id: 'sa_003_5', text: 'I learn about decisions after they\'re made', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your involvement level' }
      ],
      dimension: 'strategic_authority',
      weight: 1.1,
      order: 3
    }
  ],

  // Organizational Influence Dimension (20% weight)
  organizational_influence: [
    {
      id: 'oi_001',
      type: 'multiple_choice',
      text: 'How many people report to you directly or indirectly?',
      description: 'Include both direct reports and those who report to your direct reports.',
      options: [
        { id: 'oi_001_1', text: 'More than 100 people', value: 10, weight: 1.0 },
        { id: 'oi_001_2', text: '50-100 people', value: 9, weight: 1.0 },
        { id: 'oi_001_3', text: '20-49 people', value: 8, weight: 1.0 },
        { id: 'oi_001_4', text: '10-19 people', value: 7, weight: 1.0 },
        { id: 'oi_001_5', text: '5-9 people', value: 6, weight: 1.0 },
        { id: 'oi_001_6', text: '1-4 people', value: 4, weight: 1.0 },
        { id: 'oi_001_7', text: 'No direct reports', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your team size' }
      ],
      dimension: 'organizational_influence',
      weight: 1.0,
      order: 4
    },
    {
      id: 'oi_002',
      type: 'scale_rating',
      text: 'How effectively can you drive change across departments in your organization?',
      description: 'Consider your ability to influence other departments, secure cross-functional buy-in, and implement organization-wide initiatives.',
      options: [
        { id: 'scale_1', text: 'Cannot drive cross-departmental change', value: 1 },
        { id: 'scale_10', text: 'Can easily drive organization-wide change', value: 10 }
      ],
      validation: [
        { type: 'required', message: 'Please rate your change influence' },
        { type: 'range', min: 1, max: 10, message: 'Rating must be between 1 and 10' }
      ],
      dimension: 'organizational_influence',
      weight: 1.2,
      order: 5
    },
    {
      id: 'oi_003',
      type: 'multiple_choice',
      text: 'When you propose new initiatives, what typically happens?',
      description: 'Think about your recent proposals for new projects, processes, or strategic changes.',
      options: [
        { id: 'oi_003_1', text: 'They are usually approved and implemented quickly', value: 10, weight: 1.0 },
        { id: 'oi_003_2', text: 'They receive serious consideration and often move forward', value: 8, weight: 1.0 },
        { id: 'oi_003_3', text: 'They are reviewed but implementation is slow', value: 6, weight: 1.0 },
        { id: 'oi_003_4', text: 'They are acknowledged but rarely implemented', value: 4, weight: 1.0 },
        { id: 'oi_003_5', text: 'They are often dismissed or ignored', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select what typically happens to your proposals' }
      ],
      dimension: 'organizational_influence',
      weight: 1.1,
      order: 6
    }
  ],

  // Resource Availability Dimension (20% weight)
  resource_availability: [
    {
      id: 'ra_001',
      type: 'multiple_choice',
      text: 'What is your annual budget authority for new initiatives or technology investments?',
      description: 'Consider the maximum amount you can approve without additional authorization.',
      options: [
        { id: 'ra_001_1', text: 'More than $1 million', value: 10, weight: 1.0 },
        { id: 'ra_001_2', text: '$500K - $1 million', value: 9, weight: 1.0 },
        { id: 'ra_001_3', text: '$100K - $500K', value: 8, weight: 1.0 },
        { id: 'ra_001_4', text: '$50K - $100K', value: 7, weight: 1.0 },
        { id: 'ra_001_5', text: '$10K - $50K', value: 6, weight: 1.0 },
        { id: 'ra_001_6', text: '$1K - $10K', value: 4, weight: 1.0 },
        { id: 'ra_001_7', text: 'Less than $1K or no budget authority', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your budget authority level' }
      ],
      dimension: 'resource_availability',
      weight: 1.2,
      order: 7
    },
    {
      id: 'ra_002',
      type: 'scale_rating',
      text: 'How easily can you access skilled technical talent for AI initiatives?',
      description: 'Consider your ability to hire, contract, or reassign technical resources for AI projects.',
      options: [
        { id: 'scale_1', text: 'Very difficult - no access to technical talent', value: 1 },
        { id: 'scale_10', text: 'Very easy - can quickly access top AI talent', value: 10 }
      ],
      validation: [
        { type: 'required', message: 'Please rate your access to technical talent' },
        { type: 'range', min: 1, max: 10, message: 'Rating must be between 1 and 10' }
      ],
      dimension: 'resource_availability',
      weight: 1.1,
      order: 8
    },
    {
      id: 'ra_003',
      type: 'multiple_choice',
      text: 'How would you describe your organization\'s current data infrastructure?',
      description: 'Consider data quality, accessibility, storage systems, and analytics capabilities.',
      options: [
        { id: 'ra_003_1', text: 'Advanced - comprehensive data platform with AI-ready infrastructure', value: 10, weight: 1.0 },
        { id: 'ra_003_2', text: 'Good - solid data systems with some AI capabilities', value: 8, weight: 1.0 },
        { id: 'ra_003_3', text: 'Adequate - basic data systems that could support AI with investment', value: 6, weight: 1.0 },
        { id: 'ra_003_4', text: 'Limited - fragmented data systems requiring significant upgrades', value: 4, weight: 1.0 },
        { id: 'ra_003_5', text: 'Poor - minimal data infrastructure, major investment needed', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please describe your data infrastructure' }
      ],
      dimension: 'resource_availability',
      weight: 1.0,
      order: 9
    }
  ],

  // Implementation Readiness Dimension (25% weight)
  implementation_readiness: [
    {
      id: 'ir_001',
      type: 'scale_rating',
      text: 'How would you rate your organization\'s overall AI readiness?',
      description: 'Consider factors like leadership support, technical capabilities, data quality, and change management capacity.',
      options: [
        { id: 'scale_1', text: 'Not ready at all', value: 1 },
        { id: 'scale_10', text: 'Fully ready to implement AI at scale', value: 10 }
      ],
      validation: [
        { type: 'required', message: 'Please rate your organization\'s AI readiness' },
        { type: 'range', min: 1, max: 10, message: 'Rating must be between 1 and 10' }
      ],
      dimension: 'implementation_readiness',
      weight: 1.3,
      order: 10
    },
    {
      id: 'ir_002',
      type: 'multiple_choice',
      text: 'What is your organization\'s current stage of AI adoption?',
      description: 'Select the option that best describes where your organization stands today.',
      options: [
        { id: 'ir_002_1', text: 'Advanced - AI is integrated across multiple business functions', value: 10, weight: 1.0 },
        { id: 'ir_002_2', text: 'Scaling - successful pilots being expanded organization-wide', value: 8, weight: 1.0 },
        { id: 'ir_002_3', text: 'Piloting - running initial AI projects and experiments', value: 6, weight: 1.0 },
        { id: 'ir_002_4', text: 'Planning - developing AI strategy and identifying use cases', value: 4, weight: 1.0 },
        { id: 'ir_002_5', text: 'Exploring - early research and education phase', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your AI adoption stage' }
      ],
      dimension: 'implementation_readiness',
      weight: 1.2,
      order: 11
    },
    {
      id: 'ir_003',
      type: 'multiple_choice',
      text: 'How does your leadership team view AI investment?',
      description: 'Consider the overall attitude and commitment level of your C-suite and board.',
      options: [
        { id: 'ir_003_1', text: 'Highly supportive - AI is a top strategic priority with committed funding', value: 10, weight: 1.0 },
        { id: 'ir_003_2', text: 'Supportive - generally positive with allocated resources', value: 8, weight: 1.0 },
        { id: 'ir_003_3', text: 'Cautiously interested - willing to explore with limited investment', value: 6, weight: 1.0 },
        { id: 'ir_003_4', text: 'Skeptical - requires significant convincing and proof of ROI', value: 4, weight: 1.0 },
        { id: 'ir_003_5', text: 'Resistant - views AI as risky or unnecessary', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select leadership\'s view on AI investment' }
      ],
      dimension: 'implementation_readiness',
      weight: 1.1,
      order: 12
    },
    {
      id: 'ir_004',
      type: 'scale_rating',
      text: 'How quickly can your organization typically implement new technology initiatives?',
      description: 'Think about your organization\'s track record with technology adoption and change management.',
      options: [
        { id: 'scale_1', text: 'Very slow - takes years to implement new technology', value: 1 },
        { id: 'scale_10', text: 'Very fast - can implement new technology in weeks', value: 10 }
      ],
      validation: [
        { type: 'required', message: 'Please rate your implementation speed' },
        { type: 'range', min: 1, max: 10, message: 'Rating must be between 1 and 10' }
      ],
      dimension: 'implementation_readiness',
      weight: 1.0,
      order: 13
    }
  ],

  // Cultural Alignment Dimension (15% weight)
  cultural_alignment: [
    {
      id: 'ca_001',
      type: 'scale_rating',
      text: 'How open is your organization\'s culture to innovation and change?',
      description: 'Consider how your organization typically responds to new ideas, technologies, and ways of working.',
      options: [
        { id: 'scale_1', text: 'Very resistant to change', value: 1 },
        { id: 'scale_10', text: 'Highly innovative and change-embracing', value: 10 }
      ],
      validation: [
        { type: 'required', message: 'Please rate your organization\'s openness to change' },
        { type: 'range', min: 1, max: 10, message: 'Rating must be between 1 and 10' }
      ],
      dimension: 'cultural_alignment',
      weight: 1.2,
      order: 14
    },
    {
      id: 'ca_002',
      type: 'multiple_choice',
      text: 'How do employees typically react to new technology implementations?',
      description: 'Think about recent technology rollouts and the general employee response.',
      options: [
        { id: 'ca_002_1', text: 'Enthusiastic adoption - employees actively embrace new technology', value: 10, weight: 1.0 },
        { id: 'ca_002_2', text: 'Positive reception - generally supportive with some early adopters', value: 8, weight: 1.0 },
        { id: 'ca_002_3', text: 'Mixed response - some embrace, others resist', value: 6, weight: 1.0 },
        { id: 'ca_002_4', text: 'Cautious acceptance - eventual adoption after initial resistance', value: 4, weight: 1.0 },
        { id: 'ca_002_5', text: 'Strong resistance - significant pushback and slow adoption', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select typical employee reaction to new technology' }
      ],
      dimension: 'cultural_alignment',
      weight: 1.1,
      order: 15
    },
    {
      id: 'ca_003',
      type: 'multiple_choice',
      text: 'What is your organization\'s approach to learning and development?',
      description: 'Consider investment in training, upskilling programs, and support for continuous learning.',
      options: [
        { id: 'ca_003_1', text: 'Comprehensive - strong investment in continuous learning and development', value: 10, weight: 1.0 },
        { id: 'ca_003_2', text: 'Good - regular training programs and development opportunities', value: 8, weight: 1.0 },
        { id: 'ca_003_3', text: 'Adequate - basic training with some development support', value: 6, weight: 1.0 },
        { id: 'ca_003_4', text: 'Limited - minimal training, mostly on-the-job learning', value: 4, weight: 1.0 },
        { id: 'ca_003_5', text: 'Poor - little to no investment in employee development', value: 2, weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your organization\'s learning approach' }
      ],
      dimension: 'cultural_alignment',
      weight: 1.0,
      order: 16
    }
  ]
};

// Industry-specific questions that are added based on user profile
const industrySpecificQuestions = {
  financial: [
    {
      id: 'fin_001',
      type: 'multiple_choice',
      text: 'What are your primary regulatory concerns regarding AI implementation?',
      description: 'Consider compliance requirements specific to financial services.',
      options: [
        { id: 'fin_001_1', text: 'Data privacy and customer protection regulations', value: 'privacy', weight: 1.0 },
        { id: 'fin_001_2', text: 'Algorithmic bias and fair lending requirements', value: 'bias', weight: 1.0 },
        { id: 'fin_001_3', text: 'Model explainability and audit requirements', value: 'explainability', weight: 1.0 },
        { id: 'fin_001_4', text: 'Risk management and capital adequacy', value: 'risk', weight: 1.0 },
        { id: 'fin_001_5', text: 'All of the above', value: 'all', weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your primary regulatory concerns' }
      ],
      dimension: 'industry_context',
      weight: 1.0,
      order: 17
    }
  ],
  healthcare: [
    {
      id: 'hc_001',
      type: 'multiple_choice',
      text: 'What are your primary considerations for AI in healthcare?',
      description: 'Consider patient safety, regulatory compliance, and clinical effectiveness.',
      options: [
        { id: 'hc_001_1', text: 'Patient safety and clinical validation', value: 'safety', weight: 1.0 },
        { id: 'hc_001_2', text: 'HIPAA compliance and data security', value: 'compliance', weight: 1.0 },
        { id: 'hc_001_3', text: 'FDA approval and regulatory pathways', value: 'regulatory', weight: 1.0 },
        { id: 'hc_001_4', text: 'Clinical workflow integration', value: 'workflow', weight: 1.0 },
        { id: 'hc_001_5', text: 'All of the above', value: 'all', weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your primary healthcare AI considerations' }
      ],
      dimension: 'industry_context',
      weight: 1.0,
      order: 17
    }
  ],
  manufacturing: [
    {
      id: 'mfg_001',
      type: 'multiple_choice',
      text: 'What are your primary AI opportunities in manufacturing?',
      description: 'Consider operational efficiency, quality control, and predictive maintenance.',
      options: [
        { id: 'mfg_001_1', text: 'Predictive maintenance and equipment optimization', value: 'maintenance', weight: 1.0 },
        { id: 'mfg_001_2', text: 'Quality control and defect detection', value: 'quality', weight: 1.0 },
        { id: 'mfg_001_3', text: 'Supply chain optimization', value: 'supply_chain', weight: 1.0 },
        { id: 'mfg_001_4', text: 'Production planning and scheduling', value: 'planning', weight: 1.0 },
        { id: 'mfg_001_5', text: 'All of the above', value: 'all', weight: 1.0 }
      ],
      validation: [
        { type: 'required', message: 'Please select your primary manufacturing AI opportunities' }
      ],
      dimension: 'industry_context',
      weight: 1.0,
      order: 17
    }
  ]
};

// Persona classification logic
const personaClassification = {
  strategic_architect: {
    criteria: {
      strategic_authority: { min: 80, weight: 0.3 },
      organizational_influence: { min: 75, weight: 0.25 },
      resource_availability: { min: 70, weight: 0.2 },
      implementation_readiness: { min: 75, weight: 0.25 }
    },
    title: 'Strategic Architect',
    description: 'High-authority leader with strong implementation capabilities and significant organizational influence.',
    characteristics: [
      'Strategic vision and planning',
      'Organizational transformation leadership',
      'Resource allocation authority',
      'Change management expertise'
    ],
    recommendations: {
      program: 'mastery',
      timeline: '12-16 weeks',
      investment: '$15,000 - $25,000'
    }
  },
  strategic_catalyst: {
    criteria: {
      strategic_authority: { min: 60, weight: 0.25 },
      organizational_influence: { min: 70, weight: 0.3 },
      resource_availability: { min: 50, weight: 0.2 },
      implementation_readiness: { min: 65, weight: 0.25 }
    },
    title: 'Strategic Catalyst',
    description: 'Influential leader who drives change and innovation across the organization.',
    characteristics: [
      'Change leadership and influence',
      'Cross-functional collaboration',
      'Innovation advocacy',
      'Team mobilization'
    ],
    recommendations: {
      program: 'amplification',
      timeline: '8-12 weeks',
      investment: '$7,500 - $15,000'
    }
  },
  strategic_contributor: {
    criteria: {
      strategic_authority: { min: 40, weight: 0.2 },
      organizational_influence: { min: 40, weight: 0.2 },
      resource_availability: { min: 30, weight: 0.3 },
      implementation_readiness: { min: 50, weight: 0.3 }
    },
    title: 'Strategic Contributor',
    description: 'Capable professional ready to contribute to AI initiatives with proper support.',
    characteristics: [
      'Tactical implementation skills',
      'Process optimization focus',
      'Team coordination abilities',
      'Learning orientation'
    ],
    recommendations: {
      program: 'foundation',
      timeline: '6-8 weeks',
      investment: '$2,500 - $7,500'
    }
  },
  strategic_explorer: {
    criteria: {
      strategic_authority: { min: 20, weight: 0.2 },
      organizational_influence: { min: 20, weight: 0.2 },
      resource_availability: { min: 10, weight: 0.3 },
      implementation_readiness: { min: 30, weight: 0.3 }
    },
    title: 'Strategic Explorer',
    description: 'Emerging leader building AI knowledge and strategic thinking capabilities.',
    characteristics: [
      'Learning and development focus',
      'Future-oriented thinking',
      'Skill building commitment',
      'Growth mindset'
    ],
    recommendations: {
      program: 'foundation',
      timeline: '4-6 weeks',
      investment: '$2,500 - $5,000'
    }
  },
  strategic_observer: {
    criteria: {
      // Default category for those who don't meet other criteria
    },
    title: 'Strategic Observer',
    description: 'Professional interested in AI developments with potential for future engagement.',
    characteristics: [
      'Awareness and interest in AI',
      'Information gathering focus',
      'Future preparation mindset',
      'Selective engagement approach'
    ],
    recommendations: {
      program: 'consultation',
      timeline: '2-4 weeks',
      investment: 'Free - $2,500'
    }
  }
};

module.exports = {
  assessmentQuestions,
  industrySpecificQuestions,
  personaClassification
};
