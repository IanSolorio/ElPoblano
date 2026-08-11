# ST-NF-01 — prueba de sistema

- Prioridad: P0
- Escenario: Reiniciar servicio `elpoblano`
- Resultado esperado: `systemd` lo deja `active (running)` y health vuelve a 200 en máximo 30 segundos
- Resultado observado: Conforme: el servicio volvió a estar activo y `/api/health` respondió HTTP 200 en 1 segundo.
- Estado: **APROBADO**
- Defecto: NINGUNO
- Responsable: Ian Solorio Palomino
- Fecha UTC: 2026-08-11T01:03:22Z
