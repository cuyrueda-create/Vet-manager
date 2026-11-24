"""Cobertura de la creación del esquema base en BDs vacías (Render + Aiven)."""
from unittest.mock import MagicMock


def test_schema_base_no_toca_una_bd_que_ya_tiene_usuarios(monkeypatch):
    import app.main as main_module

    conexion = MagicMock()
    cursor = conexion.cursor.return_value
    cursor.fetchone.return_value = (1,)  # usuarios ya existe
    monkeypatch.setattr(main_module, "get_db_connection", lambda owner=False: conexion)

    main_module.aplicar_schema_base()

    ejecuciones = [str(c) for c in cursor.execute.call_args_list]
    assert len(ejecuciones) == 1
    assert "information_schema.tables" in ejecuciones[0]


def test_schema_base_aplica_el_ddl_cuando_la_bd_esta_vacia(monkeypatch):
    import app.main as main_module

    conexion = MagicMock()
    cursor = conexion.cursor.return_value
    cursor.fetchone.return_value = (0,)  # no hay tablas
    monkeypatch.setattr(main_module, "get_db_connection", lambda owner=False: conexion)

    schema = MagicMock()
    schema.read_text.return_value = """
    -- comentario
    CREATE TABLE usuarios (id INT);
    DELIMITER //
    CREATE PROCEDURE p() BEGIN SELECT 1; END//
    DELIMITER ;
    CREATE TABLE citas (id INT);
    """
    monkeypatch.setattr(main_module, "RUTA_SCHEMA_BASE", schema)

    main_module.aplicar_schema_base()

    sentencias = [c.args[0] for c in cursor.execute.call_args_list]
    # SELECT de comprobación + dos CREATE; el bloque DELIMITER se omitió.
    assert any("information_schema.tables" in s for s in sentencias)
    assert any("CREATE TABLE usuarios" in s for s in sentencias)
    assert any("CREATE TABLE citas" in s for s in sentencias)
    assert not any("CREATE PROCEDURE" in s or "DELIMITER" in s for s in sentencias)
    conexion.commit.assert_called_once()
