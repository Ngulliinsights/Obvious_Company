---
title: "Valuecommunicationengine.d"
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
export interface ValueCommunicationMessage {
    message_type: 'strategic_positioning' | 'competitive_advantage' | 'organizational_transformation' | 'roi_strategic';
    primary_message: string;
    supporting_points: string[];
    automation_context: string;
    strategic_framing: string;
    value_emphasis: string;
    implementation_narrative: string;
}
export interface StrategicValueCommunication {
    executive_summary: string;
    strategic_positioning_messages: ValueCommunicationMessage[];
    competitive_advantage_narrative: string;
    transformation_story: string;
    roi_strategic_framework: {
        strategic_value_drivers: string[];
        capability_building_metrics: string[];
        competitive_advantage_indicators: string[];
        transformation_milestones: string[];
    };
    automation_strategic_context: string;
}
export declare class ValueCommunicationEngine {
    private readonly STRATEGIC_VALUE_THEMES;
    generateStrategicValueCommunication(assessmentResults: AssessmentResults, industryContext: string, automationOpportunities: string[]): StrategicValueCommunication;
    frameAutomationWithinStrategicContext(automationOpportunities: string[], strategicContext: string, persona: PersonaType): ValueCommunicationMessage[];
    emphasizeStrategicPositioning(assessmentResults: AssessmentResults, industryContext: string): ValueCommunicationMessage[];
    buildOrganizationalTransformationFocus(assessmentResults: AssessmentResults, culturalContext: string[]): ValueCommunicationMessage[];
    developStrategicROICommunication(assessmentResults: AssessmentResults, industryContext: string, timeframe?: string): ValueCommunicationMessage;
    private generateExecutiveSummary;
    private generateStrategicPositioningMessages;
    private generateCompetitiveAdvantageNarrative;
    private generateTransformationStory;
    private generateROIStrategicFramework;
    private frameAutomationStrategically;
    private determineStrategicFraming;
    private determineValueEmphasis;
    private generateSupportingPoints;
    private generateImplementationNarrative;
    private getPersonaContext;
    private getIndustrySpecificValue;
    private getIndustryCompetitiveAdvantages;
    private getPersonaCompetitiveFocus;
    private getPersonaImplementationApproach;
    private identifyStrategicValueDrivers;
    private generateCapabilityBuildingMetrics;
    private generateCompetitiveAdvantageIndicators;
    private generateTransformationMilestones;
    private assessOrganizationalCapability;
    private assessTransformationReadiness;
    private assessCulturalAlignment;
    private assessOrganizationalMaturity;
    private assessStrategicReadiness;
    private extractReadinessIndicators;
    private getOpportunityContext;
    private extractValueDriversFromAssessment;
    private extractCapabilityMetricsFromAssessment;
    private assessOrganizationalReadiness;
}
//# sourceMappingURL=ValueCommunicationEngine.d.ts.map