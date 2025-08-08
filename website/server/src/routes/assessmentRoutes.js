const express = require('express');
const { body, validationResult } = require('express-validator');
const { getDatabase } = require('../database/connection');
const { assessmentQuestions, industrySpecificQuestions } = require('../data/assessment-questions');
const AssessmentScoringEngine = require('../services/assessmentScoring');
const router = express.Router();

// Initialize database connection
const db = getDatabase();

/**
 * Assessment API Routes
 * Handles all assessment-related endpoints
 */

// Validation middleware
const validateAssessmentStart = [
    body('assessmentType')
        .isIn(['questionnaire', 'scenario_based', 'conversational', 'visual_pattern', 'behavioral'])
        .withMessage('Invalid assessment type'),
    body('userProfile.industry')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Industry must be a string with max 100 characters'),
    body('userProfile.role')
        .optional()
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage('Role must be a string with max 100 characters'),
    body('userProfile.experience')
        .optional()
        .isInt({ min: 0, max: 50 })
        .withMessage('Experience must be a number between 0 and 50')
];

const validateAssessmentResponse = [
    body('sessionId')
        .isUUID()
        .withMessage('Session ID must be a valid UUID'),
    body('questionId')
        .isUUID()
        .withMessage('Question ID must be a valid UUID'),
    body('response')
        .notEmpty()
        .withMessage('Response is required'),
    body('responseTime')
        .isInt({ min: 0 })
        .withMessage('Response time must be a positive integer'),
    body('confidenceLevel')
        .optional()
        .isInt({ min: 1, max: 10 })
        .withMessage('Confidence level must be between 1 and 10')
];

