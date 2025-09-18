---
title: "Scoringengine.d"
type: "framework"
audience: "executives"
version: "v2025.ts"
dependencies:
  - "" # Add dependencies here
implementations:
  - "" # Add implementations here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

import { AssessmentResponse, DimensionScores, UserContext } from '../models/types';
import { UserProfile } from '../models/UserProfile';
export interface ScoringWeights {
    strategicAuthority: number;
    organizationalInfluence: number;
    resourceAvailability: number;
    implementationReadiness: number;
    culturalAlignment: number;
}
export interface IndustryAdjustments {
    [industry: string]: {
        weights: Partial<ScoringWeights>;
        bonusFactors: Record<string, number>;
        penalties: Record<string, number>;
    };
}
export interface CulturalFactors {
    [region: string]: {
        communicationStyle: number;
        hierarchyRespect: number;
        riskTolerance: number;
        timeOrientation: number;
    };
}
export declare class ScoringEngine {
    private static readonly DEFAULT_WEIGHTS;
    private static readonly INDUSTRY_ADJUSTMENTS;
    private static readonly CULTURAL_FACTORS;
    static calculateDimensionScores(responses: AssessmentResponse[], userProfile: UserProfile, userContext: UserContext): DimensionScores;
    private static calculateRawDimensionScores;
    private static mapQuestionToDimension;
    private static extractNumericScore;
    private static getAdjustedWeights;
    private static getCulturalAdjustments;
    private static getIndustryAdjustments;
    private static applyCulturalAdjustments;
    private static applyIndustryAdjustments;
    private static normalizeScores;
    static calculateOverallScore(dimensionScores: DimensionScores, weights?: ScoringWeights): number;
}
//# sourceMappingURL=ScoringEngine.d.ts.map