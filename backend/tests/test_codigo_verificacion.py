"""Flujo de verificación con código de 6 dígitos (§7.6)."""
from datetime import datetime, timedelta
from unittest.mock import MagicMock


def test_verify_code_valido_devuelve_sesion(client_con_bd, conexion_falsa):
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {
        "id_usuario": 7, "nombre": "Ana", "apellido": "Pérez",
        "email": "ana@test.com", "rol": "usuario",
        "tipo_documento": None, "numero_documento": None,
        "codigo_expires": datetime.utcnow() + timedelta(minutes=5),
        "is_active": False,
    }

    r = client_con_bd.post("/auth/verify-code", json={"email": "ana@test.com", "codigo": "123456"})

    assert r.status_code == 200
    assert "access_token" in r.json()
    updates = [str(c) for c in cursor.execute.call_args_list if "is_active = TRUE" in str(c)]
    assert len(updates) == 1


def test_verify_code_rechaza_caducado(client_con_bd, conexion_falsa):
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {
        "id_usuario": 7, "email": "ana@test.com", "rol": "usuario",
        "codigo_expires": datetime.utcnow() - timedelta(minutes=1),
        "is_active": False,
    }

    r = client_con_bd.post("/auth/verify-code", json={"email": "ana@test.com", "codigo": "123456"})

    assert r.status_code == 400
    assert "expir" in r.json()["detail"]


def test_verify_code_rechaza_codigo_incorrecto(client_con_bd, conexion_falsa):
    conexion_falsa.cursor.return_value.fetchone.return_value = None
    r = client_con_bd.post("/auth/verify-code", json={"email": "ana@test.com", "codigo": "000000"})
    assert r.status_code == 400


def test_envio_de_codigo_por_smtp(monkeypatch):
    from app.utils import email as email_module

    clase = MagicMock()
    instancia = clase.return_value.__enter__.return_value
    monkeypatch.setattr(email_module.smtplib, "SMTP", clase)
    monkeypatch.setattr(email_module, "EMAIL_CONFIG", {
        "host": "smtp.test", "port": 587,
        "user": "correo@test.com", "password": "clave",
    })

    assert email_module.send_verification_code_email(
        "ana@test.com", "Ana", "Pérez", "123456"
    ) is True
    instancia.send_message.assert_called_once()


def test_envio_de_codigo_falla_sin_lanzar(monkeypatch):
    from app.utils import email as email_module

    def rompe(*args, **kwargs):
        raise RuntimeError("SMTP caído")

    monkeypatch.setattr(email_module.smtplib, "SMTP", rompe)
    monkeypatch.setattr(email_module, "EMAIL_CONFIG", {
        "host": "smtp.test", "port": 587,
        "user": "correo@test.com", "password": "clave",
    })

    assert email_module.send_verification_code_email(
        "ana@test.com", "Ana", "Pérez", "123456"
    ) is False


def test_resend_code_respuesta_generica(client_con_bd, conexion_falsa, monkeypatch):
    import app.main as main_module

    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {
        "id_usuario": 7, "nombre": "Ana", "apellido": "Pérez", "email": "ana@test.com"
    }
    monkeypatch.setattr(main_module, "send_verification_code_email", lambda *a: True)

    r = client_con_bd.post("/auth/resend-code", json={"email": "ana@test.com"})

    assert r.status_code == 200
    assert "código" in r.json()["message"]
