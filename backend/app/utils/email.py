# app/utils/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app.core.config import EMAIL_CONFIG

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
    
    # Versión texto plano
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