const { spawn } = require('child_process');
const path = require('path');

/**
 * Assessment Platform Integration for Main Website
 */
class AssessmentIntegration {
    constructor() {
        this.assessmentProcess = null;
        this.isRunning = false;
    }

    async startAssessmentPlatform() {
        if (this.isRunning) {
            console.log('Assessment platform already running');
            return;
        }

        try {
            const assessmentPath = path.join(__dirname, '..', 'assessment');
            
            // Check if assessment platform is built
            const fs = require('fs');
            if (!fs.existsSync(path.join(assessmentPath, 'dist'))) {
                console.log('Building assessment platform...');
                await this.buildAssessmentPlatform();
            }

            // Start the assessment platform as a child process
            this.assessmentProcess = spawn('node', ['dist/server.js'], {
                cwd: assessmentPath,
                stdio: 'inherit',
                env: {
                    ...process.env,
                    ASSESSMENT_PORT: process.env.ASSESSMENT_PORT || '3001',
                    NODE_ENV: process.env.NODE_ENV || 'development'
                }
            });

            this.assessmentProcess.on('error', (error) => {
                console.error('Assessment platform error:', error);
                this.isRunning = false;
            });

            this.assessmentProcess.on('exit', (code) => {
                console.log(`Assessment platform exited with code ${code}`);
                this.isRunning = false;
            });

            // Wait a moment for the process to start
            await new Promise(resolve => setTimeout(resolve, 2000));
            this.isRunning = true;
            
            console.log('✅ Assessment platform started successfully');
        } catch (error) {
            console.error('Failed to start assessment platform:', error);
            throw error;
        }
    }

    async buildAssessmentPlatform() {
        return new Promise((resolve, reject) => {
            const assessmentPath = path.join(__dirname, '..', 'assessment');
            const buildProcess = spawn('npm', ['run', 'build'], {
                cwd: assessmentPath,
                stdio: 'inherit'
            });

            buildProcess.on('error', reject);
            buildProcess.on('exit', (code) => {
                if (code === 0) {
                    resolve();
                } else {
                    reject(new Error(`Build failed with code ${code}`));
                }
            });
        });
    }

    async stopAssessmentPlatform() {
        if (this.assessmentProcess && this.isRunning) {
            this.assessmentProcess.kill('SIGTERM');
            this.isRunning = false;
            console.log('Assessment platform stopped');
        }
    }

    setupProxyRoutes(app) {
        const { createProxyMiddleware } = require('http-proxy-middleware');
        
        // Proxy assessment API requests to the assessment platform
        const assessmentProxy = createProxyMiddleware({
            target: `http://localhost:${process.env.ASSESSMENT_PORT || '3001'}`,
            changeOrigin: true,
            pathRewrite: {
                '^/assessment/api': '/api'
            },
            onError: (err, req, res) => {
                console.error('Assessment proxy error:', err);
                res.status(503).json({
                    success: false,
                    message: 'Assessment platform temporarily unavailable'
                });
            }
        });

        // Mount the proxy middleware
        app.use('/assessment/api', assessmentProxy);
        
        // Serve assessment platform static files
        app.use('/assessment', (req, res, next) => {
            // If it's an API request, let the proxy handle it
            if (req.path.startsWith('/api')) {
                return next();
            }
            
            // For the main assessment page, serve our custom HTML
            if (req.path === '/' || req.path === '') {
                return res.sendFile(path.join(__dirname, '..', 'assessment.html'));
            }
            
            // For other static files, proxy to assessment platform
            assessmentProxy(req, res, next);
        });

        console.log('Assessment platform proxy routes configured');
    }

    async healthCheck() {
        if (!this.isRunning) {
            return false;
        }

        try {
            const response = await fetch(`http://localhost:${process.env.ASSESSMENT_PORT || '3001'}/api/health`);
            return response.ok;
        } catch (error) {
            console.error('Assessment platform health check failed:', error);
            return false;
        }
    }
}

module.exports = AssessmentIntegration;