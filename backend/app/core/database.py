import mysql.connector
from mysql.connector import Error
from app.core.config import DB_CONFIG, DB_OWNER_CONFIG


def get_db_connection(owner: bool = False):
    """Devuelve una conexión a MySQL.

    owner=True  -> rol `vet_owner` (DDL: migraciones, rutinas, vistas). Solo el
                   arranque de la API debe usarlo.
    owner=False -> rol `vet_app` (CRUD + EXECUTE). Es el que usa la API en
                   cada petición (§7.3 del plan de implantación).
    """
    config = DB_OWNER_CONFIG if owner else DB_CONFIG
    try:
        connection = mysql.connector.connect(**config)
        return connection
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None
