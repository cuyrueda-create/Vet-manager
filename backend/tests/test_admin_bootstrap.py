"""Pruebas del alta del primer administrador (arranque de la BD en la nube)."""
from unittest.mock import MagicMock


def test_bootstrap_admin_requiere_la_clave_maestra(client_con_bd, monkeypatch):
    import app.main as main_module

    monkeypatch.setattr(main_module, "ADMIN_CREATE_KEY", "CLAVE-MAESTRA")
    r = client_con_bd.post("/auth/bootstrap-admin", json={
        "nombre": "Admin", "apellido": "Principal", "email": "admin@test.com",
        "contraseña": "ClaveSegura123!", "clave_admin": "INCORRECTA",
    })
    assert r.status_code == 403


def test_bootstrap_admin_rechaza_segundo_administrador(client_con_bd, conexion_falsa, monkeypatch):
    import app.main as main_module

    monkeypatch.setattr(main_module, "ADMIN_CREATE_KEY", "CLAVE-MAESTRA")
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.return_value = {"total": 1}

    r = client_con_bd.post("/auth/bootstrap-admin", json={
        "nombre": "Admin", "apellido": "Principal", "email": "admin@test.com",
        "contraseña": "ClaveSegura123!", "clave_admin": "CLAVE-MAESTRA",
    })
    assert r.status_code == 409


def test_bootstrap_admin_crea_cuenta_activa(client_con_bd, conexion_falsa, monkeypatch):
    import app.main as main_module

    monkeypatch.setattr(main_module, "ADMIN_CREATE_KEY", "CLAVE-MAESTRA")
    cursor = conexion_falsa.cursor.return_value
    cursor.fetchone.side_effect = [{"total": 0}, None, {
        "id_usuario": 1, "nombre": "Admin", "apellido": "Principal",
        "email": "admin@test.com", "rol": "administrador",
        "tipo_documento": None, "numero_documento": None,
    }]
    cursor.lastrowid = 1

    r = client_con_bd.post("/auth/bootstrap-admin", json={
        "nombre": "Admin", "apellido": "Principal", "email": "admin@test.com",
        "contraseña": "ClaveSegura123!", "clave_admin": "CLAVE-MAESTRA",
    })

    assert r.status_code == 201
    assert "access_token" in r.json()
    inserts = [str(c) for c in cursor.execute.call_args_list if "INSERT INTO usuarios" in str(c)]
    assert len(inserts) == 1
    assert "administrador" in inserts[0]
