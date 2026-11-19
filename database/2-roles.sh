#!/bin/sh
# Inicialización de roles (§7.3 del plan de implantación).
# Se ejecuta una sola vez, cuando MySQL crea el volumen de datos por primera vez.
# El entrypoint oficial ya creó MYSQL_USER (vet_app) con MYSQL_PASSWORD; aquí se
# añade el rol con privilegios de DDL que usan las migraciones del arranque.
set -eu

OWNER="${MYSQL_OWNER_USER:-vet_owner}"
DBNAME="${MYSQL_DATABASE:-vet_manager}"
OPASS="${MYSQL_OWNER_PASSWORD:-$MYSQL_PASSWORD}"

mysql -uroot -p"$MYSQL_ROOT_PASSWORD" <<SQL
CREATE USER IF NOT EXISTS '${OWNER}'@'%' IDENTIFIED BY '${OPASS}';
GRANT ALL PRIVILEGES ON \`${DBNAME}\`.* TO '${OWNER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "Rol de DDL '${OWNER}' creado para la base '${DBNAME}'"
