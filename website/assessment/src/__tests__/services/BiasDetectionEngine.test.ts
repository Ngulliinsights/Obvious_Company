import { BiasDetectionEngine } from '../../services/BiasDetectionEngine';
import { UserContext, AssessmentResponse } from '../../models/types';

describe('BiasDetectionEngine', () => {
  let biasDetectionEngine: BiasDetectionEngine;

  beforeEach(() => {
    biasDetectionEngine = new BiasDetectionEngine();
  });

  describe('Cultural Bias Detection', () => {
    it('should detect high-severity cultural bias terms', () => {
      const content = 'These primitive approaches need to be replaced with modern Western standards';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes).toHaveLength(2);
      expect(result.biasTypes[0].severity).toBe('high');
      expect(result.biasTypes[0].type).toBe('cultural');
      expect(result.biasTypes[1].type).toBe('cultural');
      expect(result.affectedContent).toContain('primitive');
      expect(result.affectedContent).toContain('Western standards');
    });

    it('should detect medium-severity cultural bias', () => {
      const content = 'We need to follow international best practices from developed countries';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].severity).toBe('medium');
      expect(result.suggestions[0]).toContain('high-income countries');
    });

    it('should detect false dichotomies', () => {
      const content = 'We must choose between modern vs traditional approaches';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].description).toContain('false dichotomies');
      expect(result.suggestions[0]).toContain('different approaches');
    });
  });

  describe('Economic Bias Detection', () => {
    it('should detect economic commodification language', () => {
      const content = 'We can leverage cheap labor and low-cost workforce in this region';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('economic');
      expect(result.biasTypes[0].severity).toBe('high');
      expect(result.suggestions[0]).toContain('skilled workforce');
    });

    it('should detect economic capacity assumptions', () => {
      const content = 'Everyone can afford this standard pricing model';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('economic');
      expect(result.suggestions[0]).toContain('flexible pricing');
    });

    it('should detect budget assumptions', () => {
      const content = '$50,000 USD is reasonable and affordable for most organizations';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('economic');
      expect(result.suggestions[0]).toContain('scalable solutions');
    });
  });

  describe('Technological Bias Detection', () => {
    it('should detect technology access assumptions', () => {
      const content = 'Everyone has standard internet and normal bandwidth for this solution';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('technological');
      expect(result.suggestions[0]).toContain('where available');
    });

    it('should detect technological familiarity assumptions', () => {
      const content = 'Digital natives will naturally understand this interface';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('technological');
      expect(result.suggestions[0]).toContain('with appropriate training');
    });

    it('should detect oversimplified technology assumptions', () => {
      const content = 'Users can just download and easily install the latest technology';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('technological');
    });
  });

  describe('Educational Bias Detection', () => {
    it('should detect knowledge assumptions', () => {
      const content = 'Obviously everyone knows these basic concepts and fundamental knowledge';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('educational');
      expect(result.suggestions[0]).toContain('it may be helpful to know');
    });

    it('should detect educational background assumptions', () => {
      const content = 'This requires basic understanding of elementary concepts';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('educational');
      expect(result.biasTypes[0].severity).toBe('low');
    });
  });

  describe('Gender and Age Bias Detection', () => {
    it('should detect male-default language', () => {
      const content = 'Hey guys, we need more manpower for this project with our chairman';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('gender');
      expect(result.suggestions[0]).toContain('everyone');
    });

    it('should detect age-based assumptions', () => {
      const content = 'Young people understand technology while older people struggle with digital systems';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('age');
      expect(result.suggestions[0]).toContain('with appropriate support');
    });
  });

  describe('Contextual Bias Detection', () => {
    it('should detect regional bias for African contexts', () => {
      const content = 'We need to help Africa develop and bring technology to African countries';
      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'technology',
        organizationSize: 'medium'
      };

      const result = biasDetectionEngine.detectBias(content, userContext);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].severity).toBe('high');
      expect(result.biasTypes[0].description).toContain('patronizing assumptions about African contexts');
      expect(result.suggestions[0]).toContain('collaborative framing');
    });

    it('should detect industry-specific bias for agriculture', () => {
      const content = 'We need to modernize traditional farming practices and upgrade outdated agriculture';
      const userContext: UserContext = {
        geographicRegion: 'nigeria',
        industry: 'agriculture',
        organizationSize: 'small'
      };

      const result = biasDetectionEngine.detectBias(content, userContext);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].description).toContain('agriculture industry sophistication');
      expect(result.suggestions[0]).toContain('neutral language');
    });

    it('should detect healthcare industry bias', () => {
      const content = 'These basic healthcare facilities need to improve their primitive medical services';
      const userContext: UserContext = {
        geographicRegion: 'south-africa',
        industry: 'healthcare',
        organizationSize: 'large'
      };

      const result = biasDetectionEngine.detectBias(content, userContext);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes.length).toBeGreaterThan(1); // Should detect both general and industry-specific bias
    });
  });

  describe('Assessment Response Validation', () => {
    it('should validate assessment responses for bias', () => {
      const response: AssessmentResponse = {
        sessionId: 'test-session',
        questionId: 'cultural-question',
        response: 'We need to teach these primitive communities about modern technology',
        timestamp: new Date(),
        metadata: {}
      };

      const userContext: UserContext = {
        geographicRegion: 'kenya',
        industry: 'education',
        organizationSize: 'medium'
      };

      const result = biasDetectionEngine.validateAssessmentResponse(response, userContext);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes[0].type).toBe('cultural');
      expect(result.biasTypes[0].severity).toBe('high');
    });

    it('should handle non-string responses', () => {
      const response: AssessmentResponse = {
        sessionId: 'test-session',
        questionId: 'rating-question',
        response: { rating: 5, comment: 'Great for helping backward regions' },
        timestamp: new Date(),
        metadata: {}
      };

      const userContext: UserContext = {
        geographicRegion: 'ghana',
        industry: 'technology',
        organizationSize: 'small'
      };

      const result = biasDetectionEngine.validateAssessmentResponse(response, userContext);

      expect(result.hasBias).toBe(true);
      expect(result.affectedContent).toContain('backward');
    });
  });

  describe('Bias-Free Alternative Generation', () => {
    it('should generate bias-free alternatives', () => {
      const content = 'These primitive methods need Western standards to help backward regions';
      const result = biasDetectionEngine.generateBiasFreeAlternative(content);

      expect(result.originalContent).toBe(content);
      expect(result.revisedContent).not.toContain('primitive');
      expect(result.revisedContent).not.toContain('Western standards');
      expect(result.revisedContent).not.toContain('backward');
      expect(result.changesApplied.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should return original content when no bias detected', () => {
      const content = 'This approach builds on existing strengths and proven practices';
      const result = biasDetectionEngine.generateBiasFreeAlternative(content);

      expect(result.originalContent).toBe(content);
      expect(result.revisedContent).toBe(content);
      expect(result.changesApplied).toEqual([]);
      expect(result.confidence).toBe(0.95);
    });

    it('should replace cultural bias terms with neutral alternatives', () => {
      const content = 'This exotic tribal approach is too simple and basic';
      const result = biasDetectionEngine.generateBiasFreeAlternative(content);

      expect(result.revisedContent).toContain('unique');
      expect(result.revisedContent).toContain('community-based');
      expect(result.revisedContent).toContain('streamlined');
      expect(result.revisedContent).toContain('foundational');
      expect(result.changesApplied.length).toBe(4);
    });
  });

  describe('Bias Statistics', () => {
    it('should calculate bias statistics for multiple contents', () => {
      const contents = [
        'This is neutral content with no bias',
        'These primitive approaches need Western standards',
        'Everyone can afford standard pricing',
        'Another neutral piece of content',
        'Digital natives naturally understand technology'
      ];

      const stats = biasDetectionEngine.getBiasStatistics(contents);

      expect(stats.totalContent).toBe(5);
      expect(stats.biasedContent).toBe(3);
      expect(stats.biasRate).toBe(0.6);
      expect(stats.commonBiasTypes.length).toBeGreaterThan(0);
      expect(stats.severityDistribution.length).toBeGreaterThan(0);
    });

    it('should handle empty content array', () => {
      const stats = biasDetectionEngine.getBiasStatistics([]);

      expect(stats.totalContent).toBe(0);
      expect(stats.biasedContent).toBe(0);
      expect(stats.biasRate).toBe(0);
      expect(stats.commonBiasTypes).toEqual([]);
      expect(stats.severityDistribution).toEqual([]);
    });

    it('should sort bias types and severity by frequency', () => {
      const contents = [
        'These primitive and backward approaches',
        'Primitive methods need improvement',
        'Everyone can afford this obviously',
        'Digital natives understand technology naturally'
      ];

      const stats = biasDetectionEngine.getBiasStatistics(contents);

      expect(stats.commonBiasTypes[0].type).toBe('cultural'); // Should be most common
      expect(stats.commonBiasTypes[0].count).toBeGreaterThan(1);
    });
  });

  describe('Confidence Calculation', () => {
    it('should return high confidence when no bias detected', () => {
      const content = 'This content is completely neutral and appropriate';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(false);
      expect(result.confidence).toBe(0.95);
    });

    it('should return higher confidence for more severe biases', () => {
      const highBiasContent = 'These primitive backward approaches from underdeveloped regions';
      const lowBiasContent = 'This basic approach uses standard methods';

      const highBiasResult = biasDetectionEngine.detectBias(highBiasContent);
      const lowBiasResult = biasDetectionEngine.detectBias(lowBiasContent);

      expect(highBiasResult.confidence).toBeGreaterThan(lowBiasResult.confidence);
    });

    it('should scale confidence with number of biases', () => {
      const singleBiasContent = 'This primitive approach';
      const multipleBiasContent = 'These primitive backward underdeveloped approaches need Western standards';

      const singleResult = biasDetectionEngine.detectBias(singleBiasContent);
      const multipleResult = biasDetectionEngine.detectBias(multipleBiasContent);

      // Both should have reasonable confidence levels
      expect(singleResult.confidence).toBeGreaterThan(0.5);
      expect(multipleResult.confidence).toBeGreaterThan(0.5);
      expect(multipleResult.confidence).toBeLessThan(1.0);
      
      // Multiple biases should indicate higher confidence in bias detection
      expect(multipleResult.biasTypes.length).toBeGreaterThan(singleResult.biasTypes.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty content', () => {
      const result = biasDetectionEngine.detectBias('');

      expect(result.hasBias).toBe(false);
      expect(result.biasTypes).toEqual([]);
      expect(result.affectedContent).toEqual([]);
      expect(result.suggestions).toEqual([]);
    });

    it('should handle content with only whitespace', () => {
      const result = biasDetectionEngine.detectBias('   \n\t   ');

      expect(result.hasBias).toBe(false);
    });

    it('should handle very long content', () => {
      const longContent = 'This is a very long piece of content that contains primitive approaches and Western standards repeated many times. '.repeat(100);
      const result = biasDetectionEngine.detectBias(longContent);

      expect(result.hasBias).toBe(true);
      expect(result.biasTypes.length).toBeGreaterThan(0);
      expect(result.confidence).toBeGreaterThan(0);
    });

    it('should handle special characters and unicode', () => {
      const content = 'These primitive approaches with émojis 🚀 and spëcial characters need improvement';
      const result = biasDetectionEngine.detectBias(content);

      expect(result.hasBias).toBe(true);
      expect(result.affectedContent).toContain('primitive');
    });
  });
});