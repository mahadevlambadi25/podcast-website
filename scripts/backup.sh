#!/usr/bin/env bash
# ==============================================================================
# Database and Media Backup Script for "Unchartered — Legends & Legacies"
# Usage:
#   ./scripts/backup.sh backup [destination_dir]
#   ./scripts/backup.sh restore <backup_tar_gz>
# ==============================================================================

set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="${2:-./backups}"
DB_CONTAINER="${DB_CONTAINER:-unchartered_postgres}"
DB_NAME="${DB_NAME:-unchartered_db}"
DB_USER="${DB_USER:-postgres}"
MEDIA_DIR="${MEDIA_DIR:-./media}"

mkdir -p "$BACKUP_DIR"

command_backup() {
  echo "==> Starting backup of Unchartered Podcast database and media..."
  TEMP_BACKUP_STAGE="${BACKUP_DIR}/unchartered_backup_${TIMESTAMP}"
  mkdir -p "$TEMP_BACKUP_STAGE"

  # 1. PostgreSQL Dump
  echo "--> Dumping database: ${DB_NAME}..."
  if command -v docker &> /dev/null && docker ps | grep -q "$DB_CONTAINER"; then
    docker exec -t "$DB_CONTAINER" pg_dump -U "$DB_USER" -d "$DB_NAME" -F c > "${TEMP_BACKUP_STAGE}/database_${TIMESTAMP}.dump"
  elif command -v pg_dump &> /dev/null; then
    pg_dump "${DATABASE_URI:-postgresql://postgres:postgres@localhost:5432/${DB_NAME}}" -F c > "${TEMP_BACKUP_STAGE}/database_${TIMESTAMP}.dump"
  else
    echo "Warning: Neither docker nor pg_dump was found. Checking for SQLite file..."
    if [ -f "./payload.db" ]; then
      cp "./payload.db" "${TEMP_BACKUP_STAGE}/payload_${TIMESTAMP}.db"
    fi
  fi

  # 2. Media Directory Archive
  if [ -d "$MEDIA_DIR" ]; then
    echo "--> Backing up media directory: ${MEDIA_DIR}..."
    tar -czf "${TEMP_BACKUP_STAGE}/media_${TIMESTAMP}.tar.gz" -C "$MEDIA_DIR" .
  else
    echo "--> No local media directory found to backup."
  fi

  # 3. Create consolidated archive
  FINAL_ARCHIVE="${BACKUP_DIR}/unchartered_full_backup_${TIMESTAMP}.tar.gz"
  tar -czf "$FINAL_ARCHIVE" -C "$BACKUP_DIR" "unchartered_backup_${TIMESTAMP}"
  rm -rf "$TEMP_BACKUP_STAGE"

  echo "==> Backup completed successfully!"
  echo "    Archive saved to: ${FINAL_ARCHIVE}"
}

command_restore() {
  if [ -z "${2:-}" ]; then
    echo "Error: Please specify the backup archive to restore."
    echo "Usage: ./scripts/backup.sh restore <path_to_backup.tar.gz>"
    exit 1
  fi

  ARCHIVE_PATH="$2"
  echo "==> Restoring from archive: ${ARCHIVE_PATH}..."
  EXTRACT_DIR="${BACKUP_DIR}/restore_temp_${TIMESTAMP}"
  mkdir -p "$EXTRACT_DIR"
  tar -xzf "$ARCHIVE_PATH" -C "$EXTRACT_DIR"

  # Find dump file
  DUMP_FILE=$(find "$EXTRACT_DIR" -name "*.dump" | head -n 1 || true)
  if [ -n "$DUMP_FILE" ]; then
    echo "--> Restoring PostgreSQL database from ${DUMP_FILE}..."
    if command -v docker &> /dev/null && docker ps | grep -q "$DB_CONTAINER"; then
      cat "$DUMP_FILE" | docker exec -i "$DB_CONTAINER" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists
    elif command -v pg_restore &> /dev/null; then
      pg_restore -d "${DATABASE_URI:-postgresql://postgres:postgres@localhost:5432/${DB_NAME}}" --clean --if-exists "$DUMP_FILE"
    fi
  fi

  # Find media tar
  MEDIA_TAR=$(find "$EXTRACT_DIR" -name "*media*.tar.gz" | head -n 1 || true)
  if [ -n "$MEDIA_TAR" ]; then
    echo "--> Restoring media files into ${MEDIA_DIR}..."
    mkdir -p "$MEDIA_DIR"
    tar -xzf "$MEDIA_TAR" -C "$MEDIA_DIR"
  fi

  rm -rf "$EXTRACT_DIR"
  echo "==> Restore completed successfully!"
}

case "${1:-backup}" in
  backup)
    command_backup
    ;;
  restore)
    command_restore "$@"
    ;;
  *)
    echo "Usage: $0 {backup|restore <archive>}"
    exit 1
    ;;
esac
