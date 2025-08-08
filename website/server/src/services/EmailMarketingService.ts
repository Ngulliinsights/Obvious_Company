/**
 * Email Marketing Integration Service
 * Handles assessment-based email campaigns and automation
 * Requirements: 5.4, 9.4
 */

import { AssessmentResults, UserProfile, PersonaType } from '../types/assessment';
import { WebhookService } from './WebhookService';
import nodemailer from 'nodemailer';

export interface EmailCampaign {
  id: string;
  name: string;
  type: 'assessment_follow_up' | 'nurture_sequence' | 'persona_specific' | 'industry_specific';
  trigger: string;
  audience: {
    personas?: PersonaType[];
    industries?: string[];
    scoreRange?: { min: number; max: number };
    tags?: string[];
  };
  emails: EmailTemplate[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  delay: number; // Delay in hours from trigger
  conditions?: {
    persona?: PersonaType[];
    scoreThreshold?: number;
    customFields?: { [key: string]: any };
  };
}

export interface EmailSubscriber {
  id: string;
  email: string;
  firstName: string;
  lastName?: string;
  tags: string[];
  customFields: { [key: string]: any };
  subscriptionStatus: 'subscribed' | 'unsubscribed' | 'bounced' | 'complained';
  subscribedAt: Date;
  updatedAt: Date;
}

export class EmailMarketingService {
  private webhookService = new WebhookService();
  private transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  /**
   * Add subscriber from assessment completion
   */
  async addAssessmentSubscriber(
    email: string,
    firstName: string,
    assessmentResults: AssessmentResults,
    userProfile: Partial<UserProfile>
  ): Promise<EmailSubscriber> {
    try {
      const subscriber: EmailSubscriber = {
        id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email,
        firstName,
        tags: this.generateSubscriberTags(assessmentResults, userProfile),
        customFields: {
          persona: assessmentResults.persona_classification.primary_persona,
          overallScore: assessmentResults.overall_score,
          assessmentDate: new Date().toISOString(),
          recommendedService: assessmentResults.recommendations.service_tier_recommendation,
          industry: userProfile.professional?.industry || '',
          geographicRegion: userProfile.demographics?.geographic_region || '',
          culturalContext: userProfile.demographics?.cultural_context?.join(', ') || '',
          strategicAuthority: assessmentResults.dimension_scores.strategic_authority,
          organizationalInfluence: assessmentResults.dimension_scores.organizational_influence,
          resourceAvailability: assessmentResults.dimension_scores.resource_availability,
          implementationReadiness: assessmentResults.dimension_scores.implementation_readiness,
          culturalAlignment: assessmentResults.dimension_scores.cultural_alignment
        },
        subscriptionStatus: 'subscribed',
        subscribedAt: new Date(),
        updatedAt: new Date()
      };

      // Add to email marketing platform
      await this.addToEmailPlatform(subscriber);

      // Trigger assessment-based email sequence
      await this.triggerAssessmentEmailSequence(subscriber, assessmentResults, userProfile);

      // Trigger webhook
      await this.webhookService.triggerWebhook('email.subscriber.added', {
        subscriber,
        assessmentResults,
        userProfile
      });

      return subscriber;
    } catch (error) {
      console.error('Failed to add assessment subscriber:', error);
      throw error;
    }
  }

  /**
   * Trigger assessment-based email sequence
   */
  async triggerAssessmentEmailSequence(
    subscriber: EmailSubscriber,
    assessmentResults: AssessmentResults,
    userProfile: Partial<UserProfile>
  ): Promise<void> {
    try {
      const persona = assessmentResults.persona_classification.primary_persona;
      const sequence = this.getPersonaEmailSequence(persona);

      for (const email of sequence.emails) {
        // Schedule email based on delay
        setTimeout(async () => {
          await this.sendPersonalizedEmail(subscriber, email, assessmentResults, userProfile);
        }, email.delay * 60 * 60 * 1000); // Convert hours to milliseconds
      }

      // Trigger webhook for sequence start
      await this.webhookService.triggerWebhook('email.sequence.triggered', {
        subscriber,
        sequence: sequence.name,
        persona,
        emailCount: sequence.emails.length
      });
    } catch (error) {
      console.error('Failed to trigger assessment email sequence:', error);
      throw error;
    }
  }

