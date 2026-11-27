import asyncio

"""Consultorio opcional y horarios libres del veterinario (nuevo flujo)."""
from datetime import timedelta

import app.main as main_module


def test_horarios_devuelve_solo_bloques_libres(monkeypatch):
    from unittest.mock import MagicMock
    conexion = MagicMock()
    cursor = conexion.cursor.return_value
    cursor.fetchone.return_value = {
        "hora_inicio": timedelta(hours=8), "hora_fin": timedelta(hours=12),
    }
    cursor.fetchall.return_value = [{"hora": timedelta(hours=10)}]
    monkeypatch.setattr(main_module, "get_db_connection", lambda: conexion)

    r = asyncio.run(main_module.get_horarios_vet(1, "2030-01-02", {"id_usuario": 1}))

    horas = [s["hora"] for s in r["horarios"]]
    assert "08:00" in horas
    assert "10:00" not in horas  # ocupada
    assert all(s["estado"] == "disponible" for s in r["horarios"])


def test_disponibilidad_marca_vet_con_slots_libres(monkeypatch):
    from unittest.mock import MagicMock
    conexion = MagicMock()
    cursor = conexion.cursor.return_value
    cursor.fetchall.side_effect = [
        [{  # veterinarios
            "id_usuario": 3, "nombre": "Ana", "apellido": "Pérez",
            "especialidad": "Cirugía", "hora_inicio": timedelta(hours=8),
            "hora_fin": timedelta(hours=12),
        }],
        [{"id_usuario_vet": 3, "hora": timedelta(hours=10)}],  # citas ocupadas
    ]
    monkeypatch.setattr(main_module, "get_db_connection", lambda: conexion)

    r = asyncio.run(main_module.get_disponibilidad_vets("2030-01-02", None, {"id_usuario": 1}))

    assert r[0]["especialidad"] == "Cirugía"
    assert r[0]["estado"] == "disponible"
    assert r[0]["citas_existentes"] == 1


def test_no_queda_validacion_de_consultorios():
    from pathlib import Path

    ruta = Path(__file__).resolve().parents[1] / "app" / "main.py"
    codigo = ruta.read_text(encoding="utf-8")
    assert "No hay consultorios disponibles" not in codigo
    assert "El consultorio ya esta ocupado" not in codigo
