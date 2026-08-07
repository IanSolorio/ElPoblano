# Calidad del backend según ISO/IEC 25010:2023

ISO/IEC 25010 define un modelo de calidad, no columnas obligatorias para la base de datos. El backend traduce sus características en decisiones y criterios verificables.

| Característica | Aplicación en ElPoblano | Evidencia inicial |
|---|---|---|
| Adecuación funcional | Catálogo público, cuentas, sesiones, checkout, pagos e historial | Rutas `/api/productos`, `/api/auth` y `/api/pedidos` |
| Eficiencia de desempeño | Consultas paginadas, índices y límites de solicitudes | Índices Prisma, historial con `page/limit`, rate limiting |
| Compatibilidad | API HTTP/JSON y CORS configurable | Configuración centralizada en `app.js` |
| Capacidad de interacción | Errores consistentes y validación de entradas | Códigos, mensajes y `requestId` en respuestas de error |
| Fiabilidad | Transacciones, control atómico de stock e idempotencia | Transacción de checkout e índice único de `idempotency_key` |
| Seguridad | Argon2id, sesiones revocables, autorización por rol y cookies HttpOnly | Módulo `auth`, Helmet y auditoría |
| Mantenibilidad | Clean Architecture modular e inversión de repositorios | Capas `domain`, `application`, `infrastructure`, `presentation` |
| Flexibilidad | Persistencia y proveedores de pago reemplazables | Contratos de repositorios y campos `provider/externalId` |
| Protección | Migraciones versionadas, eliminación restringida y trazabilidad | Claves foráneas, `audit_logs` e historial de migraciones |

## Criterios de aceptación de calidad iniciales

- Ninguna contraseña se almacena o devuelve en texto plano.
- Ningún endpoint privado funciona sin una sesión vigente.
- Un cliente solo puede consultar sus propios pedidos.
- Una misma clave de idempotencia no crea dos pedidos.
- Pedido, detalle, pago, stock y movimiento de inventario se registran en una transacción.
- Los listados crecientes están paginados y tienen un límite máximo.
- Los errores incluyen un identificador de solicitud sin revelar trazas en producción.
- Las migraciones, el esquema y las pruebas se versionan junto con el código.
- Las operaciones administrativas aplican RBAC: `CUSTOMER`, `ADMIN` y `SUPER_ADMIN`.
- Productos, promociones y usuarios se retiran lógicamente para conservar referencias históricas.
- Crear, modificar, activar, desactivar o retirar recursos administrativos genera una auditoría.

## Pagos

El modelo admite Yape, tarjeta de crédito y tarjeta de débito. En esta fase se registra la intención de pago con estado `PENDING`; aprobar o rechazar pagos requiere integrar una pasarela real y verificar su webhook. El sistema nunca debe recibir ni persistir el número completo, CVV o PIN de una tarjeta.
