"""Adaptador SMTP -> API HTTPS de Brevo.

Render Free bloquea el tráfico SMTP saliente en los puertos 25, 465 y 587.
Cuando ``BREVO_API_KEY`` está definida, este módulo sustituye ``smtplib.SMTP``
por una clase que envía por ``https://api.brevo.com/v3/smtp/email`` (puerto
443). Así, TODOS los correos existentes (citas, facturas, reset, recordatorios,
confirmación) funcionan en la nube sin reescribir cada función.

En local (sin BREVO_API_KEY) se mantiene SMTP normal.
"""
import json
import os
import smtplib
import urllib.request

from app.core.config import EMAIL_CONFIG


class BrevoSMTP:
    """Sustituto de smtplib.SMTP que envía por la API de Brevo."""

    def __init__(self, host=None, port=587, timeout=15, **kwargs):
        self.timeout = timeout
        self._mensajes = 0

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False

    def starttls(self, *args, **kwargs):
        return None

    def login(self, *args, **kwargs):
        return None

    def send_message(self, msg):
        api_key = os.getenv("BREVO_API_KEY", "")
        if not api_key:
            raise RuntimeError("BREVO_API_KEY no configurada")

        texto = None
        html = None
        if msg.is_multipart():
            for parte in msg.walk():
                tipo = parte.get_content_type()
                datos = parte.get_payload(decode=True)
                if not datos:
                    continue
                contenido = datos.decode(parte.get_content_charset() or "utf-8", errors="replace")
                if tipo == "text/plain" and texto is None:
                    texto = contenido
                elif tipo == "text/html" and html is None:
                    html = contenido
        else:
            datos = msg.get_payload(decode=True)
            contenido = (datos or b"").decode(msg.get_content_charset() or "utf-8", errors="replace")
            if msg.get_content_type() == "text/html":
                html = contenido
            else:
                texto = contenido

        payload = {
            "sender": {"name": "Vet Manager", "email": EMAIL_CONFIG["from"] or EMAIL_CONFIG["user"]},
            "to": [{"email": msg["To"]}],
            "subject": msg["Subject"] or "Vet Manager",
        }
        if texto:
            payload["textContent"] = texto
        if html:
            payload["htmlContent"] = html

        req = urllib.request.Request(
            "https://api.brevo.com/v3/smtp/email",
            data=json.dumps(payload).encode("utf-8"),
            headers={"api-key": api_key, "Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=self.timeout) as respuesta:
            if not 200 <= respuesta.status < 300:
                raise RuntimeError(f"Brevo devolvió {respuesta.status}")
        self._mensajes += 1
        return {}


def instalar():
    """Sustituye smtplib.SMTP por BrevoSMTP si hay clave API configurada."""
    if os.getenv("BREVO_API_KEY") and not getattr(smtplib.SMTP, "_es_brevo", False):
        BrevoSMTP._es_brevo = True
        smtplib.SMTP = BrevoSMTP
