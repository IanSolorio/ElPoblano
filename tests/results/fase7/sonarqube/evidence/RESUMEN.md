# Resultado de SonarQube Cloud

- Fecha UTC: 2026-08-11T20:55:51.417Z
- Organización: iansolorio
- Proyecto: IanSolorio_ElPoblano
- Quality Gate: **OK**
- Bugs: 0
- Vulnerabilidades activas reales: 1
- Vulnerabilidades activas altas/críticas: 1
- Métrica global Sonar vulnerabilities: 1
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
| SQ-MAN-01 | MAN-01 | Quality Gate PASS; 0 bugs y 0 vulnerabilidades activas | Gate OK; bugs 0; vulnerabilidades activas reales 1; incidencias abiertas totales 1; métrica global Sonar vulnerabilities 1 | **FAIL** |
| SQ-MAN-02 | MAN-02 | Cobertura global >=70%; backend >=80%; módulos críticos >=70% | Global 73.8%; backend 85.29%; módulos críticos: auth 81.37%; orders 76.36%; payments 98.77%; products 83.44%; promotions 91.18%; cart 100%; admin 78.49%; catalog 100% | **PASS** |
| SQ-MAN-03 | MAN-03 | Duplicación <=3%; se prioriza código nuevo y, si Sonar no publica la métrica, se usa duplicación global | Duplicación código nuevo: 0% | **PASS** |
| SQ-MAN-04 | MAN-04 | La complejidad ciclomática y cognitiva debe ser medida por SonarQube y no existir incidencias activas de mantenibilidad relacionadas con complejidad excesiva | Complejidad ciclomática global 1182; complejidad cognitiva global 508; code smells 0; Maintainability Rating A; Quality Gate OK; incidencias activas de complejidad 0 | **PASS** |
| SQ-MAN-05 | MAN-05 | Maintainability Rating A; se prioriza código nuevo y, si no está disponible, se usa el rating global | Maintainability Rating código nuevo: A | **PASS** |
| SQ-MAN-06 | MAN-06 | Ratio de deuda técnica <=5% y Maintainability Rating A | Deuda global 0 min; ratio global 0.0%; rating global A | **PASS** |
| SQ-SEG-01 | SEG-01 | Argon2id presente y 0 exposiciones detectadas | Argon2id presente; evidencia de no exposición de hashes presente; incidencias activas sobre credenciales/hashes 0 | **PASS** |
| SQ-SEG-05 | SEG-05 | 0 secretos; 0 vulnerabilidades activas altas/críticas; Security Rating nuevo A | Gitleaks N/D; secretos detectados N/D; vulnerabilidades activas de seguridad 1; altas/críticas 1; incidencias históricas 188; hotspots 0; Security Rating nuevo A | **PENDIENTE_EVIDENCIA** |

> El Quality Gate se encuentra en estado OK. Consulta las condiciones de `quality-gate.json` para conocer el detalle.

Los JSON crudos se conservan en `../results/`.