  /**
   * Send personalized email based on assessment results
   */
  async sendPersonalizedEmail(
    subscriber: EmailSubscriber,
    template: EmailTemplate,
    assessmentResults: AssessmentResults,
    userProfile: Partial<UserProfile>
  ): Promise<void> {
    try {
      // Personalize email content
      const personalizedSubject = this.personalizeContent(template.subject, subscriber, assessmentResults, userProfile);
      const personalizedHtml = this.personalizeContent(template.htmlContent, subscriber, assessmentResults, userProfile);
      const personalizedText = this.personalizeContent(template.textContent, subscriber, assessmentResults, userProfile);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: subscriber.email,
        subject: personalizedSubject,
        html: personalizedHtml,
        text: personalizedText,
        headers: {
          'X-Campaign-Type': 'assessment-follow-up',
          'X-Persona': assessmentResults.persona_classification.primary_persona,
          'X-Assessment-Score': assessmentResults.overall_score.toString()
        }
      };

      await this.transporter.sendMail(mailOptions);

      // Log email sent
      console.log(`Assessment follow-up email sent to ${subscriber.email}: ${personalizedSubject}`);

      // Trigger webhook
      await this.webhookService.triggerWebhook('email.sent', {
        subscriber,
        template: template.id,
        subject: personalizedSubject,
        sentAt: new Date()
      });
    } catch (error) {
      console.error('Failed to send personalized email:', error);
      throw error;
    }
  }

