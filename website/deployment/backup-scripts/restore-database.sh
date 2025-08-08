#!/bin/bash

# AI Integration Assessment Platform Database Restore Script
# Restores database from backup with safety checks

set -euo pipefail

# Configuration
BACKUP_DIR="/backups"
DB_NAME="${DB_NAME:-assessment_platform}"
DB_USER="${DB_USER:-assessment_user}"
DB_HOST="${DB_HOST:-postgres}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Usage function
usage() {
    echo "Usage: $0 [backup_file]"
    echo "  backup_file: Path to backup file (optional, uses latest if not specified)"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Restore from latest backup"
    echo "  $0 backup_assessment_platform_20240107_120000.sql.gz"
    exit 1
}

# Safety confirmation
confirm_restore() {
    echo "WARNING: This will replace the current database with backup data."
    echo "Database: ${DB_NAME}"
    echo "Backup file: ${BACKUP_FILE}"
    echo ""
    read -p "Are you sure you want to continue? (yes/no): " -r
    if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
        echo "Restore cancelled."
        exit 0
    fi
}

# Determine backup file
if [[ $# -eq 0 ]]; then
    # Use latest backup
    BACKUP_FILE="${BACKUP_DIR}/latest_backup.sql.gz"
    if [[ ! -f "${BACKUP_FILE}" ]]; then
        log "ERROR: No latest backup found at ${BACKUP_FILE}"
        exit 1
    fi
elif [[ $# -eq 1 ]]; then
    # Use specified backup file
    if [[ "$1" == /* ]]; then
        BACKUP_FILE="$1"
    else
        BACKUP_FILE="${BACKUP_DIR}/$1"
    fi
    
    if [[ ! -f "${BACKUP_FILE}" ]]; then
        log "ERROR: Backup file not found: ${BACKUP_FILE}"
        exit 1
    fi
else
    usage
fi

log "Starting database restore for ${DB_NAME}"
log "Using backup file: ${BACKUP_FILE}"

# Check if PostgreSQL is accessible
if ! pg_isready -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" >/dev/null 2>&1; then
    log "ERROR: PostgreSQL is not accessible"
    exit 1
fi

# Verify backup file integrity
log "Verifying backup file integrity"
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    if ! gunzip -t "${BACKUP_FILE}"; then
        log "ERROR: Backup file integrity check failed"
        exit 1
    fi
else
    if ! file "${BACKUP_FILE}" | grep -q "PostgreSQL custom database dump"; then
        log "ERROR: Invalid backup file format"
        exit 1
    fi
fi

# Confirm restore operation
confirm_restore

# Create backup of current database before restore
CURRENT_BACKUP="${BACKUP_DIR}/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
log "Creating backup of current database: ${CURRENT_BACKUP}"
pg_dump -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" \
    --format=custom \
    --compress=9 \
    --file="${CURRENT_BACKUP}"

# Terminate active connections to the database
log "Terminating active connections to ${DB_NAME}"
psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "
    SELECT pg_terminate_backend(pid)
    FROM pg_stat_activity
    WHERE datname = '${DB_NAME}' AND pid <> pg_backend_pid();
"

# Drop and recreate database
log "Dropping and recreating database ${DB_NAME}"
psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "DROP DATABASE IF EXISTS ${DB_NAME};"
psql -h "${DB_HOST}" -U "${DB_USER}" -d postgres -c "CREATE DATABASE ${DB_NAME};"

# Restore from backup
log "Restoring database from backup"
if [[ "${BACKUP_FILE}" == *.gz ]]; then
    # Compressed backup
    gunzip -c "${BACKUP_FILE}" | pg_restore -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" --verbose
else
    # Uncompressed backup
    pg_restore -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" --verbose "${BACKUP_FILE}"
fi

# Verify restore
log "Verifying database restore"
TABLE_COUNT=$(psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -t -c "
    SELECT COUNT(*)
    FROM information_schema.tables
    WHERE table_schema NOT IN ('information_schema', 'pg_catalog');
")

if [[ ${TABLE_COUNT} -gt 0 ]]; then
    log "Database restore completed successfully"
    log "Tables restored: ${TABLE_COUNT}"
    
    # Update database statistics
    log "Updating database statistics"
    psql -h "${DB_HOST}" -U "${DB_USER}" -d "${DB_NAME}" -c "ANALYZE;"
    
    log "Restore process completed successfully"
else
    log "ERROR: Database restore may have failed - no tables found"
    exit 1
fi