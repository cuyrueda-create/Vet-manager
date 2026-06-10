from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from typing import Optional, List

# Esquemas para Usuario
class UsuarioCreate(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)
    rol: Optional[str] = "usuario"

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: str
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str = Field(..., min_length=6)

# Esquemas para Mascota
class MascotaResponse(BaseModel):
    id: int
    nombre: str
    especie: str
    raza: Optional[str]
    edad: Optional[int]
    dueno_id: int
    
    class Config:
        from_attributes = True

# Esquemas para Cita
class CitaResponse(BaseModel):
    id: int
    mascota_id: int
    mascota_nombre: Optional[str] = None
    fecha: datetime
    motivo: Optional[str]
    estado: str
    
    class Config:
        from_attributes = True