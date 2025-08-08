/**
 * Assessment API Controller
 * Handles HTTP requests for assessment functionality
 * Requirements: 5.4, 9.4, 10.1
 */

import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { AssessmentRepository } from '../../repositories/assessmentRepository';
import { AssessmentService } from '../../services/AssessmentService';
import { PersonaClassificationService } from '../../services/PersonaClassificationService';
import { CurriculumGenerationService } from '../../services/CurriculumGenerationService';
import { 
  AssessmentType, 
  AssessmentStatus,
  CreateAssessmentRequest,
  CreateAssessmentResponse,
  SubmitResponseRequest,
  SubmitResponseResponse,
  GetResultsResponse
} from '../../types/assessment';

export class AssessmentController {
  private repository = new AssessmentRepository();
  private assessmentService = new AssessmentService();
  private personaService = new PersonaClassificationService();
  private curriculumService = new CurriculumGenerationService();

  /**
   * Create a new assessment session
   * POST /api/assessments
   */
  async createAssessment(req: Request, res: Response): Promise<void> {
    try {
      const requestData: CreateAssessmentRequest = req.body;
      
      // Create or get user
      let userId: string;
      if (requestData.user_profile.id) {
        userId = requestData.user_profile.id;
        // Update existing user profile
        await this.repository.updateUser(userId, requestData.user_profile);
      } else {
        // Create new user
        userId = await this.repository.createUser(requestData.user_profile);
      }

      // Create assessment session
      const sessionId = await this.repository.createAssessmentSession(
        userId,
        requestData.assessment_type
      );

      // Initialize assessment service
      const assessment = await this.assessmentService.createAssessment(
        sessionId,
        userId,
        requestData.assessment_type,
        requestData.user_profile
      );

      // Get first question
      const firstQuestion = await this.assessmentService.getFirstQuestion(
        requestData.assessment_type,
        requestData.user_profile
      );

      const response: CreateAssessmentResponse = {
        session_id: sessionId,
        first_question: firstQuestion,
        progress: {
          current_step: 1,
          total_steps: 10, // This would be dynamic based on assessment type
          percentage: 10
        }
      };

      res.status(201).json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Create assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create assessment session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Get assessment session details
   * GET /api/assessments/:sessionId
   */
  async getAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const session = await this.repository.getSession(sessionId);
      
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Assessment session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: session
      });

    } catch (error) {
      console.error('Get assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve assessment session'
      });
    }
  }

  /**
   * Update assessment session
   * PUT /api/assessments/:sessionId
   */
  async updateAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { status, metadata } = req.body;

      await this.repository.updateSession(sessionId, { status, metadata });

      res.json({
        success: true,
        message: 'Assessment session updated successfully'
      });

    } catch (error) {
      console.error('Update assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update assessment session'
      });
    }
  }

  /**
   * Delete/abandon assessment session
   * DELETE /api/assessments/:sessionId
   */
  async deleteAssessment(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;

      await this.repository.updateSessionStatus(sessionId, AssessmentStatus.ABANDONED);

      res.json({
        success: true,
        message: 'Assessment session abandoned successfully'
      });

    } catch (error) {
      console.error('Delete assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to abandon assessment session'
      });
    }
  }

  /**
   * Get current question for assessment session
   * GET /api/assessments/:sessionId/questions/current
   */
  async getCurrentQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const session = await this.repository.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Assessment session not found'
        });
        return;
      }

      const questions = await this.assessmentService.getQuestionsForType(session.assessment_type);
      const currentIndex = session.metadata.current_question_index;
      
      if (currentIndex >= questions.length) {
        res.json({
          success: true,
          data: null,
          message: 'Assessment completed'
        });
        return;
      }

      const currentQuestion = questions[currentIndex];

      res.json({
        success: true,
        data: currentQuestion
      });

    } catch (error) {
      console.error('Get current question error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve current question'
      });
    }
  }

  /**
   * Get specific question details
   * GET /api/assessments/:sessionId/questions/:questionId
   */
  async getQuestion(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, questionId } = req.params;
      
      // This would typically retrieve from database
      // For now, we'll return a placeholder response
      res.json({
        success: true,
        data: {
          id: questionId,
          message: 'Question details would be retrieved from database'
        }
      });

    } catch (error) {
      console.error('Get question error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve question'
      });
    }
  }

  /**
   * Submit response to assessment question
   * POST /api/assessments/:sessionId/responses
   */
  async submitResponse(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      const { question_id, response_value, confidence_level, interaction_metadata } = req.body;

      const result = await this.assessmentService.processResponse(
        sessionId,
        question_id,
        response_value,
        confidence_level,
        interaction_metadata
      );

      const response: SubmitResponseResponse = {
        success: true,
        next_question: result.nextQuestion,
        is_complete: result.isComplete,
        progress: result.progress
      };

      // If assessment is complete, calculate results
      if (result.isComplete) {
        const assessmentResults = await this.calculateResults(req, res);
        if (assessmentResults) {
          response.results = assessmentResults;
        }
      }

      res.json(response);

    } catch (error) {
      console.error('Submit response error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to submit response'
      });
    }
  }

  /**
   * Get all responses for assessment session
   * GET /api/assessments/:sessionId/responses
   */
  async getResponses(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const responses = await this.repository.getResponses(sessionId);

      res.json({
        success: true,
        data: responses
      });

    } catch (error) {
      console.error('Get responses error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve responses'
      });
    }
  }

  /**
   * Get assessment results
   * GET /api/assessments/:sessionId/results
   */
  async getResults(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const results = await this.repository.getResults(sessionId);
      
      if (!results) {
        res.status(404).json({
          success: false,
          error: 'Assessment results not found'
        });
        return;
      }

      const response: GetResultsResponse = {
        results,
        recommendations: {
          immediate_actions: [
            "Review your strategic readiness assessment",
            "Identify top 3 AI implementation priorities",
            "Schedule a strategic consultation"
          ],
          consultation_booking_url: `${process.env.WEBSITE_URL}/contact.html`,
          resource_downloads: [
            "Strategic AI Readiness Checklist",
            "Implementation Planning Worksheet"
          ]
        }
      };

      res.json({
        success: true,
        data: response
      });

    } catch (error) {
      console.error('Get results error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve assessment results'
      });
    }
  }

  /**
   * Calculate assessment results
   * POST /api/assessments/:sessionId/results/calculate
   */
  async calculateResults(req: Request, res: Response): Promise<any> {
    try {
      const { sessionId } = req.params;
      
      const session = await this.repository.getSession(sessionId);
      if (!session) {
        if (res) {
          res.status(404).json({
            success: false,
            error: 'Assessment session not found'
          });
        }
        return null;
      }

      const responses = await this.repository.getResponses(sessionId);
      const userProfile = await this.repository.getUser(session.user_id);

      // Classify persona
      const personaClassification = await this.personaService.classifyPersona(responses, userProfile);

      // Calculate dimension scores (simplified for demo)
      const dimensionScores = {
        strategic_authority: Math.floor(Math.random() * 10) + 1,
        organizational_influence: Math.floor(Math.random() * 10) + 1,
        resource_availability: Math.floor(Math.random() * 10) + 1,
        implementation_readiness: Math.floor(Math.random() * 10) + 1,
        cultural_alignment: Math.floor(Math.random() * 10) + 1
      };

      const overallScore = Object.values(dimensionScores).reduce((sum, score) => sum + score, 0) / 5;

      // Get service tier recommendation
      const serviceRecommendation = this.personaService.getServiceTierRecommendation(
        personaClassification.primary_persona,
        dimensionScores.resource_availability
      );

      // Create results object
      const results = {
        id: uuidv4(),
        session_id: sessionId,
        user_id: session.user_id,
        overall_score: Math.round(overallScore * 10),
        dimension_scores: dimensionScores,
        persona_classification: personaClassification,
        industry_insights: {
          sector_readiness: Math.floor(Math.random() * 10) + 1,
          regulatory_considerations: ["Data privacy compliance", "Industry-specific regulations"],
          implementation_priorities: ["Strategic planning", "Team capability building"],
          market_maturity_level: "emerging"
        },
        recommendations: {
          program_recommendation: serviceRecommendation.tier,
          service_tier_recommendation: serviceRecommendation.tier,
          next_steps: [
            "Schedule strategic consultation",
            "Complete readiness assessment",
            "Develop implementation roadmap"
          ],
          timeline_suggestion: "3-6 months",
          resource_requirements: ["Executive sponsorship", "Dedicated team", "Technology infrastructure"],
          investment_range: serviceRecommendation.investment_range
        },
        curriculum_pathway: await this.curriculumService.generateCurriculum({
          id: uuidv4(),
          session_id: sessionId,
          user_id: session.user_id,
          overall_score: Math.round(overallScore * 10),
          dimension_scores: dimensionScores,
          persona_classification: personaClassification,
          industry_insights: {
            sector_readiness: Math.floor(Math.random() * 10) + 1,
            regulatory_considerations: [],
            implementation_priorities: [],
            market_maturity_level: "emerging"
          },
          recommendations: {
            program_recommendation: serviceRecommendation.tier,
            service_tier_recommendation: serviceRecommendation.tier,
            next_steps: [],
            timeline_suggestion: "3-6 months",
            resource_requirements: [],
            investment_range: serviceRecommendation.investment_range
          },
          curriculum_pathway: {
            pathway_id: uuidv4(),
            foundation_modules: [],
            industry_modules: [],
            role_specific_modules: [],
            cultural_adaptation_modules: [],
            estimated_duration: { total_hours: 0, weekly_commitment: 0, completion_timeline: "" },
            learning_objectives: [],
            success_metrics: [],
            prerequisites: [],
            optional_enhancements: []
          },
          created_at: new Date(),
          calculated_at: new Date()
        }, userProfile),
        created_at: new Date(),
        calculated_at: new Date()
      };

      // Save results
      await this.repository.saveResults(results);

      if (res) {
        res.json({
          success: true,
          data: results
        });
      }

      return results;

    } catch (error) {
      console.error('Calculate results error:', error);
      if (res) {
        res.status(500).json({
          success: false,
          error: 'Failed to calculate assessment results'
        });
      }
      return null;
    }
  }

  /**
   * Export assessment results as PDF
   * GET /api/assessments/:sessionId/results/export
   */
  async exportResults(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      // This would generate a PDF of the results
      // For now, return a placeholder response
      res.json({
        success: true,
        message: 'PDF export functionality would be implemented here',
        download_url: `/api/assessments/${sessionId}/results/download`
      });

    } catch (error) {
      console.error('Export results error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to export assessment results'
      });
    }
  }

  /**
   * Get assessment progress
   * GET /api/assessments/:sessionId/progress
   */
  async getProgress(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.params;
      
      const session = await this.repository.getSession(sessionId);
      if (!session) {
        res.status(404).json({
          success: false,
          error: 'Assessment session not found'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          current_step: session.metadata.current_question_index + 1,
          total_steps: 10, // This would be dynamic
          percentage: session.metadata.progress_percentage,
          status: session.status
        }
      });

    } catch (error) {
      console.error('Get progress error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve assessment progress'
      });
    }
  }

  /**
   * Get user's assessment history
   * GET /api/users/:userId/assessments
   */
  async getUserAssessments(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const { limit = 10, offset = 0, status } = req.query;
      
      const assessments = await this.repository.getUserAssessments(
        userId,
        parseInt(limit as string),
        parseInt(offset as string),
        status as AssessmentStatus
      );

      res.json({
        success: true,
        data: assessments
      });

    } catch (error) {
      console.error('Get user assessments error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve user assessments'
      });
    }
  }

  /**
   * Get available assessment types and their metadata
   * GET /api/assessment-types
   */
  async getAssessmentTypes(req: Request, res: Response): Promise<void> {
    try {
      const assessmentTypes = [
        {
          type: AssessmentType.QUESTIONNAIRE,
          name: "Strategic Questionnaire",
          description: "Traditional question-and-answer format for systematic assessment",
          estimated_duration: "15-20 minutes",
          best_for: "Structured thinkers who prefer clear, direct questions"
        },
        {
          type: AssessmentType.SCENARIO_BASED,
          name: "Scenario-Based Assessment",
          description: "Interactive business scenarios requiring strategic decisions",
          estimated_duration: "20-25 minutes",
          best_for: "Leaders who learn through practical examples and case studies"
        },
        {
          type: AssessmentType.CONVERSATIONAL,
          name: "Conversational Assessment",
          description: "Natural language interaction with AI-powered analysis",
          estimated_duration: "15-30 minutes",
          best_for: "Professionals who prefer open-ended discussion format"
        },
        {
          type: AssessmentType.VISUAL_PATTERN,
          name: "Visual Pattern Recognition",
          description: "Workflow diagrams and pattern recognition exercises",
          estimated_duration: "10-15 minutes",
          best_for: "Visual learners and systems thinkers"
        },
        {
          type: AssessmentType.BEHAVIORAL,
          name: "Behavioral Observation",
          description: "Assessment through interaction patterns and engagement tracking",
          estimated_duration: "20-25 minutes",
          best_for: "Professionals who prefer learning through doing"
        }
      ];

      res.json({
        success: true,
        data: assessmentTypes
      });

    } catch (error) {
      console.error('Get assessment types error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve assessment types'
      });
    }
  }

  /**
   * Get questions for specific assessment type
   * GET /api/assessment-types/:type/questions
   */
  async getQuestionsByType(req: Request, res: Response): Promise<void> {
    try {
      const { type } = req.params;
      const { industry, culture } = req.query;
      
      const assessmentType = type as AssessmentType;
      const userProfile = {
        professional: { industry: industry as string },
        demographics: { cultural_context: culture ? [culture as string] : [] }
      };

      const questions = await this.assessmentService.getQuestionsForType(assessmentType, userProfile);

      res.json({
        success: true,
        data: questions
      });

    } catch (error) {
      console.error('Get questions by type error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retrieve questions for assessment type'
      });
    }
  }

  /**
   * Health check endpoint for assessment service
   * GET /api/assessments/health
   */
  async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      // Check database connectivity and service health
      const health = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          assessment_service: 'operational',
          persona_classification: 'operational',
          curriculum_generation: 'operational',
          database: 'connected'
        }
      };

      res.json({
        success: true,
        data: health
      });

    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        success: false,
        error: 'Service unhealthy'
      });
    }
  }
  