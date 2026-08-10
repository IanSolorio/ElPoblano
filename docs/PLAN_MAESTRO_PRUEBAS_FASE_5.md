# Plan maestro de pruebas â€” Fase 5

| Campo | Valor |
|---|---|
| Proyecto | Plataforma web El Poblano |
| VersiÃ³n | 1.0 |
| Fecha de corte | 9 de agosto de 2026 |
| Alcance | Backend, frontend, MySQL, Firebase Storage, Mercado Pago y despliegue web |
| Niveles | Unitarias, integraciÃ³n, sistema y aceptaciÃ³n |
| Requisitos cubiertos | RF-01 a RF-32 |

> Este documento define la lÃ­nea base completa de pruebas del alcance implementado. Un caso definido no se considera aprobado hasta que exista evidencia de ejecuciÃ³n. Los casos marcados `Automatizada` corresponden a las 18 pruebas actuales de `apps/backend/tests`; los demÃ¡s quedan `Pendiente` para las fases 5, 6 y 8.

> **ActualizaciÃ³n del 10 de agosto de 2026:** los 107 casos `UT-*` fueron implementados con sus identificadores y se ejecutan mediante `npm run test:unit:evidence -w @elpoblano/backend`. El reporte generado por el comando constituye el estado ejecutado vigente.

Este catÃ¡logo debe aplicarse junto con [`PLAN_MAESTRO_PROYECTO_CALIDAD.md`](./PLAN_MAESTRO_PROYECTO_CALIDAD.md), que define 42 requisitos no funcionales y sus mÃ©tricas. Por ello, la ejecuciÃ³n de la Fase 5 deberÃ¡ comprobar tanto RF-01â€“RF-32 como RNF de seguridad, rendimiento, usabilidad, disponibilidad, escalabilidad, mantenibilidad, portabilidad y confiabilidad.

## 1. Objetivo y estrategia

Validar que El Poblano satisface sus reglas funcionales, conserva la integridad de los datos y protege las operaciones segÃºn los roles `CUSTOMER`, `ADMIN` y `SUPER_ADMIN`. La estrategia sigue la pirÃ¡mide de pruebas:

```text
AceptaciÃ³n: requisitos y necesidades del usuario
Sistema: recorridos completos en una instalaciÃ³n desplegada
IntegraciÃ³n: API, MySQL y proveedores/adaptadores
Unitarias: reglas aisladas, servicios y funciones
```

La Fase 6 automatizarÃ¡ principalmente los casos de sistema y aceptaciÃ³n con Selenium. JMeter emplearÃ¡ escenarios derivados de integraciÃ³n y sistema para rendimiento. La cobertura de las pruebas unitarias e integraciÃ³n serÃ¡ importada por SonarQube en la Fase 7, y GitHub Actions las orquestarÃ¡ en la Fase 8.

## 2. Convenciones

- Prioridad `P0`: seguridad, cobro, integridad o flujo crÃ­tico.
- Prioridad `P1`: funciÃ³n principal del negocio.
- Prioridad `P2`: interfaz, compatibilidad o caso secundario.
- Resultado HTTP esperado: `2xx` Ã©xito, `400/422` entrada invÃ¡lida, `401` sin autenticaciÃ³n, `403` sin rol, `404` inexistente y `409` conflicto.
- Cada prueba debe conservar fecha, versiÃ³n/commit, entorno, datos, resultado, capturas o reporte y responsable.
- Mercado Pago debe usar usuarios, credenciales y tarjetas de prueba. Nunca se usarÃ¡n tarjetas reales.

## 3. Datos y entornos controlados

Datos mÃ­nimos: un `SUPER_ADMIN`, un `ADMIN`, dos clientes (activo e inactivo), las siete categorÃ­as base, productos activos con stock alto/bajo/cero, producto retirado, promociÃ³n individual vigente/expirada/futura, combo vigente, pedidos en cada estado y pagos `PENDING`, `APPROVED`, `REJECTED` y `REFUNDED`.

Entornos:

1. Unitario: dobles de repositorios y proveedores, sin red ni base real.
2. IntegraciÃ³n: base MySQL exclusiva de pruebas, migrada desde cero y reiniciable.
3. Sistema/Selenium: frontend y backend de pruebas con Firebase y Mercado Pago de prueba.
4. AceptaciÃ³n: entorno estable equivalente a producciÃ³n, con datos ficticios.

## 4. Pruebas unitarias

