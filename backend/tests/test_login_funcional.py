"""Casos funcionales F-01 y F-02 (§6.4 del plan): flujo de login.

Usan la base de datos simulada (tests/conftest.py): verifican el contrato
completo de POST /auth/login contra el handler de app.main, no solo las
funciones de hash de security.py.
"""

from app.core.security import get_password_hash


def _usuario_simulado(password_plano: str, **extra) -> dict:
    usuario = {
        "id_usuario": 7,
        "nombre": "Ana",
        "apellido": "Pérez",
        "email": "ana@test.com",
        "contrasea": get_password_hash(password_plano),
        "rol": "veterinario",
        "tipo_documento": "CC",
        "numero_documento": "1234567890",
        "confirm_token": None,
        "is_active": True,
    }
    usuario.update(extra)
    return usuario


def test_f01_login_con_credenciales_validas_devuelve_token(client_con_bd, conexion_falsa):
    """F-01: login correcto → 200 con access_token bearer y datos del usuario."""
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = _usuario_simulado("V3t-Ma!nager2026")

    respuesta = client_con_bd.post(
        "/auth/login",
        json={"email": "ana@test.com", "contraseña": "V3t-Ma!nager2026"},
    )

    assert respuesta.status_code == 200
    cuerpo = respuesta.json()
    assert cuerpo["token_type"] == "bearer"
    assert cuerpo["access_token"]
    assert cuerpo["user"]["email"] == "ana@test.com"
    assert cuerpo["user"]["rol"] == "veterinario"
    assert cuerpo["user"]["id_usuario"] == 7


def test_f02_login_con_contrasena_incorrecta_responde_401(
    client_con_bd, conexion_falsa
):
    """F-02: contraseña errónea → 401 genérico, sin token ni detalle que filtre."""
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = _usuario_simulado("LaCorrecta123!")

    respuesta = client_con_bd.post(
        "/auth/login",
        json={"email": "ana@test.com", "contraseña": "LaIncorrecta999!"},
    )

    assert respuesta.status_code == 401
    assert respuesta.json()["detail"] == "Credenciales inválidas"
    assert "access_token" not in respuesta.json()


def test_f02b_login_con_email_inexistente_responde_401(
    client_con_bd, conexion_falsa
):
    """El correo que no existe responde igual que la clave mala (sin enumerar)."""
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = None

    respuesta = client_con_bd.post(
        "/auth/login",
        json={"email": "nadie@test.com", "contraseña": "Cualquier123!"},
    )

    assert respuesta.status_code == 401
    assert respuesta.json()["detail"] == "Credenciales inválidas"
