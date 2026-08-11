# El Poblano — Documentación técnica, funcional y de despliegue

| Campo | Valor |
|---|---|
| Proyecto | Plataforma web de comercio electrónico para la taquería El Poblano |
| Tipo | Proyecto académico de demostración |
| Arquitectura | Monorepo, Clean Architecture modular y cliente-servidor |
| Versión del documento | 2.0 |
| Fecha de corte | 9 de agosto de 2026 |
| Frontend de producción | `https://elpoblano.vercel.app` |
| API de producción | `https://elpoblano-api.duckdns.org/api` |

> **Aviso:** este proyecto es una demostración académica. No corresponde al sitio oficial del establecimiento y no debe procesar pedidos ni dinero real mientras utilice credenciales de prueba.

## 1. Propósito y alcance

El sistema digitaliza una parte del proceso comercial de una taquería presencial. Permite publicar el catálogo, registrar clientes con una dirección georreferenciada, administrar un carrito, crear pedidos, consultar el historial de compras y procesar pagos de prueba. También incorpora un panel protegido para administrar productos, categorías, promociones, existencias y cuentas.

El alcance actual comprende el registro, pago, preparación, salida y entrega del pedido. Los administradores controlan temporalmente el flujo completo hasta `DELIVERED`; todavía no existe un rol o aplicación independiente para repartidores.

## 2. Requisitos funcionales

| Código | Requisito | Implementación principal |
|---|---|---|
| RF-01 | Cualquier visitante consulta productos disponibles y precios. | Catálogo público; la API solo devuelve productos activos con stock mayor que cero. |
| RF-02 | Un visitante agrega uno o varios productos al carrito. | Carrito del frontend con persistencia local. |
| RF-03 | Un visitante crea una cuenta. | Registro con datos personales y dirección obligatoria marcada en mapa. |
| RF-04 | Un usuario inicia y cierra sesión. | Sesiones revocables almacenadas en MySQL y cookie `HttpOnly`. |
| RF-05 | Solo un usuario autenticado confirma una compra. | Middleware de autenticación en pedidos y pagos. |
| RF-06 | El sistema registra el pedido y sus productos. | Entidades `Order` y `OrderItem`, operación transaccional e idempotente. |
| RF-07 | Pago mediante Yape, crédito o débito. | Modelo preparado para esos métodos; integración de prueba activa con Mercado Pago para tarjetas. Yape queda como capacidad modelada, pendiente de proveedor real. |
| RF-08 | El usuario consulta su historial de compras. | Ruta y página de historial restringidas al propietario de los pedidos. |
| RF-09 | Solo administradores acceden al panel. | Protección en frontend y autorización por rol en backend. |
| RF-10 | Un administrador crea productos. | Formulario administrativo y ruta protegida. |
| RF-11 | Un administrador edita datos, precio, categoría, imagen y stock. | Actualización de producto, imagen en Firebase Storage y movimiento de inventario. |
| RF-12 | Un administrador retira productos. | Eliminación lógica con `active=false` y `deletedAt`. |
| RF-13 | Un administrador crea promociones con vigencia. | Promociones individuales o combos, productos asociados, descuentos, imagen representativa e inicio y fin validados. |
| RF-14 | Una promoción solo se muestra activa y vigente. | Consulta filtrada por estado y rango temporal. |
| RF-15 | Un administrador consulta y actualiza clientes. | Módulo administrativo de usuarios. |
| RF-16 | Un administrador activa o desactiva clientes. | Cambio de estado y revocación de sesiones al desactivar. |
| RF-17 | Un administrador principal administra otras cuentas administrativas. | Rol `SUPER_ADMIN` y reglas de jerarquía en el servicio administrativo. |
| RF-18 | Las acciones administrativas relevantes quedan auditadas. | Tabla `audit_logs` y registros en productos, categorías, promociones, usuarios, pedidos y pagos. |
| RF-19 | Administradores y administradores principales consultan los pedidos. | Cola administrativa paginada, filtrada y actualizada automáticamente. |
| RF-20 | Solo los pedidos pagados ingresan a preparación. | Validación conjunta de estado `CONFIRMED` y pago `APPROVED`. |
| RF-21 | Un administrador inicia la preparación. | Transición controlada `CONFIRMED → PREPARING`. |
| RF-22 | Un administrador marca el pedido como listo. | Transición controlada `PREPARING → READY`. |
| RF-23 | El administrador consulta cliente, entrega, productos y pago. | Panel lateral con detalle operativo y enlace a coordenadas. |
| RF-24 | Los cambios de estado quedan auditados. | Acción `ORDER_STATUS_UPDATED` con estado anterior y nuevo. |
| RF-25 | El cliente consulta sus pedidos actuales y su progreso. | Página `/mis-pedidos`, línea de tiempo y actualización automática. |
| RF-26 | El historial presenta las compras entregadas agrupadas por mes. | Resumen mensual con cantidad, importe total y detalle desplegable. |
| RF-27 | El administrador registra salida y entrega. | Transiciones `READY → OUT_FOR_DELIVERY → DELIVERED`. |
| RF-28 | El administrador consulta indicadores mensuales. | Ingresos, pedidos, unidades, clientes únicos y ticket promedio. |
| RF-29 | El administrador identifica productos y promociones destacados. | Rankings mensuales basados exclusivamente en pagos aprobados. |
| RF-30 | La página principal presenta promociones de manera continua e interactiva. | Carrusel animado en bucle infinito, desplazamiento automático y arrastre mediante puntero. |
| RF-31 | El cliente puede reintentar el pago de un pedido pendiente. | Acción `Pagar pedido` en seguimiento; reutiliza el pedido existente y bloquea cobros duplicados mientras el proveedor procesa la operación. |
| RF-32 | El cliente puede cancelar un pedido que todavía no ha sido pagado. | Cancelación restringida al propietario, devolución transaccional del stock y registro de auditoría; se bloquea cuando Mercado Pago ya procesa el pago. |

