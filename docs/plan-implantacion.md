# 📘 Plan de Implantación — Vet Manager

| Campo | Valor |
|---|---|
| Proyecto | Vet Manager — sistema de gestión veterinaria |
| Equipo | Equipo de desarrollo del proyecto |
| Versión del plan | 1.0 |
| Fecha | 2026-10-06 |

---

## 1. Ficha técnica y requisitos mínimos — Semana 1 (CE-1, CE-2)

### 1.1 Descripción técnica

Vet Manager es una plataforma full-stack para clientes, administradores, veterinarios y recepcionistas. La web utiliza una API REST de FastAPI y una SPA React/Vite; la aplicación móvil usa Expo/React Native y comparte la misma API. MySQL 8.0 almacenará clientes, mascotas, citas, servicios, consultas, facturas, inventario y notificaciones. La separación por roles protege los módulos y evita que cada usuario acceda a datos ajenos.

### 1.2 Inventario de software

| Componente | Función | Versión | Licencia | ¿Genera costo? |
|---|---|---|---|---|
| MySQL Server | Base de datos y almacenamiento persistente | 8.0 | GPL-2.0/Open Source; soporte comercial opcional | No para el proyecto |
| FastAPI + Uvicorn | API REST y servidor de aplicaciones | FastAPI ≥0.104.0; Uvicorn ≥0.24.0 | MIT / BSD-3-Clause | No |
| mysql-connector-python | Conexión Python a MySQL | ≥8.1.0 | GPL-2.0 | No para el uso del proyecto |
| React + React DOM | SPA web | 19.2.4 | MIT | No |
| React Router | Enrutado de la aplicación web | 7.13.2 | MIT | No |
| Vite | Compilación y servidor de desarrollo web | 8.0.2 | MIT | No |
| Axios | HTTP client de frontend y móvil | 1.13.6 en web; 1.18.1 en móvil | MIT | No |
| Expo | Entorno de desarrollo y compilación móvil | 54.0.37 | MIT | No |
| React Native | Aplicación móvil nativa | 0.81.5 | MIT | No |
| Node.js | Runtime para el frontend y la aplicación móvil | 20 LTS en Docker; versión bloqueada por dependencias | Open Source | No |
| Python | Runtime de la API | 3.11 en Docker | Open Source | No |
| Docker Compose | Orquestación local de servicios | 3.8 | Apache-2.0 | No |

> La licencia de MySQL depende del modelo de uso y puede incluir soporte comercial; el repositorio usa la imagen Open Source. No se ha identificado un componente de licencias copyleft que imponga un costo obligatorio al proyecto.

### 1.3 Sistema operativo del servidor

