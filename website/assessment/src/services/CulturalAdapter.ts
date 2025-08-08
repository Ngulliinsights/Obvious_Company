import { UserProfile } from '../models/UserProfile';
import { Question, UserContext, AssessmentResponse } from '../models/types';
import { BiasDetectionEngine } from './BiasDetectionEngine';

export interface CulturalAdaptation {
  region: string;
  businessPractices: {
    decisionMaking: string[];
    communicationStyle: string;
    hierarchyPreferences: string;
    timeOrientation: string;
    relationshipBuilding: string[];
  };
  regulatoryConsiderations: {
    dataProtection: string[];
    businessCompliance: string[];
    industrySpecific: Record<string, string[]>;
  };
  languagePreferences: {
    formalityLevel: 'formal' | 'semi-formal' | 'casual';
    preferredTerminology: Record<string, string>;
    culturalMetaphors: string[];
  };
  economicContext: {
    currencyPreferences: string[];
    investmentPatterns: string[];
    resourceAvailability: string;
  };
}

export interface LocalizationRule {
  sourceText: string;
  adaptations: Record<string, string>;
  context: string[];
  applicableIndustries?: string[];
}

export class CulturalAdapter {
  private culturalProfiles: Map<string, CulturalAdaptation>;
  private localizationRules: LocalizationRule[];
  private biasDetectionPatterns: RegExp[];
  private biasDetectionEngine: BiasDetectionEngine;

  constructor() {
    this.culturalProfiles = new Map();
    this.localizationRules = [];
    this.biasDetectionPatterns = [];
    this.biasDetectionEngine = new BiasDetectionEngine();
    this.initializeCulturalProfiles();
    this.initializeLocalizationRules();
    this.initializeBiasDetection();
  }

  /**
   * Initialize cultural profiles for different regions
   */
  private initializeCulturalProfiles(): void {
    // East African (Kenya focus) cultural profile
    this.culturalProfiles.set('east-africa-kenya', {
      region: 'East Africa - Kenya',
      businessPractices: {
        decisionMaking: ['consensus-building', 'hierarchical-respect', 'elder-consultation'],
        communicationStyle: 'relationship-first',
        hierarchyPreferences: 'respect-based',
        timeOrientation: 'relationship-over-schedule',
        relationshipBuilding: ['personal-connection', 'trust-establishment', 'community-involvement']
      },
      regulatoryConsiderations: {
        dataProtection: ['Kenya Data Protection Act', 'GDPR compliance for EU clients'],
        businessCompliance: ['Companies Act 2015', 'Capital Markets Authority regulations'],
        industrySpecific: {
          'financial-services': ['Central Bank of Kenya regulations', 'Sacco Societies Act'],
          'healthcare': ['Kenya Medical Practitioners Act', 'Health Act 2017'],
          'manufacturing': ['Kenya Bureau of Standards', 'Export Processing Zones Act']
        }
      },
      languagePreferences: {
        formalityLevel: 'semi-formal',
        preferredTerminology: {
          'AI': 'Artificial Intelligence (AI)',
          'automation': 'intelligent automation',
          'efficiency': 'optimization',
          'cost-cutting': 'resource optimization',
          'disruption': 'transformation'
        },
        culturalMetaphors: ['ubuntu philosophy', 'community strength', 'collective wisdom']
      },
      economicContext: {
        currencyPreferences: ['KSH', 'USD'],
        investmentPatterns: ['gradual-implementation', 'proof-of-concept-first', 'community-benefit-focus'],
        resourceAvailability: 'emerging-market'
      }
    });

    // West African cultural profile
    this.culturalProfiles.set('west-africa', {
      region: 'West Africa',
      businessPractices: {
        decisionMaking: ['extended-consultation', 'community-impact-consideration'],
        communicationStyle: 'storytelling-emphasis',
        hierarchyPreferences: 'age-and-wisdom-respect',
        timeOrientation: 'process-over-deadline',
        relationshipBuilding: ['extended-family-networks', 'community-endorsement']
      },
      regulatoryConsiderations: {
        dataProtection: ['ECOWAS data protection frameworks', 'national data laws'],
        businessCompliance: ['regional trade agreements', 'local business registration'],
        industrySpecific: {
          'financial-services': ['central bank regulations', 'mobile money frameworks'],
          'agriculture': ['agricultural development policies', 'cooperative regulations']
        }
      },
      languagePreferences: {
        formalityLevel: 'formal',
        preferredTerminology: {
          'AI': 'Intelligence Artificielle / Artificial Intelligence',
          'digital transformation': 'modernisation numérique'
        },
        culturalMetaphors: ['village wisdom', 'collective prosperity', 'ancestral knowledge']
      },
      economicContext: {
        currencyPreferences: ['local currency', 'USD', 'EUR'],
        investmentPatterns: ['community-benefit-first', 'sustainable-development-focus'],
        resourceAvailability: 'developing-market'
      }
    });

    // Southern African cultural profile
    this.culturalProfiles.set('southern-africa', {
      region: 'Southern Africa',
      businessPractices: {
        decisionMaking: ['ubuntu-consensus', 'stakeholder-inclusion'],
        communicationStyle: 'respectful-directness',
        hierarchyPreferences: 'merit-and-experience-based',
        timeOrientation: 'thorough-consideration',
        relationshipBuilding: ['trust-through-competence', 'long-term-partnership']
      },
      regulatoryConsiderations: {
        dataProtection: ['POPIA (South Africa)', 'regional data frameworks'],
        businessCompliance: ['SADC trade protocols', 'national business laws'],
        industrySpecific: {
          'mining': ['mining charter requirements', 'environmental regulations'],
          'financial-services': ['banking regulations', 'fintech frameworks']
        }
      },
      languagePreferences: {
        formalityLevel: 'semi-formal',
        preferredTerminology: {
          'transformation': 'strategic evolution',
          'innovation': 'progressive development'
        },
        culturalMetaphors: ['ubuntu philosophy', 'collective strength', 'wisdom of experience']
      },
      economicContext: {
        currencyPreferences: ['ZAR', 'USD'],
        investmentPatterns: ['measured-growth', 'sustainability-focus'],
        resourceAvailability: 'mixed-economy'
      }
    });
  }

