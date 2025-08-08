import { UserContext, AssessmentResponse } from '../models/types';

export interface BiasDetectionResult {
  hasBias: boolean;
  biasTypes: BiasType[];
  confidence: number;
  suggestions: string[];
  affectedContent: string[];
}

export interface BiasType {
  type: 'cultural' | 'linguistic' | 'economic' | 'technological' | 'gender' | 'age' | 'educational';
  severity: 'low' | 'medium' | 'high';
  description: string;
  examples: string[];
}

export interface BiasPattern {
  pattern: RegExp;
  biasType: BiasType['type'];
  severity: BiasType['severity'];
  description: string;
  alternatives: string[];
}

export class BiasDetectionEngine {
  private biasPatterns: BiasPattern[];
  private culturalBiasTerms: Map<string, string[]>;
  private economicBiasIndicators: RegExp[];
  private technologicalAssumptions: RegExp[];

  constructor() {
    this.biasPatterns = [];
    this.culturalBiasTerms = new Map();
    this.economicBiasIndicators = [];
    this.technologicalAssumptions = [];
    this.initializeBiasPatterns();
    this.initializeCulturalBiasTerms();
    this.initializeEconomicBiasIndicators();
    this.initializeTechnologicalAssumptions();
  }

  /**
   * Initialize bias detection patterns
   */
  private initializeBiasPatterns(): void {
    this.biasPatterns = [
      // Cultural bias patterns
      {
        pattern: /\b(primitive|backward|underdeveloped|uncivilized)\b/gi,
        biasType: 'cultural',
        severity: 'high',
        description: 'Uses derogatory terms to describe cultures or regions',
        alternatives: ['emerging', 'developing', 'traditional', 'established']
      },
      {
        pattern: /\b(first world|third world|developed countries|developing countries)\b/gi,
        biasType: 'cultural',
        severity: 'medium',
        description: 'Uses outdated or hierarchical country classifications',
        alternatives: ['high-income countries', 'emerging economies', 'different economic contexts']
      },
      {
        pattern: /\b(western standards|international standards|global best practices)\b/gi,
        biasType: 'cultural',
        severity: 'medium',
        description: 'Assumes Western or international approaches are universally superior',
        alternatives: ['proven practices', 'effective approaches', 'successful methods']
      },
      {
        pattern: /\b(modern vs traditional|advanced vs basic)\b/gi,
        biasType: 'cultural',
        severity: 'medium',
        description: 'Creates false dichotomies between modern and traditional approaches',
        alternatives: ['different approaches', 'various methods', 'alternative strategies']
      },

      // Economic bias patterns
      {
        pattern: /\b(cheap labor|low-cost workforce)\b/gi,
        biasType: 'economic',
        severity: 'high',
        description: 'Reduces people to economic commodities',
        alternatives: ['skilled workforce', 'competitive labor market', 'available talent']
      },
      {
        pattern: /\b(everyone can afford|standard pricing|typical budget)\b/gi,
        biasType: 'economic',
        severity: 'medium',
        description: 'Assumes universal economic capacity',
        alternatives: ['flexible pricing', 'various budget options', 'scalable investment']
      },
      {
        pattern: /\b(obviously affordable|clearly within budget|standard investment)\b/gi,
        biasType: 'economic',
        severity: 'medium',
        description: 'Makes assumptions about financial capacity',
        alternatives: ['investment options available', 'flexible financial arrangements', 'scalable solutions']
      },

      // Technological bias patterns
      {
        pattern: /\b(everyone has|standard internet|typical connectivity|normal bandwidth)\b/gi,
        biasType: 'technological',
        severity: 'medium',
        description: 'Assumes universal technology access',
        alternatives: ['where available', 'with appropriate connectivity', 'when infrastructure supports']
      },
      {
        pattern: /\b(latest technology|cutting-edge|state-of-the-art)\b/gi,
        biasType: 'technological',
        severity: 'low',
        description: 'May assume access to newest technology',
        alternatives: ['appropriate technology', 'suitable solutions', 'effective tools']
      },
      {
        pattern: /\b(digital natives|tech-savvy|naturally understand)\b/gi,
        biasType: 'technological',
        severity: 'medium',
        description: 'Makes assumptions about technological familiarity',
        alternatives: ['with appropriate training', 'with support', 'when properly introduced']
      },

      // Educational bias patterns
      {
        pattern: /\b(obviously|clearly|everyone knows|it\'s common knowledge)\b/gi,
        biasType: 'educational',
        severity: 'medium',
        description: 'Assumes universal knowledge or understanding',
        alternatives: ['it may be helpful to know', 'for context', 'as background']
      },
      {
        pattern: /\b(basic understanding|fundamental knowledge|elementary concepts)\b/gi,
        biasType: 'educational',
        severity: 'low',
        description: 'May assume certain educational background',
        alternatives: ['foundational concepts', 'key principles', 'important ideas']
      },

      // Gender bias patterns
      {
        pattern: /\b(guys|mankind|manpower|chairman)\b/gi,
        biasType: 'gender',
        severity: 'low',
        description: 'Uses male-default language',
        alternatives: ['everyone', 'humanity', 'workforce', 'chairperson']
      },

      // Age bias patterns
      {
        pattern: /\b(young people understand|older people struggle|digital generation)\b/gi,
        biasType: 'age',
        severity: 'medium',
        description: 'Makes assumptions based on age',
        alternatives: ['with appropriate support', 'with training', 'when introduced properly']
      }
    ];
  }

  /**
   * Initialize cultural bias terms specific to different regions
   */
  private initializeCulturalBiasTerms(): void {
    // Terms that may be biased when used in African contexts
    this.culturalBiasTerms.set('africa-general', [
      'tribal', 'exotic', 'authentic', 'untouched', 'remote', 'isolated',
      'simple', 'basic', 'elementary', 'rudimentary'
    ]);

    // Terms that assume Western business practices
    this.culturalBiasTerms.set('business-western', [
      'professional standards', 'business etiquette', 'proper procedures',
      'standard practices', 'normal operations', 'typical workflow'
    ]);

    // Terms that may be patronizing
    this.culturalBiasTerms.set('patronizing', [
      'help them understand', 'teach them', 'show them how',
      'bring them up to speed', 'get them caught up'
    ]);
  }

  /**
   * Initialize economic bias indicators
   */
  private initializeEconomicBiasIndicators(): void {
    this.economicBiasIndicators = [
      /\$\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|dollars?)\s*(?:is|are)\s*(?:reasonable|affordable|standard)/gi,
      /\b(?:typical|standard|normal|average)\s*(?:budget|investment|cost|price)\b/gi,
      /\b(?:everyone|most people|typically)\s*(?:can afford|have access to|own)\b/gi,
      /\b(?:basic|standard|normal)\s*(?:internet|connectivity|bandwidth|technology)\b/gi
    ];
  }

