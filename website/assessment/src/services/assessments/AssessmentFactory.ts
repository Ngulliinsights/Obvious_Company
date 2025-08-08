import { BaseAssessment } from './BaseAssessment';
import { QuestionnaireAssessment } from './QuestionnaireAssessment';
import { ScenarioAssessment } from './ScenarioAssessment';
import { ConversationalAssessment } from './ConversationalAssessment';
import { VisualAssessment } from './VisualAssessment';
import { BehavioralAssessment } from './BehavioralAssessment';
import { AssessmentType, UserContext } from '../../models/types';
import { AssessmentSession } from '../../models/AssessmentSession';

export class AssessmentFactory {
  /**
   * Create assessment instance based on type
   */
  static createAssessment(
    assessmentType: AssessmentType,
    userContext: UserContext,
    session: AssessmentSession
  ): BaseAssessment {
    switch (assessmentType) {
      case 'questionnaire':
        return new QuestionnaireAssessment(userContext, session);
        
      case 'scenario-based':
        return new ScenarioAssessment(userContext, session);
        
      case 'conversational':
        return new ConversationalAssessment(userContext, session);
        
      case 'visual-pattern':
        return new VisualAssessment(userContext, session);
        
      case 'behavioral-observation':
        return new BehavioralAssessment(userContext, session);
        
      default:
        throw new Error(`Unsupported assessment type: ${assessmentType}`);
    }
  }

  /**
   * Get available assessment types
   */
  static getAvailableTypes(): AssessmentType[] {
    return [
      'questionnaire',
      'scenario-based',
      'conversational',
      'visual-pattern',
      'behavioral-observation'
    ];
  }

  /**
   * Get assessment type metadata
   */
  static getAssessmentMetadata(assessmentType: AssessmentType): {
    name: string;
    description: string;
    estimatedDuration: number;
    difficulty: 'easy' | 'moderate' | 'advanced';
    culturalAdaptations: boolean;
  } {
    const metadata = {
      'questionnaire': {
        name: 'Traditional Questionnaire',
        description: 'Structured questions with multiple choice and rating scales',
        estimatedDuration: 10,
        difficulty: 'easy' as const,
        culturalAdaptations: true
      },
      'scenario-based': {
        name: 'Business Scenarios',
        description: 'Real-world business situations requiring strategic decisions',
        estimatedDuration: 15,
        difficulty: 'moderate' as const,
        culturalAdaptations: true
      },
      'conversational': {
        name: 'Conversational Assessment',
        description: 'Natural language conversation with AI analysis',
        estimatedDuration: 12,
        difficulty: 'moderate' as const,
        culturalAdaptations: true
      },
      'visual-pattern': {
        name: 'Visual Pattern Recognition',
        description: 'Visual diagrams and pattern-based questions',
        estimatedDuration: 8,
        difficulty: 'moderate' as const,
        culturalAdaptations: true
      },
      'behavioral-observation': {
        name: 'Behavioral Analysis',
        description: 'Assessment based on interaction patterns and behavior',
        estimatedDuration: 20,
        difficulty: 'advanced' as const,
        culturalAdaptations: false
      }
    };

    return metadata[assessmentType];
  }

  /**
   * Recommend assessment type based on user context
   */
  static recommendAssessmentType(userContext: UserContext): AssessmentType {
    // Default recommendation logic
    if (userContext.assessmentHistory?.length === 0) {
      return 'questionnaire'; // Start with familiar format
    }

    // Consider cultural context
    if (userContext.culturalContext?.includes('kenyan') || 
        userContext.culturalContext?.includes('east_african')) {
      return 'scenario-based'; // Culturally relevant business scenarios
    }

    // Consider industry
    if (userContext.industry === 'technology') {
      return 'visual-pattern'; // Tech professionals may prefer visual approaches
    }

    // Default to questionnaire
    return 'questionnaire';
  }
}