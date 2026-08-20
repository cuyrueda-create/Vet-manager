from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
import os
import re
from passlib.context import CryptContext
from app.core.database import get_db_connection
from app.core.auth import require_admin

router = APIRouter(dependencies=[Depends(require_admin)])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

ADMIN_CREATE_KEY = os.getenv("ADMIN_CREATE_KEY", "VET-ADMIN-2026")

def get_password_hash(password):
    return pwd_context.hash(password)

def validar_contraseña_fuerte(password: str) -> Optional[str]:
    """Devuelve un mensaje de error si la contraseña no cumple la política, o None si es válida."""
    if len(password) < 10:
        return "La contraseña debe tener al menos 10 caracteres"
    if not re.search(r"[A-Z]", password):
        return "La contraseña debe incluir al menos una letra mayúscula"
    if not re.search(r"[a-z]", password):
        return "La contraseña debe incluir al menos una letra minúscula"
    if not re.search(r"\d", password):
        return "La contraseña debe incluir al menos un número"
    if not re.search(r"[^A-Za-z0-9]", password):
        return "La contraseña debe incluir al menos un carácter especial (!@#$%^&*...) "
    return None

class UserCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    contraseña: str
    rol: str = "asistente"
    telefono: str
    direccion: str
    tipo_documento: str
    numero_documento: str
    clave_admin: Optional[str] = None

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

@router.post("/usuarios", status_code=status.HTTP_201_CREATED)
async def create_usuario(data: UserCreate, current_user: dict = Depends(require_admin)):
    """Crea un usuario asignado al administrador que lo registra"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        if not data.contraseña:
            raise HTTPException(status_code=400, detail="La contraseña es obligatoria")
        pwd_error = validar_contraseña_fuerte(data.contraseña)
        if pwd_error:
            raise HTTPException(status_code=400, detail=pwd_error)
        if data.rol not in ("admin", "veterinario", "asistente"):
            raise HTTPException(status_code=400, detail="Rol inválido")

        # Crear un administrador es un acto sensible: exige la clave maestra de administración
        if data.rol == "admin":
            if not data.clave_admin:
                raise HTTPException(status_code=400, detail="Para crear un administrador debes ingresar la clave maestra de administración")
            if data.clave_admin != ADMIN_CREATE_KEY:
                raise HTTPException(status_code=400, detail="Clave maestra de administración incorrecta")

        cursor.execute("SELECT id_usuario FROM usuarios WHERE email = %s", (data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        cursor.execute("SELECT id_usuario FROM usuarios WHERE numero_documento = %s", (data.numero_documento,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El número de documento ya está registrado")

        hashed = get_password_hash(data.contraseña)
        cursor.execute("""
            INSERT INTO usuarios (nombre, apellido, email, contrasea, rol, telefono, direccion,
                                  tipo_documento, numero_documento, created_by, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 1)
        """, (data.nombre, data.apellido, data.email, hashed, data.rol,
              data.telefono, data.direccion, data.tipo_documento, data.numero_documento,
              current_user["id_usuario"]))
        connection.commit()
        return {"message": "Usuario creado exitosamente", "id_usuario": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.get("/usuarios")
async def get_usuarios(current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        # Usuarios registrados por el administrador, su propia cuenta,
        # y las solicitudes de administrador pendientes de aprobación
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono, direccion,
                   rol, tipo_documento, numero_documento, is_active,
                   nombre_negocio, direccion_negocio, especialidad, anos_experiencia, created_at
            FROM usuarios
            WHERE created_by = %s OR id_usuario = %s OR (rol = 'admin' AND is_active = 0)
            ORDER BY (rol = 'admin' AND is_active = 0) DESC, nombre, apellido
        """, (current_user["id_usuario"], current_user["id_usuario"]))
        rows = cursor.fetchall()
        for row in rows:
            if row.get("created_at"):
                row["created_at"] = row["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.get("/usuarios/{usuario_id}")
async def get_usuario(usuario_id: int, current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono, direccion,
                   rol, tipo_documento, numero_documento, is_active, created_at
            FROM usuarios WHERE id_usuario = %s
        """, (usuario_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if user["id_usuario"] != current_user["id_usuario"] and user.get("created_by") != current_user["id_usuario"]:
            raise HTTPException(status_code=403, detail="No tienes permisos sobre este usuario")
        if user.get("created_at"):
            user["created_at"] = user["created_at"].strftime("%Y-%m-%d %H:%M:%S")
        return user
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.put("/usuarios/{usuario_id}")
async def update_usuario(usuario_id: int, data: UserUpdate, current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_usuario, rol, is_active, created_by FROM usuarios WHERE id_usuario = %s", (usuario_id,))
        target = cursor.fetchone()
        if not target:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        # Se permite gestionar: tu cuenta, tus usuarios y las solicitudes de admin pendientes
        is_pending_admin = target.get("rol") == "admin" and target.get("is_active") == 0
        if target["id_usuario"] != current_user["id_usuario"] and target.get("created_by") != current_user["id_usuario"] and not is_pending_admin:
            raise HTTPException(status_code=403, detail="No tienes permisos sobre este usuario")

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
async def delete_usuario(usuario_id: int, current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_usuario, rol, is_active, created_by FROM usuarios WHERE id_usuario = %s", (usuario_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if user["id_usuario"] == current_user["id_usuario"]:
            raise HTTPException(status_code=400, detail="No puedes desactivar tu propia cuenta")
        is_pending_admin = user.get("rol") == "admin" and user.get("is_active") == 0
        if user.get("created_by") != current_user["id_usuario"] and not is_pending_admin:
            raise HTTPException(status_code=403, detail="No tienes permisos sobre este usuario")

        if is_pending_admin:
            # Rechazo de solicitud de administrador pendiente: se elimina el registro
            cursor.execute("DELETE FROM usuarios WHERE id_usuario = %s", (usuario_id,))
            connection.commit()
            return {"message": "Solicitud de administrador rechazada"}
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
