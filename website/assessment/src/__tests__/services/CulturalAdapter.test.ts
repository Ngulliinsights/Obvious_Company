import { CulturalAdapter } from '../../services/CulturalAdapter';
import { UserContext, Question, AssessmentResponse } from '../../models/types';

describe('CulturalAdapter', () => {
  let culturalAdapter: CulturalAdapter;

  beforeEach(() => {
    culturalAdapter = new CulturalAdapter();
  });

  describe('Question Adaptation', () => {
    it('should adapt questions for East African context', () => {
      const question: Question = {
        id: 'test-question',
        text: 'How quickly do you need to see ROI?',
        type: 'multiple-choice',
        options: ['Immediately', 'Within 6 months', 'Within 1 year'],
        category: 'investment'
      };

      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'financial-services',
        organizationSize: 'medium',
        culturalContext: ['east-africa-kenya']
      };

      const adaptedQuestion = culturalAdapter.adaptQuestion(question, userContext);

      expect(adaptedQuestion.text).toContain('timeline works best');
      expect(adaptedQuestion.text).toContain('meaningful returns');
      expect(adaptedQuestion.culturalAdaptations).toBeDefined();
      expect(adaptedQuestion.culturalAdaptations!['east-africa-kenya']).toBeDefined();
    });

    it('should adapt questions for West African context', () => {
      const question: Question = {
        id: 'risk-tolerance',
        text: 'Rate your organization\'s risk tolerance',
        type: 'scale',
        category: 'risk-assessment'
      };

      const userContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'agriculture',
        organizationSize: 'large',
        culturalContext: ['west-africa']
      };

      const adaptedQuestion = culturalAdapter.adaptQuestion(question, userContext);

      expect(adaptedQuestion.text).toContain('innovation experimentation');
      expect(adaptedQuestion.text).toContain('organization\'s values');
    });

    it('should apply cultural terminology preferences', () => {
      const text = 'AI automation will improve efficiency and reduce costs through disruption';
      const adaptedText = culturalAdapter.applyCulturalTerminology(text, 'east-africa-kenya');

      expect(adaptedText).toContain('Artificial Intelligence (AI)');
      expect(adaptedText).toContain('intelligent automation');
      expect(adaptedText).toContain('optimization');
      expect(adaptedText).toContain('transformation');
    });
  });

  describe('Regulatory Considerations', () => {
    it('should return appropriate regulatory considerations for Kenya financial services', () => {
      const considerations = culturalAdapter.getRegulatorConsiderations('east-africa-kenya', 'financial-services');

      expect(considerations).toContain('Kenya Data Protection Act');
      expect(considerations).toContain('Central Bank of Kenya regulations');
      expect(considerations).toContain('Sacco Societies Act');
    });

    it('should return general considerations when industry not specified', () => {
      const considerations = culturalAdapter.getRegulatorConsiderations('east-africa-kenya');

      expect(considerations).toContain('Kenya Data Protection Act');
      expect(considerations).toContain('Companies Act 2015');
      expect(considerations.length).toBeGreaterThan(0);
    });

    it('should return empty array for unknown region', () => {
      const considerations = culturalAdapter.getRegulatorConsiderations('unknown-region');
      expect(considerations).toEqual([]);
    });
  });

  describe('Cultural Sensitivity Validation', () => {
    it('should detect biased language', () => {
      const content = 'This primitive approach needs to be replaced with modern Western standards';
      const validation = culturalAdapter.validateCulturalSensitivity(content);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
      expect(validation.issues.some(issue => issue.includes('primitive') || issue.includes('cultural bias'))).toBe(true);
      expect(validation.suggestions.length).toBeGreaterThan(0);
    });

    it('should pass validation for culturally appropriate content', () => {
      const content = 'This approach builds on existing strengths while introducing proven practices';
      const validation = culturalAdapter.validateCulturalSensitivity(content);

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toEqual([]);
    });

    it('should detect Western-centric assumptions', () => {
      const content = 'Following international best practices and Western approaches';
      const validation = culturalAdapter.validateCulturalSensitivity(content);

      expect(validation.isValid).toBe(false);
      expect(validation.issues).toContain('Content may assume Western-centric approaches');
    });
  });

  describe('Business Practice Preferences', () => {
    it('should return business practices for East African context', () => {
      const practices = culturalAdapter.getBusinessPracticePreferences('east-africa-kenya');

      expect(practices).toBeDefined();
      expect(practices!.decisionMaking).toContain('consensus-building');
      expect(practices!.communicationStyle).toBe('relationship-first');
      expect(practices!.timeOrientation).toBe('relationship-over-schedule');
    });

    it('should return null for unknown cultural context', () => {
      const practices = culturalAdapter.getBusinessPracticePreferences('unknown-context');
      expect(practices).toBeNull();
    });
  });

  describe('Economic Context', () => {
    it('should return economic context for East African region', () => {
      const context = culturalAdapter.getEconomicContext('east-africa-kenya');

      expect(context).toBeDefined();
      expect(context!.currencyPreferences).toContain('KSH');
      expect(context!.currencyPreferences).toContain('USD');
      expect(context!.resourceAvailability).toBe('emerging-market');
    });

    it('should return appropriate investment patterns for West Africa', () => {
      const context = culturalAdapter.getEconomicContext('west-africa');

      expect(context).toBeDefined();
      expect(context!.investmentPatterns).toContain('community-benefit-first');
      expect(context!.investmentPatterns).toContain('sustainable-development-focus');
    });
  });

  describe('Response Interpretation', () => {
    it('should adapt response interpretation for relationship-first cultures', () => {
      const response: AssessmentResponse = {
        sessionId: 'test-session',
        questionId: 'timeline-urgency',
        response: 'low-urgency',
        timestamp: new Date(),
        metadata: {}
      };

      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'healthcare',
        organizationSize: 'medium',
        culturalContext: ['east-africa-kenya']
      };

      const adaptedResponse = culturalAdapter.adaptResponseInterpretation(response, userContext);

      expect(adaptedResponse.culturalAdaptationApplied).toBe(true);
    });

    it('should not modify responses for non-timeline questions', () => {
      const response: AssessmentResponse = {
        sessionId: 'test-session',
        questionId: 'budget-allocation',
        response: 'medium-budget',
        timestamp: new Date(),
        metadata: {}
      };

      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'healthcare',
        organizationSize: 'medium',
        culturalContext: ['east-africa-kenya']
      };

      const adaptedResponse = culturalAdapter.adaptResponseInterpretation(response, userContext);

      expect(adaptedResponse.culturalAdaptationApplied).toBeUndefined();
    });
  });

  describe('Cultural Context Determination', () => {
    it('should map Kenya to East African context', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'small'
      };

      const question: Question = {
        id: 'test',
        text: 'Test question',
        type: 'text',
        category: 'general'
      };

      const adaptedQuestion = culturalAdapter.adaptQuestion(question, userContext);
      expect(adaptedQuestion.culturalAdaptations).toBeDefined();
    });

    it('should default to East African context for unknown regions', () => {
      const userContext: UserContext = {
        geographicRegion: 'unknown-country',
        industry: 'technology',
        organizationSize: 'small'
      };

      const question: Question = {
        id: 'test',
        text: 'Test question',
        type: 'text',
        category: 'general'
      };

      const adaptedQuestion = culturalAdapter.adaptQuestion(question, userContext);
      expect(adaptedQuestion.culturalAdaptations).toBeDefined();
    });
  });
});