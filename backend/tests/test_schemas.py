"""Pruebas de validación de los esquemas Pydantic (sin base de datos)."""

import pytest
from pydantic import ValidationError

from app.schemas.schemas import (
    PasswordResetRequest,
    UsuarioCreate,
    UsuarioLogin,
)


def test_usuario_create_valido():
    usuario = UsuarioCreate(
        nombre="Ana", email="ana@test.com", password="123456"
    )
    assert usuario.rol == "usuario"  # valor por defecto


def test_usuario_create_rechaza_email_invalido():
    with pytest.raises(ValidationError):
        UsuarioCreate(nombre="Ana", email="no-es-un-correo", password="123456")


def test_usuario_create_rechaza_nombre_corto():
    with pytest.raises(ValidationError):
        UsuarioCreate(nombre="A", email="a@test.com", password="123456")


def test_usuario_create_rechaza_password_corta():
    with pytest.raises(ValidationError):
        UsuarioCreate(nombre="Ana", email="a@test.com", password="12345")


def test_usuario_login_requiere_password():
    with pytest.raises(ValidationError):
        UsuarioLogin(email="ana@test.com")


def test_password_reset_request_valido():
    solicitud = PasswordResetRequest(email="ana@test.com")
    assert solicitud.email == "ana@test.com"


def test_password_reset_request_rechaza_email_invalido():
    with pytest.raises(ValidationError):
        PasswordResetRequest(email="esto-no-es-email")
