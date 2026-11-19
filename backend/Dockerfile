FROM python:3.11-slim

WORKDIR /app

# Versión de la imagen (SemVer). Se inyecta en tiempo de build:
#   docker build --build-arg APP_VERSION=1.0.0 -t vet-manager-backend:1.0.0 .
ARG APP_VERSION=dev
ENV APP_VERSION=$APP_VERSION

# Opciones extra de uvicorn: en desarrollo usa --reload; en producción se
# construye con --build-arg UVICORN_OPTS="" para correr sin recarga.
ARG UVICORN_OPTS=--reload

RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir --only-binary :all: -r requirements.txt

COPY . .

EXPOSE 5000

# Usa la variable PORT si el proveedor la define (Render, Heroku, etc.);
# en local y en Compose se mantiene 5000. La expansión de ${PORT} y
# ${UVICORN_OPTS} no funciona en la forma exec de CMD, así que el comando
# vive en un script invocado con forma exec (regla de SonarCloud docker:S7019).
CMD ["sh", "docker-entrypoint.sh"]