### 4.1 AutenticaciÃ³n, sesiÃ³n y autorizaciÃ³n

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-AUTH-01 | Registrar datos vÃ¡lidos | Normaliza correo, cifra contraseÃ±a, crea direcciÃ³n predeterminada, auditorÃ­a y sesiÃ³n | P0 | Automatizada |
| UT-AUTH-02 | Registrar correo existente con diferente capitalizaciÃ³n | Rechaza con `EMAIL_ALREADY_EXISTS` | P0 | Automatizada |
| UT-AUTH-03 | Normalizar nombres, telÃ©fono y correo | Persiste valores recortados y correo en minÃºsculas | P1 | Automatizada |
| UT-AUTH-04 | Iniciar sesiÃ³n con credenciales vÃ¡lidas | Genera token aleatorio y fecha de expiraciÃ³n configurada | P0 | Automatizada |
| UT-AUTH-05 | ContraseÃ±a incorrecta | Rechaza sin revelar si existe el correo | P0 | Automatizada |
| UT-AUTH-06 | Usuario inexistente | Devuelve el mismo error de credenciales | P0 | Automatizada |
| UT-AUTH-07 | Usuario inactivo | Impide iniciar sesiÃ³n | P0 | Automatizada |
| UT-AUTH-08 | Autenticar sin token | Rechaza con `AUTHENTICATION_REQUIRED` | P0 | Automatizada |
| UT-AUTH-09 | Token inexistente, expirado o revocado | Rechaza con `INVALID_SESSION` | P0 | Automatizada |
| UT-AUTH-10 | Cerrar sesiÃ³n con token | Revoca el hash del token, no el valor en claro | P0 | Automatizada |
| UT-AUTH-11 | Cerrar sesiÃ³n sin token | Finaliza de forma idempotente | P1 | Automatizada |
| UT-AUTH-12 | Serializar usuario pÃºblico | No expone hash, tokens, estado interno ni campos sensibles | P0 | Automatizada |
| UT-AUTH-13 | Hash y verificaciÃ³n Argon2 | Valida la clave correcta y rechaza otra | P0 | Automatizada |
| UT-AUTH-14 | Hash de token de sesiÃ³n | Es determinista y no conserva el token original | P0 | Automatizada |
| UT-AUTH-15 | `CUSTOMER` intenta ruta administrativa | `requireAdmin` lo rechaza | P0 | Automatizada |
| UT-AUTH-16 | `ADMIN` intenta ruta exclusiva | `requireSuperAdmin` lo rechaza | P0 | Automatizada |
| UT-AUTH-17 | `ADMIN` y `SUPER_ADMIN` usan ruta administrativa | La autorizaciÃ³n continÃºa | P0 | Automatizada |

### 4.2 AdministraciÃ³n de usuarios

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-USR-01 | `SUPER_ADMIN` crea administrador | Cifra clave, normaliza correo y audita | P0 | Automatizada |
| UT-USR-02 | `ADMIN` crea administrador | Rechaza con `SUPER_ADMIN_REQUIRED` | P0 | Automatizada |
| UT-USR-03 | Crear administrador con correo existente | Rechaza con conflicto | P0 | Automatizada |
| UT-USR-04 | `ADMIN` actualiza cliente | Actualiza y audita | P1 | Automatizada |
| UT-USR-05 | `ADMIN` actualiza otro administrador | Rechaza | P0 | Automatizada |
| UT-USR-06 | `SUPER_ADMIN` actualiza administrador | Permite y audita | P0 | Automatizada |
| UT-USR-07 | Modificar usuario inexistente/eliminado | Devuelve `USER_NOT_FOUND` | P1 | Automatizada |
| UT-USR-08 | Desactivar cliente | Cambia estado, revoca sesiones y audita | P0 | Automatizada |
| UT-USR-09 | Reactivar cliente | Cambia estado y audita | P1 | Automatizada |
| UT-USR-10 | Actor se desactiva a sÃ­ mismo | Rechaza con `SELF_DEACTIVATION` | P0 | Automatizada |
| UT-USR-11 | Retirar usuario | Ejecuta retiro lÃ³gico, no borra historial | P0 | Automatizada |
| UT-USR-12 | Listar usuarios paginados | Respeta pÃ¡gina, lÃ­mite y no expone credenciales | P1 | Automatizada |

### 4.3 Productos, categorÃ­as e inventario

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-PRD-01 | Construir producto vÃ¡lido | Conserva nombre, descripciÃ³n, precio, categorÃ­a, imagen, stock y estado | P1 | Automatizada |
| UT-PRD-02 | Crear producto con categorÃ­a activa | Crea y audita | P0 | Automatizada |
| UT-PRD-03 | Crear/editar con categorÃ­a inactiva o inexistente | Rechaza con `INVALID_CATEGORY` | P0 | Automatizada |
| UT-PRD-04 | Consultar producto inexistente | Devuelve 404 | P1 | Automatizada |
| UT-PRD-05 | Editar producto existente | Actualiza campos y audita | P0 | Automatizada |
| UT-PRD-06 | Cambiar stock | Registra movimiento de ajuste por la diferencia | P0 | Automatizada |
| UT-PRD-07 | Retirar producto | Realiza eliminaciÃ³n lÃ³gica y auditorÃ­a | P0 | Automatizada |
| UT-PRD-08 | Listado pÃºblico | Excluye inactivos, retirados y stock cero | P0 | Automatizada |
| UT-PRD-09 | Listado administrativo | Incluye stock cero e inactivos para su gestiÃ³n | P1 | Automatizada |
| UT-CAT-01 | Listar categorÃ­as pÃºblicas | Devuelve Ãºnicamente activas | P1 | Automatizada |
| UT-CAT-02 | Listar categorÃ­as administrativas | Incluye activas e inactivas | P1 | Automatizada |
| UT-CAT-03 | Crear categorÃ­a | Genera nombre/slug Ãºnico y auditorÃ­a | P1 | Automatizada |
| UT-CAT-04 | Crear nombre o slug duplicado | Rechaza el conflicto | P1 | Automatizada |
| UT-CAT-05 | Actualizar categorÃ­a inexistente | Devuelve `CATEGORY_NOT_FOUND` | P1 | Automatizada |
| UT-CAT-06 | Activar/desactivar categorÃ­a | Cambia visibilidad sin borrar productos | P0 | Automatizada |

