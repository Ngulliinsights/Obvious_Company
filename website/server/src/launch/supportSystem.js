/**
 * Post-Launch Support and Maintenance System
 * Handles ongoing platform support, maintenance procedures, and user assistance
 */

// Remove circular dependencies - these will be injected if needed

class SupportSystem {
    constructor(config = {}) {
        this.config = {
            supportEmail: config.supportEmail || 'support@theobviouscompany.com',
            escalationEmail: config.escalationEmail || 'tech@theobviouscompany.com',
            responseTimeTargets: {
                critical: 1, // 1 hour
                high: 4, // 4 hours
                medium: 24, // 24 hours
                low: 72 // 72 hours
            },
            maintenanceWindow: {
                day: 'Sunday',
                startHour: 2, // 2 AM
                durationHours: 4
            },
            ...config
        };

        this.supportTickets = new Map();
        this.maintenanceTasks = new Map();
        this.knowledgeBase = new Map();
        this.automatedResponses = new Map();
        
        // Initialize without circular dependencies
        this.feedbackSystem = null;
        this.performanceMonitor = null;
        
        this.initializeSupportSystem();
    }

    /**
     * Initialize support system
     */
    initializeSupportSystem() {
        this.setupKnowledgeBase();
        this.setupAutomatedResponses();
        this.scheduleMaintenanceTasks();
        this.startSupportMonitoring();
        
        console.log('Support system initialized');
    }

    /**
     * Setup knowledge base with common issues and solutions
     */
    setupKnowledgeBase() {
        const knowledgeBaseEntries = [
            {
                id: 'assessment-not-loading',
                title: 'Assessment Not Loading',
                category: 'technical',
                keywords: ['assessment', 'loading', 'blank', 'stuck'],
                solution: `
                    <h3>Assessment Not Loading</h3>
                    <p>If the assessment page is not loading properly, try these steps:</p>
                    <ol>
                        <li>Refresh the page (Ctrl+F5 or Cmd+Shift+R)</li>
                        <li>Clear your browser cache and cookies</li>
                        <li>Try a different browser (Chrome, Firefox, Safari)</li>
                        <li>Disable browser extensions temporarily</li>
                        <li>Check your internet connection</li>
                    </ol>
                    <p>If the issue persists, please contact support with your browser information.</p>
                `,
                priority: 'high',
                lastUpdated: new Date()
            },
            {
                id: 'assessment-results-missing',
                title: 'Assessment Results Not Received',
                category: 'assessment',
                keywords: ['results', 'email', 'missing', 'completed'],
                solution: `
                    <h3>Missing Assessment Results</h3>
                    <p>If you completed an assessment but didn't receive your results:</p>
                    <ol>
                        <li>Check your spam/junk folder</li>
                        <li>Verify the email address you provided</li>
                        <li>Wait up to 15 minutes for email delivery</li>
                        <li>Try completing the assessment again</li>
                    </ol>
                    <p>Contact support with your assessment completion time and email address.</p>
                `,
                priority: 'medium',
                lastUpdated: new Date()
            },
            {
                id: 'persona-classification-questions',
                title: 'Understanding Your Persona Classification',
                category: 'assessment',
                keywords: ['persona', 'classification', 'results', 'meaning'],
                solution: `
                    <h3>Understanding Your Strategic Persona</h3>
                    <p>Your persona classification represents your strategic position:</p>
                    <ul>
                        <li><strong>Strategic Architect:</strong> C-suite executive with enterprise-wide authority</li>
                        <li><strong>Strategic Catalyst:</strong> Senior leader with significant influence</li>
                        <li><strong>Strategic Contributor:</strong> Department leader with tactical focus</li>
                        <li><strong>Strategic Explorer:</strong> Emerging leader with development potential</li>
                        <li><strong>Strategic Observer:</strong> Functional specialist seeking insights</li>
                    </ul>
                    <p>Each persona receives customized recommendations and service suggestions.</p>
                `,
                priority: 'low',
                lastUpdated: new Date()
            },
            {
                id: 'consultation-scheduling',
                title: 'Scheduling a Strategic Consultation',
                category: 'services',
                keywords: ['consultation', 'schedule', 'booking', 'calendar'],
                solution: `
                    <h3>Scheduling Your Consultation</h3>
                    <p>To schedule a strategic consultation:</p>
                    <ol>
                        <li>Complete the assessment to receive personalized recommendations</li>
                        <li>Click the "Schedule Consultation" button in your results email</li>
                        <li>Choose from available time slots in our calendar</li>
                        <li>Provide your contact information and consultation preferences</li>
                        <li>Receive confirmation email with meeting details</li>
                    </ol>
                    <p>Consultations are typically 45-60 minutes and conducted via video call.</p>
                `,
                priority: 'medium',
                lastUpdated: new Date()
            },
            {
                id: 'mobile-compatibility',
                title: 'Mobile Device Compatibility',
                category: 'technical',
                keywords: ['mobile', 'phone', 'tablet', 'responsive'],
                solution: `
                    <h3>Using the Platform on Mobile Devices</h3>
                    <p>Our platform is optimized for mobile devices:</p>
                    <ul>
                        <li>Works on iOS (Safari) and Android (Chrome) browsers</li>
                        <li>Responsive design adapts to screen size</li>
                        <li>Touch-friendly interface for assessments</li>
                        <li>Offline capability for assessment completion</li>
                    </ul>
                    <p>For best experience, use the latest browser version and stable internet connection.</p>
                `,
                priority: 'low',
                lastUpdated: new Date()
            },
            {
                id: 'data-privacy-security',
                title: 'Data Privacy and Security',
                category: 'privacy',
                keywords: ['privacy', 'security', 'data', 'gdpr', 'confidential'],
                solution: `
                    <h3>Your Data Privacy and Security</h3>
                    <p>We take your privacy seriously:</p>
                    <ul>
                        <li>All data is encrypted in transit and at rest</li>
                        <li>GDPR compliant data handling procedures</li>
                        <li>No data sharing with third parties without consent</li>
                        <li>Right to data deletion upon request</li>
                        <li>Regular security audits and updates</li>
                    </ul>
                    <p>View our full Privacy Policy for detailed information.</p>
                `,
                priority: 'high',
                lastUpdated: new Date()
            }
        ];

        knowledgeBaseEntries.forEach(entry => {
            this.knowledgeBase.set(entry.id, entry);
        });
    }

