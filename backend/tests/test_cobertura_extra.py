"""Tests extra para cerrar líneas nuevas sin cubrir (objetivo cobertura >= 90%)."""
import asyncio
from email.message import EmailMessage
from unittest.mock import MagicMock

from app.api.v1 import admin as admin_mod
from app.utils import brevo_smtp
from app.utils import email as email_mod


def _fake_conn():
    conexion = MagicMock()
    cursor = conexion.cursor.return_value
    cursor.fetchone.return_value = None  # email / documento libres
    cursor.lastrowid = 99
    return conexion, cursor


def test_admin_crea_usuario_con_codigo_enviado(monkeypatch):
    conexion, cursor = _fake_conn()
    monkeypatch.setattr(admin_mod, "get_db_connection", lambda: conexion)
    monkeypatch.setattr(admin_mod, "EMAIL_CONFIG", {
        "user": "correo@test.com", "password": "clave", "from": "correo@test.com",
    })
    monkeypatch.setattr(admin_mod, "send_verification_code_email", lambda *a: True)

    r = asyncio.run(admin_mod.create_usuario(
        admin_mod.UserCreate(
            nombre="Vet", apellido="Nuevo", email="vet@test.com",
            contraseña="VetManager2026!", rol="veterinario",
            telefono="+571234", direccion="Calle 1",
            tipo_documento="Cédula de ciudadanía", numero_documento="123",
        ),
        {"id_usuario": 1},
    ))

    assert "código" in r["message"]
    assert r["id_usuario"] == 99


def test_admin_crea_usuario_si_falla_el_correo_lo_activa(monkeypatch):
    conexion, cursor = _fake_conn()
    monkeypatch.setattr(admin_mod, "get_db_connection", lambda: conexion)
    monkeypatch.setattr(admin_mod, "EMAIL_CONFIG", {
        "user": "correo@test.com", "password": "clave", "from": "correo@test.com",
    })
    monkeypatch.setattr(admin_mod, "send_verification_code_email", lambda *a: False)

    r = asyncio.run(admin_mod.create_usuario(
        admin_mod.UserCreate(
            nombre="Recepcion", apellido="Nueva", email="recep@test.com",
            contraseña="VetManager2026!", rol="recepcionista",
            telefono="+571234", direccion="Calle 1",
            tipo_documento="Cédula de ciudadanía", numero_documento="456",
        ),
        {"id_usuario": 1},
    ))

    assert "activada directamente" in r["message"]
    updates = [str(c) for c in cursor.execute.call_args_list if "is_active = TRUE" in str(c)]
    assert len(updates) == 1


def test_brevo_smtp_context_manager_y_multipart(monkeypatch):
    monkeypatch.setenv("BREVO_API_KEY", "clave-api")
    monkeypatch.setattr(brevo_smtp, "EMAIL_CONFIG", {
        "from": "cuyrueda@gmail.com", "user": "login@smtp-brevo.com",
    })
    respuesta = MagicMock()
    respuesta.status = 202
    contexto = MagicMock()
    contexto.__enter__.return_value = respuesta
    urlopen = MagicMock(return_value=contexto)
    monkeypatch.setattr(brevo_smtp.urllib.request, "urlopen", urlopen)

    msg = EmailMessage()
    msg["Subject"] = "Cita"
    msg["To"] = "cliente@test.com"
    msg.set_content("Texto plano")
    msg.add_alternative("<p>Hola</p>", subtype="html")

    with brevo_smtp.BrevoSMTP() as smtp:
        smtp.starttls()
        smtp.login("u", "p")
        smtp.send_message(msg)

    payload = __import__("json").loads(urlopen.call_args.args[0].data)
    assert payload["textContent"] == "Texto plano\n"
    assert "<p>Hola</p>" in payload["htmlContent"]


def test_brevo_smtp_html_simple(monkeypatch):
    monkeypatch.setenv("BREVO_API_KEY", "clave-api")
    monkeypatch.setattr(brevo_smtp, "EMAIL_CONFIG", {
        "from": "cuyrueda@gmail.com", "user": "login@smtp-brevo.com",
    })
    respuesta = MagicMock()
    respuesta.status = 200
    contexto = MagicMock()
    contexto.__enter__.return_value = respuesta
    urlopen = MagicMock(return_value=contexto)
    monkeypatch.setattr(brevo_smtp.urllib.request, "urlopen", urlopen)

    msg = EmailMessage()
    msg["Subject"] = "Factura"
    msg["To"] = "cliente@test.com"
    msg.set_content("<h1>Factura</h1>", subtype="html")

    brevo_smtp.BrevoSMTP().send_message(msg)
    payload = __import__("json").loads(urlopen.call_args.args[0].data)
    assert "<h1>" in payload["htmlContent"]


def test_brevo_smtp_sin_key_y_respuesta_invalida(monkeypatch):
    monkeypatch.delenv("BREVO_API_KEY", raising=False)
    msg = EmailMessage()
    msg["Subject"] = "x"; msg["To"] = "a@test.com"; msg.set_content("x")
    try:
        brevo_smtp.BrevoSMTP().send_message(msg)
        assert False, "debe lanzar"
    except RuntimeError:
        pass

    monkeypatch.setenv("BREVO_API_KEY", "clave-api")
    monkeypatch.setattr(brevo_smtp, "EMAIL_CONFIG", {"from": "a@b.com", "user": "u"})
    respuesta = MagicMock(); respuesta.status = 500
    contexto = MagicMock(); contexto.__enter__.return_value = respuesta
    monkeypatch.setattr(brevo_smtp.urllib.request, "urlopen", MagicMock(return_value=contexto))
    try:
        brevo_smtp.BrevoSMTP().send_message(msg)
        assert False, "debe lanzar"
    except RuntimeError:
        pass


def test_envio_cita_y_recordatorio_por_smtp(monkeypatch):
    monkeypatch.delenv("BREVO_API_KEY", raising=False)
    monkeypatch.setattr(email_mod, "EMAIL_CONFIG", {
        "host": "smtp.test", "port": 587, "user": "u@test.com",
        "password": "p", "from": "u@test.com",
    })
    servidor = MagicMock()
    monkeypatch.setattr(email_mod.smtplib, "SMTP", lambda *a, **k: servidor)

    cita = {
        "id_cita": 5, "fecha": "2026-11-28", "hora": "10:00", "mascota_nombre": "Luna",
        "servicio_nombre": "Consulta", "vet_nombre": "Ana", "vet_apellido": "Pérez",
        "consultorio": "1",
    }
    assert email_mod.send_cita_email("cliente@test.com", "Ana", "Pérez", cita) is True
    assert email_mod.send_recordatorio_email("cliente@test.com", "Ana", "Pérez", cita) is True
