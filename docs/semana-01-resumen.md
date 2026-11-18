# Semana 01 — Resumen de trabajo

Proyecto: Vet Manager

Fecha de preparación: 2026-11-04

Actualización: 2026-11-18 (cierre de pendientes)

## Hecho

- Completé la sección 1 del `plan-implantacion.md` (ficha técnica): descripción e inventario de software con versiones y licencias, sistema operativo de servidor (Ubuntu 24.04 LTS con fin de soporte y requisitos oficiales enlazados), medición de consumo, matriz de requisitos con mínimos, recomendados y margen calculado, y plataforma física con nivel RAID justificado.
- Adapté `scripts/verificar-requisitos.sh` al proyecto real: valida CPU, RAM, disco, Docker, puertos esperados, archivos requeridos del proyecto y `docker compose config`. Devuelve código de salida `0` si se confirman los requisitos y `1` si no.
- **Cierre del 2026-11-18:** ejecuté el script en WSL2 Ubuntu 26.04 con Docker operativo. Resultado: `CUMPLIMIENTO: confirmado` (16 vCPU, 6,6 GiB RAM, Docker 29.5.3, Compose v5.1.4, 7 archivos requeridos OK, servicios `mysql backend frontend caddy`). Código de salida `0`. Salida completa en `plan-implantacion.md` §1.7.
- **Pruebas de fallo (4 provocadas, todas detectadas, código de salida `1`):** Docker no disponible (PATH restringido), archivo requerido faltante (`Caddyfile`), RAM por debajo del umbral (`MIN_MEM_GB=9999`) y Compose inválido (falta `.env`).

## Verificación y pendiente

- La ejecución anterior del 2026-10-06 había quedado en `no confirmado` porque el daemon de Docker no estaba activo; queda superada por la del 2026-11-18.
- El entorno de producción definitivo (Ubuntu Server 24.04 LTS) debe repetir la verificación antes de aceptarse, tal como indica el plan §1.7.
- El script no instala ni modifica nada: solo reporta. Node.js no está instalado en el host porque el proyecto lo ejecuta dentro de Docker.

## Evidencia local disponible

- `plan-implantacion.md` §1.7: salida completa del script con `CUMPLIMIENTO: confirmado` y tabla de 4 pruebas de fallo.
- `scripts/verificar-requisitos.sh` en el repositorio, con códigos de salida y chequeo propio del proyecto.
