# Fase 6 — Automatización

## Selenium

Con frontend y backend activos:

```powershell
npm.cmd run test:selenium
```

Variables opcionales: `E2E_BASE_URL` (por defecto `http://localhost:5173`) y
`E2E_HEADLESS=false` para observar el navegador. El reporte JUnit, entorno,
capturas y consola de fallos se guardan en `tests/reports/selenium/`.

## JMeter

Instalar Apache JMeter, definir `JMETER_HOME` y ejecutar:

```powershell
npm.cmd run test:load
```

Variables: `JMETER_BASE_URL`, `JMETER_THREADS`, `JMETER_RAMP` y
`JMETER_DURATION`. Valores predeterminados: API local, 10 usuarios, 10 segundos
de subida y 60 segundos de duración. El JTL, log y dashboard HTML se guardan en
`tests/reports/jmeter/`.

No se ejecutan cargas contra producción sin autorización y ventana controlada.