## 3. Arquitectura general

```text
Usuario
  |
  | HTTPS
  v
Vercel: React + Vite
  |  /api/* (rewrite HTTPS)
  v
DuckDNS + Let's Encrypt
  |
  v
Nginx en AWS EC2 :443
  |
  | proxy_pass http://127.0.0.1:3000
  v
Backend Node.js + Express (systemd)
  |                         |
  | red privada             | HTTPS
  v                         v
AWS RDS MySQL          Firebase Storage / Mercado Pago
```

### 3.1 Monorepo

```text
ElPoblano/
├── apps/
│   ├── backend/       API, Prisma, migraciones, pruebas y scripts
│   └── frontend/      SPA React, módulos, recursos y configuración Vercel
├── docs/              Documentación técnica y de calidad
├── package.json       Workspaces y scripts comunes
└── package-lock.json  Bloqueo único de dependencias
```

Los workspaces son `@elpoblano/frontend` y `@elpoblano/backend`. Las dependencias se instalan desde la raíz mediante `npm ci` o `npm install`.

### 3.2 Clean Architecture por módulos

Los módulos se separan por capacidad del negocio: `auth`, `products`, `categories`, `orders`, `payments`, `promotions`, `admin` y `files`.

```text
presentation     Rutas HTTP, esquemas de entrada y controladores
      ↓
application      Casos de uso, reglas y coordinación
      ↓
domain           Entidades y contratos independientes
      ↑
infrastructure   Prisma, Firebase y adaptadores externos
```

Cada módulo repite esta estructura deliberadamente para mantener alta cohesión, reducir el acoplamiento y permitir cambios aislados.

## 4. Backend

### 4.1 Tecnologías

- Node.js 22 y ECMAScript Modules.
- Express 5 para la API HTTP/JSON.
- Prisma ORM 7 con MySQL.
- Zod para validación.
- Argon2 para hash de contraseñas.
- Sesiones opacas almacenadas y revocables.
- Helmet, CORS y `express-rate-limit`.
- Firebase Admin SDK para imágenes.
- SDK de Mercado Pago para pagos de prueba.
- Pruebas unitarias con `node:test`.

### 4.2 Seguridad de sesión

Al registrar o autenticar un usuario, el backend genera un token aleatorio, almacena únicamente su hash y envía el token mediante la cookie `elpoblano_session`:

- `HttpOnly`: JavaScript del navegador no puede leerla.
- `Secure` en producción: solo viaja por HTTPS.
- `SameSite=Lax`: reduce exposición a CSRF.
- Duración configurable con `SESSION_DURATION_DAYS`.
- El cierre de sesión registra `revokedAt` y elimina la cookie.
- La desactivación de un usuario revoca sus sesiones vigentes.

