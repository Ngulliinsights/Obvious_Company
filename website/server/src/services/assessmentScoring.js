/**
 * Assessment Scoring Engine
 * Calculates scores, determines personas, and generates recommendations
 */

const { personaClassification } = require('../data/assessment-questions');

class AssessmentScoringEngine {
    constructor() {
        this.dimensionWeights = {
            strategic_authority: 0.20,
            organizational_influence: 0.20,
            resource_availability: 0.20,
            implementation_readiness: 0.25,
            cultural_alignment: 0.15
        };
    }

    /**
     * Calculate comprehensive assessment results
     */
    async calculateResults(session, responses, questions) {
        try {
            // Calculate dimension scores
            const dimensionScores = this.calculateDimensionScores(responses, questions);

            // Calculate overall score
            const overallScore = this.calculateOverallScore(dimensionScores);

            // Determine persona
            const persona = this.determinePersona(dimensionScores, session.userProfile);

            // Generate industry insights
            const industryInsights = this.generateIndustryInsights(
                dimensionScores,
                session.userProfile,
                responses
            );

            // Generate recommendations
            const recommendations = this.generateRecommendations(
                persona,
                dimensionScores,
                industryInsights,
                session.userProfile
            );

            // Generate curriculum pathway
            const curriculumPathway = this.generateCurriculumPathway(
                persona,
                dimensionScores,
                session.userProfile
            );

            // Calculate completion metrics
            const completionMetrics = this.calculateCompletionMetrics(responses);

            return {
                overallScore: Math.round(overallScore),
                dimensionScores: this.roundDimensionScores(dimensionScores),
                personaClassification: persona,
                industryInsights,
                recommendations,
                curriculumPathway,
                completionMetrics,
                calculatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('Assessment scoring error:', error);
            throw new Error('Failed to calculate assessment results');
        }
    }

    /**
     * Calculate scores for each dimension
     */
    calculateDimensionScores(responses, questions) {
        const dimensionData = {};

        // Initialize dimension data
        Object.keys(this.dimensionWeights).forEach(dimension => {
            dimensionData[dimension] = {
                totalScore: 0,
                totalWeight: 0,
                responseCount: 0
            };
        });

        // Process each response
        responses.forEach(response => {
            const question = questions.find(q => q.id === response.questionId);
            if (!question) return;

            const dimension = question.dimension;
            if (!dimensionData[dimension]) return;

            // Extract score from response
            const score = this.extractScoreFromResponse(response, question);
            const weight = question.weight || 1.0;

            // Normalize score to 0-100 scale
            const normalizedScore = this.normalizeScore(score, question);

            // Add to dimension totals
            dimensionData[dimension].totalScore += normalizedScore * weight;
            dimensionData[dimension].totalWeight += weight;
            dimensionData[dimension].responseCount += 1;
        });

        // Calculate final dimension scores
        const dimensionScores = {};
        Object.keys(dimensionData).forEach(dimension => {
            const data = dimensionData[dimension];
            if (data.totalWeight > 0) {
                dimensionScores[dimension] = data.totalScore / data.totalWeight;
            } else {
                dimensionScores[dimension] = 0;
            }
        });

        return dimensionScores;
    }

    /**
     * Extract numeric score from response based on question type
     */
    extractScoreFromResponse(response, question) {
        const responseValue = response.response_value_json || response.response;

        switch (question.type) {
            case 'multiple_choice':
                // Find the selected option and get its value
                const selectedOption = question.options_json?.find(
                    opt => opt.id === responseValue || opt.id === responseValue.value
                );
                return selectedOption ? selectedOption.value : 0;

            case 'scale_rating':
                // Direct numeric value
                return typeof responseValue === 'number' ? responseValue :
                       typeof responseValue === 'object' ? responseValue.value :
                       parseInt(responseValue) || 0;

            case 'text_input':
                // For text inputs, we might need sentiment analysis or keyword matching
                // For now, return neutral score
                return 5;

            default:
                return 0;
        }
    }

    /**
     * Normalize score to 0-100 scale based on question type
     */
    normalizeScore(score, question) {
        switch (question.type) {
            case 'multiple_choice':
                // Multiple choice values are already designed to be 0-10
                return Math.min(100, Math.max(0, score * 10));

            case 'scale_rating':
                // Scale ratings are typically 1-10, normalize to 0-100
                return Math.min(100, Math.max(0, (score - 1) * (100 / 9)));

            default:
                return Math.min(100, Math.max(0, score * 10));
        }
    }

    /**
     * Calculate overall weighted score
     */
    calculateOverallScore(dimensionScores) {
        let totalScore = 0;
        let totalWeight = 0;

        Object.keys(this.dimensionWeights).forEach(dimension => {
            const score = dimensionScores[dimension] || 0;
            const weight = this.dimensionWeights[dimension];

            totalScore += score * weight;
            totalWeight += weight;
        });

        return totalWeight > 0 ? totalScore / totalWeight : 0;
    }

    /**
     * Determine persona based on dimension scores
     */
    determinePersona(dimensionScores, userProfile) {
        let bestMatch = null;
        let bestScore = -1;

        // Check each persona against criteria
        Object.keys(personaClassification).forEach(personaKey => {
            const persona = personaClassification[personaKey];

            if (!persona.criteria || Object.keys(persona.criteria).length === 0) {
                // This is the default persona (strategic_observer)
                return;
            }

            let personaScore = 0;
            let totalWeight = 0;
            let meetsCriteria = true;

            Object.keys(persona.criteria).forEach(dimension => {
                const criteria = persona.criteria[dimension];
                const score = dimensionScores[dimension] || 0;
                const weight = criteria.weight || 0.25;

                // Check if minimum criteria is met
                if (score < criteria.min) {
                    meetsCriteria = false;
                }

                // Calculate weighted score
                personaScore += score * weight;
                totalWeight += weight;
            });

            if (meetsCriteria && totalWeight > 0) {
                const finalScore = personaScore / totalWeight;
                if (finalScore > bestScore) {
                    bestScore = finalScore;
                    bestMatch = personaKey;
                }
            }
        });

        // Default to strategic_observer if no match
        const selectedPersona = bestMatch || 'strategic_observer';
        const personaData = personaClassification[selectedPersona];

        return {
            primary_persona: personaData.title,
            persona_key: selectedPersona,
            confidence_score: Math.round(bestScore > 0 ? bestScore : 50),
            description: personaData.description,
            characteristics: personaData.characteristics,
            secondary_characteristics: this.getSecondaryCharacteristics(dimensionScores)
        };
    }

    /**
     * Get secondary characteristics based on dimension strengths
     */
    getSecondaryCharacteristics(dimensionScores) {
        const characteristics = [];

        if (dimensionScores.strategic_authority > 70) {
            characteristics.push('Strategic thinking');
        }
        if (dimensionScores.organizational_influence > 70) {
            characteristics.push('Change leadership');
        }
        if (dimensionScores.resource_availability > 70) {
            characteristics.push('Resource management');
        }
        if (dimensionScores.implementation_readiness > 70) {
            characteristics.push('Implementation focus');
        }
        if (dimensionScores.cultural_alignment > 70) {
            characteristics.push('Cultural intelligence');
        }

        return characteristics.slice(0, 3); // Return top 3
    }

    /**
     * Generate industry-specific insights
     */
    generateIndustryInsights(dimensionScores, userProfile, responses) {
        const industry = userProfile.industry || 'general';
        const overallReadiness = this.calculateOverallScore(dimensionScores);

        const industryInsights = {
            industry: industry,
            sector_readiness: Math.round(overallReadiness),
            regulatory_considerations: this.getRegulatoryConsiderations(industry),
            implementation_priorities: this.getImplementationPriorities(industry, dimensionScores),
            industry_benchmarks: this.getIndustryBenchmarks(industry, overallReadiness),
            specific_opportunities: this.getIndustryOpportunities(industry, dimensionScores)
        };

        return industryInsights;
    }

    /**
     * Get regulatory considerations by industry
     */
    getRegulatoryConsiderations(industry) {
        const regulations = {
            financial: [
                'Data privacy and customer protection (GDPR, CCPA)',
                'Algorithmic bias and fair lending compliance',
                'Model explainability requirements',
                'Risk management and capital adequacy'
            ],
            healthcare: [
                'HIPAA compliance and patient data protection',
                'FDA approval pathways for AI medical devices',
                'Clinical validation and safety requirements',
                'Interoperability and data standards'
            ],
            manufacturing: [
                'Safety standards and worker protection',
                'Quality control and product liability',
                'Environmental compliance',
                'Supply chain transparency'
            ],
            government: [
                'Public accountability and transparency',
                'Ethical AI and bias prevention',
                'Citizen privacy protection',
                'Procurement and vendor management'
            ]
        };

        return regulations[industry] || [
            'Data privacy and protection',
            'Ethical AI implementation',
            'Transparency and accountability',
            'Industry-specific compliance requirements'
        ];
    }

    /**
     * Get implementation priorities by industry and scores
     */
    getImplementationPriorities(industry, dimensionScores) {
        const basePriorities = {
            financial: ['Risk management', 'Customer experience', 'Fraud detection', 'Regulatory compliance'],
            healthcare: ['Patient safety', 'Clinical outcomes', 'Operational efficiency', 'Regulatory compliance'],
            manufacturing: ['Quality control', 'Predictive maintenance', 'Supply chain optimization', 'Safety'],
            government: ['Citizen services', 'Operational efficiency', 'Transparency', 'Cost reduction']
        };

        let priorities = basePriorities[industry] || ['Process optimization', 'Decision support', 'Efficiency gains', 'Innovation'];

        // Adjust priorities based on dimension scores
        if (dimensionScores.implementation_readiness < 50) {
            priorities.unshift('Foundation building');
        }
        if (dimensionScores.cultural_alignment < 50) {
            priorities.unshift('Change management');
        }

        return priorities.slice(0, 4);
    }

    /**
     * Get industry benchmarks
     */
    getIndustryBenchmarks(industry, overallReadiness) {
        const benchmarks = {
            financial: { average: 72, leaders: 85, laggards: 45 },
            healthcare: { average: 58, leaders: 78, laggards: 35 },
            manufacturing: { average: 65, leaders: 82, laggards: 40 },
            government: { average: 48, leaders: 68, laggards: 28 }
        };

        const industryBenchmark = benchmarks[industry] || { average: 60, leaders: 80, laggards: 35 };

        let position = 'average';
        if (overallReadiness >= industryBenchmark.leaders) {
            position = 'leader';
        } else if (overallReadiness <= industryBenchmark.laggards) {
            position = 'developing';
        }

        return {
            industry_average: industryBenchmark.average,
            industry_leaders: industryBenchmark.leaders,
            your_position: position,
            percentile: this.calculatePercentile(overallReadiness, industryBenchmark)
        };
    }

    /**
     * Calculate percentile within industry
     */
    calculatePercentile(score, benchmark) {
        const range = benchmark.leaders - benchmark.laggards;
        const position = score - benchmark.laggards;
        return Math.max(5, Math.min(95, Math.round((position / range) * 100)));
    }

    /**
     * Get industry-specific AI opportunities
     */
    getIndustryOpportunities(industry, dimensionScores) {
        const opportunities = {
            financial: [
                'Automated risk assessment and credit scoring',
                'Real-time fraud detection and prevention',
                'Personalized customer service and recommendations',
                'Regulatory compliance automation'
            ],
            healthcare: [
                'Clinical decision support systems',
                'Predictive analytics for patient outcomes',
                'Administrative process automation',
                'Medical imaging and diagnostics'
            ],
            manufacturing: [
                'Predictive maintenance and equipment optimization',
                'Quality control and defect detection',
                'Supply chain intelligence and optimization',
                'Production planning and scheduling'
            ],
            government: [
                'Citizen service automation and chatbots',
                'Predictive analytics for resource allocation',
                'Document processing and case management',
                'Public safety and emergency response'
            ]
        };

        return opportunities[industry] || [
            'Process automation and efficiency',
            'Data analysis and insights',
            'Customer experience enhancement',
            'Decision support systems'
        ];
    }

    /**
     * Generate comprehensive recommendations
     */
    generateRecommendations(persona, dimensionScores, industryInsights, userProfile) {
        const personaKey = persona.persona_key;
        const personaData = personaClassification[personaKey];

        const recommendations = {
            program: personaData.recommendations.program,
            program_title: this.getProgramTitle(personaData.recommendations.program),
            description: `Based on your ${persona.primary_persona} profile and ${Math.round(this.calculateOverallScore(dimensionScores))}% readiness score`,
            timeline: personaData.recommendations.timeline,
            investment: personaData.recommendations.investment,
            immediate_actions: this.getImmediateActions(personaKey, dimensionScores),
            short_term_goals: this.getShortTermGoals(personaKey, dimensionScores, industryInsights),
            long_term_vision: this.getLongTermVision(personaKey, dimensionScores, industryInsights),
            success_metrics: this.getSuccessMetrics(personaKey, industryInsights),
            risk_mitigation: this.getRiskMitigation(dimensionScores, industryInsights)
        };

        return recommendations;
    }

    /**
     * Get program title from program key
     */
    getProgramTitle(programKey) {
        const titles = {
            foundation: 'Foundation Program',
            amplification: 'Amplification Program',
            mastery: 'Mastery Program',
            enterprise: 'Enterprise Solutions',
            consultation: 'Strategic Consultation'
        };
        return titles[programKey] || 'Custom Program';
    }

    /**
     * Get immediate actions based on persona and scores
     */
    getImmediateActions(personaKey, dimensionScores) {
        const baseActions = {
            strategic_architect: [
                'Schedule executive AI strategy session',
                'Conduct organizational AI readiness audit',
                'Identify high-impact AI pilot opportunities',
                'Establish AI governance framework'
            ],
            strategic_catalyst: [
                'Build cross-functional AI task force',
                'Develop AI adoption roadmap',
                'Identify change champions across departments',
                'Create AI awareness and education program'
            ],
            strategic_contributor: [
                'Complete AI fundamentals training',
                'Identify process optimization opportunities',
                'Build relationships with technical teams',
                'Document current workflow inefficiencies'
            ],
            strategic_explorer: [
                'Enroll in AI literacy program',
                'Join AI professional communities',
                'Attend industry AI conferences and webinars',
                'Start personal AI experimentation'
            ],
            strategic_observer: [
                'Schedule strategic consultation',
                'Complete AI readiness self-assessment',
                'Research industry AI use cases',
                'Connect with AI implementation experts'
            ]
        };

        let actions = baseActions[personaKey] || baseActions.strategic_observer;

        // Add dimension-specific actions
        if (dimensionScores.resource_availability < 50) {
            actions.push('Develop business case for AI investment');
        }
        if (dimensionScores.cultural_alignment < 50) {
            actions.push('Address organizational change readiness');
        }

        return actions.slice(0, 4);
    }

    /**
     * Get short-term goals (1-3 months)
     */
    getShortTermGoals(personaKey, dimensionScores, industryInsights) {
        const baseGoals = {
            strategic_architect: [
                'Launch first AI pilot project',
                'Establish AI center of excellence',
                'Secure AI implementation budget',
                'Build strategic AI partnerships'
            ],
            strategic_catalyst: [
                'Complete AI leadership training',
                'Implement first departmental AI solution',
                'Build organizational AI capability',
                'Establish success measurement framework'
            ],
            strategic_contributor: [
                'Complete foundational AI training',
                'Lead process automation initiative',
                'Build technical collaboration skills',
                'Develop AI project management expertise'
            ],
            strategic_explorer: [
                'Complete comprehensive AI education',
                'Identify personal AI productivity tools',
                'Build AI professional network',
                'Develop AI strategic thinking skills'
            ],
            strategic_observer: [
                'Complete strategic readiness assessment',
                'Develop AI implementation plan',
                'Build internal AI advocacy',
                'Establish learning and development path'
            ]
        };

        return baseGoals[personaKey] || baseGoals.strategic_observer;
    }

    /**
     * Get long-term vision (6-12 months)
     */
    getLongTermVision(personaKey, dimensionScores, industryInsights) {
        const baseVision = {
            strategic_architect: [
                'Lead organization-wide AI transformation',
                'Achieve measurable AI ROI across multiple functions',
                'Establish industry leadership in AI adoption',
                'Build sustainable AI innovation capability'
            ],
            strategic_catalyst: [
                'Drive cultural transformation toward AI adoption',
                'Scale successful AI initiatives across organization',
                'Develop next generation of AI leaders',
                'Create competitive advantage through AI'
            ],
            strategic_contributor: [
                'Become recognized AI implementation expert',
                'Lead multiple successful AI projects',
                'Mentor others in AI adoption',
                'Contribute to organizational AI strategy'
            ],
            strategic_explorer: [
                'Develop advanced AI strategic capabilities',
                'Take on AI leadership responsibilities',
                'Contribute to industry AI best practices',
                'Build career around AI expertise'
            ],
            strategic_observer: [
                'Transition to active AI implementation role',
                'Develop organizational AI influence',
                'Build comprehensive AI knowledge base',
                'Prepare for future AI leadership opportunities'
            ]
        };

        return baseVision[personaKey] || baseVision.strategic_observer;
    }

    /**
     * Get success metrics
     */
    getSuccessMetrics(personaKey, industryInsights) {
        const baseMetrics = [
            'AI project success rate > 80%',
            'Implementation timeline adherence > 90%',
            'User adoption rate > 75%',
            'ROI achievement within 12 months'
        ];

        // Add industry-specific metrics
        const industryMetrics = {
            financial: ['Risk reduction > 25%', 'Customer satisfaction improvement > 20%'],
            healthcare: ['Patient outcome improvement > 15%', 'Operational efficiency gain > 30%'],
            manufacturing: ['Quality improvement > 20%', 'Downtime reduction > 35%'],
            government: ['Service delivery improvement > 25%', 'Cost reduction > 20%']
        };

        const industry = industryInsights.industry;
        if (industryMetrics[industry]) {
            baseMetrics.push(...industryMetrics[industry]);
        }

        return baseMetrics.slice(0, 5);
    }

    /**
     * Get risk mitigation strategies
     */
    getRiskMitigation(dimensionScores, industryInsights) {
        const risks = [];

        if (dimensionScores.implementation_readiness < 60) {
            risks.push('Start with low-risk pilot projects to build confidence');
        }
        if (dimensionScores.cultural_alignment < 60) {
            risks.push('Invest heavily in change management and communication');
        }
        if (dimensionScores.resource_availability < 60) {
            risks.push('Secure executive sponsorship and dedicated funding');
        }
        if (dimensionScores.strategic_authority < 60) {
            risks.push('Build coalition of supporters and demonstrate quick wins');
        }

        // Add industry-specific risks
        const industryRisks = {
            financial: ['Ensure regulatory compliance from day one'],
            healthcare: ['Prioritize patient safety and clinical validation'],
            manufacturing: ['Focus on safety and quality standards'],
            government: ['Maintain transparency and public accountability']
        };

        const industry = industryInsights.industry;
        if (industryRisks[industry]) {
            risks.push(...industryRisks[industry]);
        }

        return risks.slice(0, 4);
    }

    /**
     * Generate curriculum pathway
     */
    generateCurriculumPathway(persona, dimensionScores, userProfile) {
        const personaKey = persona.persona_key;

        const baseCurriculum = {
            strategic_architect: {
                core_modules: [
                    'Executive AI Strategy and Governance',
                    'AI Business Case Development',
                    'Organizational AI Transformation',
                    'AI Risk Management and Ethics'
                ],
                duration: '12-16 weeks',
                format: 'Executive cohort with 1:1 coaching'
            },
            strategic_catalyst: {
                core_modules: [
                    'AI Leadership and Change Management',
                    'Cross-functional AI Implementation',
                    'AI Team Building and Development',
                    'AI Innovation and Scaling'
                ],
                duration: '8-12 weeks',
                format: 'Interactive workshops with peer learning'
            },
            strategic_contributor: {
                core_modules: [
                    'AI Fundamentals for Leaders',
                    'Process Optimization with AI',
                    'AI Project Management',
                    'Technical Collaboration Skills'
                ],
                duration: '6-8 weeks',
                format: 'Blended learning with practical projects'
            },
            strategic_explorer: {
                core_modules: [
                    'AI Literacy and Strategic Thinking',
                    'Personal Productivity with AI',
                    'AI Career Development',
                    'Future of Work and AI'
                ],
                duration: '4-6 weeks',
                format: 'Self-paced with group discussions'
            },
            strategic_observer: {
                core_modules: [
                    'AI Awareness and Trends',
                    'Strategic AI Planning',
                    'Building AI Readiness',
                    'AI Implementation Preparation'
                ],
                duration: '2-4 weeks',
                format: 'Flexible consultation-based learning'
            }
        };

        const curriculum = baseCurriculum[personaKey] || baseCurriculum.strategic_observer;

        // Add industry-specific modules
        const industry = userProfile.industry;
        if (industry && industry !== 'general') {
            curriculum.industry_modules = [
                `AI in ${industry}: Use Cases and Applications`,
                `${industry} Regulatory and Compliance Considerations`,
                `${industry} AI Implementation Best Practices`
            ];
        }

        // Add dimension-specific modules based on weak areas
        curriculum.supplementary_modules = [];
        if (dimensionScores.cultural_alignment < 60) {
            curriculum.supplementary_modules.push('Change Management and Cultural Transformation');
        }
        if (dimensionScores.resource_availability < 60) {
            curriculum.supplementary_modules.push('AI Business Case and ROI Development');
        }
        if (dimensionScores.implementation_readiness < 60) {
            curriculum.supplementary_modules.push('AI Implementation Planning and Execution');
        }

        return curriculum;
    }

    /**
     * Calculate completion metrics
     */
    calculateCompletionMetrics(responses) {
        const totalTime = responses.reduce((sum, r) => sum + (r.response_time_ms || 0), 0);
        const avgConfidence = responses.reduce((sum, r) => sum + (r.confidence_level || 5), 0) / responses.length;

        return {
            total_questions: responses.length,
            completion_time_minutes: Math.round(totalTime / 60000),
            average_confidence: Math.round(avgConfidence * 10) / 10,
            completion_rate: 100 // Since they completed it
        };
    }

    /**
     * Round dimension scores for display
     */
    roundDimensionScores(dimensionScores) {
        const rounded = {};
        Object.keys(dimensionScores).forEach(dimension => {
            rounded[dimension] = Math.round(dimensionScores[dimension]);
        });
        return rounded;
    }
}

module.exports = AssessmentScoringEngine;
