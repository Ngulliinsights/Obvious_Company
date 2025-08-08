#!/bin/bash

# AI Integration Assessment Platform Database Backup Script
# Performs automated backups with rotation and monitoring

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=30
DB_NAME="${DB_NAME:-assessment_platform}"
DB_USER="${DB_USER:-assessment_user}"
DB_HOST="${DB_HOST:-postgres}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DB_NAME}_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${BACKUP_DIR}/backup.log"
}

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

log "Starting database backup for ${DB_NAME}"

# Check if PostgreSQL is accessible
if ! pg_isready -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
    log "ERROR: PostgreSQL is not accessible"
    exit 1
fi

# Create backup
log "Creating backup: ${BACKUP_FILE}"
if pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --verbose \
    --no-password \
    --format=custom \
    --compress=9 \
    --file="${BACKUP_FILE}"; then
    
    log "Backup created successfully"
    
    # Compress backup
    log "Compressing backup"
    gzip "${BACKUP_FILE}"
    
    # Verify backup integrity
    log "Verifying backup integrity"
    if gunzip -t "${COMPRESSED_FILE}"; then
        log "Backup integrity verified"
        
        # Get backup size
        BACKUP_SIZE=$(du -h "${COMPRESSED_FILE}" | cut -f1)
        log "Backup size: ${BACKUP_SIZE}"
        
        # Update latest backup symlink
        ln -sf "${COMPRESSED_FILE}" "${BACKUP_DIR}/latest_backup.sql.gz"
        
    else
        log "ERROR: Backup integrity check failed"
        rm -f "${COMPRESSED_FILE}"
        exit 1
    fi
    
else
    log "ERROR: Backup creation failed"
    exit 1
fi

# Cleanup old backups
log "Cleaning up backups older than ${RETENTION_DAYS} days"
find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

# Count remaining backups
BACKUP_COUNT=$(find "${BACKUP_DIR}" -name "backup_${DB_NAME}_*.sql.gz" | wc -l)
log "Backup completed. Total backups: ${BACKUP_COUNT}"

# Send notification if configured
if [[ -n "${BACKUP_NOTIFICATION_EMAIL:-}" ]]; then
    echo "Database backup completed successfully at $(date)" | \
    mail -s "Database Backup Success - ${DB_NAME}" "${BACKUP_NOTIFICATION_EMAIL}"
fi

log "Backup process completed successfully"