### 4.4 Promociones y precios

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-PRO-01 | PromociÃ³n con fin anterior/igual al inicio | Rechaza `INVALID_PROMOTION_PERIOD` | P0 | Automatizada |
| UT-PRO-02 | Descuento porcentual mayor a 100 | Rechaza `INVALID_DISCOUNT` | P0 | Automatizada |
| UT-PRO-03 | Descuento porcentual/fijo positivo vÃ¡lido | Acepta y persiste | P1 | Automatizada |
| UT-PRO-04 | Combo con menos de dos productos | Rechaza `INVALID_BUNDLE` | P0 | Automatizada |
| UT-PRO-05 | Combo sin imagen | Rechaza `BUNDLE_IMAGE_REQUIRED` | P1 | Automatizada |
| UT-PRO-06 | Combo vÃ¡lido con cantidades | Calcula y conserva su composiciÃ³n | P0 | Automatizada |
| UT-PRO-07 | PromociÃ³n individual sin imagen propia | Reutiliza imagen del producto | P1 | Automatizada |
| UT-PRO-08 | PromociÃ³n inactiva, futura o expirada | No aparece en listado pÃºblico | P0 | Automatizada |
| UT-PRO-09 | PromociÃ³n activa dentro de vigencia | Aparece en listado pÃºblico | P0 | Automatizada |
| UT-PRO-10 | Varias promociones aplicables | Usa el mejor precio vigente | P0 | Automatizada |
| UT-PRO-11 | Descuento fijo supera el precio | El precio final nunca es negativo | P0 | Automatizada |
| UT-PRO-12 | Editar promociÃ³n | Sustituye relaciones y audita | P1 | Automatizada |
| UT-PRO-13 | Retirar promociÃ³n | La elimina lÃ³gicamente y audita | P1 | Automatizada |
| UT-PRO-14 | Producto de combo sin stock suficiente | Impide comprar la cantidad solicitada | P0 | Automatizada |

### 4.5 Carrito, pedidos y estados

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-CART-01 | Agregar producto nuevo | Crea lÃ­nea con cantidad 1 | P1 | Automatizada |
| UT-CART-02 | Agregar producto repetido | Incrementa cantidad sin duplicar lÃ­nea | P1 | Automatizada |
| UT-CART-03 | Agregar promociÃ³n/combo | Conserva identificador, composiciÃ³n y precio promocional | P0 | Automatizada |
| UT-CART-04 | Incrementar por encima del stock | Limita o rechaza la operaciÃ³n | P0 | Automatizada |
| UT-CART-05 | Reducir cantidad a cero/eliminar | Retira la lÃ­nea y recalcula | P1 | Automatizada |
| UT-CART-06 | Calcular subtotal y total | Suma precios por cantidades sin error de precisiÃ³n visible | P0 | Automatizada |
| UT-CART-07 | Persistir y recuperar carrito | Conserva contenido vÃ¡lido en almacenamiento local | P1 | Automatizada |
| UT-CART-08 | Almacenamiento corrupto | Recupera carrito vacÃ­o sin romper la aplicaciÃ³n | P1 | Automatizada |
| UT-ORD-01 | Crear pedido sin `Idempotency-Key` | Rechaza con `IDEMPOTENCY_KEY_REQUIRED` | P0 | Automatizada |
| UT-ORD-02 | Consultar pedido propio existente | Devuelve detalle | P0 | Automatizada |
| UT-ORD-03 | Consultar pedido ajeno/inexistente | Devuelve `ORDER_NOT_FOUND` sin filtrar existencia | P0 | Automatizada |
| UT-ORD-04 | Consultar pedidos actuales | Excluye entregados y cancelados | P1 | Automatizada |
| UT-ORD-05 | Historial mensual | Incluye entregados agrupados por mes | P1 | Automatizada |
| UT-ORD-06 | Preparar pedido confirmado y pagado | TransiciÃ³n a `PREPARING` | P0 | Automatizada |
| UT-ORD-07 | Marcar pedido en preparaciÃ³n como listo | TransiciÃ³n a `READY` | P0 | Automatizada |
| UT-ORD-08 | Preparar pedido sin pago aprobado | Rechaza | P0 | Automatizada |
| UT-ORD-09 | Saltar un estado operativo | Rechaza | P0 | Automatizada |
| UT-ORD-10 | Pedido listo pasa a reparto | TransiciÃ³n a `OUT_FOR_DELIVERY` | P0 | Automatizada |
| UT-ORD-11 | Pedido en reparto pasa a entregado | TransiciÃ³n a `DELIVERED` | P0 | Automatizada |
| UT-ORD-12 | Cambiar estado de pedido inexistente | Devuelve 404 | P1 | Automatizada |
| UT-ORD-13 | Cambiar estado correctamente | Registra estado anterior/nuevo y actor en auditorÃ­a | P0 | Automatizada |
| UT-ORD-14 | EstadÃ­sticas mensuales | Calcula ingresos, pedidos, unidades, clientes y ticket promedio | P1 | Automatizada |
| UT-ORD-15 | Rankings | Solo contabiliza pagos aprobados y ordena productos/promociones | P1 | Automatizada |
| UT-ORD-16 | Mes sin ventas | Devuelve mÃ©tricas en cero y rankings vacÃ­os | P1 | Automatizada |
| UT-ORD-17 | Cancelar pedido propio | Delega el pedido y el usuario autenticado correctos | P0 | Automatizada |
| UT-ORD-18 | Cancelar pedido pendiente | Restituye el stock exactamente una vez y bloquea repeticiones | P0 | Automatizada |

### 4.6 Pagos, archivos y componentes transversales

