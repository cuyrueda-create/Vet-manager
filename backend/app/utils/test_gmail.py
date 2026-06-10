import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# TUS CREDENCIALES DE GMAIL
SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "cuyrueda@gmail.com"
SMTP_PASS = "qirdvwcskumiwugg"  # Sin espacios

print("="*50)
print("PRUEBA CON GMAIL REAL")
print("="*50)

# Crear mensaje bonito
msg = MIMEMultipart("alternative")
msg["Subject"] = "🐾 Prueba Vet Manager - Correo Real"
msg["From"] = f"Vet Manager <{SMTP_USER}>"
msg["To"] = "cuyrueda@gmail.com"

# Texto plano
text = """
Hola!

Este es un correo de prueba desde Vet Manager.

Si recibes esto, la configuracion con Gmail funciona correctamente.

Ahora los usuarios recibiran correos reales cuando recuperen su contraseña.

Saludos,
Vet Manager
"""

# HTML
html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #0066b3, #004c8c); color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1>🐾 Vet Manager</h1>
            <p>Sistema de Gestion Veterinaria</p>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2>¡Hola!</h2>
            <p>Este es un correo de prueba desde <strong>Vet Manager</strong>.</p>
            <p>Si recibes esto, la configuracion con Gmail funciona correctamente.</p>
            <p>Ahora los usuarios recibiran correos reales cuando recuperen su contraseña.</p>
            <hr>
            <p style="color: #666; font-size: 12px;">Vet Manager - Sistema de Gestion Veterinaria</p>
        </div>
    </div>
</body>
</html>
"""

msg.attach(MIMEText(text, "plain", "utf-8"))
msg.attach(MIMEText(html, "html", "utf-8"))

try:
    print("1. Conectando a Gmail...")
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
    print("✅ Conectado")
    
    print("2. Iniciando TLS...")
    server.starttls()
    print("✅ TLS iniciado")
    
    print("3. Iniciando sesion...")
    server.login(SMTP_USER, SMTP_PASS)
    print("✅ Sesion iniciada")
    
    print("4. Enviando correo...")
    server.send_message(msg)
    print("✅ Correo enviado")
    
    server.quit()
    
    print("\n" + "="*50)
    print("✅ CORREO ENVIADO A GMAIL REAL!")
    print("="*50)
    print(f"📨 Revisa: {SMTP_USER}")
    print("="*50)
    
except Exception as e:
    print(f"\n❌ Error: {e}")