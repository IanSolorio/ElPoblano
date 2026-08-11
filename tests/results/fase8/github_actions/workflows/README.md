# Fase 8 — GitHub Actions

El workflow ejecutable se encuentra en:

```text
.github/workflows/quality.yml
```

GitHub solamente reconoce workflows ubicados bajo `.github/workflows/`. Esta
carpeta conserva la organización documental solicitada para la Fase 8, pero no
duplica el YAML para evitar mantener dos versiones diferentes del pipeline.

## Automatización implementada

El workflow `Calidad continua` se ejecuta en cada `push` o `pull_request` hacia
`main` y `developer`, y también permite ejecución manual con `workflow_dispatch`.

Realiza, en orden:

1. Clonación completa del repositorio.
2. Configuración de Node.js 22 y `npm ci`.
3. Creación de una instancia MySQL 8.4 aislada llamada `elpoblano_test`.
4. Generación del cliente Prisma y ejecución de `prisma migrate deploy`.
5. Lint del monorepo.
6. Build del frontend.
7. Pruebas y consolidación de Fase 5 con `npm run test:phase5`.
8. Análisis de SonarQube Cloud y verificación del Quality Gate.
9. Publicación del build y de los reportes como artefactos descargables.

Las pruebas usan exclusivamente `elpoblano_test`; el workflow no recibe ni
utiliza `DATABASE_URL` de producción.

## Configuración requerida en GitHub

En `Settings > Secrets and variables > Actions`:

### Secret

- `SONAR_TOKEN`: token privado de SonarQube Cloud.

### Variables

- `SONAR_HOST_URL`: `https://sonarcloud.io`
- `SONAR_ORGANIZATION`: `iansolorio`
- `SONAR_PROJECT_KEY`: `IanSolorio_ElPoblano`

El token no debe guardarse en archivos `.env`, en el YAML ni en el repositorio.

En SonarQube Cloud debe quedar desactivado `Automatic Analysis` desde
`Administration > Analysis Method`. SonarQube no admite que el análisis
automático y el análisis CI del workflow operen simultáneamente sobre el mismo
proyecto.

## Reportes

Cada ejecución publica dos artefactos:

- `frontend-build-<número>`: build estático de Vite.
- `reportes-calidad-<número>`: JUnit, LCOV, resúmenes de Fase 5, resultados de
  SonarQube y trazabilidad consolidada.

La existencia del workflow no convierte por sí sola los casos `CI-*` en PASS.
Su resultado se acredita cuando GitHub Actions complete una ejecución exitosa.
