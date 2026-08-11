# JM-ESC-01

- Estado: **PASS**.
- Perfil seleccionado: formal.
- Fecha UTC: 2026-08-11T16:21:12.381Z.
- Criterio: 5→25 usuarios; errores < 1 %; degradación p95 <= 3x.
- Duración medida: 91.85 s.
- Fuente: `tests/results/fase6/jmeter/results/2026-08-11T16-06-04-593Z/JM-ESC-01/resultado.json`.
- Regla de selección: formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL; empate: ejecución más reciente.
- JTL canónicos:
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/10-usuarios/resultados.jtl`
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/15-usuarios/resultados.jtl`
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/20-usuarios/resultados.jtl`
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/25-usuarios/resultados.jtl`
  - `tests/results/fase6/jmeter/results/canonical/JM-ESC-01/jtl/5-usuarios/resultados.jtl`

- ESC01 GET productos: 15 muestras, p95 171 ms, errores 0 %, throughput 9.73/s.
- ESC01 GET productos: 30 muestras, p95 113.65 ms, errores 0 %, throughput 17.34/s.
- ESC01 GET productos: 45 muestras, p95 89.6 ms, errores 0 %, throughput 25.15/s.
- ESC01 GET productos: 60 muestras, p95 61.4 ms, errores 0 %, throughput 32.89/s.
- ESC01 GET productos: 75 muestras, p95 43 ms, errores 0 %, throughput 40.5/s.
- Oráculo de datos: PASS — El escenario no requiere mutaciones persistentes.
