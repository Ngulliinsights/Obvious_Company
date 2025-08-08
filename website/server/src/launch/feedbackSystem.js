/**
 * User Feedback Collection and Issue Reporting System
 * Captures user feedback, bug reports, and feature requests
 */

const nodemailer = require('nodemailer');

class FeedbackSystem {
    constructor(config = {}) {
        this.emailConfig = config.email || {};
        this.slackConfig = config.slack || {};
        this.feedbackStorage = new Map();
        this.issueStorage = new Map();
        this.feedbackCategories = [
            'user_experience',
            'assessment_accuracy',
            'technical_issue',
            'feature_request',
            'content_quality',
            'performance',
            'accessibility',
            'cultural_sensitivity'
        ];
        this.priorityLevels = ['low', 'medium', 'high', 'critical'];
        
        this.setupEmailTransporter();
    }

    /**
     * Setup email transporter for notifications
     */
    setupEmailTransporter() {
        if (this.emailConfig.host) {
            this.emailTransporter = nodemailer.createTransporter({
                host: this.emailConfig.host,
                port: this.emailConfig.port || 587,
                secure: false,
                auth: {
                    user: this.emailConfig.user,
                    pass: this.emailConfig.password
                }
            });
        }
    }

    /**
     * Collect user feedback
     */
    async collectFeedback(feedbackData) {
        const feedback = {
            id: this.generateId(),
            timestamp: new Date(),
            type: 'feedback',
            category: feedbackData.category || 'general',
            rating: feedbackData.rating,
            message: feedbackData.message,
            userContext: {
                email: feedbackData.email,
                sessionId: feedbackData.sessionId,
                userAgent: feedbackData.userAgent,
                url: feedbackData.url,
                assessmentType: feedbackData.assessmentType,
                persona: feedbackData.persona,
                industry: feedbackData.industry
            },
            metadata: {
                browserInfo: feedbackData.browserInfo,
                screenResolution: feedbackData.screenResolution,
                connectionType: feedbackData.connectionType,
                timeOnPage: feedbackData.timeOnPage
            },
            status: 'new',
            priority: this.calculatePriority(feedbackData),
            tags: this.generateTags(feedbackData)
        };

        // Store feedback
        this.feedbackStorage.set(feedback.id, feedback);

        // Process feedback
        await this.processFeedback(feedback);

        return {
            success: true,
            feedbackId: feedback.id,
            message: 'Thank you for your feedback! We\'ll review it and get back to you if needed.'
        };
    }

    /**
     * Report technical issues or bugs
     */
    async reportIssue(issueData) {
        const issue = {
            id: this.generateId(),
            timestamp: new Date(),
            type: 'issue',
            severity: issueData.severity || 'medium',
            category: issueData.category || 'technical_issue',
            title: issueData.title,
            description: issueData.description,
            stepsToReproduce: issueData.stepsToReproduce || [],
            expectedBehavior: issueData.expectedBehavior,
            actualBehavior: issueData.actualBehavior,
            userContext: {
                email: issueData.email,
                sessionId: issueData.sessionId,
                userAgent: issueData.userAgent,
                url: issueData.url,
                assessmentType: issueData.assessmentType
            },
            technicalDetails: {
                browserInfo: issueData.browserInfo,
                screenResolution: issueData.screenResolution,
                errorMessages: issueData.errorMessages || [],
                consoleErrors: issueData.consoleErrors || [],
                networkErrors: issueData.networkErrors || []
            },
            attachments: issueData.attachments || [],
            status: 'open',
            priority: this.calculateIssuePriority(issueData),
            assignee: null,
            tags: this.generateIssueTags(issueData)
        };

        // Store issue
        this.issueStorage.set(issue.id, issue);

        // Process issue
        await this.processIssue(issue);

        return {
            success: true,
            issueId: issue.id,
            message: 'Issue reported successfully. We\'ll investigate and provide updates.'
        };
    }

