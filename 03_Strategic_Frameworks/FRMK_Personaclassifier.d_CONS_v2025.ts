---
title: "Personaclassifier.d"
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

import { PersonaClassification, PersonaType, DimensionScores, UserContext } from '../models/types';
import { UserProfile } from '../models/UserProfile';
export interface DecisionNode {
    condition: (scores: DimensionScores, profile: UserProfile) => boolean;
    trueNode?: DecisionNode | PersonaType;
    falseNode?: DecisionNode | PersonaType;
    description: string;
}
export interface PersonaCharacteristics {
    [key: string]: {
        authorityRange: [number, number];
        influenceRange: [number, number];
        resourceRange: [number, number];
        readinessRange: [number, number];
        culturalRange: [number, number];
        investmentCapacity: string;
        decisionMakingPower: string;
        implementationFocus: string;
    };
}
export declare class PersonaClassifier {
    private static readonly PERSONA_CHARACTERISTICS;
    private static readonly DECISION_TREE;
    static classifyPersona(dimensionScores: DimensionScores, userProfile: UserProfile, userContext: UserContext): PersonaClassification;
    private static traverseDecisionTree;
    private static applyCulturalClassificationAdjustments;
    private static calculateConfidenceScore;
    private static scoreInRange;
    private static identifySecondaryCharacteristics;
    private static generateClassificationReasoning;
    static getPersonaCharacteristics(persona: PersonaType): PersonaCharacteristics[string] | null;
    static getAllPersonaCharacteristics(): PersonaCharacteristics;
    static validateClassification(classification: PersonaClassification, userProfile: UserProfile): {
        isValid: boolean;
        warnings: string[];
    };
}
//# sourceMappingURL=PersonaClassifier.d.ts.map