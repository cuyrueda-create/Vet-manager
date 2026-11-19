# 📋 Registro del simulacro cruzado — Semana 9

> **Template para el observador.** Rellenar durante el simulacro de instalación
> cruzada (§10.3 del plan): **otro equipo** instala Vet Manager siguiendo solo
> la documentación (§5.2 + §6), sin ayuda del equipo que lo construyó.
> Este registro queda firmado por el observador.

## Datos del simulacro

| Campo | Valor |
|---|---|
| Fecha | |
| Equipo que instaló | |
| Equipo que observó | |
| Entorno (máquina, SO) | |
| Versión instalada | v____ (etiqueta de `git` + `APP_VERSION`) |
| Tiempo total / máximo (≤ 2 h) | |
| Incidentes durante la instalación | |

## Checklist de resultados

| # | Paso (§5.2 del plan) | ¿OK? | Observación / tiempo |
|---:|---|:--:|---|
| 1 | Pre-requisitos detectados (Docker, puertos libres) | | |
| 2 | Configuración desde `.env.example` (sin secretos incluidos) | | |
| 3 | `docker compose ... up -d --wait` → stack healthy | | |
| 4 | Prueba de humo `bash scripts/smoke-test.sh https://<dominio>` → **6/6** | | |
| 5 | Respaldo previo (`scripts/respaldar.sh`, `gzip -t` + SHA-256) | | |
| 6 | Actualización de versión (1.0.0 → 1.1.0) con humo | | |
| 7 | Rollback (1.1.0 → 1.0.0) con humo | | |
| 8 | Restauración y conciliación de huellas | | |

## Huellas (obligatorio)

| Métrica | Origen | Destino | ¿Idéntico? |
|---|---|---|:--:|
| Número de tablas | | | |
| `COUNT(*)` total (filas) | | | |
| Diferencias por tabla (deben ser 0) | | | |

Esperado: **20/20 tablas con conteos idénticos** (método §3.5).

## Resultado

| Campo | Valor |
|---|---|
| Smoke test final | 6/6 · código de salida 0 |
| **Resultado** | ☐ Exitoso · ☐ Exitoso con observaciones · ☐ Fallido |
| Desviaciones encontradas | |
| Corrección aplicada (y quién la aplicó) | |
| Documentación que faltó o era confusa | |

## Firmas

| Rol | Nombre | Firma | Fecha |
|---|---|---|---|
| Observador (otro equipo) | | | |
| Responsable técnico (equipo receptor) | | | |