| ID | Caso | Resultado esperado | P | Estado |
|---|---|---|---|---|
| UT-PAY-01 | Procesar sin credenciales | Devuelve `PAYMENT_PROVIDER_NOT_CONFIGURED` | P0 | Automatizada |
| UT-PAY-02 | Procesar sin clave idempotente | Rechaza | P0 | Automatizada |
| UT-PAY-03 | Pagar pedido ajeno/inexistente | Devuelve `ORDER_NOT_FOUND` | P0 | Automatizada |
| UT-PAY-04 | Pagar pedido ya aprobado | Devuelve el pedido sin cobrar nuevamente | P0 | Automatizada |
| UT-PAY-05 | Pagar pedido cancelado | Rechaza con conflicto | P0 | Automatizada |
| UT-PAY-06 | Monto menor a S/ 3 o no finito | Rechaza `INVALID_PAYMENT_AMOUNT` | P0 | Automatizada |
| UT-PAY-07 | Construir solicitud al proveedor | Usa el total del servidor, usuario y referencia del pedido | P0 | Automatizada |
| UT-PAY-08 | Proveedor aprueba | Actualiza pago y confirma pedido | P0 | Automatizada |
| UT-PAY-09 | Proveedor rechaza | Marca rechazo/cancelaciÃ³n y restituye inventario una sola vez | P0 | Automatizada |
| UT-PAY-10 | Error del proveedor | Traduce a `PAYMENT_PROCESSING_FAILED` sin filtrar secretos | P0 | Automatizada |
| UT-PAY-11 | Mapear Yape/dÃ©bito/prepago/crÃ©dito | Devuelve el enum interno correcto | P1 | Automatizada |
| UT-PAY-12 | Sincronizar webhook sin referencia | No altera pedidos | P0 | Automatizada |
| UT-PAY-13 | Sincronizar webhook repetido | Es idempotente | P0 | Automatizada |
| UT-PAY-14 | Pago pendiente ya enviado al proveedor | Bloquea un segundo cobro mientras Mercado Pago procesa el primero | P0 | Automatizada |
| UT-FILE-01 | JPG, PNG y WebP vÃ¡lidos | Acepta el archivo | P1 | Automatizada |
| UT-FILE-02 | Tipo no admitido | Rechaza con 415 | P0 | Automatizada |
| UT-FILE-03 | Archivo mayor de 5 MiB/mÃºltiples archivos | Rechaza | P0 | Automatizada |
| UT-FILE-04 | Firebase sin credenciales | Devuelve 503 controlado | P0 | Automatizada |
| UT-FILE-05 | Construir objeto Firebase | Usa UUID, carpeta correcta, MIME, cachÃ© y token | P1 | Automatizada |
| UT-SHR-01 | ValidaciÃ³n Zod correcta | Entrega datos transformados en `request.validated` | P0 | Automatizada |
| UT-SHR-02 | ValidaciÃ³n invÃ¡lida | Devuelve detalles 422 uniformes | P0 | Automatizada |
| UT-SHR-03 | Manejador de errores de producciÃ³n | Incluye cÃ³digo/requestId y oculta stack | P0 | Automatizada |
| UT-SHR-04 | Contexto de solicitud | Genera o propaga un identificador vÃ¡lido | P1 | Automatizada |

## 5. Pruebas de integraciÃ³n

Estas pruebas levantan Express contra MySQL de pruebas y verifican respuesta HTTP mÃ¡s efectos persistidos. Firebase y Mercado Pago pueden usar sandbox o servidores simulados segÃºn el caso.

### 5.1 API, autenticaciÃ³n y seguridad

| ID | Caso integrado | Resultado esperado | P |
|---|---|---|---|
| IT-API-01 | `GET /api/health` | 200 y `{status:"ok"}` sin consultar MySQL | P0 |
| IT-API-02 | `GET /api/ready` con MySQL disponible/no disponible | 200 `ready` / error controlado | P0 |
| IT-API-03 | Ruta inexistente | 404 JSON uniforme | P1 |
| IT-API-04 | Origen CORS permitido/no permitido | Permite el frontend configurado y bloquea otro origen | P0 |
| IT-API-05 | MÃ¡s de 120 solicitudes por minuto | Rate limiter responde 429 | P1 |
| IT-API-06 | Payload mayor de 100 KiB | Rechaza sin afectar el proceso | P1 |
| IT-API-07 | Cabeceras HTTP | Helmet presente y `x-powered-by` ausente | P1 |
| IT-AUTH-01 | Registrar cliente vÃ¡lido | 201, cookie `HttpOnly`, usuario/direcciÃ³n/sesiÃ³n/auditorÃ­a persistidos | P0 |
| IT-AUTH-02 | Validaciones de registro | Rechaza correo, clave, nombres, telÃ©fono, direcciÃ³n o coordenadas invÃ¡lidos | P0 |
| IT-AUTH-03 | Registro duplicado concurrente | Solo una cuenta se crea | P0 |
| IT-AUTH-04 | Login vÃ¡lido | 200, cookie y auditorÃ­a | P0 |
| IT-AUTH-05 | Login invÃ¡lido/inactivo | 401 sin cookie | P0 |
| IT-AUTH-06 | `GET /auth/me` con cookie vÃ¡lida | Devuelve usuario y direcciÃ³n, nunca hash/token | P0 |
| IT-AUTH-07 | Cookie expirada/revocada | 401 | P0 |
| IT-AUTH-08 | Logout | Revoca sesiÃ³n, borra cookie y `/me` deja de funcionar | P0 |
| IT-AUTH-09 | Cookie en producciÃ³n | `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/` | P0 |

### 5.2 CatÃ¡logo, administraciÃ³n, archivos y promociones

