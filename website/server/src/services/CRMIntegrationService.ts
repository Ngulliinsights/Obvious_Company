/**
 * CRM Integration Service
 * Handles lead capture and follow-up automation
 * Requirements: 5.4, 9.4
 */

import { AssessmentResults, UserProfile, PersonaType } from '../types/assessment';
import { WebhookService } from './WebhookService';

export interface CRMContact {
  id?: string;
  firstName: string;
  lastName?: string;
  email: string;
  company?: string;
  role?: string;
  phone?: string;
  source: string;
  tags: string[];
  customFields: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMDeal {
  id?: string;
  contactId: string;
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate?: Date;
  source: string;
  customFields: { [key: string]: any };
  createdAt: Date;
  updatedAt: Date;
}

export interface CRMActivity {
  id?: string;
  contactId: string;
  dealId?: string;
  type: 'email' | 'call' | 'meeting' | 'assessment' | 'consultation' | 'note';
  subject: string;
  description: string;
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
}

export class CRMIntegrationService {
  private webhookService = new WebhookService();
  private crmApiUrl = process.env.CRM_API_URL || '';
  private crmApiKey = process.env.CRM_API_KEY || '';
  private crmType = process.env.CRM_TYPE || 'hubspot'; // hubspot, salesforce, pipedrive

