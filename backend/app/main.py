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
import re
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
from app.utils.email import send_cita_email, send_recordatorio_email
import threading

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
        "ALTER TABLE usuarios ADD COLUMN created_by INT NULL",
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
    try:
        cursor.execute("ALTER TABLE citas ADD COLUMN notas TEXT NULL")
        print("✅ Columna agregada: notas (citas)")
    except:
        pass
    conn.commit()
    cursor.close()
    conn.close()

def migrate_facturas_tables():
    """Crea las tablas de facturación (facturas y factura_detalle)"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No se pudo conectar a la BD para migración de facturas")
        return
    cursor = conn.cursor()
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS facturas (
                id_factura INT AUTO_INCREMENT PRIMARY KEY,
                numero VARCHAR(20) UNIQUE NOT NULL,
                id_cliente INT NOT NULL,
                id_usuario INT NOT NULL,
                id_cita INT NULL,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
                iva DECIMAL(12,2) NOT NULL DEFAULT 0,
                total DECIMAL(12,2) NOT NULL DEFAULT 0,
                estado ENUM('emitida','anulada') DEFAULT 'emitida',
                FOREIGN KEY (id_cliente) REFERENCES clientes(id_cliente),
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario),
                FOREIGN KEY (id_cita) REFERENCES citas(id_cita)
            )
        """)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS factura_detalle (
                id_detalle INT AUTO_INCREMENT PRIMARY KEY,
                id_factura INT NOT NULL,
                descripcion VARCHAR(200) NOT NULL,
                cantidad INT NOT NULL DEFAULT 1,
                precio_unitario DECIMAL(12,2) NOT NULL,
                subtotal DECIMAL(12,2) NOT NULL,
                FOREIGN KEY (id_factura) REFERENCES facturas(id_factura)
            )
        """)
        conn.commit()
        print("✅ Tablas de facturas verificadas/creadas")
    except Exception as e:
        print(f"⚠️ Error creando tablas de facturas: {e}")
    finally:
        cursor.close()
        conn.close()

def migrate_facturas_pago():
    """Agrega fecha_vencimiento, estado de pago y tabla de notificaciones"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No se pudo conectar a la BD para migración de facturas/pago")
        return
    cursor = conn.cursor()
    try:
        # Ampliar ENUM de estado para incluir pagada/pendiente
        cursor.execute(
            "ALTER TABLE facturas MODIFY COLUMN estado ENUM('emitida','anulada','pagada','pendiente') DEFAULT 'emitida'"
        )
        print("✅ ENUM de facturas ampliado")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE facturas ADD COLUMN fecha_vencimiento DATETIME NULL")
        print("✅ Columna fecha_vencimiento agregada")
    except:
        pass
    try:
        cursor.execute("ALTER TABLE facturas ADD COLUMN enviado BOOLEAN DEFAULT FALSE")
        print("✅ Columna enviado agregada")
    except:
        pass
    try:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS notificaciones (
                id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
                id_usuario INT NOT NULL,
                titulo VARCHAR(150) NOT NULL,
                mensaje TEXT NOT NULL,
                tipo VARCHAR(50) NOT NULL DEFAULT 'general',
                leida BOOLEAN DEFAULT FALSE,
                enlace VARCHAR(255) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (id_usuario) REFERENCES usuarios(id_usuario)
            )
        """)
        print("✅ Tabla notificaciones verificada/creada")
    except Exception as e:
        print(f"⚠️ Error creando tabla notificaciones: {e}")
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

def migrate_roles():
    """Unifica los roles en 4: administrador, veterinario, recepcionista, usuario"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No se pudo conectar a la BD para migración de roles")
        return
    cursor = conn.cursor()
    try:
        # 1. Ampliar el ENUM para aceptar los nuevos valores
        cursor.execute(
            "ALTER TABLE usuarios MODIFY COLUMN rol ENUM('admin','veterinario','asistente','user','administrador','usuario','recepcionista') NOT NULL DEFAULT 'usuario'"
        )
        # 2. Migrar los datos: asistente/user -> usuario, admin -> administrador
        cursor.execute("UPDATE usuarios SET rol = 'usuario' WHERE rol IN ('user', 'asistente')")
        cursor.execute("UPDATE usuarios SET rol = 'administrador' WHERE rol = 'admin'")
        # 3. Dejar el ENUM final con 4 roles
        cursor.execute(
            "ALTER TABLE usuarios MODIFY COLUMN rol ENUM('administrador','veterinario','recepcionista','usuario') NOT NULL DEFAULT 'usuario'"
        )
        conn.commit()
        print("✅ Roles migrados a: administrador, veterinario, recepcionista, usuario")
    except Exception as e:
        print(f"⚠️ Error migrando roles: {e}")
    finally:
        cursor.close()
        conn.close()

def migrate_admin_columns():
    """Agrega columnas de datos del negocio a la tabla usuarios"""
    conn = get_db_connection()
    if not conn:
        print("⚠️ No se pudo conectar a la BD para migración de admin")
        return
    cursor = conn.cursor()
    migrations = [
        "ALTER TABLE usuarios ADD COLUMN nombre_negocio VARCHAR(150) NULL",
        "ALTER TABLE usuarios ADD COLUMN direccion_negocio VARCHAR(200) NULL",
        "ALTER TABLE usuarios ADD COLUMN especialidad VARCHAR(50) NULL",
        "ALTER TABLE usuarios ADD COLUMN anos_experiencia INT NULL",
    ]
    for sql in migrations:
        try:
            cursor.execute(sql)
            print(f"✅ Migración aplicada: {sql.split()[3]}")
        except:
            pass
    conn.commit()
    cursor.close()
    conn.close()

@app.on_event("startup")
def startup():
    print("🔧 Ejecutando migraciones...")
    migrate_usuarios_table()
    migrate_clientes_table()
    migrate_citas_table()
    migrate_facturas_tables()
    migrate_admin_columns()
    migrate_roles()
    migrate_facturas_pago()
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
    rol: str = "usuario"
    tipo_documento: Optional[str] = None
    numero_documento: Optional[str] = None

class UsuarioLogin(BaseModel):
    email: EmailStr
    contraseña: str

class AdminCreate(BaseModel):
    nombre: str
    email: EmailStr
    telefono: str = ""
    contraseña: str
    numero_documento: Optional[str] = None
    nombre_negocio: str
    direccion_negocio: str = ""
    especialidad: str = "Veterinaria"
    anos_experiencia: int = 0

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
    nombre_negocio: Optional[str] = None
    direccion_negocio: Optional[str] = None
    especialidad: Optional[str] = None
    anos_experiencia: Optional[int] = None

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

