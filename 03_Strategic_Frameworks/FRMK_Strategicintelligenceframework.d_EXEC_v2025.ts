---
title: "Strategicintelligenceframework.d"
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

import { AssessmentResults, PersonaType } from '../models/types';
export interface StrategicIntelligenceInsight {
    category: 'strategic_positioning' | 'human_ai_collaboration' | 'decision_enhancement' | 'change_management';
    title: string;
    description: string;
    implementation_approach: string;
    strategic_value: string;
    automation_context?: string;
}
export interface StrategicFrameworkResult {
    strategic_positioning: StrategicIntelligenceInsight[];
    collaboration_opportunities: StrategicIntelligenceInsight[];
    decision_enhancement_areas: StrategicIntelligenceInsight[];
    change_management_considerations: StrategicIntelligenceInsight[];
    cultural_adaptation_factors: string[];
    strategic_value_proposition: string;
}
export declare class StrategicIntelligenceFramework {
    private readonly STRATEGIC_THEMES;
    private readonly AUTOMATION_CONTEXTS;
    generateStrategicInsights(assessmentResults: AssessmentResults, industryContext: string, culturalContext: string[]): StrategicFrameworkResult;
    positionAutomationStrategically(automationOpportunities: string[], _strategicContext: StrategicFrameworkResult): StrategicIntelligenceInsight[];
    emphasizeHumanAICollaboration(assessmentResults: AssessmentResults, industryContext: string): StrategicIntelligenceInsight[];
    enhanceStrategicDecisionMaking(assessmentResults: AssessmentResults, persona: PersonaType): StrategicIntelligenceInsight[];
    integrateChangeManagement(assessmentResults: AssessmentResults, culturalContext: string[]): StrategicIntelligenceInsight[];
    private generateStrategicPositioning;
    private generateCollaborationOpportunities;
    private generateDecisionEnhancementAreas;
    private generateChangeManagementConsiderations;
    private generateCulturalAdaptationFactors;
    private generateStrategicValueProposition;
    private getIndustrySpecificInsights;
    private getPersonaSpecificApproach;
    private determineStrategicContext;
    private determineAutomationContext;
    private generateStrategicImplementationApproach;
    private generateStrategicValue;
    private identifyCollaborationAreas;
    private identifyDecisionEnhancementAreas;
    private identifyChangeManagementNeeds;
    private getIndustryDecisionAreas;
}
//# sourceMappingURL=StrategicIntelligenceFramework.d.ts.map