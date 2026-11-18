# Configuración común de las pruebas del backend.
# Las variables de entorno se definen ANTES de importar la aplicación porque
# app/core/config.py exige SECRET_KEY (falla cerrada si falta).
import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

BACKEND_DIR = Path(__file__).resolve().parents[1]
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

os.environ.setdefault("SECRET_KEY", "clave_de_prueba_no_para_produccion")
os.environ.setdefault("ADMIN_CREATE_KEY", "TEST-ADMIN-KEY")
os.environ.setdefault("APP_VERSION", "test")
os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("DB_HOST", "localhost")
os.environ.setdefault("DB_PORT", "3307")
os.environ.setdefault("DB_NAME", "vet_manager_test")

import pytest
from fastapi.testclient import TestClient


@pytest.fixture()
def conexion_falsa():
    """Falsa conexión a MySQL: devuelve un objeto con close()."""
    conn = MagicMock()
    return conn


@pytest.fixture()
def client(monkeypatch):
    """Cliente de prueba SIN arrancar el lifespan (no hay MySQL en CI).

    get_db_connection se reemplaza por una función que devuelve None, es decir,
    el escenario de "base de datos no disponible".
    """
    import app.main as main_module

    monkeypatch.setattr(main_module, "get_db_connection", lambda: None)
    return TestClient(main_module.app)


@pytest.fixture()
def client_con_bd(monkeypatch, conexion_falsa):
    """Cliente de prueba con una conexión a base de datos simulada."""
    import app.main as main_module

    monkeypatch.setattr(main_module, "get_db_connection", lambda: conexion_falsa)
    return TestClient(main_module.app)