    /**
     * Process feedback and trigger appropriate actions
     */
    async processFeedback(feedback) {
        try {
            // Send email notification for high-priority feedback
            if (feedback.priority === 'high' || feedback.priority === 'critical') {
                await this.sendFeedbackNotification(feedback);
            }

            // Auto-categorize and tag
            feedback.tags = [...feedback.tags, ...this.autoGenerateTags(feedback)];

            // Trigger automated responses
            if (feedback.userContext.email) {
                await this.sendFeedbackAcknowledgment(feedback);
            }

            // Update analytics
            this.updateFeedbackAnalytics(feedback);

            console.log(`Processed feedback: ${feedback.id} (${feedback.category})`);

        } catch (error) {
            console.error('Error processing feedback:', error);
        }
    }

    /**
     * Process issues and trigger appropriate actions
     */
    async processIssue(issue) {
        try {
            // Send immediate notification for critical issues
            if (issue.priority === 'critical') {
                await this.sendCriticalIssueAlert(issue);
            }

            // Auto-assign based on category
            issue.assignee = this.autoAssignIssue(issue);

            // Create tracking ticket
            const ticketId = await this.createTrackingTicket(issue);
            issue.ticketId = ticketId;

            // Send acknowledgment to user
            if (issue.userContext.email) {
                await this.sendIssueAcknowledgment(issue);
            }

            // Update issue tracking analytics
            this.updateIssueAnalytics(issue);

            console.log(`Processed issue: ${issue.id} (${issue.severity})`);

        } catch (error) {
            console.error('Error processing issue:', error);
        }
    }

    /**
     * Calculate feedback priority
     */
    calculatePriority(feedbackData) {
        let priority = 'low';

        // Rating-based priority
        if (feedbackData.rating <= 2) {
            priority = 'high';
        } else if (feedbackData.rating <= 3) {
            priority = 'medium';
        }

        // Category-based priority
        const highPriorityCategories = ['technical_issue', 'accessibility', 'cultural_sensitivity'];
        if (highPriorityCategories.includes(feedbackData.category)) {
            priority = 'high';
        }

        // VIP user priority boost
        if (feedbackData.email && this.isVIPUser(feedbackData.email)) {
            priority = priority === 'low' ? 'medium' : 'high';
        }

        return priority;
    }

    /**
     * Calculate issue priority
     */
    calculateIssuePriority(issueData) {
        let priority = 'medium';

        // Severity-based priority
        const severityPriorityMap = {
            'critical': 'critical',
            'high': 'high',
            'medium': 'medium',
            'low': 'low'
        };

        priority = severityPriorityMap[issueData.severity] || 'medium';

        // Error-based priority boost
        if (issueData.technicalDetails.errorMessages.length > 0) {
            priority = priority === 'low' ? 'medium' : 'high';
        }

        // Assessment-blocking issues are critical
        if (issueData.category === 'assessment_blocking') {
            priority = 'critical';
        }

        return priority;
    }

    /**
     * Generate tags for feedback
     */
    generateTags(feedbackData) {
        const tags = [];

        // Assessment type tags
        if (feedbackData.assessmentType) {
            tags.push(`assessment:${feedbackData.assessmentType}`);
        }

        // Industry tags
        if (feedbackData.industry) {
            tags.push(`industry:${feedbackData.industry}`);
        }

        // Persona tags
        if (feedbackData.persona) {
            tags.push(`persona:${feedbackData.persona}`);
        }

        // Device type tags
        if (feedbackData.browserInfo) {
            if (feedbackData.browserInfo.mobile) {
                tags.push('device:mobile');
            } else {
                tags.push('device:desktop');
            }
        }

        return tags;
    }

    /**
     * Generate tags for issues
     */
    generateIssueTags(issueData) {
        const tags = [];

        // Browser tags
        if (issueData.technicalDetails.browserInfo) {
            const browser = issueData.technicalDetails.browserInfo.name;
            tags.push(`browser:${browser.toLowerCase()}`);
        }

        // Error type tags
        if (issueData.technicalDetails.errorMessages.length > 0) {
            tags.push('has-errors');
        }

        // URL-based tags
        if (issueData.userContext.url) {
            const path = new URL(issueData.userContext.url).pathname;
            if (path.includes('assessment')) {
                tags.push('assessment-related');
            }
        }

        return tags;
    }

