from fastapi import FastAPI, HTTPException, status
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

load_dotenv()

app = FastAPI(title="Vet Manager API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración de hashing con passlib
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuración JWT
SECRET_KEY = os.getenv("SECRET_KEY", "mi_secreto_super_seguro_2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440

# Configuración BD
DB_CONFIG = {
    'host': os.getenv("DB_HOST", "localhost"),
    'user': os.getenv("DB_USER", "root"),
    'password': os.getenv("DB_PASSWORD", ""),
    'database': os.getenv("DB_NAME", "vet_manager"),
    'port': int(os.getenv("DB_PORT", 3306))
}

# Configuración de correo
EMAIL_CONFIG = {
    'host': os.getenv("EMAIL_HOST", "smtp.gmail.com"),
    'port': int(os.getenv("EMAIL_PORT", 587)),
    'user': os.getenv("EMAIL_USER", ""),
    'password': os.getenv("EMAIL_PASSWORD", "")
}

# ==================== MODELOS ====================
class UsuarioCreate(BaseModel):
    nombre: str
    apellido: str
    email: EmailStr
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

# ==================== FUNCIONES ====================
def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error al conectar a MySQL: {e}")
        return None

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
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
    """Envía correo real de recuperación de contraseña"""
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    
    # Crear mensaje HTML con UTF-8
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
                    Este enlace expirara en <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este correo.
                </div>
                
                <p>Si el boton no funciona, copia y pega el siguiente enlace en tu navegador:</p>
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
    
    # Versión texto plano (sin tildes para evitar problemas)
    text_content = f"""
Hola {nombre} {apellido},

Recibimos una solicitud para restablecer la contrasena de tu cuenta en Vet Manager.

Para restablecer tu contrasena, visita el siguiente enlace:
{reset_url}

Este enlace expirara en 1 hora.

Si no solicitaste esto, ignora este mensaje.

---
Vet Manager - Sistema de Gestion Veterinaria
"""
    
    # Crear mensaje con UTF-8
    message = MIMEMultipart("alternative")
    message["Subject"] = "Recuperacion de contrasena - Vet Manager"
    message["From"] = f"Vet Manager <{EMAIL_CONFIG['user']}>"
    message["To"] = to_email
    
    # Adjuntar con codificación UTF-8
    message.attach(MIMEText(text_content, "plain", "utf-8"))
    message.attach(MIMEText(html_content, "html", "utf-8"))
    
    # Enviar correo
    try:
        with smtplib.SMTP(EMAIL_CONFIG['host'], EMAIL_CONFIG['port']) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['user'], EMAIL_CONFIG['password'])
            server.send_message(message)
        print(f"✅ Correo enviado exitosamente a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo: {e}")
        return False

# ==================== RUTAS ====================

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
    return {"status": "healthy", "database": db_status}

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
        
        # Hashear contraseña
        hashed_password = get_password_hash(user_data.contraseña)
        
        # Insertar usuario
        cursor.execute("""
            INSERT INTO usuarios (nombre, apellido, email, contraseña, rol, tipo_documento, numero_documento)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (user_data.nombre, user_data.apellido, user_data.email, hashed_password, 
              user_data.rol, user_data.tipo_documento, user_data.numero_documento))
        
        connection.commit()
        user_id = cursor.lastrowid
        
        return {"message": "Usuario registrado exitosamente", "user_id": user_id}
        
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
            SELECT id_usuario, nombre, apellido, email, contraseña, rol, tipo_documento, numero_documento
            FROM usuarios WHERE email = %s
        """, (user_data.email,))
        
        user = cursor.fetchone()
        
        if not user or not verify_password(user_data.contraseña, user["contraseña"]):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")
        
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
        cursor.execute("UPDATE usuarios SET contraseña = %s, reset_token = NULL WHERE id_usuario = %s", 
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
async def get_listado_vista():
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
                c.id_cliente,
                c.nombre AS cliente_nombre,
                c.apellido AS cliente_apellido,
                c.telefono AS cliente_telefono,
                COUNT(ct.id_cita) AS total_citas
            FROM mascotas m
            INNER JOIN clientes c ON m.id_cliente = c.id_cliente
            LEFT JOIN citas ct ON m.id_mascota = ct.id_mascota
            GROUP BY m.id_mascota, c.id_cliente
            ORDER BY m.nombre
        """)
        
        cursor.execute("SELECT * FROM vista_mascotas_clientes")
        data = cursor.fetchall()
        
        # Convertir valores para JSON
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
async def get_listado_procedimiento():
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    cursor = connection.cursor(dictionary=True)
    
    try:
        # Crear procedimiento
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
        
        cursor.callproc('sp_citas_activas')
        
        data = []
        for result in cursor.stored_results():
            data = result.fetchall()
        
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
async def get_users():
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    
    cursor = connection.cursor(dictionary=True)
    cursor.execute("SELECT id_usuario, nombre, apellido, email, rol FROM usuarios")
    users = cursor.fetchall()
    cursor.close()
    connection.close()
    
    return users

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