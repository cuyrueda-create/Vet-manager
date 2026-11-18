# Semana 02 — Resumen de trabajo

Proyecto: Vet Manager

Fecha de preparación: 2026-11-04

## Hecho

- Completé en `plan-implantacion.md` el plan de migración, respaldo e instalación para la arquitectura real del proyecto: MySQL 8, Docker Compose, FastAPI y React.
- Documenté inventario, mapeo de tablas, reglas de rechazo, conciliación, rollback y riesgos. No inventé un sistema legado: el repositorio no identifica uno.
- Añadí RPO/RTO y una política 3-2-1 como propuestas por aprobar, un procedimiento de restauración en ocho pasos y un cronograma de instalación con punto de no retorno.
- Añadí `scripts/respaldar.sh`: genera dump lógico MySQL comprimido, verifica gzip, limita permisos, aplica retención y muestra SHA-256. Los respaldos se excluyen de Git.

## Verificación y pendiente

- **Pendiente cerrado el 2026-11-18:** con Docker Desktop activo se ejecutó `bash scripts/respaldar.sh` (dump `.sql.gz` con `gzip -t` y SHA-256 verificados), se restauró en la base aparte `vet_manager_restore` en 2 segundos y se compararon los `COUNT(*)` exactos de las 20 tablas (110 filas): **coincidencia total**. Se completó también el simulacro de desastre: se borró la tabla `usuarios` y se recuperó desde el dump con PK, UNIQUE y las 4 FK de `citas` intactas. La evidencia completa está en `plan-implantacion.md` §3.5.
- Corrección aplicada: `respaldar.sh` ahora volca como `root` dentro del contenedor, porque `vet_user` no tiene los privilegios `PROCESS` / `SHOW CREATE PROCEDURE` que exigen `--routines` y `--events`.
- El script comprime, pero no cifra. Cifrar la copia externa antes de transferirla o almacenarla fuera del host. Inventariar además archivos subidos/generados, si existen.
- Antes de producción, rotar y externalizar los valores secretos predeterminados que aparecían en `docker-compose.yml`; **hecho el 2026-11-18**: los secretos salieron del repositorio y pasaron a variables de entorno (ver `.env.example`).
- La ventana de 2 horas y los objetivos RPO 24 h / RTO 4 h son valores iniciales, pendientes de ensayo y aprobación del responsable del negocio.

## Evidencia local disponible

- Respaldo real: `backups/mysql/vet_manager-20261118T185238Z.sql.gz` — SHA-256 `0ce11a55cd27ce053a883cca3126ca16399b1c4c552ab963ff6d845e1fef9494`.
- Restauración en `vet_manager_restore`: 2 s, 20/20 tablas con conteos idénticos (§3.5).
- Simulacro de desastre: recuperación de `usuarios` con restricciones intactas (§3.5).
- `docs/plan-implantacion.md` pasó el diagnóstico del editor sin errores.