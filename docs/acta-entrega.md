# 📝 Acta de entrega — Vet Manager

> **BORRADOR sin firmas.** Se completa y firma en la sesión de aceptación de
> la semana 9 (§10.4 del plan). Sin secretos ni credenciales reales: los
> accesos se transfieren por canal aparte y se registran solo como
> "entregado".

## 1. Datos del acta

| Campo | Valor |
|---|---|
| Cliente / unidad | |
| Proyecto | Vet Manager — sistema de gestión veterinaria |
| Fecha de entrega | |
| Versión entregada | v1.1.0 (`GET /health` → `version: 1.1.0`) |
| Repo | `github.com/cuyrueda-create/Vet-manager` (rama `main`) |

## 2. Alcance entregado

| Componente | Contenido | Estado |
|---|---|---|
| API (backend) | FastAPI + MySQL 8, autenticación JWT, 4 roles, citas, facturación PDF, reportes | ✅ |
| Web (frontend) | React 19, paneles por rol, rutas protegidas | ✅ |
| Móvil | Expo/React Native con los mismos roles | ✅ |
| Infraestructura | Docker Compose (desarrollo) + `deploy/compose.prod.yaml` (producción) + Caddy | ✅ |
| Calidad | 51 pruebas automáticas, CI en verde, SonarCloud Quality Gate OK (cobertura 100 % código nuevo) | ✅ |
| Respaldo | `scripts/respaldar.sh` diario 03:00, retención 7 días, restauración probada (20/20 tablas) | ✅ |
| Documentación | Plan de implantación §1–§10, guía rápida, FAQ, runbooks, UAT | ✅ |
| Despliegue en nube | Render + Aiven (§5.3) | ⬜ Pendiente (se anexa acta complementaria al ejecutarse) |

## 3. Niveles de servicio acordados (§9.2)

| Prioridad | Primera respuesta | Solución o alternativa |
|---|---|---|
| P1 (app caída) | 1 h | Rollback o restauración (§8.4 / §3.3) |
| P2 (función rota) | 24 h | Parche en la siguiente ventana |
| P3 (mejora menor) | 5 días hábiles | Backlog |
| P4 (cosmético) | Próxima versión | Backlog |

Ventana de mantenimiento: domingos 02:00–04:00, aviso 48 h antes.
RPO 24 h / RTO 4 h (respaldo §3).

## 4. Transferencia de accesos

Se entrega por **canal aparte** (no en este documento):

| Acceso | Responsable que lo transfiere | Receptor |
|---|---|---|
| Panel Render (servicios `vet-manager-api`, `vet-manager-web`) | | |
| Aiven (instancia MySQL) | | |
| GitHub (roles: admin/maintainer) | | |
| Dominio / DNS | | |
| Servidor Linux (SSH, si aplica) | | |
| Correo transaccional (app password) | | |
| SonarCloud (organization) | | |

Verificación: cada receptor cambia su contraseña tras recibirla (rotación de
secretos §7.4).

## 5. Criterios de aceptación cumplidos

- [ ] Prueba de humo 6/6 contra la URL entregada.
- [ ] UAT sin defectos bloqueantes/mayores (`docs/uat.md`).
- [ ] Restauración desde respaldo conciliada 20/20 tablas.
- [ ] CI en verde + Quality Gate SonarCloud OK.
- [ ] Sin secretos en el repositorio (`git grep` limpio, §7.4).
- [ ] Capacitación dada (§9.3) con materiales: guía rápida + FAQ.

## 6. Firmas

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Representante del cliente | | | |
| Responsable técnico | | | |
| Observador (otro equipo) | | | |

*Una vez firmada, esta acta reemplaza los borradores de §10.2/§10.4 y se
archiva en `docs/acta-entrega.md` con fecha en el nombre del commit.*
