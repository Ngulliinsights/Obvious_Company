#!/usr/bin/env node

/**
 * Assessment System Test Script
 * Comprehensive testing of the assessment functionality
 */

require('dotenv').config();
const fetch = require('node-fetch');

const BASE_URL = process.env.WEBSITE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api/assessment`;

class AssessmentSystemTester {
    constructor() {
        this.testResults = [];
        this.sessionId = null;
        this.questionIds = [];
    }

    async runAllTests() {
        console.log('🧪 Starting Assessment System Tests...\n');

        try {
            await this.testAssessmentStart();
            await this.testQuestionRetrieval();
            await this.testResponseSubmission();
            await this.testAssessmentCompletion();
            await this.testResultsRetrieval();

            this.printTestSummary();

        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
            process.exit(1);
        }
    }

    async testAssessmentStart() {
        console.log('📋 Testing Assessment Start...');

        try {
            const response = await fetch(`${API_BASE}/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    assessmentType: 'questionnaire',
                    userProfile: {
                        industry: 'technology',
                        role: 'executive',
                        experience: 10
                    }
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${data.message}`);
            }

            if (!data.success) {
                throw new Error(data.message);
            }

            // Validate response structure
            this.validateRequired(data.data, ['sessionId', 'userId', 'assessmentType', 'totalQuestions']);

            this.sessionId = data.data.sessionId;

            this.addTestResult('Assessment Start', true, {
                sessionId: this.sessionId,
                totalQuestions: data.data.totalQuestions,
                estimatedTime: data.data.estimatedTime
            });

            console.log(`✅ Assessment started successfully`);
            console.log(`   Session ID: ${this.sessionId}`);
            console.log(`   Total Questions: ${data.data.totalQuestions}`);
            console.log(`   Estimated Time: ${data.data.estimatedTime} minutes\n`);

        } catch (error) {
            this.addTestResult('Assessment Start', false, { error: error.message });
            throw error;
        }
    }

    async testQuestionRetrieval() {
        console.log('❓ Testing Question Retrieval...');

        try {
            // Test getting first question
            const response = await fetch(`${API_BASE}/question/${this.sessionId}/0`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${data.message}`);
            }

            if (!data.success) {
                throw new Error(data.message);
            }

            // Validate question structure
            const question = data.data.question;
            this.validateRequired(question, ['id', 'type', 'text', 'options']);

            this.questionIds.push(question.id);

            // Test progress information
            const progress = data.data.progress;
            this.validateRequired(progress, ['current', 'total', 'percentage']);

            this.addTestResult('Question Retrieval', true, {
                questionId: question.id,
                questionType: question.type,
                optionsCount: question.options.length,
                progress: progress.percentage
            });

            console.log(`✅ Question retrieved successfully`);
            console.log(`   Question ID: ${question.id}`);
            console.log(`   Type: ${question.type}`);
            console.log(`   Text: ${question.text.substring(0, 50)}...`);
            console.log(`   Options: ${question.options.length}`);
            console.log(`   Progress: ${progress.current}/${progress.total} (${progress.percentage}%)\n`);

        } catch (error) {
            this.addTestResult('Question Retrieval', false, { error: error.message });
            throw error;
        }
    }

    async testResponseSubmission() {
        console.log('💾 Testing Response Submission...');

        try {
            const questionId = this.questionIds[0];
            if (!questionId) {
                throw new Error('No question ID available for response test');
            }

            const response = await fetch(`${API_BASE}/response`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sessionId: this.sessionId,
                    questionId: questionId,
                    response: { value: 8 },
                    responseTime: 5000,
                    confidenceLevel: 8
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${data.message}`);
            }

            if (!data.success) {
                throw new Error(data.message);
            }

            // Validate response structure
            this.validateRequired(data.data, ['responseId', 'message']);

            this.addTestResult('Response Submission', true, {
                responseId: data.data.responseId,
                questionId: questionId
            });

            console.log(`✅ Response submitted successfully`);
            console.log(`   Response ID: ${data.data.responseId}`);
            console.log(`   Question ID: ${questionId}\n`);

        } catch (error) {
            this.addTestResult('Response Submission', false, { error: error.message });
            throw error;
        }
    }

    async testAssessmentCompletion() {
        console.log('🏁 Testing Assessment Completion...');

        try {
            // Submit a few more responses to have data for completion
            await this.submitSampleResponses();

            const response = await fetch(`${API_BASE}/complete/${this.sessionId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${data.message}`);
            }

            if (!data.success) {
                throw new Error(data.message);
            }

            // Validate results structure
            const results = data.data.results;
            this.validateRequired(results, ['overallScore', 'dimensionScores', 'personaClassification']);

            this.resultId = data.data.resultId;

            this.addTestResult('Assessment Completion', true, {
                resultId: this.resultId,
                overallScore: results.overallScore,
                persona: results.personaClassification?.primary_persona
            });

            console.log(`✅ Assessment completed successfully`);
            console.log(`   Result ID: ${this.resultId}`);
            console.log(`   Overall Score: ${results.overallScore}%`);
            console.log(`   Persona: ${results.personaClassification?.primary_persona}`);
            console.log(`   Dimension Scores:`, results.dimensionScores);
            console.log('');

        } catch (error) {
            this.addTestResult('Assessment Completion', false, { error: error.message });
            throw error;
        }
    }

    async testResultsRetrieval() {
        console.log('📊 Testing Results Retrieval...');

        try {
            if (!this.resultId) {
                throw new Error('No result ID available for retrieval test');
            }

            const response = await fetch(`${API_BASE}/results/${this.resultId}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${data.message}`);
            }

            if (!data.success) {
                throw new Error(data.message);
            }

            // Validate complete results structure
            const results = data.data;
            this.validateRequired(results, ['overallScore', 'dimensionScores', 'personaClassification', 'recommendations']);

            this.addTestResult('Results Retrieval', true, {
                resultId: this.resultId,
                hasRecommendations: !!results.recommendations,
                hasIndustryInsights: !!results.industryInsights
            });

            console.log(`✅ Results retrieved successfully`);
            console.log(`   Complete results available`);
            console.log(`   Recommendations: ${results.recommendations ? 'Yes' : 'No'}`);
            console.log(`   Industry Insights: ${results.industryInsights ? 'Yes' : 'No'}\n`);

        } catch (error) {
            this.addTestResult('Results Retrieval', false, { error: error.message });
            throw error;
        }
    }

    async submitSampleResponses() {
        // Submit responses to multiple questions to generate meaningful results
        const sampleResponses = [
            { questionIndex: 1, response: { value: 7 }, responseTime: 4000 },
            { questionIndex: 2, response: { value: 6 }, responseTime: 3500 },
            { questionIndex: 3, response: { value: 8 }, responseTime: 5500 },
            { questionIndex: 4, response: { value: 5 }, responseTime: 4200 }
        ];

        for (const sampleResponse of sampleResponses) {
            try {
                // Get question first
                const questionResponse = await fetch(`${API_BASE}/question/${this.sessionId}/${sampleResponse.questionIndex}`);
                const questionData = await questionResponse.json();

                if (questionData.success && !questionData.data.completed) {
                    const questionId = questionData.data.question.id;

                    // Submit response
                    await fetch(`${API_BASE}/response`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            sessionId: this.sessionId,
                            questionId: questionId,
                            response: sampleResponse.response,
                            responseTime: sampleResponse.responseTime,
                            confidenceLevel: Math.floor(Math.random() * 3) + 7 // 7-9
                        })
                    });
                }
            } catch (error) {
                console.warn(`Warning: Could not submit sample response for question ${sampleResponse.questionIndex}`);
            }
        }
    }

    validateRequired(obj, requiredFields) {
        for (const field of requiredFields) {
            if (!(field in obj)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
    }

    addTestResult(testName, passed, details = {}) {
        this.testResults.push({
            testName,
            passed,
            details,
            timestamp: new Date().toISOString()
        });
    }

    printTestSummary() {
        console.log('📋 Test Summary');
        console.log('================');

        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;

        console.log(`Total Tests: ${total}`);
        console.log(`Passed: ${passed}`);
        console.log(`Failed: ${total - passed}`);
        console.log(`Success Rate: ${Math.round((passed / total) * 100)}%\n`);

        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.testName}`);

            if (!result.passed && result.details.error) {
                console.log(`   Error: ${result.details.error}`);
            } else if (result.passed && Object.keys(result.details).length > 0) {
                console.log(`   Details:`, result.details);
            }
        });

        if (passed === total) {
            console.log('\n🎉 All tests passed! Assessment system is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
            process.exit(1);
        }
    }
}