    /**
     * Setup automated responses for common inquiries
     */
    setupAutomatedResponses() {
        const automatedResponses = [
            {
                trigger: ['assessment', 'not', 'working'],
                response: {
                    subject: 'Assessment Technical Support',
                    template: 'assessment-technical-support',
                    knowledgeBaseId: 'assessment-not-loading'
                }
            },
            {
                trigger: ['results', 'missing', 'email'],
                response: {
                    subject: 'Assessment Results Support',
                    template: 'assessment-results-support',
                    knowledgeBaseId: 'assessment-results-missing'
                }
            },
            {
                trigger: ['consultation', 'schedule', 'booking'],
                response: {
                    subject: 'Consultation Scheduling Information',
                    template: 'consultation-scheduling',
                    knowledgeBaseId: 'consultation-scheduling'
                }
            },
            {
                trigger: ['persona', 'classification', 'meaning'],
                response: {
                    subject: 'Understanding Your Strategic Persona',
                    template: 'persona-explanation',
                    knowledgeBaseId: 'persona-classification-questions'
                }
            }
        ];

        automatedResponses.forEach((response, index) => {
            this.automatedResponses.set(`auto_${index}`, response);
        });
    }

    /**
     * Create support ticket
     */
    async createSupportTicket(ticketData) {
        const ticket = {
            id: this.generateTicketId(),
            timestamp: new Date(),
            status: 'open',
            priority: this.calculateTicketPriority(ticketData),
            category: ticketData.category || 'general',
            subject: ticketData.subject,
            description: ticketData.description,
            userInfo: {
                email: ticketData.email,
                name: ticketData.name,
                company: ticketData.company,
                phone: ticketData.phone
            },
            technicalInfo: {
                userAgent: ticketData.userAgent,
                url: ticketData.url,
                browserInfo: ticketData.browserInfo,
                errorMessages: ticketData.errorMessages || []
            },
            assignee: null,
            tags: this.generateTicketTags(ticketData),
            responses: [],
            escalated: false,
            responseDeadline: this.calculateResponseDeadline(this.calculateTicketPriority(ticketData)),
            resolutionTime: null
        };

        // Store ticket
        this.supportTickets.set(ticket.id, ticket);

        // Auto-assign ticket
        ticket.assignee = this.autoAssignTicket(ticket);

        // Check for automated response
        const automatedResponse = this.findAutomatedResponse(ticketData);
        if (automatedResponse) {
            await this.sendAutomatedResponse(ticket, automatedResponse);
        }

        // Send ticket confirmation
        await this.sendTicketConfirmation(ticket);

        // Alert team for high-priority tickets
        if (ticket.priority === 'critical' || ticket.priority === 'high') {
            await this.alertSupportTeam(ticket);
        }

        console.log(`Support ticket created: ${ticket.id} (${ticket.priority})`);

        return {
            success: true,
            ticketId: ticket.id,
            priority: ticket.priority,
            responseDeadline: ticket.responseDeadline,
            message: 'Support ticket created successfully. You will receive updates via email.'
        };
    }

