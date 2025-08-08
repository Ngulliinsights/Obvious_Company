import express from 'express';
import { AssessmentApp } from '../app';

/**
 * Integration module to connect the assessment platform with the main website
 */
export class WebsiteIntegration {
  private assessmentApp: AssessmentApp;
  private mainApp: express.Application;

  constructor(mainApp: express.Application) {
    this.mainApp = mainApp;
    this.assessmentApp = new AssessmentApp();
  }

  async initialize(): Promise<void> {
    // Initialize the assessment platform
    await this.assessmentApp.initialize();

    // Mount assessment routes on the main app
    this.mountAssessmentRoutes();

    // Add assessment-specific middleware
    this.addAssessmentMiddleware();

    console.log('Assessment platform integrated with main website');
  }

  private mountAssessmentRoutes(): void {
    // Mount the assessment app under /assessment path
    this.mainApp.use('/assessment', this.assessmentApp.getApp());

    // Add assessment-specific routes to main app
    this.addMainAppRoutes();
  }

  private addMainAppRoutes(): void {
    // Assessment landing page route
    this.mainApp.get('/assessment', (_req, res) => {
      res.sendFile('assessment.html', { root: 'website' });
    });

    // Assessment results integration with main contact system
    this.mainApp.post('/api/assessment-integration', async (req, res) => {
      try {
        const { sessionId, userEmail, results } = req.body;

        // Forward to main website's assessment results handler
        const assessmentData = {
          assessmentType: 'strategic-readiness',
          responses: { email: userEmail },
          results: results,
          timestamp: new Date().toISOString(),
          sessionId: sessionId
        };

        // This will trigger the existing email nurture sequence
        const response = await fetch(`http://localhost:${process.env.PORT || 3000}/api/assessment-results`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(assessmentData)
        });

        if (response.ok) {
          res.json({ success: true, message: 'Assessment results integrated successfully' });
        } else {
          throw new Error('Failed to integrate with main website');
        }
      } catch (error) {
        console.error('Assessment integration error:', error);
        res.status(500).json({ success: false, message: 'Integration failed' });
      }
    });
  }

  private addAssessmentMiddleware(): void {
    // Add CORS headers specifically for assessment platform
    this.mainApp.use('/assessment/*', (req, _res, next) => {
      _res.header('Access-Control-Allow-Origin', '*');
      _res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      _res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      
      if (req.method === 'OPTIONS') {
        _res.sendStatus(200);
      } else {
        next();
      }
    });

    // Add assessment-specific logging
    this.mainApp.use('/assessment/*', (req, _res, next) => {
      console.log(`Assessment Platform: ${req.method} ${req.path}`);
      next();
    });
  }

  getAssessmentApp(): AssessmentApp {
    return this.assessmentApp;
  }
}