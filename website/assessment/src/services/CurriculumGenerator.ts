import { Module, PersonaType, DimensionScores, IndustryInsights } from '../models/types';
import { 
  CurriculumRecommendation, 
  LearningPathway, 
  ModuleSequence, 
  AdaptiveRule,
  AdaptiveCondition 
} from '../models/CurriculumRecommendation';

export class ModuleLibrary {
  private foundationModules: Module[] = [
    {
      id: 'UF-1E',
      title: 'AI Strategic Vision and Competitive Intelligence',
      description: 'Enhanced strategic AI understanding, competitive positioning, transformation frameworks, and real-time market intelligence analysis with micro-competency tracking.',
      estimatedHours: 1,
      prerequisites: [],
      learningObjectives: [
        'Develop strategic AI understanding beyond basic awareness',
        'Master competitive positioning through AI capabilities',
        'Create transformation frameworks for organizational change',
        'Implement real-time market intelligence analysis'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'east-africa': 'Includes regional market dynamics and local competitive landscape analysis',
        'swahili': 'Mkakati wa akili bandia na uelewa wa ushindani'
      }
    },
    {
      id: 'UF-2E',
      title: 'Implementation Planning and Advanced Risk Management',
      description: 'Sophisticated stakeholder ecosystem mapping, power dynamics assessment, and conflict resolution techniques specific to AI adoption challenges.',
      estimatedHours: 1,
      prerequisites: ['UF-1E'],
      learningObjectives: [
        'Master stakeholder ecosystem mapping for AI initiatives',
        'Assess power dynamics and organizational resistance',
        'Implement conflict resolution for technology adoption',
        'Develop comprehensive risk management frameworks'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'east-africa': 'Addresses hierarchical organizational structures and consensus-building approaches',
        'swahili': 'Mipango ya utekelezaji na usimamizi wa hatari'
      }
    },
    {
      id: 'UF-3E',
      title: 'ROI Analysis and Value Demonstration Excellence',
      description: 'Advanced financial modeling, predictive analytics for ROI forecasting, and sophisticated value communication strategies for diverse stakeholder groups.',
      estimatedHours: 1.5,
      prerequisites: ['UF-1E'],
      learningObjectives: [
        'Develop advanced ROI modeling for AI investments',
        'Master predictive analytics for forecasting',
        'Create value communication strategies',
        'Build stakeholder-specific value propositions'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'east-africa': 'Incorporates local currency considerations and regional investment patterns',
        'swahili': 'Uchambuzi wa faida na maonyesho ya thamani'
      }
    },
    {
      id: 'UF-4E',
      title: 'Strategic Communication and Transformational Change Leadership',
      description: 'Advanced stakeholder communication strategies, transformational change leadership techniques, and sophisticated resistance management approaches.',
      estimatedHours: 1.5,
      prerequisites: ['UF-2E'],
      learningObjectives: [
        'Master transformational change leadership',
        'Develop advanced communication strategies',
        'Implement resistance management techniques',
        'Build consensus for AI initiatives'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'east-africa': 'Emphasizes community-oriented leadership and collective decision-making',
        'swahili': 'Mawasiliano ya kimkakati na uongozi wa mabadiliko'
      }
    }
  ];

