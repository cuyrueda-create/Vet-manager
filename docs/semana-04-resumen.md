# Semana 04 — Resumen de trabajo

Proyecto: Vet Manager

Fecha: 2026-11-18

## Hecho

- **Liberación 1.0.0:** etiqueta Git `v1.0.0` (y `v1.1.0`), imágenes `vet-manager-backend:1.0.0/1.1.0` y `vet-manager-frontend:1.0.0/1.1.0` construidas con `--build-arg APP_VERSION`, y `CHANGELOG.md` con SemVer justificado y sección "Al actualizar" por versión.
- **Pruebas en verde:** suite pytest en `backend/tests/` (42 pruebas, cobertura 17 %; `security.py`, `schemas.py`, `auth.py` y `models.py` al 100 %). Dependencias en `backend/requirements-dev.txt`, configuración en `pytest.ini`.
- **Carpeta `deploy/`:** `compose.prod.yaml` (imágenes por etiqueta — el servidor nunca complica —, MySQL sin puerto publicado, backend solo en loopback, healthchecks con `--wait`), `Caddyfile` (dominio real), `Caddyfile.local` (pruebas sin dominio), `env.prod.example` y `render.yaml` (Blueprint para Render).
- **`scripts/smoke-test.sh`:** 6 verificaciones (health, BD, versión, `/docs`, frontend, SPA), códigos de salida 0/1, soporte de CA propia y de opciones extra (`SMOKE_CURL_OPTS`).
- **Despliegue en servidor Linux (simulado en WSL, `/opt/vet-manager`):** estructura `releases/` + `respaldos/` + `imagenes/`, `.env` con permisos 600, imágenes transferidas con `docker save | gzip` → `docker load` (267 MB, sin compilar en el destino). **Ciclo completo con prueba de humo en cada paso:** instalar 1.0.0 (6/6) → respaldo previo + actualizar a 1.1.0 (6/6, `/health` con `uptime_s` y `ambiente`) → rollback a 1.0.0 (6/6).
- **§5 del plan a v1** con la estructura del starter del instructor: proceso de liberación, estructura del servidor, variables de entorno, instalación/actualización/rollback con comandos y resultado esperado, clasificación de migraciones, despliegue en nube (Render + Aiven) y estimación de costos de 3 alternativas con fuente y fecha.
- **Arreglos de seguridad/código detectados en el camino:** `deploy/Caddyfile` ahora hace proxy al servicio `backend:5000` de la red interna (antes apuntaba al mapeo de host, inaccesible desde Caddy); `models.py` tenía una importación inexistente (`backend.app.database`); el `ENV APP_VERSION` del frontend invalidaba la caché de `pnpm install`.

## Verificación y pendiente

- **Nube (obligatorio para la rúbrica): ✅ completado el 2026-11-24.** Desplegados `vet-manager-api` (Docker + Aiven Free MySQL) y `vet-manager-web` (static site) desde `deploy/render.yaml`. Prueba de humo **6/6** en `https://vet-manager-api.onrender.com` y frontend verificado en `https://vet-manager-web.onrender.com` con el bundle apuntando al backend. Evidencia en `docs/plan-implantacion.md` §5.3 y guía en `docs/despliegue-render.md`.
- **CI:** el workflow de SonarCloud debe ejecutar pytest con cobertura antes del scan y fijar la acción por SHA; `sonar-project.properties` requiere limpieza. *Pendiente.*
- **Push:** las etiquetas `v1.0.0` y `v1.1.0` y los commits están locales; falta `git push origin cierre-semanas-1-4 --tags` para que se vean en GitHub. *Acción del usuario (o confirmación para hacerlo).*
- El servidor Linux real (Ubuntu Server 24.04 LTS) repetirá la instalación con estos mismos comandos cuando exista; el simulacro en WSL validó el procedimiento.

## Evidencia local disponible

- `docs/plan-implantacion.md` §5: procedimiento completo con evidencias de instalación, actualización y rollback.
- `CHANGELOG.md`, `deploy/`, `scripts/smoke-test.sh` en el repositorio.
- Etiquetas Git `v1.0.0` y `v1.1.0`; imágenes versionadas en Docker.
- Respaldo previo a la actualización: `respaldos/pre-update-1.1.0-<fecha>.sql.gz` en el servidor simulado.