  /**
   * Get persona-specific email sequence
   */
  private getPersonaEmailSequence(persona: PersonaType): EmailCampaign {
    const sequences: { [key in PersonaType]: EmailCampaign } = {
      [PersonaType.STRATEGIC_ARCHITECT]: {
        id: 'seq_strategic_architect',
        name: 'Strategic Architect Follow-up',
        type: 'persona_specific',
        trigger: 'assessment_completion',
        audience: { personas: [PersonaType.STRATEGIC_ARCHITECT] },
        emails: [
          {
            id: 'sa_email_1',
            subject: '{{firstName}}, your Strategic Intelligence Assessment results are ready',
            htmlContent: this.getStrategicArchitectEmail1Html(),
            textContent: this.getStrategicArchitectEmail1Text(),
            delay: 0.5 // 30 minutes
          },
          {
            id: 'sa_email_2',
            subject: 'The #1 mistake executives make with AI (and how to avoid it)',
            htmlContent: this.getStrategicArchitectEmail2Html(),
            textContent: this.getStrategicArchitectEmail2Text(),
            delay: 24 // 24 hours
          },
          {
            id: 'sa_email_3',
            subject: 'Ready to discuss your Strategic Advantage program?',
            htmlContent: this.getStrategicArchitectEmail3Html(),
            textContent: this.getStrategicArchitectEmail3Text(),
            delay: 72 // 72 hours
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      [PersonaType.STRATEGIC_CATALYST]: {
        id: 'seq_strategic_catalyst',
        name: 'Strategic Catalyst Follow-up',
        type: 'persona_specific',
        trigger: 'assessment_completion',
        audience: { personas: [PersonaType.STRATEGIC_CATALYST] },
        emails: [
          {
            id: 'sc_email_1',
            subject: '{{firstName}}, your leadership assessment reveals key opportunities',
            htmlContent: this.getStrategicCatalystEmail1Html(),
            textContent: this.getStrategicCatalystEmail1Text(),
            delay: 1 // 1 hour
          },
          {
            id: 'sc_email_2',
            subject: 'How to build AI-ready teams (case study inside)',
            htmlContent: this.getStrategicCatalystEmail2Html(),
            textContent: this.getStrategicCatalystEmail2Text(),
            delay: 48 // 48 hours
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      [PersonaType.STRATEGIC_CONTRIBUTOR]: {
        id: 'seq_strategic_contributor',
        name: 'Strategic Contributor Follow-up',
        type: 'persona_specific',
        trigger: 'assessment_completion',
        audience: { personas: [PersonaType.STRATEGIC_CONTRIBUTOR] },
        emails: [
          {
            id: 'sco_email_1',
            subject: '{{firstName}}, your Strategic Clarity pathway is ready',
            htmlContent: this.getStrategicContributorEmail1Html(),
            textContent: this.getStrategicContributorEmail1Text(),
            delay: 2 // 2 hours
          },
          {
            id: 'sco_email_2',
            subject: 'Quick wins: 3 AI implementations you can start this week',
            htmlContent: this.getStrategicContributorEmail2Html(),
            textContent: this.getStrategicContributorEmail2Text(),
            delay: 96 // 96 hours
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      [PersonaType.STRATEGIC_EXPLORER]: {
        id: 'seq_strategic_explorer',
        name: 'Strategic Explorer Follow-up',
        type: 'persona_specific',
        trigger: 'assessment_completion',
        audience: { personas: [PersonaType.STRATEGIC_EXPLORER] },
        emails: [
          {
            id: 'se_email_1',
            subject: '{{firstName}}, your AI learning journey starts here',
            htmlContent: this.getStrategicExplorerEmail1Html(),
            textContent: this.getStrategicExplorerEmail1Text(),
            delay: 4 // 4 hours
          },
          {
            id: 'se_email_2',
            subject: 'Free resources: Your personalized AI learning path',
            htmlContent: this.getStrategicExplorerEmail2Html(),
            textContent: this.getStrategicExplorerEmail2Text(),
            delay: 120 // 120 hours (5 days)
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      [PersonaType.STRATEGIC_OBSERVER]: {
        id: 'seq_strategic_observer',
        name: 'Strategic Observer Follow-up',
        type: 'persona_specific',
        trigger: 'assessment_completion',
        audience: { personas: [PersonaType.STRATEGIC_OBSERVER] },
        emails: [
          {
            id: 'so_email_1',
            subject: '{{firstName}}, understanding AI\'s impact on your role',
            htmlContent: this.getStrategicObserverEmail1Html(),
            textContent: this.getStrategicObserverEmail1Text(),
            delay: 6 // 6 hours
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };

    return sequences[persona];
  }

  /**
   * Personalize email content with assessment data
   */
  private personalizeContent(
    content: string,
    subscriber: EmailSubscriber,
    assessmentResults: AssessmentResults,
    userProfile: Partial<UserProfile>
  ): string {
    let personalized = content;

    // Basic personalization
    personalized = personalized.replace(/\{\{firstName\}\}/g, subscriber.firstName);
    personalized = personalized.replace(/\{\{email\}\}/g, subscriber.email);

    // Assessment-specific personalization
    personalized = personalized.replace(/\{\{overallScore\}\}/g, assessmentResults.overall_score.toString());
    personalized = personalized.replace(/\{\{persona\}\}/g, assessmentResults.persona_classification.primary_persona);
    personalized = personalized.replace(/\{\{recommendedService\}\}/g, assessmentResults.recommendations.service_tier_recommendation);
    personalized = personalized.replace(/\{\{investmentRange\}\}/g, assessmentResults.recommendations.investment_range);
    personalized = personalized.replace(/\{\{timeline\}\}/g, assessmentResults.recommendations.timeline_suggestion);

    // Industry personalization
    if (userProfile.professional?.industry) {
      personalized = personalized.replace(/\{\{industry\}\}/g, userProfile.professional.industry);
    }

    // Geographic personalization
    if (userProfile.demographics?.geographic_region) {
      personalized = personalized.replace(/\{\{region\}\}/g, userProfile.demographics.geographic_region);
    }

    // Dynamic content based on scores
    if (assessmentResults.dimension_scores.strategic_authority >= 8) {
      personalized = personalized.replace(/\{\{authorityLevel\}\}/g, 'high decision-making authority');
    } else if (assessmentResults.dimension_scores.strategic_authority >= 6) {
      personalized = personalized.replace(/\{\{authorityLevel\}\}/g, 'significant influence');
    } else {
      personalized = personalized.replace(/\{\{authorityLevel\}\}/g, 'growing influence');
    }

    return personalized;
  }

  /**
   * Generate subscriber tags based on assessment results
   */
  private generateSubscriberTags(
    assessmentResults: AssessmentResults,
    userProfile: Partial<UserProfile>
  ): string[] {
    const tags = [
      'assessment-completed',
      `persona-${assessmentResults.persona_classification.primary_persona}`,
      `score-${Math.floor(assessmentResults.overall_score / 20) * 20}+`, // 0-20, 20-40, etc.
      `service-${assessmentResults.recommendations.service_tier_recommendation.toLowerCase().replace(/\s+/g, '-')}`
    ];

    // Add industry tag
    if (userProfile.professional?.industry) {
      tags.push(`industry-${userProfile.professional.industry}`);
    }

    // Add geographic tag
    if (userProfile.demographics?.geographic_region) {
      tags.push(`region-${userProfile.demographics.geographic_region.toLowerCase().replace(/\s+/g, '-')}`);
    }

    // Add readiness tags
    if (assessmentResults.dimension_scores.implementation_readiness >= 8) {
      tags.push('high-readiness');
    } else if (assessmentResults.dimension_scores.implementation_readiness >= 6) {
      tags.push('medium-readiness');
    } else {
      tags.push('low-readiness');
    }

    return tags;
  }

  /**
   * Add subscriber to email marketing platform
   */
  private async addToEmailPlatform(subscriber: EmailSubscriber): Promise<void> {
    try {
      // This would integrate with actual email marketing platforms like Mailchimp, ConvertKit, etc.
      console.log('Adding subscriber to email platform:', subscriber.email);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error('Failed to add subscriber to email platform:', error);
      throw error;
    }
  }

  // Email template methods (simplified for brevity)
  private getStrategicArchitectEmail1Html(): string {
    return `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2E5BBA;">{{firstName}}, your Strategic Intelligence Assessment results are ready</h2>
  
  <p>Thank you for completing our Strategic Intelligence Assessment. Your results reveal significant opportunities for strategic AI integration.</p>
  
  <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #1f2937; margin-top: 0;">Your Assessment Summary</h3>
    <ul>
      <li><strong>Overall Readiness Score:</strong> {{overallScore}}%</li>
      <li><strong>Strategic Persona:</strong> {{persona}}</li>
      <li><strong>Recommended Program:</strong> {{recommendedService}}</li>
      <li><strong>Investment Range:</strong> {{investmentRange}}</li>
    </ul>
  </div>
  
  <p>As a Strategic Architect, you're positioned to lead enterprise-wide AI transformation. Your {{authorityLevel}} makes you ideal for our Strategic Advantage program.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="${process.env.WEBSITE_URL}/contact.html" style="background: #2E5BBA; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Schedule Strategic Consultation</a>
  </div>
  
  <p>Best regards,<br>The Obvious Company Team</p>
</div>
    `;
  }

  private getStrategicArchitectEmail1Text(): string {
    return `
{{firstName}}, your Strategic Intelligence Assessment results are ready

Thank you for completing our Strategic Intelligence Assessment. Your results reveal significant opportunities for strategic AI integration.

Your Assessment Summary:
- Overall Readiness Score: {{overallScore}}%
- Strategic Persona: {{persona}}
- Recommended Program: {{recommendedService}}
- Investment Range: {{investmentRange}}

As a Strategic Architect, you're positioned to lead enterprise-wide AI transformation. Your {{authorityLevel}} makes you ideal for our Strategic Advantage program.

Schedule your strategic consultation: ${process.env.WEBSITE_URL}/contact.html

Best regards,
The Obvious Company Team
    `;
  }

  // Additional email template methods would be implemented similarly...
  private getStrategicArchitectEmail2Html(): string { return '<!-- Email 2 HTML -->'; }
  private getStrategicArchitectEmail2Text(): string { return '<!-- Email 2 Text -->'; }
  private getStrategicArchitectEmail3Html(): string { return '<!-- Email 3 HTML -->'; }
  private getStrategicArchitectEmail3Text(): string { return '<!-- Email 3 Text -->'; }
  private getStrategicCatalystEmail1Html(): string { return '<!-- Catalyst Email 1 HTML -->'; }
  private getStrategicCatalystEmail1Text(): string { return '<!-- Catalyst Email 1 Text -->'; }
  private getStrategicCatalystEmail2Html(): string { return '<!-- Catalyst Email 2 HTML -->'; }
  private getStrategicCatalystEmail2Text(): string { return '<!-- Catalyst Email 2 Text -->'; }
  private getStrategicContributorEmail1Html(): string { return '<!-- Contributor Email 1 HTML -->'; }
  private getStrategicContributorEmail1Text(): string { return '<!-- Contributor Email 1 Text -->'; }
  private getStrategicContributorEmail2Html(): string { return '<!-- Contributor Email 2 HTML -->'; }
  private getStrategicContributorEmail2Text(): string { return '<!-- Contributor Email 2 Text -->'; }
  private getStrategicExplorerEmail1Html(): string { return '<!-- Explorer Email 1 HTML -->'; }
  private getStrategicExplorerEmail1Text(): string { return '<!-- Explorer Email 1 Text -->'; }
  private getStrategicExplorerEmail2Html(): string { return '<!-- Explorer Email 2 HTML -->'; }
  private getStrategicExplorerEmail2Text(): string { return '<!-- Explorer Email 2 Text -->'; }
  private getStrategicObserverEmail1Html(): string { return '<!-- Observer Email 1 HTML -->'; }
  private getStrategicObserverEmail1Text(): string { return '<!-- Observer Email 1 Text -->'; }

  /**
   * Update subscriber information
   */
  async updateSubscriber(subscriberId: string, updates: Partial<EmailSubscriber>): Promise<EmailSubscriber> {
    try {
      // Update in email platform
      console.log(`Updating subscriber ${subscriberId}:`, updates);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const updatedSubscriber = { id: subscriberId, ...updates, updatedAt: new Date() } as EmailSubscriber;
      
      await this.webhookService.triggerWebhook('email.subscriber.updated', {
        subscriberId,
        updates,
        updatedSubscriber
      });

      return updatedSubscriber;
    } catch (error) {
      console.error('Failed to update subscriber:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe user
   */
  async unsubscribe(email: string): Promise<void> {
    try {
      console.log(`Unsubscribing ${email}`);
      
      // Update in email platform
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await this.webhookService.triggerWebhook('email.subscriber.unsubscribed', {
        email,
        unsubscribedAt: new Date()
      });
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
      throw error;
    }
  }
}