// Start new assessment session
router.post('/start', validateAssessmentStart, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { assessmentType, userProfile = {} } = req.body;

        // Generate session ID
        const sessionId = require('uuid').v4();

        // Create user profile (simplified for now)
        const userId = require('uuid').v4();

        // Get questions for assessment type
        const questions = await getQuestionsForAssessment(assessmentType, userProfile);

        // Create session record (would normally save to database)
        const session = {
            id: sessionId,
            userId,
            assessmentType,
            status: 'in_progress',
            userProfile,
            questions: questions.map(q => ({ id: q.id, type: q.type })),
            createdAt: new Date().toISOString()
        };

        // Store session in memory for now (should be database)
        global.assessmentSessions = global.assessmentSessions || new Map();
        global.assessmentSessions.set(sessionId, session);

        res.json({
            success: true,
            data: {
                sessionId,
                userId,
                assessmentType,
                totalQuestions: questions.length,
                firstQuestion: questions[0] || null,
                estimatedTime: calculateEstimatedTime(assessmentType, questions.length)
            }
        });

    } catch (error) {
        console.error('Assessment start error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to start assessment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get next question
router.get('/question/:sessionId/:questionIndex', async (req, res) => {
    try {
        const { sessionId, questionIndex } = req.params;
        const index = parseInt(questionIndex);

        if (!sessionId || isNaN(index) || index < 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid session ID or question index'
            });
        }

        const session = global.assessmentSessions?.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Assessment session not found'
            });
        }

        const questions = await getQuestionsForAssessment(session.assessmentType, session.userProfile);

        if (index >= questions.length) {
            return res.json({
                success: true,
                data: {
                    completed: true,
                    totalQuestions: questions.length,
                    message: 'Assessment completed'
                }
            });
        }

        const question = questions[index];

        res.json({
            success: true,
            data: {
                question: {
                    id: question.id,
                    type: question.type,
                    text: question.text,
                    description: question.description,
                    options: question.options_json,
                    validation: question.validation_rules_json
                },
                progress: {
                    current: index + 1,
                    total: questions.length,
                    percentage: Math.round(((index + 1) / questions.length) * 100)
                }
            }
        });

    } catch (error) {
        console.error('Get question error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get question',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Submit assessment response
router.post('/response', validateAssessmentResponse, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { sessionId, questionId, response, responseTime, confidenceLevel } = req.body;

        const session = global.assessmentSessions?.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Assessment session not found'
            });
        }

        // Store response (would normally save to database)
        global.assessmentResponses = global.assessmentResponses || new Map();
        const responseId = require('uuid').v4();

        global.assessmentResponses.set(responseId, {
            id: responseId,
            sessionId,
            questionId,
            response,
            responseTime,
            confidenceLevel,
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                responseId,
                message: 'Response recorded successfully'
            }
        });

    } catch (error) {
        console.error('Submit response error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit response',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Complete assessment and get results
router.post('/complete/:sessionId', async (req, res) => {
    try {
        const { sessionId } = req.params;

        const session = global.assessmentSessions?.get(sessionId);
        if (!session) {
            return res.status(404).json({
                success: false,
                message: 'Assessment session not found'
            });
        }

        // Get all responses for this session
        const responses = Array.from(global.assessmentResponses?.values() || [])
            .filter(r => r.sessionId === sessionId);

        if (responses.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No responses found for this session'
            });
        }

        // Calculate results
        const results = await calculateAssessmentResults(session, responses);

        // Update session status
        session.status = 'completed';
        session.completedAt = new Date().toISOString();

        // Store results
        global.assessmentResults = global.assessmentResults || new Map();
        const resultId = require('uuid').v4();

        global.assessmentResults.set(resultId, {
            id: resultId,
            sessionId,
            userId: session.userId,
            ...results,
            createdAt: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                resultId,
                results,
                session: {
                    id: sessionId,
                    assessmentType: session.assessmentType,
                    completedAt: session.completedAt
                }
            }
        });

    } catch (error) {
        console.error('Complete assessment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to complete assessment',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Get assessment results
router.get('/results/:resultId', async (req, res) => {
    try {
        const { resultId } = req.params;

        const result = global.assessmentResults?.get(resultId);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: 'Assessment results not found'
            });
        }

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get results',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Helper functions
async function getQuestionsForAssessment(assessmentType, userProfile) {
    try {
        // Get all questions from all dimensions
        const allQuestions = [];

        // Add questions from each dimension
        Object.keys(assessmentQuestions).forEach(dimension => {
            assessmentQuestions[dimension].forEach(question => {
                allQuestions.push({
                    ...question,
                    options_json: question.options,
                    validation_rules_json: question.validation
                });
            });
        });

        // Add industry-specific questions if applicable
        if (userProfile.industry && industrySpecificQuestions[userProfile.industry]) {
            industrySpecificQuestions[userProfile.industry].forEach(question => {
                allQuestions.push({
                    ...question,
                    options_json: question.options,
                    validation_rules_json: question.validation
                });
            });
        }

        // Sort by order
        allQuestions.sort((a, b) => (a.order || 0) - (b.order || 0));

        return allQuestions;

    } catch (error) {
        console.error('Error getting questions:', error);
        throw error;
    }
}

// Legacy mock questions for fallback
function getLegacyMockQuestions() {
    const baseQuestions = [
        {
            id: require('uuid').v4(),
            type: 'multiple_choice',
            text: 'What is your primary role in AI decision-making within your organization?',
            description: 'This helps us understand your level of authority and influence in AI initiatives.',
            options_json: [
                { id: '1', text: 'I make final decisions on AI investments', value: 10 },
                { id: '2', text: 'I influence AI strategy significantly', value: 8 },
                { id: '3', text: 'I contribute to AI discussions', value: 6 },
                { id: '4', text: 'I implement AI decisions made by others', value: 4 },
                { id: '5', text: 'I observe AI developments', value: 2 }
            ],
            validation_rules_json: [
                { type: 'required', message: 'Please select your role in AI decision-making' }
            ],
            dimension: 'strategic_authority',
            weight: 1.0
        },
        {
            id: require('uuid').v4(),
            type: 'scale_rating',
            text: 'How would you rate your organization\'s current AI readiness?',
            description: 'Consider factors like data infrastructure, team capabilities, and leadership support.',
            options_json: [
                { id: '1', text: 'Not ready at all', value: 1 },
                { id: '10', text: 'Fully ready', value: 10 }
            ],
            validation_rules_json: [
                { type: 'required', message: 'Please rate your organization\'s AI readiness' },
                { type: 'range', value: { min: 1, max: 10 }, message: 'Rating must be between 1 and 10' }
            ],
            dimension: 'implementation_readiness',
            weight: 1.2
        }
    ];

    // Add industry-specific questions
    if (userProfile.industry) {
        baseQuestions.push({
            id: require('uuid').v4(),
            type: 'multiple_choice',
            text: `What are the primary AI opportunities in ${userProfile.industry}?`,
            description: 'Select the most relevant AI applications for your industry.',
            options_json: getIndustrySpecificOptions(userProfile.industry),
            validation_rules_json: [
                { type: 'required', message: 'Please select relevant AI opportunities' }
            ],
            dimension: 'industry_context',
            weight: 1.1
        });
    }

    return baseQuestions;
}

function getIndustrySpecificOptions(industry) {
    const industryOptions = {
        'financial': [
            { id: 'fraud', text: 'Fraud detection and prevention', value: 'fraud_detection' },
            { id: 'risk', text: 'Risk assessment and management', value: 'risk_management' },
            { id: 'customer', text: 'Customer service automation', value: 'customer_service' },
            { id: 'trading', text: 'Algorithmic trading', value: 'algorithmic_trading' }
        ],
        'healthcare': [
            { id: 'diagnosis', text: 'Diagnostic assistance', value: 'diagnostic_assistance' },
            { id: 'treatment', text: 'Treatment optimization', value: 'treatment_optimization' },
            { id: 'admin', text: 'Administrative automation', value: 'admin_automation' },
            { id: 'research', text: 'Medical research acceleration', value: 'medical_research' }
        ],
        'manufacturing': [
            { id: 'quality', text: 'Quality control automation', value: 'quality_control' },
            { id: 'maintenance', text: 'Predictive maintenance', value: 'predictive_maintenance' },
            { id: 'supply', text: 'Supply chain optimization', value: 'supply_chain' },
            { id: 'production', text: 'Production planning', value: 'production_planning' }
        ]
    };

    return industryOptions[industry] || [
        { id: 'general1', text: 'Process automation', value: 'process_automation' },
        { id: 'general2', text: 'Data analysis and insights', value: 'data_analysis' },
        { id: 'general3', text: 'Customer experience enhancement', value: 'customer_experience' },
        { id: 'general4', text: 'Decision support systems', value: 'decision_support' }
    ];
}

function calculateEstimatedTime(assessmentType, questionCount) {
    const timePerQuestion = {
        'questionnaire': 1.5, // minutes
        'scenario_based': 3,
        'conversational': 2,
        'visual_pattern': 2.5,
        'behavioral': 4
    };

    return Math.ceil(questionCount * (timePerQuestion[assessmentType] || 2));
}

async function calculateAssessmentResults(session, responses) {
    // Simplified scoring algorithm
    const dimensionScores = {};
    let totalScore = 0;
    let totalWeight = 0;

    // Get questions to access dimensions and weights
    const questions = await getQuestionsForAssessment(session.assessmentType, session.userProfile);
    const questionMap = new Map(questions.map(q => [q.id, q]));

    responses.forEach(response => {
        const question = questionMap.get(response.questionId);
        if (!question) return;

        const dimension = question.dimension;
        const weight = question.weight || 1.0;

        // Extract numeric value from response
        let value = 0;
        if (typeof response.response === 'number') {
            value = response.response;
        } else if (typeof response.response === 'object' && response.response.value) {
            value = parseFloat(response.response.value) || 0;
        }

        // Normalize to 0-100 scale
        const normalizedValue = Math.min(100, Math.max(0, value * 10));

        if (!dimensionScores[dimension]) {
            dimensionScores[dimension] = { total: 0, weight: 0, count: 0 };
        }

        dimensionScores[dimension].total += normalizedValue * weight;
        dimensionScores[dimension].weight += weight;
        dimensionScores[dimension].count += 1;

        totalScore += normalizedValue * weight;
        totalWeight += weight;
    });

    // Calculate final scores
    const overallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;

    const finalDimensionScores = {};
    Object.keys(dimensionScores).forEach(dimension => {
        const dimData = dimensionScores[dimension];
        finalDimensionScores[dimension] = dimData.weight > 0 ?
            Math.round(dimData.total / dimData.weight) : 0;
    });

    // Determine persona
    const persona = determinePersona(overallScore, finalDimensionScores, session.userProfile);

    // Generate recommendations
    const recommendations = generateRecommendations(persona, finalDimensionScores, session.userProfile);

    return {
        overallScore,
        dimensionScores: finalDimensionScores,
        persona,
        recommendations,
        completionTime: responses.reduce((sum, r) => sum + (r.responseTime || 0), 0),
        responseCount: responses.length
    };
}

function determinePersona(overallScore, dimensionScores, userProfile) {
    const authority = dimensionScores.strategic_authority || 0;
    const readiness = dimensionScores.implementation_readiness || 0;

    if (authority >= 80 && readiness >= 80) {
        return {
            type: 'strategic_visionary',
            title: 'Strategic Visionary',
            description: 'High authority with strong implementation readiness',
            characteristics: ['Strategic thinking', 'Implementation focus', 'Change leadership']
        };
    } else if (authority >= 60 && readiness >= 60) {
        return {
            type: 'tactical_implementer',
            title: 'Tactical Implementer',
            description: 'Moderate authority with good implementation capabilities',
            characteristics: ['Practical approach', 'Execution focus', 'Team coordination']
        };
    } else if (authority >= 40) {
        return {
            type: 'emerging_leader',
            title: 'Emerging Leader',
            description: 'Growing authority with developing implementation skills',
            characteristics: ['Learning orientation', 'Influence building', 'Skill development']
        };
    } else {
        return {
            type: 'strategic_observer',
            title: 'Strategic Observer',
            description: 'Limited authority but interested in AI developments',
            characteristics: ['Knowledge seeking', 'Trend awareness', 'Future preparation']
        };
    }
}

function generateRecommendations(persona, dimensionScores, userProfile) {
    const baseRecommendations = {
        immediate: [],
        shortTerm: [],
        longTerm: [],
        resources: []
    };

    // Persona-specific recommendations
    switch (persona.type) {
        case 'strategic_visionary':
            baseRecommendations.immediate.push('Develop comprehensive AI strategy');
            baseRecommendations.shortTerm.push('Build AI governance framework');
            baseRecommendations.longTerm.push('Lead industry AI transformation');
            break;

        case 'tactical_implementer':
            baseRecommendations.immediate.push('Identify pilot AI projects');
            baseRecommendations.shortTerm.push('Build implementation team');
            baseRecommendations.longTerm.push('Scale successful AI initiatives');
            break;

        case 'emerging_leader':
            baseRecommendations.immediate.push('Enhance AI knowledge and skills');
            baseRecommendations.shortTerm.push('Build internal AI advocacy');
            baseRecommendations.longTerm.push('Develop AI leadership capabilities');
            break;

        default:
            baseRecommendations.immediate.push('Start AI education and awareness');
            baseRecommendations.shortTerm.push('Engage with AI initiatives');
            baseRecommendations.longTerm.push('Prepare for AI-driven changes');
    }

    // Add industry-specific recommendations
    if (userProfile.industry) {
        baseRecommendations.resources.push(`${userProfile.industry} AI implementation guide`);
        baseRecommendations.resources.push(`Industry-specific AI use cases`);
    }

    return baseRecommendations;
}

module.exports = router;
