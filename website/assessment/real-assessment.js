/**
 * Real Assessment Interface
 * Connects to actual backend API and processes real questions
 */

class RealAssessmentInterface {
    constructor() {
        this.sessionId = null;
        this.currentQuestionIndex = 0;
        this.questions = [];
        this.responses = [];
        this.startTime = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupUI();
    }

    bindEvents() {
        // Replace the mock assessment buttons with real ones
        document.querySelectorAll('.start-assessment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const assessmentType = e.target.dataset.type;
                this.startRealAssessment(assessmentType);
            });
        });

        // Add demo mode toggle for testing
        this.addDemoModeToggle();
    }

    addDemoModeToggle() {
        const toggle = document.createElement('div');
        toggle.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #f0f0f0;
            padding: 10px;
            border-radius: 8px;
            font-size: 12px;
            z-index: 1000;
            border: 1px solid #ccc;
        `;
        toggle.innerHTML = `
            <label>
                <input type="checkbox" id="demoMode" checked> Demo Mode
            </label>
            <div style="font-size: 10px; color: #666; margin-top: 5px;">
                Uncheck to use real assessment
            </div>
        `;
        document.body.appendChild(toggle);
    }

    setupUI() {
        // Add styles for assessment interface
        const style = document.createElement('style');
        style.textContent = `
            .assessment-interface {
                max-width: 800px;
                margin: 2rem auto;
                padding: 2rem;
                background: white;
                border-radius: 12px;
                box-shadow: 0 4px 16px rgba(0,0,0,0.1);
            }

            .question-container {
                margin-bottom: 2rem;
            }

            .question-text {
                font-size: 1.2rem;
                font-weight: 600;
                color: var(--depth-charcoal);
                margin-bottom: 0.5rem;
            }

            .question-description {
                color: var(--calm-gray);
                margin-bottom: 1.5rem;
                line-height: 1.6;
            }

            .question-options {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }

            .option-button {
                padding: 1rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                text-align: left;
                cursor: pointer;
                transition: all 0.3s ease;
                font-size: 1rem;
            }

            .option-button:hover {
                border-color: var(--clarity-blue);
                background: rgba(46, 91, 186, 0.05);
            }

            .option-button.selected {
                border-color: var(--clarity-blue);
                background: rgba(46, 91, 186, 0.1);
                color: var(--clarity-blue);
            }

            .scale-rating {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 0.5rem;
                margin: 1rem 0;
            }

            .scale-button {
                width: 40px;
                height: 40px;
                border: 2px solid #e5e7eb;
                border-radius: 50%;
                background: white;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .scale-button:hover {
                border-color: var(--clarity-blue);
                background: rgba(46, 91, 186, 0.1);
            }

            .scale-button.selected {
                border-color: var(--clarity-blue);
                background: var(--clarity-blue);
                color: white;
            }

            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                margin-bottom: 2rem;
                overflow: hidden;
            }

            .progress-fill {
                height: 100%;
                background: var(--gradient-primary);
                transition: width 0.3s ease;
                border-radius: 4px;
            }

            .navigation-buttons {
                display: flex;
                justify-content: space-between;
                margin-top: 2rem;
            }

            .nav-button {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            }

            .nav-button.primary {
                background: var(--clarity-blue);
                color: white;
            }

            .nav-button.secondary {
                background: #e5e7eb;
                color: var(--depth-charcoal);
            }

            .nav-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }

            .nav-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }

            .loading-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2000;
            }

            .loading-content {
                background: white;
                padding: 2rem;
                border-radius: 12px;
                text-align: center;
                max-width: 400px;
            }

            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #e5e7eb;
                border-top: 4px solid var(--clarity-blue);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    async startRealAssessment(assessmentType) {
        // Check if demo mode is enabled
        const demoMode = document.getElementById('demoMode')?.checked;
        if (demoMode) {
            this.showMessage('Demo mode is enabled. Uncheck "Demo Mode" to use real assessment.', 'warning');
            return;
        }

        try {
            this.showLoading('Starting your assessment...');

            // Get user profile information
            const userProfile = await this.getUserProfile();

            // Start assessment session
            const response = await fetch('/api/assessment/start', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assessmentType,
                    userProfile
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to start assessment');
            }

            // Store session information
            this.sessionId = data.data.sessionId;
            this.assessmentType = assessmentType;
            this.totalQuestions = data.data.totalQuestions;
            this.startTime = Date.now();

            this.hideLoading();

            // Load first question
            await this.loadQuestion(0);

        } catch (error) {
            console.error('Error starting assessment:', error);
            this.hideLoading();
            this.showMessage('Failed to start assessment. Please try again.', 'error');
        }
    }

    async getUserProfile() {
        // For now, return basic profile
        // In a full implementation, this might come from a form or user account
        return {
            industry: 'general',
            role: 'executive',
            experience: 5
        };
    }

    async loadQuestion(questionIndex) {
        try {
            this.showLoading('Loading question...');

            const response = await fetch(`/api/assessment/question/${this.sessionId}/${questionIndex}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to load question');
            }

            this.hideLoading();

            if (data.data.completed) {
                // Assessment completed
                await this.completeAssessment();
                return;
            }

            // Display question
            this.currentQuestionIndex = questionIndex;
            this.displayQuestion(data.data.question, data.data.progress);

        } catch (error) {
            console.error('Error loading question:', error);
            this.hideLoading();
            this.showMessage('Failed to load question. Please try again.', 'error');
        }
    }

    displayQuestion(question, progress) {
        // Create assessment interface if it doesn't exist
        let assessmentInterface = document.querySelector('.assessment-interface');
        if (!assessmentInterface) {
            assessmentInterface = this.createAssessmentInterface();
        }

        // Update progress bar
        const progressFill = assessmentInterface.querySelector('.progress-fill');
        progressFill.style.width = `${progress.percentage}%`;

        // Update progress text
        const progressText = assessmentInterface.querySelector('.progress-text');
        progressText.textContent = `Question ${progress.current} of ${progress.total}`;

        // Display question
        const questionContainer = assessmentInterface.querySelector('.question-container');
        questionContainer.innerHTML = this.renderQuestion(question);

        // Bind option selection events
        this.bindQuestionEvents(question);
    }

    createAssessmentInterface() {
        // Hide the main assessment selection interface
        const mainContent = document.querySelector('.assessment-modalities');
        if (mainContent) {
            mainContent.style.display = 'none';
        }

        // Create assessment interface
        const assessmentInterface = document.createElement('div');
        assessmentInterface.className = 'assessment-interface';
        assessmentInterface.innerHTML = `
            <div class="progress-container">
                <div class="progress-text">Question 1 of 1</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
            </div>

            <div class="question-container">
                <!-- Question content will be inserted here -->
            </div>

            <div class="navigation-buttons">
                <button class="nav-button secondary" id="prevButton" disabled>Previous</button>
                <button class="nav-button primary" id="nextButton" disabled>Next</button>
            </div>
        `;

        // Insert after hero section
        const heroSection = document.querySelector('.assessment-hero');
        if (heroSection) {
            heroSection.after(assessmentInterface);
        } else {
            document.querySelector('.container').appendChild(assessmentInterface);
        }

        // Bind navigation events
        document.getElementById('prevButton').addEventListener('click', () => {
            if (this.currentQuestionIndex > 0) {
                this.loadQuestion(this.currentQuestionIndex - 1);
            }
        });

        document.getElementById('nextButton').addEventListener('click', () => {
            this.submitCurrentResponse();
        });

        return assessmentInterface;
    }

    renderQuestion(question) {
        let optionsHTML = '';

        switch (question.type) {
            case 'multiple_choice':
                optionsHTML = question.options.map(option => `
                    <button class="option-button" data-value="${option.value}" data-id="${option.id}">
                        ${option.text}
                    </button>
                `).join('');
                break;

            case 'scale_rating':
                const scaleButtons = [];
                for (let i = 1; i <= 10; i++) {
                    scaleButtons.push(`
                        <button class="scale-button" data-value="${i}">
                            ${i}
                        </button>
                    `);
                }
                optionsHTML = `
                    <div class="scale-rating">
                        <span>Not at all</span>
                        ${scaleButtons.join('')}
                        <span>Completely</span>
                    </div>
                `;
                break;

            default:
                optionsHTML = '<p>Question type not supported yet.</p>';
        }

        return `
            <div class="question-text">${question.text}</div>
            <div class="question-description">${question.description || ''}</div>
            <div class="question-options">
                ${optionsHTML}
            </div>
        `;
    }

    bindQuestionEvents(question) {
        const options = document.querySelectorAll('.option-button, .scale-button');
        const nextButton = document.getElementById('nextButton');

        options.forEach(option => {
            option.addEventListener('click', () => {
                // Remove previous selections
                options.forEach(opt => opt.classList.remove('selected'));

                // Select current option
                option.classList.add('selected');

                // Store response
                this.currentResponse = {
                    questionId: question.id,
                    response: option.dataset.value,
                    responseTime: Date.now() - this.questionStartTime
                };

                // Enable next button
                nextButton.disabled = false;
            });
        });

        // Record question start time
        this.questionStartTime = Date.now();
    }

    async submitCurrentResponse() {
        if (!this.currentResponse) {
            this.showMessage('Please select an answer before continuing.', 'warning');
            return;
        }

        try {
            this.showLoading('Saving your response...');

            const response = await fetch('/api/assessment/response', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    ...this.currentResponse
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to submit response');
            }

            this.hideLoading();

            // Store response locally
            this.responses.push(this.currentResponse);
            this.currentResponse = null;

            // Load next question
            await this.loadQuestion(this.currentQuestionIndex + 1);

        } catch (error) {
            console.error('Error submitting response:', error);
            this.hideLoading();
            this.showMessage('Failed to save response. Please try again.', 'error');
        }
    }

    async completeAssessment() {
        try {
            this.showLoading('Calculating your results...');

            const response = await fetch(`/api/assessment/complete/${this.sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to complete assessment');
            }

            this.hideLoading();

            // Store results and redirect to completion page
            localStorage.setItem('assessment-results', JSON.stringify(data.data));
            window.location.href = `completion.html?completed=true&session=${this.sessionId}`;

        } catch (error) {
            console.error('Error completing assessment:', error);
            this.hideLoading();
            this.showMessage('Failed to complete assessment. Please try again.', 'error');
        }
    }

    showLoading(message) {
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            document.body.appendChild(overlay);
        }

        overlay.innerHTML = `
            <div class="loading-content">
                <div class="spinner"></div>
                <div>${message}</div>
            </div>
        `;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 3000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        switch (type) {
            case 'error':
                messageDiv.style.background = '#ef4444';
                break;
            case 'warning':
                messageDiv.style.background = '#f59e0b';
                break;
            case 'success':
                messageDiv.style.background = '#10b981';
                break;
            default:
                messageDiv.style.background = '#3b82f6';
        }

        messageDiv.textContent = message;
        document.body.appendChild(messageDiv);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 5000);
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new RealAssessmentInterface());
} else {
    new RealAssessmentInterface();
}
