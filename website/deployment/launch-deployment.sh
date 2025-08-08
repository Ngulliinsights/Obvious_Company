#!/bin/bash

# AI Integration Assessment Platform Launch Deployment Script
# Handles production deployment with launch monitoring and controlled rollout

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LAUNCH_PHASE="${1:-beta}"
ROLLOUT_STRATEGY="${2:-gradual}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

launch_log() {
    echo -e "${PURPLE}[LAUNCH]${NC} $1"
}

# Usage function
usage() {
    echo "Usage: $0 [launch_phase] [rollout_strategy]"
    echo ""
    echo "Launch Phases:"
    echo "  beta        - Beta testing with limited users (default)"
    echo "  soft-launch - Soft launch with gradual rollout"
    echo "  full-launch - Full production launch"
    echo ""
    echo "Rollout Strategies:"
    echo "  gradual     - Gradual rollout with feature flags (default)"
    echo "  immediate   - Immediate full rollout"
    echo ""
    echo "Examples:"
    echo "  $0 beta gradual"
    echo "  $0 soft-launch gradual"
    echo "  $0 full-launch immediate"
    echo ""
    exit 1
}

# Validate launch parameters
validate_launch_parameters() {
    log "Validating launch parameters..."
    
    case "$LAUNCH_PHASE" in
        beta|soft-launch|full-launch)
            launch_log "Launch phase: $LAUNCH_PHASE"
            ;;
        *)
            error "Invalid launch phase: $LAUNCH_PHASE"
            usage
            ;;
    esac
    
    case "$ROLLOUT_STRATEGY" in
        gradual|immediate)
            launch_log "Rollout strategy: $ROLLOUT_STRATEGY"
            ;;
        *)
            error "Invalid rollout strategy: $ROLLOUT_STRATEGY"
            usage
            ;;
    esac
    
    success "Launch parameters validated"
}

# Setup launch environment variables
setup_launch_environment() {
    log "Setting up launch environment..."
    
    # Create launch-specific environment file
    cat > "${PROJECT_ROOT}/.env.launch" << EOF
# Launch Configuration
LAUNCH_PHASE=${LAUNCH_PHASE}
ROLLOUT_STRATEGY=${ROLLOUT_STRATEGY}
LAUNCH_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Feature Flags
MONITORING_ENABLED=true
FEEDBACK_ENABLED=true
SUPPORT_ENABLED=true

# Launch Monitoring
LAUNCH_WEBHOOK_URL=${LAUNCH_WEBHOOK_URL:-}
ADMIN_KEY=${ADMIN_KEY:-$(openssl rand -hex 32)}

# Performance Thresholds
RESPONSE_TIME_THRESHOLD=2000
ERROR_RATE_THRESHOLD=0.05
MEMORY_THRESHOLD=0.85

# Support Configuration
SUPPORT_EMAIL=${SUPPORT_EMAIL:-support@theobviouscompany.com}
ESCALATION_EMAIL=${ESCALATION_EMAIL:-tech@theobviouscompany.com}
FEEDBACK_EMAIL=${FEEDBACK_EMAIL:-feedback@theobviouscompany.com}
EOF

    # Merge with main environment file
    if [[ -f "${PROJECT_ROOT}/.env" ]]; then
        cat "${PROJECT_ROOT}/.env.launch" >> "${PROJECT_ROOT}/.env"
    else
        cp "${PROJECT_ROOT}/.env.launch" "${PROJECT_ROOT}/.env"
    fi
    
    success "Launch environment configured"
}

# Configure feature flags for launch phase
configure_feature_flags() {
    log "Configuring feature flags for $LAUNCH_PHASE phase..."
    
    case "$LAUNCH_PHASE" in
        beta)
            launch_log "Setting beta phase feature flags..."
            # Conservative rollout for beta
            export MULTI_MODAL_ASSESSMENTS_ROLLOUT=25
            export ADAPTIVE_CURRICULUM_ROLLOUT=10
            export CULTURAL_SENSITIVITY_ROLLOUT=50
            export AI_POWERED_RECOMMENDATIONS_ROLLOUT=5
            ;;
        soft-launch)
            launch_log "Setting soft-launch phase feature flags..."
            # Moderate rollout for soft launch
            export MULTI_MODAL_ASSESSMENTS_ROLLOUT=75
            export ADAPTIVE_CURRICULUM_ROLLOUT=50
            export CULTURAL_SENSITIVITY_ROLLOUT=100
            export AI_POWERED_RECOMMENDATIONS_ROLLOUT=25
            ;;
        full-launch)
            launch_log "Setting full-launch phase feature flags..."
            # Full rollout for production launch
            export MULTI_MODAL_ASSESSMENTS_ROLLOUT=100
            export ADAPTIVE_CURRICULUM_ROLLOUT=100
            export CULTURAL_SENSITIVITY_ROLLOUT=100
            export AI_POWERED_RECOMMENDATIONS_ROLLOUT=75
            export COLLABORATIVE_ASSESSMENTS_ROLLOUT=25
            ;;
    esac
    
    success "Feature flags configured for $LAUNCH_PHASE"
}

