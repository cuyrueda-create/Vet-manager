from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
import os
import re
import secrets
from datetime import datetime, timedelta
from passlib.context import CryptContext
from app.core.database import get_db_connection
from app.core.auth import require_admin
from app.core.config import EMAIL_CONFIG
from app.utils.email import send_verification_code_email

router = APIRouter(dependencies=[Depends(require_admin)])

pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# Clave maestra para crear la primera cuenta de administrador.
# Debe definirse en las variables de entorno (ver .env.example en la raíz).
# Si no está definida, la creación de administradores queda denegada (fail-closed).
ADMIN_CREATE_KEY = os.getenv("ADMIN_CREATE_KEY")

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
    nombre: str = Field(max_length=60)
    apellido: str = Field(max_length=60)
    email: EmailStr = Field(max_length=100)
    contraseña: str
    rol: str = "veterinario"
    telefono: str = Field(max_length=20)
    direccion: str = Field(max_length=150)
    tipo_documento: str = Field(max_length=20)
    numero_documento: str = Field(max_length=30)
    especialidad: Optional[str] = Field(default=None, max_length=50)
    clave_admin: Optional[str] = None

class UserUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, max_length=60)
    apellido: Optional[str] = Field(default=None, max_length=60)
    email: Optional[EmailStr] = Field(default=None, max_length=100)
    telefono: Optional[str] = Field(default=None, max_length=20)
    direccion: Optional[str] = Field(default=None, max_length=150)
    rol: Optional[str] = None
    especialidad: Optional[str] = Field(default=None, max_length=50)
    tipo_documento: Optional[str] = Field(default=None, max_length=20)
    numero_documento: Optional[str] = Field(default=None, max_length=30)
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
        if data.rol not in ("administrador", "veterinario", "recepcionista"):
            raise HTTPException(status_code=400, detail="Rol inválido")

        # Crear un administrador es un acto sensible: exige la clave maestra de administración
        if data.rol == "administrador":
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

        # El nuevo usuario debe verificar su correo con un código de 6 dígitos
        # antes de poder iniciar sesión (igual que en el registro público).
        con_correo = bool(EMAIL_CONFIG.get("user") and EMAIL_CONFIG.get("password"))
        codigo = f"{secrets.randbelow(1000000):06d}" if con_correo else None
        # NOSONAR: MySQL DATETIME es naive (UTC).
        expira = (datetime.utcnow() + timedelta(minutes=10)) if con_correo else None  # NOSONAR

        cursor.execute("""
            INSERT INTO usuarios (nombre, apellido, email, contrasea, rol, telefono, direccion,
                                  tipo_documento, numero_documento, especialidad, created_by, is_active,
                                  codigo_verificacion, codigo_expires)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (data.nombre, data.apellido, data.email, hashed, data.rol,
              data.telefono, data.direccion, data.tipo_documento, data.numero_documento,
              data.especialidad, current_user["id_usuario"], not con_correo, codigo, expira))
        connection.commit()

        mensaje = "Usuario creado exitosamente"
        if con_correo:
            enviado = send_verification_code_email(data.email, data.nombre, data.apellido, codigo)
            mensaje = (
                "Usuario creado. Recibirá un código de 6 dígitos por correo "
                "para activar su cuenta."
                if enviado else
                "Usuario creado (correo no disponible; cuenta activada directamente)."
            )
            if not enviado:
                cursor.execute("""
                    UPDATE usuarios SET codigo_verificacion = NULL, codigo_expires = NULL,
                                        is_active = TRUE WHERE email = %s
                """, (data.email,))
                connection.commit()

        return {"message": mensaje, "id_usuario": cursor.lastrowid}
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
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono, direccion,
                   rol, tipo_documento, numero_documento, is_active,
                   nombre_negocio, direccion_negocio, especialidad, anos_experiencia, created_at
            FROM usuarios
            WHERE rol = 'usuario'
               OR (rol IN ('recepcionista', 'veterinario') AND is_active = FALSE)
            ORDER BY is_active, nombre, apellido
        """)
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