| ID | Caso integrado | Resultado esperado | P |
|---|---|---|---|
| IT-PRD-01 | `GET /productos` anÃ³nimo | Solo activos con stock, categorÃ­a y precio promocional vigente | P0 |
| IT-PRD-02 | `GET /productos/:id` vÃ¡lido/inexistente | 200/404 | P1 |
| IT-PRD-03 | CRUD producto como `ADMIN` | Persiste datos, movimiento y auditorÃ­a | P0 |
| IT-PRD-04 | CRUD producto como cliente/anÃ³nimo | 403/401 sin cambios | P0 |
| IT-PRD-05 | EdiciÃ³n a stock cero y posterior reposiciÃ³n | Desaparece/reaparece pÃºblicamente y conserva alerta admin | P0 |
| IT-PRD-06 | Retiro de producto con referencias histÃ³ricas | No rompe pedidos; deja de venderse | P0 |
| IT-CAT-01 | Listado pÃºblico/admin | PÃºblico solo activas; superadmin ve todas | P1 |
| IT-CAT-02 | Crear/editar categorÃ­a como `SUPER_ADMIN` | Persiste y audita | P0 |
| IT-CAT-03 | `ADMIN` o cliente administra categorÃ­a | 403 | P0 |
| IT-CAT-04 | Nombre/slug duplicado | Conflicto controlado | P1 |
| IT-FILE-01 | Subir imagen autenticado | Guarda en carpeta correcta de Firebase y devuelve URL utilizable | P0 |
| IT-FILE-02 | Subir sin rol, tipo invÃ¡lido o >5 MiB | 401/403/415/error de lÃ­mite y ningÃºn objeto creado | P0 |
| IT-FILE-03 | Firebase falla | API devuelve error controlado, no crea producto/promociÃ³n incompletos | P0 |
| IT-PRO-01 | Listado pÃºblico por vigencia | Filtra activa, rango y retirada | P0 |
| IT-PRO-02 | Crear promociÃ³n individual | Persiste relaciÃ³n, descuento y auditorÃ­a | P0 |
| IT-PRO-03 | Crear combo | Persiste mÃºltiples productos, cantidades, precio e imagen | P0 |
| IT-PRO-04 | Editar/retirar promociÃ³n | Actualiza relaciones o retiro lÃ³gico y audita | P1 |
| IT-PRO-05 | Datos promocionales invÃ¡lidos | 422/400 y ninguna escritura parcial | P0 |
| IT-PRO-06 | Cliente administra promociÃ³n | 403 | P0 |

### 5.3 Usuarios, pedidos, inventario, pagos y estadÃ­sticas

| ID | Caso integrado | Resultado esperado | P |
|---|---|---|---|
| IT-USR-01 | Listar/editar/desactivar cliente como admin | Respuesta paginada, actualizaciÃ³n, revocaciÃ³n y auditorÃ­a | P0 |
| IT-USR-02 | Crear/gestionar admin como superadmin | Persiste rol y auditorÃ­a | P0 |
| IT-USR-03 | Admin gestiona otro admin o se autodesactiva | 403/409 sin cambio | P0 |
| IT-ORD-01 | Crear pedido vÃ¡lido | TransacciÃ³n crea pedido, items, pago pendiente, movimientos y auditorÃ­a | P0 |
| IT-ORD-02 | Repetir misma clave idempotente | Devuelve el mismo pedido, sin duplicar stock ni pago | P0 |
| IT-ORD-03 | Dos compras concurrentes sobre Ãºltimo stock | Solo se vende stock disponible; nunca queda negativo | P0 |
| IT-ORD-04 | Producto inactivo, retirado, sin stock o cantidad invÃ¡lida | Rechaza y revierte toda la transacciÃ³n | P0 |
| IT-ORD-05 | Combo vÃ¡lido | Crea items/instantÃ¡neas y descuenta cantidades de cada producto | P0 |
| IT-ORD-06 | DirecciÃ³n no pertenece al usuario | Rechaza | P0 |
| IT-ORD-07 | Totales manipulados desde frontend | Backend ignora valores cliente y recalcula | P0 |
| IT-ORD-08 | Historial y detalle | Solo devuelve pedidos del usuario autenticado | P0 |
| IT-ORD-09 | Pedidos actuales e historial mensual | Se separan correctamente por estado | P1 |
| IT-ORD-10 | Cola admin con pÃ¡gina, lÃ­mite, estado y bÃºsqueda | Filtra, ordena y pagina consistentemente | P1 |
| IT-ORD-11 | Secuencia completa de estados | Solo permite transiciones vÃ¡lidas y audita cada una | P0 |
| IT-ORD-12 | EstadÃ­sticas por mes | Coinciden con pedidos y pagos aprobados de ese periodo | P1 |
| IT-ORD-13 | Cancelar pedido pendiente propio | Cancela una sola vez, devuelve stock, audita y rechaza al usuario ajeno | P0 |
| IT-PAY-01 | Pago aprobado en sandbox/simulador | Usa total servidor, guarda externalId, confirma pedido y no repite cobro | P0 |
| IT-PAY-02 | Pago rechazado | Persiste rechazo/cancelaciÃ³n y restituye stock exactamente una vez | P0 |
| IT-PAY-03 | MÃ©todo crÃ©dito/dÃ©bito/prepago/Yape reportado | Mapea correctamente cuando el proveedor lo soporte | P1 |
| IT-PAY-04 | Webhook aprobado/rechazado/reembolsado | Sincroniza el pedido correcto | P0 |
| IT-PAY-05 | Webhook duplicado o fuera de orden | Resultado idempotente, no duplica inventario | P0 |
| IT-PAY-06 | Webhook sin referencia/ID invÃ¡lido | Responde controladamente sin modificar datos | P0 |
| IT-PAY-07 | Reintentar pago pendiente | Procesa el mismo pedido, persiste la aprobaciÃ³n y bloquea un nuevo intento | P0 |
| IT-DB-01 | Migrar base vacÃ­a | Todas las migraciones se aplican en orden | P0 |
| IT-DB-02 | Restricciones e Ã­ndices | Unicidad y claves forÃ¡neas impiden inconsistencias | P0 |
| IT-DB-03 | Bootstrap superadmin repetido | Crea o recupera una sola cuenta, sin duplicarla | P0 |

