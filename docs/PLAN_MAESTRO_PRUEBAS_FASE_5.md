# Plan maestro de pruebas — Fase 5

| Campo | Valor |
|---|---|
| Proyecto | Plataforma web El Poblano |
| Versión | 1.0 |
| Fecha de corte | 9 de agosto de 2026 |
| Alcance | Backend, frontend, MySQL, Firebase Storage, Mercado Pago y despliegue web |
| Niveles | Unitarias, integración, sistema y aceptación |
| Requisitos cubiertos | RF-01 a RF-30 |

> Este documento define la línea base completa de pruebas del alcance implementado. Un caso definido no se considera aprobado hasta que exista evidencia de ejecución. Los casos marcados `Automatizada` corresponden a las 18 pruebas actuales de `apps/backend/tests`; los demás quedan `Pendiente` para las fases 5, 6 y 8.

> **Actualización del 9 de agosto de 2026:** los 104 casos `UT-*` fueron implementados con sus identificadores y se ejecutan mediante `npm run test:unit:evidence -w @elpoblano/backend`. Las etiquetas históricas de la columna `Estado` describen la línea base anterior a esta implementación; el reporte generado por el comando constituye el estado ejecutado vigente.

Este catálogo debe aplicarse junto con [`PLAN_MAESTRO_PROYECTO_CALIDAD.md`](./PLAN_MAESTRO_PROYECTO_CALIDAD.md), que define 42 requisitos no funcionales y sus métricas. Por ello, la ejecución de la Fase 5 deberá comprobar tanto RF-01–RF-30 como RNF de seguridad, rendimiento, usabilidad, disponibilidad, escalabilidad, mantenibilidad, portabilidad y confiabilidad.

## 1. Objetivo y estrategia

Validar que El Poblano satisface sus reglas funcionales, conserva la integridad de los datos y protege las operaciones según los roles `CUSTOMER`, `ADMIN` y `SUPER_ADMIN`. La estrategia sigue la pirámide de pruebas:

```text
Aceptación: requisitos y necesidades del usuario
Sistema: recorridos completos en una instalación desplegada
Integración: API, MySQL y proveedores/adaptadores
Unitarias: reglas aisladas, servicios y funciones
```

La Fase 6 automatizará principalmente los casos de sistema y aceptación con Selenium. JMeter empleará escenarios derivados de integración y sistema para rendimiento. La cobertura de las pruebas unitarias e integración será importada por SonarQube en la Fase 7, y GitHub Actions las orquestará en la Fase 8.

## 2. Convenciones

- Prioridad `P0`: seguridad, cobro, integridad o flujo crítico.
- Prioridad `P1`: función principal del negocio.
- Prioridad `P2`: interfaz, compatibilidad o caso secundario.
- Resultado HTTP esperado: `2xx` éxito, `400/422` entrada inválida, `401` sin autenticación, `403` sin rol, `404` inexistente y `409` conflicto.
- Cada prueba debe conservar fecha, versión/commit, entorno, datos, resultado, capturas o reporte y responsable.
- Mercado Pago debe usar usuarios, credenciales y tarjetas de prueba. Nunca se usarán tarjetas reales.

## 3. Datos y entornos controlados

Datos mínimos: un `SUPER_ADMIN`, un `ADMIN`, dos clientes (activo e inactivo), las siete categorías base, productos activos con stock alto/bajo/cero, producto retirado, promoción individual vigente/expirada/futura, combo vigente, pedidos en cada estado y pagos `PENDING`, `APPROVED`, `REJECTED` y `REFUNDED`.

Entornos:

1. Unitario: dobles de repositorios y proveedores, sin red ni base real.
2. Integración: base MySQL exclusiva de pruebas, migrada desde cero y reiniciable.
3. Sistema/Selenium: frontend y backend de pruebas con Firebase y Mercado Pago de prueba.
4. Aceptación: entorno estable equivalente a producción, con datos ficticios.

## 4. Pruebas unitarias

