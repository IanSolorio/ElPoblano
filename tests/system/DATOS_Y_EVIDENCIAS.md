# Datos y evidencias de pruebas de sistema

## Datos mínimos

| Código | Dato requerido | Restricción |
|---|---|---|
| TD-01 | Cliente activo con dirección GPS | Correo exclusivo del ambiente de prueba |
| TD-02 | Administrador activo | No debe ser superadministrador |
| TD-03 | Superadministrador activo | Cuenta bootstrap del ambiente de prueba |
| TD-04 | Producto disponible | Precio ≥ S/ 3 y stock ≥ 10 |
| TD-05 | Producto agotado | Stock exactamente 0 |
| TD-06 | Promoción individual vigente | Inicio pasado y fin futuro |
| TD-07 | Combo vigente | Dos o más productos, cantidades e imagen |
| TD-08 | Tarjetas sandbox | Aprobada, rechazada, crédito y débito compatible |
| TD-09 | Pedido confirmado | Pago aprobado en sandbox |
| TD-10 | Mes estadístico | Pedidos sembrados con cantidades conocidas |

## Evidencia obligatoria

Cada carpeta de caso debe usar el identificador como nombre, por ejemplo
`ST-E2E-09/`, y contener cuando aplique:

- `01-precondicion.png`
- `02-accion.png`
- `03-resultado.png`
- `network.har`
- `console.txt`
- `consulta.sql.txt` sin credenciales
- `observaciones.md`

No deben guardarse contraseñas, tokens, cookies, claves privadas, números completos
de tarjeta ni cadenas de conexión. Las capturas deben ocultar esos valores.

## Regla para resultados

- `APROBADO`: coincide completamente con el resultado esperado.
- `FALLIDO`: existe una diferencia reproducible; se registra el defecto asociado.
- `BLOQUEADO`: no pudo ejecutarse por ambiente o dependencia externa.
- `NO_EJECUTADO`: todavía no se intentó.

