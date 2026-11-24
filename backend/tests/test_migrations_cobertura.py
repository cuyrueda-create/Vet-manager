"""Cobertura del código de Alembic (backend/migrations), que el reporte de
pytest no incluía y que por eso aparecía al 0% en SonarCloud (§3.4)."""
import importlib.util
import sys
import types
from pathlib import Path
from unittest.mock import MagicMock

from app.core.config import DB_OWNER_CONFIG

BACKEND = Path(__file__).resolve().parents[1]


def _carga(nombre, ruta):
    spec = importlib.util.spec_from_file_location(nombre, ruta)
    modulo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(modulo)
    return modulo


def test_env_database_url_usa_el_rol_owner(monkeypatch):
    falso = types.ModuleType("alembic")
    falso.context = MagicMock()
    monkeypatch.setitem(sys.modules, "alembic", falso)

    env = _carga("mig_env", BACKEND / "migrations" / "env.py")

    url = env.database_url()
    assert url.username == DB_OWNER_CONFIG["user"]
    assert url.database == DB_OWNER_CONFIG["database"]


def test_env_ofline_y_online_configuran_metadata(monkeypatch):
    falso = types.ModuleType("alembic")
    falso.context = MagicMock()
    monkeypatch.setitem(sys.modules, "alembic", falso)

    env = _carga("mig_env_offline", BACKEND / "migrations" / "env.py")
    env.create_engine = MagicMock()

    env.run_migrations_offline()
    env.run_migrations_online()

    falso.context.configure.assert_called()
    env.create_engine.assert_called_once()


def test_revision_0002_upgrade_y_downgrade_son_idempotentes(monkeypatch):
    op = MagicMock()
    falso = types.ModuleType("alembic")
    falso.op = op
    falso.context = MagicMock()
    monkeypatch.setitem(sys.modules, "alembic", falso)

    rev = _carga(
        "mig_0002",
        BACKEND / "migrations" / "versions" / "0002_confirm_token_expiry.py",
    )

    # Sin columna: upgrade la añade.
    rev.sa.inspect = lambda bind: types.SimpleNamespace(
        get_columns=lambda tabla: [{"name": "id_usuario"}]
    )
    rev.upgrade()
    op.add_column.assert_called_once()

    # Con columna: upgrade no hace nada y downgrade la quita.
    op.reset_mock()
    rev.sa.inspect = lambda bind: types.SimpleNamespace(
        get_columns=lambda tabla: [{"name": "confirm_token_expires"}]
    )
    rev.upgrade()
    op.add_column.assert_not_called()
    rev.downgrade()
    op.drop_column.assert_called_once()