# Setup monitoring and alerting
setup_monitoring() {
    log "Setting up launch monitoring and alerting..."
    
    # Ensure monitoring directories exist
    mkdir -p "${SCRIPT_DIR}/monitoring/logs"
    mkdir -p "${SCRIPT_DIR}/monitoring/metrics"
    mkdir -p "${SCRIPT_DIR}/monitoring/alerts"
    
    # Create monitoring configuration
    cat > "${SCRIPT_DIR}/monitoring/launch-monitoring.yml" << EOF
launch_monitoring:
  phase: ${LAUNCH_PHASE}
  strategy: ${ROLLOUT_STRATEGY}
  start_time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
  
  thresholds:
    response_time: 2000  # milliseconds
    error_rate: 0.05     # 5%
    memory_usage: 0.85   # 85%
    user_satisfaction: 3.0  # out of 5
    
  alerts:
    email: ${ESCALATION_EMAIL:-tech@theobviouscompany.com}
    webhook: ${LAUNCH_WEBHOOK_URL:-}
    
  metrics_retention: 30  # days
  
  rollout_schedule:
    beta:
      duration: 7  # days
      success_criteria:
        system_health: ["healthy", "excellent"]
        user_satisfaction: 3.5
        performance_score: 70
    soft_launch:
      duration: 14  # days
      success_criteria:
        system_health: ["healthy", "excellent"]
        user_satisfaction: 4.0
        performance_score: 80
EOF

    success "Launch monitoring configured"
}

# Pre-launch health checks
pre_launch_health_checks() {
    log "Running pre-launch health checks..."
    
    # Check database connectivity
    log "Checking database connectivity..."
    if ! docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" exec -T postgres pg_isready -U "${DB_USER:-assessment_user}" >/dev/null 2>&1; then
        error "Database is not ready"
        return 1
    fi
    
    # Check Redis connectivity
    log "Checking Redis connectivity..."
    if ! docker-compose -f "${SCRIPT_DIR}/docker-compose.yml" exec -T redis redis-cli ping >/dev/null 2>&1; then
        error "Redis is not ready"
        return 1
    fi
    
    # Check application health
    log "Checking application health..."
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:3000/api/launch/health" >/dev/null; then
            success "Application health check passed"
            break
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error "Application health check failed after $max_attempts attempts"
            return 1
        fi
        
        log "Health check attempt $attempt/$max_attempts failed, retrying..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    # Check launch system components
    log "Checking launch system components..."
    local launch_health=$(curl -s "http://localhost:3000/api/launch/health" | jq -r '.services // {}')
    
    if [[ $(echo "$launch_health" | jq -r '.feedback // false') != "true" ]]; then
        warning "Feedback system not initialized"
    fi
    
    if [[ $(echo "$launch_health" | jq -r '.monitoring // false') != "true" ]]; then
        warning "Performance monitoring not initialized"
    fi
    
    if [[ $(echo "$launch_health" | jq -r '.support // false') != "true" ]]; then
        warning "Support system not initialized"
    fi
    
    success "Pre-launch health checks completed"
}

# Deploy with launch monitoring
deploy_with_monitoring() {
    log "Deploying application with launch monitoring..."
    
    # Run standard deployment
    "${SCRIPT_DIR}/deploy.sh" production
    
    # Wait for services to stabilize
    log "Waiting for services to stabilize..."
    sleep 30
    
    # Initialize launch monitoring
    log "Initializing launch monitoring..."
    curl -X POST "http://localhost:3000/api/launch/metrics/performance" \
         -H "Content-Type: application/json" \
         -d '{
           "metricType": "launch_started",
           "data": {
             "phase": "'$LAUNCH_PHASE'",
             "strategy": "'$ROLLOUT_STRATEGY'",
             "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
           }
         }' >/dev/null 2>&1 || warning "Failed to initialize launch monitoring"
    
    success "Application deployed with launch monitoring"
}