    /**
     * Auto-generate additional tags using content analysis
     */
    autoGenerateTags(feedback) {
        const tags = [];
        const message = feedback.message.toLowerCase();

        // Sentiment analysis (basic)
        const positiveWords = ['good', 'great', 'excellent', 'love', 'amazing', 'helpful'];
        const negativeWords = ['bad', 'terrible', 'hate', 'confusing', 'difficult', 'broken'];

        const positiveCount = positiveWords.filter(word => message.includes(word)).length;
        const negativeCount = negativeWords.filter(word => message.includes(word)).length;

        if (positiveCount > negativeCount) {
            tags.push('sentiment:positive');
        } else if (negativeCount > positiveCount) {
            tags.push('sentiment:negative');
        } else {
            tags.push('sentiment:neutral');
        }

        // Feature mentions
        const features = ['assessment', 'curriculum', 'persona', 'industry', 'results'];
        features.forEach(feature => {
            if (message.includes(feature)) {
                tags.push(`mentions:${feature}`);
            }
        });

        return tags;
    }

    /**
     * Send feedback notification to team
     */
    async sendFeedbackNotification(feedback) {
        if (!this.emailTransporter) return;

        const mailOptions = {
            from: this.emailConfig.user,
            to: this.emailConfig.notificationEmail || this.emailConfig.user,
            subject: `[${feedback.priority.toUpperCase()}] New User Feedback - ${feedback.category}`,
            html: this.generateFeedbackNotificationEmail(feedback)
        };

        try {
            await this.emailTransporter.sendMail(mailOptions);
            console.log(`Feedback notification sent for: ${feedback.id}`);
        } catch (error) {
            console.error('Error sending feedback notification:', error);
        }
    }

    /**
     * Send critical issue alert
     */
    async sendCriticalIssueAlert(issue) {
        if (!this.emailTransporter) return;

        const mailOptions = {
            from: this.emailConfig.user,
            to: this.emailConfig.alertEmail || this.emailConfig.user,
            subject: `🚨 CRITICAL ISSUE: ${issue.title}`,
            html: this.generateCriticalIssueEmail(issue)
        };

        try {
            await this.emailTransporter.sendMail(mailOptions);
            console.log(`Critical issue alert sent for: ${issue.id}`);
        } catch (error) {
            console.error('Error sending critical issue alert:', error);
        }
    }

    /**
     * Send feedback acknowledgment to user
     */
    async sendFeedbackAcknowledgment(feedback) {
        if (!this.emailTransporter || !feedback.userContext.email) return;

        const mailOptions = {
            from: this.emailConfig.user,
            to: feedback.userContext.email,
            subject: 'Thank you for your feedback - The Obvious Company',
            html: this.generateFeedbackAcknowledgmentEmail(feedback)
        };

        try {
            await this.emailTransporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending feedback acknowledgment:', error);
        }
    }

    /**
     * Send issue acknowledgment to user
     */
    async sendIssueAcknowledgment(issue) {
        if (!this.emailTransporter || !issue.userContext.email) return;

        const mailOptions = {
            from: this.emailConfig.user,
            to: issue.userContext.email,
            subject: `Issue Report Received - Ticket #${issue.ticketId}`,
            html: this.generateIssueAcknowledgmentEmail(issue)
        };

        try {
            await this.emailTransporter.sendMail(mailOptions);
        } catch (error) {
            console.error('Error sending issue acknowledgment:', error);
        }
    }

    /**
     * Generate feedback notification email HTML
     */
    generateFeedbackNotificationEmail(feedback) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2E5BBA;">New User Feedback</h2>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <strong>Priority:</strong> <span style="color: ${this.getPriorityColor(feedback.priority)}">${feedback.priority.toUpperCase()}</span><br>
                    <strong>Category:</strong> ${feedback.category}<br>
                    <strong>Rating:</strong> ${feedback.rating}/5<br>
                    <strong>Timestamp:</strong> ${feedback.timestamp.toLocaleString()}
                </div>

                <h3>Message:</h3>
                <p style="background: #fff; padding: 15px; border-left: 4px solid #2E5BBA;">${feedback.message}</p>

