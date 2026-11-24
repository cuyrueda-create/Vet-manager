# 📘 Plan de Implantación — Vet Manager

| Campo | Valor |
|---|---|
| Proyecto | Vet Manager — sistema de gestión veterinaria |
| Equipo | Equipo de desarrollo del proyecto |
| Versión del plan | 1.6 |
| Fecha | 2026-11-24 |

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

### 1.3 Sistema operativo del entorno

| Campo | Entorno actual (este equipo) | Entorno de producción (objetivo) |
|---|---|---|
| Distribución y versión | **Ubuntu 26.04** bajo WSL2 (Windows) | Ubuntu Server LTS 24.04 |
| Arquitectura | x86_64 | x86_64 o ARM64, según el proveedor |
| Núcleo | 6.18.58.1-microsoft-standard-WSL2 | Núcleo del proveedor del servidor |
| Fin de soporte estándar | 2027-04 (Ubuntu 26.04 LTS) | 2028-04 (Ubuntu 24.04 LTS) |
| Licencia | GPLv2 / Ubuntu (uso académico) | Ubuntu Pro / GPLv2 salvo piezas comerciales opcionales |
| Referencia oficial | [ubuntu.com/about/release-cycle](https://ubuntu.com/about/release-cycle) | ídem |

**Rol de cada entorno:** el desarrollo, las pruebas y la **simulación de despliegue** (semana 4) corren en este equipo (WSL2 Ubuntu 26.04); el servidor Linux real repetirá la misma instalación con los mismos comandos cuando exista. El despliegue de Docker usa `python:3.11-slim`, `node:20-alpine` y `mysql:8.0`; el host debe proporcionar Docker Engine y Compose sobre una distribución Linux compatible.

### 1.4 Medición de consumo

| Servicio | RAM reposo | RAM pico | CPU pico |
|---|---:|---:|---:|
| MySQL 8.0 | 512 MiB | 1 GiB | 0,6 vCPU |
| API FastAPI/Uvicorn | 128 MiB | 256 MiB | 0,3 vCPU |
| Frontend React/Vite | 32 MiB | 96 MiB | 0,2 vCPU |
| **Total** | **672 MiB** | **1,35 GiB** | **1,1 vCPU** |

Los valores de reposo son una referencia de despliegue local y no representan mediciones ejecutadas en el servidor final. La carga simulada recomendada es 20 usuarios concurrentes realizando operaciones de lectura, autenticación y consultas a la API. El margen de 50% se aplica a la medición pico para cubrir transitorios y el consumo de la base de datos.

**Medición en este equipo (2026-11-18, WSL2 Ubuntu 26.04):** con el stack completo (`mysql`, `backend`, `frontend`, `caddy`) el consumo total se mantiene muy por debajo del pico de referencia (1,35 GiB); el sistema reporta 4.4 GiB de RAM disponibles de 6.6 GiB totales incluso con el despliegue simulado en marcha. El disco usado por Docker (imágenes + caché de build) es de ~5.5 GB, marginal frente a los 955 GB libres.

> **Nota:** Los valores de RAM pueden variar según el sistema operativo base.

### 1.5 Matriz de requisitos

| Requisito | Mínimo | Recomendado | **Este portátil (2026-11-18)** | ¿Cumple? | Justificación |
|---|---:|---:|---:|:---:|---|
| CPU | 1 vCPU | 2 vCPU | **16 vCPU** (AMD Ryzen 7 7735HS, 8 núcleos / 16 hilos) | ✅ | Pico de referencia 1,1 vCPU; 50% de margen |
| RAM | 2 GiB | 4 GiB | **6.6 GiB** (4.4 GiB disponibles) | ✅ | 1,35 GiB de pico observado en referencia; 2 GiB de margen |
| Disco | 20 GiB | 40 GiB SSD | **1007 GiB SSD** (955 GiB libres) | ✅ | Almacenamiento de base de datos, logs y resultados; 20 GiB de margen |
| Tipo de disco / IOPS | SSD, 500 IOPS | SSD, 1.000 IOPS | SSD (NVMe del portátil) | ✅ | Necesita rendimiento para consultas y escritura; carga simulada |
| Red | 100 Mbps | 1 Gbps | Wi-Fi/Ethernet del portátil | ✅ | API y frontend; tráfico de datos y notificaciones |
| Arquitectura | x86_64 o ARM64 | x86_64 | x86_64 | ✅ | Compatibilidad con MySQL 8.0, Python 3.11 y Node 20 |
| Sistema operativo | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS con actualizaciones seguras | Ubuntu 26.04 (WSL2) en desarrollo; Ubuntu Server 24.04 en producción | ✅ | Soporte estándar hasta 2028-04 en producción |
| Docker / runtime | Docker Engine + Compose 2 | Docker Engine + Compose 2 con healthchecks | Docker 29.5.3 + Compose v5.1.4 | ✅ | Orquestación declarativa de los tres servicios |
| Puertos | 5000, 5173, 3307 | 5000, 5173, 3307, con firewall | 5000, 5173, 3307 (dev) / 8080, 9443, 5001 (simulación prod) | ✅ | Acceso a API, web y base de datos desde los límites previstos |

**Cálculo de requisitos recomendados:** CPU $1{,}1 \times 1{,}5 = 1{,}65$ vCPU; se redondea a 2 vCPU. RAM $1{,}35 \times 1{,}5 = 2{,}025$ GiB; se redondea a 4 GiB. El disco se cifra con 40 GiB para recibir un margen de almacenamiento y copias de seguridad. **Este portátil supera con creces todos los mínimos y recomendados** (16 vCPU vs 2, 6.6 GiB vs 4, 955 GiB libres vs 40), por lo que es apto para desarrollo, pruebas y la simulación de despliegue; para producción se mantienen los valores mínimo/recomendados de esta tabla.

### 1.6 Plataforma física recomendada

| Decisión | Elección | Justificación |
|---|---|---|
| Formato | **Portátil (este equipo)** para desarrollo/pruebas/simulación; torre o rack 1U/2U para producción | El proyecto no depende de un hipervisor específico; Docker simplifica el despliegue en ambos |
| Nivel RAID del servidor de base de datos | RAID 1 para discos de datos; RAID 10 si hay disponibilidad de discos suficientes | RAID 1 protege contra fallo de disco, mientras que RAID 10 ofrece mayor rendimiento y tolerancia |
| Plataforma de ejecución | Bare metal o VM Linux con Docker | El proyecto no depende de un hipervisor específica; Docker simplifica el despliegue |

**Plataforma real en uso (2026-11-18):** portátil con AMD Ryzen 7 7735HS (8 núcleos / 16 hilos), 6.6 GiB RAM, SSD de 1007 GiB y Ubuntu 26.04 bajo WSL2. Es la plataforma de desarrollo, pruebas y **simulación de despliegue** (semana 4): no tiene RAID (un solo disco) ni redundancia de fuente, por lo que **los respaldos externos son obligatorios** (§3). El despliegue en producción real usará una máquina de torre o rack con al menos 2 vCPU, 4 GiB RAM y SSD de 40 GiB; en el servidor de base de datos se recomienda dos discos SSD de igual capacidad y un RAID 1 (RAID 10 con cuatro discos si el ingreso de datos es alto). El rango RAID 1 evita pérdida de datos por un único disco, pero no recupera una corrupción silenciosa; las copias de seguridad siguen siendo obligatorias.

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
OK   backend/database/schema.sql
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
| `backend/database/schema.sql` | DDL MySQL, vista, procedimiento y datos iniciales definidos en el archivo | Equipo de desarrollo | Docker lo usa al inicializar un volumen vacío; no reemplaza datos existentes |
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
│       ├── backend/database/schema.sql
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
3. Definir los secretos **solo en el panel de Render** (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_OWNER_USER`, `DB_OWNER_PASSWORD`, `SECRET_KEY`, `ADMIN_CREATE_KEY`, `CORS_ORIGINS`); nunca en el repositorio. `DB_OWNER_*` es el rol con DDL que ejecuta las migraciones del arranque (§7.3). En Aiven el usuario por defecto `avnadmin` ya es administrador, así que mientras no se creen los roles separados allí se puede rellenar con el mismo usuario/contraseña que `DB_*` (config.py hace esa compatibilidad). Para aplicar la separación en la nube, crear en Aiven `vet_app` (CRUD+EXECUTE) y `vet_owner` (ALL) ejecutando el mismo SQL de `database/2-roles.sh` y usarlos en Render.
4. Deploy; esperar que `/health` responda `healthy`.
5. Ejecutar `bash scripts/smoke-test.sh https://<url-publica>` y guardar la salida.
6. Probar el arranque en frío: apagar el servicio, medir el tiempo hasta que `/health` responda de nuevo.

**Método de rollback en el PaaS:** en Render → *Deploys → Rollback to previous deploy* (o redeploy de la etiqueta anterior); no requiere reconstruir. En Aiven (plan Free) el rollback de datos es por restauración del dump descargado, ya que el plan gratuito no incluye Point-in-Time Recovery.

**Límites del plan gratuito que afectan al cliente (fuente: render.com/pricing y aiven.io/pricing, consultado el 2026-11-18):**

- Render Free: $0/mes con 512 MB de RAM y menos de 1 CPU; los sitios estáticos son gratis de forma permanente; los servicios gratuitos se suspenden tras un periodo sin tráfico (**arranque en frío**: la primera petición tras la suspensión tarda varios segundos).
- Aiven Free: $0/mes con 1 VM dedicada, 1 CPU, 1 GB de RAM y 1 GB de almacenamiento; no se puede elegir región ni usar connection pooling.
- Costos que suelen sorprender: ancho de banda de salida, almacenamiento adicional, dominio (~US$10–15/año) y servicios de respaldo/cifrado que no están incluidos en los planes gratuitos.

#### Evidencia (nube)

**Estado del blueprint (2026-11-21): validado y listo para un solo despliegue.** Se corrigieron tres bloqueos que habrían fallado en Render: (1) `type: static_site` no existe en la spec → ahora `type: web` + `runtime: static` y sin `plan`; (2) el build usaba `npm ci` pero el repo tiene `pnpm-lock.yaml` → ahora `corepack prepare pnpm@10.30.3 && pnpm install --frozen-lockfile`; (3) `VITE_API_URL=/` hacía que el SPA llamara a su propio origen → ahora `fromService.property: host`, normalizado a `https://` en `axiosConfig.js`. Se añadió `routes: /* → /index.html` para las rutas profundas del router (ej. `/reset-password?token=...`), `generateValue: true` para `SECRET_KEY`/`ADMIN_CREATE_KEY` y self-references para `DB_OWNER_*`, de modo que el usuario solo rellena 5 variables de Aiven. Guía paso a paso: **[`docs/despliegue-render.md`](../docs/despliegue-render.md)**. Validación local: `yaml.safe_load` + `pnpm run build` + 78 tests en verde.

**✅ Despliegue ejecutado (2026-11-24): Render + Aiven en producción.** Servicios `vet-manager-api` (Docker, plan free) y `vet-manager-web` (static site) creados desde el blueprint con rama `main`. Base Aiven for MySQL Free (`defaultdb`). Durante el despliegue se corrigieron tres incidencias reales, ya integradas en el código: (1) `COPY . . # NOSONAR` hacía que Docker interpretara `#` como archivo (`lstat /#`) → comentario movido a su propia línea; (2) `DB_NAME` con valor `Vet_manager` no existía → se fijó `defaultdb` en el blueprint; (3) la BD de Aiven está vacía (no hay initdb de MySQL) → el arranque aplica `backend/database/schema.sql` automáticamente cuando falta `usuarios` (20 tablas, idempotente), y `/health` devuelve 503 si la BD falla para evitar falsos positivos en `healthCheckPath`.

Salida real de la prueba de humo contra la URL pública:

```text
$ bash scripts/smoke-test.sh https://vet-manager-api.onrender.com
=== Prueba de humo: https://vet-manager-api.onrender.com ===
Fecha: 2026-11-24T20:25:25Z

1. GET /health                  OK — {"status":"healthy","database":"healthy",
                                     "version":"1.0.0","ambiente":"nube","uptime_s":353.0}
2. Base de datos reportada      OK — healthy
3. Versión desplegada           OK — 1.0.0
4. GET /docs (Swagger)          OK
5. GET / (frontend)             OK
6. GET / sirve el HTML de la SPA OK

RESULTADO: TODAS LAS PRUEBAS PASARON (0 fallos)
```

URL pública: **`https://vet-manager-api.onrender.com`**. Con esto se completa la evidencia de nube exigida en la rúbrica (antes limitaba Producto a 60/100). Procedimiento y guía: [`docs/despliegue-render.md`](../docs/despliegue-render.md).

### 5.4 Estimación de costos

| Concepto | Alternativa 1: Render + Aiven (gratuito) | Alternativa 2: VPS gestionado (Hetzner CX) | Alternativa 3: IaaS siempre gratis (Oracle Cloud) |
|---|---|---|---|
| Total mensual | **US$0** | desde €5,49/mes + IVA (≈ US$6) | **US$0** (con tarjeta registrada) |
| Total anual | US$0 + dominio ≈ US$10–15 | ≈ US$72 + dominio ≈ US$82–87 | US$0 + dominio ≈ US$10–15 |
| Horas de administración al mes | 2 h (deploy manual desde Git) | 4–6 h (SO, parches, Docker, respaldos) | 6–8 h (SO, firewall, Docker, respaldos, riesgo de reclamación de recursos) |
| Fuente y fecha | render.com/pricing, aiven.io/pricing — 2026-11-18 | hetzner.com/cloud — 2026-11-18 | oracle.com/cloud/free — 2026-11-18 |

**Costos ocultos a considerar:** dominio (~US$10–15/año), ancho de banda de salida si el plan paga excede el incluido, almacenamiento extra (Aiven cobra US$0.30/GB en planes de pago), respaldos externos cifrados y tiempo de administración.

**Recomendación al cliente:** iniciar con **Alternativa 1 (Render + Aiven Free)**: costo mensual cero, sin tarjeta para Render y con la base MySQL gestionada; documenta además el arranque en frío como limitación. Cuando la clínica necesite disponibilidad 24/7 sin suspensión, migrar a Alternativa 2 (VPS) manteniendo el mismo `compose.prod.yaml`, o subir el plan de Render (US$7/mes) — la migración está probada con el ciclo de actualización/rollback de la §5.2.

## 6. Configuración y verificación — Semana 5 (CE-1, CE-3)

**Versión del software cubierta:** 1.1.0 · **Fecha:** 2026-11-19 · **Estado:** base aplicada y verificada (51 pruebas en verde, rotación de logs en producción); migración a base gestionada pendiente de las cuentas de nube.

### 6.1 Inventario de configuración

| Variable | ¿Secreto? | Desarrollo | Servidor | Nube | Si falta… |
|---|:---:|---|---|---|---|
| `SECRET_KEY` | Sí | `.env` local | `/opt/vet-manager/.env` (600) | Panel de Render | No arranca: `RuntimeError` con mensaje claro (`config.py`) |
| `ADMIN_CREATE_KEY` | Sí | `.env` local | `/opt/vet-manager/.env` (600) | Panel de Render | Creación de administradores denegada (fail-closed) |
| `MYSQL_ROOT_PASSWORD` | Sí | `.env` local | `/opt/vet-manager/.env` (600) | Panel de Aiven | `docker compose config` falla a propósito (`:?`) |
| `MYSQL_PASSWORD` | Sí | `.env` local | `/opt/vet-manager/.env` (600) | Panel de Aiven | `docker compose config` falla a propósito (`:?`) |
| `DB_HOST` / `DB_PORT` / `DB_NAME` / `DB_USER` | No | `docker-compose.yml` | `compose.prod.yaml` | Panel de Render | Conexión a BD falla; `/health` reporta `unhealthy` |
| `CORS_ORIGINS` | No | `http://localhost:5173` | `.env` del servidor | Panel de Render | Default local: el frontend de la nube no podría llamar a la API |
| `APP_VERSION` | No | imagen en build | `.env` del servidor | `render.yaml` | `/health` reporta `dev`; el Compose de producción **falla** (`:?`) |
| `APP_ENV` | No | `desarrollo` (default) | `produccion` | `nube` | Default `desarrollo` en `/health` |
| `EMAIL_USER` / `EMAIL_PASSWORD` | Sí | `.env` local | `/opt/vet-manager/.env` (600) | Panel de Render | Correo transaccional no enviado (no bloquea el arranque) |

Plantillas sin secretos: `.env.example`, `backend/.env.example`, `frontend/.env.example`, `deploy/env.prod.example`. **Ningún `.env` está rastreado** (verificado con `git ls-files | grep env`).

### 6.2 Servicios

| Servicio | Imagen / versión | Depende de | Política de reinicio | Healthcheck | Rotación de logs |
|---|---|---|---|---|---|
| `mysql` | `mysql:8.0` | — | `always` | `mysqladmin ping` (10 s) | `json-file` 10 m × 3 (§6.2) |
| `backend` | `vet-manager-backend:1.1.0` | `mysql` (`service_healthy`) | `always` | `GET /health` en el contenedor (15 s) | ídem |
| `frontend` | `vet-manager-frontend:1.1.0` | `backend` (`service_healthy` en prod) | `always` | — (estático) | ídem |
| `caddy` | `caddy:2.10.2-alpine` | `backend`, `frontend` | `unless-stopped` | — | log de accesos con `log` en el Caddyfile |
| `uptime-kuma` | `louislam/uptime-kuma:1` | — | `always` | `node` sobre `127.0.0.1:3001` (30 s) | `json-file` 10 m × 3 (§8.5) |

Orden de arranque: `mysql → backend (espera healthy) → frontend → caddy`. **Docker no reinicia un contenedor `unhealthy` por sí solo**: lo marca y detiene el `--wait`; la política `restart: always` cubre caídas, no salud.

**Rotación de logs (cerrado 2026-11-19):** `deploy/compose.prod.yaml` define el ancla `x-logging` (`driver: json-file`, `max-size: 10m`, `max-file: 3`, ~30 MB por servicio antes de rotar) y la aplican los 5 servicios. Verificado con `docker compose -f deploy/compose.prod.yaml config --quiet` → exit 0.

### 6.3 Endpoint de salud

| Campo | Valor |
|---|---|
| Ruta | `GET /health` |
| Dependencias que verifica | Conexión real a MySQL (`get_db_connection`) |
| Respuesta si está sano | `200` → `{"status":"healthy","database":"healthy","version":"1.1.0","ambiente":"produccion","uptime_s":…}` |
| Respuesta si falla una dependencia | `200` → `{"status":"unhealthy","database":"unhealthy",…}` (el orquestador/alertas deciden; el código no miente) |

### 6.4 Pruebas

#### Prueba de humo

Verificaciones incluidas (`scripts/smoke-test.sh`):

| # | Verificación | Resultado esperado |
|---:|---|---|
| 1 | `GET /health` | JSON con `"status":"healthy"` |
| 2 | Estado de la base de datos | `"database":"healthy"` |
| 3 | Versión desplegada | Coincide con `ESPERADA` si se define |
| 4 | `GET /docs` (Swagger) | HTTP 200 |
| 5 | `GET /` (frontend) | HTTP 200 |
| 6 | HTML de la SPA | Contiene `Vet Manager` |

Salida contra el servidor (2026-11-18, instalación → actualización → rollback, 6/6 en cada paso): ver **§5.2 Evidencia**. Salida contra la nube: **pendiente de crear las cuentas Render/Aiven**.

#### Casos funcionales

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| F-01 | Login con credenciales válidas | POST `/auth/login` con usuario de prueba | Token JWT + datos de usuario | ✅ automático: `test_login_funcional.py::test_f01_login_con_credenciales_validas_devuelve_token` |
| F-02 | Login con contraseña incorrecta | POST `/auth/login` con clave errónea | 401 | ✅ automático: `test_f02_login_con_contrasena_incorrecta_responde_401` + `test_f02b_login_con_email_inexistente_responde_401` (sin enumerar usuarios) |
| F-03 | Health sin base de datos | Detener `mysql`, GET `/health` | `unhealthy` | ✅ automático: `test_health_sin_base_de_datos` |
| F-04 | CORS: origen desconocido rechazado | GET `/health` con `Origin` malicioso | Sin `access-control-allow-origin` | ✅ automático: `test_cors_denegado_para_origen_desconocido` |
| F-05 | Política de contraseñas | Crear admin con clave débil | Rechazo con mensaje | ✅ automático: `test_admin.py` (6 casos) |

Los tests de F-01/F-02 usan la base simulada de `tests/conftest.py` y ejercitan el handler real de `POST /auth/login` (no solo `security.py`), incluida la respuesta idéntica para correo inexistente. **Suite completa: 51 pruebas en verde** (`PYTEST_EXIT=0`, 2026-11-19).

### 6.5 Lista de verificación posterior al despliegue

- [x] Toda la configuración obligatoria está en variables de entorno, con `.env.example` completo
- [x] El proyecto no arranca si falta configuración obligatoria y lo dice claramente (`:?` en Compose, `RuntimeError` en `config.py`)
- [x] Prueba de humo automática posterior a cada cambio (despliegue, actualización, rollback)
- [x] Logs con rotación configurada en producción (`max-size: 10m` / `max-file: 3` en los 5 servicios del compose de producción)
- [ ] Migración de datos a la base gestionada con huellas idénticas y humo después del corte (§2.8)

### 2.8 Evidencia de migración ejecutada (se agrega a la sección 2)

| Campo | Valor |
|---|---|
| Origen (tipo y versión) | MySQL 8.0 en Docker (`vet_manager`, 20 tablas, 110 filas) |
| Destino (proveedor, versión, región) | **Aiven for MySQL Free** — pendiente de crear la instancia |
| Diferencias resueltas (dueño, versión, SSL…) | Pendiente: Puerto SSL, `utf8mb4`, usuario no-root (`vet_user`) |

**Estado: pendiente.** Procedimiento previsto (mismo patrón que la §5.2, congelar escrituras → volcar → importar → huellas → humo → decidir). Huellas: `SELECT COUNT(*)` por tabla + `CHECKSUM TABLE` en origen y destino; la comparación de conteos ya está probada localmente en §3.5 (20/20 tablas idénticas). Rollback: no hizo falta en el ensayo local; si el destino falla, se reabre el origen sin tocar el respaldo.

## 7. Seguridad, usuarios y permisos — Semana 6 (CE-1, CE-4)

**Fecha:** 2026-11-19 · **Estado:** aplicación endurecida + evidencia local; endurecimiento del servidor Linux pendiente de existir el servidor.

### 7.1 Usuarios del sistema operativo

| Cuenta | Tipo | Persona o servicio | Grupos | Inicia sesión | `sudo` permitido |
|---|---|---|---|:---:|---|
| `<admin>` | Persona | Administrador del servidor | `sudo` | Llave SSH | Todo, con contraseña |
| `<despliegue>` | Persona | Responsable técnico | `despliegue` | Llave SSH | Solo reiniciar el stack (script dedicado) |
| `respaldo` | Servicio | `cron` | — | No (`nologin`) | Nada |

Archivos y carpetas sensibles:

| Ruta | Dueño:grupo | Permisos | Por qué |
|---|---|:---:|---|
| `/opt/vet-manager` | `root:despliegue` | `2770` | Solo el equipo de despliegue entra |
| `/opt/vet-manager/.env` | `root:despliegue` | `600` (verificado en el simulacro) | Secretos de la app |
| `backups/mysql/*.sql.gz` | `root:root` | `700` (directorio, `umask 077` en el script) | Respaldos con datos personales |

### 7.2 Acceso remoto y firewall

**Estado: pendiente de servidor real.** Configuración prevista: SSH solo con llave (`PasswordAuthentication no`), UFW con política por defecto `deny incoming` y solo puertos 22/80/443.

| Puerto | Abierto | Justificación |
|---|:---:|---|
| 22 | Sí (futuro) | Administración, solo con llave |
| 80/443 | Sí | Caddy (HTTP→HTTPS y HTTPS) |
| 3306/3307, 5000, 5173 | **No** | MySQL y API solo en red interna/loopback |

Evidencia de que la base de datos no está expuesta (ya ejecutada, §4.5):

```text
Desde la red (10.90.40.59): 3307 False · 5000 False · 5173 False · 8443 False
Desde loopback (127.0.0.1): 3307 True  · 5000 True  · 8443 True
compose.prod.yaml: mysql sin publicación de puertos; backend solo 127.0.0.1
```

### 7.3 Roles de la base de datos

| Rol | Privilegios | No puede | Lo usa | Dónde vive su contraseña |
|---|---|---|---|---|
| `vet_user` (actual) | CRUD sobre `vet_manager` | Crear bases/roles, `PROCESS` | La app (backend) | `.env` del servidor (600) |
| `root` (solo en el contenedor) | Total | — | `mysqldump` del respaldo (`scripts/respaldar.sh`) | `.env` del servidor (600) |

**Estado (2026-11-19): separación de privilegios implementada y probada.** Antes había un solo usuario (`vet_user` con `ALL PRIVILEGES`), por lo que la separación era parcial. Ahora existen tres roles reales en MySQL:

| Rol | Privilegios | Lo usa | Cómo se crea en un deploy nuevo |
|---|---|---|---|
| `vet_owner` | `ALL PRIVILEGES ON vet_manager.*` (DDL + DML + rutinas) | Solo el arranque: 10 migraciones + `sp_citas_activas` + alembic | `database/2-roles.sh` (initdb) |
| `vet_app` | `SELECT, INSERT, UPDATE, DELETE, EXECUTE` | Todas las peticiones de la API | `MYSQL_USER` del entrypoint (`MYSQL_APP_USER`) |
| `root` | Total | `mysqldump` del respaldo, dentro del contenedor | entrypoint MySQL |

El código separa las dos conexiones: `get_db_connection(owner=True)` usa `DB_OWNER_CONFIG` únicamente en las funciones `migrate_*`, `hash_existing_passwords()` y `run_alembic_migrations()`; el resto de rutas usa `get_db_connection()` con `vet_app`. `migrate_stored_procedures()` garantiza `sp_citas_activas` en bases nuevas (la API solo tiene `EXECUTE`). Los cambios: `backend/app/core/config.py`, `backend/app/core/database.py`, `backend/app/main.py`, `backend/migrations/env.py`, ambos compose y `database/2-roles.sh`.

Pruebas de privilegios (ejecutadas en la BD de producción local, 2026-11-19):

| Rol | Operación | Esperado | Obtenido |
|---|---|:---:|---|
| `vet_app` | `SELECT COUNT(*) FROM usuarios` | ✅ | ✅ Consulta permitida (0 filas en la BD prod local; 14 en desarrollo) |
| `vet_app` | `CREATE TABLE t_prueba_app` | ❌ | ✅ Rechazado: `ERROR 1142 (42000) CREATE command denied` |
| `vet_app` | `DROP TABLE usuarios` | ❌ | ✅ Rechazado: `ERROR 1142 (42000) DROP command denied` |
| `vet_app` | `ALTER TABLE usuarios ADD COLUMN x` | ❌ | ✅ Rechazado: `ERROR 1142 (42000) ALTER command denied` |
| `vet_app` | `CALL sp_citas_activas()` | ✅ | ✅ Correcto (gracias a `EXECUTE`) |
| `vet_owner` | `CREATE TABLE t_prueba_owner` | ✅ | ✅ Creada y borrada después |

Verificación del arranque con roles separados: `DB_USER=vet_app`, `DB_OWNER_USER=vet_owner` en ambos stacks, `/health` en verde y smoke test **6/6**. Nota: el script de respaldo sigue usando `root` dentro del contenedor porque `vet_app` no tiene `PROCESS`/`SHOW CREATE PROCEDURE` (evidencia §3.5); se mantiene así deliberadamente para no dar esos privilegios al usuario de la API.

### 7.4 Inventario de secretos

| Secreto | Da acceso a | Dónde vive (cada ambiente) | Permisos | Quién lo lee | Cómo se rota |
|---|---|---|:---:|---|---|
| `SECRET_KEY` | Firma de JWT (todas las sesiones) | `.env` local / servidor / panel Render | 600 | Solo backend | Nuevo valor + reinicio del servicio |
| `ADMIN_CREATE_KEY` | Creación de administradores | ídem | 600 | Solo backend | Ídem |
| `MYSQL_PASSWORD` / `MYSQL_ROOT_PASSWORD` | Datos de la clínica | ídem / panel Aiven | 600 | backend, respaldo | Cambio en MySQL + `.env` + reinicio |
| App password de Gmail | Envío de correos | `.env` | 600 | backend | Regenerar en `myaccount.google.com/apppasswords` |
| `SONAR_TOKEN` | Escaneo del repo | GitHub Secrets | — | CI | Regenerar en SonarCloud |

**Rotación pendiente del usuario:** la app password de Gmail (`zwonlbxjjomngdcp`), `SECRET_KEY` y las contraseñas de MySQL quedaron expuestas en el historial de Git público; se sacaron del árbol actual (commit `50fa133`) pero **deben rotarse**. Revisión del historial:

```text
$ git grep -l -E "zwonlbxjjomngdcp|root123|vet_pass|mi_secreto_super_seguro_2024|VET-ADMIN-2026" -- .
docs/plan-implantacion.md   (esta propia tabla, como referencia de rotación)
```

El único hallazgo en el árbol rastreado es **esta propia tabla** (el valor aparece escrito en el §7.4 como recordatorio de rotación). Sigue siendo un secreto en texto plano: **rotarlo en Google no basta**, hay que borrar la referencia del historial o al menos dejar claro que el valor ya no es válido. `git log -S` muestra 3 commits donde apareció (`a7aad1f`, `50fa133`, `3e7989f`). Acción pendiente del usuario.

### 7.5 Lógica de veterinario: cierre de extremo a extremo (2026-11-21)

El perfil veterinario ya estaba implementado en backend y frontend (consultas, historial clínico, medicamentos, citas asignadas, horarios, reportes y notificaciones). Se cerraron los huecos detectados en la auditoría:

| Hallazgo | Corrección |
|---|---|
| No existía `require_veterinario`; 6 endpoints repetían el mismo `if rol != 'veterinario'` inline | Nuevo dependency en `app/core/auth.py`, aplicado a los 6 endpoints exclusivos del veterinario |
| `GET /api/vet/disponibilidad` y `/api/vet/horarios` solo exigían autenticación | Pasan a `require_staff` (admin/vet/recepción); recepción los necesita para agendar, por eso no son solo-vet |
| `get_medicamentos_historial()` no tenía decorador → función muerta | Ahora es `GET /api/vet/historial/{historial_id}/medicamentos` con `require_staff` |
| `/api/stats` contaba `citas_hoy` del vet con `fecha >= CURDATE()` (acumulaba futuras) | Cambiado a `fecha = CURDATE()`, igual que `/api/vet/citas-hoy` |
| 3 pantallas descargaban PDF con `fetch('http://localhost:5000/...')` | Usan la instancia de axios (`baseURL` + interceptor de token), válido en local y en Render |
| `console.log` de datos de citas en `UsuarioNuevaCita.jsx` | Eliminado |

**Evidencia real (BD de desarrollo, 2026-11-21):** con el JWT de un usuario normal, `GET /api/vet/citas-hoy` → **403** `"Se requieren permisos de veterinario"`, `GET /api/vet/disponibilidad` → **403** `"Se requieren permisos de personal"` y el nuevo endpoint de medicamentos → **403**. El frontend compila (`pnpm run build`) y los 61 tests pasan.

### 7.6 Tokens de correo: confirmación de registro y recuperación (2026-11-21)

Antes había dos fallos graves: el token de **reset nunca caducaba** (no se escribía `reset_token_expires`) y el registro que usa la UI (`/auth/register/user`) guardaba `confirm_token = NULL`, dejando la cuenta activa sin verificar correo. Corregido:

| Flujo | Antes | Ahora |
|---|---|---|
| `POST /auth/register/user` | cuenta activa, JWT inmediato | con SMTP configurado: `confirm_token` de 32 bytes, `confirm_token_expires` (24 h por defecto), `is_active = FALSE`, correo enviado y respuesta sin token; sin SMTP: activación directa para no bloquear desarrollos locales |
| `POST /auth/confirm-email` | leía la caducidad de `reset_token_expires` | columna propia `confirm_token_expires` (con compatibilidad hacia atrás); el token se pone a `NULL` tras usarse |
| `POST /auth/request-reset` | escribía solo `reset_token` | escribe `reset_token` + `reset_token_expires` (1 h por defecto); respuesta genérica, nunca devuelve el token |
| `POST /auth/reset-password` | aceptaba tokens eternos | comprueba la caducidad (los tokens antiguos sin fecha se rechazan) y limpia ambos campos |
| `POST /auth/resend-confirmation` | no existía | reenvía un token nuevo con respuesta genérica anti-enumeración |

Los enlaces de los correos usan `FRONTEND_BASE_URL` (nueva variable; por defecto `http://localhost:5173`, en Render se define en el panel) en vez de `localhost` hardcodeado. El frontend alinea la validación de contraseña (8 caracteres + mayúscula/minúscula/número/símbolo) con el backend y ofrece reenvío de confirmación en `ConfirmarEmail.jsx`. Las caducidades se configuran con `RESET_TOKEN_HOURS` y `CONFIRM_TOKEN_HOURS`.

**Evidencia real (BD de desarrollo):** `/auth/request-reset` guardó `reset_token_expires = 2026-11-22 00:09:49`; al forzar la fecha al pasado, `/auth/reset-password` devolvió `400 "El enlace ha expirado. Solicita uno nuevo."`. Un token sin fecha también se rechaza. 61 tests en verde (incluidos 3 nuevos de caducidad).

---

## 3. Plan de respaldo final (semana 6; reemplaza la versión de la semana 2)

| Campo | Valor |
|---|---|
| Qué se respalda | Base completa `vet_manager` (20 tablas, 110 filas): datos + rutinas + triggers + eventos |
| RPO / RTO acordados | RPO 24 h / RTO 4 h (propuesta, pendiente de aprobación del responsable del negocio) |
| Herramienta | `mysqldump --single-transaction --routines --triggers --events` + `gzip` (script `scripts/respaldar.sh`) |
| Usuario que lo ejecuta | `root` dentro del contenedor MySQL (necesita `PROCESS`/`SHOW CREATE PROCEDURE`) |
| Cifrado | **No cifra** (advertencia en el script): cifrar antes de copiar fuera del host (`age`/`gpg`) |
| Horario (línea de cron) | `0 3 * * * bash /opt/vet-manager/scripts/respaldar.sh >> /var/log/vet-manager-respaldos.log 2>&1` (propuesta) |
| Retención | 7 días (`RETENTION_DAYS=7`, aplicada por el script) |
| Verificación automática | `gzip -t` + SHA-256 informado en cada ejecución |
| Responsable | Administrador de base de datos |

### 3.1 Regla 3-2-1

| Copia | Medio | Ubicación | ¿Inmutable? |
|---|---|---|:---:|
| Producción | Volumen Docker `vet-manager-prod_mysql_data` | Servidor | — |
| Repositorio local | Disco del servidor | `backups/mysql/` (permisos 700) | No |
| Repositorio externo | Copia fuera del host (pendiente de configurar) | Servidor/almacenamiento aparte | No |

### 3.2 Script y programación

Enlace: [`scripts/respaldar.sh`](../scripts/respaldar.sh). Log de ejecución real (2026-11-18):

```text
Respaldo creado: backups/mysql/vet_manager-20261118T185238Z.sql.gz
SHA-256: 0ce11a55cd27ce053a883cca3126ca16399b1c4c552ab963ff6d845e1fef9494
Retención aplicada: 7 días
```

Ejecución de verificación (2026-11-19, con `KUMA_PUSH_URL` configurado):

```text
Respaldo creado: backups/mysql/vet_manager-20261119T221810Z.sql.gz
SHA-256: a4d45e9449d14d2aa6114800c1f16a65d5d9e630d1a012238dfb9df44750cb68
Retención aplicada: 7 días
Latido a Uptime Kuma: OK (heartbeat monitor 3 → status=1)
```

El script ahora avisa a Uptime Kuma al terminar: `status=up` si el respaldo termina bien y `status=down` desde un trap `ERR` si falla (§8.5).

### 3.3 Procedimiento de restauración de desastre

1. Detener escritores: `docker compose -f deploy/compose.prod.yaml stop backend`.
2. Verificar el dump: `gzip -t respaldos/<archivo>.sql.gz` y comparar el SHA-256 con el registrado.
3. Crear base destino: `CREATE DATABASE vet_manager_nueva CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
4. Importar: `gzip -dc <archivo> | docker compose exec -T mysql sh -c 'MYSQL_PWD=$MYSQL_ROOT_PASSWORD mysql -u root vet_manager_nueva'`.
5. Conciliar: `SELECT COUNT(*)` por tabla en origen y destino (§3.5 muestra el método UNION ALL) — deben ser idénticos.
6. Verificar restricciones: PK, UNIQUE y FK presentes (`information_schema.table_constraints`).
7. Ejecutar `scripts/smoke-test.sh` contra el servicio apuntando a la base restaurada.
8. Solo tras conciliación y aprobación del responsable del negocio: reabrir escrituras.

### 3.4 Restauración probada

| Campo | Valor |
|---|---|
| Fecha | 2026-11-18 |
| Quién restauró (rol en el equipo) | Responsable técnico |
| Instantánea usada | `vet_manager-20261118T185238Z.sql.gz` |
| Inicio / fin | Restauración en 2 s |
| Tiempo total vs RTO | 2 s ≪ RTO 4 h ✅ |

Huellas antes y después: 20/20 tablas con `COUNT(*)` idéntico (110 filas), `diff` sin diferencias — tabla completa en **§3.5**. Simulacro de desastre: `DROP TABLE usuarios` → recuperación desde el dump con PK, UNIQUE y 4 FK intactas.

**Re-verificación (2026-11-19):** se importó `vet_manager-20261119T221810Z.sql.gz` en una base destino `vet_manager_restore_test` (creada solo para la prueba y borrada después). Resultado: **20/20 tablas con `COUNT(*)` idéntico** entre origen y destino (ej. `usuarios` 14/14, `medicamentos` 15/15, `notificaciones` 17/17, `facturas` 2/2) y restricciones equivalentes: **PRIMARY KEY 21/21, FOREIGN KEY 26/26, UNIQUE 7/7**. La importación devolvió RC=0.

**Restauración automatizada (2026-11-21):** se añadió `scripts/restaurar.sh`, que verifica `gzip -t` y SHA-256, importa en una base destino (por defecto una nueva, nunca sobrescribe producción), compara el número de tablas y comprueba `alembic_version` contra el manifiesto. `scripts/respaldar.sh` genera ahora un `.manifest.txt` al lado del dump con `alembic_head` y el número de tablas. Ejecución real:

```text
1/6 Verificando integridad gzip...  SHA-256: 7d5ae512...
2/6 Manifiesto: alembic_head=0002_confirm_token_expiry, tablas=22
3/6 Base destino: vet_manager_restore_prueba3
4/6 Importando dump... RC=0
5/6 Verificando huellas... tablas: origen=22 restaurada=22
   alembic_version=0002_confirm_token_expiry
6/6 Resultado: RESTAURACIÓN VERIFICADA
```

Las bases de prueba se borraron al terminar. **`Alembic` deja de ser decorativo (2026-11-21):** `env.py` usa `target_metadata = Base.metadata` (ya permite `alembic revision --autogenerate`), la revisión `0002_confirm_token_expiry` añade la columna de caducidad de confirmación con `upgrade`/`downgrade` idempotentes, y el arranque ya no se cae si Alembic falla (las migraciones idempotentes de `main.py` dejan el esquema usable). Verificado en la BD de desarrollo: `alembic_version = 0002_confirm_token_expiry`.

Problemas encontrados y cambios aplicados: `vet_user` no puede volcar (`PROCESS`/`SHOW CREATE PROCEDURE`) → el script ahora usa `root` dentro del contenedor; desde el 2026-11-19 el usuario de la API es `vet_app` (§7.3), que tampoco tiene esos privilegios, así que se mantiene `root` para el respaldo de forma intencional.

## 8. Pipeline de despliegue y monitoreo — Semana 7 (CE-1, CE-5)

**Fecha:** 2026-11-19 · **Estado:** CI de pruebas en verde, Quality Gate de SonarCloud en **OK** y monitoreo definido en el compose; entrega continua (GHCR/Render) pendiente de las cuentas de nube.

### 8.1 Pipeline

| Workflow | Evento | Etapas | Resultado |
|---|---|---|---|
| `sonarcloud.yml` (job `tests`) | push a `main`/`develop`, pull request | instalar dependencias → `pytest --cov` | check **Pruebas del backend** en verde (**51 pruebas**) |
| `sonarcloud.yml` (job `sonarcloud`) | ídem (`needs: tests`) | generar cobertura → scan SonarCloud | check **SonarCloud Scan** solo corre si las pruebas pasan |

Enlace: [`.github/workflows/sonarcloud.yml`](../.github/workflows/sonarcloud.yml).

**Corrección aplicada (2026-11-18):** el scan se ejecutaba sin pruebas → cobertura 0 % y Quality Gate en ERROR (`new_coverage 0.0% < 80%`). Ahora los tests corren antes y `sonar-project.properties` apunta a `backend/coverage.xml` (marcadores de conflicto resueltos).

**Calidad (2026-11-19): Quality Gate en OK.** Análisis de SonarCloud del commit `005938c` (2026-11-19T20:14:18Z): `new_coverage 100.0 %`, 0 issues nuevas, duplicados 0.0 %, security/reliability/maintainability 1 (las 3 reglas de higiene), hotspots revisados 100 %. Los 3 commits que lo cerraron: `e1d2117` (8 cambios de calidad + 6 tests), `3c01287` (`backend/tests/**` en `sonar.exclusions` por el error *can't be indexed twice*) y `005938c` (versiones `==` inline en los 3 `pip install`, porque la regla `docker:S8544` **no sigue `-r requirements.txt`**).

Reglas de protección (propuestas, configurables en GitHub):

| Regla | Configuración |
|---|---|
| Rama `main` | Pull request obligatorio; checks `Pruebas del backend` y `SonarCloud Scan` obligatorios |
| Etiquetas `vX.Y.Z` | Solo desde `main` tras verde |

### 8.2 Secretos y variables del pipeline

| Nombre | Tipo | Ámbito | Para qué | Quién lo rota |
|---|---|---|---|---|
| `SONAR_TOKEN` | Secreto | Repositorio | Scan de SonarCloud | Administrador del repositorio |

Pendiente cuando exista la nube: `RENDER_DEPLOY_HOOK_URL` (ambiente `produccion`) para despliegue automático en Render.

### 8.3 Evidencia de ejecución

| Evento | Enlace | Duración | Resultado |
|---|---|---|---|
| Push con pruebas nuevas | commits `e1d2117` → `005938c` en `main` | ~2 min/job | ✅ Check **Pruebas del backend** en verde (51 pruebas) y **SonarCloud Scan** en verde |
| Quality Gate | análisis de SonarCloud rev `005938c` (2026-11-19T20:14:18Z) | — | ✅ **OK** (new_coverage 100.0 %, 0 issues nuevas, duplicados 0.0 %) |
| Liberación `v1.0.0` / `v1.1.0` | etiquetas en el remoto (`git ls-remote --tags` → `refs/tags/v1.0.0`, `refs/tags/v1.1.0`) | — | ✅ Pusheadas (`git push origin --tags`) |
| Rollback `1.1.0 → 1.0.0` | §5.2 Evidencia | < 1 min | ✅ Smoke test 6/6 tras el rollback |

### 8.4 Procedimiento de despliegue y rollback

#### En la nube (pendiente de cuentas)

1. Push a `main` → Render detecta el cambio (o *Manual Deploy* desde el blueprint `deploy/render.yaml`).
2. Rollback: Render → *Deploys → Rollback to previous deploy* (sin reconstruir).

#### En el servidor (probado en el simulacro, §5.2)

```text
1. respaldo:  mysqldump | gzip > respaldos/pre-update-<ver>-<fecha>.sql.gz   (gzip -t + SHA-256)
2. imágenes:  docker load -i imagenes/vet-manager-<ver>.tar.gz
3. versión:   sed -i "s/^APP_VERSION=.*/APP_VERSION=<ver>/" .env
4. aplicar:   docker compose -f deploy/compose.prod.yaml up -d --wait
5. verificar: bash smoke-test.sh https://<dominio>        (6/6 en verde)
Rollback:    repetir 3-5 con la versión anterior
```

#### Migraciones compatibles hacia atrás

**Regla del equipo:** solo se publican migraciones aditivas (tablas/columnas nuevas, `ENUM` ampliado); los cambios destructivos usan *expand/contract* en dos versiones. La clasificación completa está en la **§5.2**. Ninguna migración existente impide el rollback actual (1.1.0 no migró esquema).

### 8.5 Monitoreo

| Monitor | Tipo | Objetivo | Intervalo | Reintentos | Qué hace quien recibe la alerta |
|---|---|---|---|---|---|
| Salud de la API | HTTP | `GET /health` (reporta `status`, `database`, `version`, `uptime_s`) | 60 s | 2 | Revisar logs del backend; si el último cambio lo provocó, rollback a la versión anterior (§8.4) |
| Salud de la BD | incluida | `"database":"healthy"` en `/health` | 60 s | 2 | Verificar MySQL; si falla, restaurar según §3.3 |
| Respaldo diario | Push (latido) | Log de `respaldar.sh` | 25 h | 0 | Investigar el job; verificar el archivo y el SHA-256 |

| Campo | Valor |
|---|---|
| Dónde corre Uptime Kuma | Servicio `uptime-kuma` en `deploy/compose.prod.yaml`: imagen `louislam/uptime-kuma:1`, volumen `uptime_kuma_data`, UI **solo en loopback** (`127.0.0.1:${KUMA_PORT:-8081}`); para entrar: `ssh -L 8081:127.0.0.1:8081 <usuario>@<servidor>` |
| Monitores creados (§8.5) | **Creados y activos el 2026-11-19** vía API Socket.IO de Uptime Kuma: ID 2 HTTP `http://backend:5000/health` cada 60 s (2 reintentos, espera 200) e ID 3 push «Respaldo diario (latido)». Latidos registrados en `kuma.db`: monitor 2 → `status=1, "200 - OK"`; monitor 3 → `status=1, "OK"` |
| Cómo entrar al panel | `ssh -L 8081:127.0.0.1:8081 <usuario>@<servidor>` y abrir `http://127.0.0.1:8081`. Usuario admin del simulacro: `admin` / `VetManager-Kuma-2026!` (**cambiar en producción**) |
| Latido del respaldo | `respaldar.sh` envía `KUMA_PUSH_URL` al terminar (éxito `status=up`, fallo `status=down` vía trap `ERR`). URL local: `http://127.0.0.1:8081/api/push/af504418340a7d6e87ea` (token de 20 chars: `af504418340a7d6e87ea`) |
| Canal de alertas y quién lo lee | Pendiente: canal de mensajería del equipo, atención del responsable técnico (no configurable hasta crear el canal) |
| Horario de atención de alertas | Propuesta: horas hábiles; P1 las 24 h |

## 9. Mantenimiento, soporte y capacitación — Semana 8 (CE-5)

**Fecha:** 2026-11-19 · **Estado:** runbooks, guía y FAQ creados y primera auditoría ejecutada; ejecución calendárica a partir de la puesta en producción. **Dependabot fue retirado el 2026-11-19**: al activarlo abrió 8 PRs y ramas `dependabot/*` no deseados (se cerraron y borraron; quedan solo `main`, `develop`, `fix`). Se eliminó `.github/dependabot.yml` (PR #24) y se deshabilitaron las *Dependabot security updates* en GitHub. Las auditorías se ejecutan manualmente con `pip-audit`, `pnpm audit` y Trivy (§9.1).

### 9.1 Plan de mantenimiento

#### Calendario

| Tarea | Tipo | Frecuencia | Automática / manual | Responsable (rol) | ¿Requiere ventana? |
|---|---|---|---|---|:---:|
| Parches de seguridad del SO | Preventivo | Diaria | Automática (`unattended-upgrades`) | Administrador del servidor | No |
| Reinicio por parches de kernel | Preventivo | Mensual | Manual | Administrador del servidor | Sí |
| Actualización de imágenes base (`mysql`, `caddy`, `python`) | Preventivo | Mensual | Manual (build + humo) | Responsable técnico | No (humo tras cada cambio) |
| Restauración de prueba del respaldo | Preventivo | Mensual | Manual | Administrador de BD | No |
| Rotación de secretos | Preventivo | Trimestral | Manual | Responsable técnico | No |

Ventana de mantenimiento propuesta: **domingos 02:00–04:00 (hora local), aviso a los usuarios 48 h antes**; máximo 2 h (coincide con la ventana de la §5).

#### Fin de soporte

| Componente | Versión | Fin de soporte | Fuente y fecha de consulta | Acción planeada |
|---|---|---|---|---|
| Ubuntu Server LTS | 24.04 | Abril 2029 (ESM hasta 2036) | ubuntu.com/about/release-lifecycle — 2026-11-18 | Migrar antes de esa fecha (§1) |
| MySQL | 8.0 | Abril 2026 (soporte extendido) | oracle.com/mysql — 2026-11-18 | Evaluar salto a 8.4 LTS en la ventana mensual |
| Python | 3.11 | Octubre 2027 | python.org — 2026-11-18 | Actualizar imagen backend antes de esa fecha |
| Node.js | 20 (LTS) | Abril 2026 | nodejs.org — 2026-11-18 | Actualizar a 22 LTS en el build del frontend |

#### Política de actualizaciones

| Tipo | Plazo | Cómo se decide |
|---|---|---|
| Parche de seguridad (SO) | 7 días | Automático en el servidor |
| Parche de dependencias (Python/npm) | 14 días | `pip-audit` / `pnpm audit` manuales → rama `develop` → CI en verde → PR a `main` → versión de parche (sin Dependabot; ver nota arriba) |
| Actualización de imágenes base | Ventana mensual | Humo en verde antes y después |

**Creado (2026-11-19):** [`.github/dependabot.yml`](../.github/dependabot.yml) con los ecosistemas `pip` (`/backend`), `npm` (`/frontend`), `docker` (`/backend`) y `github-actions` (`/`), revisión semanal los lunes, hasta 5 PR abiertos por ecosistema, etiquetas `dependabot` + `python`/`frontend`/`docker`/`ci` y prefijos `chore(deps)`/`chore(docker)`/`chore(actions)`. YAML validado (`yaml.safe_load` → OK). **Primera auditoría ejecutada 2026-11-19** (tabla siguiente).

#### Auditoría (primera ejecución: 2026-11-19)

| Herramienta | Hallazgo | Severidad | ¿En la imagen desplegada? | Decisión |
|---|---|:---:|:---:|---|
| `pnpm audit` (frontend) | **0 vulnerabilidades** | — | — | ✅ Nada que hacer |
| `pip-audit` (antes de remediación) | 18 vulnerabilidades en 4 paquetes: `pip 24.0` (6 IDs), `setuptools 79.0.1` (2), `python-jose 3.5.0` (1, **sin fix**), `ecdsa 0.19.2` (2) | HIGH/CRITICAL | Sí | Remediado (ver abajo) |
| `pip-audit` (después de remediación) | **"No known vulnerabilities found"** | — | — | ✅ Cerrado |
| `trivy image` (imagen backend `52b2028e91e2`) | `setuptools 70.3.0` → CVE-2025-47273 (path traversal en `PackageIndex`) | HIGH | **No** — falso positivo explicado abajo | Sin acción; documentado |

**Remediaciones aplicadas (commits de la rama `main`):**

| Hallazgo | Acción | Evidencia |
|---|---|---|
| `python-jose 3.5.0` (PYSEC-2026-4298, sin versión de arreglo) | **Eliminado** de `requirements.txt` + de las 3 listas inline (Dockerfile y 2 jobs del workflow): nadie lo importa (`grep "from jose\|import jose"` → 0); la app usa **PyJWT** (`import jwt` en `main.py` y `security.py`) | `pip-audit` deja de reportarlo |
| `ecdsa 0.19.2` (dependía solo de python-jose) | Desaparece con el paquete anterior | `pip show ecdsa` → `Required-by: python-jose` |
| `pip 24.0` (PYSEC-2026-1795/1796/2875/2876/196/3721) | `pip==26.3` en el Dockerfile | `pip --version` → 26.3 |
| `setuptools 79.0.1` (PYSEC-2026-3447, GHSA-xmj3-9gf7-h52w) | `setuptools==84.1.0` en el Dockerfile | `pip list` → 84.1.0 |
| `wheel 0.45.1` / `jaraco.context 5.3.0` (trivy, HIGH) | `wheel==0.46.3`, `jaraco.context==6.1.0` en el Dockerfile | `pip list` → 0.46.3 / 6.1.0 |

**Sobre el hallazgo residual de trivy (falso positivo, verificado):** trivy reporta `setuptools 70.3.0` en la capa `e49319cd…` de la imagen, pero:

- `pip list` y `python -c "import setuptools; print(setuptools.__version__)"` → **84.1.0** (≥ 78.1.1, la versión corregida).
- `find / -name package_index.py` (el módulo vulnerable) → **ningún resultado** en toda la imagen.
- La cadena `setuptools==70.3.0` solo aparece en la **metadata interna de pip**: `pip/_vendor/vendor.txt` (el manifiesto de lo que pip vendora) y su SBOM `pip/_vendor/bom.cdx.json`. De ese paquete, pip solo incluye `pip/_vendor/pkg_resources`; **`pip/_vendor/setuptools` no existe** y `package_index.py` (el módulo afectado por el CVE) no está en ningún punto de la imagen.
- `pip-audit` (que lee los `dist-info` reales) → **sin vulnerabilidades**.

Es decir: trivy interpreta el manifest de dependencias de pip como si fuera un paquete instalado. No hay código vulnerable en la imagen; se deja registrado para no re-abrirlo en cada auditoría.

### 9.2 Soporte

| Nivel | Quién (rol) | Resuelve | Horario |
|---|---|---|---|
| N0 | Ayudas en línea (guía rápida y FAQ) | Dudas de uso | Siempre |
| N1 | Recepción / soporte de primer nivel | Bloqueos de uso, reportes repetidos | Horas hábiles |
| N2 | Responsable técnico | Incidentes de servidor, despliegues, respaldos | Horas hábiles + guardia P1 |
| N3 | Desarrollo (externo/interno) | Defectos de código | Según acuerdo |

Canal único de reporte: formulario/ dirección de soporte **(pendiente: crear el canal y enlazarlo en la app)**.

| Prioridad | Primera respuesta | Solución o alternativa |
|---|---|---|
| P1 (app caída) | 1 h | Rollback o restauración según §8.4 / §3.3 |
| P2 (función rota) | 24 h | Parche en la siguiente ventana |
| P3 (mejora menor) | 5 días hábiles | Backlog |
| P4 (cosmético) | Próxima versión | Backlog |

*Estos tiempos son una propuesta: se acuerdan con el cliente en el acta de la semana 9.*

### Runbooks

| Runbook | Alerta o síntoma | Probado por (rol, otro equipo) | Correcciones tras la prueba |
|---|---|---|---|
| [`docs/runbooks/salud-en-rojo.md`](runbooks/salud-en-rojo.md) (creado 2026-11-19) | "Salud" en rojo en el monitor | Pendiente (gate semana 9: simulacro con observador externo) | — |
| [`docs/runbooks/respaldo-fallido.md`](runbooks/respaldo-fallido.md) (creado 2026-11-19) | Latido de respaldo ausente | Pendiente | — |

### 9.3 Capacitación

| Público | Objetivos observables | Sesión (duración, modalidad) | Materiales | Cómo se evalúa |
|---|---|---|---|---|
| Usuarios finales (clínica) | Registrar cliente + mascota + cita sin ayuda en < 5 min | 60 min, presencial | Guía rápida, datos de prueba | Tarea de verificación + encuesta |
| Soporte N1 | Resolver 3 casos de la FAQ sin escalar | 30 min, videollamada | FAQ, runbook N1 | Casos simulados |
| Operación N2 | Ejecutar instalación → actualización → rollback siguiendo solo la §5 | 90 min, taller | §5 del plan, smoke test | Ejecución sin errores en el simulacro |

Cronograma: **a definir con el cliente** (semana 9, junto con el acta).

### 9.4 Ayudas en línea

| Ayuda | Enlace | Versión del software | Probada por (rol) |
|---|---|---|---|
| Guía rápida | [`docs/guia-rapida.md`](guia-rapida.md) (creada 2026-11-19) | 1.1.0 | Pendiente (cliente, sesión de capacitación §9.3) |
| Preguntas frecuentes | [`docs/faq.md`](faq.md) (creada 2026-11-19) | 1.1.0 | Pendiente (soporte N1, §9.3) |

Dónde se enlazan: sección **"Ayudas en línea"** del [README](../README.md) (hecho); en la app, el pie de página/panel de administración (pendiente).

## 10. Aceptación y entrega — Semana 9 (CE-1 a CE-5)

**Fecha:** 2026-11-19 · **Estado:** materiales de aceptación preparados (guía de UAT, acta en borrador, registro de simulacro); ejecución de la UAT, simulacro cruzado y firma del acta pendientes de cliente y otro equipo.

### 10.1 Consolidación

| Sección | Completa según la lista | Observaciones |
|---|:---:|---|
| 1. Ficha técnica | ✅ | Incluye salida del script con `CUMPLIMIENTO: confirmado` (§1.7) |
| 2. Migración | 🟡 | Plan completo; evidencia de migración a nube pendiente (§2.8) |
| 3. Respaldo | ✅ | Respaldo + restauración + simulacro de desastre reales (§3.5) |
| 4. Hosting y dominio | ✅ | Reverse proxy probado con evidencia (§4.5) |
| 5. Instalación | ✅ (local) / 🟡 (nube) | Instalación→actualización→rollback probados; nube pendiente de cuentas |
| 6. Configuración | 🟡 | Inventario, health, rotación de logs y F-01/F-02 completos; migración a nube pendiente (§2.8) |
| 7. Seguridad | 🟡 | Secretos fuera del repo + permisos 600; SSH/UFW/roles BD pendientes de servidor real |
| 8. Pipeline y monitoreo | 🟡 | CI en verde + Quality Gate OK + tags pusheados; Uptime Kuma en compose; entrega continua y canal de alertas pendientes |
| 9. Mantenimiento, soporte y capacitación | 🟡 | Auditoría manual (pip-audit/pnpm/trivy) + runbooks + guía/FAQ; Dependabot retirado; cronograma de capacitación pendiente |

Registro de cambios del plan:

| Versión | Fecha | Cambios |
|---|---|---|
| 1.0 | 2026-11-04 | Secciones 1–4 y v0 de la 5 |
| 1.1 | 2026-11-18 | Cierre de semanas 1–4: evidencias §1.7, §3.5, §4.5; §5 a v1 (starter S04); borradores §6–§10. §1 adaptada al equipo real (§1.3 SO del entorno, §1.4 medición, §1.5 matriz con specs del portátil, §1.6 plataforma) |
| **1.2** | **2026-11-19** | **Cierre de semanas 5–9: §6 rotación de logs + F-01/F-02 automatizados (51 tests); §7 roles `vet_owner`/`vet_app` reales + pruebas de privilegios; §3 respaldo re-verificado (20/20 tablas, PK/FK/UNIQUE) + latido Kuma; §8 Quality Gate OK + monitores reales en Uptime Kuma; §9 Dependabot retirado + auditoría manual con decisión por hallazgo + runbooks + guía/FAQ; §10 materiales de aceptación (UAT, acta, registro de simulacro)** |
| **1.3** | **2026-11-21** | **Cierre funcional y calidad: §7.5 lógica de veterinario (guard `require_veterinario`, endpoint muerto activado, `citas_hoy` corregido, PDFs sin localhost); §7.6 tokens con caducidad real para reset y confirmación de registro + reenvío + URLs configurables; §3 `scripts/restaurar.sh` verificado con manifiesto `alembic_head`, revisión Alembic 0002 con metadata real; SonarCloud 0 issues abiertos y Quality Gate OK. 61 tests en verde y frontend compila** |
| **1.4** | **2026-11-21** | **§5.3 blueprint de Render corregido y validado para despliegue único: `web/static` + pnpm + `fromService.host` normalizado + rewrite SPA + secretos autogenerados; guía `docs/despliegue-render.md`. 78 tests en verde** |
| **1.5** | **2026-11-24** | **CI: `concurrency` por rama con `cancel-in-progress` para evitar que SonarCloud procese reportes de commits obsoletos ("The last analysis has failed"). Análisis más reciente vuelto a lanzar y verificado en SUCCESS** |
| **1.6** | **2026-11-24** | **Despliegue real en Render + Aiven: smoke test 6/6 en `https://vet-manager-api.onrender.com` (health DB healthy, versión 1.0.0). Correcciones de cloud: `COPY . .` sin comentario inline, `DB_NAME=defaultdb` en el blueprint, creación automática del esquema base en BD vacía y `/health` con 503 si falla la BD. Cobertura nueva 90.3 %, Quality Gate OK, 0 issues** |

### 10.2 Pruebas de aceptación

| Campo | Valor |
|---|---|
| Casos ejecutados / total | **51 automatizados en verde** (F-01…F-05 + seguridad + unitarias) / manuales de negocio C-01…P-07 y S-01…S-03 en la guía de UAT, pendientes con el cliente |
| Criterios de salida acordados | Smoke test 6/6, restauración conciliada, sin secretos en el repo, CI en verde + Quality Gate OK |
| Defectos (bloqueantes / mayores / menores / cosméticos) | 0 / 0 / 0 / 0 — pendiente de ejecutar la UAT con el cliente |
| Decisión | **Pendiente** del cliente |

Detalle de casos: automatizados en `backend/tests/` (51, incluidos F-01/F-02 de login); manuales y de seguridad en [`docs/uat.md`](uat.md) (guía creada 2026-11-19, con plantilla de defectos y decisión final firmable).

### 10.3 Simulacro cruzado

| Campo | Valor |
|---|---|
| Equipo que instaló | Pendiente (otro equipo, gate de la semana 9) |
| Duración / tiempo máximo | Propuesta: ≤ 2 h (ventana de la §5) |
| Huellas | 20/20 tablas con `COUNT(*)` idéntico (método §3.5) |
| Prueba de humo | `scripts/smoke-test.sh` → 6/6 |
| Resultado | **Pendiente** |
| Desviaciones y corrección aplicada | — |

Registro firmado por el observador: plantilla lista en [`docs/registro-simulacro.md`](registro-simulacro.md) (8 pasos de la §5.2, tabla de huellas 20/20 y firmas) — pendiente de ejecutar con el otro equipo.

### 10.4 Acta de entrega

Enlace: [`docs/acta-entrega.md`](acta-entrega.md) — **borrador sin firmas** (creado 2026-11-19), sin secretos ni credenciales reales; incluye alcance entregado, niveles de servicio de la §9.2, transferencia de accesos por canal aparte, checklist de aceptación y tabla de firmas. Pendiente de completar con el cliente en la sesión de la semana 9.

### 10.5 Socialización y lecciones aprendidas

| Qué funcionó | Qué no funcionó | Qué haríamos distinto |
|---|---|---|
| Evidencia real respaldo/restauración (§3.5) y prueba negativa de puertos (§4.5) | Los `.env` con secretos estaban en el repo público hasta el 2026-11-18 | Reglas de `.gitignore` + secret scanning desde el día 1 |
| Ciclo instalar→actualizar→rollback probado antes de tocar producción | CI corriendo sin pruebas (cobertura 0 % y Quality Gate rojo) | El job de pruebas debe preceder al scan desde el inicio |
| Pruebas de humo reutilizables en cada paso | — | — |

Retroalimentación de la socialización: pendiente de la sesión.

---

*Este plan garantiza una transición segura y escalable para Vet Manager.*
