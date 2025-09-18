---
title: "Industryadapter.d"
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

import { Question, IndustryInsights, Module } from '../models/types';
export interface IndustryConfig {
    id: string;
    name: string;
    description: string;
    regulatoryFramework: string[];
    keyUseCases: string[];
    roiExamples: string[];
    implementationConsiderations: string[];
    culturalFactors: string[];
    complianceRequirements: string[];
}
export interface IndustryQuestionSet {
    industryId: string;
    questions: Question[];
    scoringWeights: Record<string, number>;
    culturalAdaptations: Record<string, Record<string, string>>;
}
export interface IndustryROIExample {
    title: string;
    description: string;
    expectedROI: string;
    timeframe: string;
    implementationComplexity: 'Low' | 'Medium' | 'High';
    regulatoryConsiderations: string[];
}
export declare class IndustryAdapter {
    private industryConfigs;
    private questionSets;
    private roiExamples;
    constructor();
    getIndustryConfig(industryId: string): IndustryConfig | null;
    getIndustryQuestions(industryId: string, culturalContext?: string[]): Question[];
    getIndustryROIExamples(industryId: string): IndustryROIExample[];
    generateIndustryInsights(industryId: string, scores: Record<string, number>, culturalContext?: string[]): IndustryInsights;
    adaptForCulture(content: string, culturalContext: string[], industryId?: string): string;
    getIndustryModules(industryId: string, culturalContext?: string[]): Module[];
    getComplianceRequirements(industryId: string, region?: string): string[];
    private initializeIndustryConfigs;
    private initializeQuestionSets;
    private initializeROIExamples;
    private getGenericQuestions;
    private applyCulturalAdaptations;
    private applyContextualAdaptations;
    private calculateSectorReadiness;
    private getRegulatoryConsiderations;
    private getImplementationPriorities;
    private getCulturalFactors;
    private applyCulturalContextAdaptation;
    private generateIndustryModules;
    private getRegionalCompliance;
    private generateGenericInsights;
}
//# sourceMappingURL=IndustryAdapter.d.ts.map