"""Normalización de los valores `fromService.host` de Render (§5.3)."""


def test_url_publica_anyade_https_a_un_host():
    from app.core.config import _url_publica

    assert _url_publica("vet-manager-web.onrender.com", "") == (
        "https://vet-manager-web.onrender.com"
    )


def test_url_publica_respeta_url_completa_y_quita_barra_final():
    from app.core.config import _url_publica

    assert _url_publica("https://ejemplo.com/", "") == "https://ejemplo.com"
    assert _url_publica("http://localhost:5173/", "") == "http://localhost:5173"


def test_url_publica_usa_el_defecto_cuando_esta_vacia():
    from app.core.config import _url_publica

    assert _url_publica("", "http://localhost:5173") == "http://localhost:5173"
