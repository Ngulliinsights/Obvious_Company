import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { createMockUser, mockDb } from '../setup';

describe('Persona-Curriculum Integration', () => {
  let mockUser: any;

  beforeEach(() => {
    mockUser = createMockUser();
    
    mockDb.query.mockImplementation((query: string) => {
      if (query.includes('assessment_results')) {
        return Promise.resolve({
          rows: [{
            id: 'result-id',
            overall_score: 78,
            dimension_scores: {
              strategic_authority: 8,
              organizational_influence: 7,
              resource_availability: 6,
              implementation_readiness: 8
            },
            persona_classification: {
              primary_persona: 'Strategic Catalyst',
              confidence_score: 0.85
            },
            industry_insights: {
              sector_readiness: 7,
              regulatory_considerations: ['data privacy']
            }
          }]
        });
      }
      return Promise.resolve({ rows: [] });
    });
  });

  describe('End-to-End Persona to Curriculum Flow', () => {
    it('should generate appropriate curriculum for Strategic Architect', async () => {
      // Mock high-authority assessment results
      mockDb.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          overall_score: 92,
          dimension_scores: {
            strategic_authority: 9,
            organizational_influence: 9,
            resource_availability: 8,
            implementation_readiness: 8
          },
          persona_classification: {
            primary_persona: 'Strategic Architect',
            confidence_score: 0.95
          }
        }]
      }));

      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: {
            ...mockUser,
            professional: {
              ...mockUser.professional,
              role_level: 'C-Suite',
              organization_size: '1000+'
            }
          }
        })
        .expect(200);

      const curriculum = response.body.curriculum;

      expect(curriculum.role_specific_modules).toBeDefined();
      
      const roleModules = curriculum.role_specific_modules.map((m: any) => m.topic);
      expect(roleModules).toContain('Enterprise AI Strategy');
      expect(roleModules).toContain('Board-Level Communication');
      expect(roleModules).toContain('Investment Decision Making');

      expect(curriculum.estimated_duration.weekly_commitment).toBeLessThanOrEqual(5);
      expect(curriculum.service_recommendation).toBe('Strategic Advantage');
    });

    it('should generate tactical curriculum for Strategic Contributor', async () => {
      mockDb.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          overall_score: 68,
          dimension_scores: {
            strategic_authority: 5,
            organizational_influence: 6,
            resource_availability: 6,
            implementation_readiness: 8
          },
          persona_classification: {
            primary_persona: 'Strategic Contributor',
            confidence_score: 0.82
          }
        }]
      }));

      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: {
            ...mockUser,
            professional: {
              ...mockUser.professional,
              role_level: 'Manager',
              organization_size: '100-500'
            }
          }
        })
        .expect(200);

      const curriculum = response.body.curriculum;

      const roleModules = curriculum.role_specific_modules.map((m: any) => m.topic);
      expect(roleModules).toContain('Tactical AI Implementation');
      expect(roleModules).toContain('Team Leadership in AI Adoption');
      expect(roleModules).toContain('Process Optimization');

      expect(curriculum.service_recommendation).toBe('Strategic Systems');
      expect(curriculum.investment_range).toContain('KSH 150K-250K');
    });

    it('should provide foundational curriculum for Strategic Explorer', async () => {
      mockDb.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          overall_score: 55,
          dimension_scores: {
            strategic_authority: 4,
            organizational_influence: 5,
            resource_availability: 5,
            implementation_readiness: 6
          },
          persona_classification: {
            primary_persona: 'Strategic Explorer',
            confidence_score: 0.78
          }
        }]
      }));

      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: {
            ...mockUser,
            professional: {
              ...mockUser.professional,
              role_level: 'Individual Contributor',
              years_experience: 3
            }
          }
        })
        .expect(200);

      const curriculum = response.body.curriculum;

      expect(curriculum.foundation_modules.length).toBeGreaterThan(
        curriculum.role_specific_modules.length
      );

      const foundationTopics = curriculum.foundation_modules.map((m: any) => m.topic);
      expect(foundationTopics).toContain('AI Fundamentals');
      expect(foundationTopics).toContain('Strategic Thinking Basics');
      expect(foundationTopics).toContain('Professional Development');

      expect(curriculum.service_recommendation).toBe('Strategic Clarity');
      expect(curriculum.investment_range).toContain('KSH 75K-150K');
    });
  });

  describe('Industry-Specific Curriculum Integration', () => {
    it('should integrate healthcare industry requirements with persona', async () => {
      const healthcareUser = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          industry: 'Healthcare',
          role_level: 'Director'
        }
      };

      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: healthcareUser
        })
        .expect(200);

      const curriculum = response.body.curriculum;

      const industryModules = curriculum.industry_modules.map((m: any) => m.topic);
      expect(industryModules).toContain('Healthcare AI Applications');
      expect(industryModules).toContain('Patient Privacy and Ethics');
      expect(industryModules).toContain('Clinical Decision Support');

      // Should also include persona-appropriate modules
      const roleModules = curriculum.role_specific_modules.map((m: any) => m.topic);
      expect(roleModules.some((topic: string) => 
        topic.includes('Leadership') || topic.includes('Management')
      )).toBe(true);
    });

    it('should adapt financial services curriculum for different personas', async () => {
      const financeExecutive = {
        ...mockUser,
        professional: {
          ...mockUser.professional,
          industry: 'Financial Services',
          role_level: 'C-Suite'
        }
      };

      // Mock Strategic Architect results
      mockDb.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          persona_classification: {
            primary_persona: 'Strategic Architect',
            confidence_score: 0.9
          },
          industry_insights: {
            regulatory_considerations: ['KBA', 'CBK', 'data protection']
          }
        }]
      }));

      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: financeExecutive
        })
        .expect(200);

      const curriculum = response.body.curriculum;

      const industryModules = curriculum.industry_modules.map((m: any) => m.topic);
      expect(industryModules).toContain('Financial Services AI Strategy');
      expect(industryModules).toContain('Regulatory Compliance in AI');

      const roleModules = curriculum.role_specific_modules.map((m: any) => m.topic);
      expect(roleModules).toContain('Enterprise Risk Management');
      expect(roleModules).toContain('Board-Level Financial AI Reporting');
    });
  });

  describe('Cultural Adaptation in Curriculum', () => {
    it('should include East African business context modules', async () => {
      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: mockUser
        })
        .expect(200);

      const curriculum = response.body.curriculum;

      const culturalModules = curriculum.cultural_adaptation_modules.map((m: any) => m.topic);
      expect(culturalModules).toContain('East African Business Context');
      expect(culturalModules).toContain('Regional Technology Infrastructure');
      expect(culturalModules).toContain('Cultural Change Management');

      // Check for culturally appropriate examples
      const allModules = [
        ...curriculum.foundation_modules,
        ...curriculum.industry_modules,
        ...curriculum.role_specific_modules
      ];

      const hasKenyanExamples = allModules.some((module: any) =>
        module.examples && module.examples.some((ex: string) => 
          ex.includes('Kenya') || ex.includes('East Africa') || ex.includes('Nairobi')
        )
      );

      expect(hasKenyanExamples).toBe(true);
    });

    it('should adapt investment recommendations for local currency', async () => {
      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: mockUser
        })
        .expect(200);

      const curriculum = response.body.curriculum;

      expect(curriculum.investment_range).toContain('KSH');
      expect(curriculum.roi_examples).toBeDefined();
      
      const roiExamples = curriculum.roi_examples.join(' ');
      expect(roiExamples).toContain('KSH');
    });
  });

  describe('Curriculum Progression and Adaptation', () => {
    it('should track learning progress and adapt curriculum', async () => {
      // Initial curriculum generation
      const initialResponse = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: mockUser
        })
        .expect(200);

      const pathwayId = initialResponse.body.curriculum.pathway_id;

      // Simulate learning progress
      const progressResponse = await request(app)
        .post(`/api/curriculum/${pathwayId}/update-progress`)
        .send({
          completed_modules: ['AI Fundamentals', 'Strategic Thinking'],
          performance_scores: {
            'AI Fundamentals': 92,
            'Strategic Thinking': 85
          },
          time_spent: {
            'AI Fundamentals': 6,
            'Strategic Thinking': 8
          },
          engagement_metrics: {
            completion_rate: 0.95,
            interaction_level: 'high'
          }
        })
        .expect(200);

      expect(progressResponse.body.adapted_curriculum).toBeDefined();
      expect(progressResponse.body.next_recommended_modules).toBeDefined();
      expect(progressResponse.body.performance_insights).toBeDefined();
    });

    it('should recommend advanced modules for high performers', async () => {
      const pathwayId = 'test-pathway-id';

      const response = await request(app)
        .post(`/api/curriculum/${pathwayId}/update-progress`)
        .send({
          completed_modules: ['AI Fundamentals', 'Strategic Thinking', 'Industry Applications'],
          performance_scores: {
            'AI Fundamentals': 98,
            'Strategic Thinking': 96,
            'Industry Applications': 94
          },
          time_spent: {
            'AI Fundamentals': 4, // Completed quickly
            'Strategic Thinking': 5,
            'Industry Applications': 6
          },
          engagement_metrics: {
            completion_rate: 1.0,
            interaction_level: 'very_high',
            additional_research: true
          }
        })
        .expect(200);

      expect(response.body.advanced_track_recommended).toBe(true);
      expect(response.body.optional_enhancements.length).toBeGreaterThan(0);
      
      const enhancements = response.body.optional_enhancements.map((e: any) => e.topic);
      expect(enhancements.some((topic: string) => 
        topic.includes('Advanced') || topic.includes('Expert')
      )).toBe(true);
    });

    it('should provide remedial support for struggling learners', async () => {
      const pathwayId = 'test-pathway-id';

      const response = await request(app)
        .post(`/api/curriculum/${pathwayId}/update-progress`)
        .send({
          completed_modules: ['AI Fundamentals'],
          performance_scores: {
            'AI Fundamentals': 65
          },
          time_spent: {
            'AI Fundamentals': 15 // Took longer than expected
          },
          engagement_metrics: {
            completion_rate: 0.7,
            interaction_level: 'low',
            help_requests: 3
          }
        })
        .expect(200);

      expect(response.body.remedial_support_recommended).toBe(true);
      expect(response.body.additional_resources).toBeDefined();
      expect(response.body.modified_pace).toBe('slower');
      
      const supportResources = response.body.additional_resources.map((r: any) => r.type);
      expect(supportResources).toContain('tutorial');
      expect(supportResources).toContain('practice_exercises');
    });
  });

  describe('Service Integration and Recommendations', () => {
    it('should map curriculum completion to service engagement', async () => {
      const response = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'test-assessment-id',
          user_context: mockUser
        })
        .expect(200);

      const curriculum = response.body.curriculum;

      expect(curriculum.service_pathway).toBeDefined();
      expect(curriculum.service_pathway.recommended_tier).toBeDefined();
      expect(curriculum.service_pathway.engagement_timeline).toBeDefined();
      expect(curriculum.service_pathway.preparation_steps).toBeDefined();

      // Should include consultation scheduling
      expect(curriculum.next_steps).toContain('consultation');
      expect(curriculum.calendar_integration).toBeDefined();
    });

    it('should provide different service pathways based on readiness', async () => {
      // High readiness user
      mockDb.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          dimension_scores: {
            implementation_readiness: 9,
            resource_availability: 8
          },
          persona_classification: {
            primary_persona: 'Strategic Architect'
          }
        }]
      }));

      const highReadinessResponse = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'high-readiness-assessment',
          user_context: mockUser
        })
        .expect(200);

      expect(highReadinessResponse.body.curriculum.service_pathway.immediate_engagement).toBe(true);
      expect(highReadinessResponse.body.curriculum.service_pathway.recommended_tier).toBe('Strategic Advantage');

      // Low readiness user
      mockDb.query.mockImplementationOnce(() => Promise.resolve({
        rows: [{
          dimension_scores: {
            implementation_readiness: 3,
            resource_availability: 4
          },
          persona_classification: {
            primary_persona: 'Strategic Observer'
          }
        }]
      }));

      const lowReadinessResponse = await request(app)
        .post('/api/curriculum/generate')
        .send({
          assessment_id: 'low-readiness-assessment',
          user_context: mockUser
        })
        .expect(200);

      expect(lowReadinessResponse.body.curriculum.service_pathway.preparation_required).toBe(true);
      expect(lowReadinessResponse.body.curriculum.service_pathway.recommended_tier).toBe('Strategic Clarity');
    });
  });
});