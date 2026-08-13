from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.database import get_db_connection
from app.core.auth import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])

class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    rol: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None
    is_active: Optional[bool] = None

@router.get("/historial")
async def get_historial():
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT * FROM (
                SELECT 'registro' AS accion,
                       u.id_usuario,
                       CONCAT(u.nombre, ' ', u.apellido) AS usuario,
                       u.rol,
                       DATE_FORMAT(u.created_at, '%Y-%m-%d %H:%i') AS fecha,
                       CONCAT('Se registró en el sistema como ', u.rol) AS detalle
                FROM usuarios u

                UNION ALL

                SELECT 'reporte',
                       r.generado_por,
                       CONCAT(u.nombre, ' ', u.apellido),
                       u.rol,
                       DATE_FORMAT(r.fecha_generado, '%Y-%m-%d %H:%i'),
                       CONCAT('Generó el reporte: ', r.tipo)
                FROM reportes r
                INNER JOIN usuarios u ON r.generado_por = u.id_usuario

                UNION ALL

                SELECT 'cliente',
                       c.id_usuario,
                       CONCAT(u.nombre, ' ', u.apellido),
                       u.rol,
                       NULL,
                       CONCAT('Registró el cliente: ', c.nombre, ' ', c.apellido, ' (', c.telefono, ')')
                FROM clientes c
                INNER JOIN usuarios u ON c.id_usuario = u.id_usuario

                UNION ALL

                SELECT 'mascota',
                       m.id_usuario,
                       CONCAT(u.nombre, ' ', u.apellido),
                       u.rol,
                       NULL,
                       CONCAT('Registró la mascota: ', m.nombre, ' (', m.especie, ')')
                FROM mascotas m
                INNER JOIN usuarios u ON m.id_usuario = u.id_usuario

                UNION ALL

                SELECT 'cita',
                       c.id_usuario,
                       CONCAT(u.nombre, ' ', u.apellido),
                       u.rol,
                       NULL,
                       CONCAT('Creó la cita #', c.id_cita, ' para la mascota ', m.nombre)
                FROM citas c
                INNER JOIN usuarios u ON c.id_usuario = u.id_usuario
                INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
            ) AS historial
            ORDER BY fecha IS NULL, fecha DESC, id_usuario ASC
        """)
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.get("/usuarios")
async def get_usuarios():
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono, direccion,
                   rol, tipo_documento, numero_documento, is_active,
                   DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
            FROM usuarios
            ORDER BY nombre, apellido
        """)
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.get("/usuarios/{usuario_id}")
async def get_usuario(usuario_id: int):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono, direccion,
                   rol, tipo_documento, numero_documento, is_active,
                   DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') AS created_at
            FROM usuarios WHERE id_usuario = %s
        """, (usuario_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.put("/usuarios/{usuario_id}")
async def update_usuario(usuario_id: int, data: UserUpdate):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_usuario FROM usuarios WHERE id_usuario = %s", (usuario_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Usuario no encontrado")

        fields = []
        values = []
        for key, value in data.dict(exclude_none=True).items():
            if key == "email" and value:
                cursor.execute("SELECT id_usuario FROM usuarios WHERE email = %s AND id_usuario != %s", (value, usuario_id))
                if cursor.fetchone():
                    raise HTTPException(status_code=400, detail="Email ya registrado por otro usuario")
            fields.append(f"{key} = %s")
            values.append(value)

        if not fields:
            return {"message": "No se enviaron campos para actualizar"}

        values.append(usuario_id)
        cursor.execute(f"UPDATE usuarios SET {', '.join(fields)} WHERE id_usuario = %s", values)
        connection.commit()
        return {"message": "Usuario actualizado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.delete("/usuarios/{usuario_id}")
async def delete_usuario(usuario_id: int):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_usuario, is_active FROM usuarios WHERE id_usuario = %s", (usuario_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if user.get("is_active") == 0:
            raise HTTPException(status_code=400, detail="El usuario ya está inactivo")
        cursor.execute("UPDATE usuarios SET is_active = 0 WHERE id_usuario = %s", (usuario_id,))
        connection.commit()
        return {"message": "Usuario desactivado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()
