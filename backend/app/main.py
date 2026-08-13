# app/main.py
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import Optional
import mysql.connector
from mysql.connector import Error
from passlib.context import CryptContext
import jwt
from datetime import datetime, timedelta
import secrets
import os
from dotenv import load_dotenv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# ==================== IMPORTAR ROUTERS ====================
from app.api.v1.clientes import router as clientes_router
from app.api.v1.admin import router as admin_router

# ==================== IMPORTAR DEPENDENCIAS ====================
from app.core.auth import get_current_user, require_admin

# ==================== IMPORTAR CONFIGURACIÓN ====================
from app.core.config import DB_CONFIG, EMAIL_CONFIG, SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
from app.core.database import get_db_connection

load_dotenv()

# ==================== CONFIGURACIÓN DE LA APLICACIÓN ====================

app = FastAPI(
    title="Vet Manager API",
    version="1.0.0",
    description="Sistema de gestión veterinaria con FastAPI"
)

def migrate_usuarios_table():
    """Agrega columnas faltantes a la tabla usuarios"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No se pudo conectar a la BD para migración")
        return
    cursor = conn.cursor()
    migrations = [
        "ALTER TABLE usuarios ADD COLUMN telefono VARCHAR(20) NULL",
        "ALTER TABLE usuarios ADD COLUMN direccion VARCHAR(150) NULL",
        "ALTER TABLE usuarios ADD COLUMN confirm_token VARCHAR(255) NULL",
        "ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(255) NULL",
        "ALTER TABLE usuarios ADD COLUMN reset_token_expires DATETIME NULL",
        "ALTER TABLE usuarios ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP",
        "ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
        "ALTER TABLE mascotas ADD COLUMN id_usuario INT NULL",
    ]
    for sql in migrations:
        try:
            cursor.execute(sql)
            print(f"✅ Columna agregada: {sql.split()[3]}")
        except:
            pass
    conn.commit()
    cursor.close()
    conn.close()

def migrate_clientes_table():
    """Agrega columnas faltantes a la tabla clientes (email, is_active, id_usuario)"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No se pudo conectar a la BD para migración de clientes")
        return
    cursor = conn.cursor()
    migrations = [
        "ALTER TABLE clientes ADD COLUMN email VARCHAR(100) NULL",
        "ALTER TABLE clientes ADD COLUMN is_active BOOLEAN DEFAULT TRUE",
        "ALTER TABLE clientes ADD COLUMN id_usuario INT NULL",
        "ALTER TABLE clientes ADD UNIQUE INDEX uq_clientes_email (email)",
        "ALTER TABLE clientes ADD UNIQUE INDEX uq_clientes_telefono (telefono)",
    ]
    for sql in migrations:
        try:
            cursor.execute(sql)
            print(f"✅ Columna agregada: {sql.split()[3]}")
        except:
            pass
    conn.commit()
    cursor.close()
    conn.close()

