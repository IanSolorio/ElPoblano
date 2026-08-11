# JM-DIS-03

- Estado: **PENDIENTE_FORMAL**.
- Perfil seleccionado: smoke.
- Fecha UTC: 2026-08-11T04:52:28.691Z.
- Criterio: /health y /ready responden 100 % correctamente bajo carga.
- Duración medida: 47.16 s.
- Fuente: `tests/results/fase6/jmeter/results/2026-08-11T04-47-44-008Z/JM-DIS-03/resultado.json`.
- Regla de selección: formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL; empate: ejecución más reciente.
- JTL canónicos:
  - `tests/results/fase6/jmeter/results/canonical/JM-DIS-03/resultados.jtl`

- DIS03 carga productos: 38 muestras, p95 22 ms, errores 0 %, throughput 2.76/s.
- DIS03 GET health: 7 muestras, p95 77 ms, errores 0 %, throughput 0.57/s.
- DIS03 GET ready: 7 muestras, p95 8 ms, errores 0 %, throughput 0.57/s.
- Oráculo de datos: PASS — El escenario no requiere mutaciones persistentes.
