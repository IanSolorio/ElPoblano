# JM-REN-05

- Estado: **PASS**.
- Perfil seleccionado: smoke.
- Fecha UTC: 2026-08-11T04:50:42.490Z.
- Criterio: Todos los listados paginados devuelven <= 50; limit=51 se rechaza.
- Duración medida: 30.67 s.
- Fuente: `tests/results/fase6/jmeter/results/2026-08-11T04-47-44-008Z/JM-REN-05/resultado.json`.
- Regla de selección: formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL; empate: ejecución más reciente.
- JTL canónicos:
  - `tests/results/fase6/jmeter/results/canonical/JM-REN-05/resultados.jtl`

- REN05 historial cliente: 1 muestras, p95 256 ms, errores 0 %, throughput 3.91/s.
- REN05 pedidos admin: 1 muestras, p95 29 ms, errores 0 %, throughput 34.48/s.
- REN05 usuarios admin: 1 muestras, p95 20 ms, errores 0 %, throughput 50/s.
- REN05 rechaza limit 51: 1 muestras, p95 10 ms, errores 0 %, throughput 100/s.
- Oráculo de datos: PASS — Dataset conserva 60 pedidos y al menos 60 usuarios.