  private industryModules: Module[] = [
    {
      id: 'IS-1E',
      title: 'Financial Services AI Applications and Regulatory Navigation',
      description: 'Regulatory compliance strategies, advanced risk modeling, customer analytics, fraud detection, and fintech innovation patterns.',
      estimatedHours: 2,
      prerequisites: ['UF-1E', 'UF-3E'],
      learningObjectives: [
        'Navigate regulatory compliance for AI in finance',
        'Implement advanced risk modeling techniques',
        'Deploy customer analytics and fraud detection',
        'Understand fintech innovation patterns'
      ],
      industryRelevance: ['financial-services'],
      culturalAdaptations: {
        'east-africa': 'Addresses mobile money systems, microfinance, and regional banking regulations',
        'swahili': 'Matumizi ya akili bandia katika huduma za kifedha'
      }
    },
    {
      id: 'IS-2E',
      title: 'Manufacturing and Operations AI Integration',
      description: 'Process optimization, predictive maintenance, supply chain intelligence, quality control automation, and sustainability integration.',
      estimatedHours: 2,
      prerequisites: ['UF-1E', 'UF-2E'],
      learningObjectives: [
        'Optimize manufacturing processes with AI',
        'Implement predictive maintenance systems',
        'Build supply chain intelligence capabilities',
        'Integrate sustainability through AI applications'
      ],
      industryRelevance: ['manufacturing'],
      culturalAdaptations: {
        'east-africa': 'Focuses on agricultural processing, textile manufacturing, and resource optimization',
        'swahili': 'Uongezaji wa akili bandia katika uzalishaji'
      }
    },
    {
      id: 'IS-3E',
      title: 'Healthcare AI Implementation with Ethical Framework',
      description: 'Patient outcomes improvement, diagnostic support systems, service delivery optimization, and ethical AI implementation.',
      estimatedHours: 2.5,
      prerequisites: ['UF-1E', 'UF-4E'],
      learningObjectives: [
        'Improve patient outcomes through AI',
        'Implement diagnostic support systems',
        'Optimize healthcare service delivery',
        'Ensure ethical AI implementation in healthcare'
      ],
      industryRelevance: ['healthcare'],
      culturalAdaptations: {
        'east-africa': 'Addresses resource constraints, traditional medicine integration, and community health approaches',
        'swahili': 'Utekelezaji wa akili bandia katika afya'
      }
    },
    {
      id: 'IS-4E',
      title: 'Government and Public Sector AI Adoption',
      description: 'Public service delivery optimization, transparency requirements, citizen engagement enhancement, and accountability frameworks.',
      estimatedHours: 2,
      prerequisites: ['UF-1E', 'UF-4E'],
      learningObjectives: [
        'Optimize public service delivery with AI',
        'Ensure transparency in government AI use',
        'Enhance citizen engagement through technology',
        'Build public accountability mechanisms'
      ],
      industryRelevance: ['government'],
      culturalAdaptations: {
        'east-africa': 'Emphasizes digital governance, e-government initiatives, and citizen participation',
        'swahili': 'Matumizi ya akili bandia katika serikali'
      }
    }
  ];

  private roleSpecificModules: Module[] = [
    {
      id: 'RS-1E',
      title: 'Executive Leadership in AI Transformation',
      description: 'Vision setting, organizational alignment, strategic decision-making, innovation management, and transformational leadership techniques.',
      estimatedHours: 2,
      prerequisites: ['UF-1E', 'UF-4E'],
      learningObjectives: [
        'Set compelling AI transformation vision',
        'Align organization around AI strategy',
        'Make strategic AI investment decisions',
        'Lead innovation and transformation initiatives'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'east-africa': 'Incorporates Ubuntu leadership principles and collective decision-making',
        'swahili': 'Uongozi mkuu katika mabadiliko ya akili bandia'
      }
    },
    {
      id: 'RS-2E',
      title: 'Strategic Planning with AI Integration',
      description: 'Long-term strategic planning, resource allocation optimization, competitive positioning, and scenario planning techniques.',
      estimatedHours: 1.5,
      prerequisites: ['UF-1E', 'UF-3E'],
      learningObjectives: [
        'Integrate AI into long-term strategic planning',
        'Optimize resource allocation for AI initiatives',
        'Position competitively through AI capabilities',
        'Conduct AI-enhanced scenario planning'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'east-africa': 'Addresses long-term planning in dynamic economic environments',
        'swahili': 'Mipango ya kimkakati na uongezaji wa akili bandia'
      }
    },
    {
      id: 'RS-3E',
      title: 'Team Management and AI Adoption',
      description: 'Team development strategies, skill building programs, performance management systems, and organizational culture transformation.',
      estimatedHours: 1.5,
      prerequisites: ['UF-2E', 'UF-4E'],
      learningObjectives: [
        'Develop teams for AI-enhanced work',
        'Build AI-related skills across organization',
        'Manage performance in AI-augmented environments',
        'Transform organizational culture for AI adoption'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'east-africa': 'Emphasizes collective learning and mentorship traditions',
        'swahili': 'Usimamizi wa timu na kukubali akili bandia'
      }
    }
  ];