### 4.1 Autenticación, sesión y autorización

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-AUTH-01 | Registrar datos válidos | Normaliza correo, cifra contraseña, crea dirección predeterminada, auditoría y sesión | P0 | Automatizada parcialmente |
| UT-AUTH-02 | Registrar correo existente con diferente capitalización | Rechaza con `EMAIL_ALREADY_EXISTS` | P0 | Pendiente |
| UT-AUTH-03 | Normalizar nombres, teléfono y correo | Persiste valores recortados y correo en minúsculas | P1 | Pendiente |
| UT-AUTH-04 | Iniciar sesión con credenciales válidas | Genera token aleatorio y fecha de expiración configurada | P0 | Automatizada |
| UT-AUTH-05 | Contraseña incorrecta | Rechaza sin revelar si existe el correo | P0 | Pendiente |
| UT-AUTH-06 | Usuario inexistente | Devuelve el mismo error de credenciales | P0 | Pendiente |
| UT-AUTH-07 | Usuario inactivo | Impide iniciar sesión | P0 | Pendiente |
| UT-AUTH-08 | Autenticar sin token | Rechaza con `AUTHENTICATION_REQUIRED` | P0 | Pendiente |
| UT-AUTH-09 | Token inexistente, expirado o revocado | Rechaza con `INVALID_SESSION` | P0 | Pendiente |
| UT-AUTH-10 | Cerrar sesión con token | Revoca el hash del token, no el valor en claro | P0 | Automatizada |
| UT-AUTH-11 | Cerrar sesión sin token | Finaliza de forma idempotente | P1 | Pendiente |
| UT-AUTH-12 | Serializar usuario público | No expone hash, tokens, estado interno ni campos sensibles | P0 | Pendiente |
| UT-AUTH-13 | Hash y verificación Argon2 | Valida la clave correcta y rechaza otra | P0 | Pendiente |
| UT-AUTH-14 | Hash de token de sesión | Es determinista y no conserva el token original | P0 | Pendiente |
| UT-AUTH-15 | `CUSTOMER` intenta ruta administrativa | `requireAdmin` lo rechaza | P0 | Pendiente |
| UT-AUTH-16 | `ADMIN` intenta ruta exclusiva | `requireSuperAdmin` lo rechaza | P0 | Pendiente |
| UT-AUTH-17 | `ADMIN` y `SUPER_ADMIN` usan ruta administrativa | La autorización continúa | P0 | Pendiente |

### 4.2 Administración de usuarios

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-USR-01 | `SUPER_ADMIN` crea administrador | Cifra clave, normaliza correo y audita | P0 | Pendiente |
| UT-USR-02 | `ADMIN` crea administrador | Rechaza con `SUPER_ADMIN_REQUIRED` | P0 | Automatizada |
| UT-USR-03 | Crear administrador con correo existente | Rechaza con conflicto | P0 | Pendiente |
| UT-USR-04 | `ADMIN` actualiza cliente | Actualiza y audita | P1 | Automatizada |
| UT-USR-05 | `ADMIN` actualiza otro administrador | Rechaza | P0 | Automatizada |
| UT-USR-06 | `SUPER_ADMIN` actualiza administrador | Permite y audita | P0 | Pendiente |
| UT-USR-07 | Modificar usuario inexistente/eliminado | Devuelve `USER_NOT_FOUND` | P1 | Pendiente |
| UT-USR-08 | Desactivar cliente | Cambia estado, revoca sesiones y audita | P0 | Pendiente |
| UT-USR-09 | Reactivar cliente | Cambia estado y audita | P1 | Pendiente |
| UT-USR-10 | Actor se desactiva a sí mismo | Rechaza con `SELF_DEACTIVATION` | P0 | Pendiente |
| UT-USR-11 | Retirar usuario | Ejecuta retiro lógico, no borra historial | P0 | Pendiente |
| UT-USR-12 | Listar usuarios paginados | Respeta página, límite y no expone credenciales | P1 | Pendiente |

### 4.3 Productos, categorías e inventario

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-PRD-01 | Construir producto válido | Conserva nombre, descripción, precio, categoría, imagen, stock y estado | P1 | Automatizada |
| UT-PRD-02 | Crear producto con categoría activa | Crea y audita | P0 | Automatizada |
| UT-PRD-03 | Crear/editar con categoría inactiva o inexistente | Rechaza con `INVALID_CATEGORY` | P0 | Pendiente |
| UT-PRD-04 | Consultar producto inexistente | Devuelve 404 | P1 | Pendiente |
| UT-PRD-05 | Editar producto existente | Actualiza campos y audita | P0 | Pendiente |
| UT-PRD-06 | Cambiar stock | Registra movimiento de ajuste por la diferencia | P0 | Pendiente |
| UT-PRD-07 | Retirar producto | Realiza eliminación lógica y auditoría | P0 | Pendiente |
| UT-PRD-08 | Listado público | Excluye inactivos, retirados y stock cero | P0 | Pendiente |
| UT-PRD-09 | Listado administrativo | Incluye stock cero e inactivos para su gestión | P1 | Pendiente |
| UT-CAT-01 | Listar categorías públicas | Devuelve únicamente activas | P1 | Pendiente |
| UT-CAT-02 | Listar categorías administrativas | Incluye activas e inactivas | P1 | Pendiente |
| UT-CAT-03 | Crear categoría | Genera nombre/slug único y auditoría | P1 | Pendiente |
| UT-CAT-04 | Crear nombre o slug duplicado | Rechaza el conflicto | P1 | Pendiente |
| UT-CAT-05 | Actualizar categoría inexistente | Devuelve `CATEGORY_NOT_FOUND` | P1 | Pendiente |
| UT-CAT-06 | Activar/desactivar categoría | Cambia visibilidad sin borrar productos | P0 | Pendiente |