                <h3>User Context:</h3>
                <ul>
                    <li><strong>Email:</strong> ${feedback.userContext.email || 'Anonymous'}</li>
                    <li><strong>Assessment Type:</strong> ${feedback.userContext.assessmentType || 'N/A'}</li>
                    <li><strong>Industry:</strong> ${feedback.userContext.industry || 'N/A'}</li>
                    <li><strong>URL:</strong> ${feedback.userContext.url || 'N/A'}</li>
                </ul>

                <h3>Tags:</h3>
                <p>${feedback.tags.join(', ')}</p>

                <p><strong>Feedback ID:</strong> ${feedback.id}</p>
            </div>
        `;
    }

    /**
     * Generate critical issue email HTML
     */
    generateCriticalIssueEmail(issue) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #dc2626;">🚨 CRITICAL ISSUE REPORTED</h2>
                
                <div style="background: #fef2f2; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc2626;">
                    <strong>Title:</strong> ${issue.title}<br>
                    <strong>Severity:</strong> ${issue.severity.toUpperCase()}<br>
                    <strong>Category:</strong> ${issue.category}<br>
                    <strong>Timestamp:</strong> ${issue.timestamp.toLocaleString()}
                </div>

                <h3>Description:</h3>
                <p style="background: #fff; padding: 15px; border-left: 4px solid #dc2626;">${issue.description}</p>

                <h3>Steps to Reproduce:</h3>
                <ol>
                    ${issue.stepsToReproduce.map(step => `<li>${step}</li>`).join('')}
                </ol>

                <h3>Technical Details:</h3>
                <ul>
                    <li><strong>User Agent:</strong> ${issue.userContext.userAgent}</li>
                    <li><strong>URL:</strong> ${issue.userContext.url}</li>
                    <li><strong>Error Messages:</strong> ${issue.technicalDetails.errorMessages.join(', ') || 'None'}</li>
                </ul>

                <p><strong>Issue ID:</strong> ${issue.id}</p>
                <p><strong>Ticket ID:</strong> ${issue.ticketId}</p>
            </div>
        `;
    }

    /**
     * Generate feedback acknowledgment email HTML
     */
    generateFeedbackAcknowledgmentEmail(feedback) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2E5BBA;">Thank you for your feedback!</h2>
                
                <p>We've received your feedback and truly appreciate you taking the time to help us improve.</p>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <strong>Your feedback:</strong><br>
                    "${feedback.message}"
                </div>

                <p>Our team will review your feedback and use it to enhance the platform experience. If your feedback requires a direct response, we'll get back to you within 24-48 hours.</p>

                <p>In the meantime, feel free to continue exploring our assessment platform or reach out if you have any questions.</p>

                <p>Best regards,<br>
                The Obvious Company Team</p>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                    Feedback ID: ${feedback.id}<br>
                    Submitted: ${feedback.timestamp.toLocaleString()}
                </p>
            </div>
        `;
    }

    /**
     * Generate issue acknowledgment email HTML
     */
    generateIssueAcknowledgmentEmail(issue) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2E5BBA;">Issue Report Received</h2>
                
                <p>Thank you for reporting this issue. We've received your report and our technical team will investigate.</p>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <strong>Issue:</strong> ${issue.title}<br>
                    <strong>Ticket ID:</strong> #${issue.ticketId}<br>
                    <strong>Priority:</strong> ${issue.priority}<br>
                    <strong>Status:</strong> ${issue.status}
                </div>

                <p>We'll keep you updated on the progress of this issue. You can reference ticket #${issue.ticketId} in any future communications.</p>

                <p>If you encounter any additional issues or have more information to add, please reply to this email.</p>

                <p>Best regards,<br>
                The Obvious Company Technical Team</p>

                <hr style="margin: 20px 0; border: none; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 12px; color: #6b7280;">
                    Issue ID: ${issue.id}<br>
                    Reported: ${issue.timestamp.toLocaleString()}
                </p>
            </div>
        `;
    }

    /**
     * Get priority color for styling
     */
    getPriorityColor(priority) {
        const colors = {
            low: '#10b981',
            medium: '#f59e0b',
            high: '#ef4444',
            critical: '#dc2626'
        };
        return colors[priority] || '#6b7280';
    }

    /**
     * Auto-assign issue based on category
     */
    autoAssignIssue(issue) {
        const assignmentMap = {
            'technical_issue': 'tech-team',
            'assessment_accuracy': 'product-team',
            'user_experience': 'ux-team',
            'content_quality': 'content-team',
            'performance': 'tech-team',
            'accessibility': 'ux-team'
        };

        return assignmentMap[issue.category] || 'general-support';
    }

    /**
     * Create tracking ticket (placeholder for integration with ticketing system)
     */
    async createTrackingTicket(issue) {
        // This would integrate with systems like Jira, Linear, or GitHub Issues
        // For now, generate a simple ticket ID
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `OC-${timestamp}-${random}`.toUpperCase();
    }

    /**
     * Check if user is VIP
     */
    isVIPUser(email) {
        const vipDomains = [
            'safaricom.co.ke',
            'equity.co.ke',
            'kcb.co.ke',
            'co-opbank.co.ke'
        ];
        
        const domain = email.split('@')[1];
        return vipDomains.includes(domain);
    }

    /**
     * Update feedback analytics
     */
    updateFeedbackAnalytics(feedback) {
        // This would integrate with the analytics system
        console.log(`Analytics: Feedback received - ${feedback.category} (${feedback.priority})`);
    }

    /**
     * Update issue analytics
     */
    updateIssueAnalytics(issue) {
        // This would integrate with the analytics system
        console.log(`Analytics: Issue reported - ${issue.category} (${issue.priority})`);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get feedback statistics
     */
    getFeedbackStats(timeRange = '24h') {
        const feedbacks = Array.from(this.feedbackStorage.values());
        const cutoffTime = new Date(Date.now() - this.parseTimeRange(timeRange));
        
        const recentFeedbacks = feedbacks.filter(f => f.timestamp >= cutoffTime);
        
        return {
            total: recentFeedbacks.length,
            byCategory: this.groupBy(recentFeedbacks, 'category'),
            byPriority: this.groupBy(recentFeedbacks, 'priority'),
            averageRating: this.calculateAverageRating(recentFeedbacks),
            sentimentDistribution: this.getSentimentDistribution(recentFeedbacks)
        };
    }

    /**
     * Get issue statistics
     */
    getIssueStats(timeRange = '24h') {
        const issues = Array.from(this.issueStorage.values());
        const cutoffTime = new Date(Date.now() - this.parseTimeRange(timeRange));
        
        const recentIssues = issues.filter(i => i.timestamp >= cutoffTime);
        
        return {
            total: recentIssues.length,
            byCategory: this.groupBy(recentIssues, 'category'),
            byPriority: this.groupBy(recentIssues, 'priority'),
            byStatus: this.groupBy(recentIssues, 'status'),
            criticalIssues: recentIssues.filter(i => i.priority === 'critical').length
        };
    }

    /**
     * Helper methods
     */
    parseTimeRange(timeRange) {
        const units = {
            'h': 60 * 60 * 1000,
            'd': 24 * 60 * 60 * 1000,
            'w': 7 * 24 * 60 * 60 * 1000
        };
        
        const match = timeRange.match(/^(\d+)([hdw])$/);
        if (match) {
            return parseInt(match[1]) * units[match[2]];
        }
        
        return 24 * 60 * 60 * 1000; // Default to 24 hours
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = (groups[group] || 0) + 1;
            return groups;
        }, {});
    }

    calculateAverageRating(feedbacks) {
        const ratingsWithValues = feedbacks.filter(f => f.rating);
        if (ratingsWithValues.length === 0) return 0;
        
        const sum = ratingsWithValues.reduce((acc, f) => acc + f.rating, 0);
        return (sum / ratingsWithValues.length).toFixed(2);
    }

    getSentimentDistribution(feedbacks) {
        const sentiments = feedbacks.map(f => {
            const sentimentTag = f.tags.find(tag => tag.startsWith('sentiment:'));
            return sentimentTag ? sentimentTag.split(':')[1] : 'neutral';
        });
        
        return this.groupBy(sentiments.map(s => ({ sentiment: s })), 'sentiment');
    }
}

module.exports = { FeedbackSystem };