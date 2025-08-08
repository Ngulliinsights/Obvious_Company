-- AI Assessment Platform Database Schema
-- PostgreSQL Schema for comprehensive assessment system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    
    -- Demographics
    age_range VARCHAR(50),
    geographic_region VARCHAR(100),
    cultural_context TEXT[], -- Array of cultural identifiers
    languages TEXT[], -- Array of language codes
    
    -- Professional information
    industry VARCHAR(100),
    role_level VARCHAR(100),
    organization_size VARCHAR(50),
    decision_authority INTEGER CHECK (decision_authority >= 1 AND decision_authority <= 10),
    years_experience INTEGER,
    
    -- Preferences
    assessment_modality TEXT[], -- Preferred assessment types
    learning_style VARCHAR(100),
    communication_preference VARCHAR(100),
    timezone VARCHAR(50),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Indexes
    CONSTRAINT valid_decision_authority CHECK (decision_authority BETWEEN 1 AND 10)
);

-- Assessment sessions table
CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    
    -- Session details
    assessment_type VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    
    -- Timing metadata
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completion_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    
    -- Assessment metadata
    modality_used VARCHAR(100),
    cultural_adaptations TEXT[],
    
    -- Progress tracking
    current_question_index INTEGER DEFAULT 0,
    total_questions INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment responses table
CREATE TABLE assessment_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    
    -- Question details
    question_id VARCHAR(100) NOT NULL,
    question_type VARCHAR(50) NOT NULL,
    question_text TEXT NOT NULL,
    
    -- Response data
    response_value JSONB NOT NULL, -- Flexible response storage
    response_time_seconds INTEGER,
    
    -- Metadata
    question_order INTEGER,
    cultural_adaptation_applied BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessment results table
CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    
    -- Overall scoring
    overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    
    -- Dimension scores
    strategic_authority DECIMAL(5,2) CHECK (strategic_authority >= 0 AND strategic_authority <= 100),
    organizational_influence DECIMAL(5,2) CHECK (organizational_influence >= 0 AND organizational_influence <= 100),
    resource_availability DECIMAL(5,2) CHECK (resource_availability >= 0 AND resource_availability <= 100),
    implementation_readiness DECIMAL(5,2) CHECK (implementation_readiness >= 0 AND implementation_readiness <= 100),
    cultural_alignment DECIMAL(5,2) CHECK (cultural_alignment >= 0 AND cultural_alignment <= 100),
    
    -- Persona classification
    primary_persona VARCHAR(100) NOT NULL,
    persona_confidence_score DECIMAL(5,2) CHECK (persona_confidence_score >= 0 AND persona_confidence_score <= 100),
    secondary_characteristics TEXT[],
    
    -- Industry insights
    sector_readiness DECIMAL(5,2) CHECK (sector_readiness >= 0 AND sector_readiness <= 100),
    regulatory_considerations TEXT[],
    implementation_priorities TEXT[],
    
    -- Recommendations
    program_recommendation VARCHAR(200),
    next_steps TEXT[],
    timeline_suggestion VARCHAR(100),
    resource_requirements TEXT[],
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Curriculum recommendations table
CREATE TABLE curriculum_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    result_id UUID REFERENCES assessment_results(id) ON DELETE CASCADE,
    
    -- Pathway details
    pathway_id VARCHAR(100) NOT NULL,
    
    -- Module assignments
    foundation_modules JSONB NOT NULL,
    industry_modules JSONB NOT NULL,
    role_specific_modules JSONB NOT NULL,
    cultural_adaptation_modules JSONB NOT NULL,
    
    -- Time estimates
    total_hours INTEGER,
    weekly_commitment INTEGER,
    completion_timeline VARCHAR(100),
    
    -- Learning framework
    learning_objectives TEXT[],
    success_metrics TEXT[],
    prerequisites TEXT[],
    optional_enhancements JSONB,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics and tracking table
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    
    -- Behavioral metrics
    page_views INTEGER DEFAULT 0,
    time_on_platform INTEGER, -- seconds
    interaction_count INTEGER DEFAULT 0,
    
    -- Engagement patterns
    preferred_question_types TEXT[],
    abandonment_points TEXT[],
    completion_patterns JSONB,
    
    -- Performance metrics
    response_accuracy DECIMAL(5,2),
    engagement_score DECIMAL(5,2),
    
    -- Tracking metadata
    user_agent TEXT,
    ip_address INET,
    referrer_url TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Industry configurations table
CREATE TABLE industry_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    industry_name VARCHAR(100) UNIQUE NOT NULL,
    
    -- Industry-specific settings
    question_sets JSONB NOT NULL,
    scoring_weights JSONB NOT NULL,
    cultural_considerations JSONB,
    regulatory_frameworks TEXT[],
    
    -- Customization options
    use_cases JSONB,
    roi_examples JSONB,
    implementation_approaches JSONB,
    
    -- Metadata
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_industry ON user_profiles(industry);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

CREATE INDEX idx_assessment_sessions_user_id ON assessment_sessions(user_id);
CREATE INDEX idx_assessment_sessions_status ON assessment_sessions(status);
CREATE INDEX idx_assessment_sessions_created_at ON assessment_sessions(created_at);

CREATE INDEX idx_assessment_responses_session_id ON assessment_responses(session_id);
CREATE INDEX idx_assessment_responses_question_type ON assessment_responses(question_type);

CREATE INDEX idx_assessment_results_session_id ON assessment_results(session_id);
CREATE INDEX idx_assessment_results_primary_persona ON assessment_results(primary_persona);

CREATE INDEX idx_curriculum_recommendations_result_id ON curriculum_recommendations(result_id);

CREATE INDEX idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX idx_user_analytics_session_id ON user_analytics(session_id);
CREATE INDEX idx_user_analytics_created_at ON user_analytics(created_at);

CREATE INDEX idx_industry_configurations_industry_name ON industry_configurations(industry_name);
CREATE INDEX idx_industry_configurations_active ON industry_configurations(active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assessment_sessions_updated_at BEFORE UPDATE ON assessment_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_industry_configurations_updated_at BEFORE UPDATE ON industry_configurations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();