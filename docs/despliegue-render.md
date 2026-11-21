# Despliegue en Render + Aiven — guía de una sola sesión

Esta guía deja el proyecto **listo para subir completo**: el blueprint ya está corregido y no hace falta volver a tocar código después. Solo hay que crear la BD en Aiven y pegar 5 valores en Render.

## Antes de empezar (ya verificado)

- `main` y `develop` apuntan al mismo commit; CI verde y Quality Gate OK.
- `deploy/render.yaml` validado: 2 servicios (`web/docker` + `web/static`), build con **pnpm** (no `npm ci`), `routes` con fallback a `/index.html`.
- `SECRET_KEY` y `ADMIN_CREATE_KEY` los **genera Render** (`generateValue: true`).
- `CORS_ORIGINS`, `FRONTEND_BASE_URL` y `VITE_API_URL` se resuelven solos con `fromService`. El backend y el frontend normalizan el hostname a `https://`.
- Las migraciones de arranque incluyen el DDL de `confirm_token_expires` y la revisión Alembic `0002`.

## Paso 1 — Aiven (MySQL Free)

1. https://aiven.io → **Sign up** → crear project (ej. `vet-manager`).
2. **Create service → MySQL → plan Free** → nombre `vet-manager-db` → **Create**.
3. Esperar a **Running** (2–5 min).
4. En **Overview → Connection information** copiar:
   - **Host**, **Port**, **User** (`avnadmin`), **Password**
   - Base de datos: `defaultdb` (o crear una nueva en **Databases**)
5. En **Aiven → tu servicio → Advanced configuration**, asegúrate de que sea accesible desde Internet (por defecto lo está).

> Aiven puede pedir tarjeta solo para verificar identidad; el plan Free es $0.

## Paso 2 — Render (Blueprint)

1. https://dashboard.render.com → **New → Blueprint**.
2. Conectar la cuenta de GitHub y seleccionar **`cuyrueda-create/Vet-manager`**, rama **`main`**.
3. Render detecta `deploy/render.yaml` → **Apply**.
4. En la pantalla de variables, rellenar **solo estos 5 valores** del paso 1:

| Variable | Valor |
|---|---|
| `DB_HOST` | Host de Aiven |
| `DB_PORT` | Puerto de Aiven |
| `DB_NAME` | `defaultdb` |
| `DB_USER` | `avnadmin` |
| `DB_PASSWORD` | Password de Aiven |

Los demás campos (`DB_OWNER_USER`, `DB_OWNER_PASSWORD`, `SECRET_KEY`, `ADMIN_CREATE_KEY`, `CORS_ORIGINS`, `FRONTEND_BASE_URL`, `VITE_API_URL`, `EMAIL_*`) ya vienen resueltos o son opcionales. **No los cambies** para que el despliegue sea realmente de una vez.

5. **Apply** y esperar. El backend tarda un poco más (build Docker + migraciones).

## Paso 3 — Verificación

Cuando ambos servicios estén `Live`:

```bash
bash scripts/smoke-test.sh https://vet-manager-api.onrender.com
```

Debe dar **6/6 en verde**. Si el nombre del servicio lleva sufijo, usa la URL real que muestra Render.

Comprobaciones extra:
- `GET https://vet-manager-api.onrender.com/health` → `status: healthy`, `database: healthy`
- Abrir la URL del static site → carga el login
- Registrar un usuario → si no configuraste `EMAIL_USER`, la cuenta se activa directamente (modo local); si configuraste Gmail, llega el correo de confirmación

## Paso 4 — Evidencia para la rúbrica

Guarda la salida del smoke test en `docs/plan-implantacion.md` §5.3 y actualiza `docs/acta-entrega.md` (la fila "Despliegue en nube" está marcada como pendiente).

## Problemas típicos

| Síntoma | Causa | Arreglo |
|---|---|---|
| Backend `unhealthy` | Aiven rechaza la conexión (IP no permitida o SSL) | Revisar `DB_PORT` y el allowlist de Aiven |
| Frontend carga pero las peticiones dan 404 | `VITE_API_URL` mal resuelto | Confirmar que `fromService` apunta a `vet-manager-api`; no hardcodear la URL |
| Rutas `/reset-password?...` dan 404 | Falta el rewrite | Ya está en el blueprint (`routes: /* → /index.html`) |
| CORS blocked | `CORS_ORIGINS` sin `https://` | Ya se normaliza en `config.py`; no rellenar a mano |
| El correo no llega | `EMAIL_USER`/`EMAIL_PASSWORD` vacíos | Es opcional: rellénalos en Environment y haz *Manual Deploy* |

## Rollback

Render → *Deploys → Rollback to previous deploy* (no reconstruye). Para datos, Aiven Free no tiene PITR: restaurar con `scripts/restaurar.sh` desde un dump (ver plan §3.4).
