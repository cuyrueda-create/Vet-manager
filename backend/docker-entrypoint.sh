#!/bin/sh
# Punto de entrada del backend (lo invoca el CMD del Dockerfile).
# La forma exec de CMD no expande variables, así que la expansión de
# PORT y UVICORN_OPTS ocurre aquí; `exec` deja uvicorn como PID 1 para
# que reciba SIGTERM de Docker/Render y apague ordenado.
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-5000}" ${UVICORN_OPTS:-}
