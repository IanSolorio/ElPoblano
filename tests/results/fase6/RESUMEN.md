# Resultado de la Fase 6

## Estado consolidado

| Herramienta | Casos | Resultado actual | Estado de cierre |
|---|---:|---|---|
| Selenium | 44 | 42 `PASS`, 0 fallidos y 2 `REQUIERE_REVISION` por depender de HTTPS | Pendiente |
| JMeter | 14 | 13 `PASS` y 1 `PENDIENTE_FORMAL` | Pendiente |

La Fase 6 **no se considera completamente finalizada**. Existe evidencia para
todo el catálogo automatizado, pero aún faltan validaciones que no pueden
declararse aprobadas con la ejecución local o con un perfil abreviado.

## Selenium

La última campaña de `npm run test:selenium` registró:

- 44 casos ejecutados: 32 RF y 12 RNF.
- 42 casos en `PASS`.
- 0 casos fallidos.
- 2 casos en `REQUIERE_REVISION`:
  - `SEL-SEG-03`, atributos seguros de cookie: requiere staging HTTPS y
    credenciales E2E dedicadas.
  - `SEL-SEG-08`, HTTPS sin contenido inseguro: requiere una URL HTTPS
    desplegada.
- Resultado global de la campaña: **NO APROBADO**, porque los dos casos
  omitidos todavía no son `PASS`.

El estado más reciente se encuentra en
`selenium/reports/ULTIMA_EJECUCION.md`; las campañas detalladas se generan en
`selenium/reports/<fecha-UTC>/`.

## JMeter

`npm run test:jmeter` cubre 14 escenarios. La evidencia canónica actual incluye
los 14 y se distribuye así:

| Estado | Casos |
|---|---|
| `PASS` | `JM-SEG-06`, `JM-REN-01`, `JM-REN-02`, `JM-REN-03`, `JM-REN-05`, `JM-DIS-01`, `JM-ESC-01`, `JM-ESC-02`, `JM-CON-01`, `JM-CON-02`, `JM-CON-03`, `JM-CON-04`, `JM-CON-05` |
| `PENDIENTE_FORMAL` | `JM-DIS-03` |

Los resultados seleccionados y los JTL están en `jmeter/results/canonical/`.
Los resúmenes legibles y la matriz están en `jmeter/reports/canonical/`. La
selección canónica se regenera, sin ejecutar cargas, mediante:

```powershell
npm run quality:jmeter:consolidate
```

La etiqueta 14/14 describe la existencia de evidencia, no la aprobación de los
14 criterios. `JM-DIS-01` ya superó su ejecución formal de 5 minutos.
`JM-DIS-03` conserva una campaña `smoke`, pero requiere 5 minutos formales y
permanece en `PENDIENTE_FORMAL`.

### JM-DIS-01

La campaña formal mantuvo 10 usuarios concurrentes durante 300 segundos y
midió frontend y API. Registró 246 muestras del frontend y 240 de la API, 486
en total, con 0 % de errores. La disponibilidad observada fue 100 % y el estado
canónico es `PASS`.

### JM-ESC-02

El escenario usa un fixture de **exactamente 100 pedidos**, 25 usuarios y 3
iteraciones por usuario; su umbral es `p95 <= 2 s`. La última evidencia
canónica es `PASS`, con 75 muestras, p95 de 111.4 ms y 0 % de errores.

## Pendientes para el cierre

- Ejecutar `SEL-SEG-03` y `SEL-SEG-08` en un entorno HTTPS controlado.
- Ejecutar `JM-DIS-03` con el perfil formal.
- Regenerar el consolidado JMeter y actualizar este resumen con esas
  evidencias.