    /**
     * Update support ticket
     */
    async updateSupportTicket(ticketId, updates) {
        const ticket = this.supportTickets.get(ticketId);
        
        if (!ticket) {
            throw new Error(`Support ticket ${ticketId} not found`);
        }

        // Update ticket properties
        Object.assign(ticket, updates, {
            lastUpdated: new Date()
        });

        // Add response if provided
        if (updates.response) {
            ticket.responses.push({
                timestamp: new Date(),
                author: updates.responseAuthor || 'support',
                message: updates.response,
                type: updates.responseType || 'internal'
            });

            // Send response to user if it's a customer-facing response
            if (updates.responseType === 'customer') {
                await this.sendTicketResponse(ticket, updates.response);
            }
        }

        // Check if ticket should be escalated
        if (this.shouldEscalateTicket(ticket)) {
            await this.escalateTicket(ticket);
        }

        // Mark as resolved if status changed to resolved
        if (updates.status === 'resolved' && !ticket.resolutionTime) {
            ticket.resolutionTime = new Date();
            await this.sendTicketResolution(ticket);
        }

        console.log(`Support ticket updated: ${ticketId}`);

        return ticket;
    }

    /**
     * Calculate ticket priority
     */
    calculateTicketPriority(ticketData) {
        let priority = 'medium';

        // Category-based priority
        const highPriorityCategories = ['technical', 'assessment', 'payment'];
        if (highPriorityCategories.includes(ticketData.category)) {
            priority = 'high';
        }

        // Error-based priority
        if (ticketData.errorMessages && ticketData.errorMessages.length > 0) {
            priority = 'high';
        }

        // VIP user priority boost
        if (ticketData.email && this.isVIPUser(ticketData.email)) {
            priority = priority === 'medium' ? 'high' : 'critical';
        }

        // Keyword-based priority
        const criticalKeywords = ['critical', 'urgent', 'broken', 'down', 'error'];
        const description = (ticketData.description || '').toLowerCase();
        if (criticalKeywords.some(keyword => description.includes(keyword))) {
            priority = 'critical';
        }

        return priority;
    }

    /**
     * Calculate response deadline
     */
    calculateResponseDeadline(priority) {
        const hoursToAdd = this.config.responseTimeTargets[priority] || 24;
        return new Date(Date.now() + hoursToAdd * 60 * 60 * 1000);
    }

    /**
     * Generate ticket tags
     */
    generateTicketTags(ticketData) {
        const tags = [];

        // Category tag
        if (ticketData.category) {
            tags.push(`category:${ticketData.category}`);
        }

        // Browser tag
        if (ticketData.browserInfo && ticketData.browserInfo.name) {
            tags.push(`browser:${ticketData.browserInfo.name.toLowerCase()}`);
        }

        // URL-based tags
        if (ticketData.url) {
            if (ticketData.url.includes('assessment')) {
                tags.push('assessment-related');
            }
            if (ticketData.url.includes('results')) {
                tags.push('results-related');
            }
        }

        // Error tags
        if (ticketData.errorMessages && ticketData.errorMessages.length > 0) {
            tags.push('has-errors');
        }

        return tags;
    }

    /**
     * Find automated response for ticket
     */
    findAutomatedResponse(ticketData) {
        const description = (ticketData.description || '').toLowerCase();
        const subject = (ticketData.subject || '').toLowerCase();
        const searchText = `${subject} ${description}`;

        for (const [id, response] of this.automatedResponses.entries()) {
            const triggerMatch = response.trigger.every(keyword => 
                searchText.includes(keyword.toLowerCase())
            );

            if (triggerMatch) {
                return response.response;
            }
        }

        return null;
    }

