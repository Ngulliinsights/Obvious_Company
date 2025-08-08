-- AI Integration Assessment Platform Database Schema
-- Based on requirements 1.1, 9.1, 10.1

-- Enable UUID extension for PostgreSQL
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    demographics_json JSONB NOT NULL,
    professional_json JSONB NOT NULL,
    preferences_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessment sessions table
CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(50) NOT NULL CHECK (assessment_type IN ('questionnaire', 'scenario_based', 'conversational', 'visual_pattern', 'behavioral')),
    status VARCHAR(20) NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'abandoned')),
    metadata_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Questions table (for storing assessment questions)
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('multiple_choice', 'scale_rating', 'text_input', 'scenario_response', 'visual_selection', 'behavioral_observation')),
    text TEXT NOT NULL,
    description TEXT,
    options_json JSONB,
    validation_rules_json JSONB NOT NULL DEFAULT '[]',
    cultural_adaptations_json JSONB DEFAULT '[]',
    industry_specific BOOLEAN DEFAULT FALSE,
    weight DECIMAL(3,2) NOT NULL DEFAULT 1.0,
    dimension VARCHAR(100) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    order_index INTEGER NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessment responses table
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    response_value_json JSONB NOT NULL,
    response_time_ms INTEGER NOT NULL,
    confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
    metadata_json JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assessment results table
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    overall_score DECIMAL(5,2) NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    dimension_scores_json JSONB NOT NULL,
    persona_classification_json JSONB NOT NULL,
    industry_insights_json JSONB NOT NULL,
    recommendations_json JSONB NOT NULL,
    curriculum_pathway_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Error logs table for tracking assessment issues
CREATE TABLE assessment_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL CHECK (type IN ('validation', 'processing', 'database', 'external')),
    message TEXT NOT NULL,
    details_json JSONB,
    session_id UUID REFERENCES assessment_sessions(id),
    user_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analytics table for performance tracking
CREATE TABLE assessment_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_type VARCHAR(100) NOT NULL,
    event_data_json JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_professional_industry ON users USING GIN ((professional_json->>'industry'));

CREATE INDEX idx_assessment_sessions_user_id ON assessment_sessions(user_id);
CREATE INDEX idx_assessment_sessions_status ON assessment_sessions(status);
CREATE INDEX idx_assessment_sessions_type ON assessment_sessions(assessment_type);
CREATE INDEX idx_assessment_sessions_created_at ON assessment_sessions(created_at);

CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_assessment_type ON questions(assessment_type);
CREATE INDEX idx_questions_dimension ON questions(dimension);
CREATE INDEX idx_questions_order ON questions(assessment_type, order_index);
CREATE INDEX idx_questions_active ON questions(active);

CREATE INDEX idx_responses_session_id ON assessment_responses(session_id);
CREATE INDEX idx_responses_user_id ON assessment_responses(user_id);
CREATE INDEX idx_responses_question_id ON assessment_responses(question_id);
CREATE INDEX idx_responses_created_at ON assessment_responses(created_at);

CREATE INDEX idx_results_session_id ON assessment_results(session_id);
CREATE INDEX idx_results_user_id ON assessment_results(user_id);
CREATE INDEX idx_results_persona ON assessment_results USING GIN ((persona_classification_json->>'primary_persona'));
CREATE INDEX idx_results_created_at ON assessment_results(created_at);

CREATE INDEX idx_errors_type ON assessment_errors(type);
CREATE INDEX idx_errors_session_id ON assessment_errors(session_id);
CREATE INDEX idx_errors_created_at ON assessment_errors(created_at);

CREATE INDEX idx_analytics_session_id ON assessment_analytics(session_id);
CREATE INDEX idx_analytics_event_type ON assessment_analytics(event_type);
CREATE INDEX idx_analytics_timestamp ON assessment_analytics(timestamp);

-- Triggers for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_sessions_updated_at BEFORE UPDATE ON assessment_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW user_assessment_summary AS
SELECT 
    u.id as user_id,
    u.professional_json->>'industry' as industry,
    u.professional_json->>'role_level' as role_level,
    COUNT(DISTINCT s.id) as total_assessments,
    COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) as completed_assessments,
    MAX(s.created_at) as last_assessment_date,
    AVG(CASE WHEN r.overall_score IS NOT NULL THEN r.overall_score END) as avg_score
FROM users u
LEFT JOIN assessment_sessions s ON u.id = s.user_id
LEFT JOIN assessment_results r ON s.id = r.session_id
GROUP BY u.id, u.professional_json->>'industry', u.professional_json->>'role_level';