## 6. Pruebas del sistema

Se ejecutan desde el navegador contra la aplicaciÃ³n completa. Los casos `ST-E2E` son candidatos principales para Selenium.

| ID | Recorrido completo | Resultado esperado | P |
|---|---|---|---|
| ST-E2E-01 | Visitante navega Inicio, Productos, Nosotros, UbÃ­canos y Contacto | Todas las pÃ¡ginas cargan, mantienen navegaciÃ³n y aviso acadÃ©mico | P1 |
| ST-E2E-02 | Visitante consulta catÃ¡logo | Ve productos disponibles, precios, categorÃ­a, promociones y stock | P0 |
| ST-E2E-03 | Visitante filtra/busca productos y abre carrito | Resultados y totales se actualizan correctamente | P1 |
| ST-E2E-04 | Visitante agrega varios productos y combo | Carrito conserva cantidades, lÃ­mites de stock, subtotales y total | P0 |
| ST-E2E-05 | Visitante intenta confirmar sin cuenta | Se solicita autenticaciÃ³n/registro y no se crea pedido | P0 |
| ST-E2E-06 | Registro con mapa y coordenadas | Cuenta y direcciÃ³n quedan disponibles para checkout | P0 |
| ST-E2E-07 | Registro invÃ¡lido/duplicado | Muestra errores comprensibles y conserva datos corregibles | P1 |
| ST-E2E-08 | Login, recarga, logout y nuevo login | SesiÃ³n persiste al recargar, se elimina al salir y se recupera al entrar | P0 |
| ST-E2E-09 | Cliente completa checkout con tarjeta de crÃ©dito de prueba | Se crea un solo pedido, pago aprobado y carrito se vacÃ­a | P0 |
| ST-E2E-10 | Cliente completa checkout con dÃ©bito de prueba compatible | Mismo resultado y mÃ©todo correcto | P0 |
| ST-E2E-11 | Pago rechazado | Informa rechazo, no muestra compra aprobada y stock queda consistente | P0 |
| ST-E2E-12 | Doble clic/recarga durante confirmaciÃ³n | No crea ni cobra dos pedidos | P0 |
| ST-E2E-13 | Cliente consulta Mis pedidos | Ve estado actual y lÃ­nea de progreso | P1 |
| ST-E2E-14 | Admin cambia estados mientras cliente consulta | La vista cliente refleja cambios por sondeo en mÃ¡ximo 30 s | P1 |
| ST-E2E-15 | Pedido entregado | Sale de actuales y aparece en historial mensual | P1 |
| ST-E2E-16 | Cliente intenta abrir panel admin | Acceso bloqueado/redirigido y API protegida | P0 |
| ST-E2E-17 | Admin crea producto con imagen Firebase | Aparece en administraciÃ³n y catÃ¡logo pÃºblico | P0 |
| ST-E2E-18 | Admin edita precio, imagen y stock | Cambios se reflejan; stock cero lo oculta pÃºblicamente y activa alerta | P0 |
| ST-E2E-19 | Admin retira producto | Desaparece de venta sin borrar historial | P0 |
| ST-E2E-20 | Admin crea promociÃ³n individual | Usa imagen del producto y aparece solo durante vigencia | P1 |
| ST-E2E-21 | Admin crea combo con imagen | Se muestra en carrusel/catÃ¡logo y puede agregarse al carrito | P0 |
| ST-E2E-22 | Carrusel promocional | Se mueve continuamente, repite en bucle, no tiene flechas y admite arrastre | P2 |
| ST-E2E-23 | Admin consulta y filtra pedidos | Ve detalle de cliente, direcciÃ³n, productos, promociÃ³n y pago | P0 |
| ST-E2E-24 | Admin procesa `CONFIRMEDâ†’PREPARINGâ†’READYâ†’OUT_FOR_DELIVERYâ†’DELIVERED` | Controles y estados permanecen sincronizados | P0 |
| ST-E2E-25 | Nuevo pedido mientras admin tiene la tabla abierta | Aparece automÃ¡ticamente en mÃ¡ximo 10 s | P1 |
| ST-E2E-26 | Admin gestiona cliente | Edita, desactiva; la sesiÃ³n del cliente deja de funcionar; luego reactiva | P0 |
| ST-E2E-27 | Superadmin crea/edita/desactiva admin | Cambios de acceso son efectivos | P0 |
| ST-E2E-28 | Admin intenta gestionar categorÃ­as/administradores | Interfaz y API lo bloquean | P0 |
| ST-E2E-29 | Superadmin administra categorÃ­as | Cambia las opciones disponibles al crear productos | P1 |
| ST-E2E-30 | Panel estadÃ­stico por mes | MÃ©tricas y rankings coinciden con los pedidos sembrados | P1 |
| ST-E2E-31 | Rutas profundas y recarga en Vercel | `/productos`, `/mis-pedidos` y `/admin/pedidos` cargan sin 404 | P1 |
| ST-E2E-32 | ComunicaciÃ³n Vercelâ†’rewrite `/api`â†’Nginxâ†’EC2â†’RDS | Productos, sesiÃ³n y pedidos funcionan por HTTPS sin CORS/mixed content | P0 |
| ST-E2E-33 | Firebase no disponible | Mensaje controlado; formulario permite reintentar sin duplicar producto | P1 |
| ST-E2E-34 | Mercado Pago no disponible/lento | Interfaz recuperable, sin pedido cobrado errÃ³neamente | P0 |
| ST-E2E-35 | SesiÃ³n expira durante operaciÃ³n | Se informa y redirige a login sin ejecutar acciÃ³n privilegiada | P0 |
| ST-E2E-36 | Vista responsive en mÃ³vil/tablet/escritorio | NavegaciÃ³n, formularios, carrito, tablas y mapa siguen operables | P2 |
| ST-E2E-37 | Accesibilidad bÃ¡sica por teclado | Foco visible, controles alcanzables, etiquetas/nombres accesibles | P2 |
| ST-E2E-38 | Compatibilidad Chrome, Edge y Firefox actuales | Flujos crÃ­ticos funcionan consistentemente | P2 |
| ST-E2E-39 | Cliente reintenta el pago de un pedido pendiente | Completa el pago sobre el mismo pedido, queda confirmado al aprobarse y no se genera un cobro duplicado | P0 |
| ST-E2E-40 | Cliente cancela un pedido todavÃ­a no pagado | El pedido se cancela una sola vez, desaparece del seguimiento activo, restituye el stock y registra auditorÃ­a | P0 |

