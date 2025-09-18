---
title: "Websiteintegration"
type: "presentation"
audience: "executives"
version: "v2025.js"
dependencies:
  - "" # Add dependencies here
related_docs:
  - "" # Add related documents here
supersedes: "" # Add superseded document here if applicable
---

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteIntegration = void 0;
const app_1 = require("../app");
class WebsiteIntegration {
    constructor(mainApp) {
        this.mainApp = mainApp;
        this.assessmentApp = new app_1.AssessmentApp();
    }
    async initialize() {
        await this.assessmentApp.initialize();
        this.mountAssessmentRoutes();
        this.addAssessmentMiddleware();
        console.log('Assessment platform integrated with main website');
    }
    mountAssessmentRoutes() {
        this.mainApp.use('/assessment', this.assessmentApp.getApp());
        this.addMainAppRoutes();
    }
    addMainAppRoutes() {
        this.mainApp.get('/assessment', (_req, res) => {
            res.sendFile('assessment.html', { root: 'website' });
        });
        this.mainApp.post('/api/assessment-integration', async (req, res) => {
            try {
                const { sessionId, userEmail, results } = req.body;
                const assessmentData = {
                    assessmentType: 'strategic-readiness',
                    responses: { email: userEmail },
                    results: results,
                    timestamp: new Date().toISOString(),
                    sessionId: sessionId
                };
                const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/assessment-results`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(assessmentData)
                });
                if (response.ok) {
                    res.json({ success: true, message: 'Assessment results integrated successfully' });
                }
                else {
                    throw new Error('Failed to integrate with main website');
                }
            }
            catch (error) {
                console.error('Assessment integration error:', error);
                res.status(500).json({ success: false, message: 'Integration failed' });
            }
        });
    }
    addAssessmentMiddleware() {
        this.mainApp.use('/assessment/*', (req, _res, next) => {
            _res.header('Access-Control-Allow-Origin', '*');
            _res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            _res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
            if (req.method === 'OPTIONS') {
                _res.sendStatus(200);
            }
            else {
                next();
            }
        });
        this.mainApp.use('/assessment/*', (req, _res, next) => {
            console.log(`Assessment Platform: ${req.method} ${req.path}`);
            next();
        });
    }
    getAssessmentApp() {
        return this.assessmentApp;
    }
}
exports.WebsiteIntegration = WebsiteIntegration;
//# sourceMappingURL=websiteIntegration.js.map