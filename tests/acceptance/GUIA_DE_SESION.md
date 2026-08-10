# Guía para la sesión de aceptación

## Antes de la reunión

- Confirmar que frontend, backend y base de datos estén disponibles.
- Preparar cliente, administrador y superadministrador de prueba.
- Preparar productos, promociones, stock y pedidos en estados conocidos.
- Verificar credenciales sandbox de Mercado Pago.
- Compartir el alcance y aclarar que el sitio es un proyecto académico.
- Reservar aproximadamente 90 a 120 minutos; si es necesario, dividir la sesión
  en cliente (`AT-01`–`AT-09`) y administración (`AT-10`–`AT-30`).

## Evidencia por criterio

Cada carpeta `evidencias/AT-XX/` debe contener:

- Captura o grabación del resultado observable.
- `comentario-evaluador.md` cuando exista observación o rechazo.
- Referencia al defecto si el resultado es `RECHAZADO`.

No se almacenan contraseñas, tokens, cookies, CVV, números completos de tarjeta,
claves de Firebase ni cadenas de conexión.

## Estados permitidos

- `ACEPTADO`: el evaluador confirma completamente el criterio.
- `RECHAZADO`: el comportamiento no satisface el criterio o la necesidad.
- `BLOQUEADO`: no pudo demostrarse por un impedimento verificable.
- `NO_EJECUTADO`: todavía no se presentó al evaluador.

## Registro de defectos

Formato sugerido: `DEF-AT-001`, título, caso relacionado, pasos, resultado
observado, esperado, severidad, evidencia, responsable y decisión.

