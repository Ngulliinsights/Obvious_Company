/**
 * Assessment Integration Module
 * Handles communication between frontend and assessment API
 */

class AssessmentIntegration {
    constructor() {
        this.baseUrl = '/api/assessment';
        this.currentSession = null;
        this.currentQuestion = 0;
        this.responses = [];
        this.startTime = null;
        
        this.init();
    }
    
    init() {
        // Initialize assessment integration
        this.setupEventListeners();
        this.checkForExistingSession();
        console.log('Assessment integration initialized');
    }
    
    setupEventListeners() {
        // Listen for assessment start events
        document.addEventListener('startAssessment', (event) => {
            this.startAssessment(event.detail);
        });
        
        // Listen for response submissions
        document.addEventListener('submitResponse', (event) => {
            this.submitResponse(event.detail);
        });
        
        // Listen for assessment completion
        document.addEventListener('completeAssessment', (event) => {
            this.completeAssessment();
        });
    }
    
    checkForExistingSession() {
        // Check if there's an existing session in localStorage
        const savedSession = localStorage.getItem('assessmentSession');
        if (savedSession) {
            try {
                this.currentSession = JSON.parse(savedSession);
                console.log('Restored assessment session:', this.currentSession.id);
            } catch (error) {
                console.warn('Failed to restore assessment session:', error);
                localStorage.removeItem('assessmentSession');
            }
        }
    }
    
    async startAssessment(options = {}) {
        try {
            const {
                assessmentType = 'questionnaire',
                userProfile = {}
            } = options;
            
            this.showLoading('Starting assessment...');
            
            const response = await fetch(`${this.baseUrl}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assessmentType,
                    userProfile
                })
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to start assessment');
            }
            
            this.currentSession = result.data;
            this.currentQuestion = 0;
            this.responses = [];
            this.startTime = Date.now();
            
            // Save session to localStorage
            localStorage.setItem('assessmentSession', JSON.stringify(this.currentSession));
            
            // Load first question
            await this.loadQuestion(0);
            
            // Track assessment start
            if (window.analytics) {
                window.analytics.trackAssessmentStart(assessmentType, this.currentSession.userId);
            }
            
            this.hideLoading();
            
            // Dispatch event for UI updates
            document.dispatchEvent(new CustomEvent('assessmentStarted', {
                detail: this.currentSession
            }));
            
            return this.currentSession;
            
        } catch (error) {
            console.error('Failed to start assessment:', error);
            this.hideLoading();
            this.showError('Failed to start assessment. Please try again.');
            throw error;
        }
    }
    
    async loadQuestion(questionIndex) {
        try {
            if (!this.currentSession) {
                throw new Error('No active assessment session');
            }
            
            const response = await fetch(`${this.baseUrl}/question/${this.currentSession.sessionId}/${questionIndex}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to load question');
            }
            
            if (result.data.completed) {
                // Assessment is complete
                await this.completeAssessment();
                return null;
            }
            
            const questionData = result.data;
            this.currentQuestion = questionIndex;
            
            // Dispatch event for UI updates
            document.dispatchEvent(new CustomEvent('questionLoaded', {
                detail: questionData
            }));
            
            return questionData;
            
        } catch (error) {
            console.error('Failed to load question:', error);
            this.showError('Failed to load question. Please try again.');
            throw error;
        }
    }
    
