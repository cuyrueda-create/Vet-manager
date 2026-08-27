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


def send_cita_email(to_email, nombre, apellido, cita_data):
    """Envia correo con ticket de cita confirmada"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
        body {{ font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; }}
        .header p {{ margin: 8px 0 0; opacity: 0.9; }}
        .ticket {{ background: #f0fdf4; border: 2px dashed #86efac; border-radius: 16px; padding: 24px; margin: 24px 0; }}
        .ticket-row {{ display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #dcfce7; font-size: 14px; }}
        .ticket-row:last-child {{ border-bottom: none; }}
        .ticket-label {{ color: #64748b; }}
        .ticket-value {{ font-weight: 600; color: #1e293b; }}
        .content {{ padding: 24px; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
    </style></head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐾 Vet Manager</h1>
                <p>Tu cita ha sido confirmada</p>
            </div>
            <div class="content">
                <h2 style="color:#1e293b">Hola, {nombre} {apellido}!</h2>
                <p style="color:#64748b">Tu cita ha sido registrada exitosamente. Guarda este ticket como comprobante.</p>
                <div class="ticket">
                    <div style="text-align:center;margin-bottom:16px">
                        <div style="font-size:40px">📋</div>
                        <div style="font-size:18px;font-weight:700;color:#15803d">TICKET DE CITA</div>
                        <div style="font-size:13px;color:#64748b">#{cita_data['id_cita']}</div>
                    </div>
                    <div class="ticket-row"><span class="ticket-label">Mascota</span><span class="ticket-value">{cita_data['mascota_nombre']}</span></div>
                    <div class="ticket-row"><span class="ticket-label">Servicio</span><span class="ticket-value">{cita_data['servicio_nombre']}</span></div>
                    <div class="ticket-row"><span class="ticket-label">Veterinario</span><span class="ticket-value">Dr. {cita_data['vet_nombre']} {cita_data['vet_apellido']}</span></div>
                    <div class="ticket-row"><span class="ticket-label">Fecha</span><span class="ticket-value">{cita_data['fecha']}</span></div>
                    <div class="ticket-row"><span class="ticket-label">Hora</span><span class="ticket-value">{cita_data['hora']}</span></div>
                    <div class="ticket-row"><span class="ticket-label">Consultorio</span><span class="ticket-value">{cita_data.get('consultorio', 'N/A')}</span></div>
                    {f'<div class="ticket-row"><span class="ticket-label">Notas</span><span class="ticket-value">{cita_data["notas"]}</span></div>' if cita_data.get('notas') else ''}
                </div>
                <p style="color:#64748b;font-size:13px">Recuerda llegar 10 minutos antes de tu cita. Si necesitas cancelar o reprogramar, hazlo con al menos 24 horas de anticipacion.</p>
            </div>
            <div class="footer">
                <p>Vet Manager - Sistema de Gestion Veterinaria</p>
            </div>
        </div>
    </body></html>
    """
    text_content = f"""
TICKET DE CITA - Vet Manager
#{cita_data['id_cita']}

Mascota: {cita_data['mascota_nombre']}
Servicio: {cita_data['servicio_nombre']}
Veterinario: Dr. {cita_data['vet_nombre']} {cita_data['vet_apellido']}
Fecha: {cita_data['fecha']}
Hora: {cita_data['hora']}
Consultorio: {cita_data.get('consultorio', 'N/A')}
{f'Notas: {cita_data["notas"]}' if cita_data.get('notas') else ''}

Tu cita ha sido confirmada. Guarda este ticket como comprobante.
---
Vet Manager - Sistema de Gestion Veterinaria
"""
    message = MIMEMultipart("alternative")
    message["Subject"] = f"✅ Cita confirmada #{cita_data['id_cita']} - {cita_data['fecha']}"
    message["From"] = f"Vet Manager <{EMAIL_CONFIG['user']}>"
    message["To"] = to_email
    message.attach(MIMEText(text_content, "plain", "utf-8"))
    message.attach(MIMEText(html_content, "html", "utf-8"))
    try:
        with smtplib.SMTP(EMAIL_CONFIG['host'], EMAIL_CONFIG['port']) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['user'], EMAIL_CONFIG['password'])
            server.send_message(message)
        print(f"✅ Correo de cita enviado a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar correo de cita: {e}")
        return False


