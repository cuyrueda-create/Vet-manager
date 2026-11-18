"""Los modelos deben importarse sin errores (definen el esquema ORM)."""


def test_modelos_se_importan():
    from app.models import models  # noqa: F401

    assert models is not None


def test_tablas_definidas():
    from app.models.models import Base

    # Base debe existir para poder crear las tablas
    assert Base is not None