### 4.4 Promociones y precios

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-PRO-01 | Promoción con fin anterior/igual al inicio | Rechaza `INVALID_PROMOTION_PERIOD` | P0 | Automatizada |
| UT-PRO-02 | Descuento porcentual mayor a 100 | Rechaza `INVALID_DISCOUNT` | P0 | Automatizada |
| UT-PRO-03 | Descuento porcentual/fijo positivo válido | Acepta y persiste | P1 | Pendiente |
| UT-PRO-04 | Combo con menos de dos productos | Rechaza `INVALID_BUNDLE` | P0 | Automatizada |
| UT-PRO-05 | Combo sin imagen | Rechaza `BUNDLE_IMAGE_REQUIRED` | P1 | Automatizada |
| UT-PRO-06 | Combo válido con cantidades | Calcula y conserva su composición | P0 | Pendiente |
| UT-PRO-07 | Promoción individual sin imagen propia | Reutiliza imagen del producto | P1 | Pendiente |
| UT-PRO-08 | Promoción inactiva, futura o expirada | No aparece en listado público | P0 | Pendiente |
| UT-PRO-09 | Promoción activa dentro de vigencia | Aparece en listado público | P0 | Pendiente |
| UT-PRO-10 | Varias promociones aplicables | Usa el mejor precio vigente | P0 | Automatizada |
| UT-PRO-11 | Descuento fijo supera el precio | El precio final nunca es negativo | P0 | Automatizada |
| UT-PRO-12 | Editar promoción | Sustituye relaciones y audita | P1 | Pendiente |
| UT-PRO-13 | Retirar promoción | La elimina lógicamente y audita | P1 | Pendiente |
| UT-PRO-14 | Producto de combo sin stock suficiente | Impide comprar la cantidad solicitada | P0 | Pendiente |

### 4.5 Carrito, pedidos y estados

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-CART-01 | Agregar producto nuevo | Crea línea con cantidad 1 | P1 | Pendiente |
| UT-CART-02 | Agregar producto repetido | Incrementa cantidad sin duplicar línea | P1 | Pendiente |
| UT-CART-03 | Agregar promoción/combo | Conserva identificador, composición y precio promocional | P0 | Pendiente |
| UT-CART-04 | Incrementar por encima del stock | Limita o rechaza la operación | P0 | Pendiente |
| UT-CART-05 | Reducir cantidad a cero/eliminar | Retira la línea y recalcula | P1 | Pendiente |
| UT-CART-06 | Calcular subtotal y total | Suma precios por cantidades sin error de precisión visible | P0 | Pendiente |
| UT-CART-07 | Persistir y recuperar carrito | Conserva contenido válido en almacenamiento local | P1 | Pendiente |
| UT-CART-08 | Almacenamiento corrupto | Recupera carrito vacío sin romper la aplicación | P1 | Pendiente |
| UT-ORD-01 | Crear pedido sin `Idempotency-Key` | Rechaza con `IDEMPOTENCY_KEY_REQUIRED` | P0 | Automatizada |
| UT-ORD-02 | Consultar pedido propio existente | Devuelve detalle | P0 | Pendiente |
| UT-ORD-03 | Consultar pedido ajeno/inexistente | Devuelve `ORDER_NOT_FOUND` sin filtrar existencia | P0 | Pendiente |
| UT-ORD-04 | Consultar pedidos actuales | Excluye entregados y cancelados | P1 | Pendiente |
| UT-ORD-05 | Historial mensual | Incluye entregados agrupados por mes | P1 | Pendiente |
| UT-ORD-06 | Preparar pedido confirmado y pagado | Transición a `PREPARING` | P0 | Automatizada |
| UT-ORD-07 | Marcar pedido en preparación como listo | Transición a `READY` | P0 | Automatizada |
| UT-ORD-08 | Preparar pedido sin pago aprobado | Rechaza | P0 | Automatizada |
| UT-ORD-09 | Saltar un estado operativo | Rechaza | P0 | Automatizada |
| UT-ORD-10 | Pedido listo pasa a reparto | Transición a `OUT_FOR_DELIVERY` | P0 | Automatizada |
| UT-ORD-11 | Pedido en reparto pasa a entregado | Transición a `DELIVERED` | P0 | Automatizada |
| UT-ORD-12 | Cambiar estado de pedido inexistente | Devuelve 404 | P1 | Pendiente |
| UT-ORD-13 | Cambiar estado correctamente | Registra estado anterior/nuevo y actor en auditoría | P0 | Pendiente |
| UT-ORD-14 | Estadísticas mensuales | Calcula ingresos, pedidos, unidades, clientes y ticket promedio | P1 | Pendiente |
| UT-ORD-15 | Rankings | Solo contabiliza pagos aprobados y ordena productos/promociones | P1 | Pendiente |
| UT-ORD-16 | Mes sin ventas | Devuelve métricas en cero y rankings vacíos | P1 | Pendiente |

