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

SECRET_KEY = os.getenv("SECRET_KEY", "mi_secreto_super_seguro_2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 43200