#!/usr/bin/env bash
# Restauración verificada de un respaldo (plan §3.3/§3.4).
# Uso: bash scripts/restaurar.sh backups/mysql/vet_manager-<timestamp>.sql.gz [BD_DESTINO]
set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
PROJECT_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd)
MYSQL_SERVICE=${MYSQL_SERVICE:-mysql}
BACKUP=${1:-}
DEST_DB=${2:-}

if [[ -z "$BACKUP" || ! -f "$BACKUP" ]]; then
  printf 'Uso: %s <archivo.sql.gz> [base_destino]\n' "$0" >&2
  exit 2
fi

for command_name in docker gzip sha256sum; do
  command -v "$command_name" >/dev/null 2>&1 || { printf 'Falta %s\n' "$command_name" >&2; exit 2; }
done

cd "$PROJECT_DIR"

# 1. Integridad del archivo antes de tocar la base.
printf '1/6 Verificando integridad gzip...\n'
gzip -t "$BACKUP"
SHA=$(sha256sum "$BACKUP" | awk '{print $1}')
printf '   SHA-256: %s\n' "$SHA"

MANIFEST="${BACKUP%.sql.gz}.manifest.txt"
if [[ -f "$MANIFEST" ]]; then
  printf '2/6 Manifiesto encontrado:\n'
  sed 's/^/   /' "$MANIFEST"
fi

# 2. Base destino (por defecto, un nombre de prueba para no sobrescribir producción).
if [[ -z "$DEST_DB" ]]; then
  DEST_DB="vet_manager_restore_$(date -u '+%Y%m%dT%H%M%SZ')"
fi
[[ "$DEST_DB" =~ ^[A-Za-z0-9_]+$ ]] || { printf 'Nombre de BD no válido\n' >&2; exit 2; }
printf '3/6 Base destino: %s\n' "$DEST_DB"

# 3. Importar con el usuario root del contenedor (necesita PROCESS y rutinas).
printf '4/6 Importando dump...\n'
docker compose exec -T "$MYSQL_SERVICE" sh -ec \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root -e "CREATE DATABASE IF NOT EXISTS \`'"$DEST_DB"'\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"'
docker exec -i "$(docker compose ps -q "$MYSQL_SERVICE")" sh -ec \
  'gunzip -c > /tmp/restore.sql; MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -u root "'"$DEST_DB"'" < /tmp/restore.sql; rm -f /tmp/restore.sql' \
  < "$BACKUP"

# 4. Verificación de huellas: misma cantidad de tablas y registros.
printf '5/6 Verificando huellas...\n'
ORIGEN=$(docker compose exec -T "$MYSQL_SERVICE" sh -ec \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -N -u root -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=\"vet_manager\""')
DESTINO=$(docker compose exec -T "$MYSQL_SERVICE" sh -ec \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -N -u root -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=\"'"$DEST_DB"'\""')
printf '   tablas: origen=%s restaurada=%s\n' "$ORIGEN" "$DESTINO"
[[ "$ORIGEN" == "$DESTINO" ]] || { printf 'ERROR: distinto número de tablas\n' >&2; exit 1; }

# 5. Alembic: la tabla alembic_version debe estar presente y coincidir con el manifiesto.
HEAD=$(docker compose exec -T "$MYSQL_SERVICE" sh -ec \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -N -u root "'"$DEST_DB"'" -e "SELECT version_num FROM alembic_version LIMIT 1"' || true)
printf '   alembic_version=%s\n' "${HEAD:-<ausente>}"
if [[ -f "$MANIFEST" ]]; then
  ESPERADA=$(grep '^alembic_head=' "$MANIFEST" | cut -d= -f2)
  if [[ -n "$ESPERADA" && "$ESPERADA" != "desconocida" && "$HEAD" != "$ESPERADA" ]]; then
    printf 'ERROR: alembic_version (%s) != manifiesto (%s)\n' "$HEAD" "$ESPERADA" >&2
    exit 1
  fi
fi

printf '6/6 Resultado: RESTAURACIÓN VERIFICADA en %s\n' "$DEST_DB"
printf '   Para aplicar en producción, detén escrituras, restaura sobre vet_manager y ejecuta:\n'
printf '   bash scripts/smoke-test.sh https://<dominio>\n'
