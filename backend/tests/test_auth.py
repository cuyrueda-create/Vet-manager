"""Pruebas de autenticación y autorización (sin base de datos real)."""

import asyncio
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.core import auth
from app.core.security import create_access_token


def _run(coro):
    return asyncio.run(coro)


def _credentials(token: str) -> SimpleNamespace:
    return SimpleNamespace(credentials=token)


# ---------------------------------------------------------------- get_current_user


def test_get_current_user_rechaza_token_basura():
    with pytest.raises(HTTPException) as exc:
        _run(auth.get_current_user(credentials=_credentials("esto-no-es-token")))
    assert exc.value.status_code == 401


def test_get_current_user_rechaza_token_sin_id():
    token = create_access_token({"sub": "ana@test.com"})  # sin "id"
    with pytest.raises(HTTPException) as exc:
        _run(auth.get_current_user(credentials=_credentials(token)))
    assert exc.value.status_code == 401


def test_get_current_user_falla_sin_conexion_bd(monkeypatch):
    monkeypatch.setattr(auth, "get_db_connection", lambda: None)
    token = create_access_token({"id": 1})
    with pytest.raises(HTTPException) as exc:
        _run(auth.get_current_user(credentials=_credentials(token)))
    assert exc.value.status_code == 500


def test_get_current_user_devuelve_usuario_activo(monkeypatch):
    conexion = MagicMock()
    cursor = MagicMock()
    conexion.cursor.return_value = cursor
    cursor.fetchone.return_value = {
        "id_usuario": 1,
        "nombre": "Ana",
        "rol": "usuario",
        "is_active": True,
    }
    monkeypatch.setattr(auth, "get_db_connection", lambda: conexion)

    token = create_access_token({"id": 1})
    usuario = _run(auth.get_current_user(credentials=_credentials(token)))

    assert usuario["id_usuario"] == 1
    cursor.execute.assert_called_once()  # consultó la base
    cursor.close.assert_called_once()  # cerró el cursor
    conexion.close.assert_called_once()  # cerró la conexión


def test_get_current_user_rechaza_usuario_inactivo(monkeypatch):
    conexion = MagicMock()
    cursor = MagicMock()
    conexion.cursor.return_value = cursor
    cursor.fetchone.return_value = {"id_usuario": 1, "is_active": False}
    monkeypatch.setattr(auth, "get_db_connection", lambda: conexion)

    token = create_access_token({"id": 1})
    with pytest.raises(HTTPException) as exc:
        _run(auth.get_current_user(credentials=_credentials(token)))
    assert exc.value.status_code == 401


def test_get_current_user_rechaza_usuario_inexistente(monkeypatch):
    conexion = MagicMock()
    cursor = MagicMock()
    conexion.cursor.return_value = cursor
    cursor.fetchone.return_value = None
    monkeypatch.setattr(auth, "get_db_connection", lambda: conexion)

    token = create_access_token({"id": 999})
    with pytest.raises(HTTPException) as exc:
        _run(auth.get_current_user(credentials=_credentials(token)))
    assert exc.value.status_code == 401


# ------------------------------------------------------------- matrices de roles


def test_require_admin_deniega_a_rol_no_admin():
    with pytest.raises(HTTPException) as exc:
        _run(auth.require_admin(current_user={"rol": "usuario"}))
    assert exc.value.status_code == 403


def test_require_admin_acepta_al_administrador():
    usuario = {"rol": "administrador", "id_usuario": 1}
    assert _run(auth.require_admin(current_user=usuario)) == usuario


def test_require_recepcionista_deniega_a_veterinario():
    with pytest.raises(HTTPException) as exc:
        _run(auth.require_recepcionista(current_user={"rol": "veterinario"}))
    assert exc.value.status_code == 403


def test_require_recepcionista_acepta_al_recepcionista():
    usuario = {"rol": "recepcionista"}
    assert _run(auth.require_recepcionista(current_user=usuario)) == usuario


def test_require_vet_o_recepcionista_acepta_tres_roles():
    for rol in ("veterinario", "recepcionista", "administrador"):
        usuario = {"rol": rol}
        assert _run(auth.require_vet_or_recepcionista(current_user=usuario)) == usuario


def test_require_vet_o_recepcionista_deniega_al_cliente():
    with pytest.raises(HTTPException) as exc:
        _run(auth.require_vet_or_recepcionista(current_user={"rol": "usuario"}))
    assert exc.value.status_code == 403


def test_require_staff_acepta_al_personal():
    for rol in ("administrador", "veterinario", "recepcionista"):
        usuario = {"rol": rol}
        assert _run(auth.require_staff(current_user=usuario)) == usuario


def test_require_staff_deniega_al_cliente():
    with pytest.raises(HTTPException) as exc:
        _run(auth.require_staff(current_user={"rol": "usuario"}))
    assert exc.value.status_code == 403