  private culturalAdaptationModules: Module[] = [
    {
      id: 'CA-1E',
      title: 'East African Business Context AI Integration',
      description: 'Regional business practices, regulatory environments, market conditions, and cultural considerations for AI implementation.',
      estimatedHours: 1,
      prerequisites: [],
      learningObjectives: [
        'Understand regional AI adoption patterns',
        'Navigate local regulatory requirements',
        'Adapt AI strategies to market conditions',
        'Respect cultural values in AI implementation'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'east-africa': 'Core module for regional context',
        'swahili': 'Muktadha wa biashara ya Afrika Mashariki'
      }
    },
    {
      id: 'CA-2E',
      title: 'Swahili Language AI Applications',
      description: 'Language-specific AI tools, multilingual communication strategies, and cultural communication patterns.',
      estimatedHours: 0.5,
      prerequisites: [],
      learningObjectives: [
        'Leverage Swahili-capable AI tools',
        'Develop multilingual AI strategies',
        'Respect cultural communication patterns',
        'Build inclusive AI solutions'
      ],
      industryRelevance: ['all'],
      culturalAdaptations: {
        'swahili': 'Matumizi ya akili bandia kwa lugha ya Kiswahili'
      }
    }
  ];

  getFoundationModules(): Module[] {
    return [...this.foundationModules];
  }

  getIndustryModules(industry?: string): Module[] {
    if (!industry) return [...this.industryModules];
    return this.industryModules.filter(module => 
      module.industryRelevance?.includes(industry) || 
      module.industryRelevance?.includes('all')
    );
  }

  getRoleSpecificModules(): Module[] {
    return [...this.roleSpecificModules];
  }

  getCulturalAdaptationModules(culturalContext?: string[]): Module[] {
    if (!culturalContext || culturalContext.length === 0) {
      return [...this.culturalAdaptationModules];
    }
    
    return this.culturalAdaptationModules.filter(module =>
      culturalContext.some(context => 
        module.culturalAdaptations && Object.keys(module.culturalAdaptations).includes(context)
      )
    );
  }

  getModuleById(id: string): Module | undefined {
    const allModules = [
      ...this.foundationModules,
      ...this.industryModules,
      ...this.roleSpecificModules,
      ...this.culturalAdaptationModules
    ];
    return allModules.find(module => module.id === id);
  }
}

