# Despliegue en Render + Aiven — guía de una sola sesión

Esta guía deja el proyecto **listo para subir completo**: el blueprint ya está corregido y no hace falta volver a tocar código después. Solo hay que crear la BD en Aiven y pegar 5 valores en Render.

## Antes de empezar (ya verificado)

- `main` y `develop` apuntan al mismo commit; CI verde y Quality Gate OK.
- `deploy/render.yaml` validado: 2 servicios (`web/docker` + `web/static`), build con **pnpm** (no `npm ci`), `routes` con fallback a `/index.html`.
- `SECRET_KEY` y `ADMIN_CREATE_KEY` los **genera Render** (`generateValue: true`).
- `CORS_ORIGINS` y `FRONTEND_BASE_URL` se resuelven solos con `fromService` (el backend normaliza el hostname a `https://`). **`VITE_API_URL` es una URL fija** (`https://vet-manager-api.onrender.com`): `fromService` no se resolvía al compilar con Vite y el bundle quedaba apuntando a `localhost:5000`.
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

> **Nota real del despliegue (2026-11-24):** `DB_NAME` se fijó a `defaultdb` en el blueprint porque el valor inicial `Vet_manager` no existía en Aiven. Si ves `Unknown database`, haz *Sync* del blueprint. También se corrigió `COPY . . # NOSONAR` (Docker interpretaba `#` como archivo) y se añadió creación automática del esquema base para BDs vacías.

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
| Frontend carga pero las peticiones dan 404 o van a `localhost:5000` | `VITE_API_URL` no se inyectó en el build | Confirmar `VITE_API_URL = https://vet-manager-api.onrender.com` y hacer **Manual Deploy con Clear build cache** (Vite incrusta la variable al compilar) |
| Rutas `/reset-password?...` dan 404 | Falta el rewrite | Ya está en el blueprint (`routes: /* → /index.html`) |
| CORS blocked | `CORS_ORIGINS` sin `https://` | Ya se normaliza en `config.py`; no rellenar a mano |
| El correo no llega | **Render Free bloquea SMTP (25/465/587)** | Usa la API HTTPS de Brevo: genera una *API key* en **SMTP & API → Claves API** y ponla en `BREVO_API_KEY`. El código sale por puerto 443 |

## ⚠️ Render Free y SMTP

Render bloquea el **tráfico SMTP saliente en puertos 25, 465 y 587** en los planes gratuitos (cambio de sept 2025). Aunque Brevo esté bien configurado, el correo fallará con `Correo de verificación no disponible`. La solución es enviar por **HTTPS (puerto 443)** con la API de Brevo:

1. Brevo → **Configuración → SMTP y API → pestaña "Claves API y MCP"** → **Generar una nueva clave API** → copiarla.
2. Render → `vet-manager-api` → **Environment** → `BREVO_API_KEY` = esa clave API.
3. **Manual Deploy**. El backend detecta la clave y envía el código por `https://api.brevo.com/v3/smtp/email` sin usar SMTP.

Si más adelante pasas a un plan de pago de Render, SMTP volvería a funcionar y la API sigue funcionando igual.

## Configurar Brevo para el código de verificación (SMTP local)

1. Crea cuenta en **https://www.brevo.com** y verifica tu dominio o dirección de remitente (**Senders → Domains/Addresses**). Sin esto Brevo rechaza el correo.
2. En **SMTP & API → SMTP** copia:
   - **Server**: `smtp-relay.brevo.com`
   - **Port**: `587`
   - **Login**: tu correo de cuenta Brevo
   - **SMTP key**: pulsa **Generate a new SMTP key** y cópiala (solo se ve una vez).
3. En Render → `vet-manager-api` → **Environment** rellena:

| Variable | Valor |
|---|---|
| `EMAIL_HOST` | `smtp-relay.brevo.com` (ya viene en el blueprint) |
| `EMAIL_PORT` | `587` (ya viene) |
| `EMAIL_FROM` | la dirección verificada en Brevo, p. ej. `contacto@vetmanager.app` |
| `EMAIL_USER` | tu login de Brevo |
| `EMAIL_PASSWORD` | la SMTP key de Brevo |

4. **Manual Deploy**. Prueba registrando un usuario: debe llegar un correo con un **código de 6 dígitos** y la cuenta no se activa hasta que lo teclees en el modal.

> Si el correo sigue sin llegar, mira los logs del servicio: aparecerá `Aviso: no se pudo enviar el código de verificación: ...` con el motivo exacto (remitente no verificado, clave incorrecta, etc.).

## Rollback

Render → *Deploys → Rollback to previous deploy* (no reconstruye). Para datos, Aiven Free no tiene PITR: restaurar con `scripts/restaurar.sh` desde un dump (ver plan §3.4).
