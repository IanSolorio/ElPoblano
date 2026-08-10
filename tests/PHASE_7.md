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

El comando normaliza la cobertura de la Fase 5, ejecuta el escáner, espera el
procesamiento y descarga las evidencias en `tests/results/fase7/`.

## Evidencias

- `cobertura.lcov`: cobertura importada.
- `metricas.json`: métricas de calidad y deuda.
- `quality-gate.json`: condiciones y resultado del Quality Gate.
- `incidencias.json`: problemas abiertos detectados.
- `RESUMEN.md`: resultado ejecutivo de la fase.