| Campo | Valor |
|---|---|
| Distribución y versión | Ubuntu Server LTS 24.04 |
| Arquitectura | x86_64 o ARM64, según el proveedor del servidor |
| Fin de soporte estándar | 2028-04, para Ubuntu 24.04 LTS |
| Licencia | Ubuntu Pro / GPLv2 salvo las piezas de soporte comercial opcionales |
| Requisitos mínimos oficiales | [Ubuntu 24.04 LTS](https://ubuntu.com/about/release-cycle) |

El despliegue de Docker usa `python:3.11-slim`, `node:20-alpine` y `mysql:8.0`; el servidor host debe proporcionar el soporte de esos runtimes y una distribución Linux compatible.

### 1.4 Medición de consumo

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---:|---:|---:|
| MySQL 8.0 | 512 MiB | 1 GiB | 0,6 vCPU |
| API FastAPI/Uvicorn | 128 MiB | 256 MiB | 0,3 vCPU |
| Frontend React/Vite | 32 MiB | 96 MiB | 0,2 vCPU |
| **Total** | **672 MiB** | **1,35 GiB** | **1,1 vCPU** |

Los valores de reposo son una referencia de despliegue local y no representan mediciones ejecutadas en el servidor final. La carga simulada recomendada es 20 usuarios concurrentes realizando operaciones de lectura, autenticación y consultas a la API. El margen de 50% se aplica a la medición pico para cubrir transitorios y el consumo de la base de datos.

> **Nota:** Los valores de RAM pueden variar según el sistema operativo base.

### 1.5 Matriz de requisitos

| Requisito | Mínimo | Recomendado | Justificación |
|---|---:|---:|---|
| CPU | 1 vCPU | 2 vCPU | Pico de referencia 1,1 vCPU; 50% de margen |
| RAM | 2 GiB | 4 GiB | 1,35 GiB de pico observado en referencia; 2 GiB de margen |
| Disco | 20 GiB | 40 GiB SSD | Almacenamiento de base de datos, logs y resultados; 20 GiB de margen |
| Tipo de disco / IOPS | SSD, 500 IOPS | SSD, 1.000 IOPS | Necesita rendimiento para consultas y escritura; carga simulada |
| Red | 100 Mbps | 1 Gbps | API y frontend; tráfico de datos y notificaciones |
| Arquitectura | x86_64 o ARM64 | x86_64 | Compatibilidad con MySQL 8.0, Python 3.11 y Node 20 |
| Sistema operativo | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS con actualizaciones seguras | Soporte estándar hasta 2028-04 |
| Docker / runtime | Docker Engine + Compose 2 | Docker Engine + Compose 2 con healthchecks | Orquestación declarativa de los tres servicios |
| Puertos | 5000, 5173, 3307 | 5000, 5173, 3307, con firewall | Acceso a API, web y base de datos desde los límites previstos |

**Cálculo de requisitos recomendados:** CPU $1{,}1 \times 1{,}5 = 1{,}65$ vCPU; se redondea a 2 vCPU. RAM $1{,}35 \times 1{,}5 = 2{,}025$ GiB; se redondea a 4 GiB. El disco se cifra con 40 GiB para recibir un margen de almacenamiento y copias de seguridad.

### 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato | Torre o rack de 1U/2U | Funciona en servidor físico o VM con recursos aislados |
| Nivel RAID del servidor de base de datos | RAID 1 para discos de datos; RAID 10 si hay disponibilidad de discos suficientes | RAID 1 protege contra fallo de disco, mientras que RAID 10 ofrece mayor rendimiento y tolerancia |
| Plataforma de ejecución | Bare metal o VM Linux con Docker | El proyecto no depende de un hipervisor específica; Docker simplifica el despliegue |

Para una instalación en cliente, se recomienda una máquina de torre o rack con 2 vCPU, 4 GiB RAM y un SSD de 40 GiB. En el servidor de base de datos, se recomienda dos discos SSD de igual capacidad y un RAID 1; si el ingreso de datos es alto, RAID 10 con cuatro discos. El rango RAID 1 evita pérdida de datos por un único disco, pero no recupera una corrupción silenciosa; las copias de seguridad siguen siendo obligatorias.

### 1.7 Verificación de requisitos

Script: `scripts/verificar-requisitos.sh` del repositorio del proyecto. El script salta con
código `0` cuando los requisitos están confirmados y con `1` cuando no; incluye un chequeo
propio del proyecto (archivos requeridos y validación de `docker compose config`).

**Ejecución exitosa — 2026-11-18, WSL2 Ubuntu 26.04 (x86_64), Docker activo:**

```text
=== Verificación de requisitos de Vet Manager ===
Fecha: 2026-11-18T19:03:29Z
Servidor: Linux DESKTOP-70FUBQ7 6.18.58.1-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Tue Oct 27 00:24:11 UTC 2026 x86_64 GNU/Linux
Sistema operativo: ubuntu 26.04

[CPU]
vCPU: 16
Architecture:                            x86_64
CPU(s):                                  16
Model name:                              AMD Ryzen 7 7735HS with Radeon Graphics

[RAM]
               total        used        free      shared  buff/cache   available
Mem:           6.6Gi       1.6Gi       3.3Gi       5.3Mi       1.9Gi       5.0Gi
Swap:          2.0Gi          0B       2.0Gi

[Disco]
Filesystem     Type  Size  Used Avail Use% Mounted on
/dev/sdf       ext4 1007G  1.3G  955G   1% /
Espacio disponible para docker-compose:
SIZE TYPE
5.483GB Images
770kB Containers
333.3MB Local Volumes
4.244GB Build Cache

[Software]
Docker version 29.5.3, build d1c06ef
Docker Compose version v5.1.4
node: no instalado (el proyecto los ejecuta dentro de Docker)
11.16.0
Python 3.14.4

[Puertos esperados]
Frontend: 5173/tcp
API: 5000/tcp
MySQL: 3307/tcp (host) / 3306/tcp (contenedor)
LISTEN 0      4096                *:5173            *:*
LISTEN 0      4096                *:5000            *:*
LISTEN 0      4096                *:3307            *:*

[Chequeo propio del proyecto: archivos requeridos]
OK   docker-compose.yml
OK   Caddyfile
OK   backend/app/main.py
OK   backend/requirements.txt
OK   frontend/package.json
OK   database/schema.sql
OK   scripts/respaldar.sh

[Chequeo propio del proyecto: configuración de Compose]
docker compose config: válida
Servicios: mysql backend frontend caddy

[Resultado]
CUMPLIMIENTO: confirmado (CPU>=2 vCPU, RAM>=4 GiB, Docker operativo, archivos y Compose válidos).
```

Código de salida: **0**.

**Pruebas de fallo provocadas (2026-11-18):** cuatro fallos distintos provocados y detectados,
cada uno con código de salida `1`:

| # | Fallo provocado | Cómo se provocó | Detección del script |
|---|---|---|---|
| 1 | Docker no disponible | Ejecución con `PATH` restringido (`/usr/bin:/bin`, sin cliente de Docker) | `Docker: daemon no disponible o cliente sin configurar` → `Docker sin operar; Compose inválido` |
| 2 | Archivo requerido faltante | `mv Caddyfile Caddyfile.bak` (restaurado después) | `FALTA Caddyfile` → `archivos del proyecto faltantes` |
| 3 | RAM por debajo del umbral | `MIN_MEM_GB=9999` (umbral por encima de la RAM real) | `RAM<9999GiB` |
| 4 | Compose inválido | `mv .env .env.bak` (restaurado después) | `docker compose config: INVÁLIDA` → `Compose inválido` |

**Historial:** la ejecución del 2026-10-06 reportó `CUMPLIMIENTO: no confirmado` porque el
daemon de Docker no estaba operativo en ese momento; queda superada por la ejecución del
2026-11-18. El entorno de producción definitivo (Ubuntu Server 24.04 LTS) debe repetir esta
verificación antes de aceptarse, tal como indica el plan.

---

## 2. Plan de migración de datos — Semanas 2 y 5 (CE-3)

### 2.1 Objetivo medible

Trasladar el 100 % de las filas y objetos de la base MySQL `vet_manager` del entorno actual al destino, conservar claves primarias y relaciones, y lograr conteos idénticos por tabla, cero huérfanos en las relaciones verificadas y cero errores de importación antes de reabrir el sistema. La ventana propuesta es de hasta 2 horas; debe medirse en un ensayo y aprobarse con el responsable del negocio.

### 2.2 Inventario de origen

| Origen | Formato / volumen | Responsable | Calidad / estado |
|---|---|---|---|
| Servicio `mysql` de `docker-compose.yml`, base `vet_manager` | MySQL 8.0; volumen Docker `mysql_data`; volumen y filas actuales por medir | Responsable de la base de datos | No hay un origen externo ni archivos legados identificados en el repositorio; no asumir que `schema.sql` contiene datos reales del cliente |
| `database/schema.sql` | DDL MySQL, vista, procedimiento y datos iniciales definidos en el archivo | Equipo de desarrollo | Docker lo usa al inicializar un volumen vacío; no reemplaza datos existentes |
| Migraciones de arranque de `backend/app/main.py` | Cambios SQL ejecutados por la API | Equipo de desarrollo | Modifican columnas/roles, crean tablas y normalizan contraseñas; ensayar antes del corte |

### 2.3 Estrategia y ventana

- **Estrategia:** corte big bang para una única base MySQL. Ensayar primero en una base separada; durante el corte detener escritores, generar respaldo final, importar y validar antes de reabrir. No se propone migración por fases porque no hay sistema legado ni sincronización continua documentados.
- **Ventana propuesta:** hasta 2 horas, fuera del horario de atención y confirmada después del ensayo cronometrado.
- **Punto de no retorno:** autorización para permitir nuevas escrituras en el destino. Hasta entonces se conserva el origen sin cambios.

### 2.4 Tabla de mapeo

Origen y destino usan el mismo modelo MySQL. Se conservan IDs y valores salvo las transformaciones expresas. El volumen y conteos deben medirse cuando Docker esté disponible.

| Origen | Destino | Transformación | Regla de rechazo / control |
|---|---|---|---|
| `usuarios` | `usuarios` | Conservar ID; normalizar `admin` a `administrador`, `asistente`/`user` a `usuario`; la API convierte contraseñas legadas en texto plano a PBKDF2 durante el arranque | Rechazar rol fuera del ENUM, email duplicado o nombre obligatorio vacío; nunca incluir contraseñas en reportes |
| `clientes` | `clientes` | Copia directa, sin normalizar teléfono/email automáticamente | Rechazar email o teléfono duplicado si infringe índices únicos; reportar nombre vacío |
| `mascotas` | `mascotas` | Conservar ID, `id_cliente`, peso y observaciones | Rechazar cliente inexistente, nombre/especie vacíos o sexo fuera del ENUM |
| `servicios`, `consultorio` | Mismas tablas | Copia directa conservando IDs | Rechazar nombre obligatorio vacío en servicios; validar referencias de citas |
| `citas` | `citas` | Conservar IDs, referencias y estado válido | Rechazar mascota, veterinario, servicio o consultorio inexistente, o estado inválido |
| `insumos`, `inventario` | Mismas tablas | Copia directa, conservando cantidades y referencias | Rechazar cantidad inválida o referencia inexistente |
| `reportes` | `reportes` | Copia directa; revisar retención y contenido con el cliente | Rechazar usuario generador inexistente |
| `proveedores`, `productos`, `medicamentos` | Mismas tablas | Copia directa, conservando IDs y referencias | Rechazar proveedor inexistente y revisar precios/stock negativos |
| `medicamentos_uso_interno` | Misma tabla | Copia directa, conservando movimientos y fechas | Rechazar medicamento inexistente o cantidad inválida |
| `agenda` | `agenda` | Copia directa, conservando referencia de cita | Rechazar cita inexistente |
| `historial_clinico` | Misma tabla | Copia directa; restringir acceso por ser dato clínico personal | Rechazar mascota, usuario o cita inexistente |
| `facturas`, `factura_detalle` | Mismas tablas | Copia directa; conciliar sumas de detalle, subtotal e IVA | Rechazar referencias inexistentes y reportar diferencias de totales |
| `notificaciones` | Misma tabla | Copia directa, conservando usuario y fechas | Rechazar usuario inexistente |
| `medicamentos_asignados` | Misma tabla | Conservar tratamientos personalizados y de catálogo | Rechazar historial inexistente; validar medicamento cuando el ID no sea nulo |
| `veterinario_horarios` | Misma tabla, si ya existe en origen | Conservar horarios configurados; no reemplazarlos por valores predeterminados de la API | Rechazar veterinario inexistente, día fuera de 0-6 o intervalo inválido |
| Vista `vista_mascotas_clientes`, procedimiento `sp_citas_activas` | Mismos objetos | Recrear desde el esquema | Verificar existencia y ejecutar prueba después de restaurar |

### 2.5 Validaciones y conciliación

1. Registrar conteos exactos de origen y comparar con destino por tabla; deben coincidir.
2. Verificar `origen = migrados + rechazados`; se esperan cero rechazados. El responsable del negocio debe aprobar cualquier excepción.
3. Comparar SHA-256 del archivo para verificar transferencia; el hash no sustituye la comparación de filas.
4. Verificar relaciones huérfanas, objetos SQL, errores de importación y sumas de facturas.
5. Probar login, clientes, mascotas, citas, historial clínico y facturación con cuentas de prueba, sin incluir datos personales en evidencias.

**Evidencia pendiente:** no se han medido conteos ni ejecutado una migración; Docker Desktop no tenía activo su daemon durante la preparación de esta versión.

### 2.6 Rollback

- **Criterio:** conteos distintos, errores de claves foráneas/importación, fallos en flujos críticos o duración superior a la ventana aprobada.
- **Método:** detener escritores; no habilitar el destino; conservarlo para análisis; reconectar al origen intacto y validar login, citas y datos clínicos. Si el origen fue alterado, restaurar el respaldo previo en una base nueva y verificarlo antes de cambiar la conexión.
- **Responsables:** el administrador de base de datos ejecuta; el responsable del negocio autoriza la reapertura.
- No borrar ni sobrescribir origen o respaldo hasta aprobar conciliación y aceptación.

### 2.7 Matriz de riesgos

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| Respaldo no restaurable o incompleto | Media | Alto | Ejecutar `scripts/respaldar.sh`, validar gzip/SHA-256 y ensayar antes del corte |
| Esquema distinto por migraciones de arranque | Alta | Alto | Respaldar primero, ensayar con copia reciente y verificar estructura/migraciones |
| Claves foráneas, índices únicos o roles rechazan datos | Media | Alto | Validar calidad antes del corte y aprobar reporte de rechazos |
| Pérdida de escrituras durante el corte | Media | Alto | Comunicar ventana, detener escritores y confirmar punto de retorno antes de reabrir |
| Exposición de datos personales en respaldos | Media | Alto | Restringir acceso, cifrar almacenamiento y copia externa; excluir respaldos de Git |
| Secretos de desarrollo reutilizados en producción | Alta | Alto | Rotar y externalizar contraseñas, clave JWT y clave de administración |

## 3. Plan de respaldo — Semanas 2 y 6 (CE-4)

### 3.1 Inventario de lo respaldado

| Elemento | Ubicación / método | Datos personales | Estado |
|---|---|---|---|
| Base MySQL `vet_manager`, esquema, vistas, procedimiento y datos | `scripts/respaldar.sh`, `mysqldump` lógico comprimido | Sí: datos de clientes, usuarios y pacientes | Script preparado; pendiente de ejecutar con Docker activo |
| Archivos subidos o generados | No se identificó un volumen persistente de archivos en Compose; inventariar rutas antes de producción | Posible | Pendiente confirmar con responsable técnico |
| Configuración de despliegue | Copia controlada de Compose/configuración sin secretos | Puede contener nombres internos | Secretos fuera del repositorio |
| Volumen Docker `mysql_data` | No es copia independiente; recuperar con dump lógico | Sí | No copiar los archivos internos de MySQL en caliente como sustituto del dump |

### 3.2 Objetivos de recuperación propuestos

| RPO | RTO | Justificación / aprobación |
|---|---|---|
| 24 horas | 4 horas | Propuesta inicial para respaldos completos diarios y restauración MySQL 8. No es compromiso medido: validar con el responsable del negocio y ajustar tras simulacro cronometrado. |

### 3.3 Política propuesta

| Aspecto | Decisión |
|---|---|
| Tipo y frecuencia | Dump lógico completo diario, fuera del horario de atención. PITR/WAL no está configurado en la arquitectura MySQL actual. |
| Retención | 7 respaldos diarios y 4 semanales; automatizar y verificar el cálculo antes de producción. |
| Copia 1 | Dump comprimido con permisos restringidos en almacenamiento local separado del volumen `mysql_data`; no basta ante pérdida del servidor. |
| Copia 2 | Medio o cuenta de almacenamiento independiente con acceso restringido. |
| Copia 3 | Ubicación externa al sitio, cifrada, con credenciales distintas y prueba de recuperación. |
| Cifrado | Cifrar copias fuera del host con clave gestionada fuera del repositorio; el script de esta versión comprime, pero no cifra. No transferir datos personales sin cifrado. |
| Responsable | Rol de administrador de base de datos; revisar alertas de ejecución y reporte mensual de restauración. |

La regla 3-2-1 exige tres copias totales, dos medios/ubicaciones independientes y una fuera del sitio. El directorio por defecto `backups/mysql` debe excluirse de Git y residir en almacenamiento con capacidad y permisos adecuados.

### 3.4 Procedimiento de restauración (8 pasos)

1. **Detectar y decidir:** registrar incidente, alcance, hora y quién autoriza la recuperación.
2. **Contener:** detener escrituras y aislar el servicio; conservar logs y no borrar el volumen original.
3. **Elegir respaldo:** localizar el dump íntegro anterior al incidente y revisar fecha, checksum y retención.
4. **Respaldar estado actual:** si la base responde, crear un dump de diagnóstico antes de restaurar.
5. **Restaurar aparte:** crear `vet_manager_restore` y cargar allí el dump, sin sobrescribir la base activa.
6. **Verificar:** comparar conteos exactos por tabla, objetos/relaciones, flujos funcionales y tiempo de recuperación.
7. **Reabrir y comunicar:** con aprobación, promover la base restaurada, habilitar escrituras y notificar.
8. **Registrar:** documentar dump, tiempos, conteos, incidencias, decisión y acciones preventivas.

Ensayo local en el servicio MySQL de Docker (sustituir `FECHA` por el nombre del dump; la base de prueba no debe existir):

```bash
docker compose exec mysql sh -ec 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot -e "CREATE DATABASE vet_manager_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"'
gzip -dc backups/mysql/vet_manager-FECHA.sql.gz | docker compose exec -T mysql sh -ec 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot vet_manager_restore'
```

Comparar `SELECT COUNT(*)` exactos en origen y restauración para cada tabla. No usar `information_schema.tables.table_rows` para conciliación: InnoDB puede devolver estimaciones. Requiere el contenedor `mysql` activo.

### 3.5 Evidencia de restauración

**Ejecución real: 2026-11-18** (Docker Desktop activo, MySQL 8.0 en Compose). Antes el intento del 2026-11-04 quedó pendiente porque el daemon de Docker no estaba disponible.

**Paso 1 — Respaldo con `scripts/respaldar.sh`:**

```text
Respaldo creado: backups/mysql/vet_manager-20261118T185238Z.sql.gz
SHA-256: 0ce11a55cd27ce053a883cca3126ca16399b1c4c552ab963ff6d845e1fef9494
Retención aplicada: 7 días
gzip -t: exitoso (verificado por el script)
```

**Paso 2 — Restauración en base aparte (`vet_manager_restore`):** el dump se importó con
`mysql -u root vet_manager_restore` y tardó **2 segundos**.

**Paso 3 — Conciliación con `SELECT COUNT(*)` exactos (20 tablas, 110 filas):**

| Tabla | Filas en producción | Filas restauradas | Resultado |
|---|---:|---:|---|
| agenda | 0 | 0 | ✅ |
| citas | 3 | 3 | ✅ |
| clientes | 4 | 4 | ✅ |
| consultorio | 10 | 10 | ✅ |
| factura_detalle | 2 | 2 | ✅ |
| facturas | 2 | 2 | ✅ |
| historial_clinico | 3 | 3 | ✅ |
| insumos | 0 | 0 | ✅ |
| inventario | 0 | 0 | ✅ |
| mascotas | 3 | 3 | ✅ |
| medicamentos | 15 | 15 | ✅ |
| medicamentos_asignados | 2 | 2 | ✅ |
| medicamentos_uso_interno | 0 | 0 | ✅ |
| notificaciones | 17 | 17 | ✅ |
| productos | 0 | 0 | ✅ |
| proveedores | 0 | 0 | ✅ |
| reportes | 0 | 0 | ✅ |
| servicios | 10 | 10 | ✅ |
| usuarios | 14 | 14 | ✅ |
| veterinario_horarios | 25 | 25 | ✅ |

`diff` entre ambos conteos: **sin diferencias**. Tiempo total: respaldo < 5 s, restauración 2 s.

**Paso 4 — Simulacro de desastre (pérdida de una tabla):**

1. `DROP TABLE usuarios` sobre `vet_manager_restore` con `FOREIGN_KEY_CHECKS=0` → quedaron 19 tablas. Antes, el borrado directo fue **rechazado por MySQL** por la FK `citas_ibfk_2`, lo que confirma que las restricciones están activas.
2. Se extrajo la sección de `usuarios` del dump y se volvió a importar.
3. Verificación: `usuarios` = 14 filas, 20 tablas, 4 FK en `citas`, PK y UNIQUE en `usuarios` → **todas intactas**.

**Corrección aplicada al script:** el volcado se ejecuta como `root` dentro del contenedor porque `vet_user` no tiene los privilegios `PROCESS` / `SHOW CREATE PROCEDURE` que exigen `--routines` y `--events` (error detectado y corregido el 2026-11-18).

### 3.6 Calendario de pruebas

| Prueba | Frecuencia | Responsable |
|---|---|---|
| Confirmar dump no vacío y `gzip -t` exitoso | Cada ejecución | Administrador de base de datos |
| Restaurar en base aislada y comparar conteos | Mensual y antes de cada migración | Administrador de base de datos + responsable del negocio |
| Simulacro de pérdida del servidor y acceso a copia externa | Trimestral | Responsable técnico |
| Revisar permisos, retención, cifrado y acceso a claves | Trimestral y ante cambios de personal | Seguridad / responsable técnico |

## 4. Hosting y dominio — Semana 3 (CE-1)

### 4.1 Tipo de hosting por componente

| Componente | Tipo propuesto | Proveedor candidato | Justificación |
|---|---|---|---|
| Frontend React/Vite | Archivos estáticos servidos por Caddy en contenedor | VPS Linux del cliente; alternativa: Azure Static Web Apps con proxy/API configurados | El frontend se compila a archivos estáticos; en el despliegue actual comparte origen con la API mediante Caddy. |
| API FastAPI | Contenedor Docker en VPS Linux | VPS Linux del cliente; alternativa: Azure Container Apps | Mantiene el runtime Python y las dependencias actuales; Caddy enruta las peticiones internamente. |
| MySQL 8 | MySQL privado, sin publicación pública | En MVP, contenedor de Docker Compose en red privada; en producción, Azure Database for MySQL Flexible Server u otro MySQL gestionado | Conserva el motor existente; no migrar a PostgreSQL sin un proyecto de conversión independiente. |
| App móvil Expo | Distribución móvil; consume la API HTTPS | Google Play / Apple App Store, según plataformas acordadas | No necesita un servidor web propio; requiere una URL pública estable de la API. |

**Decisión v0:** VPS Ubuntu LTS con Docker Compose y Caddy para la primera implantación, porque el repositorio ya contiene los tres servicios y MySQL. La base debe quedar solo en red privada. Alternativa de mayor disponibilidad: API en Azure Container Apps y MySQL gestionado, manteniendo el frontend estático detrás de HTTPS. El proveedor y los costos deben aprobarse con el cliente antes de contratar.

**Alternativa en servidor propio:** VM Ubuntu Server LTS del cliente con Docker Engine/Compose v2, Caddy y almacenamiento externo para respaldos. Requiere que el cliente asuma parches del host, firewall, monitoreo, renovación del dominio y pruebas de recuperación.

### 4.2 Dominio

| Campo | Decisión |
|---|---|
| Dominio de producción | Pendiente de elección y aprobación del cliente; no se registra un dominio real en este plan. |
| Tipo | Dominio propio del cliente recomendado para producción. |
| Registrador / DNS | Proveedor DNS/registrador que seleccione el cliente. |
| Pago y renovación | Responsable administrativo designado por el cliente; revisión 30 días antes del vencimiento. |
| Dominio de prueba local | `vet-manager.test`, nombre reservado para pruebas; no se publica en DNS público. |

### 4.3 Registros DNS propuestos

Los valores reales se incorporarán después de contratar el dominio y asignar la IP pública. TTL inicial bajo durante el cambio y ampliable tras estabilizar el servicio.

| Nombre | Tipo | Valor | TTL | Propósito |
|---|---|---|---:|---|
| `@` | A | `<IP-PUBLICA-DEL-SERVIDOR>` | 300 s durante el cambio; luego 3600 s | Sitio y proxy principal. |
| `www` | CNAME | `<DOMINIO-DEL-CLIENTE>` | 3600 s | Alias del sitio principal; confirmar que el proveedor DNS admite este destino. |
| TXT de validación | TXT | `<VALOR-DEL-PROVEEDOR>` | Según proveedor | Validación del dominio y/o emisión de certificado cuando el proveedor lo solicite. |
| MX / SPF / DKIM / DMARC | MX / TXT | Según el proveedor de correo que apruebe el cliente | Según proveedor | Correo transaccional; no cambiar los registros existentes sin autorización. |

La API comparte el origen del frontend y se enruta por camino, por lo que no se requiere un subdominio `api` en esta versión. Los registros de producción siguen pendientes; `vet-manager.test` solo se usa con `curl --resolve`.

### 4.4 Camino de una petición y puertos

**Camino:** navegador o app móvil → DNS del cliente → HTTPS en Caddy → rutas `/api/*`, `/auth/*`, `/data/*`, `/users*`, `/clientes*`, `/mascotas*`, `/health` y documentación API al contenedor `backend:5000`; el resto de rutas se envía al frontend `frontend:5173`. Caddy agrega los encabezados `X-Forwarded-For` y `X-Forwarded-Proto`; MySQL solo recibe tráfico desde la red privada de Docker.

| Puerto | Servicio | Exposición |
|---:|---|---|
| 80/tcp | Caddy / redirección HTTPS en producción | Público si se usa ACME HTTP-01; confirmar con el proveedor. |
| 443/tcp | Caddy HTTPS en producción | Público; único punto de entrada web esperado. |
| 8443/tcp | Caddy HTTPS para prueba local | Solo loopback (`127.0.0.1`); `tls internal`. |
| 5000/tcp | FastAPI | Solo loopback para desarrollo; no abrir al exterior en producción. |
| 5173/tcp | Frontend | Red Docker; no publicar directamente en producción. |
| 3306/tcp | MySQL dentro del contenedor | Solo red privada de Docker; no abrir a Internet. |
| 3307/tcp | MySQL desde el host para desarrollo | Solo loopback; cerrar en producción. |
| 22/tcp | SSH/SFTP | Restringido a IPs administrativas aprobadas y autenticación por llave; nunca contraseña compartida. |

### 4.5 Reverse proxy y prueba local

Archivo de configuración: [`Caddyfile`](../Caddyfile). Compose publica Caddy únicamente en `127.0.0.1:8443`, usa el certificado local `tls internal` y mantiene API y frontend en la red privada. La autoridad local de Caddy debe confiarse en el dispositivo para navegar sin advertencias; `curl -k` se acepta solo para la prueba local, nunca como validación de certificados de producción.

```bash
docker compose up -d --build
curl --resolve vet-manager.test:8443:127.0.0.1 -k -i https://vet-manager.test:8443/
curl --resolve vet-manager.test:8443:127.0.0.1 -k -i https://vet-manager.test:8443/health
```

**Evidencia local (2026-11-04):** Caddy validó el Caddyfile, emitió certificados internos para `vet-manager.test` y `localhost`, y los probes con `curl --resolve` devolvieron `HTTP 200` para `/` y `/health`, con verificación TLS `0` usando la CA local de Caddy. La ruta `/` sirvió el build React. Para `/health` se usó temporalmente un upstream de prueba porque MySQL no terminó de descargarse y FastAPI no pudo completar su arranque; por tanto, en esa fecha el enrutamiento HTTPS de Caddy quedó comprobado y la integración completa Caddy → FastAPI → MySQL quedó pendiente. **Quedó cerrada el 2026-11-18** (ver evidencia de cierre más abajo).

Comandos Windows usados para confiar la CA local y probar los hosts reservados:

```powershell
docker cp vet-manager-caddy-proxy-test:/data/caddy/pki/authorities/local/root.crt "$env:TEMP\vet-manager-caddy-root.crt"
curl.exe --noproxy "*" --ssl-no-revoke --cacert "$env:TEMP\vet-manager-caddy-root.crt" --resolve vet-manager.test:8443:127.0.0.1 -i https://vet-manager.test:8443/
curl.exe --noproxy "*" --ssl-no-revoke --cacert "$env:TEMP\vet-manager-caddy-root.crt" --resolve vet-manager.test:8443:127.0.0.1 -i https://vet-manager.test:8443/health
```

#### Evidencia de cierre — 2026-11-18 (stack completo)

Se recrearon los contenedores con la configuración actual: los puertos pasaron de publicarse
en todas las interfaces (`0.0.0.0`) a **solo loopback** (`127.0.0.1`), que es lo que exige la
sección 4.4. Se reconstruyó la imagen del backend (faltaba el paquete `alembic` en la imagen
anterior) y se habilitó el log de accesos de Caddy con la directiva `log`.

Estado de los servicios:

```text
SERVICE    STATUS                    PORTS
caddy      Up                        127.0.0.1:8443->443/tcp
backend    Up                        127.0.0.1:5000->5000/tcp
mysql      Up (healthy)              127.0.0.1:3307->3306/tcp
frontend   Up                        5173/tcp   (solo red Docker, sin publicar)
```

**Pruebas HTTPS con verificación TLS real** (CA local de Caddy copiada del contenedor,
`curl --cacert` sin `-k`; en Windows/Schannel se usa `--ssl-no-revoke` porque la CA local no
publica lista de revocación):

| # | Prueba | Resultado |
|---|---|---|
| 1 | `GET /` (build React) | `HTTP 200`, `ssl_verify_result: 0`, 474 bytes |
| 2 | `GET /health` (backend real) | `HTTP 200` → `{"status":"healthy","database":"healthy"}` |
| 3 | `GET /docs` (FastAPI) | `HTTP 200` |
| 4 | Segundo nombre del certificado (`localhost:8443`) | `HTTP 200` |
| 5 | Encabezados del camino | `Via: 1.1 Caddy` (respuesta) |

**Encabezados que Caddy inyecta hacia el backend** (verificados con un servicio efímero que
imprime los encabezados recibidos, detrás del mismo reverse proxy):

```text
Host: vet-manager.test:8443
Via: 1.1 Caddy
X-Forwarded-For: 172.18.0.1
X-Forwarded-Host: vet-manager.test:8443
X-Forwarded-Proto: https
```

**Prueba negativa (2026-11-18): los servicios NO son accesibles desde la red.**
`Test-NetConnection` contra la IP de la red del equipo (`10.90.40.59`):

| Puerto | Desde la red (10.90.40.59) | Desde loopback (127.0.0.1) |
|---:|---|---|
| 3307 (MySQL) | **False — bloqueado** | True |
| 5000 (API) | **False — bloqueado** | True |
| 5173 (frontend) | **False — sin publicar** | no publicado |
| 8443 (Caddy HTTPS) | **False — bloqueado** | True |

Esto cierra los dos pendientes declarados el 2026-11-04: la integración completa
Caddy → FastAPI → MySQL quedó comprobada (prueba 2) y la comprobación negativa de MySQL
accesible desde una interfaz pública quedó ejecutada.

### 4.6 Transferencia de archivos

| Qué se transfiere | Método | Autenticación | Frecuencia |
|---|---|---|---|
| Código/configuración del despliegue | `git pull` o publicación de imagen; SFTP solo para archivos puntuales necesarios | Llave SSH Ed25519; clave privada únicamente en el equipo del operador y llave pública en el usuario restringido del servidor | En cada versión aprobada. |
| Archivos de respaldo | `scripts/respaldar.sh` crea el dump local; copia externa por SFTP solo después de cifrarlo | Llave SSH y permisos restringidos | Según política de respaldo de la sección 3. |

Ejemplo con valores de marcador, no credenciales reales:

```bash
sftp -i ~/.ssh/vet_manager_deploy <USUARIO_SFTP>@<HOST-DEL-SERVIDOR>
put <ARCHIVO> <RUTA-DESTINO-AUTORIZADA>
```

No subir llaves privadas, `.env`, dumps sin cifrar ni datos de clientes al repositorio. Antes de producción, externalizar y rotar los secretos de desarrollo que siguen definidos en `docker-compose.yml`.

## 5. Plan de instalación y despliegue — Semanas 2 y 4 (CE-1, CE-5)

| Campo | Valor |
|---|---|
| Proyecto | Vet Manager |
| Equipo | cuyrueda-create |
| Versión del plan | **v1** |
| Versión del software cubierta | 1.0.0 → 1.1.0 |
| Fecha | 2026-11-18 |

Alcance: API FastAPI, web React/Vite y MySQL 8. La app móvil se compila/publica por separado y consume la API. Este documento permite instalar, actualizar y revertir el proyecto en un servidor Linux y en la nube sin compilar en el destino.

### 5.1 Proceso de liberación

| Paso | Comando o acción | Resultado esperado |
|---|---|---|
| Pruebas en verde | `docker compose exec -T backend python -m pytest --cov=app` | 42 pruebas pasan, cobertura reportada (17 %); el CI ejecuta lo mismo antes del scan de SonarCloud |
| Etiqueta | `git tag -a v1.0.0 -m "..."` (y `v1.1.0`); `git push origin v1.0.0` | Etiquetas visibles en GitHub (`v1.0.0`, `v1.1.0`) |
| Imagen | `docker build --build-arg APP_VERSION=1.0.0 --build-arg UVICORN_OPTS= -t vet-manager-backend:1.0.0 ./backend` | Imagen listada con la etiqueta (`docker images`) |
| Notas de versión | Actualizar `CHANGELOG.md` antes de etiquetar | Sección nueva con "Al actualizar" |
| Transferencia | `docker save ... \| gzip > imagenes/vet-manager-1.0.0.tar.gz` en desarrollo → `docker load` en el servidor | El servidor ejecuta la imagen; **nunca compila** |

**Esquema de versiones y criterio SemVer:** `MAJOR` rompe compatibilidad con datos o clientes; `MINOR` agrega funcionalidad compatible hacia atrás; `PATCH` corrige errores sin cambiar comportamiento observable. Ejemplo: `2.3.1` corrige un error de cálculo → la siguiente versión es `2.3.2` (solo parche). En este proyecto: `1.0.0` es la liberación base y `1.1.0` agrega campos al healthcheck (MINOR, sin romper nada). No se despliega `latest`: las etiquetas de versión son auditables y reversibles.

**Enlace al `CHANGELOG.md`:** [`CHANGELOG.md`](../CHANGELOG.md) (incluye la sección "Al actualizar" de cada versión).

### 5.2 Despliegue en servidor Linux

#### Estructura

```
/opt/vet-manager/
├── .env                          # secretos y configuración (chmod 600)
├── imagenes/
│   ├── vet-manager-1.0.0.tar.gz  # transferidas con docker save/load
│   └── vet-manager-1.1.0.tar.gz
├── releases/
│   └── 1.0.0/
│       ├── deploy/
│       │   ├── compose.prod.yaml # orquestación de producción
│       │   ├── Caddyfile         # reverse proxy (dominio real)
│       │   ├── Caddyfile.local   # pruebas sin dominio (tls internal)
│       │   └── env.prod.example  # plantilla de variables
│       ├── database/schema.sql
│       ├── smoke-test.sh         # prueba de humo
│       └── CHANGELOG.md
└── respaldos/
    ├── pre-update-1.1.0-<fecha>.sql.gz   # respaldo previo a cada actualización
    └── caddy-root.crt                    # CA local para verificar TLS
```

#### Variables de entorno

| Variable | Propósito | Ejemplo (ficticio) |
|---|---|---|
| `APP_VERSION` | Versión desplegada; el Compose solo levanta esa imagen | `1.0.0` |
| `APP_ENV` | Ambiente reportado por `/health` | `produccion` |
| `HTTP_PORT` / `HTTPS_PORT` | Puertos publicados de Caddy | `80` / `443` |
| `API_PORT` | Puerto loopback del backend (no expuesto públicamente) | `5000` |
| `CADDYFILE` | Caddyfile a montar (`deploy/Caddyfile` o `deploy/Caddyfile.local`) | `deploy/Caddyfile` |
| `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD` | Credenciales de MySQL (generadas, nunca las de ejemplo) | `<aleatoria>` |
| `SECRET_KEY` | Firma de los JWT | `<aleatoria>` |
| `ADMIN_CREATE_KEY` | Clave maestra para crear el primer administrador | `<aleatoria>` |
| `CORS_ORIGINS` | Orígenes permitidos para el frontend (coma-separados) | `https://ejemplo.com` |
| `EMAIL_USER` / `EMAIL_PASSWORD` | SMTP transaccional (app password) | `<ficticio>` |

#### Instalación inicial

| # | Acción | Comando | Resultado esperado |
|---:|---|---|---|
| 1 | Verificar requisitos | `bash scripts/verificar-requisitos.sh` | Código de salida 0 (`CUMPLIMIENTO: confirmado`) |
| 2 | Recibir imágenes | `docker load -i imagenes/vet-manager-1.0.0.tar.gz` | `Loaded image: vet-manager-backend:1.0.0` |
| 3 | Preparar configuración | `cp deploy/env.prod.example .env` y editar; `chmod 600 .env` | Permisos `600`; ningún secreto en el repositorio |
| 4 | Validar | `docker compose -f deploy/compose.prod.yaml config --quiet` | Código de salida 0 (falla si falta un secreto obligatorio) |
| 5 | Levantar | `docker compose -f deploy/compose.prod.yaml up -d --wait` | `mysql`, `backend`, `frontend` y `caddy` en estado `healthy` |
| 6 | Prueba de humo | `bash smoke-test.sh https://<dominio>` | 6/6 pruebas en verde, código de salida 0 |

#### Actualización

| # | Acción | Comando | Resultado esperado |
|---:|---|---|---|
| 1 | Respaldo previo | `mysqldump ... \| gzip > respaldos/pre-update-<ver>-<fecha>.sql.gz` | `gzip -t` exitoso + SHA-256 informado |
| 2 | Recibir imágenes nuevas | `docker load -i imagenes/vet-manager-1.1.0.tar.gz` | Imágenes `1.1.0` listadas |
| 3 | Cambiar versión | `sed -i "s/^APP_VERSION=.*/APP_VERSION=1.1.0/" .env` | `.env` apunta a `1.1.0` |
| 4 | Reemplazar | `docker compose -f deploy/compose.prod.yaml up -d --wait` | Contenedores recreados y `healthy`; **sin downtime de MySQL** (volumen persiste) |
| 5 | Prueba de humo | `bash smoke-test.sh https://<dominio>` | `/health` reporta `"version":"1.1.0"` |

#### Rollback

| # | Acción | Comando | Resultado esperado |
|---:|---|---|---|
| 1 | Reapuntar versión anterior | `sed -i "s/^APP_VERSION=.*/APP_VERSION=1.0.0/" .env` | `.env` apunta a `1.0.0` |
| 2 | Revertir | `docker compose -f deploy/compose.prod.yaml up -d --wait` | Versión anterior arriba y `healthy` |
| 3 | Prueba de humo | `bash smoke-test.sh https://<dominio>` | `/health` reporta `"version":"1.0.0"` |
| 4 | Solo si hubo migración incompatible | Restaurar `respaldos/pre-update-*.sql.gz` en base nueva y conciliar | Conteos idénticos antes de abrir escrituras |

**Clasificación de migraciones (¿permiten rollback sin restaurar?):**

| Migración | Cambio | ¿Compatible hacia atrás? |
|---|---|---|
| Agregar tabla o columna nueva | Aditivo | **Sí**: el código anterior no conoce lo nuevo y sigue funcionando |
| Ampliar un `ENUM` (p. ej. nuevo estado) | Aditivo | **Sí** mientras el código anterior no escriba el valor nuevo |
| Cambiar tipo de dato, nombre o eliminar columna usada | Restructurante | **No**: exige restaurar respaldo o estrategia expand/contract |
| `hash_existing_passwords` (texto plano → hash) | Transforma datos | **No reversible** sin el texto plano; requiere respaldo |
| 1.0.0 → 1.1.0 (solo `/health`) | Sin migración de esquema | **Sí**: rollback sin restaurar |

**Por qué no hizo falta restaurar en el ciclo 1.0.0 → 1.1.0 → 1.0.0:** la única diferencia de código fue el healthcheck; no hubo migración de esquema ni de datos, y el volumen `mysql_data` persiste entre versiones. **Qué se haría si la migración fuera incompatible:** restaurar el respaldo previo en una base nueva, conciliar conteos y decidir con el responsable del negocio antes de reabrir (sección 3.4); o aplicar *expand/contract* para no romper la versión anterior.

#### Evidencia (servidor Linux simulado en WSL, 2026-11-18)

Instalación 1.0.0:

```text
1. GET /health    OK — {"status":"healthy","database":"healthy","version":"1.0.0"}
2. Base de datos  OK — healthy
3. Versión        OK — 1.0.0
4. GET /docs      OK
5. GET /          OK
6. GET / (SPA)    OK
RESULTADO: TODAS LAS PRUEBAS PASARON (0 fallos) — EXIT=0
```

Actualización a 1.1.0 (con respaldo previo `pre-update-1.1.0-*.sql.gz`, 8.0K, `gzip -t` OK):

```text
1. GET /health    OK — {"status":"healthy","database":"healthy","version":"1.1.0","ambiente":"produccion","uptime_s":5.9}
...
RESULTADO: TODAS LAS PRUEBAS PASARON (0 fallos) — EXIT=0
```

Rollback a 1.0.0:

```text
1. GET /health    OK — {"status":"healthy","database":"healthy","version":"1.0.0"}
...
RESULTADO: TODAS LAS PRUEBAS PASARON (0 fallos) — EXIT=0
```

Estado del servidor: `mysql` y `backend` `healthy` en red interna; MySQL **sin puerto publicado** en el host; backend solo en loopback; Caddy único punto de entrada.

### 5.3 Despliegue en la nube

| Componente | Proveedor y plan | Región | Configuración |
|---|---|---|---|
| API (web service) | **Render — Free** | Por defecto (EE. UU.) | Blueprint [`deploy/render.yaml`](../deploy/render.yaml), `healthCheckPath: /health` |
| Web estática | **Render — Static Site (free)** | Por defecto | Build `npm ci && npm run build`, publica `frontend/dist` |
| Base de datos | **Aiven for MySQL — Free** | No seleccionable en plan gratuito | MySQL 8 gestionado; connection string **solo en el panel de Render** |

URL pública: `https://vet-manager-api.onrender.com` (marcador; el valor real se define al crear el servicio).

**Procedimiento:**

1. Crear cuenta en Aiven y un servicio MySQL en plan Free; copiar host, puerto, usuario y contraseña desde el panel.
2. Crear cuenta en Render → *New → Blueprint* → apuntar al repositorio; Render lee `deploy/render.yaml`.
3. Definir los secretos **solo en el panel de Render** (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `SECRET_KEY`, `ADMIN_CREATE_KEY`, `CORS_ORIGINS`); nunca en el repositorio.
4. Deploy; esperar que `/health` responda `healthy`.
5. Ejecutar `bash scripts/smoke-test.sh https://<url-publica>` y guardar la salida.
6. Probar el arranque en frío: apagar el servicio, medir el tiempo hasta que `/health` responda de nuevo.

**Método de rollback en el PaaS:** en Render → *Deploys → Rollback to previous deploy* (o redeploy de la etiqueta anterior); no requiere reconstruir. En Aiven (plan Free) el rollback de datos es por restauración del dump descargado, ya que el plan gratuito no incluye Point-in-Time Recovery.

**Límites del plan gratuito que afectan al cliente (fuente: render.com/pricing y aiven.io/pricing, consultado el 2026-11-18):**

- Render Free: $0/mes con 512 MB de RAM y menos de 1 CPU; los sitios estáticos son gratis de forma permanente; los servicios gratuitos se suspenden tras un periodo sin tráfico (**arranque en frío**: la primera petición tras la suspensión tarda varios segundos).
- Aiven Free: $0/mes con 1 VM dedicada, 1 CPU, 1 GB de RAM y 1 GB de almacenamiento; no se puede elegir región ni usar connection pooling.
- Costos que suelen sorprender: ancho de banda de salida, almacenamiento adicional, dominio (~US$10–15/año) y servicios de respaldo/cifrado que no están incluidos en los planes gratuitos.

#### Evidencia (nube)

**Pendiente:** requiere crear las cuentas en Render y Aiven (decisión del responsable del proyecto). Sin esta evidencia, la rúbrica limita Producto a 60/100. El procedimiento, el blueprint y la prueba de humo están preparados: `deploy/render.yaml` + `scripts/smoke-test.sh`.

### 5.4 Estimación de costos

| Concepto | Alternativa 1: Render + Aiven (gratuito) | Alternativa 2: VPS gestionado (Hetzner CX) | Alternativa 3: IaaS siempre gratis (Oracle Cloud) |
|---|---|---|---|
| Total mensual | **US$0** | desde €5,49/mes + IVA (≈ US$6) | **US$0** (con tarjeta registrada) |
| Total anual | US$0 + dominio ≈ US$10–15 | ≈ US$72 + dominio ≈ US$82–87 | US$0 + dominio ≈ US$10–15 |
| Horas de administración al mes | 2 h (deploy manual desde Git) | 4–6 h (SO, parches, Docker, respaldos) | 6–8 h (SO, firewall, Docker, respaldos, riesgo de reclamación de recursos) |
| Fuente y fecha | render.com/pricing, aiven.io/pricing — 2026-11-18 | hetzner.com/cloud — 2026-11-18 | oracle.com/cloud/free — 2026-11-18 |

**Costos ocultos a considerar:** dominio (~US$10–15/año), ancho de banda de salida si el plan paga excede el incluido, almacenamiento extra (Aiven cobra US$0.30/GB en planes de pago), respaldos externos cifrados y tiempo de administración.

**Recomendación al cliente:** iniciar con **Alternativa 1 (Render + Aiven Free)**: costo mensual cero, sin tarjeta para Render y con la base MySQL gestionada; documenta además el arranque en frío como limitación. Cuando la clínica necesite disponibilidad 24/7 sin suspensión, migrar a Alternativa 2 (VPS) manteniendo el mismo `compose.prod.yaml`, o subir el plan de Render (US$7/mes) — la migración está probada con el ciclo de actualización/rollback de la §5.2.

## 6. Configuración y verificación — Semana 5 (CE-1)

-Los valores de entorno se aplicarán desde un archivo de configuración seguro; se verificará la conexión a la base de datos, autenticación, sesiones, notificaciones y la carga de la interfaz.

## 7. Seguridad, usuarios y permisos — Semana 6 (CE-1)

-Cada rol tendrá permisos de acceso diferenciados, secretos almacenados en variables de entorno, conexiones cifradas,actualizaciones de dependencias y revisiones de permisos de la base de datos.

## 8. Pipeline de despliegue y monitoreo — Semana 7 (CE-1, CE-5)

-Se ejecutará una compilación de frontend, pruebas, validación de Docker Compose, healthchecks, métricas de CPU/RAM, logs y rollback por versión.

## 9. Mantenimiento, soporte y capacitación — Semana 8 (CE-5)

-La operación incluirá actualizaciones de imágenes, copias de seguridad, diagnóstico de errores, capacitación de usuarios y procedimiento de soporte por rol.

## 10. Aceptación y entrega — Semana 9 (CE-1 a CE-5)

-La entrega se considerará aceptada tras validar requisitos, seguridad, permisos, disponibilidad, restauración de copias de seguridad y pruebas de uso de todos los roles.

*Este plan garantiza una transición segura y escalable para Vet Manager.*
