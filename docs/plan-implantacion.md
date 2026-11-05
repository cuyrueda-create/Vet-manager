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

Script: `scripts/verificar-requisitos.sh` del repositorio del proyecto.

Servidor donde se ejecutó:

`Docker Desktop` WSL2 (`docker-desktop`), con Linux 6.18.33.2-microsoft-standard-WSL2, x86_64.

```text
=== Verificación de requisitos de Vet Manager ===
Fecha: 2026-10-06T21:10:38Z
Servidor: Linux BOGDFPCGMP1140 6.18.33.2-microsoft-standard-WSL2 #1 SMP PREEMPT_DYNAMIC Thu Jun 18 21:54:43 UTC 2026 x86_64 Linux
Sistema operativo: Docker Desktop no disponible
[CPU]
vCPU: 28
Architecture: x86_64
CPU(s): 28
[RAM]
total 14.5G, available 13.9G
[Disco]
/dev/sdd ext4 136.0M, 53.8M available
Docker no disponible o daemon detenido
node: no instalado
python3: no instalado
[Resultado]
CUMPLIMIENTO: no confirmado; recursos o Docker no están disponibles en el servidor ejecutado.
```

Resultado: **No confirmado**. El servidor disponible tiene 28 vCPU y 14,5 GiB de RAM, pero no dispone de Docker operativo ni los runtimes de Node.js y Python en el distro WSL. La verificación debe ejecutarse de nuevo en Ubuntu Server 24.04 LTS con Docker activo antes de aceptar el entorno de producción.

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

| Tabla | Filas en producción | Filas restauradas | Resultado |
|---|---:|---:|---|
| Todas las tablas | Pendiente de medir | Pendiente de medir | No ejecutado: daemon Docker Desktop no disponible el 2026-11-04 |

Tiempo de restauración: pendiente. No se declara éxito hasta adjuntar conteos exactos antes/después y duración medida.

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

**Evidencia local (2026-11-04):** Caddy validó el Caddyfile, emitió certificados internos para `vet-manager.test` y `localhost`, y los probes con `curl --resolve` devolvieron `HTTP 200` para `/` y `/health`, con verificación TLS `0` usando la CA local de Caddy. La ruta `/` sirvió el build React. Para `/health` se usó temporalmente un upstream HTTP de prueba porque MySQL no terminó de descargarse y FastAPI no pudo completar su arranque; por tanto, el enrutamiento HTTPS de Caddy está comprobado, pero la integración completa Caddy → FastAPI → MySQL queda pendiente de repetir con el stack completo.

Comandos Windows usados para confiar la CA local y probar los hosts reservados:

```powershell
docker cp vet-manager-caddy-proxy-test:/data/caddy/pki/authorities/local/root.crt "$env:TEMP\vet-manager-caddy-root.crt"
curl.exe --noproxy "*" --ssl-no-revoke --cacert "$env:TEMP\vet-manager-caddy-root.crt" --resolve vet-manager.test:8443:127.0.0.1 -i https://vet-manager.test:8443/
curl.exe --noproxy "*" --ssl-no-revoke --cacert "$env:TEMP\vet-manager-caddy-root.crt" --resolve vet-manager.test:8443:127.0.0.1 -i https://vet-manager.test:8443/health
```

La comprobación negativa de que MySQL no es accesible desde una interfaz pública queda pendiente de ejecutar cuando se levante el stack completo.

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

Versión 0 basada en el repositorio: API FastAPI, web React/Vite, aplicación Expo/React Native y MySQL 8. La instalación de producción requiere configurar HTTPS/proxy, secretos y almacenamiento externo de respaldos; el Compose actual publica puertos de desarrollo y contiene valores predeterminados que no deben usarse en producción.