def send_invoice_email(to_email, nombre, apellido, factura_data):
    """Envia un correo con los detalles de la factura al cliente"""
    html_detalles = ""
    for d in factura_data.get("detalles", []):
        html_detalles += f"""
        <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">{d['descripcion']}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">{d['cantidad']}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${d['precio_unitario']:,.2f}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">${d['subtotal']:,.2f}</td>
        </tr>"""

    fecha_venc = factura_data.get("fecha_vencimiento", "No definida")
    if fecha_venc and fecha_venc != "No definida":
        from datetime import datetime as dt
        try:
            if isinstance(fecha_venc, str):
                fecha_venc = dt.strptime(fecha_venc, "%Y-%m-%d %H:%M:%S").strftime("%d/%m/%Y %H:%M")
        except:
            pass

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Factura {factura_data['numero']} - Vet Manager</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }}
            .container {{ max-width: 650px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }}
            .header {{ background: linear-gradient(135deg, #0066b3 0%, #004c8c 100%); color: white; padding: 30px; text-align: center; }}
            .header h1 {{ margin: 0; font-size: 28px; }}
            .header p {{ margin: 10px 0 0; opacity: 0.9; }}
            .content {{ padding: 30px; }}
            .invoice-box {{ background: #f8f9fa; border-radius: 12px; padding: 20px; margin: 20px 0; }}
            .invoice-box h3 {{ margin: 0 0 15px; color: #0066b3; }}
            table {{ width: 100%; border-collapse: collapse; margin: 15px 0; }}
            th {{ background: #0066b3; color: white; padding: 10px; text-align: left; }}
            .total-box {{ background: #e8f0fe; border-radius: 8px; padding: 15px; margin: 20px 0; text-align: right; }}
            .total-box .total {{ font-size: 24px; font-weight: bold; color: #0066b3; }}
            .vencimiento {{ background: #fff3cd; border-radius: 8px; padding: 12px; margin: 15px 0; font-size: 14px; color: #856404; }}
            .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐾 Vet Manager</h1>
                <p>Factura de Servicios Veterinarios</p>
            </div>
            <div class="content">
                <h2>Hola, {nombre} {apellido}!</h2>
                <p>Se ha generado una nueva factura a tu nombre. A continuacion los detalles:</p>

                <div class="invoice-box">
                    <h3>Factura {factura_data['numero']}</h3>
                    <p><strong>Fecha:</strong> {factura_data['fecha']}</p>
                    {f'<p><strong>Vencimiento:</strong> {fecha_venc}</p>' if fecha_venc and fecha_venc != "No definida" else ''}
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Descripcion</th>
                            <th style="text-align:center;">Cant.</th>
                            <th style="text-align:right;">Precio Unit.</th>
                            <th style="text-align:right;">Subtotal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {html_detalles}
                    </tbody>
                </table>

                <div class="total-box">
                    <p style="margin:5px 0;color:#666;">Subtotal: ${factura_data['subtotal']:,.2f}</p>
                    <p style="margin:5px 0;color:#666;">IVA (19%): ${factura_data['iva']:,.2f}</p>
                    <p class="total">TOTAL: ${factura_data['total']:,.2f}</p>
                </div>

                {'<div class="vencimiento">⚠️ <strong>Fecha limite de pago:</strong> ' + str(fecha_venc) + '. Por favor realize su pago antes de esta fecha.</div>' if fecha_venc and fecha_venc != "No definida" else ''}

                <p style="color:#666;font-size:13px;margin-top:20px;">Si tienes alguna pregunta sobre esta factura, no dudes en contactarnos.</p>
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

Se ha generado una nueva factura a tu nombre:

Factura: {factura_data['numero']}
Fecha: {factura_data['fecha']}
{'Vencimiento: ' + str(fecha_venc) if fecha_venc and fecha_venc != 'No definida' else ''}

Detalles:
"""
    for d in factura_data.get("detalles", []):
        text_content += f"  - {d['descripcion']} x{d['cantidad']} = ${d['subtotal']:,.2f}\n"

    text_content += f"""
Subtotal: ${factura_data['subtotal']:,.2f}
IVA (19%): ${factura_data['iva']:,.2f}
TOTAL: ${factura_data['total']:,.2f}

---
Vet Manager - Sistema de Gestion Veterinaria
"""

    message = MIMEMultipart("alternative")
    message["Subject"] = f"Factura {factura_data['numero']} - Vet Manager"
    message["From"] = f"Vet Manager <{EMAIL_CONFIG['user']}>"
    message["To"] = to_email

    message.attach(MIMEText(text_content, "plain", "utf-8"))
    message.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        with smtplib.SMTP(EMAIL_CONFIG['host'], EMAIL_CONFIG['port'], timeout=15) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['user'], EMAIL_CONFIG['password'])
            server.send_message(message)
        print(f"✅ Correo de factura enviado a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo de factura: {e}")
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
        # El rol siempre es 'usuario' en el registro público: los roles
        # administrador/veterinario solo se asignan desde el módulo de administración
        cursor.execute("""
            INSERT INTO usuarios (nombre, apellido, email, telefono, direccion, contrasea, rol, tipo_documento, numero_documento, confirm_token, reset_token_expires)
            VALUES (%s, %s, %s, %s, %s, %s, 'usuario', %s, %s, %s, %s)
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

def validate_password_strength(password: str):
    """Valida que la contraseña tenga al menos 8 caracteres, mayúscula, minúscula, número y símbolo"""
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")
    if not re.search(r"[A-Z]", password):
        raise HTTPException(status_code=400, detail="La contraseña debe incluir al menos una letra mayúscula")
    if not re.search(r"[a-z]", password):
        raise HTTPException(status_code=400, detail="La contraseña debe incluir al menos una letra minúscula")
    if not re.search(r"\d", password):
        raise HTTPException(status_code=400, detail="La contraseña debe incluir al menos un número")
    if not re.search(r"[^A-Za-z0-9]", password):
        raise HTTPException(status_code=400, detail="La contraseña debe incluir al menos un símbolo")

def validate_corporate_email(email: str):
    """Valida el formato del email corporativo"""
    if not re.match(r"^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$", email):
        raise HTTPException(status_code=400, detail="El correo corporativo no tiene un formato válido")

def build_auth_response(user: dict):
    """Genera la respuesta de autenticación (token + usuario) tras el registro"""
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
            "tipo_documento": user.get("tipo_documento"),
            "numero_documento": user.get("numero_documento")
        }
    }

@app.post("/auth/register/user", status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UsuarioCreate):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a base de datos")

    cursor = connection.cursor(dictionary=True)

    try:
        cursor.execute("SELECT id_usuario FROM usuarios WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        if not user_data.contraseña or len(user_data.contraseña) < 8:
            raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres")

        hashed_password = get_password_hash(user_data.contraseña)

        cursor.execute("""
            INSERT INTO usuarios (nombre, apellido, email, telefono, direccion, contrasea, rol,
                                  tipo_documento, numero_documento, confirm_token, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, 'usuario', %s, %s, NULL, TRUE)
        """, (user_data.nombre, user_data.apellido, user_data.email, user_data.telefono,
              user_data.direccion, hashed_password,
              user_data.tipo_documento, user_data.numero_documento))

        connection.commit()
        user_id = cursor.lastrowid

        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, rol, tipo_documento, numero_documento
            FROM usuarios WHERE id_usuario = %s
        """, (user_id,))
        user = cursor.fetchone()

        return build_auth_response(user)

    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar usuario: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/auth/register/admin", status_code=status.HTTP_201_CREATED)
async def register_admin(user_data: AdminCreate):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión a base de datos")

    cursor = connection.cursor(dictionary=True)

    try:
        validate_password_strength(user_data.contraseña)
        validate_corporate_email(user_data.email)

        cursor.execute("SELECT id_usuario FROM usuarios WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="El email ya está registrado")

        hashed_password = get_password_hash(user_data.contraseña)

        cursor.execute("""
            INSERT INTO usuarios (nombre, apellido, email, telefono, contrasea, rol,
                                  tipo_documento, numero_documento, confirm_token, is_active,
                                  nombre_negocio, direccion_negocio, especialidad, anos_experiencia)
            VALUES (%s, %s, %s, %s, %s, 'administrador', 'NIT', %s, NULL, 0, %s, %s, %s, %s)
        """, (user_data.nombre, '', user_data.email, user_data.telefono, hashed_password,
              user_data.numero_documento, user_data.nombre_negocio,
              user_data.direccion_negocio, user_data.especialidad, user_data.anos_experiencia))

        connection.commit()
        user_id = cursor.lastrowid

        return {
            "message": "Solicitud de administrador enviada. Un administrador deberá aprobarla para que puedas iniciar sesión.",
            "user_id": user_id
        }

    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error al registrar administrador: {str(e)}")
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
            SELECT id_usuario, nombre, apellido, email, contrasea, rol, tipo_documento, numero_documento, confirm_token, is_active
            FROM usuarios WHERE email = %s
        """, (user_data.email,))
        
        user = cursor.fetchone()
        
        if not user or not verify_password(user_data.contraseña, user["contrasea"]):
            raise HTTPException(status_code=401, detail="Credenciales inválidas")

        if not user.get("is_active"):
            raise HTTPException(status_code=403, detail="Tu cuenta está pendiente de aprobación o fue desactivada por un administrador")
        
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
                   tipo_documento, numero_documento, is_active,
                   nombre_negocio, direccion_negocio, especialidad, anos_experiencia
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

        if data.nombre_negocio is not None:
            fields.append("nombre_negocio = %s")
            values.append(data.nombre_negocio)

        if data.direccion_negocio is not None:
            fields.append("direccion_negocio = %s")
            values.append(data.direccion_negocio)

        if data.especialidad is not None:
            fields.append("especialidad = %s")
            values.append(data.especialidad)

        if data.anos_experiencia is not None:
            fields.append("anos_experiencia = %s")
            values.append(data.anos_experiencia)

        if not fields:
            return {"message": "No se enviaron campos para actualizar", "user": current_user}

        values.append(current_user["id_usuario"])
        cursor.execute(f"UPDATE usuarios SET {', '.join(fields)} WHERE id_usuario = %s", values)
        connection.commit()

        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono, direccion, rol,
                   tipo_documento, numero_documento, is_active,
                   nombre_negocio, direccion_negocio, especialidad, anos_experiencia
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
        
        if current_user["rol"] == "administrador":
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
        if current_user["rol"] != "administrador":
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
        is_admin = current_user["rol"] == "administrador"

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

        if is_admin:
            # Admin: estadísticas globales de todas las citas
            cursor.execute("SELECT COUNT(*) AS total FROM citas")
            stats["citas"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE estado = 'programada'")
            stats["citas_pendientes"] = cursor.fetchone()["total"]
            cursor.execute("""
                SELECT COUNT(*) AS total FROM citas
                WHERE estado = 'programada' AND fecha >= CURDATE()
            """)
            stats["citas_hoy"] = cursor.fetchone()["total"]
            cursor.execute("""
                SELECT COUNT(*) AS total FROM citas
                WHERE MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())
            """)
            stats["citas_mes"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE estado = 'realizada'")
            stats["citas_realizadas"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE estado = 'cancelada'")
            stats["citas_canceladas"] = cursor.fetchone()["total"]
        elif current_user["rol"] == "veterinario":
            # Veterinario: solo citas asignadas a él (id_usuario_vet)
            vet_id = current_user["id_usuario"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario_vet = %s", (vet_id,))
            stats["citas"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario_vet = %s AND estado = 'programada'", (vet_id,))
            stats["citas_pendientes"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario_vet = %s AND estado = 'programada' AND fecha >= CURDATE()", (vet_id,))
            stats["citas_hoy"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario_vet = %s AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())", (vet_id,))
            stats["citas_mes"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario_vet = %s AND estado = 'realizada'", (vet_id,))
            stats["citas_realizadas"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario_vet = %s AND estado = 'cancelada'", (vet_id,))
            stats["citas_canceladas"] = cursor.fetchone()["total"]
            cursor.execute("""
                SELECT COUNT(DISTINCT m.id_mascota) AS total
                FROM mascotas m
                INNER JOIN citas c ON m.id_mascota = c.id_mascota
                WHERE c.id_usuario_vet = %s
            """, (vet_id,))
            stats["mascotas"] = cursor.fetchone()["total"]
        else:
            # Usuario normal: solo las citas que él mismo creó
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario = %s", (current_user["id_usuario"],))
            stats["citas"] = cursor.fetchone()["total"]
            cursor.execute("SELECT COUNT(*) AS total FROM citas WHERE id_usuario = %s AND estado = 'programada'", (current_user["id_usuario"],))
            stats["citas_pendientes"] = cursor.fetchone()["total"]
            cursor.execute("""
                SELECT COUNT(*) AS total FROM citas
                WHERE id_usuario = %s AND estado = 'programada' AND fecha >= CURDATE()
            """, (current_user["id_usuario"],))
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
        base_select = """
            SELECT c.id_cita,
                   DATE_FORMAT(c.fecha, '%Y-%m-%d') AS fecha,
                   TIME_FORMAT(c.hora, '%H:%i') AS hora,
                   c.estado, c.notas,
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
            LEFT JOIN usuarios uc ON c.id_usuario = uc.id_usuario
        """
        if current_user["rol"] in ("administrador", "recepcionista"):
            cursor.execute(base_select + " ORDER BY c.fecha DESC, c.hora DESC")
        elif current_user["rol"] == "veterinario":
            # Veterinario: solo las citas asignadas a él
            cursor.execute(base_select + " WHERE c.id_usuario_vet = %s ORDER BY c.fecha DESC, c.hora DESC",
                           (current_user["id_usuario"],))
        else:
            # Regla de oro: el usuario normal SOLO ve las citas que él mismo creó
            cursor.execute(base_select + " WHERE c.id_usuario = %s ORDER BY c.fecha DESC, c.hora DESC",
                           (current_user["id_usuario"],))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ==================== ENDPOINTS VETERINARIO ====================

@app.put("/api/vet/citas/{cita_id}/estado")
async def vet_update_cita_estado(cita_id: int, data: dict, current_user: dict = Depends(get_current_user)):
    """El veterinario puede cambiar el estado de sus citas asignadas"""
    if current_user["rol"] != "veterinario":
        raise HTTPException(status_code=403, detail="Solo los veterinarios pueden usar esta ruta")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_cita, id_usuario_vet, estado FROM citas WHERE id_cita = %s", (cita_id,))
        cita = cursor.fetchone()
        if not cita:
            raise HTTPException(status_code=404, detail="Cita no encontrada")
        if cita["id_usuario_vet"] != current_user["id_usuario"]:
            raise HTTPException(status_code=403, detail="Esta cita no está asignada a ti")
        nuevo_estado = data.get("estado")
        if nuevo_estado not in ("programada", "realizada", "cancelada"):
            raise HTTPException(status_code=400, detail="Estado inválido")
        if cita["estado"] == nuevo_estado:
            return {"message": "La cita ya tiene ese estado"}
        if cita["estado"] == "realizada":
            raise HTTPException(status_code=400, detail="Una cita realizada no puede cambiar de estado")
        notas = data.get("notas")
        fields = ["estado = %s"]
        values = [nuevo_estado]
        if notas is not None:
            fields.append("notas = %s")
            values.append(notas)
        values.append(cita_id)
        cursor.execute(f"UPDATE citas SET {', '.join(fields)} WHERE id_cita = %s", values)
        connection.commit()
        return {"message": f"Cita marcada como {nuevo_estado}"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/vet/mascotas")
async def vet_get_mascotas(current_user: dict = Depends(get_current_user)):
    """Mascotas que el veterinario ha atendido"""
    if current_user["rol"] != "veterinario":
        raise HTTPException(status_code=403, detail="Solo los veterinarios pueden usar esta ruta")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT DISTINCT m.id_mascota, m.nombre, m.especie, m.raza, m.sexo, m.edad, m.peso,
                   cl.nombre AS cliente_nombre, cl.apellido AS cliente_apellido, cl.telefono AS cliente_telefono
            FROM mascotas m
            INNER JOIN clientes cl ON m.id_cliente = cl.id_cliente
            INNER JOIN citas c ON m.id_mascota = c.id_mascota
            WHERE c.id_usuario_vet = %s
            ORDER BY m.nombre
        """, (current_user["id_usuario"],))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/vet/historial/{mascota_id}")
async def vet_get_historial(mascota_id: int, current_user: dict = Depends(get_current_user)):
    """Historial clínico de una mascota (solo si el veterinario la ha atendido)"""
    if current_user["rol"] != "veterinario":
        raise HTTPException(status_code=403, detail="Solo los veterinarios pueden usar esta ruta")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_mascota, nombre FROM mascotas WHERE id_mascota = %s", (mascota_id,))
        mascota = cursor.fetchone()
        if not mascota:
            raise HTTPException(status_code=404, detail="Mascota no encontrada")
        cursor.execute("""
            SELECT COUNT(*) AS total FROM citas
            WHERE id_mascota = %s AND id_usuario_vet = %s
        """, (mascota_id, current_user["id_usuario"]))
        if cursor.fetchone()["total"] == 0:
            raise HTTPException(status_code=403, detail="No tienes citas con esta mascota")
        cursor.execute("""
            SELECT h.id_historial, h.diagnostico, h.tratamiento, h.observaciones,
                   DATE_FORMAT(h.fecha, '%Y-%m-%d %H:%i') AS fecha,
                   u.nombre AS vet_nombre, u.apellido AS vet_apellido,
                   c.fecha AS cita_fecha
            FROM historial_clinico h
            INNER JOIN usuarios u ON h.id_usuario = u.id_usuario
            LEFT JOIN citas c ON h.id_cita = c.id_cita
            WHERE h.id_mascota = %s
            ORDER BY h.fecha DESC
        """, (mascota_id,))
        historial = cursor.fetchall()
        for h in historial:
            if h.get("cita_fecha"):
                h["cita_fecha"] = str(h["cita_fecha"])
        return {"mascota": mascota, "historial": historial}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/api/vet/historial", status_code=201)
async def vet_create_historial(data: dict, current_user: dict = Depends(get_current_user)):
    """Agregar entrada al historial clínico de una mascota"""
    if current_user["rol"] != "veterinario":
        raise HTTPException(status_code=403, detail="Solo los veterinarios pueden usar esta ruta")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        mascota_id = data.get("id_mascota")
        if not mascota_id:
            raise HTTPException(status_code=400, detail="id_mascota es requerido")
        diagnostico = data.get("diagnostico", "").strip()
        tratamiento = data.get("tratamiento", "").strip()
        observaciones = data.get("observaciones", "").strip()
        if not diagnostico and not tratamiento:
            raise HTTPException(status_code=400, detail="Debes ingresar al menos diagnóstico o tratamiento")
        id_cita = data.get("id_cita")
        cursor.execute("""
            INSERT INTO historial_clinico (id_mascota, id_usuario, id_cita, diagnostico, tratamiento, observaciones)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (mascota_id, current_user["id_usuario"], id_cita, diagnostico, tratamiento, observaciones))
        connection.commit()
        return {"message": "Historial clínico registrado", "id_historial": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
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
        if current_user["rol"] == "administrador":
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
        required = ["id_mascota", "id_servicio", "fecha", "hora"]
        for field in required:
            if field not in data or data[field] in (None, ""):
                raise HTTPException(status_code=400, detail=f"Campo requerido: {field}")

        # Veterinario asignado: el propio usuario si es veterinario/admin,
        # recepcionista elige vet disponible, si no, el primer veterinario activo
        id_usuario_vet = data.get("id_usuario_vet")
        if not id_usuario_vet:
            if current_user["rol"] in ("veterinario", "administrador"):
                id_usuario_vet = current_user["id_usuario"]
            else:
                cursor.execute("""
                    SELECT id_usuario FROM usuarios
                    WHERE rol = 'veterinario' AND is_active = 1
                    ORDER BY id_usuario LIMIT 1
                """)
                row = cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=400, detail="No hay veterinarios disponibles")
                id_usuario_vet = row["id_usuario"]

        # Consultorio: el primero activo si no se especifica
        id_consultorio = data.get("id_consultorio")
        if not id_consultorio:
            cursor.execute("""
                SELECT id_consultorio FROM consultorio
                WHERE estado = 'activo'
                ORDER BY id_consultorio LIMIT 1
            """)
            row = cursor.fetchone()
            if not row:
                raise HTTPException(status_code=400, detail="No hay consultorios disponibles")
            id_consultorio = row["id_consultorio"]

        notas = data.get("notas")

        cursor.execute("""
            INSERT INTO citas (id_mascota, id_usuario_vet, id_servicio, id_consultorio, fecha, hora, estado, id_usuario, notas)
            VALUES (%s, %s, %s, %s, %s, %s, 'programada', %s, %s)
        """, (data["id_mascota"], id_usuario_vet, data["id_servicio"],
              id_consultorio, data["fecha"], data["hora"], current_user["id_usuario"], notas))
        connection.commit()
        cita_id = cursor.lastrowid

        # Notificar al veterinario asignado
        cursor.execute("SELECT nombre, apellido FROM usuarios WHERE id_usuario = %s", (id_usuario_vet,))
        vet_info = cursor.fetchone()
        if vet_info and id_usuario_vet != current_user["id_usuario"]:
            try:
                cursor.execute("""
                    INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, enlace)
                    VALUES (%s, %s, %s, 'cita', '/veterinario/mis-citas')
                """, (
                    id_usuario_vet,
                    "Nueva cita asignada",
                    f"Se te asigno una cita el {data['fecha']} a las {data['hora']}."
                ))
                connection.commit()
            except Exception:
                pass

        cursor.execute("""
            SELECT c.id_cita, c.fecha, c.hora, c.notas,
                   m.nombre AS mascota_nombre, m.especie AS mascota_especie,
                   s.nombre AS servicio_nombre, s.precio AS servicio_precio,
                   u.nombre AS vet_nombre, u.apellido AS vet_apellido,
                   co.nombre AS consultorio
            FROM citas c
            INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
            INNER JOIN servicios s ON c.id_servicio = s.id_servicio
            INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
            INNER JOIN consultorio co ON c.id_consultorio = co.id_consultorio
            WHERE c.id_cita = %s
        """, (cita_id,))
        cita_completa = cursor.fetchone()

        ticket_data = None
        if cita_completa:
            ticket_data = {
                "id_cita": cita_completa["id_cita"],
                "fecha": str(cita_completa["fecha"]),
                "hora": str(cita_completa["hora"])[:5] if cita_completa["hora"] else "",
                "notas": cita_completa["notas"],
                "mascota_nombre": cita_completa["mascota_nombre"],
                "mascota_especie": cita_completa["mascota_especie"],
                "servicio_nombre": cita_completa["servicio_nombre"],
                "servicio_precio": float(cita_completa["servicio_precio"]) if cita_completa["servicio_precio"] else 0,
                "vet_nombre": cita_completa["vet_nombre"],
                "vet_apellido": cita_completa["vet_apellido"],
                "consultorio": cita_completa["consultorio"]
            }

            cursor.execute("SELECT email, nombre, apellido FROM usuarios WHERE id_usuario = %s", (current_user["id_usuario"],))
            user_email = cursor.fetchone()
            if user_email and user_email.get("email") and EMAIL_CONFIG.get('user'):
                threading.Thread(
                    target=send_cita_email,
                    args=(user_email["email"], user_email["nombre"], user_email["apellido"], ticket_data),
                    daemon=True
                ).start()

            # Enviar correo tambien al veterinario asignado si es diferente del creador
            if id_usuario_vet != current_user["id_usuario"]:
                cursor.execute("SELECT email, nombre, apellido FROM usuarios WHERE id_usuario = %s", (id_usuario_vet,))
                vet_email = cursor.fetchone()
                if vet_email and vet_email.get("email") and EMAIL_CONFIG.get('user'):
                    threading.Thread(
                        target=send_cita_email,
                        args=(vet_email["email"], vet_email["nombre"], vet_email["apellido"], ticket_data),
                        daemon=True
                    ).start()

            # Enviar correo al cliente dueño de la mascota
            cursor.execute("""
                SELECT cl.email, cl.nombre, cl.apellido
                FROM mascotas m INNER JOIN clientes cl ON m.id_cliente = cl.id_cliente
                WHERE m.id_mascota = %s
            """, (data["id_mascota"],))
            cliente_info = cursor.fetchone()
            if cliente_info and cliente_info.get("email") and EMAIL_CONFIG.get('user'):
                threading.Thread(
                    target=send_cita_email,
                    args=(cliente_info["email"], cliente_info["nombre"], cliente_info["apellido"], ticket_data),
                    daemon=True
                ).start()

        return {"message": "Cita creada exitosamente", "id_cita": cita_id, "ticket": ticket_data}
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

@app.post("/api/citas/recordatorios")
async def enviar_recordatorios(current_user: dict = Depends(require_admin)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT c.fecha, c.hora, c.notas,
                   m.nombre AS mascota_nombre, m.especie AS mascota_especie,
                   s.nombre AS servicio_nombre,
                   u.email AS vet_email, u.nombre AS vet_nombre, u.apellido AS vet_apellido,
                   co.nombre AS consultorio,
                   uc.email AS cliente_email, uc.nombre AS cliente_nombre, uc.apellido AS cliente_apellido
            FROM citas c
            INNER JOIN mascotas m ON c.id_mascota = m.id_mascota
            INNER JOIN servicios s ON c.id_servicio = s.id_servicio
            INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
            INNER JOIN consultorio co ON c.id_consultorio = co.id_consultorio
            INNER JOIN clientes cl ON m.id_cliente = cl.id_cliente
            INNER JOIN usuarios uc ON cl.id_usuario = uc.id_usuario
            WHERE c.estado = 'programada'
              AND c.fecha = CURDATE() + INTERVAL 1 DAY
        """)
        citas = cursor.fetchall()
        enviados = 0
        for cita in citas:
            if cita.get("cliente_email") and EMAIL_CONFIG.get('user'):
                ticket_data = {
                    "id_cita": 0,
                    "fecha": str(cita["fecha"]),
                    "hora": str(cita["hora"])[:5] if cita["hora"] else "",
                    "notas": cita["notas"],
                    "mascota_nombre": cita["mascota_nombre"],
                    "mascota_especie": cita["mascota_especie"],
                    "servicio_nombre": cita["servicio_nombre"],
                    "vet_nombre": cita["vet_nombre"],
                    "vet_apellido": cita["vet_apellido"],
                    "consultorio": cita["consultorio"]
                }
                if send_recordatorio_email(cita["cliente_email"], cita["cliente_nombre"], cita["cliente_apellido"], ticket_data):
                    enviados += 1
        return {"message": f"Se enviaron {enviados} recordatorios de {len(citas)} citas programadas para mañana"}
    except Exception as e:
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
        if current_user["rol"] != "administrador":
            if current_user["rol"] == "veterinario":
                if cita["id_usuario_vet"] != current_user["id_usuario"] and cita["id_usuario"] != current_user["id_usuario"]:
                    raise HTTPException(status_code=403, detail="No tienes permisos sobre esta cita")
            elif cita["id_usuario"] != current_user["id_usuario"]:
                raise HTTPException(status_code=403, detail="No tienes permisos sobre esta cita")

        fields = []
        values = []
        for key in ["fecha", "hora", "estado", "id_servicio", "id_consultorio", "notas"]:
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

        # Control de acceso: solo el admin puede eliminar citas
        # (los usuarios normales solo pueden crear y cancelar las suyas)
        if current_user["rol"] != "administrador":
            raise HTTPException(status_code=403, detail="Solo el administrador puede eliminar citas")

        # Limpiar dependencias antes de eliminar (agenda, historial y facturas)
        cursor.execute("DELETE FROM agenda WHERE id_cita = %s", (cita_id,))
        cursor.execute("UPDATE historial_clinico SET id_cita = NULL WHERE id_cita = %s", (cita_id,))
        cursor.execute("UPDATE facturas SET id_cita = NULL WHERE id_cita = %s", (cita_id,))
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
        if current_user["rol"] == "administrador":
            cursor.execute("""
                SELECT m.*, c.nombre AS cliente_nombre, c.apellido AS cliente_apellido
                FROM mascotas m
                INNER JOIN clientes c ON m.id_cliente = c.id_cliente
                ORDER BY m.nombre
            """)
        elif current_user["rol"] == "veterinario":
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
                WHERE c.id_usuario = %s
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

@app.delete("/api/mascotas/{mascota_id}")
async def delete_mascota(mascota_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_mascota, id_usuario FROM mascotas WHERE id_mascota = %s", (mascota_id,))
        mascota = cursor.fetchone()
        if not mascota:
            raise HTTPException(status_code=404, detail="Mascota no encontrada")

        # Control de acceso: el admin puede eliminar cualquier mascota,
        # los usuarios normales solo las suyas
        if current_user["rol"] != "administrador" and mascota["id_usuario"] != current_user["id_usuario"]:
            raise HTTPException(status_code=403, detail="No tienes permisos sobre esta mascota")

        # Limpiar dependencias: citas de la mascota (con agenda, historial y facturas) e historial clínico
        cursor.execute("SELECT id_cita FROM citas WHERE id_mascota = %s", (mascota_id,))
        for cita in cursor.fetchall():
            cita_id = cita["id_cita"]
            cursor.execute("DELETE FROM agenda WHERE id_cita = %s", (cita_id,))
            cursor.execute("UPDATE historial_clinico SET id_cita = NULL WHERE id_cita = %s", (cita_id,))
            cursor.execute("UPDATE facturas SET id_cita = NULL WHERE id_cita = %s", (cita_id,))
            cursor.execute("DELETE FROM citas WHERE id_cita = %s", (cita_id,))
        cursor.execute("DELETE FROM historial_clinico WHERE id_mascota = %s", (mascota_id,))
        cursor.execute("DELETE FROM mascotas WHERE id_mascota = %s", (mascota_id,))
        connection.commit()
        return {"message": "Mascota eliminada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/mascotas")
async def get_mascotas_alias(current_user: dict = Depends(get_current_user)):
    return await get_mascotas(current_user)

@app.post("/mascotas", status_code=status.HTTP_201_CREATED)
async def create_mascota_alias(mascota: MascotaCreate, current_user: dict = Depends(get_current_user)):
    return await create_mascota(mascota, current_user)

@app.delete("/mascotas/{mascota_id}")
async def delete_mascota_alias(mascota_id: int, current_user: dict = Depends(get_current_user)):
    return await delete_mascota(mascota_id, current_user)

@app.get("/api/usuario/mi-cliente")
async def get_mi_cliente(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM clientes WHERE id_usuario = %s", (current_user["id_usuario"],))
        cliente = cursor.fetchone()
        cursor.fetchall()

        if not cliente:
            cursor.execute("SELECT * FROM clientes WHERE email = %s", (current_user["email"],))
            cliente = cursor.fetchone()
            cursor.fetchall()
            if cliente:
                cid = cliente["id_cliente"]
                cursor.execute("UPDATE clientes SET id_usuario = %s WHERE id_cliente = %s",
                               (current_user["id_usuario"], cid))
                connection.commit()
            else:
                cursor.execute("""
                    INSERT INTO clientes (nombre, apellido, email, id_usuario)
                    VALUES (%s, %s, %s, %s)
                """, (current_user["nombre"], current_user["apellido"], current_user["email"],
                      current_user["id_usuario"]))
                connection.commit()
                cid = cursor.lastrowid
                cliente = {"id_cliente": cid, "nombre": current_user["nombre"],
                           "apellido": current_user["apellido"], "email": current_user["email"],
                           "id_usuario": current_user["id_usuario"]}
                return cliente

        return cliente
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
            SELECT id_usuario, nombre, apellido, email, telefono
            FROM usuarios WHERE rol = 'veterinario' AND is_active = 1
        """)
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/recepcionistas")
async def get_recepcionistas(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, email, telefono
            FROM usuarios WHERE rol = 'recepcionista' AND is_active = 1
        """)
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ==================== FACTURACIÓN ====================

class FacturaDetalleCreate(BaseModel):
    descripcion: str
    cantidad: int = 1
    precio_unitario: float

class FacturaCreate(BaseModel):
    id_cliente: int
    id_cita: Optional[int] = None
    fecha_vencimiento: Optional[str] = None
    correo_notificacion: Optional[str] = None
    detalles: list[FacturaDetalleCreate]

def generar_numero_factura(cursor):
    """Genera el siguiente número de factura en formato FAC-0001"""
    cursor.execute("SELECT IFNULL(MAX(id_factura), 0) + 1 AS siguiente FROM facturas")
    siguiente = cursor.fetchone()["siguiente"]
    return f"FAC-{siguiente:04d}"

@app.post("/api/facturas", status_code=status.HTTP_201_CREATED)
async def create_factura(data: FacturaCreate, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        if current_user["rol"] == "usuario":
            raise HTTPException(status_code=403, detail="Los clientes no pueden generar facturas. Contacta a tu veterinaria.")

        cursor.execute("SELECT id_cliente, nombre, apellido FROM clientes WHERE id_cliente = %s", (data.id_cliente,))
        cliente = cursor.fetchone()
        if not cliente:
            raise HTTPException(status_code=404, detail="Cliente no encontrado")
        if current_user["rol"] != "administrador":
            cursor.execute("SELECT id_cliente FROM clientes WHERE id_cliente = %s AND id_usuario = %s",
                           (data.id_cliente, current_user["id_usuario"]))
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="No tienes permisos para facturar a este cliente")

        if data.id_cita:
            cursor.execute("SELECT id_cita FROM citas WHERE id_cita = %s", (data.id_cita,))
            if not cursor.fetchone():
                raise HTTPException(status_code=404, detail="Cita no encontrada")

        if not data.detalles:
            raise HTTPException(status_code=400, detail="Debes agregar al menos un detalle a la factura")

        subtotal = 0.0
        for detalle in data.detalles:
            if detalle.cantidad <= 0 or detalle.precio_unitario <= 0:
                raise HTTPException(status_code=400, detail="Cantidad y precio deben ser mayores a 0")
            if not detalle.descripcion.strip():
                raise HTTPException(status_code=400, detail="La descripción de cada detalle es requerida")
            subtotal += detalle.cantidad * detalle.precio_unitario

        iva = round(subtotal * 0.19, 2)
        total = round(subtotal + iva, 2)

        numero = generar_numero_factura(cursor)
        # Si el número ya existe (colisión), buscar el siguiente disponible
        cursor.execute("SELECT id_factura FROM facturas WHERE numero = %s", (numero,))
        while cursor.fetchone():
            cursor.execute("SELECT IFNULL(MAX(id_factura), 0) + 1 AS siguiente FROM facturas")
            siguiente = cursor.fetchone()["siguiente"]
            numero = f"FAC-{siguiente:04d}"
            cursor.execute("SELECT id_factura FROM facturas WHERE numero = %s", (numero,))

        cursor.execute("""
            INSERT INTO facturas (numero, id_cliente, id_usuario, id_cita, subtotal, iva, total, estado, fecha_vencimiento)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'emitida', %s)
        """, (numero, data.id_cliente, current_user["id_usuario"], data.id_cita, subtotal, iva, total, data.fecha_vencimiento))
        factura_id = cursor.lastrowid

        for detalle in data.detalles:
            cursor.execute("""
                INSERT INTO factura_detalle (id_factura, descripcion, cantidad, precio_unitario, subtotal)
                VALUES (%s, %s, %s, %s, %s)
            """, (factura_id, detalle.descripcion.strip(), detalle.cantidad,
                  round(detalle.precio_unitario, 2), round(detalle.cantidad * detalle.precio_unitario, 2)))

        connection.commit()

        # Enviar correo y crear notificacion al cliente
        correo_destino = data.correo_notificacion
        if not correo_destino:
            cursor.execute("SELECT email, nombre, apellido FROM clientes WHERE id_cliente = %s", (data.id_cliente,))
            cliente_info = cursor.fetchone()
            correo_destino = cliente_info.get("email") if cliente_info else None
            nombre_cliente = cliente_info.get("nombre", "") if cliente_info else ""
            apellido_cliente = cliente_info.get("apellido", "") if cliente_info else ""
        else:
            cursor.execute("SELECT nombre, apellido FROM clientes WHERE id_cliente = %s", (data.id_cliente,))
            cliente_info = cursor.fetchone()
            nombre_cliente = cliente_info.get("nombre", "") if cliente_info else ""
            apellido_cliente = cliente_info.get("apellido", "") if cliente_info else ""

        factura_completa = {
            "numero": numero,
            "fecha": datetime.now().strftime("%d/%m/%Y %H:%M"),
            "subtotal": subtotal,
            "iva": iva,
            "total": total,
            "fecha_vencimiento": data.fecha_vencimiento,
            "detalles": [{"descripcion": d.descripcion.strip(), "cantidad": d.cantidad,
                          "precio_unitario": round(d.precio_unitario, 2),
                          "subtotal": round(d.cantidad * d.precio_unitario, 2)} for d in data.detalles]
        }

        if correo_destino:
            threading.Thread(target=send_invoice_email,
                           args=(correo_destino, nombre_cliente, apellido_cliente, factura_completa),
                           daemon=True).start()

            # Crear notificacion para el usuario dueño del cliente
            cursor.execute("SELECT id_usuario FROM clientes WHERE id_cliente = %s", (data.id_cliente,))
            cliente_usuario = cursor.fetchone()
            if cliente_usuario:
                try:
                    cursor.execute("""
                        INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, enlace)
                        VALUES (%s, %s, %s, 'factura', %s)
                    """, (cliente_usuario["id_usuario"],
                          f"Nueva factura {numero}",
                          f"Se genero la factura {numero} por un total de ${total:,.2f}. Vence el {data.fecha_vencimiento or 'sin fecha definida'}.",
                          f"/facturas"))
                    connection.commit()
                except:
                    pass

            # Notificar y enviar correo al veterinario asignado a la cita
            if data.id_cita:
                cursor.execute("""
                    SELECT c.id_usuario_vet, u.email, u.nombre, u.apellido
                    FROM citas c INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
                    WHERE c.id_cita = %s
                """, (data.id_cita,))
                vet_info = cursor.fetchone()
                if vet_info:
                    # Notificacion in-app
                    try:
                        cursor.execute("""
                            INSERT INTO notificaciones (id_usuario, titulo, mensaje, tipo, enlace)
                            VALUES (%s, %s, %s, 'factura', '/veterinario/mis-citas')
                        """, (
                            vet_info["id_usuario_vet"],
                            f"Nueva factura {numero}",
                            f"Se genero la factura {numero} por un total de ${total:,.2f} para la cita #{data.id_cita}."
                        ))
                        connection.commit()
                    except:
                        pass
                    # Correo
                    if vet_info.get("email") and EMAIL_CONFIG.get('user'):
                        threading.Thread(target=send_invoice_email,
                           args=(vet_info["email"], vet_info["nombre"], vet_info["apellido"], factura_completa),
                           daemon=True).start()

        # Marcar como enviado
        cursor.execute("UPDATE facturas SET enviado = TRUE WHERE id_factura = %s", (factura_id,))
        connection.commit()

        return {"message": "Factura generada exitosamente", "id_factura": factura_id, "numero": numero}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/facturas")
async def get_facturas(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        if current_user["rol"] in ("administrador", "recepcionista"):
            cursor.execute("""
                SELECT f.id_factura, f.numero,
                       DATE_FORMAT(f.fecha, '%Y-%m-%d %H:%i') AS fecha,
                       f.subtotal, f.iva, f.total, f.estado, f.id_cita,
                       f.fecha_vencimiento, f.enviado,
                       DATE_FORMAT(f.fecha_vencimiento, '%Y-%m-%d %H:%i') AS fecha_venc_fmt,
                       c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
                       c.telefono AS cliente_telefono, c.email AS cliente_email,
                       u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
                FROM facturas f
                INNER JOIN clientes c ON f.id_cliente = c.id_cliente
                INNER JOIN usuarios u ON f.id_usuario = u.id_usuario
                ORDER BY f.fecha DESC
            """)
        else:
            if current_user["rol"] == "usuario":
                # Los clientes ven las facturas emitidas a sus propias mascotas (no anuladas)
                cursor.execute("""
                    SELECT f.id_factura, f.numero,
                           DATE_FORMAT(f.fecha, '%Y-%m-%d %H:%i') AS fecha,
                           f.subtotal, f.iva, f.total, f.estado, f.id_cita,
                           f.fecha_vencimiento, f.enviado,
                           DATE_FORMAT(f.fecha_vencimiento, '%Y-%m-%d %H:%i') AS fecha_venc_fmt,
                           c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
                           c.telefono AS cliente_telefono, c.email AS cliente_email,
                           u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
                    FROM facturas f
                    INNER JOIN clientes c ON f.id_cliente = c.id_cliente
                    INNER JOIN usuarios u ON f.id_usuario = u.id_usuario
                    WHERE (c.id_usuario = %s OR c.email = %s)
                    AND f.estado != 'anulada'
                    ORDER BY f.fecha DESC
                """, (current_user["id_usuario"], current_user["email"]))
            else:
                cursor.execute("""
                    SELECT f.id_factura, f.numero,
                           DATE_FORMAT(f.fecha, '%Y-%m-%d %H:%i') AS fecha,
                           f.subtotal, f.iva, f.total, f.estado, f.id_cita,
                           f.fecha_vencimiento, f.enviado,
                           DATE_FORMAT(f.fecha_vencimiento, '%Y-%m-%d %H:%i') AS fecha_venc_fmt,
                           c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
                           c.telefono AS cliente_telefono, c.email AS cliente_email,
                           u.nombre AS usuario_nombre, u.apellido AS usuario_apellido
                    FROM facturas f
                    INNER JOIN clientes c ON f.id_cliente = c.id_cliente
                    INNER JOIN usuarios u ON f.id_usuario = u.id_usuario
                    WHERE f.id_usuario = %s
                    ORDER BY f.fecha DESC
                """, (current_user["id_usuario"],))
        facturas = cursor.fetchall()
        for f in facturas:
            f["subtotal"] = float(f["subtotal"])
            f["iva"] = float(f["iva"])
            f["total"] = float(f["total"])
        return {"success": True, "data": facturas}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/facturas/{factura_id}")
async def get_factura(factura_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT f.id_factura, f.numero,
                   DATE_FORMAT(f.fecha, '%Y-%m-%d %H:%i') AS fecha,
                   f.subtotal, f.iva, f.total, f.estado, f.id_cita,
                   f.fecha_vencimiento, f.enviado,
                   DATE_FORMAT(f.fecha_vencimiento, '%Y-%m-%d %H:%i') AS fecha_venc_fmt,
                   c.nombre AS cliente_nombre, c.apellido AS cliente_apellido,
                   c.telefono AS cliente_telefono, c.email AS cliente_email,
                   c.tipo_documento AS cliente_tipo_doc, c.numero_documento AS cliente_num_doc,
                   c.direccion AS cliente_direccion,
                   u.nombre AS usuario_nombre, u.apellido AS usuario_apellido,
                   m.nombre AS mascota_nombre,
                    vet.nombre AS vet_nombre, vet.apellido AS vet_apellido, vet.telefono AS vet_telefono,
                   ct.notas AS motivo_cita
            FROM facturas f
            INNER JOIN clientes c ON f.id_cliente = c.id_cliente
            INNER JOIN usuarios u ON f.id_usuario = u.id_usuario
            LEFT JOIN citas ct ON f.id_cita = ct.id_cita
            LEFT JOIN mascotas m ON ct.id_mascota = m.id_mascota
            LEFT JOIN usuarios vet ON ct.id_usuario_vet = vet.id_usuario
            WHERE f.id_factura = %s
        """, (factura_id,))
        factura = cursor.fetchone()
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")

        if current_user["rol"] not in ("administrador", "recepcionista"):
            if current_user["rol"] == "usuario":
                cursor.execute("""
                    SELECT f.id_factura FROM facturas f
                    INNER JOIN clientes c ON f.id_cliente = c.id_cliente
                    WHERE f.id_factura = %s AND (c.id_usuario = %s OR c.email = %s) AND f.estado != 'anulada'
                """, (factura_id, current_user["id_usuario"], current_user["email"]))
            else:
                cursor.execute("SELECT id_factura FROM facturas WHERE id_factura = %s AND id_usuario = %s",
                               (factura_id, current_user["id_usuario"]))
            if not cursor.fetchone():
                raise HTTPException(status_code=403, detail="No tienes permisos sobre esta factura")

        cursor.execute("SELECT * FROM factura_detalle WHERE id_factura = %s ORDER BY id_detalle", (factura_id,))
        detalles = cursor.fetchall()
        for d in detalles:
            d["precio_unitario"] = float(d["precio_unitario"])
            d["subtotal"] = float(d["subtotal"])

        factura["subtotal"] = float(factura["subtotal"])
        factura["iva"] = float(factura["iva"])
        factura["total"] = float(factura["total"])
        factura["detalles"] = detalles
        return factura
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.delete("/api/facturas/{factura_id}")
async def anular_factura(factura_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexión")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_factura, id_usuario, estado FROM facturas WHERE id_factura = %s", (factura_id,))
        factura = cursor.fetchone()
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")

        if current_user["rol"] != "administrador":
            raise HTTPException(status_code=403, detail="Solo el administrador puede anular facturas")

        if factura["estado"] == "anulada":
            raise HTTPException(status_code=400, detail="La factura ya está anulada")

        cursor.execute("UPDATE facturas SET estado = 'anulada' WHERE id_factura = %s", (factura_id,))
        connection.commit()
        return {"message": "Factura anulada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.put("/api/facturas/{factura_id}/pagar")
async def pagar_factura(factura_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_factura, id_usuario, estado, total, numero FROM facturas WHERE id_factura = %s", (factura_id,))
        factura = cursor.fetchone()
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")

        if current_user["rol"] != "administrador":
            raise HTTPException(status_code=403, detail="Solo el administrador puede registrar pagos")

        if factura["estado"] == "pagada":
            raise HTTPException(status_code=400, detail="La factura ya esta pagada")
        if factura["estado"] == "anulada":
            raise HTTPException(status_code=400, detail="No se puede pagar una factura anulada")

        cursor.execute("UPDATE facturas SET estado = 'pagada' WHERE id_factura = %s", (factura_id,))
        connection.commit()
        return {"message": "Factura marcada como pagada exitosamente"}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/api/facturas/{factura_id}/enviar")
async def enviar_factura(factura_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT f.id_factura, f.numero, f.total, f.subtotal, f.iva, f.estado,
                   f.fecha_vencimiento, DATE_FORMAT(f.fecha, '%Y-%m-%d %H:%i') AS fecha,
                   c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, c.email AS cliente_email
            FROM facturas f
            INNER JOIN clientes c ON f.id_cliente = c.id_cliente
            WHERE f.id_factura = %s
        """, (factura_id,))
        factura = cursor.fetchone()
        if not factura:
            raise HTTPException(status_code=404, detail="Factura no encontrada")

        if current_user["rol"] == "usuario":
            raise HTTPException(status_code=403, detail="No tienes permisos")

        if not factura.get("cliente_email"):
            raise HTTPException(status_code=400, detail="El cliente no tiene correo electronico registrado")

        cursor.execute("SELECT * FROM factura_detalle WHERE id_factura = %s", (factura_id,))
        detalles = cursor.fetchall()

        factura_completa = {
            "numero": factura["numero"],
            "fecha": factura["fecha"],
            "subtotal": float(factura["subtotal"]),
            "iva": float(factura["iva"]),
            "total": float(factura["total"]),
            "fecha_vencimiento": str(factura["fecha_vencimiento"]) if factura["fecha_vencimiento"] else None,
            "detalles": [{"descripcion": d["descripcion"], "cantidad": d["cantidad"],
                          "precio_unitario": float(d["precio_unitario"]),
                          "subtotal": float(d["subtotal"])} for d in detalles]
        }

        import threading
        threading.Thread(target=send_invoice_email,
                       args=(factura["cliente_email"], factura["cliente_nombre"], factura["cliente_apellido"], factura_completa),
                       daemon=True).start()

        cursor.execute("UPDATE facturas SET enviado = TRUE WHERE id_factura = %s", (factura_id,))
        connection.commit()

        return {"message": f"Factura enviada a {factura['cliente_email']}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ==================== NOTIFICACIONES ====================

@app.get("/api/notificaciones")
async def get_notificaciones(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_notificacion, titulo, mensaje, tipo, leida, enlace,
                   DATE_FORMAT(created_at, '%Y-%m-%d %H:%i') AS fecha
            FROM notificaciones
            WHERE id_usuario = %s
            ORDER BY created_at DESC
            LIMIT 50
        """, (current_user["id_usuario"],))
        notifs = cursor.fetchall()
        return {"success": True, "data": notifs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/notificaciones/no-leidas")
async def get_notificaciones_no_leidas(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT COUNT(*) AS total FROM notificaciones WHERE id_usuario = %s AND leida = FALSE", (current_user["id_usuario"],))
        result = cursor.fetchone()
        return {"success": True, "total": result["total"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.put("/api/notificaciones/{notif_id}/leer")
async def marcar_leida(notif_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("UPDATE notificaciones SET leida = TRUE WHERE id_notificacion = %s AND id_usuario = %s",
                       (notif_id, current_user["id_usuario"]))
        connection.commit()
        return {"message": "Notificacion marcada como leida"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.put("/api/notificaciones/leer-todas")
async def marcar_todas_leidas(current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("UPDATE notificaciones SET leida = TRUE WHERE id_usuario = %s AND leida = FALSE", (current_user["id_usuario"],))
        connection.commit()
        return {"message": "Todas las notificaciones marcadas como leidas"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.delete("/api/notificaciones/{notif_id}")
async def eliminar_notificacion(notif_id: int, current_user: dict = Depends(get_current_user)):
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("DELETE FROM notificaciones WHERE id_notificacion = %s AND id_usuario = %s",
                       (notif_id, current_user["id_usuario"]))
        connection.commit()
        return {"message": "Notificacion eliminada"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

# ==================== ENDPOINTS MEDICAMENTOS ASIGNADOS ====================

@app.get("/api/medicamentos")
async def get_medicamentos(current_user: dict = Depends(get_current_user)):
    """Catalogo de medicamentos disponible para vet, admin y recepcionista"""
    if current_user["rol"] not in ("administrador", "veterinario", "recepcionista"):
        raise HTTPException(status_code=403, detail="Sin permisos")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_medicamento, nombre, descripcion, dosis, precio, stock
            FROM medicamentos WHERE stock > 0 ORDER BY nombre
        """)
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/vet/historial/{historial_id}/medicamentos")
async def get_medicamentos_historial(historial_id: int, current_user: dict = Depends(get_current_user)):
    """Ver medicamentos asignados en un historial clinico"""
    if current_user["rol"] not in ("veterinario", "administrador"):
        raise HTTPException(status_code=403, detail="Solo veterinarios pueden ver medicamentos asignados")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT ma.id_asignacion, ma.dosis, ma.frecuencia, ma.duracion, ma.instrucciones,
                   m.nombre AS medicamento_nombre, m.descripcion AS medicamento_descripcion
            FROM medicamentos_asignados ma
            INNER JOIN medicamentos m ON ma.id_medicamento = m.id_medicamento
            WHERE ma.id_historial = %s
            ORDER BY m.nombre
        """, (historial_id,))
        return cursor.fetchall()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.post("/api/vet/historial/{historial_id}/medicamentos", status_code=201)
async def asignar_medicamento(historial_id: int, data: dict, current_user: dict = Depends(get_current_user)):
    """Asignar medicamento a un registro de historial clinico"""
    if current_user["rol"] not in ("veterinario", "administrador"):
        raise HTTPException(status_code=403, detail="Solo veterinarios pueden asignar medicamentos")
    required = ["id_medicamento", "dosis"]
    for field in required:
        if field not in data or data[field] in (None, ""):
            raise HTTPException(status_code=400, detail=f"Campo requerido: {field}")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id_historial FROM historial_clinico WHERE id_historial = %s", (historial_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Historial clinico no encontrado")
        cursor.execute("""
            INSERT INTO medicamentos_asignados (id_historial, id_medicamento, dosis, frecuencia, duracion, instrucciones)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (historial_id, data["id_medicamento"], data["dosis"],
              data.get("frecuencia"), data.get("duracion"), data.get("instrucciones")))
        connection.commit()
        return {"message": "Medicamento asignado exitosamente", "id_asignacion": cursor.lastrowid}
    except HTTPException:
        raise
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.delete("/api/vet/historial/medicamentos/{asignacion_id}")
async def eliminar_medicamento_asignado(asignacion_id: int, current_user: dict = Depends(get_current_user)):
    """Eliminar medicamento asignado"""
    if current_user["rol"] not in ("veterinario", "administrador"):
        raise HTTPException(status_code=403, detail="Solo veterinarios pueden eliminar medicamentos")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("DELETE FROM medicamentos_asignados WHERE id_asignacion = %s", (asignacion_id,))
        connection.commit()
        return {"message": "Medicamento eliminado"}
    except Exception as e:
        connection.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/mascotas/{mascota_id}/veterinario")
async def get_veterinario_mascota(mascota_id: int, current_user: dict = Depends(get_current_user)):
    """Veterinario asignado a una mascota (ultima cita o historial)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT u.id_usuario, u.nombre, u.apellido, u.email, u.telefono,
                   c.fecha AS ultima_cita, c.notas AS motivo
            FROM citas c
            INNER JOIN usuarios u ON c.id_usuario_vet = u.id_usuario
            WHERE c.id_mascota = %s
            ORDER BY c.fecha DESC, c.hora DESC
            LIMIT 1
        """, (mascota_id,))
        vet = cursor.fetchone()
        return vet or None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/mascotas/{mascota_id}/medicamentos")
async def get_medicamentos_mascota(mascota_id: int, current_user: dict = Depends(get_current_user)):
    """Medicamentos asignados a una mascota (via historial clinico)"""
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT ma.id_asignacion, ma.dosis, ma.frecuencia, ma.duracion, ma.instrucciones,
                   m.id_medicamento, m.nombre AS medicamento_nombre, m.precio, m.descripcion
            FROM medicamentos_asignados ma
            INNER JOIN medicamentos m ON ma.id_medicamento = m.id_medicamento
            INNER JOIN historial_clinico h ON ma.id_historial = h.id_historial
            WHERE h.id_mascota = %s
            ORDER BY m.nombre
        """, (mascota_id,))
        meds = cursor.fetchall()
        for m in meds:
            if m.get("precio"):
                m["precio"] = float(m["precio"])
        return meds
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@app.get("/api/veterinarios/disponibles")
async def get_veterinarios_disponibles(current_user: dict = Depends(get_current_user)):
    """Lista de veterinarios activos (para recepcionista al agendar cita)"""
    if current_user["rol"] not in ("recepcionista", "administrador"):
        raise HTTPException(status_code=403, detail="Sin permisos")
    connection = get_db_connection()
    if not connection:
        raise HTTPException(status_code=500, detail="Error de conexion")
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT id_usuario, nombre, apellido, especialidad, anos_experiencia
            FROM usuarios WHERE rol = 'veterinario' AND is_active = 1
            ORDER BY nombre
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
app.include_router(clientes_router, prefix="/clientes", tags=["Clientes"])
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