-- AI Integration Assessment Platform Database Schema
-- Initialize database with proper permissions and extensions

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas
CREATE SCHEMA IF NOT EXISTS assessment;
CREATE SCHEMA IF NOT EXISTS analytics;
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant permissions
GRANT USAGE ON SCHEMA assessment TO assessment_user;
GRANT USAGE ON SCHEMA analytics TO assessment_user;
GRANT USAGE ON SCHEMA audit TO assessment_user;

GRANT CREATE ON SCHEMA assessment TO assessment_user;
GRANT CREATE ON SCHEMA analytics TO assessment_user;
GRANT CREATE ON SCHEMA audit TO assessment_user;

-- Users table
CREATE TABLE IF NOT EXISTS assessment.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    profile JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'active'
);

-- Assessment sessions table
CREATE TABLE IF NOT EXISTS assessment.sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES assessment.users(id) ON DELETE CASCADE,
    assessment_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress',
    responses JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    results JSONB,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment results table
CREATE TABLE IF NOT EXISTS assessment.results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES assessment.sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES assessment.users(id) ON DELETE CASCADE,
    overall_score DECIMAL(5,2),
    dimension_scores JSONB NOT NULL DEFAULT '{}',
    persona_classification JSONB NOT NULL DEFAULT '{}',
    industry_insights JSONB NOT NULL DEFAULT '{}',
    recommendations JSONB NOT NULL DEFAULT '{}',
    curriculum_pathway JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events table
CREATE TABLE IF NOT EXISTS analytics.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES assessment.users(id) ON DELETE SET NULL,
    session_id UUID REFERENCES assessment.sessions(id) ON DELETE SET NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Audit log table
CREATE TABLE IF NOT EXISTS audit.logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES assessment.users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    details JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON assessment.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON assessment.users(created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON assessment.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON assessment.sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON assessment.sessions(started_at);

CREATE INDEX IF NOT EXISTS idx_results_user_id ON assessment.results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_session_id ON assessment.results(session_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON assessment.results(created_at);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON analytics.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON analytics.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON analytics.events(timestamp);

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit.logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit.logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit.logs(timestamp);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON assessment.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON assessment.sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_results_updated_at BEFORE UPDATE ON assessment.results
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();