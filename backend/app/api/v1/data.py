# app/api/v1/data.py
from fastapi import APIRouter, HTTPException
from app.core.database import get_db_connection

router = APIRouter()

@router.get("/vista")
async def get_listado_vista():
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            CREATE OR REPLACE VIEW vista_mascotas_clientes AS
            SELECT 
                m.id_mascota,
                m.nombre AS mascota_nombre,
                m.especie,
                m.raza,
                m.sexo,
                m.edad,
                m.peso,
                m.id_usuario,
                c.id_cliente,
                c.nombre AS cliente_nombre,
                c.apellido AS cliente_apellido,
                c.telefono AS cliente_telefono,
                COUNT(ct.id_cita) AS total_citas
            FROM mascotas m
            INNER JOIN clientes c ON m.id_cliente = c.id_cliente
            LEFT JOIN citas ct ON m.id_mascota = ct.id_mascota
            GROUP BY m.id_mascota, m.nombre, m.especie, m.raza, m.sexo, m.edad, m.peso, m.id_usuario,
                     c.id_cliente, c.nombre, c.apellido, c.telefono
            ORDER BY m.nombre
        """)
        
        cursor.execute("SELECT * FROM vista_mascotas_clientes")
        data = cursor.fetchall()
        
        # Convertir valores para JSON
        for row in data:
            if isinstance(row.get('peso'), (int, float)):
                row['peso'] = float(row['peso'])
        
        return {
            "success": True,
            "data": data,
            "message": "Datos obtenidos desde la vista SQL",
            "total": len(data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.get("/procedimiento")
async def get_listado_procedimiento():
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        try:
            cursor.execute("DROP PROCEDURE IF EXISTS sp_citas_activas")
            cursor.execute("""
                CREATE PROCEDURE sp_citas_activas()
                BEGIN
                    SELECT 
                        c.id_cita,
                        m.nombre AS mascota_nombre,
                        CONCAT(cl.nombre, ' ', cl.apellido) AS cliente_nombre,
                        c.fecha,
                        c.hora,
                        s.nombre AS servicio_nombre,
                        c.estado,
                        CONCAT(u.nombre, ' ', u.apellido) AS veterinario_nombre
                    FROM citas c
                    INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
                    INNER JOIN clientes cl ON m.id_cliente = cl.id_cliente
                    INNER JOIN servicios s ON c.id_servicio = s.id_servicio
                    INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
                    WHERE c.estado = 'programada'
                        AND CONCAT(c.fecha, ' ', c.hora) >= NOW()
                    ORDER BY c.fecha ASC, c.hora ASC
                    LIMIT 20;
                END
            """)
            connection.commit()
        except Exception as create_error:
            # El usuario de BD puede carecer de permisos para crear rutinas
            # (p. ej. con binlog activo y sin SUPER). Se usa la existente.
            print(f"⚠️ No se recreó el procedimiento almacenado: {create_error}")
        
        cursor.callproc('sp_citas_activas')
        
        data = []
        for result in cursor.stored_results():
            data = result.fetchall()
        
        return {
            "success": True,
            "data": data,
            "message": "Datos desde stored procedure",
            "total": len(data)
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()