@router.get("/bloc")
async def get_bloc(current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, rol, is_active,
                   telefono, tipo_documento, numero_documento, created_at
            FROM usuarios
            ORDER BY
                CASE rol
                    WHEN 'administrador' THEN 1
                    WHEN 'veterinario' THEN 2
                    WHEN 'recepcionista' THEN 3
                    WHEN 'usuario' THEN 4
                    ELSE 5
                END, nombre, apellido
        """)
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
        is_pending_admin = target.get("rol") == "administrador" and target.get("is_active") == 0
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
        is_pending_admin = user.get("rol") == "administrador" and user.get("is_active") == 0
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


class ServicioCreate(BaseModel):
    nombre: str = Field(max_length=80)
    descripcion: str = Field(default="", max_length=500)
    precio: float = Field(gt=0)
    duracion: Optional[int] = Field(default=None, ge=1, le=480)


class ServicioUpdate(BaseModel):
    nombre: Optional[str] = Field(default=None, max_length=80)
    descripcion: Optional[str] = Field(default=None, max_length=500)
    precio: Optional[float] = Field(default=None, gt=0)
    duracion: Optional[int] = Field(default=None, ge=1, le=480)
    activo: Optional[bool] = None


@router.get("/servicios")
async def get_servicios(current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM servicios ORDER BY activo DESC, nombre")
        return cursor.fetchall()
    finally:
        cursor.close(); connection.close()


@router.post("/servicios", status_code=status.HTTP_201_CREATED)
async def create_servicio(data: ServicioCreate, current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_servicio FROM servicios WHERE nombre = %s", (data.nombre,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Ya existe un servicio con ese nombre")
        cursor.execute(
            "INSERT INTO servicios (nombre, descripcion, precio, duracion, activo) "
            "VALUES (%s, %s, %s, %s, TRUE)",
            (data.nombre, data.descripcion, data.precio, data.duracion),
        )
        connection.commit()
        return {"message": "Servicio creado exitosamente", "id_servicio": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close(); connection.close()


@router.put("/servicios/{servicio_id}")
async def update_servicio(servicio_id: int, data: ServicioUpdate, current_user: dict = Depends(require_admin)):
    cambios = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
    if not cambios:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_servicio FROM servicios WHERE id_servicio = %s", (servicio_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        sql = "UPDATE servicios SET " + ", ".join(f"{c} = %s" for c in cambios) + " WHERE id_servicio = %s"
        cursor.execute(sql, (*cambios.values(), servicio_id))
        connection.commit()
        return {"message": "Servicio actualizado exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close(); connection.close()


@router.delete("/servicios/{servicio_id}")
async def desactivar_servicio(servicio_id: int, current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("UPDATE servicios SET activo = FALSE WHERE id_servicio = %s", (servicio_id,))
        if not cursor.rowcount:
            raise HTTPException(status_code=404, detail="Servicio no encontrado")
        connection.commit()
        return {"message": "Servicio desactivado"}
    finally:
        cursor.close(); connection.close()


@router.get("/informes")
async def get_informes(current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    cursor = connection.cursor(dictionary=True)
    try:
        result = {}

        cursor.execute("SELECT COUNT(*) as total FROM usuarios")
        result["total_usuarios"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM usuarios WHERE is_active = 1")
        result["usuarios_activos"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM usuarios WHERE is_active = 0")
        result["usuarios_inactivos"] = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) as total FROM clientes")
        result["total_clientes"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM mascotas")
        result["total_mascotas"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM citas")
        result["total_citas"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM citas WHERE estado = 'pendiente' OR estado = 'programada'")
        result["citas_pendientes"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM citas WHERE estado = 'completada' OR estado = 'realizada'")
        result["citas_completadas"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM citas WHERE estado = 'cancelada'")
        result["citas_canceladas"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM facturas")
        result["total_facturas"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COALESCE(SUM(total), 0) as total FROM facturas WHERE estado = 'pagada'")
        result["ingresos_totales"] = float(cursor.fetchone()["total"])
        cursor.execute("SELECT COUNT(*) as total FROM servicios")
        result["total_servicios"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) as total FROM medicamentos")
        result["total_medicamentos"] = cursor.fetchone()["total"]

        cursor.execute("SELECT rol, COUNT(*) as total FROM usuarios GROUP BY rol")
        result["usuarios_por_rol"] = {row["rol"]: row["total"] for row in cursor.fetchall()}

        cursor.execute("""
            SELECT DATE_FORMAT(fecha, '%Y-%m') as mes, COUNT(*) as total
            FROM citas
            WHERE fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY mes ORDER BY mes
        """)
        result["citas_por_mes"] = cursor.fetchall()

        cursor.execute("""
            SELECT especie, COUNT(*) as total FROM mascotas
            GROUP BY especie ORDER BY total DESC
        """)
        result["mascotas_por_especie"] = cursor.fetchall()

        cursor.execute("""
            SELECT CONCAT(u.nombre, ' ', u.apellido) as veterinario, COUNT(ct.id_cita) as total_citas
            FROM usuarios u
            INNER JOIN citas ct ON u.id_usuario = ct.id_usuario_vet
            WHERE u.rol = 'veterinario'
            GROUP BY u.id_usuario, u.nombre, u.apellido
            ORDER BY total_citas DESC LIMIT 5
        """)
        result["top_veterinarios"] = cursor.fetchall()

        cursor.execute("""
            SELECT CONCAT(c.nombre, ' ', c.apellido) as cliente, COUNT(m.id_mascota) as total_mascotas
            FROM clientes c
            INNER JOIN mascotas m ON c.id_cliente = m.id_cliente
            GROUP BY c.id_cliente, c.nombre, c.apellido
            ORDER BY total_mascotas DESC LIMIT 5
        """)
        result["top_clientes"] = cursor.fetchall()

        cursor.execute("""
            SELECT ct.fecha, ct.notas as motivo, ct.estado,
                   m.nombre as mascota,
                   CONCAT(v.nombre, ' ', v.apellido) as veterinario
            FROM citas ct
            LEFT JOIN mascotas m ON ct.id_mascota = m.id_mascota
            LEFT JOIN usuarios v ON ct.id_usuario_vet = v.id_usuario
            ORDER BY ct.fecha DESC LIMIT 10
        """)
        result["actividad_reciente"] = cursor.fetchall()
        for row in result["actividad_reciente"]:
            if row.get("fecha"):
                row["fecha"] = row["fecha"].strftime("%Y-%m-%d %H:%M")

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()
