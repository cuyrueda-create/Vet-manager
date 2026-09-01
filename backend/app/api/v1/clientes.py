# backend/app/api/v1/clientes.py
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from typing import Optional
from app.core.database import get_db_connection
from app.core.auth import get_current_user

router = APIRouter()

# ==================== MODELOS ====================

class ClienteCreate(BaseModel):
    nombre: str
    apellido: str
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None

class ClienteUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None

class ClienteResponse(BaseModel):
    id_cliente: int
    nombre: str
    apellido: str
    email: Optional[str]
    telefono: Optional[str]
    direccion: Optional[str]
    tipo_documento: Optional[str]
    numero_documento: Optional[str]
    is_active: bool

# ==================== ENDPOINTS ====================

@router.get("/")
async def get_clientes(current_user: dict = Depends(get_current_user)):
    """
    Obtener todos los clientes activos
    
    Returns:
        Lista de clientes
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        if current_user["rol"] in ("administrador", "recepcionista", "veterinario"):
            cursor.execute("""
                SELECT c.id_cliente, c.nombre, c.apellido, c.email, c.telefono, c.direccion,
                       c.tipo_documento, c.numero_documento, c.is_active, c.id_usuario,
                       (SELECT COUNT(*) FROM mascotas m WHERE m.id_cliente = c.id_cliente) AS num_mascotas
                FROM clientes c
                WHERE c.is_active = 1
                ORDER BY c.nombre, c.apellido
            """)
        else:
            cursor.execute("""
                SELECT c.id_cliente, c.nombre, c.apellido, c.email, c.telefono, c.direccion,
                       c.tipo_documento, c.numero_documento, c.is_active, c.id_usuario,
                       (SELECT COUNT(*) FROM mascotas m WHERE m.id_cliente = c.id_cliente) AS num_mascotas
                FROM clientes c
                WHERE c.is_active = 1 AND c.id_usuario = %s
                ORDER BY c.nombre, c.apellido
            """, (current_user["id_usuario"],))
        clientes = cursor.fetchall()
        return clientes
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_cliente(cliente: ClienteCreate, current_user: dict = Depends(get_current_user)):
    """
    Crear un nuevo cliente
    
    Args:
        cliente: Datos del cliente
        
    Returns:
        Cliente creado con su ID
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Verificar email único
        if cliente.email:
            cursor.execute("SELECT id_cliente FROM clientes WHERE email = %s", (cliente.email,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email ya registrado")
        
        # Verificar teléfono único
        if cliente.telefono:
            cursor.execute("SELECT id_cliente FROM clientes WHERE telefono = %s", (cliente.telefono,))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Teléfono ya registrado")
        
        # Insertar cliente
        cursor.execute("""
            INSERT INTO clientes (nombre, apellido, email, telefono, direccion, tipo_documento, numero_documento, id_usuario)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (cliente.nombre, cliente.apellido, cliente.email, cliente.telefono, 
              cliente.direccion, cliente.tipo_documento, cliente.numero_documento,
              current_user["id_usuario"]))
        
        connection.commit()
        cliente_id = cursor.lastrowid
        
        return {
            "message": "Cliente creado exitosamente",
            "id_cliente": cliente_id
        }
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.get("/{cliente_id}")
async def get_cliente(cliente_id: int, current_user: dict = Depends(get_current_user)):
    """
    Obtener un cliente por su ID
    
    Args:
        cliente_id: ID del cliente
        
    Returns:
        Datos del cliente
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT id_cliente, nombre, apellido, email, telefono, direccion,
                   tipo_documento, numero_documento, is_active, id_usuario
            FROM clientes
            WHERE id_cliente = %s
        """, (cliente_id,))
        
        cliente = cursor.fetchone()
        
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Un usuario solo puede ver los clientes que él registró (excepto admin, recepcionista, vet)
        if current_user["rol"] not in ("administrador", "recepcionista", "veterinario") and cliente.get("id_usuario") != current_user["id_usuario"]:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        return cliente
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.put("/{cliente_id}")
async def update_cliente(cliente_id: int, cliente: ClienteUpdate, current_user: dict = Depends(get_current_user)):
    """
    Actualizar un cliente existente
    
    Args:
        cliente_id: ID del cliente
        cliente: Datos a actualizar
        
    Returns:
        Mensaje de confirmación
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Verificar que el cliente existe
        cursor.execute("SELECT id_cliente, id_usuario FROM clientes WHERE id_cliente = %s", (cliente_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        # Un usuario solo puede actualizar los clientes que él registró (excepto admin, recepcionista, vet)
        if current_user["rol"] not in ("administrador", "recepcionista", "veterinario") and row.get("id_usuario") != current_user["id_usuario"]:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Construir query de actualización dinámica
        update_fields = []
        values = []
        
        if cliente.nombre is not None:
            update_fields.append("nombre = %s")
            values.append(cliente.nombre)
        
        if cliente.apellido is not None:
            update_fields.append("apellido = %s")
            values.append(cliente.apellido)
        
        if cliente.email is not None:
            # Verificar email único
            cursor.execute("SELECT id_cliente FROM clientes WHERE email = %s AND id_cliente != %s", 
                          (cliente.email, cliente_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email ya registrado por otro cliente")
            update_fields.append("email = %s")
            values.append(cliente.email)
        
        if cliente.telefono is not None:
            # Verificar teléfono único
            cursor.execute("SELECT id_cliente FROM clientes WHERE telefono = %s AND id_cliente != %s", 
                          (cliente.telefono, cliente_id))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Teléfono ya registrado por otro cliente")
            update_fields.append("telefono = %s")
            values.append(cliente.telefono)
        
        if cliente.direccion is not None:
            update_fields.append("direccion = %s")
            values.append(cliente.direccion)
        
        if cliente.tipo_documento is not None:
            update_fields.append("tipo_documento = %s")
            values.append(cliente.tipo_documento)
        
        if cliente.numero_documento is not None:
            update_fields.append("numero_documento = %s")
            values.append(cliente.numero_documento)
        
        if not update_fields:
            return {"message": "No se enviaron campos para actualizar"}
        
        # Ejecutar actualización
        values.append(cliente_id)
        query = f"UPDATE clientes SET {', '.join(update_fields)} WHERE id_cliente = %s"
        cursor.execute(query, values)
        connection.commit()
        
        return {"message": "Cliente actualizado exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.delete("/{cliente_id}")
async def delete_cliente(cliente_id: int, current_user: dict = Depends(get_current_user)):
    """
    Eliminar un cliente (soft delete)
    
    Args:
        cliente_id: ID del cliente
        
    Returns:
        Mensaje de confirmación
    """
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Verificar que el cliente existe
        cursor.execute("SELECT id_cliente, id_usuario, is_active FROM clientes WHERE id_cliente = %s", (cliente_id,))
        cliente = cursor.fetchone()
        
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        # Un usuario solo puede eliminar los clientes que él registró (excepto admin, recepcionista, vet)
        if current_user["rol"] not in ("administrador", "recepcionista", "veterinario") and cliente.get("id_usuario") != current_user["id_usuario"]:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        
        # Verificar si ya está eliminado
        if cliente.get("is_active") == 0:
            raise HTTPException(status_code=400, detail="El cliente ya está eliminado")
        
        # Eliminar las mascotas del cliente (con sus citas e historial clínico)
        cursor.execute("SELECT id_mascota FROM mascotas WHERE id_cliente = %s", (cliente_id,))
        for mascota in cursor.fetchall():
            mascota_id = mascota["id_mascota"]
            cursor.execute("SELECT id_cita FROM citas WHERE id_mascota = %s", (mascota_id,))
            for cita in cursor.fetchall():
                cita_id = cita["id_cita"]
                cursor.execute("DELETE FROM agenda WHERE id_cita = %s", (cita_id,))
                cursor.execute("UPDATE historial_clinico SET id_cita = NULL WHERE id_cita = %s", (cita_id,))
                cursor.execute("UPDATE facturas SET id_cita = NULL WHERE id_cita = %s", (cita_id,))
                cursor.execute("DELETE FROM citas WHERE id_cita = %s", (cita_id,))
            cursor.execute("DELETE FROM historial_clinico WHERE id_mascota = %s", (mascota_id,))
            cursor.execute("DELETE FROM mascotas WHERE id_mascota = %s", (mascota_id,))
        
        # Soft delete (actualizar is_active a 0)
        cursor.execute("UPDATE clientes SET is_active = 0 WHERE id_cliente = %s", (cliente_id,))
        connection.commit()
        
        return {"message": "Cliente eliminado correctamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()