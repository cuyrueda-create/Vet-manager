# Semana 03 — Resumen de trabajo

Proyecto: Vet Manager

Fecha de preparación: 2026-11-04

Actualización: 2026-11-18 (cierre de pendientes)

## Hecho

- Completé la sección 4 del `plan-implantacion.md` (hosting y dominio): tipo de hosting por componente con alternativa en servidor propio, dominio y registros DNS con TTL y responsable de renovación, camino de la petición y puertos abiertos justificados, reverse proxy con Caddy y método de transferencia por SFTP con llave SSH.
- Configuré el reverse proxy en el repositorio (`Caddyfile`) con dos nombres (`vet-manager.test` y `localhost`), certificado `tls internal` y enrutamiento por path hacia `backend:5000` y `frontend:5173`.
- **Cierre del 2026-11-18:** levanté el stack completo (`mysql`, `backend`, `frontend`, `caddy`) y ejecuté la prueba local con verificación TLS real (CA de Caddy, sin `-k`):
  - `GET /` → `HTTP 200` (build React)
  - `GET /health` → `HTTP 200` → `{"status":"healthy","database":"healthy"}` (**integración completa Caddy → FastAPI → MySQL**)
  - `GET /docs` → `HTTP 200` (FastAPI)
  - Segundo nombre del certificado (`localhost:8443`) → `HTTP 200`
  - `Via: 1.1 Caddy` en la respuesta
- **Encabezados del proxy verificados** con un servicio efímero detrás del mismo reverse proxy: `X-Forwarded-For`, `X-Forwarded-Host`, `X-Forwarded-Proto: https` y `Via: 1.1 Caddy`.
- **Prueba negativa ejecutada (cerraba un pendiente):** desde la IP de la red (`10.90.40.59`) los puertos 3307 (MySQL), 5000 (API), 5173 (frontend) y 8443 (Caddy) responden **False (bloqueados)**; desde loopback responden True. MySQL no es accesible desde una interfaz pública.
- **Correcciones aplicadas:** los contenedores publicaban puertos en `0.0.0.0` (todas las interfaces) pese a que el plan exige solo loopback; se recrearon con la configuración actual (`127.0.0.1`). Se reconstruyó la imagen del backend porque faltaba el paquete `alembic` (`Application startup failed`) y se habilitó el log de accesos de Caddy (`log`).

## Verificación y pendiente

- El dominio de producción sigue pendiente de elección y aprobación del cliente; `vet-manager.test` es solo para pruebas locales y no se publica en DNS.
- Los registros DNS de producción se incorporarán después de contratar el dominio y asignar la IP pública (§4.3).
- En producción, Caddy debe usar ACME/Let's Encrypt en los puertos 80/443; el `tls internal` actual es solo local.
- La publicación por SFTP está documentada con valores de marcador (§4.6); requiere llave SSH generada en el servidor real.

## Evidencia local disponible

- `plan-implantacion.md` §4.5: evidencia de cierre del 2026-11-18 con tabla de pruebas, encabezados verificados y prueba negativa de puertos.
- `Caddyfile` en el repositorio con `log` habilitado.
- Estado de servicios: caddy `127.0.0.1:8443`, backend `127.0.0.1:5000`, mysql `127.0.0.1:3307`, frontend sin publicar.
