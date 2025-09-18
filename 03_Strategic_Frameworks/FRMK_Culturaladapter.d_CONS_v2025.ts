---
title: "Culturaladapter.d"
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

import { Question, UserContext, AssessmentResponse } from '../models/types';
export interface CulturalAdaptation {
    region: string;
    businessPractices: {
        decisionMaking: string[];
        communicationStyle: string;
        hierarchyPreferences: string;
        timeOrientation: string;
        relationshipBuilding: string[];
    };
    regulatoryConsiderations: {
        dataProtection: string[];
        businessCompliance: string[];
        industrySpecific: Record<string, string[]>;
    };
    languagePreferences: {
        formalityLevel: 'formal' | 'semi-formal' | 'casual';
        preferredTerminology: Record<string, string>;
        culturalMetaphors: string[];
    };
    economicContext: {
        currencyPreferences: string[];
        investmentPatterns: string[];
        resourceAvailability: string;
    };
}
export interface LocalizationRule {
    sourceText: string;
    adaptations: Record<string, string>;
    context: string[];
    applicableIndustries?: string[];
}
export declare class CulturalAdapter {
    private culturalProfiles;
    private localizationRules;
    private biasDetectionPatterns;
    private biasDetectionEngine;
    constructor();
    private initializeCulturalProfiles;
    private initializeLocalizationRules;
    private initializeBiasDetection;
    adaptQuestion(question: Question, userContext: UserContext): Question;
    private applyLocalizationRules;
    private determinePrimaryCulturalContext;
    getRegulatorConsiderations(region: string, industry?: string): string[];
    validateCulturalSensitivity(content: string, userContext?: UserContext): {
        isValid: boolean;
        issues: string[];
        suggestions: string[];
    };
    getBusinessPracticePreferences(culturalContext: string): CulturalAdaptation['businessPractices'] | null;
    getEconomicContext(culturalContext: string): CulturalAdaptation['economicContext'] | null;
    adaptResponseInterpretation(response: AssessmentResponse, userContext: UserContext): AssessmentResponse;
    applyCulturalTerminology(text: string, culturalContext: string): string;
    validateComprehensiveCulturalSensitivity(content: string, userContext: UserContext): {
        isValid: boolean;
        culturalValidation: {
            isValid: boolean;
            issues: string[];
            suggestions: string[];
        };
        biasDetection: {
            hasBias: boolean;
            biasTypes: any[];
            confidence: number;
            suggestions: string[];
        };
        overallScore: number;
        recommendations: string[];
    };
    generateCulturallyAppropriateAlternative(content: string, userContext: UserContext): {
        originalContent: string;
        improvedContent: string;
        culturalAdaptations: string[];
        biasCorrections: string[];
        confidence: number;
    };
    private applyCulturalTerminologyPrivate;
}
//# sourceMappingURL=CulturalAdapter.d.ts.map