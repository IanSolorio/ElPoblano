# Pruebas de sistema — El Poblano

Este nivel valida el producto completo desde el navegador y, para los casos no
funcionales, desde la infraestructura. La fuente oficial de los 46 casos es
[`docs/PLAN_MAESTRO_PRUEBAS_FASE_5.md`](../../docs/PLAN_MAESTRO_PRUEBAS_FASE_5.md).

## Alcance

- `ST-E2E-01` a `ST-E2E-38`: interfaz, API, MySQL, Firebase, Mercado Pago y roles.
- `ST-NF-01` a `ST-NF-08`: disponibilidad, TLS, secretos, auditoría, rendimiento y recuperación.
- Fase 5: ejecución manual controlada y evidencia.
- Fase 6: automatización de los casos compatibles mediante Selenium y JMeter.

## Preparación

1. Utilizar un ambiente de pruebas, nunca la base de producción.
2. Aplicar las migraciones y levantar backend y frontend.
3. Preparar una cuenta `CUSTOMER`, una `ADMIN` y una `SUPER_ADMIN`.
4. Crear productos con stock, uno con stock cero, una promoción individual y un combo.
5. Usar exclusivamente credenciales y tarjetas de prueba de Mercado Pago.
6. Sincronizar la fecha y hora del equipo que ejecutará las pruebas.
7. Generar el expediente vacío con `npm.cmd run test:system:prepare`.

## Ejecución funcional

Para cada caso `ST-E2E`:

1. Abrir una ventana privada del navegador y limpiar datos entre identidades.
2. Registrar en el CSV el navegador, responsable, hora inicial y datos utilizados.
3. Ejecutar el escenario descrito en la matriz maestra.
4. Comparar el resultado observado con el esperado.
5. Guardar capturas antes y después de la acción crítica. En errores de red, guardar
   también Network y Console de DevTools.
6. Marcar `APROBADO`, `FALLIDO` o `BLOQUEADO`; nunca dejar un resultado inferido.

## Ejecución no funcional

- `ST-NF-01` y `ST-NF-02` requieren acceso autorizado a EC2 y evidencia de
  `systemctl`, Nginx y `/api/health`.
- `ST-NF-03` se realiza en un ambiente aislado interrumpiendo temporalmente la
  conexión a la base; no se ejecuta contra producción.
- `ST-NF-04` conserva certificado, redirección y panel Security/Network.
- `ST-NF-05` emplea búsqueda local, revisión del bundle y respuestas/logs redactados.
- `ST-NF-06` contrasta acciones realizadas con `audit_logs`.
- `ST-NF-07` quedará cuantificado con JMeter en la Fase 6; en Fase 5 se registra la
  línea base manual.
- `ST-NF-08` exige una copia de prueba restaurable y medición real de RPO/RTO.

## Criterio de cierre

La ejecución se acepta cuando los 46 casos tienen resultado y evidencia, todos los
P0 están aprobados, no quedan defectos críticos abiertos y el acta está firmada por
el responsable. Un caso bloqueado no cuenta como aprobado.