Vercel reescribe `/api/*` hacia la API, por lo que el navegador utiliza un único origen público y la cookie funciona como cookie de primera parte.

### 4.3 Roles y permisos

| Rol | Capacidades principales |
|---|---|
| `CUSTOMER` | Cuenta, sesión, catálogo, carrito, pedido, pago e historial propio. |
| `ADMIN` | Capacidades del cliente más administración de productos, promociones y clientes. |
| `SUPER_ADMIN` | Capacidades administrativas más categorías y cuentas administrativas. |

La protección visual del frontend no sustituye al backend: todas las operaciones críticas vuelven a validar sesión y rol en la API.

### 4.4 API principal

| Grupo | Prefijo | Operaciones destacadas |
|---|---|---|
| Salud | `/api/health`, `/api/ready` | Estado del proceso y conectividad con la base. |
| Autenticación | `/api/auth` | Registro, login, logout y usuario actual. |
| Productos | `/api/productos` | Catálogo público y CRUD administrativo. |
| Categorías | `/api/categorias` | Listado público y administración por `SUPER_ADMIN`. |
| Pedidos | `/api/pedidos` | Creación idempotente, pedidos activos, historial mensual, estadísticas, cola administrativa, detalle y transición de estados. |
| Pagos | `/api/pagos` | Pago Mercado Pago y webhook público. |
| Promociones | `/api/promociones` | Vigentes públicas y CRUD administrativo. |
| Archivos | `/api/archivos` | Carga administrativa a Firebase Storage. |
| Usuarios | `/api/admin/usuarios` | Consulta, edición, estado y administradores. |

La creación de pedidos requiere la cabecera `Idempotency-Key`. Una misma clave no debe producir dos pedidos.

## 5. Base de datos

### 5.1 Motor y ORM

Se utiliza MySQL. Prisma mantiene el esquema y las migraciones como código. Después de crear la base y el usuario, las tablas no se crean manualmente en Workbench; se aplican mediante migraciones.

### 5.2 Entidades

| Entidad | Responsabilidad |
|---|---|
| `User` | Identidad, datos personales, rol y estado. |
| `Address` | Dirección, referencia, latitud, longitud y dirección predeterminada. |
| `Session` | Sesiones expirables y revocables. |
| `Category` | Catálogo controlado de categorías. |
| `Product` | Producto, precio, imagen, stock y retiro lógico. |
| `Promotion` | Descuento, periodo, creador y estado. |
| `PromotionProduct` | Relación muchos-a-muchos entre promociones y productos. |
| `Order` | Cabecera, cliente, entrega, importes y estado. |
| `OrderItem` | Instantánea de producto, precio, cantidad y subtotal. |
| `Payment` | Proveedor, método, identificador externo, importe y estado. |
| `InventoryMovement` | Venta, ajuste, devolución o compra de stock. |
| `AuditLog` | Actor, acción, entidad, metadatos y fecha. |

Las categorías iniciales versionadas son Tacos, Quesadilla, Nachos, Refrescos, Gaseosa, Cerveza y Agua. Un producto sin stock desaparece del catálogo público, pero continúa visible con alerta en el panel administrativo.

### 5.3 Reglas de consistencia

- Llaves foráneas con políticas `Cascade`, `Restrict` o `SetNull` según el historial que se deba preservar.
- Índices para sesiones, estados, fechas, roles, categorías y búsquedas crecientes.
- Precios y coordenadas con tipos decimales.
- Correos, slugs, tokens, claves de idempotencia e identificadores de proveedor únicos.
- Pedido, detalle, descuento de stock, pago pendiente, movimiento y auditoría se registran transaccionalmente.
- Si un pago es rechazado, el stock reservado se restituye y se registra el movimiento.

## 6. Frontend

### 6.1 Tecnologías y módulos

El frontend es una SPA con React 18, Vite, React Router, Axios, Material UI, Bootstrap, Leaflet y Mercado Pago Bricks.

Sus módulos incluyen:

- `home`, `about`, `contact` y `location`.
- `catalog` y `cart`.
- `auth` y dirección con mapa.
- `orders` y `payments`.
- `admin`, productos, categorías, promociones y usuarios.
- Componentes compartidos, navegación, pie y aviso académico.

