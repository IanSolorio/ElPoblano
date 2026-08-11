# Resultado de SonarQube Cloud

- Fecha UTC: 2026-08-11T20:17:12.928Z
- Organización: iansolorio
- Proyecto: IanSolorio_ElPoblano
- Quality Gate: **OK**
- Bugs: 0
- Vulnerabilidades activas: 1
- Vulnerabilidades agregadas por Sonar en el periodo: 1
- Code smells: 0
- Security hotspots: 0
- Cobertura global: 73.8 %
- Cobertura de código nuevo: N/D
- Cobertura backend (LCOV): 85.29 %
- Complejidad ciclomática global: 1182
- Complejidad cognitiva global: 508
- Deuda técnica global: 0 minutos (0.00 horas)
- Incidencias abiertas: 1
- Incidencias históricas conservadas: 188

## Casos trazables

| Caso | RNF | Umbral | Resultado observado | Estado |
|---|---|---|---|---|
| SQ-MAN-01 | MAN-01 | Quality Gate PASS; 0 bugs y 0 vulnerabilidades activas | Gate OK; bugs 0; vulnerabilidades activas 1; vulnerabilidades agregadas en el periodo 1 | **FAIL** |
| SQ-MAN-02 | MAN-02 | Cobertura global >=70%; backend >=80%; módulos críticos >=70% | Global 73.8%; backend 85.29%; módulos críticos: auth 81.37%; orders 76.36%; payments 98.77%; products 83.44%; promotions 91.18%; cart 100%; admin 78.49%; catalog 100% | **PASS** |
| SQ-MAN-03 | MAN-03 | Duplicación nueva <=3% | Duplicación nueva N/D | **PENDIENTE_METRICA** |
| SQ-MAN-04 | MAN-04 | La complejidad ciclomática y cognitiva debe ser medida por SonarQube y no existir incidencias activas de mantenibilidad relacionadas con complejidad excesiva | Complejidad ciclomática global 1182; complejidad cognitiva global 508; code smells 0; Maintainability Rating A; Quality Gate OK; incidencias activas de complejidad 0 | **PASS** |
| SQ-MAN-05 | MAN-05 | Maintainability Rating de código nuevo = A | Rating de código nuevo A | **PASS** |
| SQ-MAN-06 | MAN-06 | Deuda técnica nueva <=5% y rating A | Deuda global 0 min; ratio global 0.0%; rating global A | **PASS** |
| SQ-SEG-01 | SEG-01 | Argon2id presente y 0 exposiciones detectadas | Argon2id presente; evidencia de no exposición de hashes presente; incidencias activas sobre credenciales/hashes 0 | **PASS** |
| SQ-SEG-05 | SEG-05 | 0 secretos y 0 vulnerabilidades críticas/nuevas altas | Secretos detectados por Gitleaks N/D; vulnerabilidades activas 1; vulnerabilidades históricas 188; hotspots 0; Security Rating nuevo A | **PARCIAL** |

> El Quality Gate se encuentra en estado OK. Consulta las condiciones de `quality-gate.json` para conocer el detalle.

Los JSON crudos se conservan en `../results/`.