export class LearningPathway {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public modules: Module[],
    public sequencing: ModuleSequence[],
    public adaptiveRules: AdaptiveRule[],
    public prerequisites: string[],
    public estimatedDuration: number,
    public targetPersonas: string[],
    public industries: string[]
  ) {}

  getNextModule(completedModules: string[]): Module | null {
    const availableSequences = this.sequencing
      .filter(seq => !completedModules.includes(seq.moduleId))
      .filter(seq => seq.prerequisites.every(prereq => completedModules.includes(prereq)))
      .sort((a, b) => a.order - b.order);

    if (availableSequences.length === 0) return null;

    const nextSequence = availableSequences[0];
    return this.modules.find(module => module.id === nextSequence.moduleId) || null;
  }

  applyAdaptiveRules(
    assessmentResults: { scores: DimensionScores; persona: PersonaType; industry: string }
  ): Module[] {
    let adaptedModules = [...this.modules];

    for (const rule of this.adaptiveRules) {
      const shouldApply = this.evaluateAdaptiveCondition(rule.condition, assessmentResults);
      
      if (shouldApply) {
        switch (rule.action) {
          case 'skip':
            adaptedModules = adaptedModules.filter(m => m.id !== rule.targetModuleId);
            break;
          case 'emphasize':
            const moduleToEmphasize = adaptedModules.find(m => m.id === rule.targetModuleId);
            if (moduleToEmphasize) {
              moduleToEmphasize.estimatedHours *= 1.5;
            }
            break;
          case 'substitute':
            if (rule.alternativeModuleId) {
              const moduleIndex = adaptedModules.findIndex(m => m.id === rule.targetModuleId);
              if (moduleIndex !== -1) {
                const library = new ModuleLibrary();
                const alternativeModule = library.getModuleById(rule.alternativeModuleId);
                if (alternativeModule) {
                  adaptedModules[moduleIndex] = alternativeModule;
                }
              }
            }
            break;
          case 'extend':
            const moduleToExtend = adaptedModules.find(m => m.id === rule.targetModuleId);
            if (moduleToExtend) {
              moduleToExtend.estimatedHours *= 2;
              moduleToExtend.learningObjectives.push('Extended learning objectives based on assessment results');
            }
            break;
        }
      }
    }

    return adaptedModules;
  }

  private evaluateAdaptiveCondition(
    condition: string,
    assessmentResults: { scores: DimensionScores; persona: PersonaType; industry: string }
  ): boolean {
    // Simple condition evaluation - in a real implementation, this would be more sophisticated
    if (condition.includes('strategic_authority_low')) {
      return assessmentResults.scores.strategicAuthority < 0.5;
    }
    if (condition.includes('implementation_readiness_high')) {
      return assessmentResults.scores.implementationReadiness > 0.8;
    }
    if (condition.includes('persona_architect')) {
      return assessmentResults.persona === 'Strategic Architect';
    }
    if (condition.includes('financial_services')) {
      return assessmentResults.industry === 'financial-services';
    }
    return false;
  }

  getTotalEstimatedHours(): number {
    return this.modules.reduce((total, module) => total + module.estimatedHours, 0);
  }

  getPrerequisiteChain(moduleId: string): string[] {
    const sequence = this.sequencing.find(seq => seq.moduleId === moduleId);
    if (!sequence) return [];

    const prerequisites = [...sequence.prerequisites];
    for (const prereq of sequence.prerequisites) {
      prerequisites.push(...this.getPrerequisiteChain(prereq));
    }

    return [...new Set(prerequisites)];
  }
}

export class CurriculumGenerator {
  private moduleLibrary: ModuleLibrary;

  constructor() {
    this.moduleLibrary = new ModuleLibrary();
  }

  generateCurriculum(
    assessmentResults: {
      scores: DimensionScores;
      persona: PersonaType;
      industry: string;
      culturalContext?: string[];
    },
    preferences: {
      timeCommitment?: number; // hours per week
      focusAreas?: string[];
      learningStyle?: string;
    } = {}
  ): CurriculumRecommendation {
    const pathwayId = this.generatePathwayId(assessmentResults, preferences);
    
    // Get base modules
    const foundationModules = this.moduleLibrary.getFoundationModules();
    const industryModules = this.moduleLibrary.getIndustryModules(assessmentResults.industry);
    const roleSpecificModules = this.selectRoleSpecificModules(assessmentResults.persona);
    const culturalAdaptationModules = this.moduleLibrary.getCulturalAdaptationModules(
      assessmentResults.culturalContext
    );

    // Create learning pathway with adaptive rules
    const pathway = this.createLearningPathway(
      pathwayId,
      foundationModules,
      industryModules,
      roleSpecificModules,
      culturalAdaptationModules,
      assessmentResults,
      preferences
    );

    // Apply adaptive rules based on assessment results
    const adaptedModules = pathway.applyAdaptiveRules(assessmentResults);

    // Calculate duration and timeline
    const totalHours = adaptedModules.reduce((sum, module) => sum + module.estimatedHours, 0);
    const weeklyCommitment = preferences.timeCommitment || this.calculateOptimalWeeklyCommitment(assessmentResults.persona);
    const completionWeeks = Math.ceil(totalHours / weeklyCommitment);

    return {
      pathwayId,
      foundationModules: foundationModules.filter(m => adaptedModules.includes(m)),
      industryModules: industryModules.filter(m => adaptedModules.includes(m)),
      roleSpecificModules: roleSpecificModules.filter(m => adaptedModules.includes(m)),
      culturalAdaptationModules: culturalAdaptationModules.filter(m => adaptedModules.includes(m)),
      estimatedDuration: {
        totalHours,
        weeklyCommitment,
        completionTimeline: `${completionWeeks} weeks`
      },
      learningObjectives: this.extractLearningObjectives(adaptedModules),
      successMetrics: this.generateSuccessMetrics(assessmentResults.persona, assessmentResults.industry),
      prerequisites: this.identifyPrerequisites(assessmentResults),
      optionalEnhancements: this.suggestOptionalEnhancements(assessmentResults, adaptedModules)
    };
  }

