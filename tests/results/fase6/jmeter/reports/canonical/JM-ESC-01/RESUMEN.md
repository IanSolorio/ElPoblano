# JM-ESC-01

- Estado: **PASS**.
- Perfil seleccionado: smoke.
- Fecha UTC: 2026-08-11T04:55:38.144Z.
- Criterio: 5→25 usuarios; errores < 1 %; degradación p95 <= 3x.
- Duración medida: 164.47 s.
- Fuente: `tests/results/fase6/jmeter/results/2026-08-11T04-47-44-008Z/JM-ESC-01/resultado.json`.
- Regla de selección: formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL; empate: ejecución más reciente.
- JTL canónicos:
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/10-usuarios/resultados.jtl`
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/15-usuarios/resultados.jtl`
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/20-usuarios/resultados.jtl`
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/25-usuarios/resultados.jtl`
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/5-usuarios/resultados.jtl`

- ESC01 GET productos: 15 muestras, p95 366 ms, errores 0 %, throughput 9.8/s.
- ESC01 GET productos: 30 muestras, p95 146.1 ms, errores 0 %, throughput 17.26/s.
- ESC01 GET productos: 45 muestras, p95 151.1 ms, errores 0 %, throughput 25.25/s.
- ESC01 GET productos: 60 muestras, p95 130.75 ms, errores 0 %, throughput 32.84/s.
- ESC01 GET productos: 75 muestras, p95 100.2 ms, errores 0 %, throughput 40.61/s.
- Oráculo de datos: PASS — El escenario no requiere mutaciones persistentes.
