// Assessment System for The Obvious Company
class AssessmentSystem {
    constructor() {
        this.currentAssessment = null;
        this.currentQuestion = 0;
        this.responses = {};
        this.assessments = this.initializeAssessments();
        this.bindEvents();
    }

    initializeAssessments() {
        return {
            'strategic-readiness': {
                title: 'Strategic Readiness Assessment',
                description: 'Evaluate your AI integration readiness across five critical dimensions',
                duration: '15-20 minutes',
                questions: [
                    {
                        id: 'strategic_authority',
                        type: 'scale',
                        question: 'How much decision-making authority do you have regarding AI implementation in your organization?',
                        description: 'Consider your ability to allocate budget, approve new technologies, and drive strategic initiatives.',
                        scale: {
                            min: 1,
                            max: 5,
                            labels: {
                                1: 'Limited - Need approval for most decisions',
                                2: 'Some - Can make small-scale decisions',
                                3: 'Moderate - Can approve departmental initiatives',
                                4: 'Significant - Can drive organization-wide changes',
                                5: 'Complete - Full strategic authority'
                            }
                        }
                    },
                    {
                        id: 'organizational_influence',
                        type: 'scale',
                        question: 'How effectively can you influence others in your organization to adopt new approaches?',
                        description: 'Think about your ability to build consensus, manage change, and inspire adoption.',
                        scale: {
                            min: 1,
                            max: 5,
                            labels: {
                                1: 'Minimal - Struggle to get buy-in',
                                2: 'Limited - Can influence immediate team',
                                3: 'Moderate - Can influence across departments',
                                4: 'Strong - Recognized change leader',
                                5: 'Exceptional - Organization-wide influence'
                            }
                        }
                    },
                    {
                        id: 'resource_availability',
                        type: 'multiple',
                        question: 'What resources do you have available for AI implementation?',
                        description: 'Select all that apply to your current situation.',
                        options: [
                            { id: 'budget_10k', text: 'Budget allocation of $10,000+' },
                            { id: 'budget_50k', text: 'Budget allocation of $50,000+' },
                            { id: 'dedicated_time', text: 'Dedicated time for implementation (10+ hours/week)' },
                            { id: 'team_support', text: 'Team members who can assist with implementation' },
                            { id: 'technical_expertise', text: 'Access to technical expertise (internal or external)' },
                            { id: 'executive_support', text: 'Executive sponsorship and support' },
                            { id: 'change_budget', text: 'Budget for training and change management' }
                        ]
                    },
                    {
                        id: 'current_challenges',
                        type: 'multiple',
                        question: 'Which challenges are currently consuming significant time and energy?',
                        description: 'Identify areas where AI could potentially provide the most impact.',
                        options: [
                            { id: 'data_analysis', text: 'Data analysis and reporting' },
                            { id: 'content_creation', text: 'Content creation and communication' },
                            { id: 'process_optimization', text: 'Process optimization and workflow management' },
                            { id: 'decision_support', text: 'Decision support and strategic analysis' },
                            { id: 'customer_service', text: 'Customer service and engagement' },
                            { id: 'project_management', text: 'Project management and coordination' },
                            { id: 'research_insights', text: 'Research and market insights' },
                            { id: 'administrative_tasks', text: 'Administrative and routine tasks' }
                        ]
                    },
                    {
                        id: 'implementation_timeline',
                        type: 'single',
                        question: 'What is your preferred timeline for AI implementation?',
                        description: 'Consider your current priorities and capacity for change.',
                        options: [
                            { id: 'immediate', text: 'Immediate (within 30 days)' },
                            { id: 'short_term', text: 'Short-term (1-3 months)' },
                            { id: 'medium_term', text: 'Medium-term (3-6 months)' },
                            { id: 'long_term', text: 'Long-term (6-12 months)' },
                            { id: 'exploratory', text: 'Exploratory (timeline flexible)' }
                        ]
                    },
                    {
                        id: 'success_metrics',
                        type: 'multiple',
                        question: 'How would you measure the success of AI implementation?',
                        description: 'Select the metrics most important to your organization.',
                        options: [
                            { id: 'time_savings', text: 'Time savings and efficiency gains' },
                            { id: 'cost_reduction', text: 'Cost reduction and resource optimization' },
                            { id: 'quality_improvement', text: 'Quality improvement in outputs' },
                            { id: 'strategic_capacity', text: 'Increased capacity for strategic work' },
                            { id: 'competitive_advantage', text: 'Competitive advantage and differentiation' },
                            { id: 'innovation_acceleration', text: 'Faster innovation and development cycles' },
                            { id: 'employee_satisfaction', text: 'Improved employee satisfaction and engagement' }
                        ]
                    }
                ]
            },
            'energy-audit': {
                title: 'Energy Optimization Audit',
                description: 'Identify how your energy is allocated and discover optimization opportunities',
                duration: '10-15 minutes',
                questions: [
                    {
                        id: 'energy_drains',
                        type: 'multiple',
                        question: 'Which activities consistently drain your energy?',
                        description: 'Select all activities that leave you feeling depleted.',
                        options: [
                            { id: 'email_management', text: 'Email management and communication' },
                            { id: 'meetings', text: 'Meetings and coordination calls' },
                            { id: 'administrative', text: 'Administrative tasks and paperwork' },
                            { id: 'data_entry', text: 'Data entry and record keeping' },
                            { id: 'reporting', text: 'Status reporting and updates' },
                            { id: 'scheduling', text: 'Scheduling and calendar management' },
                            { id: 'research', text: 'Research and information gathering' },
                            { id: 'routine_decisions', text: 'Routine decision-making' }
                        ]
                    },
                    {
                        id: 'peak_energy_time',
                        type: 'single',
                        question: 'When do you typically have the most mental energy?',
                        description: 'Identify your natural peak performance periods.',
                        options: [
                            { id: 'early_morning', text: 'Early morning (6-9 AM)' },
                            { id: 'mid_morning', text: 'Mid-morning (9-12 PM)' },
                            { id: 'early_afternoon', text: 'Early afternoon (12-3 PM)' },
                            { id: 'late_afternoon', text: 'Late afternoon (3-6 PM)' },
                            { id: 'evening', text: 'Evening (6-9 PM)' },
                            { id: 'varies', text: 'Varies significantly day to day' }
                        ]
                    },
                    {
                        id: 'strategic_time',
                        type: 'scale',
                        question: 'What percentage of your time is spent on strategic vs. operational work?',
                        description: 'Strategic work includes planning, innovation, and high-level decision-making.',
                        scale: {
                            min: 1,
                            max: 5,
                            labels: {
                                1: '0-20% strategic, 80-100% operational',
                                2: '20-40% strategic, 60-80% operational',
                                3: '40-60% strategic, 40-60% operational',
                                4: '60-80% strategic, 20-40% operational',
                                5: '80-100% strategic, 0-20% operational'
                            }
                        }
                    }
                ]
            },
            'organizational-maturity': {
                title: 'Organizational Maturity Assessment',
                description: 'Evaluate your organization\'s readiness for AI integration and transformation',
                duration: '20-25 minutes',
                questions: [
                    {
                        id: 'change_readiness',
                        type: 'scale',
                        question: 'How ready is your organization for significant technological change?',
                        description: 'Consider past change initiatives and organizational culture.',
                        scale: {
                            min: 1,
                            max: 5,
                            labels: {
                                1: 'Resistant - Prefers status quo',
                                2: 'Cautious - Slow to adopt changes',
                                3: 'Moderate - Adapts when necessary',
                                4: 'Adaptive - Embraces beneficial changes',
                                5: 'Innovative - Seeks cutting-edge solutions'
                            }
                        }
                    },
                    {
                        id: 'technical_infrastructure',
                        type: 'multiple',
                        question: 'What technical capabilities does your organization currently have?',
                        description: 'Select all that apply to your current infrastructure.',
                        options: [
                            { id: 'cloud_systems', text: 'Cloud-based systems and storage' },
                            { id: 'data_management', text: 'Structured data management systems' },
                            { id: 'api_integrations', text: 'API integrations and automation tools' },
                            { id: 'security_protocols', text: 'Strong cybersecurity protocols' },
                            { id: 'it_support', text: 'Dedicated IT support team' },
                            { id: 'digital_workflows', text: 'Digital workflow management' },
                            { id: 'analytics_tools', text: 'Business analytics and reporting tools' }
                        ]
                    }
                ]
            }
        };
    }

