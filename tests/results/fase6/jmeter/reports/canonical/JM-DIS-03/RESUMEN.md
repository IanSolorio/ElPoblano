# JM-DIS-03

- Estado: **PASS**.
- Perfil seleccionado: formal.
- Fecha UTC: 2026-08-11T16:19:15.837Z.
- Criterio: /health y /ready responden 100 % correctamente bajo carga.
- Duración medida: 315.03 s.
- Fuente: `tests/results/fase6/jmeter/results/2026-08-11T16-06-04-593Z/JM-DIS-03/resultado.json`.
- Regla de selección: formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL; empate: ejecución más reciente.
- JTL canónicos:
  - `tests/results/fase6/jmeter/results/canonical/JM-DIS-03/resultados.jtl`

- DIS03 carga productos: 435 muestras, p95 9 ms, errores 0 %, throughput 1.53/s.
- DIS03 GET health: 15 muestras, p95 49 ms, errores 0 %, throughput 0.05/s.
- DIS03 GET ready: 14 muestras, p95 15 ms, errores 0 %, throughput 0.05/s.
- Oráculo de datos: PASS — El escenario no requiere mutaciones persistentes.
