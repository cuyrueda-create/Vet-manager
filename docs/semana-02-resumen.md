# Semana 02 — Resumen de trabajo

Proyecto: Vet Manager

Fecha de preparación: 2026-11-04

## Hecho

- Completé en `plan-implantacion.md` el plan de migración, respaldo e instalación para la arquitectura real del proyecto: MySQL 8, Docker Compose, FastAPI y React.
- Documenté inventario, mapeo de tablas, reglas de rechazo, conciliación, rollback y riesgos. No inventé un sistema legado: el repositorio no identifica uno.
- Añadí RPO/RTO y una política 3-2-1 como propuestas por aprobar, un procedimiento de restauración en ocho pasos y un cronograma de instalación con punto de no retorno.
- Añadí `scripts/respaldar.sh`: genera dump lógico MySQL comprimido, verifica gzip, limita permisos, aplica retención y muestra SHA-256. Los respaldos se excluyen de Git.

## Verificación y pendiente

- La configuración de Docker Compose está instalada, pero el daemon de Docker Desktop no estaba activo al preparar este entregable. Por eso no ejecuté el respaldo ni la restauración y no inventé conteos o tiempos.
- Tras iniciar Docker Desktop, ejecutar `docker compose up -d mysql` y luego `bash scripts/respaldar.sh`. Restaurar el dump en una base separada según la sección 3.4 del plan y completar allí los conteos exactos y el tiempo medido.
- El script comprime, pero no cifra. Cifrar la copia externa antes de transferirla o almacenarla fuera del host. Inventariar además archivos subidos/generados, si existen.
- Antes de producción, rotar y externalizar los valores secretos predeterminados que actualmente aparecen en `docker-compose.yml`; no incluirlos en el plan ni en evidencias.
- La ventana de 2 horas y los objetivos RPO 24 h / RTO 4 h son valores iniciales, pendientes de ensayo y aprobación del responsable del negocio.

## Evidencia local disponible

- Docker Compose reportó que no podía conectarse a `dockerDesktopLinuxEngine` porque el daemon no estaba disponible.
- `docs/plan-implantacion.md` pasó el diagnóstico del editor sin errores.
- Falta ejecutar el respaldo, la restauración en base aparte y la comparación de conteos para completar la evidencia exigida por CE-4.