  /**
   * Initialize localization rules for different contexts
   */
  private initializeLocalizationRules(): void {
    this.localizationRules = [
      {
        sourceText: 'How quickly do you need to see ROI?',
        adaptations: {
          'east-africa-kenya': 'What timeline works best for your organization to see meaningful returns on AI investment?',
          'west-africa': 'Over what period would you expect to see beneficial outcomes from AI implementation?',
          'southern-africa': 'What would be a realistic timeframe for measuring AI implementation success?'
        },
        context: ['investment', 'timeline', 'roi']
      },
      {
        sourceText: 'Rate your organization\'s risk tolerance',
        adaptations: {
          'east-africa-kenya': 'How comfortable is your organization with trying new approaches to business challenges?',
          'west-africa': 'What level of innovation experimentation aligns with your organization\'s values?',
          'southern-africa': 'How does your organization typically approach new technology adoption?'
        },
        context: ['risk', 'innovation', 'change-management']
      },
      {
        sourceText: 'What\'s your budget for AI implementation?',
        adaptations: {
          'east-africa-kenya': 'What investment range would be appropriate for AI initiatives in your organization? (KSH 1M-15M / USD 10K-75K)',
          'west-africa': 'What resources could your organization allocate for strategic AI development?',
          'southern-africa': 'What budget parameters would work for your AI transformation journey?'
        },
        context: ['budget', 'investment', 'resources'],
        applicableIndustries: ['all']
      }
    ];
  }

  /**
   * Initialize bias detection patterns
   */
  private initializeBiasDetection(): void {
    this.biasDetectionPatterns = [
      /\b(primitive|backward|underdeveloped)\b/gi,
      /\b(first world|third world)\b/gi,
      /\b(advanced countries|developing countries)\b/gi,
      /\b(modern vs traditional)\b/gi,
      /\b(western standards|international standards)\b/gi
    ];
  }

  /**
   * Adapt a question based on user's cultural context
   */
  adaptQuestion(question: Question, userContext: UserContext): Question {
    const culturalContext = this.determinePrimaryCulturalContext(userContext);
    const culturalProfile = this.culturalProfiles.get(culturalContext);

    if (!culturalProfile) {
      return question;
    }

    // Apply localization rules
    const adaptedText = this.applyLocalizationRules(question.text, culturalContext);
    
    // Adapt options if they exist
    const adaptedOptions = question.options?.map(option => 
      this.applyLocalizationRules(option, culturalContext)
    );

    // Apply cultural terminology preferences
    const culturallyAdaptedText = this.applyCulturalTerminologyPrivate(
      adaptedText, 
      culturalProfile.languagePreferences.preferredTerminology
    );

    return {
      ...question,
      text: culturallyAdaptedText,
      options: adaptedOptions,
      culturalAdaptations: {
        ...question.culturalAdaptations,
        [culturalContext]: culturallyAdaptedText
      }
    };
  }

  /**
   * Apply localization rules to text
   */
  private applyLocalizationRules(text: string, culturalContext: string): string {
    for (const rule of this.localizationRules) {
      if (text.includes(rule.sourceText) && rule.adaptations[culturalContext]) {
        return text.replace(rule.sourceText, rule.adaptations[culturalContext]);
      }
    }
    return text;
  }



