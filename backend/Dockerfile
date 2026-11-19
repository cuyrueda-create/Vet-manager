FROM python:3.15-slim

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

# Versiones == visibles en el comando (regla SonarCloud docker:S8544, que no
# sigue -r); mantener sincronizado con requirements.txt.
RUN pip install --no-cache-dir --only-binary :all: \
    fastapi==0.164.0 'uvicorn[standard]==0.54.0' mysql-connector-python==26.10.0 \
    SQLAlchemy==2.0.57 alembic==1.20.1 'passlib[bcrypt]==1.7.4' \
    python-dotenv==1.2.4 email-validator==2.4.0 \
    pydantic==2.14.3 bcrypt==5.0.0 pyjwt==2.15.1 fpdf2==2.9.0

# Herramientas de empaquetado de la imagen base, actualizadas en cada build
# para no arrastrar vulnerabilidades conocidas (pip-audit/trivy, §9.1).
RUN pip install --no-cache-dir --only-binary :all: \
    pip==26.3 setuptools==84.1.0 wheel==0.46.3 jaraco.context==6.1.0

COPY . .

EXPOSE 5000

# Usa la variable PORT si el proveedor la define (Render, Heroku, etc.);
# en local y en Compose se mantiene 5000. La expansión de ${PORT} y
# ${UVICORN_OPTS} no funciona en la forma exec de CMD, así que el comando
# vive en un script invocado con forma exec (regla de SonarCloud docker:S7019).
CMD ["sh", "docker-entrypoint.sh"]
