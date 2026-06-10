# Usar una imagen ligera de Python
FROM python:3.11-alpine

# Configurar variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Instalar dependencias del sistema necesarias
RUN apk add --no-cache gcc musl-dev libffi-dev

# Copiar e instalar los requerimientos antes del código (para aprovechar la caché de Docker)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el contenido de la carpeta backend al contenedor
COPY . .

# Por seguridad: Correr la aplicación con un usuario sin privilegios root
RUN adduser -D appuser
USER appuser

# Exponer el puerto por donde escucha tu API (por ejemplo, el 8000)
EXPOSE 8000

# Comando para ejecutar tu backend con Uvicorn (usando la ruta correcta app.main)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]