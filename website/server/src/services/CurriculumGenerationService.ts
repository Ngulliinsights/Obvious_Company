/**
 * Curriculum Generation Service
 * Creates personalized learning pathways based on assessment results
 * Requirements: 6.1, 6.2, 6.3, 6.4
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  CurriculumRecommendation,
  Module,
  PersonaType,
  AssessmentResults,
  UserProfile
} from '../types/assessment';

export class CurriculumGenerationService {

  /**
   * Generate personalized curriculum based on assessment results
   */
  async generateCurriculum(
    assessmentResults: AssessmentResults,
    userProfile?: Partial<UserProfile>
  ): Promise<CurriculumRecommendation> {
    
    const persona = assessmentResults.persona_classification.primary_persona;
    const industry = userProfile?.professional?.industry || 'general';
    const roleLevel = userProfile?.professional?.role_level || 'mid';
    
    // Get foundation modules (required for all)
    const foundationModules = this.getFoundationModules();
    
    // Get industry-specific modules
    const industryModules = this.getIndustryModules(industry);
    
    // Get role-specific modules
    const roleSpecificModules = this.getRoleSpecificModules(roleLevel, persona);
    
    // Get cultural adaptation modules
    const culturalModules = this.getCulturalAdaptationModules(
      userProfile?.demographics?.cultural_context || []
    );
    
    // Calculate duration estimates
    const totalHours = this.calculateTotalHours([
      ...foundationModules,
      ...industryModules,
      ...roleSpecificModules,
      ...culturalModules
    ]);
    
    const weeklyCommitment = this.getRecommendedWeeklyCommitment(persona);
    const completionTimeline = this.calculateCompletionTimeline(totalHours, weeklyCommitment);
    
    return {
      pathway_id: uuidv4(),
      foundation_modules: foundationModules,
      industry_modules: industryModules,
      role_specific_modules: roleSpecificModules,
      cultural_adaptation_modules: culturalModules,
      estimated_duration: {
        total_hours: totalHours,
        weekly_commitment: weeklyCommitment,
        completion_timeline: completionTimeline
      },
      learning_objectives: this.getLearningObjectives(persona, industry),
      success_metrics: this.getSuccessMetrics(persona),
      prerequisites: this.getPrerequisites(persona),
      optional_enhancements: this.getOptionalEnhancements(assessmentResults)
    };
  }

  /**
   * Get foundation modules required for all learners
   */
  private getFoundationModules(): Module[] {
    return [
      {
        id: uuidv4(),
        title: "Strategic AI Fundamentals",
        description: "Core concepts of AI as strategic intelligence amplification rather than automation",
        duration_hours: 4,
        difficulty_level: 'beginner',
        learning_objectives: [
          "Understand AI as strategic intelligence amplification",
          "Distinguish between automation and strategic AI applications",
          "Identify strategic AI opportunities in your context"
        ],
        prerequisites: [],
        content_type: 'interactive'
      },
      {
        id: uuidv4(),
        title: "Strategic Decision-Making Framework",
        description: "Framework for making strategic decisions about AI integration",
        duration_hours: 3,
        difficulty_level: 'intermediate',
        learning_objectives: [
          "Apply strategic decision-making frameworks to AI initiatives",
          "Evaluate AI opportunities using strategic criteria",
          "Balance risk and opportunity in AI investments"
        ],
        prerequisites: ["Strategic AI Fundamentals"],
        content_type: 'workshop'
      },
      {
        id: uuidv4(),
        title: "Human-AI Collaboration Principles",
        description: "Best practices for effective human-AI collaboration",
        duration_hours: 3,
        difficulty_level: 'intermediate',
        learning_objectives: [
          "Design effective human-AI collaboration workflows",
          "Understand cognitive augmentation principles",
          "Implement collaborative AI systems"
        ],
        prerequisites: ["Strategic AI Fundamentals"],
        content_type: 'interactive'
      },
      {
        id: uuidv4(),
        title: "Change Management for AI Integration",
        description: "Managing organizational change during AI transformation",
        duration_hours: 4,
        difficulty_level: 'intermediate',
        learning_objectives: [
          "Plan and execute AI-driven organizational change",
          "Address resistance and build buy-in for AI initiatives",
          "Create sustainable AI adoption practices"
        ],
        prerequisites: ["Strategic Decision-Making Framework"],
        content_type: 'workshop'
      }
    ];
  }

  /**
   * Get industry-specific modules
   */
  private getIndustryModules(industry: string): Module[] {
    const industryModules: { [key: string]: Module[] } = {
      'financial_services': [
        {
          id: uuidv4(),
          title: "AI in Financial Services: Regulatory Navigation",
          description: "Implementing AI while maintaining regulatory compliance",
          duration_hours: 3,
          difficulty_level: 'advanced',
          learning_objectives: [
            "Navigate financial services AI regulations",
            "Implement compliant AI systems",
            "Balance innovation with regulatory requirements"
          ],
          prerequisites: ["Strategic AI Fundamentals"],
          content_type: 'text',
          industry_focus: 'financial_services'
        },
        {
          id: uuidv4(),
          title: "Risk Modeling and AI Analytics",
          description: "Advanced AI applications for financial risk assessment",
          duration_hours: 4,
          difficulty_level: 'advanced',
          learning_objectives: [
            "Implement AI-driven risk models",
            "Enhance decision-making with predictive analytics",
            "Integrate AI into existing risk frameworks"
          ],
          prerequisites: ["Strategic Decision-Making Framework"],
          content_type: 'interactive',
          industry_focus: 'financial_services'
        }
      ],
      'manufacturing': [
        {
          id: uuidv4(),
          title: "Supply Chain Intelligence with AI",
          description: "Optimizing manufacturing supply chains using AI",
          duration_hours: 4,
          difficulty_level: 'intermediate',
          learning_objectives: [
            "Implement AI-driven supply chain optimization",
            "Predict and prevent supply chain disruptions",
            "Integrate AI with existing manufacturing systems"
          ],
          prerequisites: ["Strategic AI Fundamentals"],
          content_type: 'interactive',
          industry_focus: 'manufacturing'
        },
        {
          id: uuidv4(),
          title: "Predictive Maintenance Strategies",
          description: "Using AI for predictive maintenance and asset optimization",
          duration_hours: 3,
          difficulty_level: 'intermediate',
          learning_objectives: [
            "Design predictive maintenance systems",
            "Optimize asset lifecycle management",
            "Reduce downtime through AI-driven insights"
          ],
          prerequisites: ["Human-AI Collaboration Principles"],
          content_type: 'workshop',
          industry_focus: 'manufacturing'
        }
      ],
      'healthcare': [
        {
          id: uuidv4(),
          title: "Ethical AI in Healthcare",
          description: "Implementing AI in healthcare with strong ethical frameworks",
          duration_hours: 4,
          difficulty_level: 'advanced',
          learning_objectives: [
            "Apply ethical frameworks to healthcare AI",
            "Ensure patient privacy and data protection",
            "Balance AI efficiency with human care"
          ],
          prerequisites: ["Strategic AI Fundamentals"],
          content_type: 'text',
          industry_focus: 'healthcare'
        }
      ],
      'government': [
        {
          id: uuidv4(),
          title: "Transparent AI for Public Service",
          description: "Implementing transparent and accountable AI in government",
          duration_hours: 4,
          difficulty_level: 'advanced',
          learning_objectives: [
            "Design transparent AI systems for public use",
            "Ensure accountability in government AI applications",
            "Balance efficiency with democratic values"
          ],
          prerequisites: ["Strategic AI Fundamentals"],
          content_type: 'workshop',
          industry_focus: 'government'
        }
      ]
    };

    return industryModules[industry] || [];
  }

  /**
   * Get role-specific modules based on leadership level and persona
   */
  private getRoleSpecificModules(roleLevel: string, persona: PersonaType): Module[] {
    const modules: Module[] = [];

    // Executive-level modules
    if (roleLevel === 'executive' || persona === PersonaType.STRATEGIC_ARCHITECT) {
      modules.push({
        id: uuidv4(),
        title: "Executive AI Strategy Development",
        description: "Developing enterprise-wide AI strategies and governance",
        duration_hours: 5,
        difficulty_level: 'advanced',
        learning_objectives: [
          "Develop comprehensive AI strategies",
          "Establish AI governance frameworks",
          "Lead enterprise AI transformation"
        ],
        prerequisites: ["Strategic Decision-Making Framework"],
        content_type: 'workshop'
      });
    }

    // Management-level modules
    if (roleLevel === 'manager' || persona === PersonaType.STRATEGIC_CATALYST) {
      modules.push({
        id: uuidv4(),
        title: "AI Team Leadership and Development",
        description: "Leading teams through AI adoption and capability building",
        duration_hours: 4,
        difficulty_level: 'intermediate',
        learning_objectives: [
          "Lead AI adoption initiatives",
          "Develop team AI capabilities",
          "Manage AI project portfolios"
        ],
        prerequisites: ["Change Management for AI Integration"],
        content_type: 'workshop'
      });
    }

    // Individual contributor modules
    if (roleLevel === 'individual' || persona === PersonaType.STRATEGIC_CONTRIBUTOR) {
      modules.push({
        id: uuidv4(),
        title: "Practical AI Implementation",
        description: "Hands-on implementation of AI solutions in specific contexts",
        duration_hours: 6,
        difficulty_level: 'intermediate',
        learning_objectives: [
          "Implement specific AI solutions",
          "Integrate AI into existing workflows",
          "Measure and optimize AI performance"
        ],
        prerequisites: ["Human-AI Collaboration Principles"],
        content_type: 'interactive'
      });
    }

    return modules;
  }

  /**
   * Get cultural adaptation modules
   */
  private getCulturalAdaptationModules(culturalContext: string[]): Module[] {
    const modules: Module[] = [];

    if (culturalContext.includes('east_africa') || culturalContext.includes('kenya')) {
      modules.push({
        id: uuidv4(),
        title: "AI in East African Business Context",
        description: "Adapting AI strategies for East African business environments",
        duration_hours: 2,
        difficulty_level: 'beginner',
        learning_objectives: [
          "Understand regional AI opportunities and challenges",
          "Adapt AI strategies for local market conditions",
          "Leverage regional strengths in AI implementation"
        ],
        prerequisites: [],
        content_type: 'text',
        cultural_adaptations: ['east_africa', 'kenya']
      });
    }

    return modules;
  }

  /**
   * Calculate total hours for all modules
   */
  private calculateTotalHours(modules: Module[]): number {
    return modules.reduce((total, module) => total + module.duration_hours, 0);
  }

  /**
   * Get recommended weekly commitment based on persona
   */
  private getRecommendedWeeklyCommitment(persona: PersonaType): number {
    const commitmentMap: { [key in PersonaType]: number } = {
      [PersonaType.STRATEGIC_ARCHITECT]: 3, // Executives: 3 hours/week
      [PersonaType.STRATEGIC_CATALYST]: 4,  // Senior leaders: 4 hours/week
      [PersonaType.STRATEGIC_CONTRIBUTOR]: 5, // Department leaders: 5 hours/week
      [PersonaType.STRATEGIC_EXPLORER]: 6,   // Emerging leaders: 6 hours/week
      [PersonaType.STRATEGIC_OBSERVER]: 3    // Specialists: 3 hours/week
    };

    return commitmentMap[persona];
  }

  /**
   * Calculate completion timeline
   */
  private calculateCompletionTimeline(totalHours: number, weeklyCommitment: number): string {
    const weeks = Math.ceil(totalHours / weeklyCommitment);
    
    if (weeks <= 4) {
      return "1 month";
    } else if (weeks <= 8) {
      return "2 months";
    } else if (weeks <= 12) {
      return "3 months";
    } else if (weeks <= 24) {
      return `${Math.ceil(weeks / 4)} months`;
    } else {
      return `${Math.ceil(weeks / 12)} months`;
    }
  }

  /**
   * Get learning objectives based on persona and industry
   */
  private getLearningObjectives(persona: PersonaType, industry: string): string[] {
    const baseObjectives = [
      "Understand AI as strategic intelligence amplification",
      "Develop strategic decision-making capabilities for AI initiatives",
      "Implement effective human-AI collaboration practices"
    ];

    const personaObjectives: { [key in PersonaType]: string[] } = {
      [PersonaType.STRATEGIC_ARCHITECT]: [
        "Lead enterprise-wide AI transformation",
        "Establish AI governance and strategic frameworks",
        "Drive competitive advantage through strategic AI implementation"
      ],
      [PersonaType.STRATEGIC_CATALYST]: [
        "Champion AI adoption across organizational functions",
        "Build and lead high-performing AI teams",
        "Manage complex AI project portfolios"
      ],
      [PersonaType.STRATEGIC_CONTRIBUTOR]: [
        "Implement tactical AI solutions within defined scope",
        "Optimize departmental processes through AI integration",
        "Measure and improve AI solution performance"
      ],
      [PersonaType.STRATEGIC_EXPLORER]: [
        "Build foundational AI knowledge and capabilities",
        "Identify AI opportunities within current role",
        "Develop skills for future AI leadership roles"
      ],
      [PersonaType.STRATEGIC_OBSERVER]: [
        "Understand AI implications for current role and industry",
        "Assess organizational AI readiness and opportunities",
        "Make informed recommendations about AI initiatives"
      ]
    };

    return [...baseObjectives, ...personaObjectives[persona]];
  }

  /**
   * Get success metrics for curriculum completion
   */
  private getSuccessMetrics(persona: PersonaType): string[] {
    const baseMetrics = [
      "Complete all required modules with 80% or higher assessment scores",
      "Successfully apply learned frameworks to real-world scenarios",
      "Demonstrate understanding through practical project completion"
    ];

    const personaMetrics: { [key in PersonaType]: string[] } = {
      [PersonaType.STRATEGIC_ARCHITECT]: [
        "Develop and present comprehensive AI strategy for organization",
        "Establish measurable AI governance framework",
        "Lead successful pilot AI initiative"
      ],
      [PersonaType.STRATEGIC_CATALYST]: [
        "Successfully lead cross-functional AI adoption project",
        "Build and mentor AI-capable team",
        "Achieve measurable improvements in team AI utilization"
      ],
      [PersonaType.STRATEGIC_CONTRIBUTOR]: [
        "Implement functional AI solution with measurable ROI",
        "Optimize existing process through AI integration",
        "Train team members on AI tool utilization"
      ],
      [PersonaType.STRATEGIC_EXPLORER]: [
        "Complete capstone project demonstrating AI application",
        "Present AI opportunity assessment to leadership",
        "Develop personal AI capability development plan"
      ],
      [PersonaType.STRATEGIC_OBSERVER]: [
        "Complete comprehensive AI readiness assessment",
        "Provide informed AI recommendations to stakeholders",
        "Demonstrate understanding of AI implications for role/industry"
      ]
    };

    return [...baseMetrics, ...personaMetrics[persona]];
  }

  /**
   * Get prerequisites based on persona
   */
  private getPrerequisites(persona: PersonaType): string[] {
    const commonPrerequisites = [
      "Basic understanding of business strategy",
      "Familiarity with organizational change processes"
    ];

    const personaPrerequisites: { [key in PersonaType]: string[] } = {
      [PersonaType.STRATEGIC_ARCHITECT]: [
        "Executive leadership experience",
        "Strategic planning and governance experience"
      ],
      [PersonaType.STRATEGIC_CATALYST]: [
        "Team leadership experience",
        "Cross-functional project management experience"
      ],
      [PersonaType.STRATEGIC_CONTRIBUTOR]: [
        "Departmental management experience",
        "Process improvement experience"
      ],
      [PersonaType.STRATEGIC_EXPLORER]: [
        "Professional work experience",
        "Interest in emerging technologies"
      ],
      [PersonaType.STRATEGIC_OBSERVER]: [
        "Professional expertise in relevant field",
        "Analytical thinking capabilities"
      ]
    };

    return [...commonPrerequisites, ...personaPrerequisites[persona]];
  }

  /**
   * Get optional enhancement modules based on assessment results
   */
  private getOptionalEnhancements(assessmentResults: AssessmentResults): Module[] {
    const enhancements: Module[] = [];

    // Add advanced modules for high-scoring participants
    if (assessmentResults.overall_score >= 80) {
      enhancements.push({
        id: uuidv4(),
        title: "Advanced AI Strategy and Innovation",
        description: "Cutting-edge AI applications and strategic innovation",
        duration_hours: 6,
        difficulty_level: 'advanced',
        learning_objectives: [
          "Explore emerging AI technologies and applications",
          "Develop innovative AI solutions",
          "Lead AI innovation initiatives"
        ],
        prerequisites: ["Executive AI Strategy Development"],
        content_type: 'workshop'
      });
    }

    // Add technical modules for implementation-focused personas
    if (assessmentResults.persona_classification.primary_persona === PersonaType.STRATEGIC_CONTRIBUTOR) {
      enhancements.push({
        id: uuidv4(),
        title: "Technical AI Implementation Deep Dive",
        description: "Technical aspects of AI system implementation and integration",
        duration_hours: 8,
        difficulty_level: 'advanced',
        learning_objectives: [
          "Understand technical AI implementation requirements",
          "Manage AI system integration projects",
          "Troubleshoot common AI implementation challenges"
        ],
        prerequisites: ["Practical AI Implementation"],
        content_type: 'interactive'
      });
    }

    return enhancements;
  }
}