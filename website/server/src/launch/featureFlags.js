/**
 * Feature Flags System for Controlled Rollout
 * Manages feature toggles for gradual platform deployment
 */

class FeatureFlagsManager {
    constructor() {
        this.flags = new Map();
        this.userSegments = new Map();
        this.rolloutPercentages = new Map();
        this.initializeDefaultFlags();
    }

    /**
     * Initialize default feature flags for controlled rollout
     */
    initializeDefaultFlags() {
        // Assessment Platform Features
        this.setFlag('assessment_platform_enabled', {
            enabled: true,
            rolloutPercentage: 100,
            description: 'Main assessment platform functionality'
        });

        this.setFlag('multi_modal_assessments', {
            enabled: true,
            rolloutPercentage: 50,
            description: 'Alternative assessment modalities (scenario, conversational, visual)'
        });

        this.setFlag('industry_specific_diagnostics', {
            enabled: true,
            rolloutPercentage: 75,
            description: 'Industry-specific assessment customization'
        });

        this.setFlag('persona_classification', {
            enabled: true,
            rolloutPercentage: 100,
            description: 'Strategic persona classification system'
        });

        this.setFlag('adaptive_curriculum', {
            enabled: true,
            rolloutPercentage: 25,
            description: 'Personalized curriculum generation'
        });

        this.setFlag('cultural_sensitivity', {
            enabled: true,
            rolloutPercentage: 80,
            description: 'Cultural and contextual adaptation features'
        });

        this.setFlag('advanced_analytics', {
            enabled: true,
            rolloutPercentage: 100,
            description: 'Performance tracking and optimization analytics'
        });

        this.setFlag('real_time_feedback', {
            enabled: true,
            rolloutPercentage: 100,
            description: 'User feedback collection and issue reporting'
        });

        // Beta Features
        this.setFlag('ai_powered_recommendations', {
            enabled: false,
            rolloutPercentage: 10,
            description: 'AI-powered service recommendations (beta)'
        });

        this.setFlag('collaborative_assessments', {
            enabled: false,
            rolloutPercentage: 5,
            description: 'Team-based assessment capabilities (experimental)'
        });
    }

