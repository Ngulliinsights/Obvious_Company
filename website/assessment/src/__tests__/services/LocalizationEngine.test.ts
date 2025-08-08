import { LocalizationEngine } from '../../services/LocalizationEngine';
import { CulturalAdapter } from '../../services/CulturalAdapter';
import { UserContext } from '../../models/types';

describe('LocalizationEngine', () => {
  let localizationEngine: LocalizationEngine;
  let culturalAdapter: CulturalAdapter;

  beforeEach(() => {
    culturalAdapter = new CulturalAdapter();
    localizationEngine = new LocalizationEngine(culturalAdapter);
  });

  describe('Content Localization', () => {
    it('should localize question content for East African context', () => {
      const content = 'How quickly do you need results?';
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'financial-services',
        organizationSize: 'medium'
      };

      const localized = localizationEngine.localizeContent(content, userContext, 'question');

      expect(localized.originalText).toBe(content);
      expect(localized.culturalContext).toBe('east-africa-kenya');
      expect(localized.localizationRules).toContain('cultural-terminology');
      expect(localized.confidence).toBeGreaterThan(0);
    });

    it('should localize scenario content with higher confidence', () => {
      const content = 'Your stakeholders need to make a decision about implementation efficiency';
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'healthcare',
        organizationSize: 'large'
      };

      const localized = localizationEngine.localizeContent(content, userContext, 'scenario');

      expect(localized.localizedText).toContain('community members and stakeholders');
      expect(localized.localizedText).toContain('improved service to our community');
      expect(localized.confidence).toBe(0.9);
      expect(localized.localizationRules).toContain('scenario-adaptation');
    });

    it('should localize communication content with highest confidence', () => {
      const content = 'Thank you for your participation';
      const userContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'agriculture',
        organizationSize: 'small'
      };

      const localized = localizationEngine.localizeContent(content, userContext, 'communication');

      expect(localized.confidence).toBe(0.95);
      expect(localized.localizationRules).toContain('communication-template');
      expect(localized.culturalContext).toBe('west-africa');
    });
  });

  describe('Cultural Scenarios', () => {
    it('should return culturally adapted AI implementation scenario for Kenya', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'financial-services',
        organizationSize: 'medium'
      };

      const scenario = localizationEngine.getCulturalScenario('ai-implementation-decision', userContext);

      expect(scenario).toContain('Kenyan business culture');
      expect(scenario).toContain('personal relationships');
      expect(scenario).toContain('community leaders');
      expect(scenario).toContain('board includes respected community leaders');
    });

    it('should return West African adapted scenario', () => {
      const userContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'trade',
        organizationSize: 'large'
      };

      const scenario = localizationEngine.getCulturalScenario('change-management', userContext);

      expect(scenario).toContain('Community members');
      expect(scenario).toContain('human wisdom');
      expect(scenario).toContain('storytelling');
      expect(scenario).toContain('community engagement');
    });

    it('should return Southern African ubuntu-centered scenario', () => {
      const userContext: UserContext = {
        geographicRegion: 'south-africa',
        industry: 'manufacturing',
        organizationSize: 'large'
      };

      const scenario = localizationEngine.getCulturalScenario('budget-allocation', userContext);

      expect(scenario).toContain('ubuntu principle');
      expect(scenario).toContain('collective growth');
      expect(scenario).toContain('sustainable capabilities');
    });

    it('should return base scenario for unknown scenario ID', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'small'
      };

      const scenario = localizationEngine.getCulturalScenario('unknown-scenario', userContext);

      expect(scenario).toBe('Scenario not available');
    });
  });

  describe('Cultural Examples', () => {
    it('should return appropriate examples for Kenyan financial services', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'financial-services',
        organizationSize: 'medium'
      };

      const examples = localizationEngine.getCulturalExamples('financial-services', userContext, 2);

      expect(examples).toHaveLength(2);
      expect(examples[0]).toContain('M-Pesa');
      expect(examples[1]).toContain('Sacco societies');
    });

    it('should return West African agriculture examples', () => {
      const userContext: UserContext = {
        geographicRegion: 'ghana',
        industry: 'agriculture',
        organizationSize: 'small'
      };

      const examples = localizationEngine.getCulturalExamples('agriculture', userContext, 3);

      expect(examples).toHaveLength(3);
      expect(examples[0]).toContain('Farmer cooperatives');
      expect(examples[1]).toContain('indigenous knowledge');
      expect(examples[2]).toContain('Agricultural markets');
    });

    it('should return Southern African mining examples', () => {
      const userContext: UserContext = {
        geographicRegion: 'south-africa',
        industry: 'mining',
        organizationSize: 'large'
      };

      const examples = localizationEngine.getCulturalExamples('mining', userContext);

      expect(examples.length).toBeGreaterThan(0);
      expect(examples[0]).toContain('Mining cooperatives');
      expect(examples[0]).toContain('worker dignity');
    });

    it('should return empty array for unknown industry', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'unknown-industry',
        organizationSize: 'medium'
      };

      const examples = localizationEngine.getCulturalExamples('unknown-industry', userContext);

      expect(examples).toEqual([]);
    });
  });

  describe('Cultural Communication Generation', () => {
    it('should generate Kenyan assessment results communication', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'healthcare',
        organizationSize: 'medium'
      };

      const communication = localizationEngine.generateCulturalCommunication(
        'assessment-results',
        userContext,
        { service_tier: 'Strategic Clarity' }
      );

      expect(communication).toContain('Asante');
      expect(communication).toContain('cultural wisdom');
      expect(communication).toContain('Kenyan business values');
      expect(communication).toContain('innovation potential');
    });

    it('should generate West African service recommendation', () => {
      const userContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'trade',
        organizationSize: 'large'
      };

      const communication = localizationEngine.generateCulturalCommunication(
        'service-recommendation',
        userContext,
        { service_tier: 'Strategic Systems' }
      );

      expect(communication).toContain('thorough consultation');
      expect(communication).toContain('community benefit');
      expect(communication).toContain('West African tradition');
      expect(communication).toContain('Strategic Systems');
    });

    it('should generate Southern African follow-up communication', () => {
      const userContext: UserContext = {
        geographicRegion: 'botswana',
        industry: 'manufacturing',
        organizationSize: 'small'
      };

      const communication = localizationEngine.generateCulturalCommunication(
        'follow-up',
        userContext
      );

      expect(communication).toContain('ubuntu');
      expect(communication).toContain('benefits the collective');
      expect(communication).toContain('ubuntu-centered approach');
    });

    it('should return base template for unknown template ID', () => {
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const communication = localizationEngine.generateCulturalCommunication(
        'unknown-template',
        userContext
      );

      expect(communication).toBe('Communication template not available');
    });
  });

  describe('Cultural Appropriateness Validation', () => {
    it('should identify inappropriate urgency language for relationship-first cultures', () => {
      const content = 'We need urgent action and immediate results ASAP';
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'healthcare',
        organizationSize: 'medium'
      };

      const validation = localizationEngine.validateCulturalAppropriateness(content, userContext);

      expect(validation.isAppropriate).toBe(false);
      expect(validation.issues).toContain('Content uses urgency language inappropriate for relationship-first cultures');
      expect(validation.suggestions[0]).toContain('when convenient');
      expect(validation.culturalContext).toBe('east-africa-kenya');
    });

    it('should identify individualistic language in collective cultures', () => {
      const content = 'This will give you a competitive advantage and help you outperform competitors';
      const userContext: UserContext = {
        geographicRegion: 'south-africa',
        industry: 'manufacturing',
        organizationSize: 'large'
      };

      const validation = localizationEngine.validateCulturalAppropriateness(content, userContext);

      expect(validation.isAppropriate).toBe(false);
      expect(validation.issues).toContain('Content emphasizes individual advantage over collective benefit');
      expect(validation.suggestions[0]).toContain('collective improvement');
    });

    it('should pass validation for culturally appropriate content', () => {
      const content = 'This approach supports community development and collective growth';
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'agriculture',
        organizationSize: 'small'
      };

      const validation = localizationEngine.validateCulturalAppropriateness(content, userContext);

      expect(validation.isAppropriate).toBe(true);
      expect(validation.issues).toEqual([]);
      expect(validation.suggestions).toEqual([]);
    });

    it('should combine cultural adapter and localization validation', () => {
      const content = 'This primitive approach needs urgent replacement with Western best practices';
      const userContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'healthcare',
        organizationSize: 'medium'
      };

      const validation = localizationEngine.validateCulturalAppropriateness(content, userContext);

      expect(validation.isAppropriate).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(1); // Should have both cultural adapter and localization issues
      expect(validation.culturalContext).toBe('west-africa');
    });
  });

  describe('Cultural Context Determination', () => {
    it('should map various East African countries correctly', () => {
      const countries = ['kenya', 'uganda', 'tanzania', 'rwanda'];
      
      countries.forEach(country => {
        const userContext: UserContext = {
          geographicRegion: country,
          industry: 'technology',
          organizationSize: 'medium'
        };

        const localized = localizationEngine.localizeContent('test content', userContext);
        expect(localized.culturalContext).toBe('east-africa-kenya');
      });
    });

    it('should map West African countries correctly', () => {
      const countries = ['nigeria', 'ghana', 'senegal'];
      
      countries.forEach(country => {
        const userContext: UserContext = {
          geographicRegion: country,
          industry: 'agriculture',
          organizationSize: 'small'
        };

        const localized = localizationEngine.localizeContent('test content', userContext);
        expect(localized.culturalContext).toBe('west-africa');
      });
    });

    it('should map Southern African countries correctly', () => {
      const countries = ['south-africa', 'botswana', 'zimbabwe'];
      
      countries.forEach(country => {
        const userContext: UserContext = {
          geographicRegion: country,
          industry: 'mining',
          organizationSize: 'large'
        };

        const localized = localizationEngine.localizeContent('test content', userContext);
        expect(localized.culturalContext).toBe('southern-africa');
      });
    });

    it('should default to East African context for unknown regions', () => {
      const userContext: UserContext = {
        geographicRegion: 'unknown-country',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const localized = localizationEngine.localizeContent('test content', userContext);
      expect(localized.culturalContext).toBe('east-africa-kenya');
    });
  });
});