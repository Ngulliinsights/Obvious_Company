/**
 * A/B Testing System for Assessment Platform
 * 
 * Implements comprehensive A/B testing for different assessment approaches,
 * question formulations, UI designs, and scoring algorithms.
 */

import { 
  ABTestExperiment, 
  ABTestVariant, 
  ABTestResults, 
  UserFeedback,
  OutcomeData 
} from './types';

export class ABTestingSystem {
  private experiments: Map<string, ABTestExperiment> = new Map();
  private userAssignments: Map<string, Map<string, string>> = new Map(); // userId -> experimentId -> variantId
  private results: Map<string, ABTestResults> = new Map();

  constructor(private config: {
    defaultTrafficSplit: number;
    minimumExperimentDuration: number;
    maximumExperimentDuration: number;
    significanceThreshold: number;
  }) {}

  /**
   * Create a new A/B test experiment
   */
  async createExperiment(experiment: Omit<ABTestExperiment, 'id'>): Promise<string> {
    const experimentId = this.generateExperimentId();
    const fullExperiment: ABTestExperiment = {
      ...experiment,
      id: experimentId,
      status: 'draft'
    };

    // Validate experiment configuration
    this.validateExperiment(fullExperiment);

    this.experiments.set(experimentId, fullExperiment);
    
    console.log(`Created A/B test experiment: ${experimentId} - ${experiment.name}`);
    return experimentId;
  }

