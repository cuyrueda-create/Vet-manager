#!/usr/bin/env bash
# Prueba de humo (smoke test) para un despliegue de Vet Manager.
# ------------------------------------------------------------------
# Uso:
#   bash scripts/smoke-test.sh https://vet-manager.test:8443 [CA_CERT]
#   bash scripts/smoke-test.sh http://127.0.0.1:8443
#
# Verifica que el servicio responda, que el healthcheck reporte la base de
# datos y la versión, y que el frontend cargue. Sale con 0 si todo pasa,
# 1 si algo falla. No imprime secretos.
set -u

BASE_URL="${1:-}"
CA_CERT="${2:-}"

if [ -z "$BASE_URL" ]; then
  printf 'Uso: %s https://TU_DOMINIO [ruta_del_certificado_CA]\n' "$0" >&2
  exit 2
fi

# Quitar barra final
BASE_URL="${BASE_URL%/}"

CURL_OPTS="-fsS --max-time 15"
if [ -n "$CA_CERT" ]; then
  # Con CA propia: verificar TLS de verdad (sin -k)
  CURL_OPTS="$CURL_OPTS --cacert $CA_CERT"
fi
if [ -n "${SMOKE_INSECURE:-}" ]; then
  # Solo para entornos de prueba con certificado autofirmado
  CURL_OPTS="$CURL_OPTS -k"
fi
# Opciones extra de curl (variable de entorno), p. ej. en Windows/Schannel:
#   SMOKE_CURL_OPTS="--ssl-no-revoke" bash scripts/smoke-test.sh ...
if [ -n "${SMOKE_CURL_OPTS:-}" ]; then
  CURL_OPTS="$CURL_OPTS $SMOKE_CURL_OPTS"
fi

FALLOS=0
paso() { printf '%-42s %s\n' "$1" "$2"; }
falla() { FALLOS=$((FALLOS + 1)); paso "$1" "FALLO — $2"; }

printf '=== Prueba de humo: %s ===\n' "$BASE_URL"
printf 'Fecha: '; date -u '+%Y-%m-%dT%H:%M:%SZ'
printf '\n'

# 1. Healthcheck del backend
HEALTH=$(curl $CURL_OPTS "$BASE_URL/health" 2>/dev/null)
if [ $? -eq 0 ] && [ -n "$HEALTH" ]; then
  if printf '%s' "$HEALTH" | grep -q '"status": *"healthy"'; then
    paso "1. GET /health" "OK — $HEALTH"
  else
    falla "1. GET /health" "responde pero sin status healthy: $HEALTH"
  fi
else
  falla "1. GET /health" "sin respuesta o error de conexión"
  HEALTH=""
fi

# 2. Estado de la base de datos
if [ -n "$HEALTH" ]; then
  if printf '%s' "$HEALTH" | grep -q '"database": *"healthy"'; then
    paso "2. Base de datos reportada" "OK — healthy"
  else
    falla "2. Base de datos reportada" "database no healthy: $HEALTH"
  fi

  # 3. Versión desplegada
  VERSION=$(printf '%s' "$HEALTH" | sed -n 's/.*"version": *"\([^"]*\)".*/\1/p')
  if [ -n "$VERSION" ]; then
    paso "3. Versión desplegada" "OK — $VERSION"
    if [ -n "${ESPERADA:-}" ] && [ "$VERSION" != "$ESPERADA" ]; then
      falla "3. Versión desplegada" "esperada $ESPERADA, llegó $VERSION"
    fi
  else
    falla "3. Versión desplegada" "campo version ausente"
  fi
fi

# 4. Documentación de la API
if curl $CURL_OPTS -o /dev/null "$BASE_URL/docs" 2>/dev/null; then
  paso "4. GET /docs (Swagger)" "OK"
else
  falla "4. GET /docs (Swagger)" "sin respuesta"
fi

# 5. Frontend
if curl $CURL_OPTS -o /dev/null "$BASE_URL/" 2>/dev/null; then
  paso "5. GET / (frontend)" "OK"
else
  falla "5. GET / (frontend)" "sin respuesta"
fi

# 6. Frontend sirve el HTML de la SPA (detrás de Caddy, `/` es React, no la API)
if curl $CURL_OPTS "$BASE_URL/" 2>/dev/null | grep -q "Vet Manager"; then
  paso "6. GET / sirve el HTML de la SPA" "OK"
else
  falla "6. GET / sirve el HTML de la SPA" "respuesta inesperada"
fi

printf '\n'
if [ "$FALLOS" -eq 0 ]; then
  printf 'RESULTADO: TODAS LAS PRUEBAS PASARON (0 fallos)\n'
  exit 0
else
  printf 'RESULTADO: %s FALLO(S) — revisar antes de aceptar el despliegue\n' "$FALLOS"
  exit 1
fi
