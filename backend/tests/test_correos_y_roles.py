"""Cobertura de los cambios de roles, inventario y correo por API (§7.x)."""
import smtplib
from unittest.mock import MagicMock


def test_registro_de_personal_queda_pendiente_de_aprobacion(client_con_bd, conexion_falsa):
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = None   # email libre
    cursor.lastrowid = 20

    r = client_con_bd.post("/auth/register/user", json={
        "nombre": "Nueva", "apellido": "Recepcionista", "email": "recep@test.com",
        "telefono": "+571234", "direccion": "Calle 1",
        "contraseña": "ClaveSegura123!", "rol": "recepcionista",
    })

    assert r.status_code == 201
    assert r.json().get("requires_approval") is True
    assert r.json().get("rol") == "recepcionista"
    assert "access_token" not in r.json()
    inserts = [str(c) for c in cursor.execute.call_args_list if "INSERT INTO usuarios" in str(c)]
    assert inserts and "FALSE" in inserts[0]


def test_registro_de_cliente_ignora_rol_invalido(client_con_bd, conexion_falsa, monkeypatch):
    import app.main as main_module

    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.side_effect = [None, {
        "id_usuario": 21, "nombre": "Cliente", "apellido": "Normal",
        "email": "cliente@test.com", "rol": "usuario",
        "tipo_documento": None, "numero_documento": None,
    }]
    cursor.lastrowid = 21
    monkeypatch.setattr(main_module, "EMAIL_CONFIG", {"user": "", "password": "", "from": ""})

    r = client_con_bd.post("/auth/register/user", json={
        "nombre": "Cliente", "apellido": "Normal", "email": "cliente@test.com",
        "telefono": "+571234", "direccion": "Calle 1",
        "contraseña": "ClaveSegura123!", "rol": "administrador",
    })

    assert r.status_code == 201
    inserts = [str(c) for c in cursor.execute.call_args_list if "INSERT INTO usuarios" in str(c)]
    assert inserts and "'usuario'" in inserts[0]


def test_seed_medicamentos_carga_catalogo_en_bd_vacia(monkeypatch):
    import app.main as main_module

    conexion = MagicMock()
    cursor = conexion.cursor.return_value
    cursor.fetchone.return_value = (0,)
    monkeypatch.setattr(main_module, "get_db_connection", lambda owner=False: conexion)

    main_module.seed_medicamentos()

    inserts = [c for c in cursor.execute.call_args_list if "INSERT INTO medicamentos" in str(c)]
    assert len(inserts) == len(main_module.MEDICAMENTOS_INICIALES)
    conexion.commit.assert_called_once()


def test_seed_medicamentos_no_duplica_en_bd_con_datos(monkeypatch):
    import app.main as main_module

    conexion = MagicMock()
    conexion.cursor.return_value.fetchone.return_value = (6,)
    monkeypatch.setattr(main_module, "get_db_connection", lambda owner=False: conexion)

    main_module.seed_medicamentos()

    conexion.commit.assert_not_called()


def test_instalar_brevo_sustituye_smtp(monkeypatch):
    import app.utils.brevo_smtp as brevo

    original = smtplib.SMTP
    monkeypatch.setenv("BREVO_API_KEY", "clave-api")
    brevo.BrevoSMTP._es_brevo = False
    brevo.instalar()
    assert smtplib.SMTP is brevo.BrevoSMTP
    smtplib.SMTP = original  # no afectar otros tests
    brevo.BrevoSMTP._es_brevo = False


def test_brevo_smtp_envia_por_api(monkeypatch):
    import app.utils.brevo_smtp as brevo

    monkeypatch.setenv("BREVO_API_KEY", "clave-api")
    monkeypatch.setattr(brevo, "EMAIL_CONFIG", {
        "from": "cuyrueda@gmail.com", "user": "login@smtp-brevo.com",
    })
    respuesta = MagicMock()
    respuesta.status = 202
    contexto = MagicMock()
    contexto.__enter__.return_value = respuesta
    urlopen = MagicMock(return_value=contexto)
    monkeypatch.setattr(brevo.urllib.request, "urlopen", urlopen)

    from email.message import EmailMessage
    msg = EmailMessage()
    msg["Subject"] = "Cita confirmada"
    msg["To"] = "cliente@test.com"
    msg.set_content("Tu cita fue confirmada")

    brevo.BrevoSMTP().send_message(msg)

    req = urlopen.call_args.args[0]
    assert req.full_url == "https://api.brevo.com/v3/smtp/email"
    assert req.get_header("Api-key") == "clave-api"