  private generatePathwayId(
    assessmentResults: { persona: PersonaType; industry: string },
    preferences: { focusAreas?: string[] }
  ): string {
    const personaCode = assessmentResults.persona.replace(/\s+/g, '').substring(0, 3).toUpperCase();
    const industryCode = assessmentResults.industry.substring(0, 3).toUpperCase();
    const timestamp = Date.now().toString().slice(-6);
    return `${personaCode}-${industryCode}-${timestamp}`;
  }

  private selectRoleSpecificModules(persona: PersonaType): Module[] {
    const allRoleModules = this.moduleLibrary.getRoleSpecificModules();
    
    switch (persona) {
      case 'Strategic Architect':
        return allRoleModules; // All modules for C-suite executives
      case 'Strategic Catalyst':
        return allRoleModules.filter(m => 
          m.id === 'RS-1E' || m.id === 'RS-3E' // Leadership and team management
        );
      case 'Strategic Contributor':
        return allRoleModules.filter(m => 
          m.id === 'RS-2E' || m.id === 'RS-3E' // Planning and team management
        );
      case 'Strategic Explorer':
        return allRoleModules.filter(m => m.id === 'RS-3E'); // Team management focus
      case 'Strategic Observer':
        return []; // No role-specific modules for observers
      default:
        return allRoleModules.slice(0, 2); // Default selection
    }
  }

  private createLearningPathway(
    pathwayId: string,
    foundationModules: Module[],
    industryModules: Module[],
    roleSpecificModules: Module[],
    culturalAdaptationModules: Module[],
    assessmentResults: { persona: PersonaType; industry: string },
    preferences: { focusAreas?: string[] }
  ): LearningPathway {
    const allModules = [
      ...foundationModules,
      ...industryModules,
      ...roleSpecificModules,
      ...culturalAdaptationModules
    ];

    const sequencing = this.createModuleSequencing(allModules);
    const adaptiveRules = this.createAdaptiveRules(assessmentResults);

    return new LearningPathway(
      pathwayId,
      `${assessmentResults.persona} AI Leadership Pathway`,
      `Customized AI leadership curriculum for ${assessmentResults.persona} in ${assessmentResults.industry}`,
      allModules,
      sequencing,
      adaptiveRules,
      [],
      allModules.reduce((sum, m) => sum + m.estimatedHours, 0),
      [assessmentResults.persona],
      [assessmentResults.industry]
    );
  }

  private createModuleSequencing(modules: Module[]): ModuleSequence[] {
    return modules.map((module, index) => ({
      moduleId: module.id,
      order: index + 1,
      prerequisites: module.prerequisites,
      isOptional: module.id.startsWith('CA-') || module.id.startsWith('RS-'), // Cultural and role modules are optional
      adaptiveConditions: []
    }));
  }

