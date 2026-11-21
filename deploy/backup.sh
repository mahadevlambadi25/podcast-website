#!/bin/sh
# Nightly backup of the database and uploaded media. Keeps the last 14 days.
# Install on the server:  crontab -e  →  30 3 * * * /opt/podcast/deploy/backup.sh >> /var/log/podcast-backup.log 2>&1
set -eu

APP_DIR=/opt/podcast
BACKUP_DIR=/var/backups/podcast
STAMP=$(date +%Y%m%d_%H%M%S)
COMPOSE="docker compose -p podcast -f $APP_DIR/docker-compose.prod.yml --env-file $APP_DIR/.env.production"

mkdir -p "$BACKUP_DIR"
cd "$APP_DIR"

$COMPOSE exec -T postgres pg_dump -U unchartered -d unchartered -Fc > "$BACKUP_DIR/db_$STAMP.dump"
$COMPOSE exec -T app tar -C /var/data/media -czf - . > "$BACKUP_DIR/media_$STAMP.tar.gz"

find "$BACKUP_DIR" -type f -mtime +14 -delete
echo "$(date) backup ok: db_$STAMP.dump media_$STAMP.tar.gz"
