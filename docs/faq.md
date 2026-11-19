# ❓ Vet Manager — Preguntas frecuentes (FAQ)

Ayudas en línea de nivel N0 (§9.2 del plan): dudas de uso que no requieren
escalar. Corresponde a la versión **1.1.0**.

## Acceso y cuentas

**1. No puedo iniciar sesión y dice "Credenciales inválidas".**
El correo o la contraseña no coinciden. Verifica que no esté activa la letra
mayúscula/Caps Lock y usa *Recuperar contraseña* si no la recuerdas. El
sistema no indica si el correo existe (por seguridad), así que responde igual
para ambos casos.

**2. Dice "Tu cuenta está pendiente de aprobación o fue desactivada".**
Tu cuenta fue creada pero un administrador aún no la aprueba, o fue
desactivada. Pide a recepción/administración que la active en
**Admin → Usuarios**.

**3. Dice "Debes confirmar tu correo electrónico antes de iniciar sesión".**
Abre tu correo y haz clic en el enlace de confirmación (o entra a
`/confirmar-email` y pega el código). Revisa spam. ¿No llegó? Solicita que te
reenvíen la confirmación.

**4. ¿Qué contraseña es válida?**
Mínimo 8 caracteres y debe incluir: una mayúscula, una minúscula, un número
y un símbolo. Ejemplo válido: `V3t-Ma!nager`.

**5. Olvidé mi contraseña.**
En `/recuperar-password` escribe tu correo. Si la cuenta existe recibirás un
enlace para elegir una contraseña nueva. El enlace caduca: si expiró,
repítelo.

## Citas

**6. ¿Cómo agendo una cita?**
Como cliente: **Nueva cita** → mascota → fecha y hora disponibles. Como
recepcionista: **Nueva cita** → cliente → mascota → horario del veterinario.

**7. ¿Qué significan los estados de la cita?**
`programada` (reservada) → `en_proceso` (siendo atendida) → `realizada`
(terminada). `cancelada` cuando se anula. Solo recepción/administración
cambian estados.

**8. No aparecen horarios disponibles.**
El veterinario ya tiene citas en ese rango o no atiende ese día. Prueba otra
hora u otro veterinario.

## Mascotas, historial y facturas

**9. ¿Dónde veo el historial clínico de mi mascota?**
Los veterinarios lo ven en **Historial**; el cliente ve sus mascotas en
**Mis mascotas**. El historial se completa al finalizar cada consulta.

**10. ¿Cómo descargo mi factura?**
**Mis facturas** → abrir la factura → *PDF* (también puede llegarte por
correo). Estados: `emitida`, `pendiente`, `pagada`, `anulada`.

**11. ¿Se pueden ver datos de otros clientes?**
No. Cada usuario solo ve sus propios datos (aislamiento por usuario); el
personal solo dentro de su rol.

## Correo y notificaciones

**12. No llega ningún correo (confirmación, cita, factura).**
Verifica spam y la carpeta de promo/correos masivos. Si el correo
transaccional está caído el sistema sigue funcionando (no bloquea), pero el
correo no se envía: reporta al responsable técnico (N2).

## Cuentas y permisos

**12b. No veo cierto módulo del menú.**
Tu rol no lo incluye. Los módulos por rol están en la tabla del
[README](../README.md#módulos-por-rol). Si necesitas otro rol, lo solicita
un administrador.

**13. Dejé la sesión abierta en un equipo compartido.**
Cierra sesión desde tu menú. La sesión persiste 30 días, así que cerrarla es
obligatorio en equipos ajenos.

---

**¿No está tu pregunta?** Reporta el caso al canal de soporte de la clínica
(§9.2): incluye correo, paso exacto, mensaje mostrado y fecha/hora.
