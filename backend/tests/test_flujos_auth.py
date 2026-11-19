"""Pruebas de los flujos de registro y restablecimiento de contraseña.

Usan la base de datos simulada (ver tests/conftest.py) para cubrir los
caminos de validación de /auth/register/user, /auth/request-reset y
/auth/reset-password.
"""


def test_register_user_rechaza_contrasena_vacia(client_con_bd, conexion_falsa):
    """Sin contraseña el registro no crea el usuario (400)."""
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = None  # el email todavía no existe

    respuesta = client_con_bd.post(
        "/auth/register/user",
        json={
            "nombre": "Ana",
            "apellido": "Pérez",
            "email": "libre@test.com",
            "contraseña": "",
        },
    )

    assert respuesta.status_code == 400
    assert "La contraseña es obligatoria" in respuesta.json()["detail"]


def test_register_user_rechaza_contrasena_debil(client_con_bd, conexion_falsa):
    """La contraseña debe pasar el validador de fortaleza (mínimo 8, etc.)."""
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = None

    respuesta = client_con_bd.post(
        "/auth/register/user",
        json={
            "nombre": "Ana",
            "apellido": "Pérez",
            "email": "libre@test.com",
            "contraseña": "123",
        },
    )

    assert respuesta.status_code == 400
    assert "al menos 8 caracteres" in respuesta.json()["detail"]


def test_request_reset_responde_generico_si_el_email_no_existe(
    client_con_bd, conexion_falsa
):
    """No revela si el correo existe: siempre responde el mismo mensaje."""
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = None

    respuesta = client_con_bd.post(
        "/auth/request-reset", json={"email": "nadie@test.com"}
    )

    assert respuesta.status_code == 200
    assert "Si el correo está registrado" in respuesta.json()["message"]


def test_request_reset_guarda_token_aunque_falle_el_correo(
    client_con_bd, conexion_falsa, monkeypatch
):
    """Guarda el token aunque el envío falle: jamás revela el token."""
    import app.main as main_module

    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {"id_usuario": 7, "email": "ana@test.com"}
    # SELECT ok, ALTER falla (columna ya existe), UPDATE ok
    cursor.execute.side_effect = [None, RuntimeError("columna ya existe"), None]

    monkeypatch.setattr(
        main_module,
        "EMAIL_CONFIG",
        {"host": "127.0.0.1", "port": 1, "user": "fake@test.com", "password": "fake"},
    )

    def _correo_fallido(*args, **kwargs):
        raise RuntimeError("correo deshabilitado en pruebas")

    monkeypatch.setattr(main_module, "send_reset_email", _correo_fallido)

    respuesta = client_con_bd.post(
        "/auth/request-reset", json={"email": "ana@test.com"}
    )

    assert respuesta.status_code == 200
    assert "Si el correo está registrado" in respuesta.json()["message"]
    assert cursor.execute.call_count == 3  # SELECT + ALTER + UPDATE
    conexion_falsa.commit.assert_called_once()


def test_reset_password_rechaza_contrasena_debil(client_con_bd, conexion_falsa):
    """Con token válido pero contraseña débil, no se cambia nada (400)."""
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {"id_usuario": 7}

    respuesta = client_con_bd.post(
        "/auth/reset-password",
        json={"token": "token-de-prueba", "new_password": "123"},
    )

    assert respuesta.status_code == 400
    assert "al menos 8 caracteres" in respuesta.json()["detail"]
