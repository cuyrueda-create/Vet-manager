# Runbook — Salud en rojo en el monitor

**Alerta que lo dispara:** el monitor marca el servicio "Salud" en rojo
(`GET /health` sin respuesta, `status: unhealthy` o `database: unhealthy`).
**Prioridad típica:** P1 (app caída) → primera respuesta en 1 h (§9.2).
**Riesgo de la intervención:** bajo si se sigue el orden; no borrar volúmenes
ni tocar `backups/`.

## 1. Confirmar y acotar (≤ 5 min)

```bash
# ¿Responde la API? (desde el servidor o la máquina de operación)
curl -s https://<dominio>/health; echo " -> $?"
```

| Respuesta | Significado | Pasa al paso |
|---|---|:--:|
| JSON `"status":"healthy"` | Falso positivo del monitor (red/intervalo) | 4 |
| JSON `"status":"unhealthy"` con `"database":"unhealthy"` | Backend vivo, MySQL caído o inalcanzable | 2 |
| Sin respuesta / error de conexión | Backend, Caddy o el host caídos | 3 |

## 2. Si la base de datos es la que falla

```bash
docker compose --project-directory . -f deploy/compose.prod.yaml ps mysql
docker compose --project-directory . -f deploy/compose.prod.yaml logs --tail 50 mysql
docker compose --project-directory . -f deploy/compose.prod.yaml exec mysql \
  mysqladmin ping -h localhost -u root -p"$MYSQL_ROOT_PASSWORD"
```

- `mysqld` corriendo y responde → revisar volumen lleno: `df -h` y
  `docker system df`.
- Contenedor detenido/inHealthy → recrear solo mysql:
  `docker compose ... up -d mysql` (el backend espera `service_healthy`).
- Si el contenedor no sube por corrupción o volumen perdido →
  **restauración de desastre: §3.3 del plan** (`docs/plan-implantacion.md`).

## 3. Si el backend o el proxy son los que fallan

```bash
docker compose --project-directory . -f deploy/compose.prod.yaml ps
docker compose --project-directory . -f deploy/compose.prod.yaml logs --tail 100 backend
```

| Hallazgo | Acción |
|---|---|
| `RuntimeError: Falta la variable de entorno SECRET_KEY` | Revisar `.env` (permisos 600) y volver a desplegar |
| `Falta APP_VERSION` (Compose falla a propósito) | Corregir `.env` del servidor |
| Contenedor en `Restarting` | Recursos agotados: `df -h`, `free -h`, reiniciar el host |
| Falló justo después de un despliegue | **Rollback §8.4**: repetir pasos 3–5 con la versión anterior |
| OOM / killer de Docker | `docker inspect` → `OOMKilled`; subir límites o revisar consultas |

## 4. Verificación de salida (obligatoria)

```bash
bash scripts/smoke-test.sh https://<dominio>
```

Esperado: **6/6 pruebas, código de salida 0**. Registrar esa salida en la
bitácora antes de cerrar.

## 5. Escalación y registro

- Si no se recupera en **30 min** o el origen es desconocido → escalar a N2
  (responsable técnico) y notificar al canal acordado (§8.5).
- Si los datos pudieron corromperse → validar huellas: `SELECT COUNT(*)` por
  tabla (20/20 deben coincidir con el respaldo, §3.5).

| Campo | Valor |
|---|---|
| Fecha/hora de la alerta | |
| Fecha/hora de recuperación | |
| Causa raíz | |
| Acción aplicada | |
| ¿Rollback o restauración? (§8.4 / §3.3) | |
| Smoke test final | 6/6 · 0 fallos |
| Registrado por (rol) | |
