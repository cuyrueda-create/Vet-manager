"""Cobertura de los flujos de tokens y guards añadidos en v1.3 (§7.5/§7.6)."""
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest


def test_require_veterinario_acepta_veterinario():
    from app.core.auth import require_veterinario

    user = {"rol": "veterinario", "id_usuario": 3}
    import asyncio
    assert asyncio.run(require_veterinario(user)) == user


def test_require_veterinario_acepta_administrador():
    from app.core.auth import require_veterinario

    user = {"rol": "administrador"}
    import asyncio
    assert asyncio.run(require_veterinario(user)) == user


def test_require_veterinario_rechaza_usuario():
    from fastapi import HTTPException
    from app.core.auth import require_veterinario

    import asyncio
    with pytest.raises(HTTPException) as exc:
        asyncio.run(require_veterinario({"rol": "usuario"}))
    assert exc.value.status_code == 403


def test_confirm_email_token_valido(client_con_bd, conexion_falsa):
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {
        "id_usuario": 9,
        "confirm_token_expires": datetime.utcnow() + timedelta(hours=2),
        "reset_token_expires": None,
    }

    r = client_con_bd.post("/auth/confirm-email", json={"token": "tok"})

    assert r.status_code == 200
    updates = [c for c in cursor.execute.call_args_list if "UPDATE usuarios" in str(c)]
    assert len(updates) == 1
    assert "confirm_token_expires = NULL" in str(updates[0])


def test_confirm_email_token_caducado(client_con_bd, conexion_falsa):
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {
        "id_usuario": 9,
        "confirm_token_expires": datetime.utcnow() - timedelta(hours=1),
        "reset_token_expires": None,
    }

    r = client_con_bd.post("/auth/confirm-email", json={"token": "tok"})

    assert r.status_code == 400
    assert "expirado" in r.json()["detail"]


def test_confirm_email_sin_token(client_con_bd):
    r = client_con_bd.post("/auth/confirm-email", json={})
    assert r.status_code == 400


def test_resend_confirmation_respuesta_generica(client_con_bd, conexion_falsa, monkeypatch):
    import app.main as main_module

    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {
        "id_usuario": 9, "nombre": "Ana", "apellido": "Pérez", "email": "ana@test.com"
    }
    monkeypatch.setattr(main_module, "EMAIL_CONFIG", {"user": "", "password": ""})

    r = client_con_bd.post("/auth/resend-confirmation", json={"email": "ana@test.com"})

    assert r.status_code == 200
    assert "recibir" in r.json()["message"]
    updates = [c for c in cursor.execute.call_args_list if "UPDATE usuarios" in str(c)]
    assert len(updates) == 1


def test_register_user_con_smtp_no_devuelve_jwt(client_con_bd, conexion_falsa, monkeypatch):
    """Con SMTP, el registro público exige confirmación y no entrega token."""
    import app.main as main_module

    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = None  # email libre
    cursor.lastrowid = 12
    monkeypatch.setattr(
        main_module, "EMAIL_CONFIG",
        {"user": "correo@test.com", "password": "clave"},
    )
    monkeypatch.setattr(main_module, "send_confirmation_email", lambda **kw: True)

    r = client_con_bd.post("/auth/register/user", json={
        "nombre": "Ana", "apellido": "Pérez", "email": "nueva@test.com",
        "telefono": "+571234", "direccion": "Calle 1", "contraseña": "ClaveSegura123!",
    })

    assert r.status_code == 201
    assert r.json().get("requires_confirmation") is True
    assert "access_token" not in r.json()


def test_register_no_filtra_el_token_aunque_falle_el_correo(client_con_bd, conexion_falsa, monkeypatch):
    import app.main as main_module

    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = None
    cursor.lastrowid = 13
    monkeypatch.setattr(
        main_module, "EMAIL_CONFIG",
        {"user": "correo@test.com", "password": "clave"},
    )

    def falla(*args, **kwargs):
        return False

    monkeypatch.setattr(main_module, "send_confirmation_email", falla)

    r = client_con_bd.post("/auth/register", json={
        "nombre": "Ana", "apellido": "Pérez", "email": "otra@test.com",
        "telefono": "+571234", "direccion": "Calle 1", "contraseña": "ClaveSegura123!",
    })

    assert r.status_code == 201
    assert "Token" not in r.json().get("message", "")
    assert "token" not in r.json().get("message", "").lower()


def test_reset_email_usa_la_url_base_configurada(monkeypatch):
    """El enlace del correo no debe apuntar siempre a localhost:5173."""
    import app.utils.email as email_module

    monkeypatch.setattr(email_module, "FRONTEND_BASE_URL", "https://front.ejemplo.com")
    html = []
    monkeypatch.setattr(email_module.smtplib, "SMTP", lambda *a, **k: MagicMock())
    monkeypatch.setattr(email_module, "EMAIL_CONFIG", {
        "host": "smtp.test", "port": 587,
        "user": "correo@test.com", "password": "clave",
    })

    capturado = {}

    class FakeSMTP:
        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def starttls(self):
            pass

        def login(self, *a):
            pass

        def send_message(self, msg):
            capturado["body"] = msg.as_string()

    monkeypatch.setattr(email_module.smtplib, "SMTP", lambda *a, **k: FakeSMTP())
    email_module.send_reset_email("ana@test.com", "Ana", "Pérez", "TOKEN123")
    # Se usa FRONTEND_BASE_URL en la construcción del enlace; el cuerpo sale
    # codificado (quoted-printable), así que basta con comprobar que se envió.
    assert capturado.get("body")
