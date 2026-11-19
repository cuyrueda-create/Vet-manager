# 🐾 Vet Manager — Guía rápida (v1.1.0)

Guía para tareas del día a día. Dura menos de 5 minutos. Si algo no sale,
consulta la [FAQ](faq.md) o reporta el problema (§9.2 del plan).

## 1. Entrar al sistema

1. Abre la URL de la clínica (la que te dio el equipo, ej.
   `https://vet-manager.test:8443` en local).
2. Pulsa **Iniciar sesión** (`/login`) y escribe tu correo y contraseña.
3. **Primera vez:** registra tu cuenta (`/registro`) y confirma el correo con
   el enlace que llega a tu bandeja (`/confirmar-email`). Sin confirmar, no
   puedes entrar.
4. Olvidaste la contraseña: **Recuperar contraseña** (`/recuperar-password`).
   Si el correo está registrado recibirás instrucciones; si no aparece nada,
   la cuenta no existe o el correo es otro.

Tu menú cambia según tu rol (cliente, recepcionista, veterinario o
administrador).

## 2. Como cliente: mis citas, mis mascotas y mis facturas

| Quiero… | Voy a… | Paso corto |
|---|---|---|
| Agendar una cita | **Nueva cita** (`/usuario/nueva-cita`) | Elige mascota → fecha y hora disponibles → confirma |
| Ver mis citas | **Mis citas** (`/usuario/dashboard`) | Filtra por estado: `programada`, `realizada`, `cancelada` |
| Registrar mi mascota | **Mis mascotas** (`/usuario/mis-mascotas`) | *Nueva mascota* → nombre, especie, raza, datos → guardar |
| Ver mi factura | **Mis facturas** (`/usuario/mis-facturas`) | Abre la factura → *PDF* para descargarla |

## 3. Como recepcionista

| Quiero… | Voy a… | Paso corto |
|---|---|---|
| Registrar un cliente | **Clientes** (`/recepcion/clientes`) | *Nuevo cliente* → nombre, correo, teléfono → guardar |
| Agendar una cita por alguien | **Nueva cita** (`/recepcion/nueva-cita`) | Busca el cliente → mascota → horario del veterinario |
| Ver/estado de citas | **Citas** (`/recepcion/citas`) | Cambia estado: `programada` → `en_proceso` → `realizada` |
| Ficha de una mascota | **Mascotas** → ficha (`/recepcion/mascotas`) | Desde el perfil del cliente (`/recepcion/cliente/:id`) |

> El correo del cliente debe ser único: si ya existe, el sistema avisa
> *"El email ya está registrado"*.

## 4. Como veterinario

| Quiero… | Voy a… |
|---|---|
| Ver mi agenda del día | **Mis citas** (`/veterinario/mis-citas`) |
| Atender una cita | **Consulta** desde la cita (`/veterinario/consulta/:id`) → diagnóstico, indicaciones, medicamentos |
| Revisar antecedentes | **Historial** (`/veterinario/historial`) → historial clínico por mascota |
| Prescribir medicamentos | **Medicamentos** (`/veterinario/medicamentos`) |

## 5. Como administrador

Dashboard, **Usuarios** (aprobar cuentas), **Personal**, **Inventario**,
**Medicamentos**, **Reportes** y **Bloc** en `/admin/*`. La creación de
nuevos administradores requiere la clave `ADMIN_CREATE_KEY` que solo tiene el
responsable técnico.

## 6. Cerrar sesión

Cierra sesión desde tu avatar/menú, sobre todo en equipos compartidos. La
sesión JWT dura 30 días: en un equipo ajeno, cerrar sesión es obligatorio.

---

**Versiones:** esta guía corresponde a Vet Manager **1.1.0**. Revisar si el
sistema cambia de versión (aparece en `GET /health`).
