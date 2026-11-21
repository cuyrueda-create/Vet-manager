from alembic import context
from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.pool import NullPool

from app.core.config import DB_OWNER_CONFIG
from app.models.models import Base

# Con metadata real, `alembic revision --autogenerate` puede detectar cambios
# del esquema en vez de generar revisiones vacías.
target_metadata = Base.metadata

config = context.config


def database_url():
    return URL.create(
        "mysql+mysqlconnector",
        username=DB_OWNER_CONFIG["user"],
        password=DB_OWNER_CONFIG["password"],
        host=DB_OWNER_CONFIG["host"],
        port=DB_OWNER_CONFIG["port"],
        database=DB_OWNER_CONFIG["database"],
        query={"charset": DB_OWNER_CONFIG["charset"]},
    )


def run_migrations_offline():
    context.configure(
        url=database_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online():
    engine = create_engine(database_url(), poolclass=NullPool)
    with engine.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()