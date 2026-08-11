# JM-REN-05

- Estado: **PASS**.
- Perfil seleccionado: formal.
- Fecha UTC: 2026-08-11T16:08:18.916Z.
- Criterio: Todos los listados paginados devuelven <= 50; limit=51 se rechaza.
- Duración medida: 23.14 s.
- Fuente: `tests/results/fase6/jmeter/results/2026-08-11T16-06-04-593Z/JM-REN-05/resultado.json`.
- Regla de selección: formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL; empate: ejecución más reciente.
- JTL canónicos:
  - `tests/results/fase6/jmeter/results/canonical/JM-REN-05/resultados.jtl`

- REN05 historial cliente: 1 muestras, p95 232 ms, errores 0 %, throughput 4.31/s.
- REN05 pedidos admin: 1 muestras, p95 23 ms, errores 0 %, throughput 43.48/s.
- REN05 usuarios admin: 1 muestras, p95 21 ms, errores 0 %, throughput 47.62/s.
- REN05 rechaza limit 51: 1 muestras, p95 12 ms, errores 0 %, throughput 83.33/s.
- Oráculo de datos: PASS — Dataset conserva 60 pedidos y al menos 60 usuarios.
