from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import timedelta
import secrets

from database import get_db
from models import Usuario
from schemas import (
    UsuarioCreate, UsuarioLogin, UsuarioResponse, 
    Token, PasswordResetRequest, PasswordReset
)
from auth import verify_password, get_password_hash, create_access_token, decode_token
from utils.email import send_reset_password_email

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# Configuración OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# Registrar usuario
@router.post("/register", response_model=dict, status_code=status.HTTP_201_CREATED)
async def register(user_data: UsuarioCreate, db: Session = Depends(get_db)):
    """Registrar un nuevo usuario"""
    
    # Verificar si el email ya existe
    existing_user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya está registrado"
        )
    
    # Crear nuevo usuario
    hashed_password = get_password_hash(user_data.password)
    new_user = Usuario(
        nombre=user_data.nombre,
        email=user_data.email,
        password=hashed_password,
        rol=user_data.rol
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return {"message": "Usuario registrado exitosamente", "user_id": new_user.id}

# Iniciar sesión
@router.post("/login", response_model=Token)
async def login(user_data: UsuarioLogin, db: Session = Depends(get_db)):
    """Iniciar sesión"""
    
    # Buscar usuario por email
    user = db.query(Usuario).filter(Usuario.email == user_data.email).first()
    
    if not user or not verify_password(user_data.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Crear token JWT
    access_token = create_access_token(
        data={"sub": user.email, "id": user.id, "rol": user.rol}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UsuarioResponse.model_validate(user)
    }

# Solicitar recuperación de contraseña
@router.post("/request-reset")
async def request_password_reset(request: PasswordResetRequest, db: Session = Depends(get_db)):
    """Solicitar recuperación de contraseña - envía correo"""
    
    # Buscar usuario
    user = db.query(Usuario).filter(Usuario.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No existe un usuario con ese email"
        )
    
    # Generar token de recuperación
    reset_token = secrets.token_urlsafe(32)
    
    # Guardar token en la base de datos
    user.reset_token = reset_token
    db.commit()
    
    # Enviar correo
    email_sent = await send_reset_password_email(
        to_email=user.email,
        nombre=user.nombre,
        reset_token=reset_token
    )
    
    if not email_sent:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error al enviar el correo de recuperación"
        )
    
    return {"message": "Correo de recuperación enviado exitosamente"}

# Restablecer contraseña
@router.post("/reset-password")
async def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """Restablecer contraseña con el token recibido"""
    
    # Buscar usuario por token
    user = db.query(Usuario).filter(Usuario.reset_token == reset_data.token).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Token inválido o expirado"
        )
    
    # Actualizar contraseña
    hashed_password = get_password_hash(reset_data.new_password)
    user.password = hashed_password
    user.reset_token = None  # Limpiar token
    db.commit()
    
    return {"message": "Contraseña actualizada exitosamente"}

# Obtener usuario actual (para validar token)
@router.get("/me", response_model=UsuarioResponse)
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """Obtener información del usuario actual"""
    
    payload = decode_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido"
        )
    
    email = payload.get("sub")
    user = db.query(Usuario).filter(Usuario.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )
    
    return user