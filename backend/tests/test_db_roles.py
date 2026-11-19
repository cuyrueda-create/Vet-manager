"""Separación de roles de base de datos (§7.3 del plan de implantación).

El arranque usa el rol con DDL (vet_owner) y el runtime de la API usa el rol
con solo CRUD + EXECUTE (vet_app). Estas pruebas verifican que cada conexión
toma las credenciales correctas y que la rutina de arranque no rompe la app.
"""
from unittest.mock import MagicMock, patch

from mysql.connector import Error


def test_get_db_connection_usa_credenciales_de_la_app():
    from app.core import database

    with patch.object(database.mysql.connector, "connect") as connect:
        database.get_db_connection()

    assert connect.call_args.kwargs == database.DB_CONFIG


def test_get_db_connection_owner_usa_credenciales_del_rol_ddl():
    from app.core import database

    with patch.object(database.mysql.connector, "connect") as connect:
        database.get_db_connection(owner=True)

    assert connect.call_args.kwargs == database.DB_OWNER_CONFIG


def test_get_db_connection_devuelve_none_si_falla_la_conexion():
    from app.core import database

    with patch.object(database.mysql.connector, "connect", side_effect=Error("sin BD")):
        assert database.get_db_connection() is None
        assert database.get_db_connection(owner=True) is None


def test_migrate_stored_procedures_crea_la_rutina_con_el_rol_owner():
    import app.main as main_module

    conexion = MagicMock()
    with patch.object(main_module, "get_db_connection", return_value=conexion) as get_conn:
        main_module.migrate_stored_procedures()

    get_conn.assert_called_once_with(owner=True)
    cursor = conexion.cursor.return_value
    sentencias = [llamada.args[0] for llamada in cursor.execute.call_args_list]
    assert "DROP PROCEDURE IF EXISTS sp_citas_activas" in sentencias[0]
    assert "CREATE PROCEDURE sp_citas_activas" in sentencias[1]
    conexion.commit.assert_called_once()
    conexion.close.assert_called_once()


def test_migrate_stored_procedures_sin_conexion_no_falla():
    import app.main as main_module

    with patch.object(main_module, "get_db_connection", return_value=None):
        main_module.migrate_stored_procedures()


def test_migrate_stored_procedures_con_error_cierra_la_conexion():
    import app.main as main_module

    conexion = MagicMock()
    conexion.cursor.return_value.execute.side_effect = RuntimeError("sin permisos")
    with patch.object(main_module, "get_db_connection", return_value=conexion):
        main_module.migrate_stored_procedures()

    conexion.close.assert_called_once()
