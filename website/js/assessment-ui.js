/**
 * Assessment UI Components
 * Handles the user interface for assessment interactions
 */

class AssessmentUI {
    constructor() {
        this.container = null;
        this.currentQuestion = null;
        this.progress = { current: 0, total: 0 };
        this.responses = new Map();
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.injectStyles();
        console.log('Assessment UI initialized');
    }
    
    setupEventListeners() {
        // Listen for assessment events
        document.addEventListener('assessmentStarted', (event) => {
            this.handleAssessmentStarted(event.detail);
        });
        
        document.addEventListener('questionLoaded', (event) => {
            this.handleQuestionLoaded(event.detail);
        });
        
        document.addEventListener('assessmentCompleted', (event) => {
            this.handleAssessmentCompleted(event.detail);
        });
        
        document.addEventListener('assessmentAbandoned', () => {
            this.handleAssessmentAbandoned();
        });
    }
    
    /**
     * Create assessment container
     */
    createAssessmentContainer() {
        if (this.container) {
            return this.container;
        }
        
        this.container = document.createElement('div');
        this.container.className = 'assessment-container';
        this.container.innerHTML = `
            <div class="assessment-header">
                <div class="assessment-progress">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-text">
                        <span class="current-step">0</span> of <span class="total-steps">0</span>
                    </div>
                </div>
                <button class="assessment-close" title="Close Assessment">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="assessment-content">
                <div class="question-container">
                    <!-- Question content will be inserted here -->
                </div>
                
                <div class="assessment-navigation">
                    <button class="btn btn-outline assessment-back" disabled>
                        <i class="fas fa-arrow-left"></i>
                        Back
                    </button>
                    <button class="btn btn-primary assessment-next" disabled>
                        Next
                        <i class="fas fa-arrow-right"></i>
                    </button>
                </div>
            </div>
            
            <div class="assessment-footer">
                <div class="assessment-info">
                    <i class="fas fa-clock"></i>
                    <span class="time-estimate">Estimated time: <span class="time-remaining">5 minutes</span></span>
                </div>
            </div>
        `;
        
        // Add event listeners
        this.container.querySelector('.assessment-close').addEventListener('click', () => {
            this.closeAssessment();
        });
        
        this.container.querySelector('.assessment-back').addEventListener('click', () => {
            this.goBack();
        });
        
        this.container.querySelector('.assessment-next').addEventListener('click', () => {
            this.goNext();
        });
        
        return this.container;
    }
    
    /**
     * Handle assessment started
     */
    handleAssessmentStarted(sessionData) {
        this.progress.total = sessionData.totalQuestions;
        this.progress.current = 0;
        
        // Create and show container
        const container = this.createAssessmentContainer();
        document.body.appendChild(container);
        
        // Update progress
        this.updateProgress();
        
        // Show with animation
        setTimeout(() => {
            container.classList.add('visible');
        }, 100);
    }
    
    /**
     * Handle question loaded
     */
    handleQuestionLoaded(questionData) {
        if (!questionData.question) return;
        
        this.currentQuestion = questionData.question;
        this.progress = questionData.progress;
        
        // Update progress
        this.updateProgress();
        
        // Render question
        this.renderQuestion(questionData.question);
        
        // Update navigation
        this.updateNavigation();
    }
    
    /**
     * Render question based on type
     */
    renderQuestion(question) {
        const questionContainer = this.container.querySelector('.question-container');
        
        let questionHTML = `
            <div class="question-header">
                <h3 class="question-title">${question.text}</h3>
                ${question.description ? `<p class="question-description">${question.description}</p>` : ''}
            </div>
            <div class="question-input">
        `;
        
        switch (question.type) {
            case 'multiple_choice':
                questionHTML += this.renderMultipleChoice(question);
                break;
            case 'scale_rating':
                questionHTML += this.renderScaleRating(question);
                break;
            case 'text_input':
                questionHTML += this.renderTextInput(question);
                break;
            case 'scenario_response':
                questionHTML += this.renderScenarioResponse(question);
                break;
            default:
                questionHTML += this.renderMultipleChoice(question);
        }
        
        questionHTML += `
            </div>
            ${this.renderConfidenceLevel()}
        `;
        
        questionContainer.innerHTML = questionHTML;
        
        // Add event listeners for inputs
        this.setupQuestionEventListeners();
        
        // Animate in
        questionContainer.classList.add('question-loaded');
    }
    