  /**
   * Start an A/B test experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    if (experiment.status !== 'draft') {
      throw new Error(`Cannot start experiment in status: ${experiment.status}`);
    }

    experiment.status = 'running';
    experiment.startDate = new Date();
    
    // Set end date if not specified
    if (!experiment.endDate) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + this.config.minimumExperimentDuration);
      experiment.endDate = endDate;
    }

    console.log(`Started A/B test experiment: ${experimentId}`);
  }

  /**
   * Assign user to experiment variant
   */
  assignUserToVariant(userId: string, experimentId: string): string | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }

    // Check if user already assigned
    const userExperiments = this.userAssignments.get(userId) || new Map();
    if (userExperiments.has(experimentId)) {
      return userExperiments.get(experimentId)!;
    }

    // Assign to variant based on weights
    const variantId = this.selectVariantByWeight(experiment.variants, userId);
    
    userExperiments.set(experimentId, variantId);
    this.userAssignments.set(userId, userExperiments);

    return variantId;
  }

  /**
   * Get active experiments for assessment type
   */
  getActiveExperiments(assessmentType?: string): ABTestExperiment[] {
    return Array.from(this.experiments.values()).filter(exp => 
      exp.status === 'running' && 
      (!assessmentType || exp.type === assessmentType)
    );
  }

  /**
   * Record experiment event (conversion, completion, etc.)
   */
  async recordEvent(
    userId: string, 
    experimentId: string, 
    eventType: string, 
    eventData?: Record<string, any>
  ): Promise<void> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;

    const variantId = this.getUserVariant(userId, experimentId);
    if (!variantId) return;

    // Store event data for analysis
    await this.storeEventData({
      experimentId,
      variantId,
      userId,
      eventType,
      eventData,
      timestamp: new Date()
    });

    console.log(`Recorded A/B test event: ${eventType} for experiment ${experimentId}, variant ${variantId}`);
  }

  /**
   * Analyze experiment results
   */
  async analyzeExperiment(experimentId: string): Promise<ABTestResults> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    const eventData = await this.getEventData(experimentId);
    const results: ABTestResults = {
      experimentId,
      variants: {},
      conclusionDate: new Date(),
      recommendations: []
    };

    // Calculate metrics for each variant
    for (const variant of experiment.variants) {
      const variantEvents = eventData.filter(e => e.variantId === variant.id);
      const participants = new Set(variantEvents.map(e => e.userId)).size;
      const conversions = variantEvents.filter(e => e.eventType === 'conversion').length;
      
      results.variants[variant.id] = {
        participants,
        conversions,
        conversionRate: participants > 0 ? conversions / participants : 0,
        metrics: this.calculateVariantMetrics(variantEvents),
        confidenceInterval: this.calculateConfidenceInterval(conversions, participants),
        statisticalSignificance: false // Will be calculated below
      };
    }

    // Determine statistical significance and winner
    const { winner, significance } = this.calculateStatisticalSignificance(results.variants);
    results.winner = winner;
    
    // Update significance flags
    Object.keys(results.variants).forEach(variantId => {
      results.variants[variantId].statisticalSignificance = significance;
    });

    // Generate recommendations
    results.recommendations = this.generateRecommendations(experiment, results);

    this.results.set(experimentId, results);
    return results;
  }

  /**
   * Stop experiment and analyze results
   */
  async stopExperiment(experimentId: string): Promise<ABTestResults> {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    experiment.status = 'completed';
    experiment.endDate = new Date();

    const results = await this.analyzeExperiment(experimentId);
    experiment.results = results;

    console.log(`Stopped A/B test experiment: ${experimentId}`);
    return results;
  }

  /**
   * Create assessment approach experiment
   */
  async createAssessmentApproachExperiment(
    name: string,
    approaches: { name: string; config: any }[]
  ): Promise<string> {
    const variants: ABTestVariant[] = approaches.map((approach, index) => ({
      id: `variant_${index + 1}`,
      name: approach.name,
      description: `Assessment approach: ${approach.name}`,
      config: approach.config,
      weight: 100 / approaches.length,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return this.createExperiment({
      name,
      description: `Testing different assessment approaches: ${approaches.map(a => a.name).join(', ')}`,
      type: 'assessment_approach',
      variants,
      startDate: new Date(),
      status: 'draft',
      targetMetrics: ['completion_rate', 'user_satisfaction', 'accuracy_score'],
      minimumSampleSize: 100,
      confidenceLevel: 0.95
    });
  }

  /**
   * Create question formulation experiment
   */
  async createQuestionFormulationExperiment(
    name: string,
    questionVariants: { question: string; options?: string[] }[]
  ): Promise<string> {
    const variants: ABTestVariant[] = questionVariants.map((variant, index) => ({
      id: `question_variant_${index + 1}`,
      name: `Question Variant ${index + 1}`,
      description: `Question formulation variant`,
      config: { question: variant.question, options: variant.options },
      weight: 100 / questionVariants.length,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    return this.createExperiment({
      name,
      description: `Testing different question formulations`,
      type: 'question_formulation',
      variants,
      startDate: new Date(),
      status: 'draft',
      targetMetrics: ['response_quality', 'completion_time', 'user_engagement'],
      minimumSampleSize: 200,
      confidenceLevel: 0.95
    });
  }

  // Private helper methods

  private validateExperiment(experiment: ABTestExperiment): void {
    if (experiment.variants.length < 2) {
      throw new Error('Experiment must have at least 2 variants');
    }

    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error('Variant weights must sum to 100');
    }

    if (experiment.minimumSampleSize < 30) {
      throw new Error('Minimum sample size must be at least 30');
    }
  }

  private generateExperimentId(): string {
    return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private selectVariantByWeight(variants: ABTestVariant[], userId: string): string {
    // Use user ID for consistent assignment
    const hash = this.hashUserId(userId);
    const random = hash % 100;
    
    let cumulativeWeight = 0;
    for (const variant of variants) {
      cumulativeWeight += variant.weight;
      if (random < cumulativeWeight) {
        return variant.id;
      }
    }
    
    return variants[variants.length - 1].id;
  }

  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private getUserVariant(userId: string, experimentId: string): string | null {
    const userExperiments = this.userAssignments.get(userId);
    return userExperiments?.get(experimentId) || null;
  }

  private async storeEventData(eventData: any): Promise<void> {
    // In a real implementation, this would store to a database
    // For now, we'll use in-memory storage
    console.log('Storing A/B test event data:', eventData);
  }

  private async getEventData(experimentId: string): Promise<any[]> {
    // In a real implementation, this would query from a database
    // For now, return mock data
    return [];
  }

  private calculateVariantMetrics(events: any[]): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    // Calculate average completion time
    const completionEvents = events.filter(e => e.eventType === 'completion');
    if (completionEvents.length > 0) {
      const avgTime = completionEvents.reduce((sum, e) => sum + (e.eventData?.duration || 0), 0) / completionEvents.length;
      metrics.averageCompletionTime = avgTime;
    }

    // Calculate engagement score
    const engagementEvents = events.filter(e => e.eventType === 'engagement');
    if (engagementEvents.length > 0) {
      const avgEngagement = engagementEvents.reduce((sum, e) => sum + (e.eventData?.score || 0), 0) / engagementEvents.length;
      metrics.engagementScore = avgEngagement;
    }

    return metrics;
  }

  private calculateConfidenceInterval(conversions: number, participants: number): [number, number] {
    if (participants === 0) return [0, 0];
    
    const rate = conversions / participants;
    const z = 1.96; // 95% confidence level
    const margin = z * Math.sqrt((rate * (1 - rate)) / participants);
    
    return [Math.max(0, rate - margin), Math.min(1, rate + margin)];
  }

  private calculateStatisticalSignificance(variants: Record<string, any>): { winner: string | undefined; significance: boolean } {
    const variantIds = Object.keys(variants);
    if (variantIds.length < 2) return { winner: undefined, significance: false };

    // Simple chi-square test for statistical significance
    // In a real implementation, you'd use a proper statistical library
    let maxRate = 0;
    let winner: string | undefined;

    for (const variantId of variantIds) {
      const variant = variants[variantId];
      if (variant.conversionRate > maxRate && variant.participants >= 30) {
        maxRate = variant.conversionRate;
        winner = variantId;
      }
    }

    // Simplified significance check - in reality, you'd calculate p-value
    const significance = maxRate > 0 && Object.values(variants).some((v: any) => v.participants >= 100);

    return { winner, significance };
  }

  private generateRecommendations(experiment: ABTestExperiment, results: ABTestResults): string[] {
    const recommendations: string[] = [];

    if (results.winner) {
      const winnerVariant = experiment.variants.find(v => v.id === results.winner);
      recommendations.push(`Implement ${winnerVariant?.name} as the default approach`);
      
      const winnerResults = results.variants[results.winner];
      if (winnerResults.conversionRate > 0.8) {
        recommendations.push('Consider expanding this approach to other assessment types');
      }
    } else {
      recommendations.push('No clear winner identified - consider extending experiment duration');
      recommendations.push('Review experiment design and success metrics');
    }

    // Check for low participation
    const totalParticipants = Object.values(results.variants).reduce((sum, v) => sum + v.participants, 0);
    if (totalParticipants < experiment.minimumSampleSize) {
      recommendations.push('Increase traffic allocation to reach minimum sample size');
    }

    return recommendations;
  }
}