    bindEvents() {
        // Bind assessment start buttons
        document.querySelectorAll('.assessment-btn, .assessment-link').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const assessmentType = btn.getAttribute('data-assessment');
                this.startAssessment(assessmentType);
            });
        });

        // Bind modal close
        document.querySelector('.modal-close')?.addEventListener('click', () => {
            this.closeModal();
        });

        // Close modal on outside click
        document.getElementById('assessmentModal')?.addEventListener('click', (e) => {
            if (e.target.id === 'assessmentModal') {
                this.closeModal();
            }
        });
    }

    startAssessment(type) {
        this.currentAssessment = type;
        this.currentQuestion = 0;
        this.responses = {};
        
        const assessment = this.assessments[type];
        if (!assessment) return;

        document.getElementById('modalTitle').textContent = assessment.title;
        this.showModal();
        this.renderQuestion();
    }

    showModal() {
        document.getElementById('assessmentModal').style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('assessmentModal').style.display = 'none';
        document.body.style.overflow = 'auto';
    }

    renderQuestion() {
        const assessment = this.assessments[this.currentAssessment];
        const question = assessment.questions[this.currentQuestion];
        const totalQuestions = assessment.questions.length;
        
        const content = document.getElementById('assessmentContent');
        
        content.innerHTML = `
            <div class="assessment-progress">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${((this.currentQuestion + 1) / totalQuestions) * 100}%"></div>
                </div>
                <div class="progress-text">Question ${this.currentQuestion + 1} of ${totalQuestions}</div>
            </div>
            
            <div class="question-container">
                <h3 class="question-title">${question.question}</h3>
                <p class="question-description">${question.description}</p>
                
                <div class="question-input">
                    ${this.renderQuestionInput(question)}
                </div>
                
                <div class="question-navigation">
                    ${this.currentQuestion > 0 ? '<button class="btn btn-outline" onclick="assessmentSystem.previousQuestion()">Previous</button>' : ''}
                    <button class="btn btn-primary" onclick="assessmentSystem.nextQuestion()" id="nextBtn">
                        ${this.currentQuestion === totalQuestions - 1 ? 'Complete Assessment' : 'Next Question'}
                    </button>
                </div>
            </div>
        `;
    }

    renderQuestionInput(question) {
        switch (question.type) {
            case 'scale':
                return this.renderScaleInput(question);
            case 'multiple':
                return this.renderMultipleChoice(question);
            case 'single':
                return this.renderSingleChoice(question);
            default:
                return '';
        }
    }

    renderScaleInput(question) {
        let html = '<div class="scale-input">';
        for (let i = question.scale.min; i <= question.scale.max; i++) {
            html += `
                <div class="scale-option">
                    <input type="radio" name="${question.id}" value="${i}" id="${question.id}_${i}">
                    <label for="${question.id}_${i}">
                        <div class="scale-number">${i}</div>
                        <div class="scale-label">${question.scale.labels[i]}</div>
                    </label>
                </div>
            `;
        }
        html += '</div>';
        return html;
    }

    renderMultipleChoice(question) {
        let html = '<div class="multiple-choice">';
        question.options.forEach(option => {
            html += `
                <div class="choice-option">
                    <input type="checkbox" name="${question.id}" value="${option.id}" id="${option.id}">
                    <label for="${option.id}">${option.text}</label>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    renderSingleChoice(question) {
        let html = '<div class="single-choice">';
        question.options.forEach(option => {
            html += `
                <div class="choice-option">
                    <input type="radio" name="${question.id}" value="${option.id}" id="${option.id}">
                    <label for="${option.id}">${option.text}</label>
                </div>
            `;
        });
        html += '</div>';
        return html;
    }

    nextQuestion() {
        // Collect current response
        const question = this.assessments[this.currentAssessment].questions[this.currentQuestion];
        const response = this.collectResponse(question);
        
        if (!response) {
            alert('Please answer the question before continuing.');
            return;
        }
        
        this.responses[question.id] = response;
        
        // Move to next question or complete assessment
        if (this.currentQuestion < this.assessments[this.currentAssessment].questions.length - 1) {
            this.currentQuestion++;
            this.renderQuestion();
        } else {
            this.completeAssessment();
        }
    }

    previousQuestion() {
        if (this.currentQuestion > 0) {
            this.currentQuestion--;
            this.renderQuestion();
        }
    }

    collectResponse(question) {
        switch (question.type) {
            case 'scale':
            case 'single':
                const selected = document.querySelector(`input[name="${question.id}"]:checked`);
                return selected ? selected.value : null;
            
            case 'multiple':
                const checkboxes = document.querySelectorAll(`input[name="${question.id}"]:checked`);
                return checkboxes.length > 0 ? Array.from(checkboxes).map(cb => cb.value) : null;
            
            default:
                return null;
        }
    }

    completeAssessment() {
        const results = this.calculateResults();
        this.renderResults(results);
        
        // Send results to server for lead capture
        this.submitResults(results);
    }

    calculateResults() {
        const assessment = this.assessments[this.currentAssessment];
        
        switch (this.currentAssessment) {
            case 'strategic-readiness':
                return this.calculateStrategicReadiness();
            case 'energy-audit':
                return this.calculateEnergyAudit();
            case 'organizational-maturity':
                return this.calculateOrganizationalMaturity();
            default:
                return {};
        }
    }

    calculateStrategicReadiness() {
        const responses = this.responses;
        
        // Calculate scores for different dimensions
        const strategicAuthority = parseInt(responses.strategic_authority) * 20;
        const organizationalInfluence = parseInt(responses.organizational_influence) * 20;
        const resourceScore = responses.resource_availability ? responses.resource_availability.length * 14.3 : 0;
        const implementationReadiness = this.calculateImplementationReadiness();
        
        const overallScore = Math.round((strategicAuthority + organizationalInfluence + resourceScore + implementationReadiness) / 4);
        
        return {
            overallScore,
            dimensions: {
                strategicAuthority,
                organizationalInfluence,
                resourceAvailability: Math.round(resourceScore),
                implementationReadiness: Math.round(implementationReadiness)
            },
            recommendation: this.getRecommendation(overallScore),
            nextSteps: this.getNextSteps(overallScore)
        };
    }

    calculateImplementationReadiness() {
        const timeline = this.responses.implementation_timeline;
        const challenges = this.responses.current_challenges?.length || 0;
        const metrics = this.responses.success_metrics?.length || 0;
        
        let score = 0;
        
        // Timeline scoring
        const timelineScores = {
            'immediate': 100,
            'short_term': 85,
            'medium_term': 70,
            'long_term': 55,
            'exploratory': 40
        };
        score += timelineScores[timeline] || 40;
        
        // Adjust based on challenge identification and success metrics
        score = (score + (challenges * 5) + (metrics * 3)) / 3;
        
        return Math.min(100, score);
    }

    getRecommendation(score) {
        if (score >= 80) {
            return {
                program: 'Mastery Program',
                description: 'You\'re ready for our most comprehensive program. Your high strategic authority and strong implementation readiness position you for executive-level transformation.',
                confidence: 'High'
            };
        } else if (score >= 65) {
            return {
                program: 'Amplification Program',
                description: 'You have strong foundations for AI integration. Our Amplification Program will help you build comprehensive strategic intelligence capabilities.',
                confidence: 'High'
            };
        } else if (score >= 45) {
            return {
                program: 'Foundation Program',
                description: 'Start with our Foundation Program to build strategic readiness and create a clear roadmap for AI integration.',
                confidence: 'Medium'
            };
        } else {
            return {
                program: 'Consultation',
                description: 'We recommend starting with a strategic consultation to identify the best pathway for your unique situation.',
                confidence: 'Medium'
            };
        }
    }

    getNextSteps(score) {
        const steps = [
            'Schedule a strategic consultation to discuss your specific needs',
            'Review our detailed program information',
            'Connect with our team to explore implementation options'
        ];
        
        if (score >= 65) {
            steps.unshift('Download our Strategic Intelligence Implementation Guide');
        }
        
        return steps;
    }

    calculateEnergyAudit() {
        // Simplified energy audit calculation
        const energyDrains = this.responses.energy_drains?.length || 0;
        const strategicTime = parseInt(this.responses.strategic_time) * 20;
        
        return {
            energyOptimizationScore: Math.max(0, 100 - (energyDrains * 8)),
            strategicTimeAllocation: strategicTime,
            recommendation: energyDrains > 4 ? 'High optimization potential' : 'Moderate optimization potential'
        };
    }

    calculateOrganizationalMaturity() {
        // Simplified organizational maturity calculation
        const changeReadiness = parseInt(this.responses.change_readiness) * 20;
        const technicalCapabilities = this.responses.technical_infrastructure?.length * 14.3 || 0;
        
        return {
            maturityScore: Math.round((changeReadiness + technicalCapabilities) / 2),
            recommendation: changeReadiness >= 60 ? 'Ready for transformation' : 'Needs preparation'
        };
    }

    renderResults(results) {
        const content = document.getElementById('assessmentContent');
        
        content.innerHTML = `
            <div class="results-container">
                <div class="results-header">
                    <i class="fas fa-chart-line results-icon"></i>
                    <h2>Your Assessment Results</h2>
                    <p>Based on your responses, here's your personalized strategic intelligence profile</p>
                </div>
                
                ${this.renderResultsContent(results)}
                
                <div class="results-actions">
                    <button class="btn btn-primary" onclick="assessmentSystem.scheduleConsultation()">
                        <i class="fas fa-calendar-check"></i>
                        Schedule Free Consultation
                    </button>
                    <button class="btn btn-outline" onclick="assessmentSystem.downloadResults()">
                        <i class="fas fa-download"></i>
                        Download Full Report
                    </button>
                </div>
                
                <div class="results-footer">
                    <p>Want to explore other assessments? <a href="#assessments" onclick="assessmentSystem.closeModal()">Take another assessment</a></p>
                </div>
            </div>
        `;
    }

    renderResultsContent(results) {
        switch (this.currentAssessment) {
            case 'strategic-readiness':
                return this.renderStrategicReadinessResults(results);
            case 'energy-audit':
                return this.renderEnergyAuditResults(results);
            case 'organizational-maturity':
                return this.renderOrganizationalMaturityResults(results);
            default:
                return '<p>Results calculated successfully.</p>';
        }
    }

    renderStrategicReadinessResults(results) {
        return `
            <div class="score-overview">
                <div class="overall-score">
                    <div class="score-circle">
                        <div class="score-number">${results.overallScore}</div>
                        <div class="score-label">Overall Readiness</div>
                    </div>
                </div>
                
                <div class="dimension-scores">
                    <div class="dimension">
                        <div class="dimension-name">Strategic Authority</div>
                        <div class="dimension-bar">
                            <div class="dimension-fill" style="width: ${results.dimensions.strategicAuthority}%"></div>
                        </div>
                        <div class="dimension-score">${results.dimensions.strategicAuthority}%</div>
                    </div>
                    
                    <div class="dimension">
                        <div class="dimension-name">Organizational Influence</div>
                        <div class="dimension-bar">
                            <div class="dimension-fill" style="width: ${results.dimensions.organizationalInfluence}%"></div>
                        </div>
                        <div class="dimension-score">${results.dimensions.organizationalInfluence}%</div>
                    </div>
                    
                    <div class="dimension">
                        <div class="dimension-name">Resource Availability</div>
                        <div class="dimension-bar">
                            <div class="dimension-fill" style="width: ${results.dimensions.resourceAvailability}%"></div>
                        </div>
                        <div class="dimension-score">${results.dimensions.resourceAvailability}%</div>
                    </div>
                    
                    <div class="dimension">
                        <div class="dimension-name">Implementation Readiness</div>
                        <div class="dimension-bar">
                            <div class="dimension-fill" style="width: ${results.dimensions.implementationReadiness}%"></div>
                        </div>
                        <div class="dimension-score">${results.dimensions.implementationReadiness}%</div>
                    </div>
                </div>
            </div>
            
            <div class="recommendation-section">
                <h3>Recommended Program</h3>
                <div class="recommendation-card">
                    <h4>${results.recommendation.program}</h4>
                    <p>${results.recommendation.description}</p>
                    <div class="confidence-badge">Confidence: ${results.recommendation.confidence}</div>
                </div>
                
                <h3>Next Steps</h3>
                <ul class="next-steps-list">
                    ${results.nextSteps.map(step => `<li>${step}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    renderEnergyAuditResults(results) {
        return `
            <div class="energy-results">
                <div class="energy-score">
                    <h3>Energy Optimization Score</h3>
                    <div class="score-display">${results.energyOptimizationScore}%</div>
                </div>
                
                <div class="strategic-time">
                    <h3>Strategic Time Allocation</h3>
                    <div class="score-display">${results.strategicTimeAllocation}%</div>
                </div>
                
                <div class="recommendation">
                    <h3>Recommendation</h3>
                    <p>${results.recommendation}</p>
                </div>
            </div>
        `;
    }

    renderOrganizationalMaturityResults(results) {
        return `
            <div class="maturity-results">
                <div class="maturity-score">
                    <h3>Organizational Maturity Score</h3>
                    <div class="score-display">${results.maturityScore}%</div>
                </div>
                
                <div class="recommendation">
                    <h3>Assessment</h3>
                    <p>${results.recommendation}</p>
                </div>
            </div>
        `;
    }

    scheduleConsultation() {
        // Redirect to contact page with assessment context
        window.location.href = `../contact.html?source=assessment&type=${this.currentAssessment}`;
    }

    downloadResults() {
        // Generate and download PDF report
        this.generatePDFReport();
    }

    async submitResults(results) {
        try {
            const response = await fetch('/api/assessment-results', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    assessmentType: this.currentAssessment,
                    responses: this.responses,
                    results: results,
                    timestamp: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                console.log('Assessment results submitted successfully');
            }
        } catch (error) {
            console.error('Failed to submit assessment results:', error);
        }
    }

    generatePDFReport() {
        // Placeholder for PDF generation
        alert('PDF report generation will be implemented in the next phase.');
    }
}

// Initialize assessment system when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.assessmentSystem = new AssessmentSystem();
});

// Add CSS for assessment modal and components
const assessmentCSS = `
.modal {
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

.modal-content {
    background: white;
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    position: relative;
}

.modal-header {
    padding: 2rem;
    border-bottom: 1px solid #e5e7eb;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-header h2 {
    margin: 0;
    color: var(--depth-charcoal);
}

.modal-close {
    background: none;
    border: none;
    font-size: 2rem;
    cursor: pointer;
    color: var(--calm-gray);
    padding: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: background-color 0.3s ease;
}

.modal-close:hover {
    background-color: #f3f4f6;
}

.modal-body {
    padding: 2rem;
}

.assessment-progress {
    margin-bottom: 2rem;
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
    background: linear-gradient(90deg, var(--clarity-blue), var(--insight-green));
    transition: width 0.3s ease;
}

.progress-text {
    text-align: center;
    color: var(--calm-gray);
    font-size: 0.9rem;
}

.question-container {
    max-width: 600px;
    margin: 0 auto;
}

.question-title {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--depth-charcoal);
    line-height: 1.4;
}

.question-description {
    color: var(--calm-gray);
    margin-bottom: 2rem;
    line-height: 1.6;
}

.question-input {
    margin-bottom: 3rem;
}

.scale-input {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.scale-option {
    position: relative;
}

.scale-option input[type="radio"] {
    position: absolute;
    opacity: 0;
    cursor: pointer;
}

.scale-option label {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.scale-option input[type="radio"]:checked + label {
    border-color: var(--clarity-blue);
    background: rgba(46, 91, 186, 0.05);
}

.scale-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--clarity-blue);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    flex-shrink: 0;
}

.scale-label {
    flex: 1;
    font-weight: 500;
}

.multiple-choice,
.single-choice {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.choice-option {
    position: relative;
}

.choice-option input {
    position: absolute;
    opacity: 0;
    cursor: pointer;
}

.choice-option label {
    display: block;
    padding: 1rem;
    border: 2px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
}

.choice-option input:checked + label {
    border-color: var(--clarity-blue);
    background: rgba(46, 91, 186, 0.05);
}

.question-navigation {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
}

.results-container {
    text-align: center;
}

.results-header {
    margin-bottom: 3rem;
}

.results-icon {
    font-size: 3rem;
    color: var(--clarity-blue);
    margin-bottom: 1rem;
}

.results-header h2 {
    margin-bottom: 1rem;
    color: var(--depth-charcoal);
}

.score-overview {
    margin-bottom: 3rem;
}

.overall-score {
    margin-bottom: 2rem;
}

.score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--clarity-blue), var(--insight-green));
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto;
    color: white;
}

.score-number {
    font-size: 2rem;
    font-weight: 700;
}

.score-label {
    font-size: 0.9rem;
    opacity: 0.9;
}

.dimension-scores {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    max-width: 500px;
    margin: 0 auto;
}

.dimension {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.dimension-name {
    flex: 1;
    text-align: left;
    font-weight: 500;
}

.dimension-bar {
    flex: 2;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
}

.dimension-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--clarity-blue), var(--insight-green));
    transition: width 0.3s ease;
}

.dimension-score {
    width: 50px;
    text-align: right;
    font-weight: 600;
    color: var(--clarity-blue);
}

.recommendation-section {
    text-align: left;
    max-width: 600px;
    margin: 0 auto 3rem;
}

.recommendation-card {
    background: var(--subtle-gray);
    padding: 2rem;
    border-radius: 12px;
    margin-bottom: 2rem;
}

.recommendation-card h4 {
    color: var(--clarity-blue);
    margin-bottom: 1rem;
    font-size: 1.3rem;
}

.confidence-badge {
    display: inline-block;
    background: var(--insight-green);
    color: white;
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    margin-top: 1rem;
}

.next-steps-list {
    list-style: none;
    padding: 0;
}

.next-steps-list li {
    padding: 0.5rem 0;
    padding-left: 2rem;
    position: relative;
}

.next-steps-list li:before {
    content: "→";
    position: absolute;
    left: 0;
    color: var(--clarity-blue);
    font-weight: bold;
}

.results-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.results-footer {
    padding-top: 2rem;
    border-top: 1px solid #e5e7eb;
    color: var(--calm-gray);
}

.assessment-duration {
    color: var(--calm-gray);
    font-size: 0.9rem;
    font-style: italic;
}

@media (max-width: 768px) {
    .modal-content {
        width: 95%;
        margin: 1rem;
    }
    
    .modal-header,
    .modal-body {
        padding: 1.5rem;
    }
    
    .scale-option label {
        flex-direction: column;
        text-align: center;
        gap: 0.5rem;
    }
    
    .dimension {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }
    
    .dimension-name {
        text-align: center;
    }
    
    .results-actions {
        flex-direction: column;
        align-items: center;
    }
    
    .results-actions .btn {
        width: 100%;
        max-width: 300px;
    }
}
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = assessmentCSS;
document.head.appendChild(style);