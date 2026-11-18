import os
from dotenv import load_dotenv

load_dotenv()

DB_CONFIG = {
    'host': os.getenv("DB_HOST", "localhost"),
    'user': os.getenv("DB_USER", "root"),
    'password': os.getenv("DB_PASSWORD", ""),
    'database': os.getenv("DB_NAME", "vet_manager"),
    'port': int(os.getenv("DB_PORT", 3306)),
    'charset': 'utf8mb4',
    'use_unicode': True
}

EMAIL_CONFIG = {
    'host': os.getenv("EMAIL_HOST", "smtp.gmail.com"),
    'port': int(os.getenv("EMAIL_PORT", 587)),
    'user': os.getenv("EMAIL_USER", ""),
    'password': os.getenv("EMAIL_PASSWORD", "")
}

# Clave para firmar los JWT. Debe definirse en las variables de entorno
# (docker-compose.yml la inyecta desde .env; ver .env.example).
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "Falta la variable de entorno SECRET_KEY. Copia .env.example a .env "
        "y define una clave (python -c \"import secrets; print(secrets.token_urlsafe(48))\")."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200