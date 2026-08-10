# Matriz consolidada de trazabilidad — Fases 5, 6 y 7

## Propósito

Este documento consolida la relación entre los requisitos, las pruebas definidas y ejecutadas en la Fase 5, la automatización de la Fase 6 y las métricas obtenidas en la Fase 7. El detalle fila por fila se encuentra en `MATRIZ_CONSOLIDADA_FASES_5_7.csv`.

Los estados se interpretan así:

- **CUMPLE:** existe evidencia suficiente y el criterio medido fue aprobado.
- **CUMPLE MANUAL:** fue validado en Fase 5, pero no fue automatizado con Selenium.
- **PARCIAL:** existe evidencia, pero falta una parte objetiva del criterio.
- **PENDIENTE:** no existe todavía una medición suficiente.
- **N/A:** la herramienta o nivel de prueba no corresponde al requisito.

## Resumen funcional

| Elemento | Cantidad | Resultado |
|---|---:|---|
| Requisitos funcionales trazados | 32 | 32 con aceptación simulada |
| Pruebas unitarias backend | 107 | 107 aprobadas |
| Pruebas de integración | 61 | 61 aprobadas |
| Pruebas de sistema | 48 | 44 aprobadas y 4 bloqueadas en Fase 5 |
| Pruebas de aceptación | 32 | 32 aceptadas de forma simulada |
| Flujos Selenium | 9 | 9 aprobados |
| Pruebas frontend Vitest | 20 | 20 aprobadas |

Selenium automatiza 9 de las 48 pruebas de sistema (18.75%). Las demás pruebas de sistema conservan su resultado manual; no deben presentarse como automatizadas.

## Resumen no funcional actualizado

| Estado consolidado | RNF | Cantidad |
|---|---|---:|
| Cumple | SEG-01, SEG-02, SEG-03, SEG-04, SEG-05, SEG-06, SEG-07, REN-01, REN-05, USA-03, USA-04, USA-05, DIS-03, ESC-03, ESC-04, MAN-01, MAN-03, MAN-06, POR-02, POR-03, POR-04, CON-01, CON-02, CON-03, CON-04, CON-05 | 26 |
| Parcial o medido sin umbral concluyente | REN-04, USA-01, USA-02, DIS-02, ESC-01, MAN-02, MAN-04, POR-01 | 8 |
| Pendiente | SEG-08, REN-02, REN-03, DIS-01, DIS-04, ESC-02, MAN-05, MAN-07 | 8 |
| **Total** |  | **42** |

## Resultados de herramientas

### Selenium

Automatiza `ST-E2E-01`, `02`, `03`, `04`, `05`, `16`, `31`, `36` y `37`. Los nueve flujos fueron aprobados. La automatización cubre navegación pública, catálogo, búsqueda, carrito, protección administrativa, rutas limpias, responsive y accesibilidad básica.

### JMeter

La prueba del catálogo ejecutó 25 muestras con 25 usuarios, obtuvo 0% de errores y p95 de 23.8 ms frente al umbral de 800 ms. Esto permite declarar cumplido `RNF-REN-01`. No mide todavía login, creación concurrente de pedidos ni un dataset de 10000 registros.

### SonarQube Cloud

- Quality Gate: **OK**.
- Bugs, vulnerabilidades, code smells y hotspots: **0**.
- Cobertura del código nuevo: **81.7%**.
- Cobertura global: **51.9%**.
- Duplicación del código nuevo: **0.0%**.
- Complejidad ciclomática global: **1151**.
- Complejidad cognitiva global: **477**.
- Deuda técnica: **0 minutos**.

El Quality Gate aprobado no convierte automáticamente `RNF-MAN-02` en cumplido: el código nuevo supera 80%, pero la cobertura global permanece por debajo del objetivo documental de 70%. `RNF-MAN-04` está medido, pero requiere un umbral por función o módulo para concluir su cumplimiento. `RNF-MAN-05` no fue medido porque SonarQube no entrega directamente el Maintainability Index solicitado.

## Uso en la Fase 8

El pipeline debe ejecutar en cada cambio:

1. Instalación reproducible con `npm ci`.
2. Pruebas unitarias backend y frontend.
3. Pruebas de integración con una base MySQL exclusiva de CI.
4. Lint y build del monorepo.
5. Selenium cuando frontend, backend y base de prueba estén disponibles.
6. Preparación de LCOV combinado y análisis SonarQube.
7. Publicación de reportes JUnit, cobertura y resultado del Quality Gate.

JMeter debe configurarse como workflow manual o programado. No debe ejecutarse en cada push ni contra producción sin una ventana autorizada.
