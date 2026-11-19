# Runbook — Respaldo fallido o latido ausente

**Alerta que lo dispara:** no aparece una ejecución nueva de `respaldar.sh`
en las últimas 24 h en `/var/log/vet-manager-respaldos.log`, o la alerta del
monitor "Respaldo diario" (push/latido, intervalo 25 h) marca fallo (§8.5).
**Prioridad:** P2 (24 h) si aún hay respaldos recientes; **P1** si el último
respaldo válido tiene más de 48 h (RPO 24 h, §3 del plan).
**Riesgo:** nulo sobre datos (el script solo lee); no ejecutar `DROP`/`DELETE`
bajo ninguna circunstancia.

## 1. Confirmar el estado real (≤ 10 min)

```bash
# Últimas ejecuciones registradas (fecha, archivo, SHA-256)
tail -20 /var/log/vet-manager-respaldos.log

# Archivos existentes y su antigüedad
ls -lh backups/mysql/

# Verificar el más reciente: integridad y huella
gzip -t backups/mysql/<archivo>.sql.gz && echo INTEGRIDAD_OK
sha256sum backups/mysql/<archivo>.sql.gz   # debe coincidir con el log
```

| Situación | Diagnóstico | Paso |
|---|---|:--:|
| Hay log reciente y `gzip -t` OK | Falso positivo (alerta mal configurada) | 5 |
| No hay log de hoy | El job no corrió | 2 |
| El archivo existe pero `gzip -t` falla | Respaldo corrupto | 3 |
| El SHA no coincide con el log | Archivo alterado/truncado | 3 |

## 2. Si el job no corrió

```bash
crontab -l                      # la línea debe existir (§3.2 del plan):
# 0 3 * * * bash /opt/vet-manager/scripts/respaldar.sh >> /var/log/vet-manager-respaldos.log 2>&1

systemctl status cron           # o cron/nano depending on distro
bash /opt/vet-manager/scripts/respaldar.sh   # ejecución manual de prueba
```

Causas típicas: `cron` detenido tras parches de kernel (reinicio mensual §9.1),
ruta cambiada tras mover la instalación, permisos (el directorio `backups/`
es `700`), o disco lleno.

## 3. Si el respaldo está corrupto o falta

1. Re-ejecutar: `bash /opt/vet-manager/scripts/respaldar.sh` y confirmar
   `gzip -t` + SHA-256 nuevo en el log.
2. Conservar el archivo corrupto para diagnóstico (renombrarlo), no borrarlo.
3. Si la re-ejecución falla por la base → revisar MySQL (runbook
   `salud-en-rojo.md`, paso 2) y, si hay pérdida, **restaurar §3.3** desde el
   último respaldo íntegro.
4. Verificar que existen al menos 7 respaldos íntegros (retención
   `RETENTION_DAYS=7`).

## 4. Conciliación tras cualquier restauración

```sql
-- En origen y destino: 20 tablas, conteos idénticos (método §3.5)
SELECT table_name, table_rows FROM information_schema.tables
 WHERE table_schema = 'vet_manager' ORDER BY table_name;
```

20/20 tablas con `COUNT(*)` idéntico antes de reabrir escrituras.

## 5. Verificación de salida y registro

- Prueba de humo: `bash scripts/smoke-test.sh https://<dominio>` → 6/6.
- Confirmar que la próxima ejecución programada quedó activa (03:00).

| Campo | Valor |
|---|---|
| Fecha/hora de la alerta | |
| Último respaldo válido encontrado | |
| Causa | |
| Acción aplicada | |
| ¿Hizo falta restaurar? (§3.3) | |
| Conciliación 20/20 tablas | |
| Registrado por (rol) | |
