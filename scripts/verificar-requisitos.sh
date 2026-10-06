#!/usr/bin/env sh
set -u

REPORT="${1:-/tmp/verificar-requisitos.out}"
SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
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
if command -v docker >/dev/null 2>&1; then
  docker system df --format 'table {{.Size}} {{.Type}}' 2>/dev/null || printf '%s\n' 'Docker no disponible o daemon detenido'
else
  printf '%s\n' 'docker no instalado'
fi

printf '\n[Software]\n'
for tool in docker docker-compose node npm python3; do
  if command -v "$tool" >/dev/null 2>&1; then
    case "$tool" in
      docker) docker --version 2>/dev/null || true ;;
      docker-compose) docker-compose --version 2>/dev/null || true ;;
      node) node --version 2>/dev/null || true ;;
      npm) npm --version 2>/dev/null || true ;;
      python3) python3 --version 2>/dev/null || true ;;
    esac
  else
    printf '%s: no instalado\n' "$tool"
  fi
done

printf '\n[Puertos esperados]\n'
printf '%s\n' 'Frontend: 5173/tcp' 'API: 5000/tcp' 'MySQL: 3307/tcp (host) / 3306/tcp (contenedor)'
if command -v ss >/dev/null 2>&1; then
  ss -ltnp 2>/dev/null | grep -E ':(5000|5173|3307|3306)\b' || printf '%s\n' 'Ningún puerto esperado está LISTENING'
fi

printf '\n[Compuestos de Docker]\n'
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
  docker compose -f "$SCRIPT_DIR/../docker-compose.yml" config --services 2>/dev/null || true
elif command -v docker-compose >/dev/null 2>&1; then
  docker-compose -f "$SCRIPT_DIR/../docker-compose.yml" config --services 2>/dev/null || true
else
  printf '%s\n' 'Docker Compose no disponible'
fi

printf '\n[Resultado]\n'
CPU_COUNT=$(nproc 2>/dev/null || printf '0')
MEM_GB=$(free -g 2>/dev/null | awk '/^Mem:/ {print $2}' || printf '0')
DOCKER_OK=0
if command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  DOCKER_OK=1
fi
if [ "$CPU_COUNT" -ge 2 ] && [ "$MEM_GB" -ge 4 ] && [ "$DOCKER_OK" -eq 1 ]; then
  printf '%s\n' 'CUMPLIMIENTO: recursos mínimos y Docker operativo detectados.'
else
  printf '%s\n' 'CUMPLIMIENTO: no confirmado; recursos o Docker no están disponibles en el servidor ejecutado.'
fi

printf '\nSalida guardada en: %s\n' "$REPORT"