| # | Sección | Contenido |
|---:|---|---|
| 1 | Alcance | Instalar API, web y MySQL; la app móvil se compila/publica por separado y consume la API. |
| 2 | Ambientes | Desarrollo/prueba con Docker Compose; producción en Linux compatible con Docker Engine y Compose v2 después de definir proxy HTTPS y almacenamiento externo. |
| 3 | Roles | Responsable técnico prepara servidor; administrador de base de datos respalda/restaura; responsable del negocio aprueba ventana, rechazos y aceptación. |
| 4 | Prerrequisitos | Ubuntu Server 24.04 LTS recomendado, 2 vCPU/4 GiB RAM/40 GiB SSD como referencia de sección 1, Docker Engine y plugin Compose v2, acceso al repositorio, puertos libres 5000/5173/3307 en local y espacio para respaldos. |
| 5 | Preparación | Confirmar recursos; revisar Compose/esquema; configurar secretos fuera del repositorio; disponer de dump restaurable y copia externa; acordar mantenimiento y punto de retorno. |
| 6 | Procedimiento | Seguir pasos verificables de la tabla inferior y guardar salidas/horas sin secretos ni datos personales. |
| 7 | Migración | Seguir sección 2; no migrar ni habilitar escrituras sin respaldo restaurable, conciliación y aprobación. |
| 8 | Verificación | Healthcheck MySQL, logs API, `/docs`, frontend, autenticación de prueba, flujos de clientes/mascotas/citas y restauración aislada. |
| 9 | Rollback | Detener escritores, preservar origen y destino fallido, reconectar al origen o restaurar respaldo en una base nueva; abrir solo después de verificar. |
| 10 | Cronograma | Ventana inicial estimada de 2 horas, pendiente de ensayo medido; responsable técnico comunica inicio, decisión de corte y cierre. |

### Procedimiento verificable

| # | Acción | Comando / método | Resultado esperado |
|---:|---|---|---|
| 1 | Confirmar requisitos | `bash scripts/verificar-requisitos.sh` | Docker Compose operativo, recursos y puertos disponibles; resolver incumplimientos antes de continuar. |
| 2 | Validar Compose y secretos | `docker compose config --quiet` | Configuración válida. Antes de producción, rotar y externalizar las claves/contraseñas predeterminadas de `docker-compose.yml`; no pegarlas en el entregable. |
| 3 | Crear y verificar respaldo | `bash scripts/respaldar.sh` | Dump `.sql.gz` no vacío, `gzip -t` exitoso y SHA-256 informado; el script no cifra el archivo local. |
| 4 | Construir e iniciar | `docker compose up -d --build` | Servicios `mysql`, `backend` y `frontend` iniciados; MySQL llega a estado healthy. |
| 5 | Revisar migraciones de API | `docker compose logs --no-color backend` | Inicio sin errores de conexión/migración; revisar advertencias antes de seguir. |
| 6 | Verificar API y web | `curl -fsS http://localhost:5000/docs` y `curl -fsS http://localhost:5173/` | Respuestas HTTP exitosas en local; producción usa URL HTTPS aprobadas. |
| 7 | Probar flujos | Pruebas de login y operaciones con cuentas/datos de prueba | Login, clientes, mascotas, citas y datos por rol funcionan; sin datos reales en capturas. |
| 8 | Ensayar restauración | Procedimiento de sección 3.4 en `vet_manager_restore` | Conteos exactos iguales y objetos/relaciones verificados; duración registrada. |
| 9 | Aceptar o revertir | Acta de validación del responsable del negocio | Habilitar escrituras solo tras conciliación y aprobación; si falla, ejecutar sección 2.6. |

Los comandos HTTP son para el Compose local actual. No exponer públicamente 5000, 5173 ni 3307 como configuración final: limitar MySQL a red privada y publicar web/API detrás del proxy HTTPS.

### Cronograma de la ventana

| Fase | Duración inicial | Acumulado | Condición |
|---|---:|---:|---|
| Requisitos y respaldo final | 20 min | 20 min | No iniciar si falla el respaldo |
| Detener escrituras y exportar origen | 20 min | 40 min | Mantenimiento comunicado |
| Importación / despliegue | 40 min | 80 min | Medir en ensayo; detener si amenaza el límite aprobado |
| Conteos y pruebas funcionales | 30 min | 110 min | Todos los controles deben aprobarse |
| Decisión y reapertura | 10 min | 120 min | Punto de no retorno: autorización de escrituras en destino |

Duraciones estimadas, no medidas. Si el ensayo excede la ventana acordada, recalcularla antes del corte real.

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