  /**
   * Create or update contact in CRM from assessment data
   */
  async createOrUpdateContact(
    userProfile: Partial<UserProfile>,
    assessmentResults: AssessmentResults,
    email: string,
    firstName: string,
    additionalData?: any
  ): Promise<CRMContact> {
    try {
      const contact: CRMContact = {
        firstName,
        lastName: additionalData?.lastName || '',
        email,
        company: userProfile.professional?.industry || additionalData?.company || '',
        role: userProfile.professional?.role_level || additionalData?.role || '',
        phone: additionalData?.phone || '',
        source: 'assessment_completion',
        tags: this.generateContactTags(assessmentResults, userProfile),
        customFields: {
          assessmentType: assessmentResults.session_id,
          persona: assessmentResults.persona_classification.primary_persona,
          overallScore: assessmentResults.overall_score,
          strategicAuthority: assessmentResults.dimension_scores.strategic_authority,
          organizationalInfluence: assessmentResults.dimension_scores.organizational_influence,
          resourceAvailability: assessmentResults.dimension_scores.resource_availability,
          implementationReadiness: assessmentResults.dimension_scores.implementation_readiness,
          culturalAlignment: assessmentResults.dimension_scores.cultural_alignment,
          recommendedService: assessmentResults.recommendations.service_tier_recommendation,
          investmentRange: assessmentResults.recommendations.investment_range,
          industry: userProfile.professional?.industry || '',
          geographicRegion: userProfile.demographics?.geographic_region || '',
          culturalContext: userProfile.demographics?.cultural_context?.join(', ') || '',
          completedAt: new Date().toISOString()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Send to CRM based on type
      const crmContact = await this.sendToCRM('contact', contact);

      // Trigger webhook for CRM contact creation
      await this.webhookService.triggerWebhook('crm.contact.created', {
        contact: crmContact,
        assessmentResults,
        userProfile
      });

      return crmContact;
    } catch (error) {
      console.error('Failed to create/update CRM contact:', error);
      throw error;
    }
  }

  /**
   * Create deal/opportunity in CRM
   */
  async createDeal(
    contactId: string,
    assessmentResults: AssessmentResults,
    userProfile: Partial<UserProfile>
  ): Promise<CRMDeal> {
    try {
      const serviceRecommendation = assessmentResults.recommendations.service_tier_recommendation;
      const dealValue = this.calculateDealValue(serviceRecommendation, assessmentResults.dimension_scores.resource_availability);
      
      const deal: CRMDeal = {
        contactId,
        title: `${serviceRecommendation} - ${assessmentResults.persona_classification.primary_persona}`,
        value: dealValue,
        stage: this.getDealStage(assessmentResults.persona_classification.primary_persona),
        probability: this.calculateDealProbability(assessmentResults),
        expectedCloseDate: this.calculateExpectedCloseDate(assessmentResults),
        source: 'assessment_completion',
        customFields: {
          assessmentSessionId: assessmentResults.session_id,
          persona: assessmentResults.persona_classification.primary_persona,
          overallScore: assessmentResults.overall_score,
          recommendedTimeline: assessmentResults.recommendations.timeline_suggestion,
          nextSteps: assessmentResults.recommendations.next_steps.join(', '),
          industry: userProfile.professional?.industry || '',
          organizationSize: userProfile.professional?.organization_size || ''
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const crmDeal = await this.sendToCRM('deal', deal);

      // Trigger webhook for deal creation
      await this.webhookService.triggerWebhook('crm.deal.created', {
        deal: crmDeal,
        contactId,
        assessmentResults
      });

      return crmDeal;
    } catch (error) {
      console.error('Failed to create CRM deal:', error);
      throw error;
    }
  }

  /**
   * Log assessment activity in CRM
   */
  async logAssessmentActivity(
    contactId: string,
    dealId: string,
    assessmentResults: AssessmentResults
  ): Promise<CRMActivity> {
    try {
      const activity: CRMActivity = {
        contactId,
        dealId,
        type: 'assessment',
        subject: `Assessment Completed: ${assessmentResults.persona_classification.primary_persona}`,
        description: `
Assessment Type: ${assessmentResults.session_id}
Overall Score: ${assessmentResults.overall_score}%
Persona: ${assessmentResults.persona_classification.primary_persona}
Recommended Service: ${assessmentResults.recommendations.service_tier_recommendation}
Investment Range: ${assessmentResults.recommendations.investment_range}

Dimension Scores:
- Strategic Authority: ${assessmentResults.dimension_scores.strategic_authority}%
- Organizational Influence: ${assessmentResults.dimension_scores.organizational_influence}%
- Resource Availability: ${assessmentResults.dimension_scores.resource_availability}%
- Implementation Readiness: ${assessmentResults.dimension_scores.implementation_readiness}%
- Cultural Alignment: ${assessmentResults.dimension_scores.cultural_alignment}%

Next Steps:
${assessmentResults.recommendations.next_steps.map(step => `- ${step}`).join('\n')}
        `,
        completedAt: new Date(),
        createdAt: new Date()
      };

      const crmActivity = await this.sendToCRM('activity', activity);

      // Trigger webhook for activity logging
      await this.webhookService.triggerWebhook('crm.activity.logged', {
        activity: crmActivity,
        assessmentResults
      });

      return crmActivity;
    } catch (error) {
      console.error('Failed to log CRM activity:', error);
      throw error;
    }
  }

  /**
   * Schedule follow-up activities based on persona and results
   */
  async scheduleFollowUpActivities(
    contactId: string,
    dealId: string,
    assessmentResults: AssessmentResults
  ): Promise<CRMActivity[]> {
    try {
      const persona = assessmentResults.persona_classification.primary_persona;
      const followUpActivities: CRMActivity[] = [];

      // Schedule immediate follow-up email
      followUpActivities.push({
        contactId,
        dealId,
        type: 'email',
        subject: 'Follow-up: Your Strategic AI Assessment Results',
        description: 'Send personalized assessment results and next steps email',
        dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        createdAt: new Date()
      });

      // Schedule persona-specific follow-ups
      switch (persona) {
        case PersonaType.STRATEGIC_ARCHITECT:
          // Executive-level follow-up
          followUpActivities.push({
            contactId,
            dealId,
            type: 'call',
            subject: 'Executive Consultation Call',
            description: 'Schedule strategic consultation call to discuss enterprise AI transformation',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
            createdAt: new Date()
          });
          break;

        case PersonaType.STRATEGIC_CATALYST:
          // Senior leader follow-up
          followUpActivities.push({
            contactId,
            dealId,
            type: 'email',
            subject: 'Strategic Systems Program Information',
            description: 'Send detailed information about Strategic Systems program',
            dueDate: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours
            createdAt: new Date()
          });
          break;

        case PersonaType.STRATEGIC_CONTRIBUTOR:
          // Department leader follow-up
          followUpActivities.push({
            contactId,
            dealId,
            type: 'email',
            subject: 'Strategic Clarity Program Details',
            description: 'Send Strategic Clarity program information and case studies',
            dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
            createdAt: new Date()
          });
          break;

        case PersonaType.STRATEGIC_EXPLORER:
          // Emerging leader follow-up
          followUpActivities.push({
            contactId,
            dealId,
            type: 'email',
            subject: 'Learning Resources and Next Steps',
            description: 'Send curated learning resources and development pathway',
            dueDate: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
            createdAt: new Date()
          });
          break;

        case PersonaType.STRATEGIC_OBSERVER:
          // Specialist follow-up
          followUpActivities.push({
            contactId,
            dealId,
            type: 'email',
            subject: 'Assessment-Based Consultation Options',
            description: 'Send information about consultation options and resources',
            dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours
            createdAt: new Date()
          });
          break;
      }

      // Schedule longer-term follow-up
      followUpActivities.push({
        contactId,
        dealId,
        type: 'call',
        subject: 'Follow-up Check-in',
        description: 'Check on progress and offer additional support',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date()
      });

      // Create all activities in CRM
      const createdActivities = [];
      for (const activity of followUpActivities) {
        const crmActivity = await this.sendToCRM('activity', activity);
        createdActivities.push(crmActivity);
      }

      return createdActivities;
    } catch (error) {
      console.error('Failed to schedule follow-up activities:', error);
      throw error;
    }
  }

  /**
   * Generate contact tags based on assessment results
   */
  private generateContactTags(
    assessmentResults: AssessmentResults,
    userProfile: Partial<UserProfile>
  ): string[] {
    const tags = [
      'assessment-completed',
      `persona-${assessmentResults.persona_classification.primary_persona}`,
      `service-${assessmentResults.recommendations.service_tier_recommendation.toLowerCase().replace(/\s+/g, '-')}`,
      `score-${Math.floor(assessmentResults.overall_score / 10) * 10}+`
    ];

    // Add industry tag
    if (userProfile.professional?.industry) {
      tags.push(`industry-${userProfile.professional.industry}`);
    }

    // Add geographic tag
    if (userProfile.demographics?.geographic_region) {
      tags.push(`region-${userProfile.demographics.geographic_region.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // Add readiness level tags
    if (assessmentResults.dimension_scores.implementation_readiness >= 8) {
      tags.push('high-readiness');
    } else if (assessmentResults.dimension_scores.implementation_readiness >= 6) {
      tags.push('medium-readiness');
    } else {
      tags.push('low-readiness');
    }

    // Add authority level tags
    if (assessmentResults.dimension_scores.strategic_authority >= 8) {
      tags.push('high-authority');
    } else if (assessmentResults.dimension_scores.strategic_authority >= 6) {
      tags.push('medium-authority');
    } else {
      tags.push('low-authority');
    }

    return tags;
  }

  /**
   * Calculate deal value based on service recommendation and resource availability
   */
  private calculateDealValue(serviceRecommendation: string, resourceScore: number): number {
    const baseValues: { [key: string]: number } = {
      'Strategic Clarity': 12500, // Average of $10K-15K
      'Strategic Systems': 32500, // Average of $25K-40K
      'Strategic Advantage': 62500, // Average of $50K-75K
      'Assessment Consultation': 3500 // Average of $2K-5K
    };

    const baseValue = baseValues[serviceRecommendation] || 12500;
    
    // Adjust based on resource availability score
    const resourceMultiplier = 0.8 + (resourceScore / 10) * 0.4; // 0.8 to 1.2 multiplier
    
    return Math.round(baseValue * resourceMultiplier);
  }

  /**
   * Determine initial deal stage based on persona
   */
  private getDealStage(persona: PersonaType): string {
    const stageMap: { [key in PersonaType]: string } = {
      [PersonaType.STRATEGIC_ARCHITECT]: 'Qualified Lead',
      [PersonaType.STRATEGIC_CATALYST]: 'Qualified Lead',
      [PersonaType.STRATEGIC_CONTRIBUTOR]: 'Marketing Qualified Lead',
      [PersonaType.STRATEGIC_EXPLORER]: 'Marketing Qualified Lead',
      [PersonaType.STRATEGIC_OBSERVER]: 'Lead'
    };

    return stageMap[persona];
  }

  /**
   * Calculate deal probability based on assessment results
   */
  private calculateDealProbability(assessmentResults: AssessmentResults): number {
    const { dimension_scores, persona_classification } = assessmentResults;
    
    // Base probability by persona
    const personaProbability: { [key in PersonaType]: number } = {
      [PersonaType.STRATEGIC_ARCHITECT]: 0.6,
      [PersonaType.STRATEGIC_CATALYST]: 0.5,
      [PersonaType.STRATEGIC_CONTRIBUTOR]: 0.4,
      [PersonaType.STRATEGIC_EXPLORER]: 0.3,
      [PersonaType.STRATEGIC_OBSERVER]: 0.2
    };

    let probability = personaProbability[persona_classification.primary_persona];

    // Adjust based on dimension scores
    const avgScore = (
      dimension_scores.strategic_authority +
      dimension_scores.organizational_influence +
      dimension_scores.resource_availability +
      dimension_scores.implementation_readiness
    ) / 4;

    // Higher scores increase probability
    probability += (avgScore - 50) / 100 * 0.3; // Max adjustment of ±30%

    // Ensure probability stays within reasonable bounds
    return Math.max(0.1, Math.min(0.9, probability));
  }

  /**
   * Calculate expected close date based on assessment results
   */
  private calculateExpectedCloseDate(assessmentResults: AssessmentResults): Date {
    const persona = assessmentResults.persona_classification.primary_persona;
    const readinessScore = assessmentResults.dimension_scores.implementation_readiness;

    // Base timeline by persona (in days)
    const baseTimeline: { [key in PersonaType]: number } = {
      [PersonaType.STRATEGIC_ARCHITECT]: 45, // 6-7 weeks
      [PersonaType.STRATEGIC_CATALYST]: 60, // 8-9 weeks
      [PersonaType.STRATEGIC_CONTRIBUTOR]: 75, // 10-11 weeks
      [PersonaType.STRATEGIC_EXPLORER]: 90, // 12-13 weeks
      [PersonaType.STRATEGIC_OBSERVER]: 120 // 16-17 weeks
    };

    let timeline = baseTimeline[persona];

    // Adjust based on readiness score
    if (readinessScore >= 8) {
      timeline *= 0.8; // 20% faster for high readiness
    } else if (readinessScore <= 4) {
      timeline *= 1.3; // 30% slower for low readiness
    }

    return new Date(Date.now() + timeline * 24 * 60 * 60 * 1000);
  }

  /**
   * Send data to CRM system
   */
  private async sendToCRM(type: 'contact' | 'deal' | 'activity', data: any): Promise<any> {
    try {
      // This would integrate with actual CRM APIs
      // For now, we'll simulate the API call and return the data with an ID
      
      console.log(`Sending ${type} to ${this.crmType} CRM:`, data);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Return data with simulated ID
      return {
        ...data,
        id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };
    } catch (error) {
      console.error(`Failed to send ${type} to CRM:`, error);
      throw error;
    }
  }

  /**
   * Update contact in CRM
   */
  async updateContact(contactId: string, updates: Partial<CRMContact>): Promise<CRMContact> {
    try {
      const updatedContact = await this.sendToCRM('contact', { id: contactId, ...updates });
      
      await this.webhookService.triggerWebhook('crm.contact.updated', {
        contactId,
        updates,
        updatedContact
      });

      return updatedContact;
    } catch (error) {
      console.error('Failed to update CRM contact:', error);
      throw error;
    }
  }

  /**
   * Update deal in CRM
   */
  async updateDeal(dealId: string, updates: Partial<CRMDeal>): Promise<CRMDeal> {
    try {
      const updatedDeal = await this.sendToCRM('deal', { id: dealId, ...updates });
      
      await this.webhookService.triggerWebhook('crm.deal.updated', {
        dealId,
        updates,
        updatedDeal
      });

      return updatedDeal;
    } catch (error) {
      console.error('Failed to update CRM deal:', error);
      throw error;
    }
  }
}