La interfaz pública utiliza una identidad visual propia del proyecto y declara expresamente su finalidad académica. La página principal incluye un carrusel de promociones que avanza continuamente, repite el contenido en bucle y permite desplazamiento manual mediante mouse o entrada táctil. Las promociones individuales reutilizan la imagen del producto; los combos requieren una imagen representativa.

### 6.2 Rutas destacadas

| Ruta | Uso |
|---|---|
| `/` | Página principal y promociones. |
| `/productos` | Catálogo comprable. |
| `/registro` | Registro con dirección. |
| `/checkout` | Confirmación y pago. |
| `/historial` | Pedidos del usuario. |
| `/mis-pedidos` | Pedidos activos y seguimiento visual del cliente. |
| `/admin` | Panel administrativo protegido. |
| `/admin/pedidos` | Cola operativa y detalle administrativo de pedidos. |
| `/admin/estadisticas` | Indicadores y rankings mensuales. |
| `/crearproducto` | Alta de producto. |
| `/editarproducto/:id` | Edición y reposición de stock. |
| `/admin/promociones` | Gestión de promociones. |
| `/admin/usuarios` | Gestión de cuentas. |
| `/admin/categorias` | Gestión exclusiva de `SUPER_ADMIN`. |

La cola administrativa consulta nuevamente la API cada 10 segundos y los pedidos actuales del cliente cada 30 segundos. Esto proporciona actualización automática por sondeo periódico; no constituye comunicación en tiempo real mediante WebSocket. Los intervalos se cancelan al desmontar cada página para evitar solicitudes huérfanas.

### 6.3 Imágenes

El navegador envía la imagen al endpoint administrativo. El backend valida autorización, tipo y tamaño, la carga a Firebase Storage y devuelve la URL pública. No se conservan imágenes de producto en el disco de EC2.

### 6.4 Pagos

Mercado Pago Payment Brick tokeniza los datos sensibles en el navegador. El backend recibe el token de pago y datos mínimos; nunca debe almacenar número completo, CVV ni PIN.

En pruebas se utilizan:

- Public Key de prueba en Vercel.
- Access Token de prueba únicamente en EC2.
- Tarjetas y compradores de prueba de Mercado Pago.
- Webhook: `https://elpoblano-api.duckdns.org/api/pagos/webhook`.

Para pagos reales se deberán activar credenciales de producción, completar la validación comercial, verificar la firma del webhook y ejecutar pruebas de seguridad y conciliación.

## 7. Configuración local

### 7.1 Requisitos

- Node.js compatible con el proyecto.
- npm.
- MySQL local.
- Proyecto de Firebase y cuenta de servicio.
- Aplicación de Mercado Pago en modo prueba.

### 7.2 Instalación

```powershell
git clone <URL_DEL_REPOSITORIO>
cd ElPoblano
npm install
Copy-Item apps/backend/.env.example apps/backend/.env
Copy-Item apps/frontend/.env.example apps/frontend/.env
```

### 7.3 Variables del backend

```env
PORT=3000
NODE_ENV=development
FRONTEND_ORIGIN=http://localhost:5173
SESSION_DURATION_DAYS=7
DATABASE_URL="mysql://USUARIO:CONTRASENA@localhost:3306/elpoblano"

SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
SUPER_ADMIN_FIRST_NAME=
SUPER_ADMIN_LAST_NAME=

FIREBASE_STORAGE_BUCKET=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

MERCADO_PAGO_NOTIFICATION_URL=
```

La clave privada se guarda en una sola variable con saltos representados por `\n`. Nunca debe enviarse al frontend ni versionarse.
`MERCADO_PAGO_ACCESS_TOKEN` es obligatoria, pero debe configurarse directamente en el gestor de secretos del entorno y nunca escribirse en archivos versionados.

### 7.4 Variables del frontend

```env
VITE_ENDPOINT_BASE=http://localhost:3000/api
VITE_MERCADO_PAGO_PUBLIC_KEY=
VITE_API_KEY=
VITE_AUTH_DOMAIN=
VITE_PROJECT_ID=
VITE_STORAGE_BUCKET=
VITE_SENDER_ID=
VITE_APP_ID=
```

