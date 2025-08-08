import { describe, it, expect, beforeEach } from 'vitest';
import { IndustryAdapter } from '../services/IndustryAdapter';
import { UserContext } from '../models/types';

describe('IndustryAdapter', () => {
  let industryAdapter: IndustryAdapter;

  beforeEach(() => {
    industryAdapter = new IndustryAdapter();
  });

  describe('Industry Configuration', () => {
    it('should return valid configuration for financial services', () => {
      const config = industryAdapter.getIndustryConfig('financial-services');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('financial-services');
      expect(config?.name).toBe('Financial Services');
      expect(config?.regulatoryFramework).toContain('CBK');
      expect(config?.keyUseCases).toContain('Risk assessment and modeling');
      expect(config?.culturalFactors).toContain('Mobile money ecosystem integration');
    });

    it('should return valid configuration for manufacturing', () => {
      const config = industryAdapter.getIndustryConfig('manufacturing');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('manufacturing');
      expect(config?.name).toBe('Manufacturing');
      expect(config?.regulatoryFramework).toContain('KEBS');
      expect(config?.keyUseCases).toContain('Predictive maintenance optimization');
    });

    it('should return valid configuration for healthcare', () => {
      const config = industryAdapter.getIndustryConfig('healthcare');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('healthcare');
      expect(config?.name).toBe('Healthcare');
      expect(config?.regulatoryFramework).toContain('MOH');
      expect(config?.keyUseCases).toContain('Diagnostic support systems');
    });

    it('should return valid configuration for government', () => {
      const config = industryAdapter.getIndustryConfig('government');
      
      expect(config).toBeDefined();
      expect(config?.id).toBe('government');
      expect(config?.name).toBe('Government & Public Sector');
      expect(config?.regulatoryFramework).toContain('Constitution');
      expect(config?.keyUseCases).toContain('Citizen service delivery optimization');
    });

    it('should return null for unknown industry', () => {
      const config = industryAdapter.getIndustryConfig('unknown-industry');
      expect(config).toBeNull();
    });
  });

  describe('Industry Questions', () => {
    it('should return industry-specific questions for financial services', () => {
      const questions = industryAdapter.getIndustryQuestions('financial-services');
      
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
      
      const regulatoryQuestion = questions.find(q => q.id === 'fs-regulatory-readiness');
      expect(regulatoryQuestion).toBeDefined();
      expect(regulatoryQuestion?.industrySpecific).toBe(true);
    });

    it('should apply cultural adaptations to questions', () => {
      const questions = industryAdapter.getIndustryQuestions('financial-services', ['kenyan']);
      
      const regulatoryQuestion = questions.find(q => q.id === 'fs-regulatory-readiness');
      expect(regulatoryQuestion?.text).toContain('CBK');
    });

    it('should return generic questions for unknown industry', () => {
      const questions = industryAdapter.getIndustryQuestions('unknown-industry');
      
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
      
      const genericQuestion = questions.find(q => q.id === 'generic-ai-readiness');
      expect(genericQuestion).toBeDefined();
    });
  });

  describe('ROI Examples', () => {
    it('should return industry-specific ROI examples', () => {
      const examples = industryAdapter.getIndustryROIExamples('financial-services');
      
      expect(examples).toBeDefined();
      expect(examples.length).toBeGreaterThan(0);
      
      const fraudExample = examples.find(e => e.title.includes('Fraud Detection'));
      expect(fraudExample).toBeDefined();
      expect(fraudExample?.expectedROI).toContain('%');
      expect(fraudExample?.regulatoryConsiderations).toContain('CBK approval for algorithmic decision-making');
    });

    it('should return empty array for unknown industry', () => {
      const examples = industryAdapter.getIndustryROIExamples('unknown-industry');
      expect(examples).toEqual([]);
    });
  });

  describe('Industry Insights Generation', () => {
    it('should generate comprehensive insights for financial services', () => {
      const scores = {
        regulatoryReadiness: 3.5,
        riskManagement: 4.0,
        digitalIntegration: 3.0,
        inclusionFocus: 3.5
      };

      const insights = industryAdapter.generateIndustryInsights(
        'financial-services',
        scores,
        ['kenyan']
      );

      expect(insights).toBeDefined();
      expect(insights.sectorReadiness).toBeGreaterThan(0);
      expect(insights.regulatoryConsiderations).toContain('CBK');
      expect(insights.implementationPriorities.length).toBeGreaterThan(0);
      expect(insights.culturalFactors).toBeDefined();
    });

    it('should generate generic insights for unknown industry', () => {
      const scores = { overallReadiness: 3.0 };
      
      const insights = industryAdapter.generateIndustryInsights('unknown-industry', scores);
      
      expect(insights).toBeDefined();
      expect(insights.sectorReadiness).toBe(3.0);
      expect(insights.regulatoryConsiderations).toContain('General data protection compliance');
    });
  });

  describe('Cultural Adaptation', () => {
    it('should adapt content for Kenyan context', () => {
      const originalContent = 'compliance requirements for stakeholders';
      const adaptedContent = industryAdapter.adaptForCulture(
        originalContent,
        ['kenyan'],
        'financial-services'
      );

      expect(adaptedContent).toContain('regulatory compliance with Kenyan authorities');
      expect(adaptedContent).toContain('stakeholders including community representatives');
    });

    it('should adapt content for Swahili context', () => {
      const originalContent = 'community service development';
      const adaptedContent = industryAdapter.adaptForCulture(
        originalContent,
        ['swahili']
      );

      expect(adaptedContent).toContain('jamii');
      expect(adaptedContent).toContain('huduma');
      expect(adaptedContent).toContain('maendeleo');
    });

    it('should handle multiple cultural contexts', () => {
      const originalContent = 'community service implementation';
      const adaptedContent = industryAdapter.adaptForCulture(
        originalContent,
        ['kenyan', 'swahili']
      );

      expect(adaptedContent).toContain('jamii');
      expect(adaptedContent).toContain('huduma');
      expect(adaptedContent).toContain('with local capacity building');
    });
  });

  describe('Industry Modules', () => {
    it('should generate industry-specific modules', () => {
      const modules = industryAdapter.getIndustryModules('financial-services', ['kenyan']);
      
      expect(modules).toBeDefined();
      expect(modules.length).toBeGreaterThan(0);
      
      const fundamentalsModule = modules.find(m => m.id.includes('fundamentals'));
      expect(fundamentalsModule).toBeDefined();
      expect(fundamentalsModule?.title).toContain('Financial Services');
      expect(fundamentalsModule?.culturalAdaptations?.kenyan).toBeDefined();
    });

    it('should return empty array for unknown industry', () => {
      const modules = industryAdapter.getIndustryModules('unknown-industry');
      expect(modules).toEqual([]);
    });
  });

  describe('Compliance Requirements', () => {
    it('should return industry-specific compliance requirements', () => {
      const requirements = industryAdapter.getComplianceRequirements('financial-services');
      
      expect(requirements).toBeDefined();
      expect(requirements.length).toBeGreaterThan(0);
      expect(requirements).toContain('Data Protection Act compliance');
      expect(requirements).toContain('Anti-Money Laundering (AML) regulations');
    });

    it('should include regional compliance requirements', () => {
      const requirements = industryAdapter.getComplianceRequirements('financial-services', 'kenya');
      
      expect(requirements).toContain('Central Bank of Kenya AI guidelines');
      expect(requirements).toContain('Kenya Bankers Association best practices');
    });

    it('should return empty array for unknown industry', () => {
      const requirements = industryAdapter.getComplianceRequirements('unknown-industry');
      expect(requirements).toEqual([]);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle null cultural context gracefully', () => {
      const questions = industryAdapter.getIndustryQuestions('financial-services', undefined);
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should handle empty cultural context array', () => {
      const questions = industryAdapter.getIndustryQuestions('financial-services', []);
      expect(questions).toBeDefined();
      expect(questions.length).toBeGreaterThan(0);
    });

    it('should handle unknown cultural context', () => {
      const adaptedContent = industryAdapter.adaptForCulture(
        'test content',
        ['unknown-culture']
      );
      expect(adaptedContent).toBe('test content');
    });

    it('should handle empty scores object', () => {
      const insights = industryAdapter.generateIndustryInsights('financial-services', {});
      expect(insights).toBeDefined();
      expect(insights.sectorReadiness).toBe(0);
    });
  });
});