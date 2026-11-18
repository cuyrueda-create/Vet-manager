"""Pruebas de los endpoints de salud y raíz (pruebas de humo a nivel de código)."""


def test_health_sin_base_de_datos(client):
    """Sin conexión a MySQL el healthcheck debe reportar unhealthy, no mentir."""
    respuesta = client.get("/health")
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["status"] == "unhealthy"
    assert datos["database"] == "unhealthy"
    assert "version" in datos


def test_health_con_base_de_datos(client_con_bd):
    respuesta = client_con_bd.get("/health")
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["status"] == "healthy"
    assert datos["database"] == "healthy"
    assert datos["version"] == "test"


def test_health_reporta_la_version_declarada(client_con_bd):
    """La versión del healthcheck viene de la variable de entorno APP_VERSION."""
    assert client_con_bd.get("/health").json()["version"] == "test"


def test_raiz_responde(client):
    respuesta = client.get("/")
    assert respuesta.status_code == 200
    datos = respuesta.json()
    assert datos["message"] == "Vet Manager API"
    assert datos["status"] == "online"


def test_cors_permitido_por_defecto(client):
    """El origen por defecto (frontend local) debe estar permitido."""
    respuesta = client.get(
        "/health", headers={"Origin": "http://localhost:5173"}
    )
    assert respuesta.status_code == 200
    assert (
        respuesta.headers.get("access-control-allow-origin")
        == "http://localhost:5173"
    )


def test_cors_denegado_para_origen_desconocido(client):
    respuesta = client.get(
        "/health", headers={"Origin": "https://ejemplo-malicioso.com"}
    )
    assert "access-control-allow-origin" not in respuesta.headers
