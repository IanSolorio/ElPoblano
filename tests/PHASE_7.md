# Fase 7 — Análisis con SonarQube Cloud

## Objetivo

Analizar el monorepo desde SonarQube Cloud para obtener bugs,
vulnerabilidades, code smells, cobertura, complejidad, security hotspots,
deuda técnica y el resultado del Quality Gate.

## Configuración inicial

1. Iniciar sesión en SonarQube Cloud mediante GitHub.
2. Importar el repositorio `IanSolorio/ElPoblano`.
3. Desactivar **Automatic Analysis** en `Administration > Analysis Method`.
4. Copiar la organización y la clave de proyecto mostradas por SonarQube Cloud.
5. Crear un token de análisis. El token nunca debe guardarse en Git ni `.env`.

El análisis automático se desactiva porque esta fase necesita importar la
cobertura LCOV y posteriormente será ejecutada desde GitHub Actions.

## Primera ejecución desde PowerShell

```powershell
$env:SONAR_HOST_URL = "https://sonarcloud.io"
$env:SONAR_ORGANIZATION = "ORGANIZACION_DE_SONAR"
$env:SONAR_PROJECT_KEY = "CLAVE_MOSTRADA_POR_SONAR"
$env:SONAR_TOKEN = "TOKEN_GENERADO_EN_SONAR"
npm.cmd run sonar:analyze
```

El comando regenera las coberturas unitarias de backend y frontend en
`tests/results/fase5/unitarias/reports/`, las combina para SonarQube, ejecuta
el escáner, espera el procesamiento y descarga las evidencias en
`tests/results/fase7/sonarqube/`.

Si el análisis fue cargado correctamente pero falló temporalmente la descarga
de evidencias, no es necesario repetir el escaneo. Conservando las mismas
variables de entorno, ejecutar:

```powershell
npm.cmd run sonar:collect
```

## Evidencias

La ubicación canónica es `tests/results/fase7/sonarqube/`:

- `sonar-project.properties`: configuración del análisis.
- `results/cobertura.lcov`: cobertura importada (generada, no versionada).
- `results/metricas.json`: métricas de calidad y deuda.
- `results/quality-gate.json`: condiciones del Quality Gate.
- `results/incidencias.json`: problemas abiertos detectados.
- `evidence/casos-sonarqube.csv`: resultado trazable de `SQ-MAN-01..06` y
  `SQ-SEG-01/05`.
- `evidence/RESUMEN.md`: interpretación ejecutiva sin ocultar métricas
  pendientes.

El estado consolidado de los 32 RF y 42 RNF se encuentra únicamente en
`tests/results/trazabilidad/matriz_final.csv`.
