#!/usr/bin/env sh
# Verificación de requisitos mínimos de Vet Manager (Semana 1 — CE-2)
# Uso: sh scripts/verificar-requisitos.sh [archivo_de_reporte]
# Códigos de salida: 0 = requisitos confirmados; 1 = requisitos no confirmados; 2 = error de uso.
set -u

REPORT="${1:-/tmp/verificar-requisitos.out}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
PROJECT_DIR=$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)
MIN_CPU=${MIN_CPU:-2}
MIN_MEM_GB=${MIN_MEM_GB:-4}
: > "$REPORT"
exec > "$REPORT"

printf '%s\n' '=== Verificación de requisitos de Vet Manager ==='
printf 'Fecha: '; date -u '+%Y-%m-%dT%H:%M:%SZ'
printf 'Servidor: '; uname -a
if [ -r /etc/os-release ]; then
  OS_ID=$(sed -n 's/^ID=//p' /etc/os-release | tr -d '"' | head -n 1)
  OS_VERSION=$(sed -n 's/^VERSION_ID=//p' /etc/os-release | tr -d '"' | head -n 1)
  printf 'Sistema operativo: %s %s\n' "${OS_ID:-no disponible}" "${OS_VERSION:-no disponible}"
else
  printf '%s\n' 'Sistema operativo: no disponible'
fi

printf '\n[CPU]\n'
if command -v nproc >/dev/null 2>&1; then printf 'vCPU: %s\n' "$(nproc)"; else printf '%s\n' 'vCPU: no disponible'; fi
if command -v lscpu >/dev/null 2>&1; then
  lscpu | grep -E '^(Architecture|CPU\(s\)|Model name)' | head -n 3 || true
fi

printf '\n[RAM]\n'
if command -v free >/dev/null 2>&1; then free -h; else printf '%s\n' 'free: no disponible'; fi

printf '\n[Disco]\n'
df -hT / 2>/dev/null || true
if [ -d /var/lib/docker ]; then df -hT /var/lib/docker 2>/dev/null || true; fi
printf '%s\n' 'Espacio disponible para docker-compose:'

# En hosts WSL el cliente de Docker puede ser docker.exe de Windows.
DOCKER_CMD=""
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  DOCKER_CMD=docker
elif command -v docker.exe >/dev/null 2>&1 && docker.exe info >/dev/null 2>&1; then
  DOCKER_CMD=docker.exe
fi

if [ -n "$DOCKER_CMD" ]; then
  "$DOCKER_CMD" system df --format 'table {{.Size}} {{.Type}}' 2>/dev/null || true
else
  printf '%s\n' 'Docker: daemon no disponible o cliente sin configurar'
fi

printf '\n[Software]\n'
if [ -n "$DOCKER_CMD" ]; then
  "$DOCKER_CMD" --version 2>/dev/null || true
  if "$DOCKER_CMD" compose version >/dev/null 2>&1; then
    "$DOCKER_CMD" compose version 2>/dev/null || true
  fi
else
  printf '%s\n' 'docker: no disponible o daemon detenido'
fi
for tool in node npm python3; do
  if command -v "$tool" >/dev/null 2>&1; then
    case "$tool" in
      node) node --version 2>/dev/null || true ;;
      npm) npm --version 2>/dev/null || true ;;
      python3) python3 --version 2>/dev/null || true ;;
    esac
  else
    printf '%s: no instalado (el proyecto los ejecuta dentro de Docker)\n' "$tool"
  fi
done

printf '\n[Puertos esperados]\n'
printf '%s\n' 'Frontend: 5173/tcp' 'API: 5000/tcp' 'MySQL: 3307/tcp (host) / 3306/tcp (contenedor)'
if command -v ss >/dev/null 2>&1; then
  ss -ltnp 2>/dev/null | grep -E ':(5000|5173|3307|3306)\b' || printf '%s\n' 'Ningún puerto esperado está LISTENING'
elif command -v netstat >/dev/null 2>&1; then
  netstat -ltn 2>/dev/null | grep -E ':(5000|5173|3307|3306)[[:space:]]' || printf '%s\n' 'Ningún puerto esperado está LISTENING'
else
  printf '%s\n' 'ss/netstat no disponibles: no se pudieron listar puertos'
fi

printf '\n[Chequeo propio del proyecto: archivos requeridos]\n'
FILES_OK=1
for required in docker-compose.yml Caddyfile backend/app/main.py backend/requirements.txt frontend/package.json database/schema.sql scripts/respaldar.sh; do
  if [ -f "$PROJECT_DIR/$required" ]; then
    printf 'OK   %s\n' "$required"
  else
    printf 'FALTA %s\n' "$required"
    FILES_OK=0
  fi
done

printf '\n[Chequeo propio del proyecto: configuración de Compose]\n'
COMPOSE_OK=0
if [ -n "$DOCKER_CMD" ] && "$DOCKER_CMD" compose version >/dev/null 2>&1; then
  # Ruta relativa: en WSL el cliente docker.exe (Windows) no entiende /mnt/c/...
  if (cd "$PROJECT_DIR" && "$DOCKER_CMD" compose config --quiet >/dev/null 2>&1); then
    printf '%s\n' 'docker compose config: válida'
    printf 'Servicios: %s\n' "$(cd "$PROJECT_DIR" && "$DOCKER_CMD" compose config --services 2>/dev/null | tr '\n' ' ')"
    COMPOSE_OK=1
  else
    printf '%s\n' 'docker compose config: INVÁLIDA (revisa variables de entorno, ver .env.example)'
  fi
else
  printf '%s\n' 'Docker Compose no disponible: no se pudo validar la configuración'
fi

printf '\n[Resultado]\n'
CPU_COUNT=$(nproc 2>/dev/null || printf '0')
MEM_GB=$(free -g 2>/dev/null | awk '/^Mem:/ {print $2}' || printf '0')
DOCKER_OK=0
if [ -n "$DOCKER_CMD" ]; then DOCKER_OK=1; fi

FAILURES=""
[ "$CPU_COUNT" -ge "$MIN_CPU" ] || FAILURES="$FAILURES CPU<$MIN_CPU vCPU;"
[ "$MEM_GB" -ge "$MIN_MEM_GB" ] || FAILURES="$FAILURES RAM<${MIN_MEM_GB}GiB;"
[ "$DOCKER_OK" -eq 1 ] || FAILURES="$FAILURES Docker sin operar;"
[ "$FILES_OK" -eq 1 ] || FAILURES="$FAILURES archivos del proyecto faltantes;"
[ "$COMPOSE_OK" -eq 1 ] || FAILURES="$FAILURES Compose inválido;"

if [ -z "$FAILURES" ]; then
  printf '%s\n' "CUMPLIMIENTO: confirmado (CPU>=${MIN_CPU} vCPU, RAM>=${MIN_MEM_GB} GiB, Docker operativo, archivos y Compose válidos)."
  RESULT=0
else
  printf '%s\n' "CUMPLIMIENTO: no confirmado. Incumplimientos:$FAILURES"
  RESULT=1
fi

printf '\nSalida guardada en: %s\n' "$REPORT"
exit "$RESULT"
