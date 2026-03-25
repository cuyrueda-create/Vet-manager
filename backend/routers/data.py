from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List

from database import get_db
from models import Usuario
from schemas import MascotaResponse, CitaResponse
from auth import decode_token
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/data", tags=["Datos"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Dependencia para obtener usuario actual
async def get_current_user_id(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    return payload.get("id")

# Listado mediante VISTA SQL
@router.get("/vista")
async def get_listado_vista(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Obtiene datos desde una VISTA SQL.
    Ejemplo: vista_mascotas_duenos - Muestra mascotas con información de sus dueños
    """
    try:
        # Ejecutar consulta a la vista
        # Primero verificamos si la vista existe, si no, la creamos
        result = db.execute(text("""
            CREATE OR REPLACE VIEW vista_mascotas_duenos AS
            SELECT 
                m.id AS mascota_id,
                m.nombre AS mascota_nombre,
                m.especie,
                m.raza,
                m.edad,
                u.id AS dueno_id,
                u.nombre AS dueno_nombre,
                u.email AS dueno_email,
                COUNT(c.id) AS total_citas
            FROM mascotas m
            INNER JOIN usuarios u ON m.dueno_id = u.id
            LEFT JOIN citas c ON m.id = c.mascota_id
            GROUP BY m.id, u.id
            ORDER BY m.nombre
        """))
        
        # Obtener datos de la vista
        result = db.execute(text("SELECT * FROM vista_mascotas_duenos"))
        rows = result.fetchall()
        
        # Convertir a lista de diccionarios
        data = []
        for row in rows:
            data.append({
                "mascota_id": row[0],
                "mascota_nombre": row[1],
                "especie": row[2],
                "raza": row[3],
                "edad": row[4],
                "dueno_id": row[5],
                "dueno_nombre": row[6],
                "dueno_email": row[7],
                "total_citas": row[8]
            })
        
        return {
            "success": True,
            "data": data,
            "message": "Datos obtenidos desde la vista SQL exitosamente",
            "total": len(data)
        }
        
    except Exception as e:
        print(f"Error al obtener datos de la vista: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener datos: {str(e)}"
        )

# Listado mediante STORED PROCEDURE con validación
@router.get("/procedimiento")
async def get_listado_procedimiento(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Obtiene datos desde un STORED PROCEDURE.
    Valida que el usuario esté activo antes de ejecutar el procedimiento.
    """
    try:
        # Validación de condición antes de ejecutar el SP
        user_check = db.execute(
            text("SELECT id, rol FROM usuarios WHERE id = :user_id AND rol IN ('admin', 'veterinario', 'usuario')"),
            {"user_id": current_user_id}
        ).fetchone()
        
        if not user_check:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No autorizado para ver esta información. Verifica tu rol."
            )
        
        # Primero creamos el stored procedure si no existe
        db.execute(text("""
            CREATE PROCEDURE IF NOT EXISTS sp_citas_activas(
                IN p_usuario_id INT
            )
            BEGIN
                SELECT 
                    c.id AS cita_id,
                    m.nombre AS mascota_nombre,
                    u.nombre AS dueno_nombre,
                    c.fecha,
                    c.motivo,
                    c.estado,
                    TIMESTAMPDIFF(HOUR, NOW(), c.fecha) AS horas_restantes
                FROM citas c
                INNER JOIN mascotas m ON c.mascota_id = m.id
                INNER JOIN usuarios u ON m.dueno_id = u.id
                WHERE c.estado = 'pendiente' 
                    AND c.fecha >= NOW()
                    AND (u.id = p_usuario_id OR p_usuario_id IN (SELECT id FROM usuarios WHERE rol = 'admin'))
                ORDER BY c.fecha ASC;
            END
        """))
        
        # Ejecutar el stored procedure
        result = db.execute(
            text("CALL sp_citas_activas(:user_id)"),
            {"user_id": current_user_id}
        )
        
        # Obtener resultados
        rows = result.fetchall()
        
        # Procesar resultados
        data = []
        for row in rows:
            data.append({
                "cita_id": row[0],
                "mascota_nombre": row[1],
                "dueno_nombre": row[2],
                "fecha": row[3].isoformat() if row[3] else None,
                "motivo": row[4],
                "estado": row[5],
                "horas_restantes": row[6]
            })
        
        # Limpiar la próxima llamada
        db.execute(text("DEALLOCATE PREPARE stmt"))
        
        return {
            "success": True,
            "data": data,
            "message": "Datos obtenidos desde el stored procedure exitosamente",
            "total": len(data),
            "user_id": current_user_id,
            "rol_verificado": user_check[1]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error al ejecutar el procedimiento: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al ejecutar el procedimiento almacenado: {str(e)}"
        )

# Endpoint adicional para crear la vista si no existe
@router.post("/crear-vista")
async def crear_vista(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Endpoint auxiliar para crear la vista SQL"""
    try:
        # Verificar que el usuario sea admin
        user = db.execute(
            text("SELECT rol FROM usuarios WHERE id = :user_id"),
            {"user_id": current_user_id}
        ).fetchone()
        
        if not user or user[0] != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo administradores pueden crear vistas"
            )
        
        # Crear la vista
        db.execute(text("""
            CREATE OR REPLACE VIEW vista_mascotas_duenos AS
            SELECT 
                m.id AS mascota_id,
                m.nombre AS mascota_nombre,
                m.especie,
                m.raza,
                m.edad,
                u.id AS dueno_id,
                u.nombre AS dueno_nombre,
                u.email AS dueno_email,
                COUNT(c.id) AS total_citas
            FROM mascotas m
            INNER JOIN usuarios u ON m.dueno_id = u.id
            LEFT JOIN citas c ON m.id = c.mascota_id
            GROUP BY m.id, u.id
            ORDER BY m.nombre
        """))
        
        return {"message": "Vista creada exitosamente"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear la vista: {str(e)}"
        )

# Endpoint para crear el stored procedure
@router.post("/crear-procedimiento")
async def crear_procedimiento(
    current_user_id: int = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Endpoint auxiliar para crear el stored procedure"""
    try:
        # Verificar que el usuario sea admin
        user = db.execute(
            text("SELECT rol FROM usuarios WHERE id = :user_id"),
            {"user_id": current_user_id}
        ).fetchone()
        
        if not user or user[0] != 'admin':
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo administradores pueden crear procedimientos"
            )
        
        # Crear el stored procedure
        db.execute(text("""
            DROP PROCEDURE IF EXISTS sp_citas_activas
        """))
        
        db.execute(text("""
            CREATE PROCEDURE sp_citas_activas(
                IN p_usuario_id INT
            )
            BEGIN
                SELECT 
                    c.id AS cita_id,
                    m.nombre AS mascota_nombre,
                    u.nombre AS dueno_nombre,
                    c.fecha,
                    c.motivo,
                    c.estado,
                    TIMESTAMPDIFF(HOUR, NOW(), c.fecha) AS horas_restantes
                FROM citas c
                INNER JOIN mascotas m ON c.mascota_id = m.id
                INNER JOIN usuarios u ON m.dueno_id = u.id
                WHERE c.estado = 'pendiente' 
                    AND c.fecha >= NOW()
                    AND (u.id = p_usuario_id OR p_usuario_id IN (SELECT id FROM usuarios WHERE rol = 'admin'))
                ORDER BY c.fecha ASC;
            END
        """))
        
        return {"message": "Stored procedure creado exitosamente"}
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al crear el procedimiento: {str(e)}"
        )