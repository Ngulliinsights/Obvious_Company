---
title: "Ab-testing-system"
type: "framework"
audience: "executives"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ABTestingSystem = void 0;
class ABTestingSystem {
    constructor(config) {
        this.config = config;
        this.experiments = new Map();
        this.userAssignments = new Map();
        this.results = new Map();
    }
    async createExperiment(experiment) {
        const experimentId = this.generateExperimentId();
        const fullExperiment = {
            ...experiment,
            id: experimentId,
            status: 'draft'
        };
        this.validateExperiment(fullExperiment);
        this.experiments.set(experimentId, fullExperiment);
        console.log(`Created A/B test experiment: ${experimentId} - ${experiment.name}`);
        return experimentId;
    }
    async startExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }
        if (experiment.status !== 'draft') {
            throw new Error(`Cannot start experiment in status: ${experiment.status}`);
        }
        experiment.status = 'running';
        experiment.startDate = new Date();
        if (!experiment.endDate) {
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + this.config.minimumExperimentDuration);
            experiment.endDate = endDate;
        }
        console.log(`Started A/B test experiment: ${experimentId}`);
    }
    assignUserToVariant(userId, experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'running') {
            return null;
        }
        const userExperiments = this.userAssignments.get(userId) || new Map();
        if (userExperiments.has(experimentId)) {
            return userExperiments.get(experimentId);
        }
        const variantId = this.selectVariantByWeight(experiment.variants, userId);
        userExperiments.set(experimentId, variantId);
        this.userAssignments.set(userId, userExperiments);
        return variantId;
    }
    getActiveExperiments(assessmentType) {
        return Array.from(this.experiments.values()).filter(exp => exp.status === 'running' &&
            (!assessmentType || exp.type === assessmentType));
    }
    async recordEvent(userId, experimentId, eventType, eventData) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment)
            return;
        const variantId = this.getUserVariant(userId, experimentId);
        if (!variantId)
            return;
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
    async analyzeExperiment(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) {
            throw new Error(`Experiment ${experimentId} not found`);
        }
        const eventData = await this.getEventData(experimentId);
        const results = {
            experimentId,
            variants: {},
            conclusionDate: new Date(),
            recommendations: []
        };
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
                statisticalSignificance: false
            };
        }
        const { winner, significance } = this.calculateStatisticalSignificance(results.variants);
        results.winner = winner;
        Object.keys(results.variants).forEach(variantId => {
            results.variants[variantId].statisticalSignificance = significance;
        });
        results.recommendations = this.generateRecommendations(experiment, results);
        this.results.set(experimentId, results);
        return results;
    }
    async stopExperiment(experimentId) {
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
    async createAssessmentApproachExperiment(name, approaches) {
        const variants = approaches.map((approach, index) => ({
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
    async createQuestionFormulationExperiment(name, questionVariants) {
        const variants = questionVariants.map((variant, index) => ({
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
    validateExperiment(experiment) {
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
    generateExperimentId() {
        return `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    selectVariantByWeight(variants, userId) {
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
    hashUserId(userId) {
        let hash = 0;
        for (let i = 0; i < userId.length; i++) {
            const char = userId.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    getUserVariant(userId, experimentId) {
        const userExperiments = this.userAssignments.get(userId);
        return userExperiments?.get(experimentId) || null;
    }
    async storeEventData(eventData) {
        console.log('Storing A/B test event data:', eventData);
    }
    async getEventData(experimentId) {
        return [];
    }
    calculateVariantMetrics(events) {
        const metrics = {};
        const completionEvents = events.filter(e => e.eventType === 'completion');
        if (completionEvents.length > 0) {
            const avgTime = completionEvents.reduce((sum, e) => sum + (e.eventData?.duration || 0), 0) / completionEvents.length;
            metrics.averageCompletionTime = avgTime;
        }
        const engagementEvents = events.filter(e => e.eventType === 'engagement');
        if (engagementEvents.length > 0) {
            const avgEngagement = engagementEvents.reduce((sum, e) => sum + (e.eventData?.score || 0), 0) / engagementEvents.length;
            metrics.engagementScore = avgEngagement;
        }
        return metrics;
    }
    calculateConfidenceInterval(conversions, participants) {
        if (participants === 0)
            return [0, 0];
        const rate = conversions / participants;
        const z = 1.96;
        const margin = z * Math.sqrt((rate * (1 - rate)) / participants);
        return [Math.max(0, rate - margin), Math.min(1, rate + margin)];
    }
    calculateStatisticalSignificance(variants) {
        const variantIds = Object.keys(variants);
        if (variantIds.length < 2)
            return { winner: undefined, significance: false };
        let maxRate = 0;
        let winner;
        for (const variantId of variantIds) {
            const variant = variants[variantId];
            if (variant.conversionRate > maxRate && variant.participants >= 30) {
                maxRate = variant.conversionRate;
                winner = variantId;
            }
        }
        const significance = maxRate > 0 && Object.values(variants).some((v) => v.participants >= 100);
        return { winner, significance };
    }
    generateRecommendations(experiment, results) {
        const recommendations = [];
        if (results.winner) {
            const winnerVariant = experiment.variants.find(v => v.id === results.winner);
            recommendations.push(`Implement ${winnerVariant?.name} as the default approach`);
            const winnerResults = results.variants[results.winner];
            if (winnerResults.conversionRate > 0.8) {
                recommendations.push('Consider expanding this approach to other assessment types');
            }
        }
        else {
            recommendations.push('No clear winner identified - consider extending experiment duration');
            recommendations.push('Review experiment design and success metrics');
        }
        const totalParticipants = Object.values(results.variants).reduce((sum, v) => sum + v.participants, 0);
        if (totalParticipants < experiment.minimumSampleSize) {
            recommendations.push('Increase traffic allocation to reach minimum sample size');
        }
        return recommendations;
    }
}
exports.ABTestingSystem = ABTestingSystem;
//# sourceMappingURL=ab-testing-system.js.map