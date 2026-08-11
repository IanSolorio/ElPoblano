# Resultado de SonarQube Cloud

- Fecha del análisis UTC: 2026-08-11T18:31:15Z
- Organización: iansolorio
- Proyecto: IanSolorio_ElPoblano
- Quality Gate: **ERROR**
- Bugs: 0
- Vulnerabilidades activas: 0
- Vulnerabilidades agregadas por Sonar en el periodo: 1 (histórica, `jssecurity:S8476`, corregida)
- Code smells: 0
- Security hotspots: 0
- Cobertura global: 73.8 %
- Cobertura de código nuevo: 82.2 %
- Cobertura backend (LCOV): 85.29 %
- Complejidad ciclomática global: 1182
- Complejidad cognitiva global: 508
- Deuda técnica global: 0 minutos (0.00 horas)
- Incidencias abiertas: 0
- Incidencias históricas conservadas: 1

## Casos trazables

| Caso | RNF | Umbral | Resultado observado | Estado |
|---|---|---|---|---|
| SQ-MAN-01 | MAN-01 | Quality Gate PASS; 0 bugs y 0 vulnerabilidades activas | Gate ERROR por Security Rating nuevo B; bugs 0; vulnerabilidades activas 0; vulnerabilidad histórica corregida 1 | **FAIL** |
| SQ-MAN-02 | MAN-02 | Cobertura global >=70%; backend >=80%; módulos críticos >=70% | Global Sonar 73.8%; código nuevo 82.2%; backend LCOV 85.29%; auth 81.37%; orders 76.36%; payments 98.77%; products 83.44%; promotions 91.18%; cart 100%; admin 78.49%; catalog 100% | **PASS** |
| SQ-MAN-03 | MAN-03 | Duplicación nueva <=3% | Duplicación nueva 0% | **PASS** |
| SQ-MAN-04 | MAN-04 | Complejidad ciclomática por función nueva <=10 | Complejidad global 1182; cognitiva global 508; SonarQube Cloud no aporta en esta evidencia un desglose válido por función nueva | **PENDIENTE_METRICA** |
| SQ-MAN-05 | MAN-05 | Maintainability Rating de código nuevo = A | Rating de código nuevo A | **PASS** |
| SQ-MAN-06 | MAN-06 | Deuda técnica nueva <=5% y rating A | Deuda global 0 min; ratio global 0.0%; rating global A | **PASS** |
| SQ-SEG-01 | SEG-01 | Argon2id presente y 0 exposiciones detectadas | Argon2id presente; evidencia de no exposición de hashes presente; incidencias activas sobre credenciales/hashes 0 | **PASS** |
| SQ-SEG-05 | SEG-05 | 0 secretos y 0 vulnerabilidades críticas/nuevas altas | Vulnerabilidades activas 0; vulnerabilidad histórica corregida 1; hotspots 0; escaneo dedicado de secretos pendiente de Fase 8 | **PARCIAL** |

> La cobertura de código nuevo es 82.2 % y supera el umbral configurado de 80 %. El Quality Gate permanece en estado ERROR porque el Security Rating del código nuevo es B dentro del periodo de código nuevo configurado. La única vulnerabilidad registrada (`jssecurity:S8476`) está cerrada y corregida, y no existen incidencias activas. No se alteró la versión ni el periodo de código nuevo para modificar artificialmente el resultado. Las condiciones de cobertura, fiabilidad, mantenibilidad, duplicación y hotspots revisados se encuentran aprobadas.

Los JSON crudos se conservan en `../results/`.