### 4.6 Pagos, archivos y componentes transversales

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-PAY-01 | Procesar sin credenciales | Devuelve `PAYMENT_PROVIDER_NOT_CONFIGURED` | P0 | Automatizada |
| UT-PAY-02 | Procesar sin clave idempotente | Rechaza | P0 | Pendiente |
| UT-PAY-03 | Pagar pedido ajeno/inexistente | Devuelve `ORDER_NOT_FOUND` | P0 | Pendiente |
| UT-PAY-04 | Pagar pedido ya aprobado | Devuelve el pedido sin cobrar nuevamente | P0 | Pendiente |
| UT-PAY-05 | Pagar pedido cancelado | Rechaza con conflicto | P0 | Pendiente |
| UT-PAY-06 | Monto menor a S/ 3 o no finito | Rechaza `INVALID_PAYMENT_AMOUNT` | P0 | Pendiente |
| UT-PAY-07 | Construir solicitud al proveedor | Usa el total del servidor, usuario y referencia del pedido | P0 | Automatizada |
| UT-PAY-08 | Proveedor aprueba | Actualiza pago y confirma pedido | P0 | Automatizada |
| UT-PAY-09 | Proveedor rechaza | Marca rechazo/cancelación y restituye inventario una sola vez | P0 | Pendiente |
| UT-PAY-10 | Error del proveedor | Traduce a `PAYMENT_PROCESSING_FAILED` sin filtrar secretos | P0 | Pendiente |
| UT-PAY-11 | Mapear Yape/débito/prepago/crédito | Devuelve el enum interno correcto | P1 | Pendiente |
| UT-PAY-12 | Sincronizar webhook sin referencia | No altera pedidos | P0 | Pendiente |
| UT-PAY-13 | Sincronizar webhook repetido | Es idempotente | P0 | Pendiente |
| UT-FILE-01 | JPG, PNG y WebP válidos | Acepta el archivo | P1 | Pendiente |
| UT-FILE-02 | Tipo no admitido | Rechaza con 415 | P0 | Pendiente |
| UT-FILE-03 | Archivo mayor de 5 MiB/múltiples archivos | Rechaza | P0 | Pendiente |
| UT-FILE-04 | Firebase sin credenciales | Devuelve 503 controlado | P0 | Pendiente |
| UT-FILE-05 | Construir objeto Firebase | Usa UUID, carpeta correcta, MIME, caché y token | P1 | Pendiente |
| UT-SHR-01 | Validación Zod correcta | Entrega datos transformados en `request.validated` | P0 | Pendiente |
| UT-SHR-02 | Validación inválida | Devuelve detalles 422 uniformes | P0 | Pendiente |
| UT-SHR-03 | Manejador de errores de producción | Incluye código/requestId y oculta stack | P0 | Pendiente |
| UT-SHR-04 | Contexto de solicitud | Genera o propaga un identificador válido | P1 | Pendiente |

## 5. Pruebas de integración

Estas pruebas levantan Express contra MySQL de pruebas y verifican respuesta HTTP más efectos persistidos. Firebase y Mercado Pago pueden usar sandbox o servidores simulados según el caso.

### 5.1 API, autenticación y seguridad