def send_recordatorio_email(to_email, nombre, apellido, cita_data):
    """Envia recordatorio de cita proxima (24h antes)"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"><style>
        body {{ font-family: 'Segoe UI', Tahoma, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }}
        .container {{ max-width: 600px; margin: 40px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1); }}
        .header {{ background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 30px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 26px; }}
        .header p {{ margin: 8px 0 0; opacity: 0.9; }}
        .alert {{ background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center; }}
        .alert-icon {{ font-size: 40px; margin-bottom: 8px; }}
        .detail {{ background: #f8fafc; border-radius: 12px; padding: 20px; margin: 16px 0; }}
        .detail-row {{ display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }}
        .detail-label {{ color: #64748b; }}
        .detail-value {{ font-weight: 600; color: #1e293b; }}
        .content {{ padding: 24px; }}
        .footer {{ background: #f8f9fa; padding: 20px; text-align: center; color: #6c757d; font-size: 12px; }}
    </style></head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🐾 Vet Manager</h1>
                <p>Recordatorio de tu cita</p>
            </div>
            <div class="content">
                <h2 style="color:#1e293b">Hola, {nombre} {apellido}!</h2>
                <div class="alert">
                    <div class="alert-icon">⏰</div>
                    <div style="font-size:18px;font-weight:700;color:#92400e">Tu cita es en 24 horas</div>
                </div>
                <div class="detail">
                    <div class="detail-row"><span class="detail-label">Mascota</span><span class="detail-value">{cita_data['mascota_nombre']}</span></div>
                    <div class="detail-row"><span class="detail-label">Servicio</span><span class="detail-value">{cita_data['servicio_nombre']}</span></div>
                    <div class="detail-row"><span class="detail-label">Veterinario</span><span class="detail-value">Dr. {cita_data['vet_nombre']} {cita_data['vet_apellido']}</span></div>
                    <div class="detail-row"><span class="detail-label">Fecha</span><span class="detail-value">{cita_data['fecha']}</span></div>
                    <div class="detail-row"><span class="detail-label">Hora</span><span class="detail-value">{cita_data['hora']}</span></div>
                </div>
                <p style="color:#64748b;font-size:13px">Si necesitas cancelar o reprogramar, por favor hazlo lo antes posible.</p>
            </div>
            <div class="footer">
                <p>Vet Manager - Sistema de Gestion Veterinaria</p>
            </div>
        </div>
    </body></html>
    """
    text_content = f"""
RECORDATORIO DE CITA - Vet Manager

Hola {nombre} {apellido},

Tu cita es en 24 horas:

Mascota: {cita_data['mascota_nombre']}
Servicio: {cita_data['servicio_nombre']}
Veterinario: Dr. {cita_data['vet_nombre']} {cita_data['vet_apellido']}
Fecha: {cita_data['fecha']}
Hora: {cita_data['hora']}

Si necesitas cancelar o reprogramar, hazlo lo antes posible.
---
Vet Manager - Sistema de Gestion Veterinaria
"""
    message = MIMEMultipart("alternative")
    message["Subject"] = f"⏰ Recordatorio: Tu cita es mañana ({cita_data['fecha']})"
    message["From"] = f"Vet Manager <{EMAIL_CONFIG['user']}>"
    message["To"] = to_email
    message.attach(MIMEText(text_content, "plain", "utf-8"))
    message.attach(MIMEText(html_content, "html", "utf-8"))
    try:
        with smtplib.SMTP(EMAIL_CONFIG['host'], EMAIL_CONFIG['port']) as server:
            server.starttls()
            server.login(EMAIL_CONFIG['user'], EMAIL_CONFIG['password'])
            server.send_message(message)
        print(f"✅ Recordatorio enviado a {to_email}")
        return True
    except Exception as e:
        print(f"❌ Error al enviar recordatorio: {e}")
        return False