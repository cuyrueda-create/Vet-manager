from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.security import decode_token
from app.core.database import get_db_connection

security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido o expirado")
    
    user_id = payload.get("id")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token inválido")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a BD")
    
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id_usuario, nombre, apellido, email, rol, tipo_documento, numero_documento, is_active FROM usuarios WHERE id_usuario = %s",
            (user_id,)
        )
        user = cursor.fetchone()
        if not user or not user.get("is_active"):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Usuario no encontrado o inactivo")
        return user
    finally:
        cursor.close()
        connection.close()

async def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "administrador":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requieren permisos de administrador")
    return current_user

async def require_recepcionista(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] != "recepcionista":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requieren permisos de recepcionista")
    return current_user

async def require_vet_or_recepcionista(current_user: dict = Depends(get_current_user)):
    if current_user["rol"] not in ("veterinario", "recepcionista", "administrador"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requieren permisos de veterinario o recepcionista")
    return current_user

async def require_staff(current_user: dict = Depends(get_current_user)):
    """Admin, veterinario o recepcionista"""
    if current_user["rol"] not in ("administrador", "veterinario", "recepcionista"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Se requieren permisos de personal")
    return current_user
