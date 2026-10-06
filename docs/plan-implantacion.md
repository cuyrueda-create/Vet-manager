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
| Plataforma de ejecución | Bare metal o VM Linux con Docker | El proyecto no depende de una hipervisor específica; Docker simplifica el despliegue |

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

Resultado: **No confirmado**. El servidor disponible tiene 28 vCPU y 14,5 GiB de RAM, pero no dispone de Docker operativo ni los runtimes de Node.py y Python en el distro WSL. La verificación debe ejecutarse de nuevo en Ubuntu Server 24.04 LTS con Docker activo antes de aceptar el entorno de producción.

---

## 2. Plan de migración de datos — Semanas 2 y 5 (CE-3)

-La migración debe conservar el esquema y los datos de la base de datos actual, con copia de seguridad previa, checksum de tablas y validación de integridad después de la transformación.

## 3. Plan de respaldo — Semanas 2 y 6 (CE-4)

-Se ejecutarán copias completas de la base de datos y de los volúmenes de Docker, con retención de 7 días diarios y 4 semanas semanales. La restauración se comprobará en un entorno de prueba.

## 4. Hosting y dominio — Semana 3 (CE-1)

-El proyecto se ejecutará en un servidor Linux o una VM con Docker Compose, HTTPS y proxy inverso. El dominio y los registros DNS se configuran en la infraestructura del cliente; no se incluyen valores reales.

## 5. Plan de instalación y despliegue — Semanas 2 y 4 (CE-1, CE-5)

-Instalar Docker Engine y Compose 2, construir las imágenes, aplicar el esquema de MySQL, iniciar los servicios y validar healthchecks, API, frontend y móvil.

## 6. Configuración y verificación — Semana 5 (CE-1)

-Los valores de entorno se aplicarán desde un archivo de configuración seguro; se verificará la conexión a la base de datos, autenticación, sesiones, notificaciones y la carga de la interfaz.

## 7. Seguridad, usuarios y permisos — Semana 6 (CE-1)

-Cada rol tendrá permisos de acceso diferenciados, secretos almacenados en variables de entorno, conexiones cifradas,actualizaciones de dependencias y revisiones de permisos de la base de datos.

## 8. Pipeline de despliegue y monitoreo — Semana 7 (CE-1, CE-5)

-Se ejecutará una compilación de frontend, pruebas, validación de Docker Compose, healthchecks, métricas de CPU/RAM, logs y rollback por versión.

## 9. Mantenimiento, soporte y capacitación — Semana 8 (CE-5)

-La operación incluiráactualizaciones de imágenes, copias de seguridad, diagnóstico de errores, capacitación de usuarios y procedimiento de soporte por rol.

## 10. Aceptación y entrega — Semana 9 (CE-1 a CE-5)

-La entrega se considerará aceptada tras validar requisitos, seguridad, permisos, disponibilidad, restored backup y pruebas de uso de todos los roles.
