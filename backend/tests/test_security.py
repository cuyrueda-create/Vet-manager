"""Pruebas de la capa de seguridad: hashing de contraseñas y JWT."""

import pytest

from app.core.security import (
    create_access_token,
    decode_token,
    get_password_hash,
    verify_password,
)


def test_hash_no_guarda_la_contraseña_en_plano():
    hash_generado = get_password_hash("SuperSecreta123!")
    assert hash_generado != "SuperSecreta123!"
    assert "SuperSecreta123!" not in hash_generado


def test_verify_password_acepta_la_correcta():
    hash_generado = get_password_hash("SuperSecreta123!")
    assert verify_password("SuperSecreta123!", hash_generado) is True


def test_verify_password_rechaza_la_incorrecta():
    hash_generado = get_password_hash("SuperSecreta123!")
    assert verify_password("contrasena-equivocada", hash_generado) is False


def test_el_mismo_password_genera_hashes_distintos():
    """pbkdf2_sha256 usa sal aleatoria: dos hashes nunca son idénticos."""
    hash_a = get_password_hash("clave12345")
    hash_b = get_password_hash("clave12345")
    assert hash_a != hash_b


def test_token_se_puede_decodificar():
    token = create_access_token({"sub": "ana@test.com", "rol": "usuario"})
    payload = decode_token(token)
    assert payload is not None
    assert payload["sub"] == "ana@test.com"
    assert payload["rol"] == "usuario"
    assert "exp" in payload


def test_decode_token_rechaza_texto_basura():
    assert decode_token("esto-no-es-un-jwt") is None


def test_decode_token_rechaza_token_firmado_con_otra_clave():
    import jwt

    token_falso = jwt.encode(
        {"sub": "intruso@test.com"}, "otra_clave_secreta", algorithm="HS256"
    )
    assert decode_token(token_falso) is None