    /**
     * Set a feature flag with configuration
     */
    setFlag(flagName, config) {
        this.flags.set(flagName, {
            enabled: config.enabled || false,
            rolloutPercentage: config.rolloutPercentage || 0,
            description: config.description || '',
            userSegments: config.userSegments || [],
            conditions: config.conditions || {},
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }

    /**
     * Check if a feature is enabled for a specific user
     */
    isFeatureEnabled(flagName, userContext = {}) {
        const flag = this.flags.get(flagName);
        
        if (!flag) {
            console.warn(`Feature flag '${flagName}' not found`);
            return false;
        }

        // If flag is globally disabled, return false
        if (!flag.enabled) {
            return false;
        }

        // Check user segment targeting
        if (flag.userSegments.length > 0) {
            const userSegment = this.getUserSegment(userContext);
            if (!flag.userSegments.includes(userSegment)) {
                return false;
            }
        }

        // Check rollout percentage
        if (flag.rolloutPercentage < 100) {
            const userHash = this.getUserHash(userContext);
            const rolloutThreshold = flag.rolloutPercentage / 100;
            
            if (userHash > rolloutThreshold) {
                return false;
            }
        }

        // Check additional conditions
        if (flag.conditions && Object.keys(flag.conditions).length > 0) {
            return this.evaluateConditions(flag.conditions, userContext);
        }

        return true;
    }

    /**
     * Get user segment for targeting
     */
    getUserSegment(userContext) {
        const { email, industry, role, assessmentHistory } = userContext;

        // VIP users (existing clients or high-value prospects)
        if (email && this.isVIPUser(email)) {
            return 'vip';
        }

        // Beta testers
        if (email && this.isBetaTester(email)) {
            return 'beta';
        }

        // Industry-based segments
        if (industry) {
            return `industry_${industry.toLowerCase()}`;
        }

        // Role-based segments
        if (role && ['ceo', 'cto', 'founder'].includes(role.toLowerCase())) {
            return 'executive';
        }

        // Returning users
        if (assessmentHistory && assessmentHistory.length > 0) {
            return 'returning';
        }

        return 'general';
    }

    /**
     * Generate consistent hash for user-based rollout
     */
    getUserHash(userContext) {
        const identifier = userContext.email || userContext.sessionId || 'anonymous';
        let hash = 0;
        
        for (let i = 0; i < identifier.length; i++) {
            const char = identifier.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        
        return Math.abs(hash) / Math.pow(2, 31);
    }

    /**
     * Check if user is VIP (existing client or high-value prospect)
     */
    isVIPUser(email) {
        const vipDomains = [
            'safaricom.co.ke',
            'equity.co.ke',
            'kcb.co.ke',
            'co-opbank.co.ke'
        ];
        
        const domain = email.split('@')[1];
        return vipDomains.includes(domain);
    }

    /**
     * Check if user is beta tester
     */
    isBetaTester(email) {
        const betaTesters = [
            'beta@theobviouscompany.com',
            'test@theobviouscompany.com'
        ];
        
        return betaTesters.includes(email);
    }

    /**
     * Evaluate additional conditions
     */
    evaluateConditions(conditions, userContext) {
        for (const [key, value] of Object.entries(conditions)) {
            switch (key) {
                case 'minAssessments':
                    if (!userContext.assessmentHistory || userContext.assessmentHistory.length < value) {
                        return false;
                    }
                    break;
                case 'industry':
                    if (userContext.industry !== value) {
                        return false;
                    }
                    break;
                case 'timeOfDay':
                    const currentHour = new Date().getHours();
                    if (currentHour < value.start || currentHour > value.end) {
                        return false;
                    }
                    break;
                default:
                    console.warn(`Unknown condition: ${key}`);
            }
        }
        
        return true;
    }

    /**
     * Get all feature flags for admin dashboard
     */
    getAllFlags() {
        const flagsArray = [];
        
        for (const [name, config] of this.flags.entries()) {
            flagsArray.push({
                name,
                ...config
            });
        }
        
        return flagsArray;
    }

    /**
     * Update feature flag configuration
     */
    updateFlag(flagName, updates) {
        const flag = this.flags.get(flagName);
        
        if (!flag) {
            throw new Error(`Feature flag '${flagName}' not found`);
        }

        const updatedFlag = {
            ...flag,
            ...updates,
            updatedAt: new Date()
        };

        this.flags.set(flagName, updatedFlag);
        
        console.log(`Feature flag '${flagName}' updated:`, updates);
        
        return updatedFlag;
    }

    /**
     * Get feature flag usage statistics
     */
    getUsageStats(flagName, timeRange = '24h') {
        // This would integrate with analytics system
        // For now, return mock data
        return {
            flagName,
            timeRange,
            totalChecks: 1250,
            enabledChecks: 875,
            disabledChecks: 375,
            enablementRate: 0.7,
            userSegments: {
                vip: 45,
                beta: 12,
                executive: 234,
                returning: 456,
                general: 503
            }
        };
    }

    /**
     * Gradual rollout management
     */
    async graduateRollout(flagName, targetPercentage, incrementPercentage = 10, intervalHours = 24) {
        const flag = this.flags.get(flagName);
        
        if (!flag) {
            throw new Error(`Feature flag '${flagName}' not found`);
        }

        const currentPercentage = flag.rolloutPercentage;
        
        if (currentPercentage >= targetPercentage) {
            console.log(`Flag '${flagName}' already at or above target percentage`);
            return;
        }

        const nextPercentage = Math.min(currentPercentage + incrementPercentage, targetPercentage);
        
        this.updateFlag(flagName, { rolloutPercentage: nextPercentage });
        
        console.log(`Graduated rollout for '${flagName}': ${currentPercentage}% -> ${nextPercentage}%`);
        
        // Schedule next graduation if not at target
        if (nextPercentage < targetPercentage) {
            setTimeout(() => {
                this.graduateRollout(flagName, targetPercentage, incrementPercentage, intervalHours);
            }, intervalHours * 60 * 60 * 1000);
        }
    }
}

// Export singleton instance
const featureFlagsManager = new FeatureFlagsManager();

module.exports = {
    FeatureFlagsManager,
    featureFlagsManager
};