/**
 * Continuous Improvement Framework
 * Implements A/B testing, ML model refinement, and automated performance monitoring
 */

class ContinuousImprovementFramework {
    constructor(analyticsEngine, performanceTracker) {
        this.analytics = analyticsEngine;
        this.performance = performanceTracker;
        this.experiments = new Map();
        this.modelVersions = new Map();
        this.alertSystem = new AlertSystem();
        this.contentUpdater = new ContentUpdater();
        this.expertReviewScheduler = new ExpertReviewScheduler();
        
        // Configuration
        this.config = {
            minSampleSize: 100,
            confidenceLevel: 0.95,
            significanceThreshold: 0.05,
            modelRetrainingThreshold: 0.1, // 10% accuracy drop
            alertCooldownMs: 30 * 60 * 1000, // 30 minutes
            expertReviewIntervalMs: 7 * 24 * 60 * 60 * 1000 // 7 days
        };
        
        this.isRunning = false;
    }

    /**
     * Start the continuous improvement framework
     */
    start() {
        if (this.isRunning) return;
        
        console.log('Starting Continuous Improvement Framework...');
        
        // Start A/B testing system
        this.startABTestingSystem();
        
        // Start model monitoring
        this.startModelMonitoring();
        
        // Start automated performance monitoring
        this.startPerformanceMonitoring();
        
        // Schedule expert reviews
        this.scheduleExpertReviews();
        
        this.isRunning = true;
        console.log('✅ Continuous Improvement Framework started');
    }

    /**
     * Stop the continuous improvement framework
     */
    stop() {
        if (!this.isRunning) return;
        
        console.log('Stopping Continuous Improvement Framework...');
        
        this.alertSystem.stop();
        this.contentUpdater.stop();
        this.expertReviewScheduler.stop();
        
        this.isRunning = false;
        console.log('✅ Continuous Improvement Framework stopped');
    }

    /**
     * Create A/B test experiment
     */
    createABTest(experimentConfig) {
        const experiment = {
            id: this.generateExperimentId(),
            name: experimentConfig.name,
            description: experimentConfig.description,
            type: experimentConfig.type, // 'question_variation', 'flow_change', 'ui_modification'
            variants: experimentConfig.variants,
            targetMetric: experimentConfig.targetMetric,
            startDate: new Date(),
            endDate: experimentConfig.endDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days default
            status: 'active',
            participants: new Map(),
            results: {
                control: { count: 0, conversions: 0, metrics: {} },
                variant: { count: 0, conversions: 0, metrics: {} }
            },
            statisticalSignificance: null,
            winner: null
        };

        this.experiments.set(experiment.id, experiment);
        
        console.log(`Created A/B test: ${experiment.name} (${experiment.id})`);
        return experiment.id;
    }

    /**
     * Assign user to A/B test variant
     */
    assignToVariant(experimentId, userId, sessionId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || experiment.status !== 'active') {
            return 'control'; // Default to control if experiment not found or inactive
        }

        // Check if user already assigned
        if (experiment.participants.has(userId)) {
            return experiment.participants.get(userId);
        }

        // Simple random assignment (50/50 split)
        const variant = Math.random() < 0.5 ? 'control' : 'variant';
        experiment.participants.set(userId, variant);
        
        // Track assignment
        this.analytics.trackEvent('ab_test_assignment', {
            experimentId,
            userId,
            sessionId,
            variant,
            experimentName: experiment.name
        });

        return variant;
    }

    /**
     * Record A/B test conversion
     */
    recordConversion(experimentId, userId, conversionData) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment || !experiment.participants.has(userId)) {
            return;
        }

        const variant = experiment.participants.get(userId);
        experiment.results[variant].conversions++;
        
        // Update metrics
        if (conversionData.metrics) {
            for (const [metric, value] of Object.entries(conversionData.metrics)) {
                if (!experiment.results[variant].metrics[metric]) {
                    experiment.results[variant].metrics[metric] = [];
                }
                experiment.results[variant].metrics[metric].push(value);
            }
        }

        // Check if experiment has enough data for analysis
        this.checkExperimentSignificance(experimentId);
        
        // Track conversion
        this.analytics.trackEvent('ab_test_conversion', {
            experimentId,
            userId,
            variant,
            conversionData: this.sanitizeConversionData(conversionData)
        });
    }

    /**
     * Check statistical significance of A/B test
     */
    checkExperimentSignificance(experimentId) {
        const experiment = this.experiments.get(experimentId);
        if (!experiment) return;

        const control = experiment.results.control;
        const variant = experiment.results.variant;
        
        // Need minimum sample size
        if (control.count < this.config.minSampleSize || variant.count < this.config.minSampleSize) {
            return;
        }

        // Calculate conversion rates
        const controlRate = control.conversions / control.count;
        const variantRate = variant.conversions / variant.count;
        
        // Perform statistical significance test (simplified z-test)
        const significance = this.calculateStatisticalSignificance(
            controlRate, control.count,
            variantRate, variant.count
        );

        experiment.statisticalSignificance = significance;

        // Determine winner if significant
        if (significance.pValue < this.config.significanceThreshold) {
            experiment.winner = variantRate > controlRate ? 'variant' : 'control';
            experiment.status = 'completed';
            
            console.log(`A/B Test ${experiment.name} completed. Winner: ${experiment.winner}`);
            
            // Generate recommendations
            this.generateABTestRecommendations(experiment);
        }
    }

    /**
     * Calculate statistical significance using z-test
     */
    calculateStatisticalSignificance(rate1, n1, rate2, n2) {
        const p1 = rate1;
        const p2 = rate2;
        const pooledP = (rate1 * n1 + rate2 * n2) / (n1 + n2);
        const se = Math.sqrt(pooledP * (1 - pooledP) * (1/n1 + 1/n2));
        const z = (p1 - p2) / se;
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

        return {
            zScore: z,
            pValue: pValue,
            isSignificant: pValue < this.config.significanceThreshold,
            confidenceInterval: this.calculateConfidenceInterval(p1, n1, p2, n2)
        };
    }

    /**
     * Normal cumulative distribution function approximation
     */
    normalCDF(x) {
        return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
    }

    /**
     * Error function approximation
     */
    erf(x) {
        const a1 =  