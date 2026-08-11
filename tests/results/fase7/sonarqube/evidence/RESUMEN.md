# Resultado de SonarQube Cloud

- Fecha del análisis conservado: 2026-08-10.
- Organización: `iansolorio`.
- Proyecto: `IanSolorio_ElPoblano`.
- Quality Gate: **OK**.
- Bugs: **0**.
- Vulnerabilidades: **0**.
- Code smells: **0**.
- Security hotspots: **0**.
- Cobertura global: **51.9 %**.
- Cobertura de código nuevo: **81.7 %**.
- Duplicación de código nuevo: **0.0 %**.
- Complejidad ciclomática global: **1151**.
- Complejidad cognitiva global: **477**.
- Deuda técnica global: **0 minutos**.
- Incidencias abiertas: **0**.

## Casos trazables

| Caso | RNF | Umbral | Resultado observado | Estado |
|---|---|---|---|---|
| SQ-MAN-01 | MAN-01 | Gate PASS; 0 bugs/vulnerabilidades | Gate OK; 0/0 | **PASS** |
| SQ-MAN-02 | MAN-02 | Cobertura 70/80/70 % | Global 51.9 %; nuevo 81.7 %; faltan desgloses | **FAIL** |
| SQ-MAN-03 | MAN-03 | Duplicación nueva ≤3 % | 0.0 % | **PASS** |
| SQ-MAN-04 | MAN-04 | Complejidad por función nueva ≤10 | Solo se dispone del total global 1151 | **PENDIENTE_METRICA** |
| SQ-MAN-05 | MAN-05 | Rating nuevo A | A | **PASS** |
| SQ-MAN-06 | MAN-06 | Deuda nueva ≤5 % y rating A | Deuda global 0 min y A; falta ratio nuevo | **PARCIAL** |
| SQ-SEG-01 | SEG-01 | Argon2id y 0 exposiciones | Argon2id presente; 0 vulnerabilidades/incidencias | **PASS** |
| SQ-SEG-05 | SEG-05 | 0 secretos y vulnerabilidades críticas | 0 vulnerabilidades/hotspots; secret scan pendiente | **PARCIAL** |

> El Quality Gate está aprobado porque evalúa principalmente el código nuevo. Esto no sustituye el umbral académico de cobertura global: **51.9 % todavía es menor que 70 %**. Los estados parciales y pendientes se conservan para no presentar como validado aquello que el análisis actual no mide completamente.

Los resultados crudos se encuentran en `../results/`.
