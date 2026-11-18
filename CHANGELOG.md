# Changelog

Todos los cambios notables de este proyecto se documentan aquí.
El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/) y
el versionado sigue [Semantic Versioning](https://semver.org/lang/es/).

## [1.1.0] - 2026-11-18

### Agregado
- `GET /health` reporta la duración del proceso (`uptime_s`) y el ambiente
  (`APP_ENV`) además del estado, la base de datos y la versión.
- Etiqueta Git `v1.1.0` e imágenes `vet-manager-backend:1.1.0` y
  `vet-manager-frontend:1.1.0`.

### Cambiado
- `GET /health` ahora distingue el estado real de la base de datos en el campo
  `status` (`healthy` / `unhealthy`) en lugar de reportar siempre `healthy`.

### Al actualizar
- No requiere migraciones de base de datos: `docker compose -f
  deploy/compose.prod.yaml up -d --wait` levanta la versión nueva sobre los
  mismos volúmenes.
- Verificar después de actualizar: `curl -fsS https://TU_DOMINIO/health` debe
  devolver `"version":"1.1.0"`.
- Para revertir, volver a la versión anterior según §5.7 del
  `docs/plan-implantacion.md` (respaldo previo + etiqueta anterior).

## [1.0.0] - 2026-11-18

Versión base del despliegue. Todas las funciones previas del proyecto (citas,
clientes, mascotas, medicamentos, facturación, notificaciones y roles) quedan
consolidadas bajo esta etiqueta.

### Agregado
- `GET /health` con estado real de la base de datos y `version` desde la
  variable de entorno `APP_VERSION`.
- CORS configurable mediante `CORS_ORIGINS` (separados por coma) para poder
  desplegar el frontend en otro dominio.
- `Dockerfile` de backend y frontend con `ARG APP_VERSION` para etiquetar las
  imágenes.
- `Dockerfile` de backend con `UVICORN_OPTS` (producción sin `--reload`) y
  soporte de la variable `PORT` que definen los proveedores PaaS.
- Suite de pruebas pytest en `backend/tests/` (42 pruebas) con cobertura
  reportada por `pytest-cov`; dependencias en `backend/requirements-dev.txt`.
- `deploy/compose.prod.yaml`, `deploy/Caddyfile`, `deploy/env.prod.example`
  y `deploy/render.yaml` para el despliegue en servidor Linux y en Render.
- `scripts/smoke-test.sh`: prueba de humo contra un despliegue vivo.
- `CHANGELOG.md`.

### Cambiado
- `docker-compose.yml`: los secretos (`MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`,
  `SECRET_KEY`, `ADMIN_CREATE_KEY`) salieron del repositorio y ahora se leen
  desde `.env` (plantilla en `.env.example`); el healthcheck de MySQL usa
  `CMD-SHELL` con `$$MYSQL_ROOT_PASSWORD`.
- `app/core/config.py` y `app/api/v1/admin.py`: sin valores por defecto
  hardcodeados; si faltan las variables de entorno, la aplicación falla al
  arrancar (fail-closed) y la creación de administradores queda denegada.
- `Caddyfile`: habilitado el log de accesos (`log`).

### Eliminado
- Los archivos `.env` (raíz, `backend/`, `frontend/`) salieron del control de
  versiones; ahora solo existen las plantillas `.env.example`. **Acción
  pendiente del responsable: rotar las credenciales que quedaron expuestas en
  el historial de Git** (app password de Gmail, `SECRET_KEY`, contraseñas de
  MySQL).

### Al actualizar
- Copiar las variables nuevas a tu `.env`: `cp .env.example .env` y completar
  `MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, `SECRET_KEY` y `ADMIN_CREATE_KEY`.
  Sin ellas `docker compose config` falla a propósito.
- Rebuild de imágenes: `docker compose build --build-arg APP_VERSION=1.0.0`.
- No hay migraciones de esquema pendientes en esta versión.

[1.1.0]: https://github.com/cuyrueda-create/Vet-manager/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/cuyrueda-create/Vet-manager/releases/tag/v1.0.0
