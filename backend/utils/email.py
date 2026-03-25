import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from config import settings

async def send_reset_password_email(to_email: str, nombre: str, reset_token: str):
    """Envía correo de recuperación de contraseña"""
    
    reset_url = f"http://localhost:5173/reset-password?token={reset_token}"
    
    # Crear mensaje HTML
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
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
                border-radius: 10px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
            }}
            .content {{
                padding: 30px;
            }}
            .button {{
                display: inline-block;
                padding: 12px 30px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin: 20px 0;
                font-weight: bold;
            }}
            .footer {{
                background: #f8f9fa;
                padding: 20px;
                text-align: center;
                color: #6c757d;
                font-size: 12px;
            }}
            .info {{
                background: #e7f3ff;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
                font-size: 14px;
                color: #0056b3;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐾 Vet Manager</h1>
                <p>Sistema de Gestión Veterinaria</p>
            </div>
            <div class="content">
                <h2>Hola, {nombre}!</h2>
                <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta en Vet Manager.</p>
                
                <div style="text-align: center;">
                    <a href="{reset_url}" class="button">Restablecer Contraseña</a>
                </div>
                
                <div class="info">
                    <strong>⚠️ Importante:</strong><br>
                    Este enlace expirará en <strong>1 hora</strong>. Si no solicitaste este cambio, puedes ignorar este correo.
                </div>
                
                <p>Si el botón no funciona, copia y pega el siguiente enlace en tu navegador:</p>
                <p style="word-break: break-all; color: #666; font-size: 12px;">{reset_url}</p>
            </div>
            <div class="footer">
                <p>Vet Manager - Sistema de Gestión Veterinaria</p>
                <p>© 2024 - Todos los derechos reservados</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Configurar mensaje
    message = MIMEMultipart("alternative")
    message["Subject"] = "Recuperación de contraseña - Vet Manager"
    message["From"] = f"Vet Manager <{settings.EMAIL_USER}>"
    message["To"] = to_email
    
    # Versión texto plano
    text_content = f"""
    Hola {nombre},
    
    Recibimos una solicitud para restablecer la contraseña de tu cuenta.
    
    Para restablecer tu contraseña, visita el siguiente enlace:
    {reset_url}
    
    Este enlace expirará en 1 hora.
    
    Si no solicitaste esto, ignora este mensaje.
    
    ---
    Vet Manager - Sistema de Gestión Veterinaria
    """
    
    # Adjuntar versiones
    message.attach(MIMEText(text_content, "plain"))
    message.attach(MIMEText(html_content, "html"))
    
    # Enviar correo
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(settings.EMAIL_USER, settings.EMAIL_PASS)
            server.send_message(message)
        return True
    except Exception as e:
        print(f"Error al enviar correo: {e}")
        return False