  /**
   * Determine primary cultural context from user context
   */
  private determinePrimaryCulturalContext(userContext: UserContext): string {
    if (userContext.geographicRegion) {
      // Map geographic regions to cultural contexts
      const regionMapping: Record<string, string> = {
        'kenya': 'east-africa-kenya',
        'uganda': 'east-africa-kenya',
        'tanzania': 'east-africa-kenya',
        'rwanda': 'east-africa-kenya',
        'nigeria': 'west-africa',
        'ghana': 'west-africa',
        'senegal': 'west-africa',
        'south-africa': 'southern-africa',
        'botswana': 'southern-africa',
        'zimbabwe': 'southern-africa'
      };

      const mappedContext = regionMapping[userContext.geographicRegion.toLowerCase()];
      if (mappedContext) {
        return mappedContext;
      }
    }

    // Default to East Africa - Kenya as primary market
    return 'east-africa-kenya';
  }

  /**
   * Get regulatory considerations for a specific region and industry
   */
  getRegulatorConsiderations(region: string, industry?: string): string[] {
    const culturalProfile = this.culturalProfiles.get(region);
    if (!culturalProfile) {
      return [];
    }

    const considerations = [...culturalProfile.regulatoryConsiderations.dataProtection];
    considerations.push(...culturalProfile.regulatoryConsiderations.businessCompliance);

    if (industry && culturalProfile.regulatoryConsiderations.industrySpecific[industry]) {
      considerations.push(...culturalProfile.regulatoryConsiderations.industrySpecific[industry]);
    }

    return considerations;
  }

  /**
   * Validate content for cultural sensitivity and bias
   */
  validateCulturalSensitivity(content: string, userContext?: UserContext): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    // Use the comprehensive BiasDetectionEngine
    const biasResult = this.biasDetectionEngine.detectBias(content, userContext);
    
    const issues: string[] = [];
    const suggestions: string[] = [];

    if (biasResult.hasBias) {
      for (const bias of biasResult.biasTypes) {
        issues.push(`${bias.severity.toUpperCase()} ${bias.type} bias: ${bias.description}`);
      }
      suggestions.push(...biasResult.suggestions);
    }

    // Additional cultural appropriateness checks
    if (content.includes('Western approach') || content.includes('international best practices')) {
      issues.push('Content may assume Western-centric approaches');
      suggestions.push('Consider framing as "proven approaches" or "effective practices" instead');
    }

    // Legacy bias pattern checks (for backward compatibility)
    for (const pattern of this.biasDetectionPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        const issueText = `Potentially biased language detected: "${matches[0]}"`;
        if (!issues.includes(issueText)) {
          issues.push(issueText);
          suggestions.push(`Consider using more neutral terminology instead of "${matches[0]}"`);
        }
      }
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Get business practice preferences for a cultural context
   */
  getBusinessPracticePreferences(culturalContext: string): CulturalAdaptation['businessPractices'] | null {
    const profile = this.culturalProfiles.get(culturalContext);
    return profile?.businessPractices || null;
  }

  /**
   * Get economic context for a region
   */
  getEconomicContext(culturalContext: string): CulturalAdaptation['economicContext'] | null {
    const profile = this.culturalProfiles.get(culturalContext);
    return profile?.economicContext || null;
  }

  /**
   * Adapt assessment response interpretation based on cultural context
   */
  adaptResponseInterpretation(
    response: AssessmentResponse, 
    userContext: UserContext
  ): AssessmentResponse {
    const culturalContext = this.determinePrimaryCulturalContext(userContext);
    const culturalProfile = this.culturalProfiles.get(culturalContext);

    if (!culturalProfile) {
      return response;
    }

    // Apply cultural interpretation adjustments
    // For example, in relationship-first cultures, lower urgency ratings might still indicate high priority
    if (culturalProfile.businessPractices.timeOrientation === 'relationship-over-schedule') {
      // Adjust timeline-related responses
      if (response.questionId.includes('timeline') || response.questionId.includes('urgency')) {
        // Implementation would adjust scoring based on cultural context
        return {
          ...response,
          culturalAdaptationApplied: true
        };
      }
    }

    return response;
  }

  /**
   * Apply cultural terminology to text content (public method)
   */
  applyCulturalTerminology(text: string, culturalContext: string): string {
    const culturalProfile = this.culturalProfiles.get(culturalContext);
    if (!culturalProfile) {
      return text;
    }

    return this.applyCulturalTerminologyPrivate(text, culturalProfile.languagePreferences.preferredTerminology);
  }

