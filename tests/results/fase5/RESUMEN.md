# Resultados de la Fase 5 — El Poblano

## Resultado por nivel

| Nivel | Planificadas | Revisadas | Aprobadas | Fallidas | Bloqueadas | Resultado |
|---|---:|---:|---:|---:|---:|---|
| Unitarias | 107 | 107 | 107 | 0 | 0 | APROBADO |
| Integración | 61 | 61 | 61 | 0 | 0 | APROBADO |
| Sistema | 48 | 48 | 44 | 0 | 4 | PARCIAL |
| Aceptación | 32 | 32 | 32 | 0 | 0 | ACEPTADO SIMULADO |
| **Total** | **248** | **248** | **244** | **0** | **4** | **PARCIAL** |

Los casos `ST-NF-01`, `ST-NF-02` y `ST-NF-04` requieren infraestructura EC2/HTTPS y no pueden declararse ejecutados en una campaña local. `ST-NF-07` requiere las métricas de JMeter de la Fase 6. Se registran como bloqueados para mantener coherencia entre ambiente y resultado.

## Cobertura funcional

- Requisitos funcionales vigentes: `RF-01` a `RF-32`.
- Los 32 RF tienen al menos un criterio de aceptación aprobado.
- Los flujos están cubiertos por pruebas unitarias, integración y/o sistema según corresponda.
- `RF-31` y `RF-32` cuentan con pruebas unitarias, integración, sistema y aceptación.

## Cobertura no funcional

Los 42 RNF fueron comparados con los resultados disponibles de la Fase 5:

| Estado | Cantidad |
|---|---:|
| Cumple mediante prueba automatizada o inspección verificable | 18 |
| Cumple mediante validación manual declarada | 4 |
| Parcial | 6 |
| No evaluado | 3 |
| Pendiente de Fase 6 | 5 |
| Pendiente de Fase 7 | 5 |
| No cumple | 1 |
| **Total** | **42** |

El único incumplimiento medido es `RNF-MAN-02`: cobertura de líneas 78.19 %, funciones 68.89 % y ramas 78.68 %. El objetivo documental exige cobertura global ≥ 70 %, backend ≥ 80 % y módulos críticos ≥ 70 %, por lo que no puede declararse cumplido todavía.

## Archivos de resultado

- `unitarias.xml`: detalle JUnit de 107 pruebas unitarias.
- `cobertura-unitarias.lcov`: cobertura importable por SonarQube.
- `integracion.xml`: detalle JUnit de 61 pruebas de integración.
- `sistema.csv`: 48 resultados manuales de sistema.
- `aceptacion.csv`: 32 criterios de aceptación.
- `trazabilidad-rnf.csv`: evaluación individual de los 42 RNF.

No se incluyen capturas, carpetas de evidencia, expedientes duplicados ni archivos auxiliares de ambiente por decisión del proyecto.
