# Fase 6 — Automatización

## Objetivo y estado actual

Esta fase automatiza los casos funcionales con Selenium y los escenarios no
funcionales con JMeter.

| Herramienta | Comando principal | Alcance | Último estado registrado |
|---|---|---|---|
| Selenium | `npm run test:selenium` | 44 casos: 32 RF y 12 RNF | 42 `PASS`, 0 fallidos y 2 `REQUIERE_REVISION` porque necesitan un entorno HTTPS |
| JMeter | `npm run test:jmeter` | 14 escenarios RNF | 13 `PASS` y 1 `PENDIENTE_FORMAL` |

La Fase 6 **no está completamente finalizada**. En Selenium siguen pendientes
los casos HTTPS `SEL-SEG-03` y `SEL-SEG-08`; en JMeter solo sigue pendiente la
ejecución formal de `JM-DIS-03`.

## Ejecución segura

- Los comandos se ejecutan desde la raíz del repositorio.
- `apps/backend/.env` debe contener `TEST_DATABASE_URL` apuntando a una base
  aislada de pruebas. Los ejecutores rechazan una base no identificada como de
  prueba y JMeter rechaza `NODE_ENV=production`.
- Los ejecutores preparan y reinician sus propios fixtures. Nunca deben
  apuntarse a producción ni a una base compartida con datos que deban
  conservarse.
- Selenium requiere Chrome y un ChromeDriver compatible. Puede definirse
  `CHROMEDRIVER_PATH` si no se resuelve automáticamente.
- JMeter requiere Apache JMeter 5.6.3 disponible en `PATH` o mediante
  `JMETER_HOME`.

## Selenium

El ejecutor prepara los fixtures, inicia un backend aislado, compila el
frontend, inicia Vite Preview y ejecuta los 44 archivos en serie:

```powershell
npm run test:selenium
```

Para ejecutar casos concretos:

```powershell
npm run test:selenium -- --case=SEL-RF-01,SEL-SEG-08
```

Variables útiles:

- `E2E_HEADLESS=false`: muestra el navegador durante la ejecución.
- `CHROMEDRIVER_PATH`: ruta explícita al controlador de Chrome.
- `E2E_COOKIE_TEST_URL`, `E2E_HTTPS_CUSTOMER_EMAIL` y
  `E2E_HTTPS_CUSTOMER_PASSWORD`: entorno y credenciales E2E dedicadas para
  validar los atributos seguros de cookie en `SEL-SEG-03`.
- `E2E_HTTPS_BASE_URL`: despliegue HTTPS usado por `SEL-SEG-08` para comprobar
  que no exista contenido inseguro.

La última campaña ejecutó 44 casos: 42 quedaron en `PASS`, ninguno falló y los
dos casos HTTPS quedaron en `REQUIERE_REVISION`. Por ello, el resultado global
de esa campaña es **NO APROBADO**; un caso omitido no se convierte en un
`PASS` local artificial.

Las pruebas fuente están en `tests/results/fase6/selenium/tests/`. Cada campaña
genera JUnit, resumen, información del entorno y evidencias de fallos en
`tests/results/fase6/selenium/reports/<fecha-UTC>/`. El puntero legible a la
campaña más reciente es
`tests/results/fase6/selenium/reports/ULTIMA_EJECUCION.md`.

## JMeter

El comando principal ejecuta los 14 escenarios con el perfil `formal` por
defecto:

```powershell
npm run test:jmeter
```

También se puede seleccionar un perfil o uno o varios casos:

```powershell
npm run test:jmeter -- --profile=smoke
npm run test:jmeter -- --profile=formal --case=JM-DIS-01
npm run test:jmeter -- --profile=formal --case=JM-DIS-03
```

El perfil `smoke` sirve para comprobar técnicamente los planes en menos tiempo,
pero no satisface las duraciones exigidas por disponibilidad. `JM-DIS-01` y
`JM-DIS-03` exigen 5 minutos; cuando solo existe evidencia `smoke`, el caso
permanece en `PENDIENTE_FORMAL`. `JM-DIS-01` ya dispone de evidencia formal.

Los 14 planes están en `tests/results/fase6/jmeter/plans/`. Cada campaña guarda
resultados de máquina en `jmeter/results/<fecha-UTC>/` y reportes legibles y
dashboards en `jmeter/reports/<fecha-UTC>/`.

Después de una o más campañas, la evidencia estable se reconstruye con:

```powershell
npm run quality:jmeter:consolidate
```

Las rutas canónicas son:

- `tests/results/fase6/jmeter/results/canonical/`: `ejecucion.json`, un
  `resultado.json` por caso y los JTL seleccionados.
- `tests/results/fase6/jmeter/reports/canonical/`: resumen global, matriz CSV y
  un resumen Markdown por caso.

El consolidado actual contiene evidencia para los 14 casos, con 13 `PASS` y
un `PENDIENTE_FORMAL`. Que la cobertura de evidencia sea 14/14 no significa
que todos los criterios estén aprobados.

### Control específico de JM-DIS-01

`JM-DIS-01` mantiene 10 usuarios concurrentes, una rampa de 10 segundos y la
pausa definida de 6 segundos. Durante 300 segundos mide por separado el
frontend servido con Vite Preview y `GET /api/productos`. La evidencia formal
es `PASS`: 246 muestras del frontend y 240 de la API, 486 en total, con 0 % de
errores y disponibilidad observada del 100 %.

### Control específico de JM-ESC-02

`JM-ESC-02` crea un fixture de **exactamente 100 pedidos** y aplica una carga de
25 usuarios con 3 iteraciones por usuario. El criterio es `p95 <= 2 s`. La
última evidencia canónica es `PASS`: 75 muestras, p95 de 111.4 ms y 0 % de
errores.

## Cierre pendiente

Para cerrar la fase todavía se debe:

1. Ejecutar `SEL-SEG-03` y `SEL-SEG-08` contra un despliegue HTTPS controlado.
2. Ejecutar `JM-DIS-03` con perfil `formal`.
3. Volver a consolidar JMeter y actualizar el resumen solo con evidencia real.