### 6.1 Sistema no funcional y operativo

| ID | Caso | Resultado esperado | P |
|---|---|---|---|
| ST-NF-01 | Reiniciar servicio `elpoblano` | `systemd` lo deja `active (running)` y health vuelve a 200 | P0 |
| ST-NF-02 | Reiniciar EC2 | Backend, Nginx y certificados quedan operativos automÃ¡ticamente | P0 |
| ST-NF-03 | Base temporalmente no disponible | `/ready` falla, `/health` distingue proceso vivo y logs conservan diagnÃ³stico | P0 |
| ST-NF-04 | TLS y redirecciÃ³n HTTPâ†’HTTPS | Certificado vÃ¡lido y sin contenido mixto | P0 |
| ST-NF-05 | Secretos | No aparecen en repositorio, bundle frontend, respuestas ni logs | P0 |
| ST-NF-06 | AuditorÃ­a | Acciones administrativas y cambios de pedido son atribuibles y cronolÃ³gicos | P0 |
| ST-NF-07 | Rendimiento de referencia | Los endpoints crÃ­ticos cumplen el umbral que se fijarÃ¡ para JMeter | P1 |
| ST-NF-08 | RecuperaciÃ³n de datos | RestauraciÃ³n ensayada conserva integridad y satisface RPO/RTO definidos | P1 |

## 7. Pruebas de aceptaciÃ³n

Cada caso se aprueba mediante demostraciÃ³n y firma del responsable acadÃ©mico/product owner. Los criterios se expresan en lenguaje observable y son trazables a requisitos.