  /**
   * Initialize technological assumption patterns
   */
  private initializeTechnologicalAssumptions(): void {
    this.technologicalAssumptions = [
      /\b(?:everyone|most people|users)\s*(?:have|own|use)\s*(?:smartphones|computers|internet|wifi)\b/gi,
      /\b(?:standard|typical|normal|basic)\s*(?:internet speed|connectivity|bandwidth)\b/gi,
      /\b(?:obviously|clearly|naturally)\s*(?:digital|online|connected)\b/gi,
      /\b(?:just|simply|easily)\s*(?:download|install|access|connect)\b/gi
    ];
  }

  /**
   * Detect bias in content
   */
  detectBias(content: string, userContext?: UserContext): BiasDetectionResult {
    const detectedBiases: BiasType[] = [];
    const affectedContent: string[] = [];
    const suggestions: string[] = [];

    // Check against bias patterns
    for (const pattern of this.biasPatterns) {
      const matches = content.match(pattern.pattern);
      if (matches) {
        detectedBiases.push({
          type: pattern.biasType,
          severity: pattern.severity,
          description: pattern.description,
          examples: matches
        });

        affectedContent.push(...matches);
        suggestions.push(`Consider replacing "${matches[0]}" with alternatives like: ${pattern.alternatives.join(', ')}`);
      }
    }

    // Check cultural bias terms
    for (const [category, terms] of this.culturalBiasTerms.entries()) {
      for (const term of terms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) {
          detectedBiases.push({
            type: 'cultural',
            severity: 'medium',
            description: `Uses potentially biased term from category: ${category}`,
            examples: matches
          });

          affectedContent.push(...matches);
          suggestions.push(`Consider using more neutral language instead of "${matches[0]}"`);
        }
      }
    }

    // Check economic bias indicators
    for (const indicator of this.economicBiasIndicators) {
      const matches = content.match(indicator);
      if (matches) {
        detectedBiases.push({
          type: 'economic',
          severity: 'medium',
          description: 'Makes assumptions about economic capacity or access',
          examples: matches
        });

        affectedContent.push(...matches);
        suggestions.push(`Avoid assumptions about economic capacity. Consider: "flexible options available" or "scalable solutions"`);
      }
    }