    /**
     * Render multiple choice question
     */
    renderMultipleChoice(question) {
        const options = question.options || [];
        
        return `
            <div class="multiple-choice-options">
                ${options.map((option, index) => `
                    <label class="option-label">
                        <input type="radio" name="question-response" value="${option.value}" data-text="${option.text}">
                        <div class="option-content">
                            <div class="option-indicator"></div>
                            <div class="option-text">${option.text}</div>
                        </div>
                    </label>
                `).join('')}
            </div>
        `;
    }
    
    /**
     * Render scale rating question
     */
    renderScaleRating(question) {
        const options = question.options || [];
        const minOption = options.find(o => o.id === '1') || { text: 'Low', value: 1 };
        const maxOption = options.find(o => o.id === '10') || { text: 'High', value: 10 };
        
        return `
            <div class="scale-rating">
                <div class="scale-labels">
                    <span class="scale-min">${minOption.text}</span>
                    <span class="scale-max">${maxOption.text}</span>
                </div>
                <div class="scale-input">
                    <input type="range" name="question-response" min="1" max="10" value="5" class="scale-slider">
                    <div class="scale-value">5</div>
                </div>
                <div class="scale-numbers">
                    ${Array.from({length: 10}, (_, i) => `<span class="scale-number">${i + 1}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render text input question
     */
    renderTextInput(question) {
        return `
            <div class="text-input">
                <textarea name="question-response" placeholder="Please share your thoughts..." rows="4"></textarea>
                <div class="character-count">
                    <span class="current-count">0</span> / <span class="max-count">500</span> characters
                </div>
            </div>
        `;
    }
    
    /**
     * Render scenario response question
     */
    renderScenarioResponse(question) {
        return `
            <div class="scenario-response">
                <div class="scenario-content">
                    ${question.scenario || ''}
                </div>
                <div class="response-options">
                    ${(question.options || []).map((option, index) => `
                        <label class="scenario-option">
                            <input type="radio" name="question-response" value="${option.value}">
                            <div class="scenario-option-content">
                                <h4>${option.title || option.text}</h4>
                                <p>${option.description || ''}</p>
                            </div>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Render confidence level selector
     */
    renderConfidenceLevel() {
        return `
            <div class="confidence-level">
                <label class="confidence-label">How confident are you in this response?</label>
                <div class="confidence-options">
                    ${Array.from({length: 5}, (_, i) => {
                        const level = i + 1;
                        const labels = ['Not confident', 'Slightly confident', 'Moderately confident', 'Very confident', 'Extremely confident'];
                        return `
                            <label class="confidence-option">
                                <input type="radio" name="confidence-level" value="${level * 2}">
                                <div class="confidence-indicator">
                                    <div class="confidence-stars">
                                        ${Array.from({length: 5}, (_, j) => `
                                            <i class="fas fa-star ${j < level ? 'active' : ''}"></i>
                                        `).join('')}
                                    </div>
                                    <span class="confidence-text">${labels[i]}</span>
                                </div>
                            </label>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
    }
    
    /**
     * Setup event listeners for question inputs
     */
    setupQuestionEventListeners() {
        const container = this.container.querySelector('.question-container');
        
        // Handle input changes
        container.addEventListener('change', (event) => {
            if (event.target.name === 'question-response') {
                this.handleResponseChange(event.target);
            } else if (event.target.name === 'confidence-level') {
                this.handleConfidenceChange(event.target);
            }
        });
        
        // Handle scale slider
        const scaleSlider = container.querySelector('.scale-slider');
        if (scaleSlider) {
            scaleSlider.addEventListener('input', (event) => {
                const value = event.target.value;
                const valueDisplay = container.querySelector('.scale-value');
                if (valueDisplay) {
                    valueDisplay.textContent = value;
                }
                this.handleResponseChange(event.target);
            });
        }
        
        // Handle text input character count
        const textInput = container.querySelector('textarea[name="question-response"]');
        if (textInput) {
            textInput.addEventListener('input', (event) => {
                const currentCount = container.querySelector('.current-count');
                if (currentCount) {
                    currentCount.textContent = event.target.value.length;
                }
                this.handleResponseChange(event.target);
            });
        }
    }
    
    /**
     * Handle response change
     */
    handleResponseChange(input) {
        const response = this.getResponseValue(input);
        
        // Store response
        this.responses.set(this.currentQuestion.id, {
            questionId: this.currentQuestion.id,
            response: response,
            timestamp: Date.now()
        });
        
        // Enable next button
        this.updateNavigation();
    }
    
    /**
     * Handle confidence level change
     */
    handleConfidenceChange(input) {
        const confidenceLevel = parseInt(input.value);
        
        // Update stored response
        const response = this.responses.get(this.currentQuestion.id);
        if (response) {
            response.confidenceLevel = confidenceLevel;
        }
    }
    
    /**
     * Get response value from input
     */
    getResponseValue(input) {
        switch (input.type) {
            case 'radio':
                return {
                    value: input.value,
                    text: input.dataset.text || input.value
                };
            case 'range':
                return parseInt(input.value);
            case 'textarea':
                return input.value.trim();
            default:
                return input.value;
        }
    }
    
    /**
     * Update progress display
     */
    updateProgress() {
        if (!this.container) return;
        
        const progressFill = this.container.querySelector('.progress-fill');
        const currentStep = this.container.querySelector('.current-step');
        const totalSteps = this.container.querySelector('.total-steps');
        
        const percentage = this.progress.total > 0 ? 
            (this.progress.current / this.progress.total) * 100 : 0;
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (currentStep) {
            currentStep.textContent = this.progress.current;
        }
        
        if (totalSteps) {
            totalSteps.textContent = this.progress.total;
        }
    }
    
    /**
     * Update navigation buttons
     */
    updateNavigation() {
        if (!this.container) return;
        
        const backBtn = this.container.querySelector('.assessment-back');
        const nextBtn = this.container.querySelector('.assessment-next');
        
        // Enable/disable back button
        if (backBtn) {
            backBtn.disabled = this.progress.current <= 1;
        }
        
        // Enable/disable next button based on response
        if (nextBtn) {
            const hasResponse = this.currentQuestion && 
                this.responses.has(this.currentQuestion.id);
            nextBtn.disabled = !hasResponse;
        }
    }
    
    /**
     * Go to next question
     */
    goNext() {
        const response = this.responses.get(this.currentQuestion.id);
        if (!response) return;
        
        // Add response time
        response.responseTime = Date.now() - response.timestamp;
        
        // Dispatch response submission event
        document.dispatchEvent(new CustomEvent('submitResponse', {
            detail: response
        }));
    }
    
    /**
     * Go to previous question
     */
    goBack() {
        // Implementation for going back would require storing question history
        console.log('Going back - not implemented yet');
    }
    
    /**
     * Handle assessment completed
     */
    handleAssessmentCompleted(results) {
        if (!this.container) return;
        
        // Show completion screen
        this.showCompletionScreen(results);
    }
    
    /**
     * Show completion screen
     */
    showCompletionScreen(results) {
        const content = this.container.querySelector('.assessment-content');
        
        content.innerHTML = `
            <div class="completion-screen">
                <div class="completion-header">
                    <div class="completion-icon">
                        <i class="fas fa-check-circle"></i>
                    </div>
                    <h2>Assessment Complete!</h2>
                    <p>Thank you for completing your AI readiness assessment.</p>
                </div>
                
                <div class="completion-summary">
                    <div class="summary-item">
                        <span class="summary-label">Overall Score:</span>
                        <span class="summary-value">${results.results.overallScore}/100</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Persona:</span>
                        <span class="summary-value">${results.results.persona.title}</span>
                    </div>
                    <div class="summary-item">
                        <span class="summary-label">Completion Time:</span>
                        <span class="summary-value">${Math.round(results.results.completionTime / 1000 / 60)} minutes</span>
                    </div>
                </div>
                
                <div class="completion-actions">
                    <button class="btn btn-primary view-results">
                        <i class="fas fa-chart-bar"></i>
                        View Detailed Results
                    </button>
                    <button class="btn btn-outline schedule-consultation">
                        <i class="fas fa-calendar"></i>
                        Schedule Consultation
                    </button>
                </div>
            </div>
        `;
        
        // Add event listeners
        content.querySelector('.view-results').addEventListener('click', () => {
            this.showDetailedResults(results);
        });
        
        content.querySelector('.schedule-consultation').addEventListener('click', () => {
            this.scheduleConsultation(results);
        });
    }
    
    /**
     * Show detailed results
     */
    showDetailedResults(results) {
        // Redirect to results page or show in modal
        const resultId = results.resultId;
        window.location.href = `/assessment/results.html?id=${resultId}`;
    }
    
    /**
     * Schedule consultation
     */
    scheduleConsultation(results) {
        // Redirect to consultation scheduling
        const persona = results.results.persona.type;
        window.location.href = `/contact.html?source=assessment&persona=${persona}`;
    }
    
    /**
     * Close assessment
     */
    closeAssessment() {
        if (confirm('Are you sure you want to close the assessment? Your progress will be lost.')) {
            if (window.assessmentIntegration) {
                window.assessmentIntegration.abandonAssessment();
            }
            this.handleAssessmentAbandoned();
        }
    }
    
    /**
     * Handle assessment abandoned
     */
    handleAssessmentAbandoned() {
        if (this.container) {
            this.container.classList.remove('visible');
            setTimeout(() => {
                if (this.container.parentNode) {
                    this.container.parentNode.removeChild(this.container);
                }
                this.container = null;
            }, 300);
        }
    }
    
    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.querySelector('#assessment-ui-styles')) return;
        
        const styles = `
            .assessment-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
            }
            
            .assessment-container.visible {
                opacity: 1;
                visibility: visible;
            }
            
            .assessment-container > div {
                background: white;
                border-radius: 12px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                max-width: 800px;
                width: 90%;
                max-height: 90%;
                overflow: hidden;
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }
            
            .assessment-container.visible > div {
                transform: translateY(0);
            }
            
            .assessment-header {
                padding: 1.5rem;
                border-bottom: 1px solid #e5e7eb;
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            
            .assessment-progress {
                flex: 1;
                margin-right: 1rem;
            }
            
            .progress-bar {
                width: 100%;
                height: 8px;
                background: #e5e7eb;
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }
            
            .progress-fill {
                height: 100%;
                background: var(--clarity-blue);
                transition: width 0.3s ease;
            }
            
            .progress-text {
                font-size: 0.875rem;
                color: var(--calm-gray);
            }
            
            .assessment-close {
                background: none;
                border: none;
                font-size: 1.5rem;
                color: var(--calm-gray);
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .assessment-close:hover {
                background: #f3f4f6;
                color: var(--depth-charcoal);
            }
            
            .assessment-content {
                padding: 2rem;
                max-height: 60vh;
                overflow-y: auto;
            }
            
            .question-container {
                margin-bottom: 2rem;
            }
            
            .question-header {
                margin-bottom: 1.5rem;
            }
            
            .question-title {
                color: var(--depth-charcoal);
                margin-bottom: 0.5rem;
                font-size: 1.25rem;
                font-weight: 600;
            }
            
            .question-description {
                color: var(--calm-gray);
                line-height: 1.6;
            }
            
            .multiple-choice-options {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .option-label {
                cursor: pointer;
                display: block;
            }
            
            .option-content {
                display: flex;
                align-items: center;
                padding: 1rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            
            .option-label:hover .option-content {
                border-color: var(--clarity-blue);
                background: #f0f9ff;
            }
            
            .option-label input:checked + .option-content {
                border-color: var(--clarity-blue);
                background: var(--clarity-blue);
                color: white;
            }
            
            .option-indicator {
                width: 20px;
                height: 20px;
                border: 2px solid currentColor;
                border-radius: 50%;
                margin-right: 1rem;
                position: relative;
            }
            
            .option-label input:checked + .option-content .option-indicator::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 8px;
                height: 8px;
                background: currentColor;
                border-radius: 50%;
            }
            
            .scale-rating {
                text-align: center;
            }
            
            .scale-labels {
                display: flex;
                justify-content: space-between;
                margin-bottom: 1rem;
                font-weight: 500;
            }
            
            .scale-input {
                margin-bottom: 1rem;
                position: relative;
            }
            
            .scale-slider {
                width: 100%;
                height: 8px;
                border-radius: 4px;
                background: #e5e7eb;
                outline: none;
                -webkit-appearance: none;
            }
            
            .scale-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: var(--clarity-blue);
                cursor: pointer;
            }
            
            .scale-value {
                position: absolute;
                top: -40px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--clarity-blue);
                color: white;
                padding: 0.25rem 0.5rem;
                border-radius: 4px;
                font-weight: 600;
            }
            
            .scale-numbers {
                display: flex;
                justify-content: space-between;
                font-size: 0.875rem;
                color: var(--calm-gray);
            }
            
            .text-input textarea {
                width: 100%;
                padding: 1rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                font-family: inherit;
                font-size: 1rem;
                resize: vertical;
                min-height: 120px;
            }
            
            .text-input textarea:focus {
                outline: none;
                border-color: var(--clarity-blue);
            }
            
            .character-count {
                text-align: right;
                font-size: 0.875rem;
                color: var(--calm-gray);
                margin-top: 0.5rem;
            }
            
            .confidence-level {
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid #e5e7eb;
            }
            
            .confidence-label {
                display: block;
                font-weight: 500;
                margin-bottom: 1rem;
                color: var(--depth-charcoal);
            }
            
            .confidence-options {
                display: flex;
                gap: 1rem;
                flex-wrap: wrap;
            }
            
            .confidence-option {
                cursor: pointer;
                flex: 1;
                min-width: 120px;
            }
            
            .confidence-indicator {
                text-align: center;
                padding: 0.75rem;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            
            .confidence-option:hover .confidence-indicator {
                border-color: var(--energy-amber);
            }
            
            .confidence-option input:checked + .confidence-indicator {
                border-color: var(--energy-amber);
                background: #fef3c7;
            }
            
            .confidence-stars {
                margin-bottom: 0.5rem;
            }
            
            .confidence-stars .fa-star {
                color: #d1d5db;
                margin: 0 1px;
            }
            
            .confidence-stars .fa-star.active {
                color: var(--energy-amber);
            }
            
            .confidence-text {
                font-size: 0.875rem;
                color: var(--calm-gray);
            }
            
            .assessment-navigation {
                display: flex;
                justify-content: space-between;
                gap: 1rem;
            }
            
            .assessment-footer {
                padding: 1rem 2rem;
                border-top: 1px solid #e5e7eb;
                background: #f9fafb;
            }
            
            .assessment-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: var(--calm-gray);
            }
            
            .completion-screen {
                text-align: center;
            }
            
            .completion-icon {
                font-size: 4rem;
                color: var(--insight-green);
                margin-bottom: 1rem;
            }
            
            .completion-header h2 {
                color: var(--depth-charcoal);
                margin-bottom: 0.5rem;
            }
            
            .completion-summary {
                background: #f9fafb;
                border-radius: 8px;
                padding: 1.5rem;
                margin: 2rem 0;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.5rem 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .summary-item:last-child {
                border-bottom: none;
            }
            
            .summary-label {
                font-weight: 500;
                color: var(--calm-gray);
            }
            
            .summary-value {
                font-weight: 600;
                color: var(--depth-charcoal);
            }
            
            .completion-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            @media (max-width: 768px) {
                .assessment-container > div {
                    width: 95%;
                    margin: 1rem;
                }
                
                .assessment-content {
                    padding: 1rem;
                }
                
                .confidence-options {
                    flex-direction: column;
                }
                
                .completion-actions {
                    flex-direction: column;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'assessment-ui-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// Initialize Assessment UI
let assessmentUI = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        assessmentUI = new AssessmentUI();
        window.assessmentUI = assessmentUI;
    });
} else {
    assessmentUI = new AssessmentUI();
    window.assessmentUI = assessmentUI;
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AssessmentUI;
}