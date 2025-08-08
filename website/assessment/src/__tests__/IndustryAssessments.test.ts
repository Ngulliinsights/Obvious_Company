import { describe, it, expect, beforeEach } from 'vitest';
import { 
  FinancialServicesAssessment,
  ManufacturingAssessment,
  HealthcareAssessment,
  GovernmentAssessment,
  createIndustryAssessment
} from '../services/IndustryAssessments';
import { UserContext, AssessmentResponse } from '../models/types';

describe('Industry-Specific Assessments', () => {
  const mockUserContext: UserContext = {
    userId: 'test-user',
    industry: 'financial-services',
    geographicRegion: 'kenya',
    culturalContext: ['kenyan'],
    preferredLanguage: 'english'
  };

  describe('FinancialServicesAssessment', () => {
    let assessment: FinancialServicesAssessment;

    beforeEach(() => {
      assessment = new FinancialServicesAssessment();
    });

    it('should generate financial services specific questions', () => {
      const questions = assessment.generateQuestions(mockUserContext);
      
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
      
      const cbkQuestion = questions.find(q => q.id === 'fs-cbk-relationship');
      expect(cbkQuestion).toBeDefined();
      expect(cbkQuestion?.text).toContain('Central Bank of Kenya');
      
      const mobileMoneyQuestion = questions.find(q => q.id === 'fs-mobile-money-integration');
      expect(mobileMoneyQuestion).toBeDefined();
      expect(mobileMoneyQuestion?.text).toContain('M-Pesa');
    });

    it('should apply cultural adaptations to questions', () => {
      const questions = assessment.generateQuestions(mockUserContext);
      
      const cbkQuestion = questions.find(q => q.id === 'fs-cbk-relationship');
      expect(cbkQuestion?.culturalAdaptations?.kenyan).toContain('CBK');
    });

    it('should analyze responses and generate comprehensive results', () => {
      const mockResponses: AssessmentResponse[] = [
        {
          questionId: 'fs-regulatory-readiness',
          questionType: 'scale_rating',
          responseValue: 4,
          responseTimeSeconds: 15
        },
        {
          questionId: 'fs-cbk-relationship',
          questionType: 'scale_rating',
          responseValue: 3,
          responseTimeSeconds: 12
        },
        {
          questionId: 'fs-mobile-money-integration',
          questionType: 'multiple_choice',
          responseValue: 'Advanced integration with analytics',
          responseTimeSeconds: 20
        }
      ];

      const result = assessment.analyzeResponses(mockResponses, mockUserContext);
      
      expect(result).toBeDefined();
      expect(result.industryId).toBe('financial-services');
      expect(result.sectorReadiness).toBeGreaterThan(0);
      expect(result.specificInsights).toBeDefined();
      expect(result.recommendedActions.length).toBeGreaterThan(0);
      expect(result.complianceGaps).toBeDefined();
      expect(result.implementationRoadmap.length).toBe(4);
    });

    it('should provide persona-specific implementation guidance', () => {
      const mockResult = {
        industryId: 'financial-services',
        sectorReadiness: 3.5,
        specificInsights: {
          sectorReadiness: 3.5,
          regulatoryConsiderations: [],
          implementationPriorities: []
        },
        recommendedActions: [],
        complianceGaps: [],
        implementationRoadmap: []
      };

      const architectGuidance = assessment.getImplementationGuidance(mockResult, 'Strategic Architect');
      const explorerGuidance = assessment.getImplementationGuidance(mockResult, 'Strategic Explorer');
      
      expect(architectGuidance).toContain('Lead industry transformation through regulatory innovation partnerships');
      expect(explorerGuidance).toContain('Participate in industry AI learning initiatives');
      expect(architectGuidance.length).toBeGreaterThanOrEqual(explorerGuidance.length);
    });
  });

  describe('ManufacturingAssessment', () => {
    let assessment: ManufacturingAssessment;

    beforeEach(() => {
      assessment = new ManufacturingAssessment();
    });

    it('should generate manufacturing specific questions', () => {
      const manufacturingContext = { ...mockUserContext, industry: 'manufacturing' };
      const questions = assessment.generateQuestions(manufacturingContext);
      
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
      
      const iotQuestion = questions.find(q => q.id === 'mfg-iot-infrastructure');
      expect(iotQuestion).toBeDefined();
      expect(iotQuestion?.text).toContain('IoT sensor');
      
      const supplierQuestion = questions.find(q => q.id === 'mfg-local-supplier-network');
      expect(supplierQuestion).toBeDefined();
      expect(supplierQuestion?.culturalAdaptations?.kenyan).toContain('local Kenyan suppliers');
    });

    it('should analyze manufacturing responses correctly', () => {
      const mockResponses: AssessmentResponse[] = [
        {
          questionId: 'mfg-iot-infrastructure',
          questionType: 'scale_rating',
          responseValue: 3,
          responseTimeSeconds: 18
        },
        {
          questionId: 'mfg-local-supplier-network',
          questionType: 'scale_rating',
          responseValue: 4,
          responseTimeSeconds: 15
        }
      ];

      const result = assessment.analyzeResponses(mockResponses, mockUserContext);
      
      expect(result.industryId).toBe('manufacturing');
      expect(result.sectorReadiness).toBeGreaterThan(0);
      expect(result.implementationRoadmap[0]).toContain('IoT infrastructure deployment');
    });
  });

  describe('HealthcareAssessment', () => {
    let assessment: HealthcareAssessment;

    beforeEach(() => {
      assessment = new HealthcareAssessment();
    });

    it('should generate healthcare specific questions', () => {
      const healthcareContext = { ...mockUserContext, industry: 'healthcare' };
      const questions = assessment.generateQuestions(healthcareContext);
      
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
      
      const nhifQuestion = questions.find(q => q.id === 'hc-nhif-integration');
      expect(nhifQuestion).toBeDefined();
      expect(nhifQuestion?.text).toContain('NHIF');
      
      const chvQuestion = questions.find(q => q.id === 'hc-community-health-workers');
      expect(chvQuestion).toBeDefined();
      expect(chvQuestion?.culturalAdaptations?.kenyan).toContain('CHVs');
      
      const traditionalQuestion = questions.find(q => q.id === 'hc-traditional-medicine-integration');
      expect(traditionalQuestion).toBeDefined();
      expect(traditionalQuestion?.culturalAdaptations?.kenyan).toContain('traditional healers');
    });

    it('should identify ethical compliance gaps', () => {
      const mockResponses: AssessmentResponse[] = [
        {
          questionId: 'hc-ethical-ai-framework',
          questionType: 'scale_rating',
          responseValue: 2,
          responseTimeSeconds: 25
        }
      ];

      const result = assessment.analyzeResponses(mockResponses, mockUserContext);
      
      expect(result.complianceGaps).toContain('Ethical AI framework for healthcare applications needs development');
    });
  });

  describe('GovernmentAssessment', () => {
    let assessment: GovernmentAssessment;

    beforeEach(() => {
      assessment = new GovernmentAssessment();
    });

    it('should generate government specific questions', () => {
      const governmentContext = { ...mockUserContext, industry: 'government' };
      const questions = assessment.generateQuestions(governmentContext);
      
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
      
      const ecitizenQuestion = questions.find(q => q.id === 'gov-ecitizen-integration');
      expect(ecitizenQuestion).toBeDefined();
      expect(ecitizenQuestion?.text).toContain('eCitizen');
      
      const devolutionQuestion = questions.find(q => q.id === 'gov-devolution-support');
      expect(devolutionQuestion).toBeDefined();
      expect(devolutionQuestion?.culturalAdaptations?.kenyan).toContain('county governments');
    });

    it('should identify devolution support gaps', () => {
      const mockResponses: AssessmentResponse[] = [
        {
          questionId: 'gov-devolution-support',
          questionType: 'multiple_choice',
          responseValue: 'No specific devolution focus',
          responseTimeSeconds: 20
        }
      ];

      const result = assessment.analyzeResponses(mockResponses, mockUserContext);
      
      expect(result.recommendedActions).toContain('Strengthen AI systems for county government coordination and devolution support');
    });
  });

  describe('Factory Function', () => {
    it('should create correct assessment instances', () => {
      const fsAssessment = createIndustryAssessment('financial-services');
      expect(fsAssessment).toBeInstanceOf(FinancialServicesAssessment);
      
      const mfgAssessment = createIndustryAssessment('manufacturing');
      expect(mfgAssessment).toBeInstanceOf(ManufacturingAssessment);
      
      const hcAssessment = createIndustryAssessment('healthcare');
      expect(hcAssessment).toBeInstanceOf(HealthcareAssessment);
      
      const govAssessment = createIndustryAssessment('government');
      expect(govAssessment).toBeInstanceOf(GovernmentAssessment);
    });

    it('should return null for unknown industry', () => {
      const unknownAssessment = createIndustryAssessment('unknown-industry');
      expect(unknownAssessment).toBeNull();
    });
  });

  describe('Cross-Industry Consistency', () => {
    it('should maintain consistent result structure across all industries', () => {
      const assessments = [
        new FinancialServicesAssessment(),
        new ManufacturingAssessment(),
        new HealthcareAssessment(),
        new GovernmentAssessment()
      ];

      const mockResponses: AssessmentResponse[] = [
        {
          questionId: 'test-question',
          questionType: 'scale_rating',
          responseValue: 3,
          responseTimeSeconds: 15
        }
      ];

      assessments.forEach(assessment => {
        const result = assessment.analyzeResponses(mockResponses, mockUserContext);
        
        expect(result).toHaveProperty('industryId');
        expect(result).toHaveProperty('sectorReadiness');
        expect(result).toHaveProperty('specificInsights');
        expect(result).toHaveProperty('recommendedActions');
        expect(result).toHaveProperty('complianceGaps');
        expect(result).toHaveProperty('implementationRoadmap');
        
        expect(Array.isArray(result.recommendedActions)).toBe(true);
        expect(Array.isArray(result.complianceGaps)).toBe(true);
        expect(Array.isArray(result.implementationRoadmap)).toBe(true);
      });
    });

    it('should provide persona-specific guidance for all industries', () => {
      const assessments = [
        new FinancialServicesAssessment(),
        new ManufacturingAssessment(),
        new HealthcareAssessment(),
        new GovernmentAssessment()
      ];

      const mockResult = {
        industryId: 'test',
        sectorReadiness: 3.0,
        specificInsights: {
          sectorReadiness: 3.0,
          regulatoryConsiderations: [],
          implementationPriorities: []
        },
        recommendedActions: [],
        complianceGaps: [],
        implementationRoadmap: []
      };

      const personas = ['Strategic Architect', 'Strategic Catalyst', 'Strategic Contributor', 'Strategic Explorer', 'Strategic Observer'] as const;

      assessments.forEach(assessment => {
        personas.forEach(persona => {
          const guidance = assessment.getImplementationGuidance(mockResult, persona);
          expect(Array.isArray(guidance)).toBe(true);
          expect(guidance.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('Cultural Sensitivity', () => {
    it('should apply appropriate cultural adaptations across industries', () => {
      const kenyanContext = { ...mockUserContext, culturalContext: ['kenyan'] };
      const swahiliContext = { ...mockUserContext, culturalContext: ['swahili'] };
      
      const assessments = [
        new FinancialServicesAssessment(),
        new ManufacturingAssessment(),
        new HealthcareAssessment(),
        new GovernmentAssessment()
      ];

      assessments.forEach(assessment => {
        const kenyanQuestions = assessment.generateQuestions(kenyanContext);
        const swahiliQuestions = assessment.generateQuestions(swahiliContext);
        
        // Check that cultural adaptations are applied
        const hasKenyanAdaptations = kenyanQuestions.some(q => 
          q.culturalAdaptations?.kenyan && q.culturalAdaptations.kenyan !== q.text
        );
        
        expect(hasKenyanAdaptations).toBe(true);
      });
    });
  });
});