"""Pruebas de la política de contraseñas del módulo de administración."""

from app.api.v1.admin import validar_contraseña_fuerte


def test_password_valida_devuelve_none():
    assert validar_contraseña_fuerte("VetManager2026!") is None


def test_password_corta_es_rechazada():
    assert validar_contraseña_fuerte("Ab1!") is not None


def test_password_sin_mayuscula_es_rechazada():
    assert validar_contraseña_fuerte("vetmanager2026!") is not None


def test_password_sin_minuscula_es_rechazada():
    assert validar_contraseña_fuerte("VETMANAGER2026!") is not None


def test_password_sin_digito_es_rechazada():
    assert validar_contraseña_fuerte("VetManager!") is not None


def test_password_sin_caracter_especial_es_rechazada():
    assert validar_contraseña_fuerte("VetManager2026") is not None