def migrate_citas_table():
    """Agrega columna de creador a la tabla citas"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No se pudo conectar a la BD para migración de citas")
        return
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE citas ADD COLUMN id_usuario INT NULL")
        print("✅ Columna agregada: id_usuario (citas)")
    except:
        pass
    conn.commit()
    cursor.close()
    conn.close()

def hash_existing_passwords():
    """Convierte contraseñas en texto plano a pbkdf2_sha256"""
    conn = get_db_connection()
    if not conn:
        return
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_usuario, contrasea FROM usuarios")
        users = cursor.fetchall()
        for user in users:
            pwd = user["contrasea"]
            if pwd and not pwd.startswith("$pbkdf2-sha256$"):
                hashed = get_password_hash(pwd)
                cursor.execute("UPDATE usuarios SET contrasea = %s WHERE id_usuario = %s", (hashed, user["id_usuario"]))
        conn.commit()
        print(f"✅ {len(users)} contraseñas migradas a hash")
    except Exception as e:
        print(f"⚠️ Error migrando contraseñas: {e}")
    finally:
        cursor.close()
        conn.close()

@app.on_event("startup")
def startup():
    print("🔧 Ejecutando migraciones...")
    migrate_usuarios_table()
    migrate_clientes_table()
    migrate_citas_table()
    hash_existing_passwords()
    print("✅ Migraciones completadas")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==================== CONFIGURACIONES ====================

# Configuración de hashing con passlib (usando pbkdf2_sha256 para evitar límite de 72 caracteres)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")

# ==================== MODELOS ====================

class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
    telefono: str = ""
    direccion: str = ""
    contraseña: str
    rol: str = "asistente"
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None

class UsuarioLogin(BaseModel):
    email: EmailStr
    contraseña: str

class UsuarioResponse(BaseModel):
    id_usuario: int
    nombre: str
    apellido: str
    email: str
    rol: str
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse

class PasswordResetRequest(BaseModel):
    email: EmailStr

class PasswordReset(BaseModel):
    token: str
    new_password: str

class UsuarioUpdateMe(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    email: Optional[EmailStr] = None
    telefono: Optional[str] = None
    direccion: Optional[str] = None
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None

class ChangePassword(BaseModel):
    contraseña_actual: str
    nueva_contraseña: str

class MascotaCreate(BaseModel):
    id_cliente: int
    nombre: str
    especie: str
    raza: Optional[str] = None
    sexo: str = "Desconocido"
    edad: Optional[int] = None
    peso: Optional[float] = None
    observaciones: Optional[str] = None

# ==================== FUNCIONES ====================

def verify_password(plain_password, hashed_password):
    """Verifica una contraseña contra su hash usando pbkdf2_sha256"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    """
    Genera un hash de contraseña usando pbkdf2_sha256
    
    Args:
        password: Contraseña en texto plano
        
    Returns:
        str: Hash de la contraseña
    """
    # Validar que la contraseña no esté vacía
    if not password:
        raise ValueError("La contraseña no puede estar vacía")
    
    # Asegurar que es string
    password = str(password)
    
    # Generar hash
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except:
        return None

def send_reset_email(to_email, nombre, apellido, reset_token):
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Recuperación de Contraseña - Vet Manager</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #0066b3 0%, #004c8c 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
            }}
            .header p {{
                margin: 10px 0 0;
                opacity: 0.9;
            }}
            .content {{
                padding: 30px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #0066b3 0%, #004c8c 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .info {{
                background: #e8f0fe;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-size: 14px;
                color: #0066b3;
            }}
            .footer {{
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐾 Vet Manager</h1>
                <p>Sistema de Gestion Veterinaria</p>
            </div>
            <div class="content">
                <h2>Hola, {nombre} {apellido}!</h2>
                <p>Recibimos una solicitud para restablecer la contrasena de tu cuenta en Vet Manager.</p>
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Restablecer Contrasena</a>
                </div>
                <div class="info">
                    <strong>⚠️ Importante:</strong><br>
                    Este enlace expirara en <strong>1 hora</strong>.
                </div>
                <p style="word-break: break-all; color: #666; font-size: 12px;">{reset_url}</p>
            </div>
            <div class="footer">
                <p>Vet Manager - Sistema de Gestion Veterinaria</p>
                <p>© 2024 - Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
Hola {nombre} {apellido},

Recibimos una solicitud para restablecer la contrasena de tu cuenta en Vet Manager.

Para restablecer tu contrasena, visita el siguiente enlace:
{reset_url}

Este enlace expirara en 1 hora.

---
Vet Manager - Sistema de Gestion Veterinaria
"""
    
    message = MIMEMultipart("alternative")
    message["Subject"] = "Recuperacion de contrasena - Vet Manager"
    message["From"] = f"Vet Manager <{EMAIL_CONFIG['user']}>"
    message["To"] = to_email
    
    message.attach(MIMEText(text_content, "plain", "utf-8"))
    message.attach(MIMEText(html_content, "html", "utf-8"))
    
    try:
        with smtplib.SMTP(EMAIL_CONFIG['host'], EMAIL_CONFIG['port'], timeout=15) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['user'], EMAIL_CONFIG['password'])
            server.send_message(message)
        print(f"✅ Correo enviado exitosamente a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo: {e}")
        return False