CREATE VIEW assessment_performance_metrics AS
SELECT 
    assessment_type,
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned_sessions,
    ROUND(
        COUNT(CASE WHEN status = 'completed' THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as completion_rate,
    AVG(EXTRACT(EPOCH FROM (updated_at - created_at))/60) as avg_duration_minutes
FROM assessment_sessions
GROUP BY assessment_type;

-- Sample data insertion for testing
INSERT INTO questions (type, text, description, options_json, validation_rules_json, dimension, assessment_type, order_index) VALUES
('multiple_choice', 'What is your primary role in AI decision-making within your organization?', 'This helps us understand your level of authority and influence in AI initiatives.', 
 '[{"id": "1", "text": "I make final decisions on AI investments", "value": 10}, {"id": "2", "text": "I influence AI strategy significantly", "value": 8}, {"id": "3", "text": "I contribute to AI discussions", "value": 6}, {"id": "4", "text": "I implement AI decisions made by others", "value": 4}, {"id": "5", "text": "I observe AI developments", "value": 2}]',
 '[{"type": "required", "message": "Please select your role in AI decision-making"}]',
 'strategic_authority', 'questionnaire', 1),

('scale_rating', 'How would you rate your organization''s current AI readiness?', 'Consider factors like data infrastructure, team capabilities, and leadership support.',
 '[{"id": "1", "text": "Not ready at all", "value": 1}, {"id": "10", "text": "Fully ready", "value": 10}]',
 '[{"type": "required", "message": "Please rate your organization''s AI readiness"}, {"type": "range", "value": {"min": 1, "max": 10}, "message": "Rating must be between 1 and 10"}]',
 'implementation_readiness', 'questionnaire', 2),

('multiple_choice', 'What is your organization''s primary industry?', 'This helps us provide industry-specific insights and recommendations.',
 '[{"id": "financial", "text": "Financial Services", "value": "financial"}, {"id": "manufacturing", "text": "Manufacturing", "value": "manufacturing"}, {"id": "healthcare", "text": "Healthcare", "value": "healthcare"}, {"id": "government", "text": "Government", "value": "government"}, {"id": "technology", "text": "Technology", "value": "technology"}, {"id": "other", "text": "Other", "value": "other"}]',
 '[{"type": "required", "message": "Please select your industry"}]',
 'industry_context', 'questionnaire', 3);
-- 
Audit and Compliance System Tables
-- Based on requirements 7.1, 9.1, 10.1

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(255) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    user_id VARCHAR(255),
    session_id VARCHAR(255),
    resource VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    compliance_flags JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Compliance violations table
CREATE TABLE IF NOT EXISTS compliance_violations (
    id VARCHAR(255) PRIMARY KEY,
    rule_id VARCHAR(255) NOT NULL,
    rule_name VARCHAR(255) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    event_ids JSONB,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security test results table
CREATE TABLE IF NOT EXISTS security_test_results (
    id SERIAL PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('passed', 'failed', 'warning', 'error')),
    vulnerabilities_count INTEGER DEFAULT 0,
    execution_time INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Security vulnerabilities table
CREATE TABLE IF NOT EXISTS security_vulnerabilities (
    id VARCHAR(255) PRIMARY KEY,
    test_id VARCHAR(255) NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN ('authentication', 'authorization', 'input_validation', 'data_protection', 'session_management')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    description TEXT NOT NULL,
    evidence JSONB,
    detected_at TIMESTAMP WITH TIME ZONE NOT NULL,
    resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by VARCHAR(255),
    mitigation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Anonymization log table
CREATE TABLE IF NOT EXISTS anonymization_log (
    id VARCHAR(255) PRIMARY KEY,
    activity VARCHAR(255) NOT NULL,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for audit and compliance tables
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_session_id ON audit_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE INDEX IF NOT EXISTS idx_compliance_violations_detected_at ON compliance_violations(detected_at);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_resolved ON compliance_violations(resolved);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_severity ON compliance_violations(severity);
CREATE INDEX IF NOT EXISTS idx_compliance_violations_rule_id ON compliance_violations(rule_id);

CREATE INDEX IF NOT EXISTS idx_security_test_results_timestamp ON security_test_results(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_test_results_test_id ON security_test_results(test_id);
CREATE INDEX IF NOT EXISTS idx_security_test_results_status ON security_test_results(status);

CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_detected_at ON security_vulnerabilities(detected_at);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_severity ON security_vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_resolved ON security_vulnerabilities(resolved);
CREATE INDEX IF NOT EXISTS idx_security_vulnerabilities_category ON security_vulnerabilities(category);

CREATE INDEX IF NOT EXISTS idx_anonymization_log_timestamp ON anonymization_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_anonymization_log_activity ON anonymization_log(activity);

-- Views for audit and compliance reporting
CREATE VIEW audit_summary AS
SELECT 
    DATE_TRUNC('day', timestamp) as date,
    event_type,
    severity,
    COUNT(*) as event_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT session_id) as unique_sessions
FROM audit_logs
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE_TRUNC('day', timestamp), event_type, severity
ORDER BY date DESC, event_count DESC;

CREATE VIEW compliance_dashboard AS
SELECT 
    DATE_TRUNC('week', detected_at) as week,
    severity,
    COUNT(*) as total_violations,
    COUNT(CASE WHEN resolved = true THEN 1 END) as resolved_violations,
    COUNT(CASE WHEN resolved = false THEN 1 END) as open_violations,
    ROUND(
        COUNT(CASE WHEN resolved = true THEN 1 END)::DECIMAL / 
        NULLIF(COUNT(*), 0) * 100, 2
    ) as resolution_rate
FROM compliance_violations
WHERE detected_at >= CURRENT_DATE - INTERVAL '90 days'
GROUP BY DATE_TRUNC('week', detected_at), severity
ORDER BY week DESC, severity;

CREATE VIEW security_test_summary AS
SELECT 
    test_id,
    test_name,
    COUNT(*) as total_runs,
    COUNT(CASE WHEN status = 'passed' THEN 1 END) as passed_runs,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_runs,
    SUM(vulnerabilities_count) as total_vulnerabilities,
    AVG(execution_time) as avg_execution_time,
    MAX(timestamp) as last_run
FROM security_test_results
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY test_id, test_name
ORDER BY total_vulnerabilities DESC, last_run DESC;