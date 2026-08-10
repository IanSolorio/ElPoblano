# Pruebas de aceptación — El Poblano

Las pruebas de aceptación verifican que el producto satisface las necesidades
acordadas, no solamente que el código funciona. Los 30 criterios `AT-01` a
`AT-30` son trazables a `RF-01` a `RF-30` y se encuentran en el Plan Maestro de
la Fase 5.

## Participantes

- **Ejecutor:** prepara los datos y realiza la demostración.
- **Usuario representante / Product Owner:** observa y acepta o rechaza el criterio.
- **Responsable de calidad:** conserva evidencia, registra defectos y consolida el acta.
- En un proyecto académico, el docente, asesor o compañero designado puede asumir
  formalmente el rol de usuario representante.

Una misma persona no debería ejecutar y aprobar su propio resultado cuando sea
posible contar con otro evaluador.

## Procedimiento

1. Generar el expediente con `npm.cmd run test:acceptance:prepare`.
2. Registrar versión, ambiente, evaluador y participantes en el acta.
3. Ejecutar primero todos los criterios P0, luego P1 y finalmente P2.
4. Leer en voz alta el criterio Dado/Cuando/Entonces antes de la demostración.
5. Realizar la acción sin modificar el criterio durante la prueba.
6. El evaluador selecciona `ACEPTADO`, `RECHAZADO` o `BLOQUEADO`.
7. Guardar evidencia y comentario del evaluador por cada caso.
8. Vincular todo rechazo con un defecto y una decisión de corrección.
9. Firmar el acta de conformidad cuando se satisfaga el criterio de salida.

## Diferencia frente a una prueba de sistema

La prueba de sistema busca defectos técnicos y puede ser ejecutada por QA. La
prueba de aceptación demuestra valor y conformidad ante un representante del
usuario. Un escenario técnicamente correcto puede ser rechazado si no satisface
la necesidad acordada o no es comprensible para el usuario.

## Criterio de cierre

- Los 30 criterios tienen resultado y evidencia.
- Los 22 criterios P0 están aceptados.
- No existen defectos críticos o altos abiertos.
- Los rechazos P1/P2 poseen decisión y responsable.
- El acta contiene nombre, rol, fecha y conformidad del evaluador.