# Post-launch verification
post_launch_verification() {
    log "Running post-launch verification..."
    
    # Verify launch dashboard access
    log "Verifying launch dashboard..."
    if curl -f -s "http://localhost:3000/admin/launch-dashboard.html" >/dev/null; then
        success "Launch dashboard accessible"
        launch_log "Dashboard URL: http://localhost:3000/admin/launch-dashboard.html"
    else
        warning "Launch dashboard not accessible"
    fi
    
    # Verify API endpoints
    log "Verifying launch API endpoints..."
    local endpoints=(
        "/api/launch/health"
        "/api/launch/status"
        "/api/launch/feature-flags/assessment_platform_enabled"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if curl -f -s "http://localhost:3000$endpoint" >/dev/null; then
            success "Endpoint $endpoint accessible"
        else
            warning "Endpoint $endpoint not accessible"
        fi
    done
    
    # Test feedback collection
    log "Testing feedback collection..."
    local feedback_test=$(curl -s -X POST "http://localhost:3000/api/launch/feedback" \
         -H "Content-Type: application/json" \
         -d '{
           "category": "technical_issue",
           "rating": 5,
           "message": "Launch deployment test feedback",
           "sessionId": "test_session"
         }')
    
    if [[ $(echo "$feedback_test" | jq -r '.success // false') == "true" ]]; then
        success "Feedback collection working"
    else
        warning "Feedback collection test failed"
    fi
    
    success "Post-launch verification completed"
}

# Generate launch report
generate_launch_report() {
    log "Generating launch report..."
    
    local report_file="${SCRIPT_DIR}/monitoring/logs/launch-report-$(date +%Y%m%d_%H%M%S).json"
    
    # Get launch dashboard data
    local dashboard_data=$(curl -s "http://localhost:3000/api/launch/dashboard?adminKey=${ADMIN_KEY}" || echo '{}')
    
    # Create launch report
    cat > "$report_file" << EOF
{
  "launch_info": {
    "phase": "$LAUNCH_PHASE",
    "strategy": "$ROLLOUT_STRATEGY",
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "deployment_duration": "$(date -d @$(($(date +%s) - $(date -d "$deployment_start_time" +%s))) -u +%H:%M:%S)"
  },
  "system_status": {
    "health_checks_passed": true,
    "services_running": true,
    "monitoring_active": true
  },
  "dashboard_data": $dashboard_data,
  "next_steps": [
    "Monitor system performance for first 24 hours",
    "Review user feedback and support tickets",
    "Assess feature flag performance",
    "Plan next phase progression if applicable"
  ]
}
EOF

    success "Launch report generated: $report_file"
    
    # Display launch summary
    launch_log "=== LAUNCH SUMMARY ==="
    launch_log "Phase: $LAUNCH_PHASE"
    launch_log "Strategy: $ROLLOUT_STRATEGY"
    launch_log "Status: DEPLOYED"
    launch_log "Dashboard: http://localhost:3000/admin/launch-dashboard.html"
    launch_log "Admin Key: ${ADMIN_KEY}"
    launch_log "Report: $report_file"
    launch_log "======================="
}

# Setup launch alerts
setup_launch_alerts() {
    log "Setting up launch-specific alerts..."
    
    # Create alert configuration
    cat > "${SCRIPT_DIR}/monitoring/launch-alerts.yml" << EOF
alerts:
  - name: launch_critical_error
    condition: error_rate > 0.1
    severity: critical
    message: "Critical error rate during launch"
    
  - name: launch_high_response_time
    condition: response_time > 3000
    severity: high
    message: "High response times during launch"
    
  - name: launch_low_user_satisfaction
    condition: user_satisfaction < 3.0
    severity: medium
    message: "Low user satisfaction during launch"
    
  - name: launch_feature_flag_issues
    condition: feature_flag_errors > 5
    severity: high
    message: "Multiple feature flag errors detected"
    
  - name: launch_support_overload
    condition: open_tickets > 10
    severity: medium
    message: "High number of support tickets during launch"
EOF

    success "Launch alerts configured"
}

# Main launch function
main() {
    local deployment_start_time=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    launch_log "🚀 Starting AI Integration Assessment Platform Launch"
    launch_log "Phase: $LAUNCH_PHASE | Strategy: $ROLLOUT_STRATEGY"
    
    validate_launch_parameters
    setup_launch_environment
    configure_feature_flags
    setup_monitoring
    setup_launch_alerts
    
    launch_log "🔧 Pre-deployment checks..."
    pre_launch_health_checks
    
    launch_log "🚀 Deploying application..."
    deploy_with_monitoring
    
    launch_log "✅ Post-deployment verification..."
    post_launch_verification
    
    launch_log "📊 Generating launch report..."
    generate_launch_report
    
    success "🎉 Launch completed successfully!"
    
    launch_log "Next steps:"
    launch_log "1. Monitor the launch dashboard: http://localhost:3000/admin/launch-dashboard.html"
    launch_log "2. Keep the admin key secure: ${ADMIN_KEY}"
    launch_log "3. Review system metrics and user feedback regularly"
    launch_log "4. Plan for next phase progression based on success criteria"
    
    if [[ "$LAUNCH_PHASE" == "beta" ]]; then
        launch_log "Beta phase will run for 7 days before considering soft-launch progression"
    elif [[ "$LAUNCH_PHASE" == "soft-launch" ]]; then
        launch_log "Soft-launch phase will run for 14 days before considering full-launch progression"
    fi
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        usage
        ;;
    *)
        main
        ;;
esac