| ID | Caso integrado | Resultado esperado | P |
|---|---|---|---|
| IT-API-01 | `GET /api/health` | 200 y `{status:"ok"}` sin consultar MySQL | P0 |
| IT-API-02 | `GET /api/ready` con MySQL disponible/no disponible | 200 `ready` / error controlado | P0 |
| IT-API-03 | Ruta inexistente | 404 JSON uniforme | P1 |
| IT-API-04 | Origen CORS permitido/no permitido | Permite el frontend configurado y bloquea otro origen | P0 |
| IT-API-05 | Más de 120 solicitudes por minuto | Rate limiter responde 429 | P1 |
| IT-API-06 | Payload mayor de 100 KiB | Rechaza sin afectar el proceso | P1 |
| IT-API-07 | Cabeceras HTTP | Helmet presente y `x-powered-by` ausente | P1 |
| IT-AUTH-01 | Registrar cliente válido | 201, cookie `HttpOnly`, usuario/dirección/sesión/auditoría persistidos | P0 |
| IT-AUTH-02 | Validaciones de registro | Rechaza correo, clave, nombres, teléfono, dirección o coordenadas inválidos | P0 |
| IT-AUTH-03 | Registro duplicado concurrente | Solo una cuenta se crea | P0 |
| IT-AUTH-04 | Login válido | 200, cookie y auditoría | P0 |
| IT-AUTH-05 | Login inválido/inactivo | 401 sin cookie | P0 |
| IT-AUTH-06 | `GET /auth/me` con cookie válida | Devuelve usuario y dirección, nunca hash/token | P0 |
| IT-AUTH-07 | Cookie expirada/revocada | 401 | P0 |
| IT-AUTH-08 | Logout | Revoca sesión, borra cookie y `/me` deja de funcionar | P0 |
| IT-AUTH-09 | Cookie en producción | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` | P0 |

### 5.2 Catálogo, administración, archivos y promociones

| ID | Caso integrado | Resultado esperado | P |
|---|---|---|---|
| IT-PRD-01 | `GET /productos` anónimo | Solo activos con stock, categoría y precio promocional vigente | P0 |
| IT-PRD-02 | `GET /productos/:id` válido/inexistente | 200/404 | P1 |
| IT-PRD-03 | CRUD producto como `ADMIN` | Persiste datos, movimiento y auditoría | P0 |
| IT-PRD-04 | CRUD producto como cliente/anónimo | 403/401 sin cambios | P0 |
| IT-PRD-05 | Edición a stock cero y posterior reposición | Desaparece/reaparece públicamente y conserva alerta admin | P0 |
| IT-PRD-06 | Retiro de producto con referencias históricas | No rompe pedidos; deja de venderse | P0 |
| IT-CAT-01 | Listado público/admin | Público solo activas; superadmin ve todas | P1 |
| IT-CAT-02 | Crear/editar categoría como `SUPER_ADMIN` | Persiste y audita | P0 |
| IT-CAT-03 | `ADMIN` o cliente administra categoría | 403 | P0 |
| IT-CAT-04 | Nombre/slug duplicado | Conflicto controlado | P1 |
| IT-FILE-01 | Subir imagen autenticado | Guarda en carpeta correcta de Firebase y devuelve URL utilizable | P0 |
| IT-FILE-02 | Subir sin rol, tipo inválido o >5 MiB | 401/403/415/error de límite y ningún objeto creado | P0 |
| IT-FILE-03 | Firebase falla | API devuelve error controlado, no crea producto/promoción incompletos | P0 |
| IT-PRO-01 | Listado público por vigencia | Filtra activa, rango y retirada | P0 |
| IT-PRO-02 | Crear promoción individual | Persiste relación, descuento y auditoría | P0 |
| IT-PRO-03 | Crear combo | Persiste múltiples productos, cantidades, precio e imagen | P0 |
| IT-PRO-04 | Editar/retirar promoción | Actualiza relaciones o retiro lógico y audita | P1 |
| IT-PRO-05 | Datos promocionales inválidos | 422/400 y ninguna escritura parcial | P0 |
| IT-PRO-06 | Cliente administra promoción | 403 | P0 |

### 5.3 Usuarios, pedidos, inventario, pagos y estadísticas

| ID | Caso integrado | Resultado esperado | P |
|---|---|---|---|
| IT-USR-01 | Listar/editar/desactivar cliente como admin | Respuesta paginada, actualización, revocación y auditoría | P0 |
| IT-USR-02 | Crear/gestionar admin como superadmin | Persiste rol y auditoría | P0 |
| IT-USR-03 | Admin gestiona otro admin o se autodesactiva | 403/409 sin cambio | P0 |
| IT-ORD-01 | Crear pedido válido | Transacción crea pedido, items, pago pendiente, movimientos y auditoría | P0 |
| IT-ORD-02 | Repetir misma clave idempotente | Devuelve el mismo pedido, sin duplicar stock ni pago | P0 |
| IT-ORD-03 | Dos compras concurrentes sobre último stock | Solo se vende stock disponible; nunca queda negativo | P0 |
| IT-ORD-04 | Producto inactivo, retirado, sin stock o cantidad inválida | Rechaza y revierte toda la transacción | P0 |
| IT-ORD-05 | Combo válido | Crea items/instantáneas y descuenta cantidades de cada producto | P0 |
| IT-ORD-06 | Dirección no pertenece al usuario | Rechaza | P0 |
| IT-ORD-07 | Totales manipulados desde frontend | Backend ignora valores cliente y recalcula | P0 |
| IT-ORD-08 | Historial y detalle | Solo devuelve pedidos del usuario autenticado | P0 |
| IT-ORD-09 | Pedidos actuales e historial mensual | Se separan correctamente por estado | P1 |
| IT-ORD-10 | Cola admin con página, límite, estado y búsqueda | Filtra, ordena y pagina consistentemente | P1 |
| IT-ORD-11 | Secuencia completa de estados | Solo permite transiciones válidas y audita cada una | P0 |
| IT-ORD-12 | Estadísticas por mes | Coinciden con pedidos y pagos aprobados de ese periodo | P1 |
| IT-PAY-01 | Pago aprobado en sandbox/simulador | Usa total servidor, guarda externalId, confirma pedido y no repite cobro | P0 |
| IT-PAY-02 | Pago rechazado | Persiste rechazo/cancelación y restituye stock exactamente una vez | P0 |
| IT-PAY-03 | Método crédito/débito/prepago/Yape reportado | Mapea correctamente cuando el proveedor lo soporte | P1 |
| IT-PAY-04 | Webhook aprobado/rechazado/reembolsado | Sincroniza el pedido correcto | P0 |
| IT-PAY-05 | Webhook duplicado o fuera de orden | Resultado idempotente, no duplica inventario | P0 |
| IT-PAY-06 | Webhook sin referencia/ID inválido | Responde controladamente sin modificar datos | P0 |
| IT-DB-01 | Migrar base vacía | Todas las migraciones se aplican en orden | P0 |
| IT-DB-02 | Restricciones e índices | Unicidad y claves foráneas impiden inconsistencias | P0 |
| IT-DB-03 | Bootstrap superadmin repetido | Crea o recupera una sola cuenta, sin duplicarla | P0 |

## 6. Pruebas del sistema

Se ejecutan desde el navegador contra la aplicación completa. Los casos `ST-E2E` son candidatos principales para Selenium.

| ID | Recorrido completo | Resultado esperado | P |
|---|---|---|---|
| ST-E2E-01 | Visitante navega Inicio, Productos, Nosotros, Ubícanos y Contacto | Todas las páginas cargan, mantienen navegación y aviso académico | P1 |
| ST-E2E-02 | Visitante consulta catálogo | Ve productos disponibles, precios, categoría, promociones y stock | P0 |
| ST-E2E-03 | Visitante filtra/busca productos y abre carrito | Resultados y totales se actualizan correctamente | P1 |
| ST-E2E-04 | Visitante agrega varios productos y combo | Carrito conserva cantidades, límites de stock, subtotales y total | P0 |
| ST-E2E-05 | Visitante intenta confirmar sin cuenta | Se solicita autenticación/registro y no se crea pedido | P0 |
| ST-E2E-06 | Registro con mapa y coordenadas | Cuenta y dirección quedan disponibles para checkout | P0 |
| ST-E2E-07 | Registro inválido/duplicado | Muestra errores comprensibles y conserva datos corregibles | P1 |
| ST-E2E-08 | Login, recarga, logout y nuevo login | Sesión persiste al recargar, se elimina al salir y se recupera al entrar | P0 |
| ST-E2E-09 | Cliente completa checkout con tarjeta de crédito de prueba | Se crea un solo pedido, pago aprobado y carrito se vacía | P0 |
| ST-E2E-10 | Cliente completa checkout con débito de prueba compatible | Mismo resultado y método correcto | P0 |
| ST-E2E-11 | Pago rechazado | Informa rechazo, no muestra compra aprobada y stock queda consistente | P0 |
| ST-E2E-12 | Doble clic/recarga durante confirmación | No crea ni cobra dos pedidos | P0 |
| ST-E2E-13 | Cliente consulta Mis pedidos | Ve estado actual y línea de progreso | P1 |
| ST-E2E-14 | Admin cambia estados mientras cliente consulta | La vista cliente refleja cambios por sondeo en máximo 30 s | P1 |
| ST-E2E-15 | Pedido entregado | Sale de actuales y aparece en historial mensual | P1 |
| ST-E2E-16 | Cliente intenta abrir panel admin | Acceso bloqueado/redirigido y API protegida | P0 |
| ST-E2E-17 | Admin crea producto con imagen Firebase | Aparece en administración y catálogo público | P0 |
| ST-E2E-18 | Admin edita precio, imagen y stock | Cambios se reflejan; stock cero lo oculta públicamente y activa alerta | P0 |
| ST-E2E-19 | Admin retira producto | Desaparece de venta sin borrar historial | P0 |
| ST-E2E-20 | Admin crea promoción individual | Usa imagen del producto y aparece solo durante vigencia | P1 |
| ST-E2E-21 | Admin crea combo con imagen | Se muestra en carrusel/catálogo y puede agregarse al carrito | P0 |
| ST-E2E-22 | Carrusel promocional | Se mueve continuamente, repite en bucle, no tiene flechas y admite arrastre | P2 |
| ST-E2E-23 | Admin consulta y filtra pedidos | Ve detalle de cliente, dirección, productos, promoción y pago | P0 |
| ST-E2E-24 | Admin procesa `CONFIRMED→PREPARING→READY→OUT_FOR_DELIVERY→DELIVERED` | Controles y estados permanecen sincronizados | P0 |
| ST-E2E-25 | Nuevo pedido mientras admin tiene la tabla abierta | Aparece automáticamente en máximo 10 s | P1 |
| ST-E2E-26 | Admin gestiona cliente | Edita, desactiva; la sesión del cliente deja de funcionar; luego reactiva | P0 |
| ST-E2E-27 | Superadmin crea/edita/desactiva admin | Cambios de acceso son efectivos | P0 |
| ST-E2E-28 | Admin intenta gestionar categorías/administradores | Interfaz y API lo bloquean | P0 |
| ST-E2E-29 | Superadmin administra categorías | Cambia las opciones disponibles al crear productos | P1 |
| ST-E2E-30 | Panel estadístico por mes | Métricas y rankings coinciden con los pedidos sembrados | P1 |
| ST-E2E-31 | Rutas profundas y recarga en Vercel | `/productos`, `/mis-pedidos` y `/admin/pedidos` cargan sin 404 | P1 |
| ST-E2E-32 | Comunicación Vercel→rewrite `/api`→Nginx→EC2→RDS | Productos, sesión y pedidos funcionan por HTTPS sin CORS/mixed content | P0 |
| ST-E2E-33 | Firebase no disponible | Mensaje controlado; formulario permite reintentar sin duplicar producto | P1 |
| ST-E2E-34 | Mercado Pago no disponible/lento | Interfaz recuperable, sin pedido cobrado erróneamente | P0 |
| ST-E2E-35 | Sesión expira durante operación | Se informa y redirige a login sin ejecutar acción privilegiada | P0 |
| ST-E2E-36 | Vista responsive en móvil/tablet/escritorio | Navegación, formularios, carrito, tablas y mapa siguen operables | P2 |
| ST-E2E-37 | Accesibilidad básica por teclado | Foco visible, controles alcanzables, etiquetas/nombres accesibles | P2 |
| ST-E2E-38 | Compatibilidad Chrome, Edge y Firefox actuales | Flujos críticos funcionan consistentemente | P2 |

### 6.1 Sistema no funcional y operativo

| ID | Caso | Resultado esperado | P |
|---|---|---|---|
| ST-NF-01 | Reiniciar servicio `elpoblano` | `systemd` lo deja `active (running)` y health vuelve a 200 | P0 |
| ST-NF-02 | Reiniciar EC2 | Backend, Nginx y certificados quedan operativos automáticamente | P0 |
| ST-NF-03 | Base temporalmente no disponible | `/ready` falla, `/health` distingue proceso vivo y logs conservan diagnóstico | P0 |
| ST-NF-04 | TLS y redirección HTTP→HTTPS | Certificado válido y sin contenido mixto | P0 |
| ST-NF-05 | Secretos | No aparecen en repositorio, bundle frontend, respuestas ni logs | P0 |
| ST-NF-06 | Auditoría | Acciones administrativas y cambios de pedido son atribuibles y cronológicos | P0 |
| ST-NF-07 | Rendimiento de referencia | Los endpoints críticos cumplen el umbral que se fijará para JMeter | P1 |
| ST-NF-08 | Recuperación de datos | Restauración ensayada conserva integridad y satisface RPO/RTO definidos | P1 |

## 7. Pruebas de aceptación

Cada caso se aprueba mediante demostración y firma del responsable académico/product owner. Los criterios se expresan en lenguaje observable y son trazables a requisitos.

| ID | RF | Criterio de aceptación | P |
|---|---|---|---|
| AT-01 | RF-01 | Dado un visitante, cuando abre Productos, entonces ve únicamente productos activos con stock y precio vigente | P0 |
| AT-02 | RF-02 | Dado un visitante, cuando agrega productos/promociones y cambia cantidades, entonces el carrito conserva líneas y total | P0 |
| AT-03 | RF-03 | Dado un visitante con datos y ubicación válidos, cuando se registra, entonces obtiene una cuenta y dirección predeterminada | P0 |
| AT-04 | RF-04 | Dado un cliente, cuando inicia/cierra sesión, entonces accede/pierde acceso a sus funciones privadas | P0 |
| AT-05 | RF-05 | Dado un visitante sin sesión, cuando intenta confirmar, entonces no se crea pedido y se exige autenticación | P0 |
| AT-06 | RF-06 | Dado un carrito válido, cuando confirma, entonces se registra un solo pedido con sus productos, precios y cantidades | P0 |
| AT-07 | RF-07 | Dado un pedido, cuando usa crédito o débito de prueba, entonces Mercado Pago procesa y registra el método/estado; Yape queda identificado como pendiente de proveedor real | P0 |
| AT-08 | RF-08 | Dado un cliente, cuando abre Historial, entonces ve sus compras entregadas agrupadas por mes y ninguna ajena | P1 |
| AT-09 | RF-09 | Dado un cliente o visitante, cuando abre Administración, entonces no accede al panel ni a sus API | P0 |
| AT-10 | RF-10 | Dado un admin, cuando registra un producto válido, entonces aparece en el catálogo si está activo y tiene stock | P0 |
| AT-11 | RF-11 | Dado un admin, cuando edita datos, precio, categoría, imagen o stock, entonces los cambios quedan visibles y auditados | P0 |
| AT-12 | RF-12 | Dado un admin, cuando retira un producto, entonces deja de venderse sin perder referencias históricas | P0 |
| AT-13 | RF-13 | Dado un admin, cuando crea una promoción válida individual o combo, entonces se guardan vigencia, composición, descuento/precio e imagen aplicable | P0 |
| AT-14 | RF-14 | Dadas promociones futura, vigente y expirada, cuando un visitante abre Inicio, entonces solo ve la vigente activa | P0 |
| AT-15 | RF-15 | Dado un admin, cuando consulta/edita clientes, entonces ve datos paginados y persiste cambios permitidos | P1 |
| AT-16 | RF-16 | Dado un admin, cuando desactiva un cliente, entonces sus sesiones se revocan; al reactivarlo puede volver a iniciar sesión | P0 |
| AT-17 | RF-17 | Dado un superadmin, cuando administra cuentas admin, entonces puede crearlas/editarlas/desactivarlas; un admin común no puede | P0 |
| AT-18 | RF-18 | Dada una acción administrativa relevante, cuando finaliza, entonces existe una auditoría con actor, acción, entidad y fecha | P0 |
| AT-19 | RF-19 | Dado un admin, cuando abre Pedidos, entonces consulta la cola paginada y puede buscar/filtrar | P0 |
| AT-20 | RF-20 | Dado un pedido no pagado, cuando se intenta preparar, entonces se rechaza; uno aprobado sí puede avanzar | P0 |
| AT-21 | RF-21 | Dado un pedido confirmado y pagado, cuando admin inicia preparación, entonces cambia a `PREPARING` | P0 |
| AT-22 | RF-22 | Dado un pedido en preparación, cuando admin lo marca listo, entonces cambia a `READY` | P0 |
| AT-23 | RF-23 | Dado un pedido, cuando admin abre detalle, entonces ve cliente, dirección/mapa, productos, cantidades, importes y pago | P1 |
| AT-24 | RF-24 | Dado un cambio de estado, cuando se confirma, entonces se auditan estado anterior, nuevo y actor | P0 |
| AT-25 | RF-25 | Dado un cliente con pedidos no terminados, cuando abre Mis pedidos, entonces ve estado y progreso actualizados | P1 |
| AT-26 | RF-26 | Dado un cliente con pedidos entregados, cuando abre Historial, entonces obtiene resumen por mes, cantidad, total y detalle | P1 |
| AT-27 | RF-27 | Dado un pedido listo, cuando admin registra salida y entrega, entonces avanza secuencialmente a `OUT_FOR_DELIVERY` y `DELIVERED` | P0 |
| AT-28 | RF-28 | Dado un mes seleccionado, cuando admin consulta Estadísticas, entonces ve ingresos, pedidos, unidades, clientes y ticket promedio correctos | P1 |
| AT-29 | RF-29 | Dado un mes con ventas aprobadas, cuando admin consulta rankings, entonces ve productos y promociones ordenados por unidades/ingresos | P1 |
| AT-30 | RF-30 | Dadas promociones vigentes, cuando se abre Inicio, entonces el carrusel se mueve sin pausas, repite infinitamente y admite arrastre sin flechas | P2 |

## 8. Cobertura transversal obligatoria

Además de las matrices anteriores, cada recurso HTTP debe probar: éxito, datos mínimos/máximos, tipos inválidos, campos faltantes, identificador inexistente, sesión ausente/expirada, rol insuficiente, conflicto de unicidad, error del repositorio y ausencia de información sensible. Cada operación de escritura debe verificar tanto respuesta como base de datos, auditoría, inventario y rollback.

Las combinaciones mínimas de acceso son:

| Recurso | Visitante | Cliente | Admin | Superadmin |
|---|---:|---:|---:|---:|
| Catálogo/categorías/promociones vigentes | Sí | Sí | Sí | Sí |
| Cuenta, carrito, pedidos y pagos propios | Parcial / No al confirmar | Sí | Sí como usuario | Sí como usuario |
| Productos/promociones/pedidos/clientes admin | No | No | Sí | Sí |
| Categorías y cuentas administrativas | No | No | No | Sí |

## 9. Criterios de entrada y salida

Entrada: requisitos aprobados, entorno estable, migraciones aplicadas, datos controlados, credenciales sandbox y build desplegable.

Salida de Fase 5:

- 100 % de casos P0 ejecutados y aprobados.
- 100 % de RF-01 a RF-30 con al menos una aceptación aprobada.
- Sin defectos críticos o altos abiertos para el alcance entregable.
- Pruebas unitarias e integración reproducibles y con reporte de cobertura.
- Evidencias de sistema y aceptación archivadas por commit/versión.
- Defectos conocidos P1/P2 registrados con responsable y decisión.

## 10. Trazabilidad hacia fases 6, 7 y 8

| Salida | Fase siguiente |
|---|---|
| `UT-*` e `IT-*` automatizadas + LCOV | SonarQube: cobertura, bugs, smells, complejidad y deuda |
| `ST-E2E-*` prioritarias | Selenium: recorridos funcionales del navegador |
| `IT-API`, catálogo, login, pedidos y estadísticas | JMeter: carga, concurrencia, latencia y errores |
| Resultados JUnit/LCOV/HTML/JTL | GitHub Actions: ejecución y publicación de artefactos |
| `AT-*` | Evidencia formal de cumplimiento de requisitos |
