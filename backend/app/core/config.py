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

# Credenciales del rol con privilegios de DDL (§7.3): migraciones y rutinas
# se ejecutan con `DB_OWNER_USER`, mientras que el runtime de la API usa el
# usuario restringido `DB_USER` (solo CRUD). Si el rol owner no está definido
# se reutilizan las de la app, para no romper despliegues antiguos.
DB_OWNER_CONFIG = dict(DB_CONFIG)
DB_OWNER_CONFIG['user'] = os.getenv("DB_OWNER_USER") or DB_CONFIG['user']
DB_OWNER_CONFIG['password'] = (
    os.getenv("DB_OWNER_PASSWORD") or DB_CONFIG['password']
)

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

# Clave maestra: permite crear el PRIMER administrador cuando la BD está vacía.
# Render la genera con generateValue: true; también la usa admin.py para crear
# administradores adicionales desde el panel.
ADMIN_CREATE_KEY = os.getenv("ADMIN_CREATE_KEY")

def _url_publica(valor: str, defecto: str) -> str:
    """Acepta una URL completa o solo un host (lo que devuelve `fromService`).

    Render `fromService.property: host` devuelve `nombre.onrender.com` sin
    esquema; el CORS y los enlaces de correo necesitan `https://...`.
    """
    valor = (valor or defecto).strip().rstrip("/")
    if valor and not valor.startswith(("http://", "https://")):
        valor = f"https://{valor}"
    return valor


# URL publica del frontend, usada para construir los enlaces de los correos
# (confirmacion de registro y recuperacion de contraseña). En local se mantiene
# el puerto 5173; en Render se referencia el host del static site.
FRONTEND_BASE_URL = _url_publica(
    os.getenv("FRONTEND_BASE_URL", ""), "http://localhost:5173"
)

# Validez de los tokens de un solo uso (horas). El correo de reset anuncia 1 h.
RESET_TOKEN_HOURS = int(os.getenv("RESET_TOKEN_HOURS", "1"))
CONFIRM_TOKEN_HOURS = int(os.getenv("CONFIRM_TOKEN_HOURS", "24"))