  /**
   * Comprehensive cultural validation including bias detection
   */
  validateComprehensiveCulturalSensitivity(
    content: string, 
    userContext: UserContext
  ): {
    isValid: boolean;
    culturalValidation: {
      isValid: boolean;
      issues: string[];
      suggestions: string[];
    };
    biasDetection: {
      hasBias: boolean;
      biasTypes: any[];
      confidence: number;
      suggestions: string[];
    };
    overallScore: number;
    recommendations: string[];
  } {
    // Get cultural validation
    const culturalValidation = this.validateCulturalSensitivity(content, userContext);
    
    // Get bias detection results
    const biasDetection = this.biasDetectionEngine.detectBias(content, userContext);
    
    // Calculate overall score
    let overallScore = 1.0;
    
    if (!culturalValidation.isValid) {
      overallScore -= 0.3;
    }
    
    if (biasDetection.hasBias) {
      // Reduce score based on bias severity
      const severityReduction = biasDetection.biasTypes.reduce((reduction, bias) => {
        switch (bias.severity) {
          case 'high': return reduction + 0.3;
          case 'medium': return reduction + 0.2;
          case 'low': return reduction + 0.1;
          default: return reduction;
        }
      }, 0);
      overallScore -= Math.min(severityReduction, 0.7); // Cap at 0.7 reduction
    }
    
    overallScore = Math.max(0, overallScore); // Ensure non-negative
    
    // Generate comprehensive recommendations
    const recommendations: string[] = [];
    
    if (!culturalValidation.isValid) {
      recommendations.push('Review content for cultural sensitivity and regional appropriateness');
      recommendations.push(...culturalValidation.suggestions);
    }
    
    if (biasDetection.hasBias) {
      recommendations.push('Address detected bias patterns to ensure inclusive content');
      recommendations.push(...biasDetection.suggestions);
    }
    
    if (overallScore > 0.8) {
      recommendations.push('Content demonstrates good cultural sensitivity and minimal bias');
    } else if (overallScore > 0.6) {
      recommendations.push('Content needs moderate improvements for cultural appropriateness');
    } else {
      recommendations.push('Content requires significant revision for cultural sensitivity and bias reduction');
    }
    
    return {
      isValid: culturalValidation.isValid && !biasDetection.hasBias,
      culturalValidation,
      biasDetection,
      overallScore,
      recommendations: [...new Set(recommendations)] // Remove duplicates
    };
  }

  /**
   * Generate culturally appropriate and bias-free content alternative
   */
  generateCulturallyAppropriateAlternative(
    content: string, 
    userContext: UserContext
  ): {
    originalContent: string;
    improvedContent: string;
    culturalAdaptations: string[];
    biasCorrections: string[];
    confidence: number;
  } {
    // Start with bias-free alternative
    const biasFreResult = this.biasDetectionEngine.generateBiasFreeAlternative(content, userContext);
    
    // Apply cultural adaptations
    let improvedContent = biasFreResult.revisedContent;
    const culturalAdaptations: string[] = [];
    
    // Apply cultural terminology
    const culturalContext = this.determinePrimaryCulturalContext(userContext);
    const culturalProfile = this.culturalProfiles.get(culturalContext);
    
    if (culturalProfile) {
      const originalImproved = improvedContent;
      improvedContent = this.applyCulturalTerminologyPrivate(
        improvedContent, 
        culturalProfile.languagePreferences.preferredTerminology
      );
      
      if (originalImproved !== improvedContent) {
        culturalAdaptations.push('Applied culturally appropriate terminology');
      }
      
      // Apply localization rules
      for (const rule of this.localizationRules) {
        if (improvedContent.includes(rule.sourceText) && rule.adaptations[culturalContext]) {
          const originalContent = improvedContent;
          improvedContent = improvedContent.replace(rule.sourceText, rule.adaptations[culturalContext]);
          if (originalContent !== improvedContent) {
            culturalAdaptations.push(`Applied localization rule: ${rule.context.join(', ')}`);
          }
        }
      }
    }
    
    // Calculate confidence based on number of changes and validation results
    const validation = this.validateComprehensiveCulturalSensitivity(improvedContent, userContext);
    const confidence = Math.min(0.95, 0.6 + (validation.overallScore * 0.35));
    
    return {
      originalContent: content,
      improvedContent,
      culturalAdaptations,
      biasCorrections: biasFreResult.changesApplied,
      confidence
    };
  }

  /**
   * Apply cultural terminology preferences (renamed private method)
   */
  private applyCulturalTerminologyPrivate(text: string, terminology: Record<string, string>): string {
    let adaptedText = text;
    for (const [original, preferred] of Object.entries(terminology)) {
      const regex = new RegExp(`\\b${original}\\b`, 'gi');
      adaptedText = adaptedText.replace(regex, preferred);
    }
    return adaptedText;
  }
}