Toda variable `VITE_*` es pública porque queda incluida en los archivos del navegador. No colocar contraseñas ni secretos allí.

### 7.5 Migraciones y ejecución

```powershell
npm run db:generate -w @elpoblano/backend
npm run db:deploy -w @elpoblano/backend
npm run admin:bootstrap -w @elpoblano/backend
npm run dev
```

Para crear una migración durante el desarrollo:

```powershell
npm run db:migrate -w @elpoblano/backend -- --name descripcion_del_cambio
```

## 8. Despliegue realizado

### 8.1 AWS EC2

Configuración utilizada:

- Región: `us-east-2`.
- Ubuntu Server 24.04 LTS, x86_64.
- Tipo: `t3.small`.
- Almacenamiento: 20 GiB `gp3`.
- IP elástica asociada: `3.16.98.216`.
- Acceso SSH mediante par de claves PEM.

El grupo de seguridad del backend permite:

- TCP 22 únicamente desde la IP pública administrativa actual.
- TCP 80 desde Internet.
- TCP 443 desde Internet.
- El puerto 3000 no se expone públicamente.

Conexión desde Windows:

```powershell
ssh -i "C:\ruta\segura\elpoblano-production.pem" ubuntu@3.16.98.216
```

La clave PEM debe tener permisos restringidos al propietario.

### 8.2 AWS RDS

- Motor MySQL.
- Instancia privada, no accesible públicamente.
- Base `elpoblano` y usuario de aplicación con privilegios limitados.
- Grupo `elpoblano-db-sg` con entrada 3306 cuyo origen es el grupo `elpoblano-api-sg`, no una IP pública.
- EC2 y RDS están en la misma VPC.
- En el plan utilizado, la retención de copias se ajustó al máximo admitido por la cuenta.

La URL de producción usa el endpoint privado de RDS:

```env
DATABASE_URL="mysql://elpoblano_app:CONTRASENA@ENDPOINT_RDS:3306/elpoblano"
```

### 8.3 Instalación del backend en EC2

```bash
sudo mkdir -p /var/www/elpoblano
sudo chown -R ubuntu:ubuntu /var/www/elpoblano
git clone <URL_DEL_REPOSITORIO> /var/www/elpoblano
cd /var/www/elpoblano
npm ci --include=dev
npm run db:generate -w @elpoblano/backend
npm run db:deploy -w @elpoblano/backend
```

El archivo `/var/www/elpoblano/apps/backend/.env` contiene exclusivamente los valores de producción y debe protegerse:

```bash
chmod 600 /var/www/elpoblano/apps/backend/.env
```

Valores públicos relevantes:

```env
NODE_ENV=production
PORT=3000
FRONTEND_ORIGIN=https://elpoblano.vercel.app
MERCADO_PAGO_NOTIFICATION_URL=https://elpoblano-api.duckdns.org/api/pagos/webhook
```

### 8.4 Servicio systemd

Archivo `/etc/systemd/system/elpoblano.service`:

```ini
[Unit]
Description=Backend de ElPoblano
Wants=network-online.target
After=network-online.target

[Service]
Type=simple
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/elpoblano/apps/backend
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=5
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Activación y comprobación:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now elpoblano
sudo systemctl status elpoblano
sudo journalctl -u elpoblano -n 100 --no-pager
```

El estado correcto es `active (running)`.

### 8.5 Nginx

Nginx recibe tráfico público y lo reenvía a Node en localhost. Archivo inicial `/etc/nginx/sites-available/elpoblano`:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name elpoblano-api.duckdns.org;
    server_tokens off;
    client_max_body_size 6M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 10s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/elpoblano /etc/nginx/sites-enabled/elpoblano
