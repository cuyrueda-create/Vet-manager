"""Pruebas del módulo de configuración de arranque (app.core.config)."""

import importlib

import dotenv
import pytest


def test_arranque_falla_si_falta_secret_key(monkeypatch):
    """Sin SECRET_KEY la configuración falla cerrado, no arranca con clave por defecto."""
    import app.core.config as config_module

    monkeypatch.delenv("SECRET_KEY", raising=False)
    # load_dotenv() no debe reponer la clave desde backend/.env en la prueba
    monkeypatch.setattr(dotenv, "load_dotenv", lambda *args, **kwargs: False)

    with pytest.raises(RuntimeError, match="Falta la variable de entorno SECRET_KEY"):
        importlib.reload(config_module)

    # Restaura el módulo para el resto de la suite
    monkeypatch.setenv("SECRET_KEY", "clave_de_prueba_no_para_produccion")
    importlib.reload(config_module)
