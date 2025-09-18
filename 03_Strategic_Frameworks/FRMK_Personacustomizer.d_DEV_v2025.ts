---
title: "Personacustomizer.d"
type: "framework"
audience: "developers"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

import { PersonaType, PersonaClassification, ServiceRecommendation, UserContext, IndustryInsights } from '../models/types';
import { UserProfile } from '../models/UserProfile';
export interface PersonaContent {
    language: {
        tone: string;
        vocabulary: string[];
        communicationStyle: string;
    };
    examples: {
        useCases: string[];
        roiScenarios: string[];
        implementationApproaches: string[];
    };
    recommendations: {
        serviceAlignment: string;
        nextSteps: string[];
        timelineApproach: string;
        resourceFocus: string[];
    };
}
export interface PersonaCustomization {
    content: PersonaContent;
    serviceRecommendation: ServiceRecommendation;
    customizedMessaging: {
        valueProposition: string;
        implementationFocus: string;
        successMetrics: string[];
        riskMitigation: string[];
    };
}
export declare class PersonaCustomizer {
    private static readonly PERSONA_CONTENT;
    static generateCustomization(classification: PersonaClassification, userProfile: UserProfile, userContext: UserContext, industryInsights?: IndustryInsights): PersonaCustomization;
    private static generateServiceRecommendation;
    private static generateServiceRationale;
    private static generateNextSteps;
    private static generateCustomizedMessaging;
    private static generateValueProposition;
    private static generateImplementationFocus;
    private static generateSuccessMetrics;
    private static generateRiskMitigation;
    private static applyContextualAdaptations;
    static getPersonaCustomizationOptions(persona: PersonaType): PersonaContent;
    static validateCustomization(customization: PersonaCustomization, classification: PersonaClassification): {
        isValid: boolean;
        warnings: string[];
    };
}
//# sourceMappingURL=PersonaCustomizer.d.ts.map