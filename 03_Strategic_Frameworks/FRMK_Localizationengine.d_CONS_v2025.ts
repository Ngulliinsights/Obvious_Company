---
title: "Localizationengine.d"
type: "framework"
audience: "consultants"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

import { UserContext } from '../models/types';
import { CulturalAdapter } from './CulturalAdapter';
export interface LocalizedContent {
    originalText: string;
    localizedText: string;
    culturalContext: string;
    localizationRules: string[];
    confidence: number;
}
export interface ScenarioTemplate {
    id: string;
    baseScenario: string;
    culturalAdaptations: Record<string, {
        scenario: string;
        context: string[];
        businessPractices: string[];
        stakeholders: string[];
    }>;
    industry?: string;
    complexity: 'basic' | 'intermediate' | 'advanced';
}
export interface CommunicationTemplate {
    templateId: string;
    purpose: string;
    baseTemplate: string;
    culturalVariations: Record<string, {
        template: string;
        formalityLevel: 'formal' | 'semi-formal' | 'casual';
        keyPhrases: string[];
        avoidPhrases: string[];
    }>;
}
export declare class LocalizationEngine {
    private culturalAdapter;
    private scenarioTemplates;
    private communicationTemplates;
    private culturalExamples;
    constructor(culturalAdapter: CulturalAdapter);
    private initializeScenarioTemplates;
    private initializeCommunicationTemplates;
    private initializeCulturalExamples;
    localizeContent(content: string, userContext: UserContext, contentType?: 'question' | 'scenario' | 'example' | 'communication'): LocalizedContent;
    getCulturalScenario(scenarioId: string, userContext: UserContext): string;
    getCulturalExamples(industry: string, userContext: UserContext, count?: number): string[];
    generateCulturalCommunication(templateId: string, userContext: UserContext, variables?: Record<string, string>): string;
    validateCulturalAppropriateness(content: string, userContext: UserContext): {
        isAppropriate: boolean;
        issues: string[];
        suggestions: string[];
        culturalContext: string;
    };
    private determineCulturalContext;
    private localizeScenario;
    private localizeCommunication;
}
//# sourceMappingURL=LocalizationEngine.d.ts.map