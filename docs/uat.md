# ✅ Guía de UAT — Pruebas de aceptación del usuario (Semana 9)

**Sistema:** Vet Manager v1.1.0 · **Ejecuta:** usuario designado por el
cliente · **Registran:** responsable técnico + observador (§10.2 del plan).

## Criterios de salida (aceptación)

- Prueba de humo 6/6 (`scripts/smoke-test.sh`).
- Ningún caso de esta guía con defecto bloqueante o mayor.
- Restauración conciliada 20/20 tablas (§3.5).
- Sin secretos en el repositorio y CI en verde (GitHub Actions + Quality
  Gate de SonarCloud en OK).

## Condiciones de la ejecución

| Campo | Valor |
|---|---|
| Fecha y hora | |
| Entorno (URL) | |
| Versión (`GET /health` → `version`) | |
| Datos de prueba | Cliente "UAT Cliente", mascota "UAT Mascota" |
| Participantes (cliente / equipo) | |

> No usar datos reales de pacientes ni correos reales. Cada caso se marca
> ✅ o ❌ con una captura o el mensaje de error.

## Casos de aceptación

### A. Acceso (automatizados en `backend/tests/`)

| ID | Caso | Pasos | Esperado | Resultado |
|---|---|---|---|---|
| F-01 | Login con credenciales válidas | `POST /auth/login` con usuario de prueba | 200 + `access_token` bearer + datos del usuario | ✅ automático: `test_login_funcional.py` |
| F-02 | Login con contraseña incorrecta | Igual, clave errónea | 401 `Credenciales inválidas`, sin token | ✅ automático: `test_login_funcional.py` |
| F-03 | Health sin base de datos | Detener `mysql`, `GET /health` | `"database":"unhealthy"` | ✅ automático: `test_health_sin_base_de_datos` |
| F-04 | CORS: origen desconocido | `GET /health` con `Origin` malicioso | Sin `access-control-allow-origin` | ✅ automático |
| F-05 | Política de contraseñas | Registro/clave débil | 400 con mensaje de fortaleza | ✅ automático: 6 casos |

### B. Flujo del cliente (manual)

| ID | Caso | Pasos | Esperado | Resultado |
|---|---|---|---|:--:|
| C-01 | Registro y confirmación | Registro con correo → clic en enlace | Cuenta activa; sin confirmar no deja entrar | |
| C-02 | Recuperar contraseña | `/recuperar-password` → enlace → clave nueva | Login con la clave nueva | |
| C-03 | Registrar mascota | Mis mascotas → *Nueva mascota* | Aparece en la lista | |
| C-04 | Agendar cita | Nueva cita → mascota → horario | Cita `programada` visible en Mis citas | |
| C-05 | Cancelar cita | Mis citas → cancelar | Estado `cancelada` | |
| C-06 | Ver factura y PDF | Mis facturas → abrir → PDF | PDF descarga con IVA 19% correcto | |

### C. Flujo del personal (manual)

| ID | Caso | Pasos | Esperado | Resultado |
|---|---|---|---|:--:|
| P-01 | Registrar cliente | Recepción → Clientes → nuevo | Cliente creado; correo duplicado rechazado | |
| P-02 | Crear cita por teléfono | Nueva cita → cliente → mascota → veterinario | Cita creada en la agenda del vet | |
| P-03 | Atender cita (veterinario) | Mis citas → Consulta → diagnóstico + medicamento | Consulta guardada, historial actualizado | |
| P-04 | Cambiar estados de cita | programada → en_proceso → realizada | Estados visibles para el cliente | |
| P-05 | Facturar y cobrar | Factura → emitir → pagar | Estado `pagada`; PDF y correo | |
| P-06 | Aprobar usuario nuevo | Admin → Usuarios → aprobar | El usuario ya puede iniciar sesión | |
| P-07 | Reportes por rol | Admin/Vet/Recepción → Reportes | Solo datos de su rol/área | |

### D. Seguridad (manual, 3 casos)

| ID | Caso | Pasos | Esperado | Resultado |
|---|---|---|---|:--:|
| S-01 | Aislamiento por usuario | Login como cliente A, pedir dato de cliente B (cambia el id en la URL) | 403/404, sin fuga | |
| S-02 | Ruta de rol equivocado | Cliente abre `/admin/usuarios` | Redirige; sin datos de admin | |
| S-03 | Token inválido | Pegar token basura en `Authorization` | 401 | |

## Registro de defectos

| # | Caso | Severidad (bloqueante/mayor/menor/cosmético) | Descripción y pasos | Estado |
|---|---|---|---|---|

## Decisión final

| Campo | Valor |
|---|---|
| Defectos 0/bloqueantes · mayores · menores · cosméticos | |
| ¿Se cumplen los criterios de salida? | Sí / No |
| **Decisión del cliente** | Acepta / Rechaza / Acepta con observaciones |
| Firma (cliente) | |
| Firma (responsable técnico) | |
