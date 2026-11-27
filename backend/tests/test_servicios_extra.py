"""Ramas de error de la gestión de servicios (cobertura nueva)."""
import asyncio
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.api.v1 import admin as m


def test_get_servicios(monkeypatch):
    c = MagicMock()
    c.cursor.return_value.fetchall.return_value = [{"id_servicio": 1, "nombre": "Consulta"}]
    monkeypatch.setattr(m, "get_db_connection", lambda: c)
    r = asyncio.run(m.get_servicios({"id_usuario": 1}))
    assert r[0]["nombre"] == "Consulta"


def test_get_servicios_sin_bd(monkeypatch):
    monkeypatch.setattr(m, "get_db_connection", lambda: None)
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.get_servicios({"id_usuario": 1}))
    assert e.value.status_code == 500


def test_create_servicio_sin_bd(monkeypatch):
    monkeypatch.setattr(m, "get_db_connection", lambda: None)
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.create_servicio(m.ServicioCreate(nombre="X", precio=1), {"id_usuario": 1}))
    assert e.value.status_code == 500


def test_create_servicio_error_bd(monkeypatch):
    c = MagicMock()
    c.cursor.return_value.execute.side_effect = RuntimeError("bd rota")
    monkeypatch.setattr(m, "get_db_connection", lambda: c)
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.create_servicio(m.ServicioCreate(nombre="X", precio=1), {"id_usuario": 1}))
    assert e.value.status_code == 500
    c.rollback.assert_called_once()


def test_update_servicio_sin_cambios(monkeypatch):
    monkeypatch.setattr(m, "get_db_connection", lambda: MagicMock())
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.update_servicio(1, m.ServicioUpdate(), {"id_usuario": 1}))
    assert e.value.status_code == 400


def test_update_servicio_sin_bd(monkeypatch):
    monkeypatch.setattr(m, "get_db_connection", lambda: None)
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.update_servicio(1, m.ServicioUpdate(precio=2), {"id_usuario": 1}))
    assert e.value.status_code == 500


def test_update_servicio_no_encontrado(monkeypatch):
    c = MagicMock()
    c.cursor.return_value.fetchone.return_value = None
    monkeypatch.setattr(m, "get_db_connection", lambda: c)
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.update_servicio(99, m.ServicioUpdate(precio=2), {"id_usuario": 1}))
    assert e.value.status_code == 404


def test_update_servicio_error_bd(monkeypatch):
    c = MagicMock()
    cur = c.cursor.return_value
    cur.fetchone.return_value = (1,)
    cur.execute.side_effect = [None, RuntimeError("bd rota")]
    monkeypatch.setattr(m, "get_db_connection", lambda: c)
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.update_servicio(1, m.ServicioUpdate(precio=2), {"id_usuario": 1}))
    assert e.value.status_code == 500


def test_desactivar_servicio(monkeypatch):
    c = MagicMock()
    c.cursor.return_value.rowcount = 1
    monkeypatch.setattr(m, "get_db_connection", lambda: c)
    r = asyncio.run(m.desactivar_servicio(1, {"id_usuario": 1}))
    assert "desactivado" in r["message"]


def test_desactivar_servicio_no_encontrado(monkeypatch):
    c = MagicMock()
    c.cursor.return_value.rowcount = 0
    monkeypatch.setattr(m, "get_db_connection", lambda: c)
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.desactivar_servicio(99, {"id_usuario": 1}))
    assert e.value.status_code == 404


def test_desactivar_servicio_sin_bd(monkeypatch):
    monkeypatch.setattr(m, "get_db_connection", lambda: None)
    with pytest.raises(HTTPException) as e:
        asyncio.run(m.desactivar_servicio(1, {"id_usuario": 1}))
    assert e.value.status_code == 500
