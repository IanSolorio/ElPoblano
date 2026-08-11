# Evidencias JMeter — Fase 6

## Alcance

Esta carpeta contiene los 14 planes JMeter de la Fase 6, las campañas
generadas por fecha y el snapshot canónico que consume la trazabilidad del
proyecto.

Los escenarios son:

- Seguridad: `JM-SEG-06`.
- Rendimiento: `JM-REN-01`, `JM-REN-02`, `JM-REN-03` y `JM-REN-05`.
- Disponibilidad: `JM-DIS-01` y `JM-DIS-03`.
- Escalabilidad: `JM-ESC-01` y `JM-ESC-02`.
- Concurrencia e integridad: `JM-CON-01` a `JM-CON-05`.

## Ejecución

Requisitos:

- Apache JMeter 5.6.3 disponible en `PATH` o configurado con `JMETER_HOME`.
- `TEST_DATABASE_URL` configurada en `apps/backend/.env` y dirigida a una base
  aislada de pruebas.
- `NODE_ENV` distinto de `production`.

El ejecutor inicia un backend aislado, prepara los fixtures y reinicia los
datos antes de cada caso. Por ese motivo, nunca debe usarse con una base de
producción ni con datos compartidos que deban conservarse.

La campaña completa usa el perfil formal de manera predeterminada:

```powershell
npm run test:jmeter
```

Opciones admitidas:

```powershell
npm run test:jmeter -- --profile=smoke
npm run test:jmeter -- --profile=formal --case=JM-ESC-02
npm run test:jmeter -- --profile=formal --case=JM-DIS-01
npm run test:jmeter -- --profile=formal --case=JM-DIS-03
```

El perfil `smoke` acorta los escenarios de duración. Una comprobación técnica
correcta no sustituye el tiempo formal: `JM-DIS-01` y `JM-DIS-03` exigen 5
minutos. Si se selecciona evidencia `smoke`, el estado es `PENDIENTE_FORMAL`.
`JM-DIS-01` ya cuenta con una ejecución formal aprobada.

## Estructura

```text
jmeter/
├── plans/                         # 14 planes JMX versionados
├── results/
│   ├── <fecha-UTC>/               # JSON, JTL y logs de una campaña fuente
│   └── canonical/                 # Evidencia de máquina seleccionada
│       ├── ejecucion.json
│       └── <ID>/
│           ├── resultado.json
│           └── resultados.jtl
├── reports/
│   ├── <fecha-UTC>/               # Resúmenes y dashboards de la campaña
│   └── canonical/                 # Evidencia legible seleccionada
│       ├── RESUMEN.md
│       ├── matriz-jmeter.csv
│       └── <ID>/RESUMEN.md
└── README.md
```

`JM-ESC-01` tiene varios JTL canónicos, uno por etapa de usuarios, bajo
`results/canonical/JM-ESC-01/jtl/`. El snapshot canónico no duplica dashboards
ni logs; estos permanecen en las campañas fuente fechadas.

## Consolidación canónica

Después de ejecutar una o más campañas se reconstruye el snapshot estable con:

```powershell
npm run quality:jmeter:consolidate
```

Este comando no ejecuta JMeter. Inspecciona las campañas cerradas, selecciona
la mejor evidencia por cada uno de los 14 IDs y escribe:

- `results/canonical/`: `ejecucion.json`, `resultado.json` y JTL por caso.
- `reports/canonical/`: resumen general, matriz CSV y resumen por caso.

La prioridad de selección es:

```text
formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL
```

En caso de empate se elige la ejecución más reciente. Las campañas fuente no
se borran ni se sustituyen. El campo de evidencia completa indica que los 14
casos tienen una fuente seleccionada; no implica que los 14 estén aprobados.

## Snapshot actual

La evidencia canónica registra 14 de 14 casos con evidencia:

- 13 `PASS`.
- 1 `PENDIENTE_FORMAL`: `JM-DIS-03`.

Por tanto, el componente JMeter de la Fase 6 todavía no está completamente
cerrado.

### JM-ESC-02

El fixture crea **exactamente 100 pedidos sintéticos**. El plan ejecuta 25
usuarios con 3 iteraciones cada uno, para un total esperado de 75 muestras, y
exige `p95 <= 2 s`.

La última evidencia canónica seleccionada corresponde al perfil formal y está
en `results/canonical/JM-ESC-02/`:

- Estado: `PASS`.
- Muestras: 75.
- p95: 111.4 ms.
- Errores: 0 %.

### JM-DIS-01

El plan conserva 10 usuarios concurrentes, rampa de 10 segundos y pausa de 6
segundos. Durante **300 segundos** consulta por separado el frontend local
servido con Vite Preview y la API `GET /api/productos`. Su umbral es una
disponibilidad observada de al menos 99 %.

La evidencia formal canónica registra:

- Estado: `PASS`.
- Frontend: 246 muestras.
- API: 240 muestras.
- Total: 486 muestras.
- Errores: 0 %.
- Disponibilidad observada: 100 %.

## Pendientes formales

- `JM-DIS-03`: ejecutar los 5 minutos exigidos y consolidar la campaña.

Hasta contar con esas evidencias, no debe declararse la Fase 6 como
completamente finalizada.
