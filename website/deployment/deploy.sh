#!/bin/bash

# AI Integration Assessment Platform Deployment Script
# Handles production deployment with rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_ENV="${1:-production}"
ROLLBACK_VERSION="${2:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Usage function
usage() {
    echo "Usage: $0 [environment] [rollback_version]"
    echo ""
    echo "Environments:"
    echo "  production  - Deploy to production (default)"
    echo "  staging     - Deploy to staging"
    echo "  development - Deploy to development"
    echo ""
    echo "Rollback:"
    echo "  $0 production v1.2.3  - Rollback to specific version"
    echo ""
    exit 1
}

# Pre-deployment checks
pre_deployment_checks() {
    log "Running pre-deployment checks..."
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        error "Docker is not running"
        exit 1
    fi
    
    # Check if required files exist
    local required_files=(
        "docker-compose.yml"
        "../.env"
        "nginx.conf"
    )
    
    for file in "${required_files[@]}"; do
        if [[ ! -f "${SCRIPT_DIR}/${file}" ]]; then
            error "Required file not found: ${file}"
            exit 1
        fi
    done
    
    # Check environment variables
    if [[ ! -f "${PROJECT_ROOT}/.env" ]]; then
        error ".env file not found. Please copy from .env.example and configure."
        exit 1
    fi
    
    # Source environment variables
    set -a
    source "${PROJECT_ROOT}/.env"
    set +a
    
    # Validate critical environment variables
    local required_vars=(
        "DB_PASSWORD"
        "REDIS_PASSWORD"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
    )
    
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            error "Required environment variable not set: ${var}"
            exit 1
        fi
    done
    
    success "Pre-deployment checks passed"
}

# Build application
build_application() {
    log "Building application..."
    
    cd "${PROJECT_ROOT}"
    
    # Build Docker images
    docker-compose -f deployment/docker-compose.yml build --no-cache
    
    success "Application built successfully"
}

# Database migration
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    timeout=60
    while ! docker-compose -f deployment/docker-compose.yml exec -T postgres pg_isready -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; do
        timeout=$((timeout - 1))
        if [[ $timeout -eq 0 ]]; then
            error "Database failed to start within 60 seconds"
            exit 1
        fi
        sleep 1
    done
    
    # Run initialization scripts
    log "Running database initialization..."
    docker-compose -f deployment/docker-compose.yml exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" -f /docker-entrypoint-initdb.d/01-init-database.sql
    
    success "Database migrations completed"
}

# Health check
health_check() {
    log "Performing health checks..."
    
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        if curl -f -s "http://localhost:3000/api/health" >/dev/null; then
            success "Application is healthy"
            return 0
        fi
        
        log "Health check attempt ${attempt}/${max_attempts} failed, retrying..."
        sleep 10
        attempt=$((attempt + 1))
    done
    
    error "Health check failed after ${max_attempts} attempts"
    return 1
}

# Backup current deployment
backup_current_deployment() {
    log "Creating backup of current deployment..."
    
    local backup_dir="${SCRIPT_DIR}/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "${backup_dir}"
    
    # Backup database
    docker-compose -f deployment/docker-compose.yml exec -T postgres pg_dump -U "${DB_USER}" -d "${DB_NAME}" > "${backup_dir}/database_backup.sql"
    
    # Backup configuration
    cp "${PROJECT_ROOT}/.env" "${backup_dir}/"
    
    # Save current image tags
    docker-compose -f deployment/docker-compose.yml images --format "table {{.Service}}\t{{.Tag}}" > "${backup_dir}/image_tags.txt"
    
    echo "${backup_dir}" > "${SCRIPT_DIR}/.last_backup"
    
    success "Backup created at ${backup_dir}"
}

# Deploy application
deploy_application() {
    log "Deploying application..."
    
    cd "${SCRIPT_DIR}"
    
    # Pull latest images if not building locally
    if [[ "${BUILD_LOCALLY:-true}" != "true" ]]; then
        docker-compose pull
    fi
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be ready
    log "Waiting for services to start..."
    sleep 30
    
    success "Application deployed successfully"
}

# Rollback deployment
rollback_deployment() {
    local version="$1"
    
    warning "Rolling back to version: ${version}"
    
    # Stop current deployment
    log "Stopping current deployment..."
    docker-compose -f deployment/docker-compose.yml down
    
    # Restore from backup
    if [[ -f "${SCRIPT_DIR}/.last_backup" ]]; then
        local backup_dir
        backup_dir=$(cat "${SCRIPT_DIR}/.last_backup")
        
        if [[ -d "${backup_dir}" ]]; then
            log "Restoring from backup: ${backup_dir}"
            
            # Restore database
            docker-compose -f deployment/docker-compose.yml up -d postgres
            sleep 10
            docker-compose -f deployment/docker-compose.yml exec -T postgres psql -U "${DB_USER}" -d "${DB_NAME}" < "${backup_dir}/database_backup.sql"
            
            # Restore configuration
            cp "${backup_dir}/.env" "${PROJECT_ROOT}/"
            
            success "Rollback completed"
        else
            error "Backup directory not found: ${backup_dir}"
            exit 1
        fi
    else
        error "No backup information found"
        exit 1
    fi
}

# Cleanup old deployments
cleanup_old_deployments() {
    log "Cleaning up old deployments..."
    
    # Remove unused Docker images
    docker image prune -f
    
    # Remove old backups (keep last 10)
    find "${SCRIPT_DIR}/backups" -maxdepth 1 -type d -name "20*" | sort -r | tail -n +11 | xargs -r rm -rf
    
    success "Cleanup completed"
}

# Main deployment function
main() {
    log "Starting deployment for environment: ${DEPLOYMENT_ENV}"
    
    # Handle rollback
    if [[ -n "${ROLLBACK_VERSION}" ]]; then
        rollback_deployment "${ROLLBACK_VERSION}"
        exit 0
    fi
    
    # Normal deployment flow
    pre_deployment_checks
    backup_current_deployment
    build_application
    deploy_application
    run_migrations
    
    # Health check with retry
    if ! health_check; then
        error "Deployment failed health check, initiating rollback..."
        rollback_deployment "previous"
        exit 1
    fi
    
    cleanup_old_deployments
    
    success "Deployment completed successfully!"
    log "Application is available at: http://localhost:3000"
    log "Monitoring dashboard: http://localhost:3001"
    log "Prometheus: http://localhost:9090"
}

# Handle script arguments
case "${1:-}" in
    -h|--help)
        usage
        ;;
    production|staging|development)
        main
        ;;
    *)
