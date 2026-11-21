"""Caducidad propia para el token de confirmación de registro.

La revisión 0001 solo marcó el esquema heredado (creado por las migraciones
idempotentes del arranque en main.py). Esta es la primera revisión con DDL real:
separar la caducidad de la confirmación de la del reset de contraseña, que
antes compartían la columna `reset_token_expires`.

Es idempotente: el arranque de la API añade la columna antes de ejecutar
Alembic, así que la revisión no debe fallar si ya existe.
"""
from alembic import op
import sqlalchemy as sa


revision = "0002_confirm_token_expiry"
down_revision = "0001_legacy_schema_baseline"
branch_labels = None
depends_on = None

COLUMN = "confirm_token_expires"


def _tiene_columna():
    columnas = [c["name"] for c in sa.inspect(op.get_bind()).get_columns("usuarios")]
    return COLUMN in columnas


def upgrade():
    if not _tiene_columna():
        op.add_column("usuarios", sa.Column(COLUMN, sa.DateTime(), nullable=True))


def downgrade():
    if _tiene_columna():
        op.drop_column("usuarios", COLUMN)