sudo nginx -t
sudo systemctl reload nginx
```

Express configura un proxy confiable en producción para interpretar correctamente la IP y el protocolo reenviados por Nginx.

### 8.6 DuckDNS y HTTPS

Se creó `elpoblano-api.duckdns.org` apuntando a `3.16.98.216`. La resolución se verifica con:

```powershell
nslookup elpoblano-api.duckdns.org
```

Certificado TLS mediante Certbot:

```bash
sudo snap install --classic certbot
sudo ln -sf /snap/bin/certbot /usr/local/bin/certbot
sudo certbot --nginx -d elpoblano-api.duckdns.org
sudo certbot renew --dry-run
```

### 8.7 Vercel

El repositorio se importa como proyecto Vite con:

```text
Root Directory: apps/frontend
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
```

Variables de producción y preview:

```env
VITE_ENDPOINT_BASE=/api
VITE_MERCADO_PAGO_PUBLIC_KEY=<PUBLIC_KEY_DE_PRUEBA>
VITE_API_KEY=<CONFIG_WEB_FIREBASE>
VITE_AUTH_DOMAIN=<CONFIG_WEB_FIREBASE>
VITE_PROJECT_ID=<CONFIG_WEB_FIREBASE>
VITE_STORAGE_BUCKET=<CONFIG_WEB_FIREBASE>
VITE_SENDER_ID=<CONFIG_WEB_FIREBASE>
VITE_APP_ID=<CONFIG_WEB_FIREBASE>
```

`VITE_ENDPOINT_BASE` no es un secreto y no se marca como `Sensitive`. El archivo `apps/frontend/vercel.json` realiza dos funciones:

1. Reescribe `/api/*` hacia la API HTTPS en DuckDNS.
2. Devuelve `index.html` para las rutas de React.

Cada commit crea un deployment inmutable. Los previews pueden requerir autenticación de Vercel; el enlace público estable que debe compartirse es `https://elpoblano.vercel.app`.

Flujo recomendado:

```text
rama developer → deployment Preview → pruebas → merge a main → Production
```

## 9. Verificación

El diseño completo de la Fase 5 se encuentra en [`PLAN_MAESTRO_PRUEBAS_FASE_5.md`](./PLAN_MAESTRO_PRUEBAS_FASE_5.md). La matriz define 239 casos trazables: 104 unitarios, 59 de integración, 46 de sistema y 30 de aceptación.

El plan integral de auditoría, atributos de calidad, 42 requisitos no funcionales, métricas y relación entre las Fases 1–10 se encuentra en [`PLAN_MAESTRO_PROYECTO_CALIDAD.md`](./PLAN_MAESTRO_PROYECTO_CALIDAD.md).

### 9.1 Calidad de código

```powershell
npm run lint
npm test
npm run build
```

Al cierre de esta actualización existen dieciocho pruebas unitarias aprobadas para administración, autenticación, estados de pedidos, pagos, productos y promociones.

### 9.2 Salud de producción

```powershell
curl.exe https://elpoblano-api.duckdns.org/api/health
curl.exe https://elpoblano-api.duckdns.org/api/ready
curl.exe https://elpoblano.vercel.app/api/health
curl.exe https://elpoblano.vercel.app/api/ready
```

Respuestas esperadas:

```json
{"status":"ok"}
```

```json
{"status":"ready","database":"connected"}
```

### 9.3 Prueba funcional sugerida

1. Abrir el dominio público en una ventana de incógnito.
2. Consultar productos y promociones sin iniciar sesión.
3. Registrar un cliente con ubicación y dirección.
4. Cerrar e iniciar sesión; recargar y comprobar persistencia.
5. Agregar varias unidades al carrito sin superar el stock.
6. Revisar el checkout y realizar un pago de prueba.
7. Consultar el historial del cliente.
8. Iniciar como `SUPER_ADMIN` y crear un administrador.
9. Iniciar como `ADMIN`, crear un producto, cargar una imagen y ajustar stock.
10. Comprobar que stock cero oculta el producto al cliente y activa la alerta administrativa.
11. Crear una promoción y comprobar su visibilidad dentro y fuera del periodo.
12. Desactivar un cliente y verificar la revocación de su sesión.

## 10. ISO/IEC 25010

| Característica | Aplicación en el sistema |
|---|---|
| Adecuación funcional | RF-01 a RF-32, reglas de rol, stock, vigencia, pagos, seguimiento y analítica mensual. |
| Eficiencia | Índices, paginación, límites, proxy Nginx y consultas filtradas. |
| Compatibilidad | API JSON, CORS, HTTPS y adaptadores externos. |
| Capacidad de interacción | Validación, errores uniformes, mapa, alertas y panel por rol. |
| Fiabilidad | Transacciones, idempotencia, servicio reiniciable y health checks. |
| Seguridad | Argon2, cookies seguras, sesiones revocables, RBAC, Helmet y rate limiting. |
| Mantenibilidad | Monorepo, módulos y capas con responsabilidades delimitadas. |
| Flexibilidad | Repositorios y proveedores reemplazables, configuración por entorno. |
| Protección | RDS privado, migraciones, copias, eliminación lógica y auditoría. |

ISO/IEC 25010 es un modelo de calidad, no una lista de campos obligatorios. Las características anteriores deben mantenerse mediante evidencias, pruebas y revisiones.

## 11. Operación y actualización

Después de publicar cambios en Git:

```bash
cd /var/www/elpoblano
git pull origin main
npm ci --include=dev
npm run db:generate -w @elpoblano/backend
npm run db:deploy -w @elpoblano/backend
sudo systemctl restart elpoblano
sudo systemctl status elpoblano --no-pager -l
```

Se incluye temporalmente el conjunto de dependencias de desarrollo porque el ejecutable de Prisma está declarado como `devDependency` y es necesario para `generate` y `migrate deploy`. Si se adopta una fase de construcción independiente, el artefacto generado puede desplegarse sin esa dependencia. Si la rama desplegada es otra, sustituir `main` por la rama aprobada. No ejecutar `prisma migrate dev` en producción.

El acceso a Prisma usa una importación compatible con la interoperabilidad CommonJS/ESM de Node.js 22. Después de actualizar dependencias siempre se regenera el cliente antes de reiniciar `systemd`; esto evita que EC2 arranque con un cliente ausente o incompatible.

Comandos operativos:

```bash
sudo journalctl -u elpoblano -f
sudo nginx -t
sudo systemctl status nginx
sudo certbot renew --dry-run
```

## 12. Seguridad y secretos

- No versionar `.env`, PEM, JSON de cuenta de servicio ni tokens.
- Rotar cualquier credencial expuesta en chats, capturas o commits.
- Mantener la clave privada de Firebase únicamente en el backend.
- Mantener el Access Token de Mercado Pago únicamente en EC2.
- No ejecutar `npm audit fix --force` directamente en producción.
- Corregir dependencias localmente, ejecutar pruebas y desplegar el `package-lock.json` resultante.
- Restringir SSH a la IP administrativa actual.
- No abrir MySQL ni el puerto 3000 a Internet.
- Revisar auditorías, logs, renovaciones TLS, consumo de créditos AWS y copias RDS.

## 13. Limitaciones y trabajo pendiente

- Mercado Pago continúa con credenciales de prueba.
- Verificar criptográficamente la firma del webhook antes de aceptar pagos reales.
- Yape requiere proveedor/adquirente o flujo comercial autorizado; no está integrado como cobro real.
- No existe un rol o aplicación independiente para repartidores; los administradores registran actualmente la salida y entrega.
- La actualización automática de pedidos usa sondeo periódico; una evolución futura puede utilizar Server-Sent Events o WebSocket.
- Revisar y corregir vulnerabilidades reportadas por `npm audit --omit=dev`.
- Incorporar monitoreo y alertas centralizadas.
- Definir restauración probada de RDS y objetivos RPO/RTO.
- Optimizar división de bundles del frontend.
- Reemplazar DuckDNS por dominio propio si el sistema deja de ser una demostración.
- Evaluar Docker y CI/CD en una fase posterior; no son requisitos para la operación actual.

## 14. Criterio de estado actual

El sistema se considera desplegado para demostración cuando:

- `systemd` muestra `elpoblano` como `active (running)` sin reinicios continuos.
- Nginx y Certbot sirven la API mediante HTTPS.
- `/api/health` y `/api/ready` responden tanto por DuckDNS como por Vercel.
- El dominio público no solicita autenticación de Vercel.
- El catálogo, sesiones y panel administrativo funcionan desde otro dispositivo.
- Solo se realizan pagos con credenciales y datos de prueba.

## 15. Historial de revisiones

| Versión | Fecha | Cambios principales |
|---|---|---|
| 1.0 | 8 de agosto de 2026 | Documento integral inicial: arquitectura, requisitos RF-01 a RF-29, configuración local y despliegue. |
| 2.0 | 9 de agosto de 2026 | Promociones individuales y combos, carrusel continuo interactivo, seguimiento automático de pedidos, estadísticas administrativas y procedimiento corregido de Prisma en EC2. |