    // Check technological assumptions
    for (const assumption of this.technologicalAssumptions) {
      const matches = content.match(assumption);
      if (matches) {
        detectedBiases.push({
          type: 'technological',
          severity: 'medium',
          description: 'Makes assumptions about technology access or familiarity',
          examples: matches
        });

        affectedContent.push(...matches);
        suggestions.push(`Avoid assumptions about technology access. Consider: "where available" or "with appropriate support"`);
      }
    }

    // Context-specific bias detection
    if (userContext) {
      const contextualBiases = this.detectContextualBias(content, userContext);
      detectedBiases.push(...contextualBiases.biases);
      suggestions.push(...contextualBiases.suggestions);
      affectedContent.push(...contextualBiases.affectedContent);
    }

    // Calculate confidence based on number and severity of biases
    const confidence = this.calculateConfidence(detectedBiases);

    return {
      hasBias: detectedBiases.length > 0,
      biasTypes: detectedBiases,
      confidence,
      suggestions: [...new Set(suggestions)], // Remove duplicates
      affectedContent: [...new Set(affectedContent)] // Remove duplicates
    };
  }

  /**
   * Detect contextual bias based on user context
   */
  private detectContextualBias(content: string, userContext: UserContext): {
    biases: BiasType[];
    suggestions: string[];
    affectedContent: string[];
  } {
    const biases: BiasType[] = [];
    const suggestions: string[] = [];
    const affectedContent: string[] = [];

    // Check for region-specific bias
    if (userContext.geographicRegion) {
      const regionBias = this.checkRegionalBias(content, userContext.geographicRegion);
      biases.push(...regionBias.biases);
      suggestions.push(...regionBias.suggestions);
      affectedContent.push(...regionBias.affectedContent);
    }

    // Check for industry-specific bias
    if (userContext.industry) {
      const industryBias = this.checkIndustryBias(content, userContext.industry);
      biases.push(...industryBias.biases);
      suggestions.push(...industryBias.suggestions);
      affectedContent.push(...industryBias.affectedContent);
    }

    return { biases, suggestions, affectedContent };
  }

  /**
   * Check for regional bias
   */
  private checkRegionalBias(content: string, region: string): {
    biases: BiasType[];
    suggestions: string[];
    affectedContent: string[];
  } {
    const biases: BiasType[] = [];
    const suggestions: string[] = [];
    const affectedContent: string[] = [];

    // Check for assumptions about African contexts
    if (['kenya', 'nigeria', 'ghana', 'south-africa', 'uganda', 'tanzania'].includes(region.toLowerCase())) {
      const africanBiasPatterns = [
        /\b(?:help|assist|support)\s*(?:africa|african)\s*(?:develop|grow|improve)\b/gi,
        /\b(?:bring|introduce|teach)\s*(?:technology|innovation|progress)\s*(?:to africa|to african)\b/gi,
        /\b(?:african|africa)\s*(?:needs|requires|lacks)\s*(?:development|technology|progress)\b/gi
      ];

      for (const pattern of africanBiasPatterns) {
        const matches = content.match(pattern);
        if (matches) {
          biases.push({
            type: 'cultural',
            severity: 'high',
            description: 'Contains patronizing assumptions about African contexts',
            examples: matches
          });

          affectedContent.push(...matches);
          suggestions.push(`Avoid patronizing language about African contexts. Consider collaborative framing instead.`);
        }
      }
    }

    return { biases, suggestions, affectedContent };
  }

  /**
   * Check for industry-specific bias
   */
  private checkIndustryBias(content: string, industry: string): {
    biases: BiasType[];
    suggestions: string[];
    affectedContent: string[];
  } {
    const biases: BiasType[] = [];
    const suggestions: string[] = [];
    const affectedContent: string[] = [];

    // Check for assumptions about industry sophistication
    const industryBiasPatterns: Record<string, RegExp[]> = {
      'agriculture': [
        /\b(?:traditional|old-fashioned|outdated)\s*(?:farming|agriculture)\b/gi,
        /\b(?:modernize|upgrade|improve)\s*(?:farming|agricultural)\s*(?:practices|methods)\b/gi
      ],
      'manufacturing': [
        /\b(?:basic|simple|elementary)\s*(?:manufacturing|production)\b/gi,
        /\b(?:bring|introduce)\s*(?:modern|advanced)\s*(?:manufacturing|production)\b/gi
      ],
      'healthcare': [
        /\b(?:basic|primitive|limited)\s*(?:healthcare|medical)\s*(?:facilities|services)\b/gi,
        /\b(?:improve|upgrade|modernize)\s*(?:healthcare|medical)\s*(?:systems|services)\b/gi
      ]
    };

    const patterns = industryBiasPatterns[industry];
    if (patterns) {
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          biases.push({
            type: 'cultural',
            severity: 'medium',
            description: `Contains assumptions about ${industry} industry sophistication`,
            examples: matches
          });

          affectedContent.push(...matches);
          suggestions.push(`Avoid assumptions about ${industry} industry capabilities. Consider neutral language.`);
        }
      }
    }

    return { biases, suggestions, affectedContent };
  }

  /**
   * Calculate confidence score for bias detection
   */
  private calculateConfidence(biases: BiasType[]): number {
    if (biases.length === 0) {
      return 0.95; // High confidence in no bias
    }

    let totalSeverity = 0;
    for (const bias of biases) {
      switch (bias.severity) {
        case 'high':
          totalSeverity += 3;
          break;
        case 'medium':
          totalSeverity += 2;
          break;
        case 'low':
          totalSeverity += 1;
          break;
      }
    }

    // Normalize confidence based on severity and count
    const maxPossibleSeverity = biases.length * 3;
    const severityRatio = totalSeverity / maxPossibleSeverity;
    
    // Higher severity and more biases = higher confidence in bias detection
    return Math.min(0.95, 0.5 + (severityRatio * 0.45));
  }

  /**
   * Validate assessment responses for bias
   */
  validateAssessmentResponse(response: AssessmentResponse, userContext: UserContext): BiasDetectionResult {
    const responseText = typeof response.response === 'string' ? response.response : JSON.stringify(response.response);
    return this.detectBias(responseText, userContext);
  }

  /**
   * Generate bias-free alternative content
   */
  generateBiasFreeAlternative(content: string, userContext?: UserContext): {
    originalContent: string;
    revisedContent: string;
    changesApplied: string[];
    confidence: number;
  } {
    const biasResult = this.detectBias(content, userContext);
    let revisedContent = content;
    const changesApplied: string[] = [];

    if (!biasResult.hasBias) {
      return {
        originalContent: content,
        revisedContent: content,
        changesApplied: [],
        confidence: 0.95
      };
    }

    // Apply pattern-based replacements
    for (const pattern of this.biasPatterns) {
      const matches = revisedContent.match(pattern.pattern);
      if (matches) {
        for (const match of matches) {
          // Use first alternative as replacement
          const replacement = pattern.alternatives[0];
          revisedContent = revisedContent.replace(match, replacement);
          changesApplied.push(`Replaced "${match}" with "${replacement}"`);
        }
      }
    }

    // Apply cultural bias term replacements
    for (const [category, terms] of this.culturalBiasTerms.entries()) {
      for (const term of terms) {
        const regex = new RegExp(`\\b${term}\\b`, 'gi');
        if (regex.test(revisedContent)) {
          const neutralTerm = this.getNeutralAlternative(term);
          revisedContent = revisedContent.replace(regex, neutralTerm);
          changesApplied.push(`Replaced potentially biased term "${term}" with "${neutralTerm}"`);
        }
      }
    }

    return {
      originalContent: content,
      revisedContent,
      changesApplied,
      confidence: 0.8 // Moderate confidence in automated revision
    };
  }

  /**
   * Get neutral alternative for biased terms
   */
  private getNeutralAlternative(term: string): string {
    const alternatives: Record<string, string> = {
      'tribal': 'community-based',
      'exotic': 'unique',
      'authentic': 'traditional',
      'untouched': 'preserved',
      'remote': 'rural',
      'isolated': 'independent',
      'simple': 'streamlined',
      'basic': 'foundational',
      'elementary': 'fundamental',
      'rudimentary': 'essential'
    };

    return alternatives[term.toLowerCase()] || term;
  }

  /**
   * Get bias detection statistics
   */
  getBiasStatistics(contents: string[], userContext?: UserContext): {
    totalContent: number;
    biasedContent: number;
    biasRate: number;
    commonBiasTypes: { type: string; count: number }[];
    severityDistribution: { severity: string; count: number }[];
  } {
    const biasTypeCounts: Record<string, number> = {};
    const severityCounts: Record<string, number> = {};
    let biasedCount = 0;

    for (const content of contents) {
      const result = this.detectBias(content, userContext);
      if (result.hasBias) {
        biasedCount++;
        
        for (const bias of result.biasTypes) {
          biasTypeCounts[bias.type] = (biasTypeCounts[bias.type] || 0) + 1;
          severityCounts[bias.severity] = (severityCounts[bias.severity] || 0) + 1;
        }
      }
    }

    const commonBiasTypes = Object.entries(biasTypeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    const severityDistribution = Object.entries(severityCounts)
      .map(([severity, count]) => ({ severity, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalContent: contents.length,
      biasedContent: biasedCount,
      biasRate: contents.length > 0 ? biasedCount / contents.length : 0,
      commonBiasTypes,
      severityDistribution
    };
  }
}