  private createAdaptiveRules(assessmentResults: { persona: PersonaType; industry: string }): AdaptiveRule[] {
    const rules: AdaptiveRule[] = [];

    // Add persona-specific adaptive rules
    if (assessmentResults.persona === 'Strategic Observer') {
      rules.push({
        condition: 'persona_observer',
        action: 'skip',
        targetModuleId: 'RS-1E' // Skip executive leadership for observers
      });
    }

    if (assessmentResults.persona === 'Strategic Architect') {
      rules.push({
        condition: 'persona_architect',
        action: 'emphasize',
        targetModuleId: 'UF-1E' // Emphasize strategic vision for architects
      });
    }

    // Add industry-specific adaptive rules
    if (assessmentResults.industry === 'financial-services') {
      rules.push({
        condition: 'financial_services',
        action: 'emphasize',
        targetModuleId: 'IS-1E'
      });
    }

    return rules;
  }

  private calculateOptimalWeeklyCommitment(persona: PersonaType): number {
    switch (persona) {
      case 'Strategic Architect': return 3; // C-suite executives - limited time
      case 'Strategic Catalyst': return 4; // Senior leaders - moderate time
      case 'Strategic Contributor': return 5; // Department leaders - more time
      case 'Strategic Explorer': return 6; // Emerging leaders - most time
      case 'Strategic Observer': return 2; // Specialists - minimal time
      default: return 4;
    }
  }

  private extractLearningObjectives(modules: Module[]): string[] {
    const objectives = modules.flatMap(module => module.learningObjectives);
    return [...new Set(objectives)]; // Remove duplicates
  }

  private generateSuccessMetrics(persona: PersonaType, industry: string): string[] {
    const baseMetrics = [
      'Complete all required modules within timeline',
      'Demonstrate practical application of AI concepts',
      'Develop organizational AI implementation plan'
    ];

    const personaMetrics: Record<PersonaType, string[]> = {
      'Strategic Architect': [
        'Lead successful AI transformation initiative',
        'Achieve measurable ROI from AI investments',
        'Build organizational AI capabilities'
      ],
      'Strategic Catalyst': [
        'Drive AI adoption across multiple teams',
        'Mentor others in AI implementation',
        'Create AI governance frameworks'
      ],
      'Strategic Contributor': [
        'Implement AI solutions in department',
        'Improve operational efficiency through AI',
        'Build team AI competencies'
      ],
      'Strategic Explorer': [
        'Develop personal AI proficiency',
        'Identify AI opportunities in role',
        'Contribute to organizational AI strategy'
      ],
      'Strategic Observer': [
        'Understand AI impact on role',
        'Provide informed input on AI initiatives',
        'Adapt to AI-enhanced workflows'
      ]
    };

    return [...baseMetrics, ...personaMetrics[persona]];
  }

  private identifyPrerequisites(assessmentResults: { scores: DimensionScores; persona: PersonaType }): string[] {
    const prerequisites: string[] = [];

    if (assessmentResults.scores.strategicAuthority < 0.3) {
      prerequisites.push('Basic strategic thinking and business analysis skills');
    }

    if (assessmentResults.scores.implementationReadiness < 0.4) {
      prerequisites.push('Change management and project leadership experience');
    }

    if (assessmentResults.persona === 'Strategic Observer') {
      prerequisites.push('Willingness to engage with new technology concepts');
    }

    return prerequisites;
  }

  private suggestOptionalEnhancements(
    assessmentResults: { persona: PersonaType; industry: string },
    coreModules: Module[]
  ): Module[] {
    const enhancements: Module[] = [];
    const allModules = [
      ...this.moduleLibrary.getFoundationModules(),
      ...this.moduleLibrary.getIndustryModules(),
      ...this.moduleLibrary.getRoleSpecificModules(),
      ...this.moduleLibrary.getCulturalAdaptationModules()
    ];

    // Suggest modules not in core curriculum
    const coreModuleIds = coreModules.map(m => m.id);
    const availableEnhancements = allModules.filter(m => !coreModuleIds.includes(m.id));

    // Add persona-specific enhancements
    if (assessmentResults.persona === 'Strategic Architect') {
      enhancements.push(...availableEnhancements.filter(m => 
        m.title.includes('Advanced') || m.title.includes('Strategic')
      ));
    }

    return enhancements.slice(0, 3); // Limit to 3 suggestions
  }
}