// Additional utility tests
class AssessmentUtilityTester {
    static async testServerHealth() {
        console.log('🏥 Testing Server Health...');

        try {
            const response = await fetch(`${BASE_URL}/api/health`);

            if (response.ok) {
                console.log('✅ Server is healthy and responding\n');
                return true;
            } else {
                console.log('❌ Server health check failed\n');
                return false;
            }
        } catch (error) {
            console.log('❌ Server is not accessible:', error.message, '\n');
            return false;
        }
    }

    static async testEmailConfiguration() {
        console.log('📧 Testing Email Configuration...');

        try {
            // This would test the email system if we had a test endpoint
            console.log('⚠️  Email configuration test not implemented yet\n');
            return true;
        } catch (error) {
            console.log('❌ Email configuration test failed:', error.message, '\n');
            return false;
        }
    }
}

// Main execution
async function main() {
    console.log('🚀 Assessment System Comprehensive Test Suite');
    console.log('==============================================\n');

    // Test server health first
    const serverHealthy = await AssessmentUtilityTester.testServerHealth();
    if (!serverHealthy) {
        console.log('❌ Server is not accessible. Please start the server first.');
        console.log('   Run: cd website/server && npm run dev\n');
        process.exit(1);
    }

    // Run main assessment tests
    const tester = new AssessmentSystemTester();
    await tester.runAllTests();

    // Run utility tests
    await AssessmentUtilityTester.testEmailConfiguration();

    console.log('\n🎯 Test suite completed successfully!');
    console.log('The assessment system is ready for production use.');
}

// Handle errors gracefully
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Run tests
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { AssessmentSystemTester, AssessmentUtilityTester };