| ID | RF | Criterio de aceptaciÃ³n | P |
|---|---|---|---|
| AT-01 | RF-01 | Dado un visitante, cuando abre Productos, entonces ve Ãºnicamente productos activos con stock y precio vigente | P0 |
| AT-02 | RF-02 | Dado un visitante, cuando agrega productos/promociones y cambia cantidades, entonces el carrito conserva lÃ­neas y total | P0 |
| AT-03 | RF-03 | Dado un visitante con datos y ubicaciÃ³n vÃ¡lidos, cuando se registra, entonces obtiene una cuenta y direcciÃ³n predeterminada | P0 |
| AT-04 | RF-04 | Dado un cliente, cuando inicia/cierra sesiÃ³n, entonces accede/pierde acceso a sus funciones privadas | P0 |
| AT-05 | RF-05 | Dado un visitante sin sesiÃ³n, cuando intenta confirmar, entonces no se crea pedido y se exige autenticaciÃ³n | P0 |
| AT-06 | RF-06 | Dado un carrito vÃ¡lido, cuando confirma, entonces se registra un solo pedido con sus productos, precios y cantidades | P0 |
| AT-07 | RF-07 | Dado un pedido, cuando usa crÃ©dito o dÃ©bito de prueba, entonces Mercado Pago procesa y registra el mÃ©todo/estado; Yape queda identificado como pendiente de proveedor real | P0 |
| AT-08 | RF-08 | Dado un cliente, cuando abre Historial, entonces ve sus compras entregadas agrupadas por mes y ninguna ajena | P1 |
| AT-09 | RF-09 | Dado un cliente o visitante, cuando abre AdministraciÃ³n, entonces no accede al panel ni a sus API | P0 |
| AT-10 | RF-10 | Dado un admin, cuando registra un producto vÃ¡lido, entonces aparece en el catÃ¡logo si estÃ¡ activo y tiene stock | P0 |
| AT-11 | RF-11 | Dado un admin, cuando edita datos, precio, categorÃ­a, imagen o stock, entonces los cambios quedan visibles y auditados | P0 |
| AT-12 | RF-12 | Dado un admin, cuando retira un producto, entonces deja de venderse sin perder referencias histÃ³ricas | P0 |
| AT-13 | RF-13 | Dado un admin, cuando crea una promociÃ³n vÃ¡lida individual o combo, entonces se guardan vigencia, composiciÃ³n, descuento/precio e imagen aplicable | P0 |
| AT-14 | RF-14 | Dadas promociones futura, vigente y expirada, cuando un visitante abre Inicio, entonces solo ve la vigente activa | P0 |
| AT-15 | RF-15 | Dado un admin, cuando consulta/edita clientes, entonces ve datos paginados y persiste cambios permitidos | P1 |
| AT-16 | RF-16 | Dado un admin, cuando desactiva un cliente, entonces sus sesiones se revocan; al reactivarlo puede volver a iniciar sesiÃ³n | P0 |
| AT-17 | RF-17 | Dado un superadmin, cuando administra cuentas admin, entonces puede crearlas/editarlas/desactivarlas; un admin comÃºn no puede | P0 |
| AT-18 | RF-18 | Dada una acciÃ³n administrativa relevante, cuando finaliza, entonces existe una auditorÃ­a con actor, acciÃ³n, entidad y fecha | P0 |
| AT-19 | RF-19 | Dado un admin, cuando abre Pedidos, entonces consulta la cola paginada y puede buscar/filtrar | P0 |
| AT-20 | RF-20 | Dado un pedido no pagado, cuando se intenta preparar, entonces se rechaza; uno aprobado sÃ­ puede avanzar | P0 |
| AT-21 | RF-21 | Dado un pedido confirmado y pagado, cuando admin inicia preparaciÃ³n, entonces cambia a `PREPARING` | P0 |
| AT-22 | RF-22 | Dado un pedido en preparaciÃ³n, cuando admin lo marca listo, entonces cambia a `READY` | P0 |
| AT-23 | RF-23 | Dado un pedido, cuando admin abre detalle, entonces ve cliente, direcciÃ³n/mapa, productos, cantidades, importes y pago | P1 |
| AT-24 | RF-24 | Dado un cambio de estado, cuando se confirma, entonces se auditan estado anterior, nuevo y actor | P0 |
| AT-25 | RF-25 | Dado un cliente con pedidos no terminados, cuando abre Mis pedidos, entonces ve estado y progreso actualizados | P1 |
| AT-26 | RF-26 | Dado un cliente con pedidos entregados, cuando abre Historial, entonces obtiene resumen por mes, cantidad, total y detalle | P1 |
| AT-27 | RF-27 | Dado un pedido listo, cuando admin registra salida y entrega, entonces avanza secuencialmente a `OUT_FOR_DELIVERY` y `DELIVERED` | P0 |
| AT-28 | RF-28 | Dado un mes seleccionado, cuando admin consulta EstadÃ­sticas, entonces ve ingresos, pedidos, unidades, clientes y ticket promedio correctos | P1 |
| AT-29 | RF-29 | Dado un mes con ventas aprobadas, cuando admin consulta rankings, entonces ve productos y promociones ordenados por unidades/ingresos | P1 |
| AT-30 | RF-30 | Dadas promociones vigentes, cuando se abre Inicio, entonces el carrusel se mueve sin pausas, repite infinitamente y admite arrastre sin flechas | P2 |
| AT-31 | RF-31 | Dado un pedido pendiente sin pago en procesamiento, cuando el cliente selecciona Pagar pedido y el proveedor lo aprueba, entonces se confirma el mismo pedido sin duplicar el cobro | P0 |
| AT-32 | RF-32 | Dado un pedido todavÃ­a no pagado, cuando su propietario lo cancela, entonces el pedido deja de estar activo, el stock se restituye una sola vez y no puede volver a cancelarse | P0 |

## 8. Cobertura transversal obligatoria

AdemÃ¡s de las matrices anteriores, cada recurso HTTP debe probar: Ã©xito, datos mÃ­nimos/mÃ¡ximos, tipos invÃ¡lidos, campos faltantes, identificador inexistente, sesiÃ³n ausente/expirada, rol insuficiente, conflicto de unicidad, error del repositorio y ausencia de informaciÃ³n sensible. Cada operaciÃ³n de escritura debe verificar tanto respuesta como base de datos, auditorÃ­a, inventario y rollback.

Las combinaciones mÃ­nimas de acceso son:

| Recurso | Visitante | Cliente | Admin | Superadmin |
|---|---:|---:|---:|---:|
| CatÃ¡logo/categorÃ­as/promociones vigentes | SÃ­ | SÃ­ | SÃ­ | SÃ­ |
| Cuenta, carrito, pedidos y pagos propios | Parcial / No al confirmar | SÃ­ | SÃ­ como usuario | SÃ­ como usuario |
| Productos/promociones/pedidos/clientes admin | No | No | SÃ­ | SÃ­ |
| CategorÃ­as y cuentas administrativas | No | No | No | SÃ­ |

## 9. Criterios de entrada y salida

Entrada: requisitos aprobados, entorno estable, migraciones aplicadas, datos controlados, credenciales sandbox y build desplegable.

Salida de Fase 5:

- 100 % de casos P0 ejecutados y aprobados.
- 100 % de RF-01 a RF-32 con al menos una aceptaciÃ³n aprobada.
- Sin defectos crÃ­ticos o altos abiertos para el alcance entregable.
- Pruebas unitarias e integraciÃ³n reproducibles y con reporte de cobertura.
- Evidencias de sistema y aceptaciÃ³n archivadas por commit/versiÃ³n.
- Defectos conocidos P1/P2 registrados con responsable y decisiÃ³n.

## 10. Trazabilidad hacia fases 6, 7 y 8

| Salida | Fase siguiente |
|---|---|
| `UT-*` e `IT-*` automatizadas + LCOV | SonarQube: cobertura, bugs, smells, complejidad y deuda |
| `ST-E2E-*` prioritarias | Selenium: recorridos funcionales del navegador |
| `IT-API`, catÃ¡logo, login, pedidos y estadÃ­sticas | JMeter: carga, concurrencia, latencia y errores |
| Resultados JUnit/LCOV/HTML/JTL | GitHub Actions: ejecuciÃ³n y publicaciÃ³n de artefactos |
| `AT-*` | Evidencia formal de cumplimiento de requisitos |
