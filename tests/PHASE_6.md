# Fase 6 — Automatización

## Selenium

Con frontend y backend activos:

```powershell
npm.cmd run test:selenium
```

Variables opcionales: `E2E_BASE_URL` (por defecto `http://localhost:5173`),
`E2E_HEADLESS=false` para observar el navegador y `CHROMEDRIVER_PATH` si el
controlador no puede resolverse automáticamente. El reporte JUnit, entorno,
capturas y consola de fallos se guardan en `tests/results/fase6/selenium/`.

## JMeter

Instalar Apache JMeter 5.6.3, definir `JMETER_HOME` si no está en el `PATH` y
ejecutar:

```powershell
npm.cmd run test:load
```

Variables: `JMETER_BASE_URL`, `JMETER_THREADS`, `JMETER_RAMP`,
`JMETER_MAX_P95_MS` y `JMETER_MAX_ERROR_PCT`. Valores predeterminados: API
local, 25 usuarios concurrentes, 5 segundos de subida, p95 máximo de 800 ms y
errores máximos de 1 %. Cada usuario consulta el catálogo una vez para no
invalidar la medición con el límite global de 120 solicitudes por minuto.

El JTL, log, resumen JSON/Markdown y dashboard HTML se guardan en
`tests/results/fase6/jmeter/`. El comando termina con error si incumple alguno
de los umbrales.

No se ejecutan cargas contra producción sin autorización y una ventana
controlada.
