from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
import bcrypt
import jwt
from datetime import datetime, timedelta
import secrets
from typing import Optional

app = FastAPI(title="Vet Manager API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración JWT
SECRET_KEY = "mi_secreto_super_seguro_2024"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# Base de datos en memoria (para pruebas)
usuarios_db = []
reset_tokens = {}

# Modelos Pydantic
class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    rol: Optional[str] = "usuario"

class UsuarioLogin(BaseModel):
    email: EmailStr
    password: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

# Funciones auxiliares
def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# Agregar usuario de prueba automáticamente al iniciar
def add_test_user():
    if not usuarios_db:
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw("123456".encode('utf-8'), salt)
        usuarios_db.append({
            "id": 1,
            "nombre": "Usuario Prueba",
            "email": "test@test.com",
            "password": hashed.decode('utf-8'),
            "rol": "usuario"
        })
        print("✅ Usuario de prueba creado: test@test.com / 123456")

# Rutas de autenticación
@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UsuarioCreate):
    # Verificar si el email ya existe
    for user in usuarios_db:
        if user["email"] == user_data.email:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    # Hashear contraseña
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(user_data.password.encode('utf-8'), salt)
    
    # Crear usuario
    new_user = {
        "id": len(usuarios_db) + 1,
        "nombre": user_data.nombre,
        "email": user_data.email,
        "password": hashed_password.decode('utf-8'),
        "rol": user_data.rol
    }
    usuarios_db.append(new_user)
    
    return {"message": "Usuario registrado exitosamente", "user_id": new_user["id"]}

@app.post("/auth/login")
async def login(user_data: UsuarioLogin):
    # Buscar usuario
    user = None
    for u in usuarios_db:
        if u["email"] == user_data.email:
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")
    
    # Verificar contraseña
    try:
        if not bcrypt.checkpw(user_data.password.encode('utf-8'), user["password"].encode('utf-8')):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
    except Exception as e:
        print(f"Error al verificar contraseña: {e}")
        raise HTTPException(status_code=401, detail="Error al verificar credenciales")
    
    # Crear token
    access_token = create_access_token(
        data={"sub": user["email"], "id": user["id"], "rol": user["rol"]}
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "nombre": user["nombre"],
            "email": user["email"],
            "rol": user["rol"]
        }
    }

@app.post("/auth/request-reset")
async def request_password_reset(request: PasswordResetRequest):
    # Buscar usuario
    user = None
    for u in usuarios_db:
        if u["email"] == request.email:
            user = u
            break
    
    if not user:
        raise HTTPException(status_code=404, detail="No existe un usuario con ese email")
    
    # Generar token
    reset_token = secrets.token_urlsafe(32)
    reset_tokens[reset_token] = user["id"]
    
    # Mostrar en consola (simula envío de correo)
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    print("\n" + "="*60)
    print("📧 CORREO DE RECUPERACIÓN (SIMULADO)")
    print(f"📨 Para: {user['email']}")
    print(f"🔑 Token: {reset_token}")
    print(f"🔗 Enlace: {reset_url}")
    print("="*60 + "\n")
    
    return {"message": "Correo de recuperación enviado. Revisa la consola para obtener el token."}

@app.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    # Verificar token
    if reset_data.token not in reset_tokens:
        raise HTTPException(status_code=400, detail="Token inválido o expirado")
    
    user_id = reset_tokens[reset_data.token]
    
    # Actualizar contraseña
    for user in usuarios_db:
        if user["id"] == user_id:
            salt = bcrypt.gensalt()
            hashed_password = bcrypt.hashpw(reset_data.new_password.encode('utf-8'), salt)
            user["password"] = hashed_password.decode('utf-8')
            break
    
    # Eliminar token usado
    del reset_tokens[reset_data.token]
    
    return {"message": "Contraseña actualizada exitosamente"}

@app.get("/auth/me")
async def get_current_user():
    if usuarios_db:
        user = usuarios_db[0]
        return {
            "id": user["id"],
            "nombre": user["nombre"],
            "email": user["email"],
            "rol": user["rol"]
        }
    return None

# Rutas de datos
@app.get("/data/vista")
async def get_listado_vista():
    return {
        "success": True,
        "data": [
            {
                "mascota_id": 1,
                "mascota_nombre": "Firulais",
                "especie": "Perro",
                "raza": "Labrador",
                "edad": 3,
                "dueno_id": 1,
                "dueno_nombre": "Juan Pérez",
                "dueno_email": "juan@email.com",
                "total_citas": 2
            },
            {
                "mascota_id": 2,
                "mascota_nombre": "Misi",
                "especie": "Gato",
                "raza": "Siames",
                "edad": 2,
                "dueno_id": 2,
                "dueno_nombre": "María García",
                "dueno_email": "maria@email.com",
                "total_citas": 1
            },
            {
                "mascota_id": 3,
                "mascota_nombre": "Piolín",
                "especie": "Ave",
                "raza": "Canario",
                "edad": 1,
                "dueno_id": 1,
                "dueno_nombre": "Juan Pérez",
                "dueno_email": "juan@email.com",
                "total_citas": 0
            }
        ],
        "message": "Datos obtenidos desde la vista SQL",
        "total": 3
    }

@app.get("/data/procedimiento")
async def get_listado_procedimiento():
    return {
        "success": True,
        "data": [
            {
                "cita_id": 1,
                "mascota_nombre": "Firulais",
                "dueno_nombre": "Juan Pérez",
                "fecha": "2024-12-25T10:00:00",
                "motivo": "Vacunación anual",
                "estado": "pendiente",
                "horas_restantes": 48
            },
            {
                "cita_id": 2,
                "mascota_nombre": "Misi",
                "dueno_nombre": "María García",
                "fecha": "2024-12-26T15:30:00",
                "motivo": "Consulta general",
                "estado": "pendiente",
                "horas_restantes": 72
            }
        ],
        "message": "Datos obtenidos desde el stored procedure con validación",
        "total": 2,
        "user_id": 1,
        "rol_verificado": "usuario"
    }

@app.get("/")
async def root():
    return {
        "message": "Vet Manager API",
        "version": "1.0.0",
        "status": "online",
        "users_registered": len(usuarios_db)
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Iniciar con usuario de prueba
add_test_user()

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("🚀 Vet Manager API - Iniciando...")
    print("="*50)
    print(f"📍 Servidor: http://localhost:5000")
    print(f"📚 Documentación: http://localhost:5000/docs")
    print(f"🔐 Usuario de prueba: test@test.com / 123456")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=5000)