    /**
     * Send automated response
     */
    async sendAutomatedResponse(ticket, automatedResponse) {
        const knowledgeBaseEntry = this.knowledgeBase.get(automatedResponse.knowledgeBaseId);
        
        if (!knowledgeBaseEntry) {
            console.warn(`Knowledge base entry not found: ${automatedResponse.knowledgeBaseId}`);
            return;
        }

        const emailContent = this.generateAutomatedResponseEmail(ticket, knowledgeBaseEntry);
        
        // This would integrate with email system
        console.log(`Sending automated response for ticket ${ticket.id}`);
        
        // Add automated response to ticket
        ticket.responses.push({
            timestamp: new Date(),
            author: 'system',
            message: 'Automated response sent with knowledge base article',
            type: 'automated',
            knowledgeBaseId: automatedResponse.knowledgeBaseId
        });
    }

    /**
     * Send ticket confirmation
     */
    async sendTicketConfirmation(ticket) {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px;">
                <h2 style="color: #2E5BBA;">Support Ticket Created</h2>
                
                <p>Thank you for contacting The Obvious Company support. We've received your request and will respond within our target timeframe.</p>
                
                <div style="background: #f8fafc; padding: 15px; border-radius: 5px; margin: 15px 0;">
                    <strong>Ticket ID:</strong> #${ticket.id}<br>
                    <strong>Priority:</strong> ${ticket.priority}<br>
                    <strong>Category:</strong> ${ticket.category}<br>
                    <strong>Target Response Time:</strong> ${ticket.responseDeadline.toLocaleString()}
                </div>

                <h3>Your Request:</h3>
                <p style="background: #fff; padding: 15px; border-left: 4px solid #2E5BBA;">${ticket.description}</p>

                <p>We'll keep you updated on the progress of your request. Please reference ticket #${ticket.id} in any future communications.</p>

                <p>Best regards,<br>
                The Obvious Company Support Team</p>
            </div>
        `;

        // This would integrate with email system
        console.log(`Sending ticket confirmation for ${ticket.id} to ${ticket.userInfo.email}`);
    }

    /**
     * Alert support team for high-priority tickets
     */
    async alertSupportTeam(ticket) {
        const alertMessage = `
            🚨 ${ticket.priority.toUpperCase()} PRIORITY SUPPORT TICKET
            
            Ticket ID: #${ticket.id}
            From: ${ticket.userInfo.name} (${ticket.userInfo.email})
            Subject: ${ticket.subject}
            Category: ${ticket.category}
            
            Description: ${ticket.description}
            
            Response Deadline: ${ticket.responseDeadline.toLocaleString()}
        `;

        // This would send to support team via email, Slack, etc.
        console.log(`SUPPORT TEAM ALERT: ${alertMessage}`);
    }

    /**
     * Check if ticket should be escalated
     */
    shouldEscalateTicket(ticket) {
        const now = new Date();
        
        // Escalate if past response deadline and not yet escalated
        if (now > ticket.responseDeadline && !ticket.escalated && ticket.status === 'open') {
            return true;
        }

        // Escalate critical tickets after 30 minutes if no response
        if (ticket.priority === 'critical' && !ticket.escalated) {
            const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
            if (ticket.timestamp < thirtyMinutesAgo && ticket.responses.length === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Escalate ticket
     */
    async escalateTicket(ticket) {
        ticket.escalated = true;
        ticket.priority = ticket.priority === 'low' ? 'medium' : 
                         ticket.priority === 'medium' ? 'high' : 'critical';

        const escalationMessage = `
            🔥 ESCALATED SUPPORT TICKET
            
            Ticket ID: #${ticket.id}
            Original Priority: ${ticket.priority}
            New Priority: ${ticket.priority}
            
            Reason: Response deadline exceeded
            Original Deadline: ${ticket.responseDeadline.toLocaleString()}
            
            Customer: ${ticket.userInfo.name} (${ticket.userInfo.email})
            Subject: ${ticket.subject}
            
            IMMEDIATE ATTENTION REQUIRED
        `;

        // Send to escalation email
        console.log(`ESCALATION ALERT: ${escalationMessage}`);
        
        // Update response deadline
        ticket.responseDeadline = this.calculateResponseDeadline(ticket.priority);
    }

    /**
     * Schedule maintenance tasks
     */
    scheduleMaintenanceTasks() {
        const maintenanceTasks = [
            {
                id: 'database-cleanup',
                name: 'Database Cleanup',
                description: 'Clean up old session data and temporary files',
                frequency: 'weekly',
                estimatedDuration: 30, // minutes
                priority: 'medium',
                procedure: this.performDatabaseCleanup.bind(this)
            },
            {
                id: 'performance-optimization',
                name: 'Performance Optimization',
                description: 'Analyze and optimize system performance',
                frequency: 'weekly',
                estimatedDuration: 60,
                priority: 'high',
                procedure: this.performPerformanceOptimization.bind(this)
            },
            {
                id: 'security-updates',
                name: 'Security Updates',
                description: 'Apply security patches and updates',
                frequency: 'weekly',
                estimatedDuration: 45,
                priority: 'critical',
                procedure: this.performSecurityUpdates.bind(this)
            },
            {
                id: 'backup-verification',
                name: 'Backup Verification',
                description: 'Verify backup integrity and restore procedures',
                frequency: 'weekly',
                estimatedDuration: 20,
                priority: 'high',
                procedure: this.performBackupVerification.bind(this)
            },
            {
                id: 'analytics-review',
                name: 'Analytics Review',
                description: 'Review performance metrics and user analytics',
                frequency: 'daily',
                estimatedDuration: 15,
                priority: 'medium',
                procedure: this.performAnalyticsReview.bind(this)
            }
        ];

        maintenanceTasks.forEach(task => {
            this.maintenanceTasks.set(task.id, {
                ...task,
                lastRun: null,
                nextRun: this.calculateNextMaintenanceRun(task.frequency),
                status: 'scheduled'
            });
        });

        // Schedule maintenance execution
        setInterval(() => {
            this.runScheduledMaintenance();
        }, 60 * 60 * 1000); // Check every hour
    }

    /**
     * Run scheduled maintenance tasks
     */
    async runScheduledMaintenance() {
        const now = new Date();
        
        for (const [taskId, task] of this.maintenanceTasks.entries()) {
            if (now >= task.nextRun && task.status === 'scheduled') {
                await this.executeMaintenance(taskId);
            }
        }
    }

    /**
     * Execute maintenance task
     */
    async executeMaintenance(taskId) {
        const task = this.maintenanceTasks.get(taskId);
        
        if (!task) {
            console.error(`Maintenance task not found: ${taskId}`);
            return;
        }

        console.log(`Starting maintenance task: ${task.name}`);
        
        task.status = 'running';
        task.startTime = new Date();

        try {
            await task.procedure();
            
            task.status = 'completed';
            task.lastRun = new Date();
            task.nextRun = this.calculateNextMaintenanceRun(task.frequency);
            
            console.log(`Completed maintenance task: ${task.name}`);
            
        } catch (error) {
            console.error(`Maintenance task failed: ${task.name}`, error);
            
            task.status = 'failed';
            task.error = error.message;
            
            // Alert team about failed maintenance
            await this.alertMaintenanceFailure(task, error);
        }
    }

    /**
     * Maintenance procedures
     */
    async performDatabaseCleanup() {
        console.log('Performing database cleanup...');
        // This would clean up old sessions, temporary data, etc.
        // Placeholder implementation
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async performPerformanceOptimization() {
        console.log('Performing performance optimization...');
        // This would analyze performance metrics and optimize
        // Placeholder implementation
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async performSecurityUpdates() {
        console.log('Performing security updates...');
        // This would check for and apply security updates
        // Placeholder implementation
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    async performBackupVerification() {
        console.log('Performing backup verification...');
        // This would verify backup integrity
        // Placeholder implementation
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async performAnalyticsReview() {
        console.log('Performing analytics review...');
        // This would review performance metrics
        const dashboardData = this.performanceMonitor.getDashboardData('24h');
        console.log('Analytics summary:', {
            systemHealth: dashboardData.systemMetrics,
            userExperience: dashboardData.userExperience,
            activeAlerts: dashboardData.alerts.length
        });
    }

    /**
     * Calculate next maintenance run time
     */
    calculateNextMaintenanceRun(frequency) {
        const now = new Date();
        
        switch (frequency) {
            case 'daily':
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
            case 'weekly':
                // Schedule for next maintenance window
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                nextWeek.setHours(this.config.maintenanceWindow.startHour, 0, 0, 0);
                return nextWeek;
            case 'monthly':
                const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
                nextMonth.setHours(this.config.maintenanceWindow.startHour, 0, 0, 0);
                return nextMonth;
            default:
                return new Date(now.getTime() + 24 * 60 * 60 * 1000);
        }
    }

    /**
     * Start support monitoring
     */
    startSupportMonitoring() {
        // Monitor ticket response times
        setInterval(() => {
            this.monitorTicketResponseTimes();
        }, 15 * 60 * 1000); // Every 15 minutes

        // Monitor system health
        setInterval(() => {
            this.monitorSystemHealth();
        }, 5 * 60 * 1000); // Every 5 minutes

        console.log('Support monitoring started');
    }

    /**
     * Monitor ticket response times
     */
    monitorTicketResponseTimes() {
        const now = new Date();
        
        for (const [ticketId, ticket] of this.supportTickets.entries()) {
            if (ticket.status === 'open' && now > ticket.responseDeadline && !ticket.escalated) {
                this.escalateTicket(ticket);
            }
        }
    }

    /**
     * Monitor system health
     */
    monitorSystemHealth() {
        const dashboardData = this.performanceMonitor.getDashboardData('1h');
        
        // Check for critical alerts
        const criticalAlerts = dashboardData.alerts.filter(alert => alert.severity === 'critical');
        
        if (criticalAlerts.length > 0) {
            criticalAlerts.forEach(alert => {
                this.createSystemHealthTicket(alert);
            });
        }
    }

    /**
     * Create system health ticket for critical alerts
     */
    async createSystemHealthTicket(alert) {
        const ticketData = {
            subject: `System Alert: ${alert.type}`,
            description: `Critical system alert detected: ${JSON.stringify(alert.data)}`,
            category: 'system',
            priority: 'critical',
            email: this.config.escalationEmail,
            name: 'System Monitor',
            technicalInfo: {
                alertType: alert.type,
                alertData: alert.data,
                timestamp: alert.timestamp
            }
        };

        await this.createSupportTicket(ticketData);
    }

    /**
     * Get support dashboard data
     */
    getSupportDashboard() {
        const tickets = Array.from(this.supportTickets.values());
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        const recentTickets = tickets.filter(t => t.timestamp > last24Hours);
        const openTickets = tickets.filter(t => t.status === 'open');
        const overdueTickets = openTickets.filter(t => now > t.responseDeadline);
        
        return {
            ticketStats: {
                total: tickets.length,
                open: openTickets.length,
                overdue: overdueTickets.length,
                recent: recentTickets.length
            },
            priorityBreakdown: this.groupBy(openTickets, 'priority'),
            categoryBreakdown: this.groupBy(recentTickets, 'category'),
            responseTimeStats: this.calculateResponseTimeStats(tickets),
            maintenanceStatus: this.getMaintenanceStatus(),
            systemHealth: this.performanceMonitor.getDashboardData('1h')
        };
    }

    /**
     * Helper methods
     */
    generateTicketId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `SUP-${timestamp}-${random}`.toUpperCase();
    }

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

    autoAssignTicket(ticket) {
        const assignmentMap = {
            'technical': 'tech-team',
            'assessment': 'product-team',
            'billing': 'billing-team',
            'general': 'support-team'
        };

        return assignmentMap[ticket.category] || 'support-team';
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = (groups[group] || 0) + 1;
            return groups;
        }, {});
    }

    calculateResponseTimeStats(tickets) {
        const resolvedTickets = tickets.filter(t => t.status === 'resolved' && t.resolutionTime);
        
        if (resolvedTickets.length === 0) {
            return { avgResponseTime: 0, avgResolutionTime: 0 };
        }

        const responseTimes = resolvedTickets.map(t => {
            const firstResponse = t.responses.find(r => r.type === 'customer');
            return firstResponse ? firstResponse.timestamp - t.timestamp : 0;
        });

        const resolutionTimes = resolvedTickets.map(t => t.resolutionTime - t.timestamp);

        return {
            avgResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
            avgResolutionTime: resolutionTimes.reduce((sum, time) => sum + time, 0) / resolutionTimes.length
        };
    }

    getMaintenanceStatus() {
        const tasks = Array.from(this.maintenanceTasks.values());
        
        return {
            scheduled: tasks.filter(t => t.status === 'scheduled').length,
            running: tasks.filter(t => t.status === 'running').length,
            completed: tasks.filter(t => t.status === 'completed').length,
            failed: tasks.filter(t => t.status === 'failed').length,
            nextMaintenance: Math.min(...tasks.map(t => t.nextRun.getTime()))
        };
    }
}

module.exports = { SupportSystem };