def send_confirmation_email(to_email, nombre, apellido, confirm_token):
    confirm_url = f"http://localhost:5173/confirmar-email?token={confirm_token}"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Confirma tu cuenta - Vet Manager</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background: white;
                border-radius: 20px;
                overflow: hidden;
                box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #0066b3 0%, #004c8c 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{ margin: 0; font-size: 28px; }}
            .header p {{ margin: 10px 0 0; opacity: 0.9; }}
            .content {{ padding: 30px; }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #0066b3 0%, #004c8c 100%);
                color: white;
                text-decoration: none;
                border-radius: 8px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .info {{
                background: #e8f0fe;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-size: 14px;
                color: #0066b3;
            }}
            .footer {{
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐾 Vet Manager</h1>
                <p>Sistema de Gestion Veterinaria</p>
            </div>
            <div class="content">
                <h2>Bienvenido, {nombre} {apellido}!</h2>
                <p>Gracias por registrarte en Vet Manager. Confirma tu direccion de correo haciendo clic en el boton:</p>
                <div style="text-align: center;">
                    <a href="{confirm_url}" class="button">Confirmar mi cuenta</a>
                </div>
                <div class="info">
                    <strong>⚠️ Importante:</strong><br>
                    Este enlace expirara en <strong>24 horas</strong>. Si no creaste esta cuenta, ignora este correo.
                </div>
            </div>
            <div class="footer">
                <p>Vet Manager - Sistema de Gestion Veterinaria</p>
                <p>© 2024 - Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """

    text_content = f"""
Hola {nombre} {apellido},

Gracias por registrarte en Vet Manager.

Confirma tu direccion de correo visitando el siguiente enlace:
{confirm_url}

Este enlace expirara en 24 horas.

---
Vet Manager - Sistema de Gestion Veterinaria
"""

    message = MIMEMultipart("alternative")
    message["Subject"] = "Confirma tu cuenta - Vet Manager"
    message["From"] = f"Vet Manager <{EMAIL_CONFIG['user']}>"
    message["To"] = to_email

    message.attach(MIMEText(text_content, "plain", "utf-8"))
    message.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        with smtplib.SMTP(EMAIL_CONFIG['host'], EMAIL_CONFIG['port'], timeout=15) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['user'], EMAIL_CONFIG['password'])
            server.send_message(message)
        print(f"✅ Correo de confirmacion enviado a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo de confirmacion: {e}")
        return False

# ==================== ENDPOINTS ====================

@app.get("/")
async def root():
    conn = get_db_connection()
    db_status = "conectada" if conn else "error"
    if conn:
        conn.close()
    return {
        "message": "Vet Manager API",
        "version": "1.0.0",
        "status": "online",
        "database": db_status
    }

@app.get("/health")
async def health_check():
    conn = get_db_connection()
    db_status = "healthy" if conn else "unhealthy"
    if conn:
        conn.close()
    return {"status": "healthy", "database": "healthy"}

# ==================== AUTENTICACIÓN ====================

@app.post("/auth/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UsuarioCreate):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a base de datos")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Verificar si el email ya existe
        cursor.execute("SELECT id_usuario FROM usuarios WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        
        # Validar que la contraseña no esté vacía
        if not user_data.contraseña or len(user_data.contraseña) < 8:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
        
        # Hashear contraseña
        hashed_password = get_password_hash(user_data.contraseña)
        
        # Generar token de confirmación (expira en 24h)
        confirm_token = secrets.token_urlsafe(32)
        confirm_token_expires = datetime.utcnow() + timedelta(hours=24)
        
        # Insertar usuario - COLUMNA: contrasea (sin ñ y sin tilde)
        # El rol siempre es 'asistente' en el registro público: los roles
        # admin/veterinario solo se asignan desde el módulo de administración
        cursor.execute("""
            INSERT INTO usuarios (nombre, apellido, email, telefono, direccion, contrasea, rol, tipo_documento, numero_documento, confirm_token, reset_token_expires)
            VALUES (%s, %s, %s, %s, %s, %s, 'asistente', %s, %s, %s, %s)
        """, (user_data.nombre, user_data.apellido, user_data.email, user_data.telefono, 
              user_data.direccion, hashed_password, 
              user_data.tipo_documento, 
              user_data.numero_documento, confirm_token, confirm_token_expires))
        
        connection.commit()
        user_id = cursor.lastrowid

        # Enviar correo de confirmación
        if EMAIL_CONFIG['user'] and EMAIL_CONFIG['password']:
            email_sent = send_confirmation_email(
                to_email=user_data.email,
                nombre=user_data.nombre,
                apellido=user_data.apellido,
                confirm_token=confirm_token
            )
            if email_sent:
                return {"message": "Registro exitoso. Revisa tu correo para confirmar tu cuenta.", "user_id": user_id}
            else:
                confirm_url = f"http://localhost:5173/confirmar-email?token={confirm_token}"
                return {"message": f"Registro exitoso. Error al enviar correo. Token: {confirm_url}", "user_id": user_id}
        else:
            print("\n" + "="*60)
            print("⚠️ CORREO NO CONFIGURADO")
            print(f"🔗 Token de confirmación: {confirm_token}")
            print("="*60 + "\n")
            return {"message": "Registro exitoso. Revisa la consola para el token de confirmación.", "user_id": user_id}
        
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar usuario: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/auth/login")
async def login(user_data: UsuarioLogin):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a base de datos")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, contrasea, rol, tipo_documento, numero_documento, confirm_token
            FROM usuarios WHERE email = %s
        """, (user_data.email,))
        
        user = cursor.fetchone()
        
        if not user or not verify_password(user_data.contraseña, user["contrasea"]):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
        # Verificar si el email está confirmado
        if user.get("confirm_token"):
            raise HTTPException(status_code=403, detail="Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.")
        
        access_token = create_access_token(
            data={"sub": user["email"], "id": user["id_usuario"], "rol": user["rol"]}
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id_usuario": user["id_usuario"],
                "nombre": user["nombre"],
                "apellido": user["apellido"],
                "email": user["email"],
                "rol": user["rol"],
                "tipo_documento": user["tipo_documento"],
                "numero_documento": user["numero_documento"]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al iniciar sesión: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a base de datos")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono, direccion, rol,
                   tipo_documento, numero_documento, is_active
            FROM usuarios WHERE id_usuario = %s
        """, (current_user["id_usuario"],))
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

@app.put("/auth/me")
async def update_me(data: UsuarioUpdateMe, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a base de datos")

    cursor = connection.cursor(dictionary=True)

    try:
        fields = []
        values = []

        if data.nombre is not None:
            fields.append("nombre = %s")
            values.append(data.nombre)

        if data.apellido is not None:
            fields.append("apellido = %s")
            values.append(data.apellido)

        if data.email is not None:
            cursor.execute("SELECT id_usuario FROM usuarios WHERE email = %s AND id_usuario != %s",
                           (data.email, current_user["id_usuario"]))
            if cursor.fetchone():
                raise HTTPException(status_code=400, detail="Email ya registrado por otro usuario")
            fields.append("email = %s")
            values.append(data.email)

        if data.telefono is not None:
            fields.append("telefono = %s")
            values.append(data.telefono)

        if data.direccion is not None:
            fields.append("direccion = %s")
            values.append(data.direccion)

        if data.tipo_documento is not None:
            fields.append("tipo_documento = %s")
            values.append(data.tipo_documento)

        if data.numero_documento is not None:
            fields.append("numero_documento = %s")
            values.append(data.numero_documento)

        if not fields:
            return {"message": "No se enviaron campos para actualizar", "user": current_user}

        values.append(current_user["id_usuario"])
        cursor.execute(f"UPDATE usuarios SET {', '.join(fields)} WHERE id_usuario = %s", values)
        connection.commit()

        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono, direccion, rol,
                   tipo_documento, numero_documento, is_active
            FROM usuarios WHERE id_usuario = %s
        """, (current_user["id_usuario"],))
        user = cursor.fetchone()

        return {"message": "Perfil actualizado exitosamente", "user": user}

    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/auth/change-password")
async def change_password(data: ChangePassword, current_user: dict = Depends(get_current_user)):
    if not data.nueva_contraseña or len(data.nueva_contraseña) < 8:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 8 caracteres")

    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a base de datos")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT contrasea FROM usuarios WHERE id_usuario = %s", (current_user["id_usuario"],))
        user = cursor.fetchone()
        if not user or not verify_password(data.contraseña_actual, user["contrasea"]):
            raise HTTPException(status_code=400, detail="La contraseña actual es incorrecta")

        hashed = get_password_hash(data.nueva_contraseña)
        cursor.execute("UPDATE usuarios SET contrasea = %s WHERE id_usuario = %s",
                       (hashed, current_user["id_usuario"]))
        connection.commit()
        return {"message": "Contraseña actualizada exitosamente"}

    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/auth/request-reset")
async def request_password_reset(request: PasswordResetRequest):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a base de datos")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT id_usuario, nombre, apellido, email FROM usuarios WHERE email = %s", (request.email,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="No existe un usuario con ese email")
        
        reset_token = secrets.token_urlsafe(32)
        
        # Agregar columna reset_token si no existe
        try:
            cursor.execute("ALTER TABLE usuarios ADD COLUMN reset_token VARCHAR(255) NULL")
        except:
            pass
        
        cursor.execute("UPDATE usuarios SET reset_token = %s WHERE id_usuario = %s", (reset_token, user["id_usuario"]))
        connection.commit()
        
        # Verificar configuración de correo
        if not EMAIL_CONFIG['user'] or not EMAIL_CONFIG['password']:
            print("\n" + "="*60)
            print("⚠️ CONFIGURACIÓN DE CORREO NO COMPLETA")
            print("Agrega EMAIL_USER y EMAIL_PASSWORD en el archivo .env")
            print(f"🔗 Enlace manual: http://localhost:5173/reset-password?token={reset_token}")
            print("="*60 + "\n")
            return {"message": "Correo no configurado. Revisa la consola para obtener el enlace."}
        
        # Enviar correo real
        email_sent = send_reset_email(
            to_email=user["email"],
            nombre=user["nombre"],
            apellido=user["apellido"],
            reset_token=reset_token
        )
        
        reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
        print("\n" + "="*60)
        print("🔗 ENLACE DE RECUPERACIÓN:")
        print(f"{reset_url}")
        print("="*60 + "\n")

        if email_sent:
            return {"message": f"Correo enviado. Si no llega, usa este enlace: {reset_url}"}
        else:
            return {"message": f"Error al enviar correo. Usa este enlace manualmente: {reset_url}"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/auth/confirm-email")
async def confirm_email(data: dict):
    token = data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token requerido")
    
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT id_usuario, reset_token_expires FROM usuarios WHERE confirm_token = %s", (token,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=400, detail="Token inválido o expirado")
        
        # Verificar expiración
        expires = user.get("reset_token_expires")
        if expires and expires < datetime.utcnow():
            raise HTTPException(status_code=400, detail="El token de confirmación ha expirado. Solicita un nuevo registro.")
        
        cursor.execute("UPDATE usuarios SET confirm_token = NULL, reset_token_expires = NULL, is_active = TRUE WHERE id_usuario = %s", (user["id_usuario"],))
        connection.commit()
        
        return {"message": "Cuenta confirmada exitosamente. Ya puedes iniciar sesión."}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/auth/reset-password")
async def reset_password(reset_data: PasswordReset):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        cursor.execute("SELECT id_usuario FROM usuarios WHERE reset_token = %s", (reset_data.token,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=400, detail="Token inválido o expirado")
        
        hashed_password = get_password_hash(reset_data.new_password)
        cursor.execute("UPDATE usuarios SET contrasea = %s, reset_token = NULL WHERE id_usuario = %s", 
                      (hashed_password, user["id_usuario"]))
        connection.commit()
        
        return {"message": "Contraseña actualizada exitosamente"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ==================== RUTAS DE DATOS ====================

@app.get("/data/vista")
async def get_listado_vista(current_user: dict = Depends(get_current_user)):
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
        
        if current_user["rol"] == "admin":
            cursor.execute("SELECT * FROM vista_mascotas_clientes")
        else:
            cursor.execute("SELECT * FROM vista_mascotas_clientes WHERE id_usuario = %s", (current_user["id_usuario"],))
        data = cursor.fetchall()
        
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

@app.get("/data/procedimiento")
async def get_listado_procedimiento(current_user: dict = Depends(get_current_user)):
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
        
        # Los usuarios solo ven las citas que les corresponden:
        # veterinario -> las asignadas, asistente -> las que creó
        if current_user["rol"] != "admin":
            if current_user["rol"] == "veterinario":
                cursor.execute("SELECT id_cita FROM citas WHERE id_usuario_vet = %s", (current_user["id_usuario"],))
            else:
                cursor.execute("SELECT id_cita FROM citas WHERE id_usuario = %s", (current_user["id_usuario"],))
            allowed = {row["id_cita"] for row in cursor.fetchall()}
            data = [row for row in data if row.get("id_cita") in allowed]
        
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

@app.get("/users")
async def get_users(current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")

    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario, nombre, apellido, email, rol, is_active FROM usuarios")
    users = cursor.fetchall()
    cursor.close()
    connection.close()

    return users

# ==================== DASHBOARD STATS ====================

@app.get("/api/stats")
async def get_stats(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        stats = {}
        is_admin = current_user["rol"] == "admin"

        if is_admin:
            cursor.execute("SELECT COUNT(*) AS total FROM clientes")
        else:
            cursor.execute("SELECT COUNT(*) AS total FROM clientes WHERE id_usuario = %s", (current_user["id_usuario"],))
        stats["clientes"] = cursor.fetchone()["total"]

        if is_admin:
            cursor.execute("SELECT COUNT(*) AS total FROM mascotas")
        else:
            cursor.execute("SELECT COUNT(*) AS total FROM mascotas WHERE id_usuario = %s", (current_user["id_usuario"],))
        stats["mascotas"] = cursor.fetchone()["total"]

        if current_user["rol"] == "veterinario":
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario_vet = %s", (current_user["id_usuario"],))
            stats["citas"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario_vet = %s AND estado = 'programada'", (current_user["id_usuario"],))
            stats["citas_pendientes"] = cursor.fetchone()["total"]
            cursor.execute("""
                SELECT COUNT(*) AS total FROM citas 
                WHERE id_usuario_vet = %s AND estado = 'programada' AND fecha >= CURDATE()
            """, (current_user["id_usuario"],))
            stats["citas_hoy"] = cursor.fetchone()["total"]
        elif current_user["rol"] == "asistente":
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario = %s", (current_user["id_usuario"],))
            stats["citas"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario = %s AND estado = 'programada'", (current_user["id_usuario"],))
            stats["citas_pendientes"] = cursor.fetchone()["total"]
            cursor.execute("""
                SELECT COUNT(*) AS total FROM citas 
                WHERE id_usuario = %s AND estado = 'programada' AND fecha >= CURDATE()
            """, (current_user["id_usuario"],))
            stats["citas_hoy"] = cursor.fetchone()["total"]
        else:
            cursor.execute("SELECT COUNT(*) AS total FROM citas")
            stats["citas"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE estado = 'programada'")
            stats["citas_pendientes"] = cursor.fetchone()["total"]
            cursor.execute("""
                SELECT COUNT(*) AS total FROM citas 
                WHERE estado = 'programada' AND fecha >= CURDATE()
            """)
            stats["citas_hoy"] = cursor.fetchone()["total"]

        cursor.execute("SELECT COUNT(*) AS total FROM servicios")
        stats["servicios"] = cursor.fetchone()["total"]
        cursor.execute("SELECT COUNT(*) AS total FROM usuarios")
        stats["usuarios"] = cursor.fetchone()["total"]
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/citas")
async def get_citas(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        if current_user["rol"] == "veterinario":
            cursor.execute("""
                SELECT c.id_cita,
                       DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
                       TIME_FORMAT(c.hora, '%H:%i') AS hora,
                       c.estado,
                       m.id_mascota, m.nombre AS mascota_nombre, m.especie,
                       cl.id_cliente, cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido,
                       s.id_servicio, s.nombre AS servicio_nombre, s.precio,
                       u.id_usuario AS id_veterinario, u.nombre AS vet_nombre, u.apellido AS vet_apellido,
                       con.id_consultorio, con.nombre AS consultorio_nombre
                FROM citas c
                INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
                INNER JOIN clientes cl ON m.id_cliente = cl.id_cliente
                INNER JOIN servicios s ON c.id_servicio = s.id_servicio
                INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
                INNER JOIN consultorio con ON c.id_consultorio = con.id_consultorio
                WHERE c.id_usuario_vet = %s
                ORDER BY c.fecha DESC, c.hora DESC
            """, (current_user["id_usuario"],))
        elif current_user["rol"] == "asistente":
            cursor.execute("""
                SELECT c.id_cita,
                       DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
                       TIME_FORMAT(c.hora, '%H:%i') AS hora,
                       c.estado,
                       m.id_mascota, m.nombre AS mascota_nombre, m.especie,
                       cl.id_cliente, cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido,
                       s.id_servicio, s.nombre AS servicio_nombre, s.precio,
                       u.id_usuario AS id_veterinario, u.nombre AS vet_nombre, u.apellido AS vet_apellido,
                       con.id_consultorio, con.nombre AS consultorio_nombre
                FROM citas c
                INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
                INNER JOIN clientes cl ON m.id_cliente = cl.id_cliente
                INNER JOIN servicios s ON c.id_servicio = s.id_servicio
                INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
                INNER JOIN consultorio con ON c.id_consultorio = con.id_consultorio
                WHERE c.id_usuario = %s
                ORDER BY c.fecha DESC, c.hora DESC
            """, (current_user["id_usuario"],))
        else:
            cursor.execute("""
                SELECT c.id_cita,
                       DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
                       TIME_FORMAT(c.hora, '%H:%i') AS hora,
                       c.estado,
                       m.id_mascota, m.nombre AS mascota_nombre, m.especie,
                       cl.id_cliente, cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido,
                       s.id_servicio, s.nombre AS servicio_nombre, s.precio,
                       u.id_usuario AS id_veterinario, u.nombre AS vet_nombre, u.apellido AS vet_apellido,
                       con.id_consultorio, con.nombre AS consultorio_nombre,
                       uc.nombre AS creador_nombre, uc.apellido AS creador_apellido
                FROM citas c
                INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
                INNER JOIN clientes cl ON m.id_cliente = cl.id_cliente
                INNER JOIN servicios s ON c.id_servicio = s.id_servicio
                INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
                INNER JOIN consultorio con ON c.id_consultorio = con.id_consultorio
                INNER JOIN usuarios uc ON c.id_usuario = uc.id_usuario
                ORDER BY c.fecha DESC, c.hora DESC
            """)
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/api/reportes", status_code=201)
async def generar_reporte(data: dict, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        tipo = data.get("tipo") or "vista_sql"
        contenido = data.get("contenido")
        if contenido is None:
            raise HTTPException(status_code=400, detail="Falta el contenido del reporte")
        
        import json
        cursor.execute("""
            INSERT INTO reportes (tipo, fecha_generado, generado_por, contenido)
            VALUES (%s, NOW(), %s, %s)
        """, (tipo, current_user["id_usuario"], json.dumps(contenido, ensure_ascii=False)))
        connection.commit()
        
        return {"message": "Reporte generado y guardado correctamente", "id_reporte": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/reportes")
async def listar_reportes(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        if current_user["rol"] == "admin":
            cursor.execute("""
                SELECT r.id_reporte, r.tipo, DATE_FORMAT(r.fecha_generado, '%Y-%m-%d %H:%i') AS fecha_generado,
                       r.generado_por, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
                       r.contenido
                FROM reportes r
                INNER JOIN usuarios u ON r.generado_por = u.id_usuario
                ORDER BY r.fecha_generado DESC
            """)
        else:
            cursor.execute("""
                SELECT r.id_reporte, r.tipo, DATE_FORMAT(r.fecha_generado, '%Y-%m-%d %H:%i') AS fecha_generado,
                       r.generado_por, u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
                       r.contenido
                FROM reportes r
                INNER JOIN usuarios u ON r.generado_por = u.id_usuario
                WHERE r.generado_por = %s
                ORDER BY r.fecha_generado DESC
            """, (current_user["id_usuario"],))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/api/citas", status_code=201)
async def create_cita(data: dict, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        required = ["id_mascota", "id_usuario_vet", "id_servicio", "id_consultorio", "fecha", "hora"]
        for field in required:
            if field not in data or data[field] in (None, ""):
                raise HTTPException(status_code=400, detail=f"Campo requerido: {field}")
        cursor.execute("""
            INSERT INTO citas (id_mascota, id_usuario_vet, id_servicio, id_consultorio, fecha, hora, estado, id_usuario)
            VALUES (%s, %s, %s, %s, %s, %s, 'programada', %s)
        """, (data["id_mascota"], data["id_usuario_vet"], data["id_servicio"],
              data["id_consultorio"], data["fecha"], data["hora"], current_user["id_usuario"]))
        connection.commit()
        return {"message": "Cita creada exitosamente", "id_cita": cursor.lastrowid}
    except HTTPException:
        raise
    except mysql.connector.Error as e:
        connection.rollback()
        if e.errno == 1452:
            raise HTTPException(status_code=400, detail="Datos inválidos: verifica que la mascota, el veterinario, el servicio y el consultorio existan")
        raise HTTPException(status_code=400, detail=f"Error en la base de datos: {e.msg}")
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.put("/api/citas/{cita_id}")
async def update_cita(cita_id: int, data: dict, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_cita, id_usuario, id_usuario_vet FROM citas WHERE id_cita = %s", (cita_id,))
        cita = cursor.fetchone()
        if not cita:
            raise HTTPException(status_code=404, detail="Cita no encontrada")

        # Control de acceso: admin todo; veterinario lo asignado; asistente solo lo creado
        if current_user["rol"] != "admin":
            if current_user["rol"] == "veterinario":
                if cita["id_usuario_vet"] != current_user["id_usuario"] and cita["id_usuario"] != current_user["id_usuario"]:
                    raise HTTPException(status_code=403, detail="No tienes permisos sobre esta cita")
            elif cita["id_usuario"] != current_user["id_usuario"]:
                raise HTTPException(status_code=403, detail="No tienes permisos sobre esta cita")

        fields = []
        values = []
        for key in ["fecha", "hora", "estado", "id_servicio", "id_consultorio"]:
            if key in data:
                fields.append(f"{key} = %s")
                values.append(data[key])
        if not fields:
            raise HTTPException(status_code=400, detail="No hay campos para actualizar")
        values.append(cita_id)
        cursor.execute(f"UPDATE citas SET {', '.join(fields)} WHERE id_cita = %s", values)
        connection.commit()
        return {"message": "Cita actualizada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.delete("/api/citas/{cita_id}")
async def delete_cita(cita_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_cita, id_usuario, id_usuario_vet FROM citas WHERE id_cita = %s", (cita_id,))
        cita = cursor.fetchone()
        if not cita:
            raise HTTPException(status_code=404, detail="Cita no encontrada")

        # Control de acceso: igual que en actualización
        if current_user["rol"] != "admin":
            if current_user["rol"] == "veterinario":
                if cita["id_usuario_vet"] != current_user["id_usuario"] and cita["id_usuario"] != current_user["id_usuario"]:
                    raise HTTPException(status_code=403, detail="No tienes permisos sobre esta cita")
            elif cita["id_usuario"] != current_user["id_usuario"]:
                raise HTTPException(status_code=403, detail="No tienes permisos sobre esta cita")

        cursor.execute("DELETE FROM citas WHERE id_cita = %s", (cita_id,))
        connection.commit()
        return {"message": "Cita eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/mascotas")
async def get_mascotas(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        if current_user["rol"] == "admin":
            cursor.execute("""
                SELECT m.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
                FROM mascotas m
                INNER JOIN clientes c ON m.id_cliente = c.id_cliente
                ORDER BY m.nombre
            """)
        else:
            cursor.execute("""
                SELECT m.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
                FROM mascotas m
                INNER JOIN clientes c ON m.id_cliente = c.id_cliente
                WHERE m.id_usuario = %s
                ORDER BY m.nombre
            """, (current_user["id_usuario"],))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/api/mascotas", status_code=status.HTTP_201_CREATED)
async def create_mascota(mascota: MascotaCreate, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_cliente FROM clientes WHERE id_cliente = %s", (mascota.id_cliente,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Cliente no encontrado")

        cursor.execute("""
            INSERT INTO mascotas (id_cliente, id_usuario, nombre, especie, raza, sexo, edad, peso, observaciones)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (mascota.id_cliente, current_user["id_usuario"], mascota.nombre, mascota.especie,
              mascota.raza, mascota.sexo, mascota.edad, mascota.peso, mascota.observaciones))

        connection.commit()
        mascota_id = cursor.lastrowid
        return {"message": "Mascota registrada exitosamente", "id_mascota": mascota_id}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/servicios")
async def get_servicios(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM servicios ORDER BY nombre")
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/consultorios")
async def get_consultorios(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM consultorio WHERE estado = 'activo'")
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/veterinarios")
async def get_veterinarios(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email
            FROM usuarios WHERE rol IN ('veterinario', 'admin') AND is_active = 1
        """)
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ==================== RUTAS DE CLIENTES ====================

# Incluir routers
app.include_router(clientes_router, prefix="/api/v1/clientes", tags=["Clientes"])
app.include_router(admin_router, prefix="/api/v1/admin", tags=["Admin"])

# ==================== PUNTO DE ENTRADA ====================

if __name__ == "__main__":
    import uvicorn
    print("\n" + "="*50)
    print("🚀 Vet Manager API - Iniciando...")
    print("="*50)
    print(f"📍 Servidor: http://localhost:5000")
    print(f"📚 Documentación: http://localhost:5000/docs")
    print(f"📧 Correo configurado: {'✅ Sí' if EMAIL_CONFIG['user'] else '❌ No'}")
    print("="*50 + "\n")
    uvicorn.run(app, host="0.0.0.0", port=5000)