    async submitResponse(responseData) {
        try {
            if (!this.currentSession) {
                throw new Error('No active assessment session');
            }
            
            const {
                questionId,
                response,
                confidenceLevel
            } = responseData;
            
            const responseTime = Date.now() - (this.questionStartTime || Date.now());
            
            const submitData = {
                sessionId: this.currentSession.sessionId,
                questionId,
                response,
                responseTime,
                confidenceLevel
            };
            
            const apiResponse = await fetch(`${this.baseUrl}/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData)
            });
            
            const result = await apiResponse.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to submit response');
            }
            
            // Store response locally
            this.responses.push({
                ...submitData,
                responseId: result.data.responseId,
                timestamp: new Date().toISOString()
            });
            
            // Track response
            if (window.analytics) {
                window.analytics.trackQuestionAnswer(
                    questionId,
                    responseTime,
                    'assessment_question',
                    response
                );
            }
            
            // Load next question
            const nextQuestion = await this.loadQuestion(this.currentQuestion + 1);
            
            // Dispatch event for UI updates
            document.dispatchEvent(new CustomEvent('responseSubmitted', {
                detail: {
                    response: submitData,
                    nextQuestion
                }
            }));
            
            return result.data;
            
        } catch (error) {
            console.error('Failed to submit response:', error);
            this.showError('Failed to submit response. Please try again.');
            throw error;
        }
    }
    
    async completeAssessment() {
        try {
            if (!this.currentSession) {
                throw new Error('No active assessment session');
            }
            
            this.showLoading('Calculating your results...');
            
            const response = await fetch(`${this.baseUrl}/complete/${this.currentSession.sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to complete assessment');
            }
            
            const completionTime = Date.now() - this.startTime;
            
            // Track completion
            if (window.analytics) {
                window.analytics.trackAssessmentCompletion(
                    this.currentSession.assessmentType,
                    completionTime,
                    result.data.results
                );
            }
            
            // Clear session data
            localStorage.removeItem('assessmentSession');
            
            // Store results for display
            localStorage.setItem('assessmentResults', JSON.stringify(result.data));
            
            this.hideLoading();
            
            // Dispatch event for UI updates
            document.dispatchEvent(new CustomEvent('assessmentCompleted', {
                detail: result.data
            }));
            
            return result.data;
            
        } catch (error) {
            console.error('Failed to complete assessment:', error);
            this.hideLoading();
            this.showError('Failed to complete assessment. Please try again.');
            throw error;
        }
    }
    
    async getResults(resultId) {
        try {
            const response = await fetch(`${this.baseUrl}/results/${resultId}`);
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Failed to get results');
            }
            
            return result.data;
            
        } catch (error) {
            console.error('Failed to get results:', error);
            this.showError('Failed to load results. Please try again.');
            throw error;
        }
    }
    
    // Utility methods
    showLoading(message = 'Loading...') {
        // Create or update loading indicator
        let loader = document.getElementById('assessment-loader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'assessment-loader';
            loader.className = 'assessment-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="spinner"></div>
                    <div class="loader-message">${message}</div>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loader-message').textContent = message;
        }
        
        loader.style.display = 'flex';
    }
    
    hideLoading() {
        const loader = document.getElementById('assessment-loader');
        if (loader) {
            loader.style.display = 'none';
        }
    }
    
    showError(message) {
        // Create error notification
        const error = document.createElement('div');
        error.className = 'assessment-error';
        error.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <span>${message}</span>
                <button class="error-close">&times;</button>
            </div>
        `;
        
        document.body.appendChild(error);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (error.parentNode) {
                error.parentNode.removeChild(error);
            }
        }, 5000);
        
        // Manual close
        error.querySelector('.error-close').addEventListener('click', () => {
            if (error.parentNode) {
                error.parentNode.removeChild(error);
            }
        });
    }
    
    // Public API methods
    getCurrentSession() {
        return this.currentSession;
    }
    
    getResponses() {
        return this.responses;
    }
    
    abandonAssessment() {
        if (this.currentSession && window.analytics) {
            const timeSpent = Date.now() - this.startTime;
            window.analytics.trackAssessmentAbandonment(
                this.currentSession.assessmentType,
                this.currentQuestion,
                timeSpent
            );
        }
        
        // Clear session data
        localStorage.removeItem('assessmentSession');
        this.currentSession = null;
        this.responses = [];
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('assessmentAbandoned'));
    }
    
    resumeAssessment() {
        if (this.currentSession) {
            this.loadQuestion(this.currentQuestion);
        }
    }
}

// CSS for loading and error states
const assessmentStyles = `
    .assessment-loader {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }
    
    .loader-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        text-align: center;
        max-width: 300px;
    }
    
    .spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid #2E5BBA;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .loader-message {
        color: #333;
        font-weight: 500;
    }
    
    .assessment-error {
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4444;
        color: white;
        padding: 1rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 10001;
        max-width: 400px;
        animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .error-close {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        margin-left: auto;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .error-close:hover {
        opacity: 0.8;
    }
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = assessmentStyles;
document.head.appendChild(styleSheet);

// Initialize assessment integration
let assessmentIntegration = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        assessmentIntegration = new AssessmentIntegration();
        window.assessmentIntegration = assessmentIntegration;
    });
} else {
    assessmentIntegration = new AssessmentIntegration();
    window.assessmentIntegration = assessmentIntegration;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssessmentIntegration;
}