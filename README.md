# 🐾 Vet Manager

Sistema de gestión veterinaria full-stack: portal web para clientes, panel de administración, módulos para veterinarios y recepcionistas, y app móvil (Expo/React Native).

## 📁 Estructura del proyecto

```
Vet-manager/
├── backend/     # API REST con FastAPI (Python 3.11) + MySQL
├── frontend/    # Web con React 19 + Vite + React Router
├── mobile/      # App móvil con Expo / React Native
├── database/    # Esquema SQL y migraciones
└── docker-compose.yml
```

## 🧰 Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| Backend | FastAPI, Uvicorn, Pydantic, PyJWT, passlib (pbkdf2_sha256), fpdf2, mysql-connector-python |
| Frontend | React 19, Vite 8, React Router 7, Axios, CSS propio |
| Móvil | Expo 54, React Native 0.81, React Navigation, Axios, AsyncStorage |
| Base de datos | MySQL 8.0 |
| Infraestructura | Docker / Docker Compose, SMTP (Gmail) para correos |

## ✨ Funcionalidades

- **Autenticación y seguridad**: registro con confirmación de correo, login con JWT, recuperación y cambio de contraseña, validación de fortaleza de contraseña, hashing pbkdf2_sha256.
- **4 roles con paneles separados**: `administrador`, `veterinario`, `recepcionista` y `usuario` (cliente), con rutas protegidas (`RoleGuard`) en web y móvil.
- **Gestión de clientes y mascotas**: CRUD completo, fichas de mascotas, historial clínico y perfil de cliente.
- **Citas**: creación, edición, cancelación, estados (`programada`, `en_proceso`, `realizada`, `cancelada`), disponibilidad y horarios de veterinarios, recordatorios.
- **Atención clínica veterinaria**: consulta, registro de diagnósticos, historial clínico y prescripción de medicamentos con dosis/frecuencia.
- **Facturación**: facturas con detalle, subtotal, IVA 19% y total, estados (emitida, pagada, pendiente, anulada), generación de **PDF**, envío por correo y pago.
- **Inventario y medicamentos**: administración de medicamentos e inventario.
- **Notificaciones**: notificaciones dirigidas por usuario en la app y correos automáticos (citas, facturas, registros, recordatorios).
- **Reportes por rol**: financieros, de personal, clientes e inventario (admin); atenciones, diagnósticos y seguimiento (veterinario); caja, citas y pendientes (recepción).
- **Aislamiento por usuario**: cada usuario solo ve sus propios datos.

## 🚀 Puesta en marcha (Docker)

Requisitos: [Docker](https://www.docker.com/) y Docker Compose.

```bash
docker compose up --build
```

Servicios:

| Servicio | URL / Puerto |
|----------|--------------|
| Frontend (web) | http://localhost:5173 |
| Backend (API) | http://localhost:5000 |
| API Docs (Swagger) | http://localhost:5000/docs |
| MySQL | localhost:3307 (base de datos `vet_manager`) |

La base de datos se inicializa automáticamente con `database/schema.sql` y el backend ejecuta sus migraciones al arrancar.

### Móvil

```bash
cd mobile
npm install
npm start        # Expo Dev Server
npm run android  # o npm run ios
```

Configura la IP de tu máquina en `mobile/src/config/api.js` (`baseURL`) para que el dispositivo acceda al backend.

## 🛠 Ejecución sin Docker

**Backend** (Python 3.11+):

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 5000
```

**Frontend** (Node 20+):

```bash
cd frontend
npm install
npm run dev      # http://localhost:5173
```

**Base de datos**: levanta MySQL 8 y ejecuta `database/schema.sql`.

## ⚙️ Variables de entorno

**Backend** (`backend/.env`):

| Variable | Descripción |
|----------|-------------|
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Conexión a MySQL |
| `SECRET_KEY` | Clave para firmar los tokens JWT |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD` | SMTP para correos |

**Frontend** (`frontend/.env`):

| Variable | Descripción |
|----------|-------------|
| `VITE_API_URL` | URL base de la API (ej. `http://localhost:5000`) |
| `VITE_APP_NAME`, `VITE_CONTACT_*` | Datos de la interfaz |

**Docker Compose** usa además `ADMIN_CREATE_KEY` para la creación de administradores.

## 🗄 Base de datos

Tablas principales (`database/schema.sql`): `usuarios`, `clientes`, `mascotas`, `citas`, `servicios`, `consultorio`, `historial_clinico`, `medicamentos`, `medicamentos_asignados`, `facturas`, `factura_detalle`, `notificaciones`, `inventario`, `insumos`, `proveedores`, `productos`, `reportes`, `agenda`.

Archivos disponibles:

- `database/schema.sql` — esquema completo (usado por Docker).
- `database/schema_clean.sql` — versión limpia del esquema.
- `database/migration_tratamientos_personalizados.sql` — migración adicional.

## 📡 API

Documentación interactiva en `/docs` (Swagger UI) y `/redoc`. Algunos endpoints principales:

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/request-reset`, `POST /auth/confirm-email`
- `GET/POST/PUT/DELETE /api/citas`, `GET /api/citas` con filtros
- `GET/POST/DELETE /api/mascotas`, `GET/POST /api/clientes`
- `POST /api/facturas`, `GET /api/facturas/{id}/pdf`, `PUT /api/facturas/{id}/pagar`
- `GET/POST /api/notificaciones`, `PUT /api/notificaciones/{id}/leer`
- `GET/POST /api/reportes/*` — reportes por rol
- `/api/vet/*` — consulta, historial y disponibilidad del veterinario
- `/admin/usuarios` — gestión de usuarios (requiere rol administrador)

## 📱 Módulos por rol

| Rol | Web (`frontend/src/pages`) | Móvil (`mobile/src/screens`) |
|-----|----------------------------|------------------------------|
| Administrador | Dashboard, Usuarios, Equipo, Citas, Inventario, Medicamentos, Reportes, Bloc | `admin/` |
| Veterinario | Dashboard, Mis citas, Consulta, Historial, Medicamentos, Reportes | `veterinario/` |
| Recepcionista | Dashboard, Citas, Clientes, Mascotas, Facturas, Reportes | `recepcionista/` |
| Cliente | Mis citas, Nueva cita, Mis mascotas, Mis facturas | `usuario/` |

## 📄 Licencia

Proyecto privado. Ver `mobile/LICENSE` para la licencia del código base de la app móvil.
