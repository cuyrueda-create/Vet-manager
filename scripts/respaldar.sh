#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
MYSQL_SERVICE=${MYSQL_SERVICE:-mysql}
BACKUP_DIR=${BACKUP_DIR:-"$PROJECT_DIR/backups/mysql"}
RETENTION_DAYS=${RETENTION_DAYS:-7}

if [[ ! "$RETENTION_DAYS" =~ ^[1-9][0-9]*$ ]]; then
  printf 'RETENTION_DAYS debe ser un entero mayor que cero.\n' >&2
  exit 2
fi

for command_name in docker gzip sha256sum find date; do
  if ! command -v "$command_name" >/dev/null 2>&1; then
    printf 'Falta el comando requerido: %s\n' "$command_name" >&2
    exit 2
  fi
done

cd "$PROJECT_DIR"
docker compose exec -T "$MYSQL_SERVICE" sh -ec \
  'test -n "${MYSQL_DATABASE:-}" && test -n "${MYSQL_USER:-}" && test -n "${MYSQL_PASSWORD:-}" && MYSQL_PWD="$MYSQL_PASSWORD" mysqladmin ping --silent -u "$MYSQL_USER" >/dev/null'

DATABASE_NAME=$(docker compose exec -T "$MYSQL_SERVICE" sh -ec 'printf "%s" "$MYSQL_DATABASE"')
if [[ ! "$DATABASE_NAME" =~ ^[A-Za-z0-9_]+$ ]]; then
  printf 'Nombre de base de datos no válido: %s\n' "$DATABASE_NAME" >&2
  exit 2
fi

umask 077
mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"
TIMESTAMP=$(date -u '+%Y%m%dT%H%M%SZ')
BACKUP_FILE="$BACKUP_DIR/${DATABASE_NAME}-${TIMESTAMP}.sql.gz"
TEMP_SQL="$BACKUP_DIR/.${DATABASE_NAME}-${TIMESTAMP}.sql.tmp"
TEMP_GZIP="$BACKUP_DIR/.${DATABASE_NAME}-${TIMESTAMP}.sql.gz.tmp"
trap 'rm -f "$TEMP_SQL" "$TEMP_GZIP"' EXIT

docker compose exec -T "$MYSQL_SERVICE" sh -ec \
  'MYSQL_PWD="$MYSQL_PASSWORD" exec mysqldump --single-transaction --routines --triggers --events --hex-blob --default-character-set=utf8mb4 -u "$MYSQL_USER" "$MYSQL_DATABASE"' \
  > "$TEMP_SQL"
if [[ ! -s "$TEMP_SQL" ]]; then
  printf 'mysqldump no produjo datos; no se guardó un respaldo.\n' >&2
  exit 1
fi

gzip -n -c "$TEMP_SQL" > "$TEMP_GZIP"
gzip -t "$TEMP_GZIP"
mv -- "$TEMP_GZIP" "$BACKUP_FILE"
chmod 600 "$BACKUP_FILE"
rm -f "$TEMP_SQL"

find "$BACKUP_DIR" -type f -name "${DATABASE_NAME}-*.sql.gz" \
  -mmin "+$((RETENTION_DAYS * 1440))" -delete

printf 'Respaldo creado: %s\n' "$BACKUP_FILE"
printf 'SHA-256: '
sha256sum "$BACKUP_FILE"
printf 'Retención aplicada: %s días\n' "$RETENTION_DAYS"
printf '%s\n' 'Nota: el dump está comprimido, no cifrado; cifra las copias antes de transferirlas o guardarlas fuera del host.'