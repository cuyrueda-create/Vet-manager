# app/api/v1/auth.py
from fastapi import APIRouter, HTTPException, status
from app.core.database import get_db_connection
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas.auth import UsuarioCreate, UsuarioLogin, PasswordResetRequest, PasswordReset
from app.utils.email import send_reset_email
import secrets

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
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

@router.post("/login")
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

@router.post("/request-reset")
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
        
        return {"message": f"Correo enviado. Si no llega, usa este enlace: {reset_url}"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    finally:
        cursor.close()
        connection.close()

@router.post("/reset-password")
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