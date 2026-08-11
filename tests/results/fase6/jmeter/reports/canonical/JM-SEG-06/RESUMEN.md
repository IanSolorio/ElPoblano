# JM-SEG-06

- Estado: **PASS**.
- Perfil seleccionado: smoke.
- Fecha UTC: 2026-08-11T04:48:19.811Z.
- Criterio: 120 solicitudes permitidas y 100 % de excesos con HTTP 429.
- Duración medida: 30.55 s.
- Fuente: `tests/results/fase6/jmeter/results/2026-08-11T04-47-44-008Z/JM-SEG-06/resultado.json`.
- Regla de selección: formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL; empate: ejecución más reciente.
- JTL canónicos:
  - `tests/results/fase6/jmeter/results/canonical/JM-SEG-06/resultados.jtl`

- SEG06 permitida: 120 muestras, p95 4 ms, errores 0 %, throughput 282.35/s.
- SEG06 exceso 429: 10 muestras, p95 4 ms, errores 0 %, throughput 19.53/s.
- Oráculo de datos: PASS — El escenario no requiere mutaciones persistentes.
