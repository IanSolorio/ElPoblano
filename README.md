# El Poblano

Monorepo de la tienda web de la taquería El Poblano. El frontend permite consultar productos, utilizar el carrito y administrar el catálogo; el backend expone la API del negocio.

## Estructura

```text
ElPoblano/
├── apps/
│   ├── frontend/                 # React + Vite
│   │   └── src/
│   │       ├── app/              # Composición y rutas
│   │       ├── modules/          # Módulos funcionales
│   │       └── shared/           # Código reutilizable
│   └── backend/                  # Node.js + Express
│       └── src/
│           ├── config/           # Variables y configuración
│           ├── modules/products/
│           │   ├── domain/       # Entidades y contratos
│           │   ├── application/  # Casos de uso
│           │   ├── infrastructure/ # Persistencia
│           │   └── presentation/ # Rutas HTTP
│           └── shared/           # Middleware compartido
├── package.json                  # Scripts y workspaces
└── package-lock.json             # Dependencias de todo el monorepo
```

La dirección de las dependencias dentro de cada módulo es: `presentation → application → domain`. La infraestructura implementa los contratos definidos por el dominio y se conecta en `app.js`.

## Puesta en marcha

1. Ejecuta `npm install` en la raíz.
2. Copia los archivos `.env.example` como `.env` dentro de cada aplicación.
3. Ejecuta `npm run dev` para levantar frontend y backend.

Servicios locales:

- Frontend: `http://localhost:5173/ElPoblano/`
- Backend: `http://localhost:3000/api`
- Estado de la API: `GET /api/health`
- Productos: `GET|POST /api/productos` y `GET|PUT|DELETE /api/productos/:id`
- Autenticación: `POST /api/auth/registro`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`
- Pedidos: `POST /api/pedidos`, `GET /api/pedidos/historial`, `GET /api/pedidos/:id`
- Promociones públicas: `GET /api/promociones`
- Promociones administrativas: `GET /api/promociones/admin`, `POST|PUT|DELETE /api/promociones`
- Usuarios administrativos: `GET|PUT|DELETE /api/admin/usuarios`, `PATCH /api/admin/usuarios/:id/status`
- Alta de administradores: `POST /api/admin/usuarios/administradores` (`SUPER_ADMIN`)

La creación de pedidos exige una sesión válida y la cabecera `Idempotency-Key`. El pago se registra inicialmente como pendiente; la confirmación definitiva dependerá del webhook de la futura pasarela de pagos.

Para crear o recuperar la cuenta administrativa principal, configura las variables `SUPER_ADMIN_*` del `.env.example` en el `.env` local y ejecuta `npm run admin:bootstrap -w @elpoblano/backend`.

## Scripts

- `npm run dev`: inicia las dos aplicaciones.
- `npm run dev:frontend`: inicia únicamente React.
- `npm run dev:backend`: inicia únicamente la API.
- `npm run build`: genera el frontend de producción.
- `npm run lint`: valida todos los workspaces.
- `npm test`: ejecuta las pruebas disponibles.
- `npm run test:phase5`: ejecuta y consolida las pruebas de la Fase 5.
- `npm run test:selenium`: ejecuta los 32 RF y 12 RNF automatizados con Selenium.
- `npm run test:jmeter`: ejecuta los 14 escenarios RNF definidos para JMeter.
- `npm run sonar:analyze`: prepara la cobertura y envía el análisis a SonarQube Cloud.

La estructura, los estados y las rutas canónicas de evidencia están descritos
en [`tests/results/README.md`](tests/results/README.md). La fuente consolidada
de los 32 RF y 42 RNF es
[`tests/results/trazabilidad/matriz_final.csv`](tests/results/trazabilidad/matriz_final.csv).

## Base de datos MySQL

El backend utiliza Prisma ORM con MySQL. El esquema versionado está en `apps/backend/prisma/schema.prisma` y la API usa `PrismaProductRepository`; el repositorio en memoria se conserva para pruebas unitarias.

Configura `DATABASE_URL` en `apps/backend/.env` y ejecuta desde la raíz:

```bash
npm run db:generate -w @elpoblano/backend
npm run db:deploy -w @elpoblano/backend
```

Para cambios futuros en desarrollo:

```bash
npm run db:migrate -w @elpoblano/backend -- --name descripcion_del_cambio
```

Las migraciones son parte del código y deben mantenerse en Git. No edites las tablas directamente desde MySQL Workbench porque produciría diferencias entre la base y el historial de Prisma.
