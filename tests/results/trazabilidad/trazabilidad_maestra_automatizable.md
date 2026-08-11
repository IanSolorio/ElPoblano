# TRAZABILIDAD MAESTRA AUTOMATIZABLE — EL POBLANO
## Propuesta: Selenium + JMeter + SonarQube + GitHub Actions

## 0. Propósito

Este documento define la nueva trazabilidad propuesta del proyecto **El Poblano** para que los 32 Requisitos Funcionales (RF) y los 42 Requisitos No Funcionales (RNF) tengan una validación técnica automatizable.

Objetivo:

`Requisito → ISO/IEC 25010 (solo RNF) → Herramienta → Caso automatizado → Métrica → Umbral → PASS/FAIL → Evidencia`

Herramientas principales:

- **Selenium:** RF, interfaz, E2E, roles, sesiones, responsive y operabilidad.
- **JMeter:** rendimiento, carga, concurrencia, escalabilidad, disponibilidad bajo carga y fiabilidad.
- **SonarQube:** bugs, vulnerabilidades, code smells, cobertura, duplicación, complejidad y deuda técnica.
- **GitHub Actions:** CI/CD, reproducibilidad, portabilidad, scripts técnicos, migraciones, secretos y orquestación.

> Esta es una **propuesta de actualización**. Los requisitos originales deben conservarse como historial para justificar cualquier reformulación.

---

# 1. Estado base

| Elemento | Cantidad / estado |
|---|---:|
| RF | 32 |
| RNF | 42 |
| Unitarias backend | 107 |
| Vitest frontend | 20 |
| Integración | 61 |
| Sistema | 48/48 verificadas |
| Aceptación | 32 |
| Selenium actuales | 9 |
| Meta | automatizar todos los RF y todos los RNF mediante las cuatro piezas |

---

# 2. Matriz de RF automatizables

> Regla: **RF-01 a RF-32 se validan principalmente con Selenium**.
> Unitarias e integración se conservan como evidencia técnica complementaria.

| RF | Requisito funcional | Herramienta | Caso | PASS |
|---|---|---|---|---|
| RF-01 | Consultar productos disponibles y precios | Selenium | SEL-RF-01 | Productos activos visibles con nombre y precio |
| RF-02 | Agregar productos/promociones al carrito | Selenium | SEL-RF-02 | Producto aparece con cantidad y subtotal correctos |
| RF-03 | Crear cuenta con dirección/ubicación | Selenium | SEL-RF-03 | Cuenta creada correctamente |
| RF-04 | Iniciar/cerrar sesión | Selenium | SEL-RF-04 | Login válido y logout revoca acceso |
| RF-05 | Exigir autenticación para compra | Selenium | SEL-RF-05 | Usuario anónimo queda bloqueado/redirigido |
| RF-06 | Registrar pedido y productos | Selenium | SEL-RF-06 | Se crea un único pedido correcto |
| RF-07 | Procesar pago de prueba | Selenium | SEL-RF-07 | Aprobado/rechazado se reflejan correctamente |
| RF-08 | Consultar historial | Selenium | SEL-RF-08 | Pedido entregado aparece en historial |
| RF-09 | Restringir panel administrativo | Selenium | SEL-RF-09 | Roles acceden solo a lo permitido |
| RF-10 | Crear productos | Selenium | SEL-RF-10 | Producto creado y visible |
| RF-11 | Editar producto/precio/categoría/imagen/stock | Selenium | SEL-RF-11 | Cambios persistentes |
| RF-12 | Retirar producto de venta | Selenium | SEL-RF-12 | Producto deja de ser vendible |
| RF-13 | Crear promoción/combo | Selenium | SEL-RF-13 | Promoción creada y utilizable |
| RF-14 | Mostrar promociones vigentes | Selenium | SEL-RF-14 | Solo vigentes son visibles |
| RF-15 | Consultar/actualizar clientes | Selenium | SEL-RF-15 | Cambios visibles |
| RF-16 | Activar/desactivar clientes | Selenium | SEL-RF-16 | Desactivado pierde acceso |
| RF-17 | SUPER_ADMIN administra administradores | Selenium | SEL-RF-17 | CRUD y restricciones de rol correctos |
| RF-18 | Auditar acciones administrativas | Selenium | SEL-RF-18 | Acción queda registrada |
| RF-19 | Buscar/filtrar pedidos | Selenium | SEL-RF-19 | Resultados corresponden al filtro |
| RF-20 | Impedir preparar pedido no pagado | Selenium | SEL-RF-20 | Acción bloqueada |
| RF-21 | CONFIRMED → PREPARING | Selenium | SEL-RF-21 | Transición correcta |
| RF-22 | PREPARING → READY | Selenium | SEL-RF-22 | Transición correcta |
| RF-23 | Consultar detalle operativo | Selenium | SEL-RF-23 | Datos del pedido correctos |
| RF-24 | Auditar cambios de estado | Selenium | SEL-RF-24 | Cambio registrado |
| RF-25 | Mostrar pedidos actuales/progreso | Selenium | SEL-RF-25 | Cliente ve estado actualizado |
| RF-26 | Mostrar historial/resumen mensual | Selenium | SEL-RF-26 | Historial y resumen correctos |
| RF-27 | READY → OUT_FOR_DELIVERY → DELIVERED | Selenium | SEL-RF-27 | Secuencia válida sin saltos |
| RF-28 | Mostrar estadísticas mensuales | Selenium | SEL-RF-28 | Panel muestra datos esperados |
| RF-29 | Ranking de productos/promociones | Selenium | SEL-RF-29 | Ranking ordenado correctamente |
| RF-30 | Carrusel promocional interactivo | Selenium | SEL-RF-30 | Carrusel funciona sin errores |
| RF-31 | Reintentar pago pendiente | Selenium | SEL-RF-31 | Conserva pedido y actualiza pago |
| RF-32 | Cancelar pedido y restituir stock | Selenium | SEL-RF-32 | CANCELLED y stock restaurado |

**Cobertura propuesta RF: 32/32 con Selenium.**

---

# 3. Matriz RNF automatizable trazada a ISO/IEC 25010

## 3.1 Seguridad

| RNF | Redacción automatizable propuesta | ISO/IEC 25010 | Herramienta | Caso | Métrica / umbral |
|---|---|---|---|---|---|
| SEG-01 | Pipeline comprueba uso de Argon2 y ausencia de hashes expuestos | Seguridad / Confidencialidad | GitHub Actions + SonarQube | CI-SEG-01 | Argon2 presente; 0 exposiciones |
| SEG-02 | 100 % de rutas privadas/por rol rechazan accesos inválidos | Seguridad / Autenticidad | Selenium | SEL-SEG-02 | 100 % correctas |
| SEG-03 | Cookie de sesión contiene HttpOnly, Secure, SameSite=Lax y Path=/ | Seguridad | Selenium | SEL-SEG-03 | 4/4 atributos |
| SEG-04 | Logout/expiración/revocación invalida siguiente acceso privado | Seguridad | Selenium | SEL-SEG-04 | 100 % rechazados |
| SEG-05 | CI detecta secretos y Sonar no reporta vulnerabilidades críticas/nuevas altas | Seguridad / Confidencialidad | GitHub Actions + SonarQube | CI-SEG-05 | 0 secretos; 0 críticas |
| SEG-06 | API bloquea >120 req/min por cliente | Seguridad | JMeter | JM-SEG-06 | HTTP 429 en 100 % de excesos |
| SEG-07 | Toda acción admin crítica produce registro de auditoría verificable | Seguridad / Responsabilidad | Selenium | SEL-SEG-07 | 100 % registradas |
| SEG-08 | Smoke test opera por HTTPS válido sin recursos críticos inseguros | Seguridad | Selenium + GitHub Actions | SEL-SEG-08 + CI-SEG-08 | HTTPS válido; 0 errores críticos |

## 3.2 Eficiencia de desempeño

| RNF | Redacción automatizable propuesta | ISO/IEC 25010 | Herramienta | Caso | Métrica / umbral |
|---|---|---|---|---|---|
| REN-01 | 25 usuarios en GET /productos | Eficiencia de desempeño | JMeter | JM-REN-01 | p95 ≤800 ms; error <1 % |
| REN-02 | 15 usuarios en login | Eficiencia de desempeño | JMeter | JM-REN-02 | p95 ≤1.5 s; error <1 % |
| REN-03 | 10 usuarios creando pedidos | Eficiencia de desempeño | JMeter | JM-REN-03 | p95 ≤2 s |
| REN-04 | Selenium detecta contenido principal en ≤3 s | Eficiencia de desempeño | Selenium | SEL-REN-04 | ≤3 s |
| REN-05 | Listados paginados nunca devuelven >50 registros | Eficiencia de desempeño | JMeter | JM-REN-05 | ≤50 elementos |

## 3.3 Usabilidad / Capacidad de interacción

> USA-01 y USA-02 se reformulan de métricas humanas a métricas técnicas reproducibles.

| RNF | Redacción automatizable propuesta | ISO/IEC 25010 | Herramienta | Caso | Métrica / umbral |
|---|---|---|---|---|---|
| USA-01 | Registro→catálogo→carrito→checkout completa ≥9 de 10 ejecuciones | Capacidad de interacción | Selenium | SEL-USA-01 | ≥90 % PASS |
| USA-02 | Localizar producto→detalle→carrito completa en ≤60 s | Capacidad de interacción | Selenium | SEL-USA-02 | ≤60 s |
| USA-03 | Formularios críticos muestran validación identificable | Capacidad de interacción | Selenium | SEL-USA-03 | 100 % |
| USA-04 | Páginas críticas funcionan a 360/768/1366 px | Capacidad de interacción | Selenium | SEL-USA-04 | 3/3 |
| USA-05 | Controles críticos son navegables por teclado y muestran foco detectable | Accesibilidad | Selenium | SEL-USA-05 | 100 % críticos |

## 3.4 Fiabilidad / Disponibilidad

| RNF | Redacción automatizable propuesta | ISO/IEC 25010 | Herramienta | Caso | Métrica / umbral |
|---|---|---|---|---|---|
| DIS-01 | 5 min de carga sostenida conservan ≥99 % de solicitudes válidas | Fiabilidad / Disponibilidad | JMeter | JM-DIS-01 | disponibilidad observada ≥99 % |
| DIS-02 | Workflow de recuperación verifica /health en ≤30 s | Fiabilidad / Recuperabilidad | GitHub Actions | CI-DIS-02 | ≤30 s |
| DIS-03 | /health y /ready responden correctamente bajo carga | Fiabilidad / Disponibilidad | JMeter | JM-DIS-03 | 100 % esperadas |
| DIS-04 | Workflow ejecuta renovación TLS dry-run con éxito | Fiabilidad / Operabilidad | GitHub Actions | CI-DIS-04 | exit code 0 |

## 3.5 Flexibilidad / Escalabilidad

| RNF | Redacción automatizable propuesta | ISO/IEC 25010 | Herramienta | Caso | Métrica / umbral |
|---|---|---|---|---|---|
| ESC-01 | Escalar 5→25 usuarios sin error ≥1 % ni p95 >3× | Flexibilidad / Escalabilidad | JMeter | JM-ESC-01 | error <1 %; p95 ≤3× |
| ESC-02 | Dataset de al menos 100 productos/pedidos; consultas paginadas bajo la carga definida | Flexibilidad / Escalabilidad | JMeter | JM-ESC-02 | p95 ≤2 s |
| ESC-03 | CI falla ante dependencias locales persistentes prohibidas | Flexibilidad | GitHub Actions | CI-ESC-03 | 0 dependencias prohibidas |
| ESC-04 | Dos configuraciones de entorno ejecutan sin cambiar código | Flexibilidad / Configurabilidad | GitHub Actions | CI-ESC-04 | 2/2 PASS |

## 3.6 Mantenibilidad

> MAN-05 cambia de Maintainability Index a una métrica directamente automatizable con SonarQube.

| RNF | Redacción automatizable propuesta | ISO/IEC 25010 | Herramienta | Caso | Métrica / umbral |
|---|---|---|---|---|---|
| MAN-01 | Quality Gate sin bugs/vulnerabilidades nuevas altas/bloqueantes | Mantenibilidad | SonarQube | SQ-MAN-01 | Gate PASS |
| MAN-02 | Cobertura global ≥70 %, backend ≥80 %, módulos críticos ≥70 % | Mantenibilidad / Testeabilidad | SonarQube | SQ-MAN-02 | 70/80/70 % |
| MAN-03 | Duplicación nueva ≤3 % | Mantenibilidad | SonarQube | SQ-MAN-03 | ≤3 % |
| MAN-04 | La complejidad ciclomática y cognitiva debe ser medida por SonarQube y no existir incidencias activas de mantenibilidad relacionadas con complejidad excesiva | Mantenibilidad / Analizabilidad | SonarQube | SQ-MAN-04 | 0 incidencias activas de complejidad |
| MAN-05 | Maintainability Rating del código nuevo = A | Mantenibilidad | SonarQube | SQ-MAN-05 | A |
| MAN-06 | Deuda técnica nueva ≤5 % y rating A | Mantenibilidad | SonarQube | SQ-MAN-06 | ≤5 % / A |
| MAN-07 | npm ci + lint + tests + build reproducibles en runner limpio | Mantenibilidad | GitHub Actions | CI-MAN-07 | 100 % jobs PASS |

## 3.7 Flexibilidad / Portabilidad

| RNF | Redacción automatizable propuesta | ISO/IEC 25010 | Herramienta | Caso | Métrica / umbral |
|---|---|---|---|---|---|
| POR-01 | Runner limpio instala, migra y compila sin intervención | Flexibilidad / Portabilidad | GitHub Actions | CI-POR-01 | PASS |
| POR-02 | Mismo commit supera pipeline con dos configuraciones por variables | Flexibilidad / Portabilidad | GitHub Actions | CI-POR-02 | 2/2 PASS |
| POR-03 | Build estático + rutas profundas verificadas tras despliegue | Flexibilidad / Portabilidad | GitHub Actions + Selenium | SEL-POR-03 + CI-POR-03 | PASS |
| POR-04 | Base MySQL vacía se inicializa solo con migraciones Prisma | Flexibilidad / Portabilidad | GitHub Actions | CI-POR-04 | PASS |

## 3.8 Fiabilidad

| RNF | Redacción automatizable propuesta | ISO/IEC 25010 | Herramienta | Caso | Métrica / umbral |
|---|---|---|---|---|---|
| CON-01 | 10 solicitudes con misma Idempotency-Key generan 1 pedido | Fiabilidad | JMeter | JM-CON-01 | exactamente 1 |
| CON-02 | Compras concurrentes nunca producen stock negativo | Fiabilidad | JMeter | JM-CON-02 | stock ≥0 |
| CON-03 | Fallos simulados no dejan estado parcialmente persistido | Fiabilidad | JMeter + GitHub Actions | JM-CON-03 + CI-CON-03 | 0 inconsistencias |
| CON-04 | Webhooks duplicados/desordenados no duplican operaciones | Fiabilidad | JMeter | JM-CON-04 | 0 duplicados |
| CON-05 | Payload manipulado no altera total calculado por servidor | Fiabilidad / Integridad | JMeter | JM-CON-05 | 0 manipulaciones aceptadas |

**Cobertura propuesta RNF: 42/42 con herramienta automatizable.**

---

# 4. Resumen RNF → herramienta

| Herramienta | RNF principales |
|---|---|
| Selenium | SEG-02, SEG-03, SEG-04, SEG-07, SEG-08, REN-04, USA-01, USA-02, USA-03, USA-04, USA-05, POR-03 |
| JMeter | SEG-06, REN-01, REN-02, REN-03, REN-05, DIS-01, DIS-03, ESC-01, ESC-02, CON-01, CON-02, CON-03, CON-04, CON-05 |
| SonarQube | SEG-01, SEG-05, MAN-01, MAN-02, MAN-03, MAN-04, MAN-05, MAN-06 |
| GitHub Actions | SEG-01, SEG-05, SEG-08, DIS-02, DIS-04, ESC-03, ESC-04, MAN-07, POR-01, POR-02, POR-03, POR-04, CON-03 |

---

# 5. Pruebas Fase 5 que se conservan

La nueva trazabilidad **no elimina** las pruebas exigidas en Fase 5.

| Nivel | Cantidad | Estado |
|---|---:|---|
| Unitarias backend | 107 | Conservadas |
| Vitest frontend | 20 | Conservadas |
| Integración | 61 | Conservadas |
| Sistema | 48 | **48/48 verificadas** |
| Aceptación | 32 | Conservadas |

Las unitarias e integración siguen siendo necesarias para validar reglas internas y servicios aunque cada RF tenga una validación E2E.

---

# 6. Nueva política de pruebas de sistema

- Existen 48 pruebas de sistema.
- Las 48 están verificadas correctamente.
- No es obligatorio que exista una relación 1:1 entre las 48 y Selenium.
- Sin embargo, para esta nueva estrategia se deberá crear al menos **un caso Selenium por cada RF**.
- Un caso Selenium puede trazar además uno o más ST-E2E existentes.

Objetivo:

`32 RF → 32 casos SEL-RF-* → 32 PASS`

---

# 7. Nueva política de aceptación

Se propone una **aceptación técnica automatizada**:

`RF → SEL-RF-* → resultado esperado → PASS → AT asociada técnicamente aceptada`

> Si el docente exige explícitamente aceptación por usuarios reales, esta automatización será evidencia complementaria y no sustituta. Codex no debe eliminar una validación humana exigida por la consigna sin autorización.

---

# 8. GitHub Actions como cuarta pieza

## 8.1 Workflow principal

```text
push / pull_request
        ↓
checkout
        ↓
Node 22
        ↓
npm ci
        ↓
lint
        ↓
unitarias backend
        ↓
Vitest frontend
        ↓
MySQL CI
        ↓
Prisma migrate
        ↓
integración
        ↓
build
        ↓
LCOV
        ↓
SonarQube
        ↓
Quality Gate
        ↓
levantar aplicación de prueba
        ↓
Selenium
        ↓
JUnit / HTML / screenshots / LCOV
        ↓
artifacts
```

## 8.2 Workflow JMeter

```text
workflow_dispatch / schedule
        ↓
preparar entorno y dataset
        ↓
JMeter
        ↓
p95 / throughput / error %
        ↓
comprobaciones de integridad
        ↓
HTML / JTL
        ↓
artifacts
```

JMeter de carga no debe ejecutarse destructivamente contra producción en cada push.

---

# 9. Formato final de resultado

Cada RF/RNF debe terminar con estas columnas:

| Campo | Descripción |
|---|---|
| ID | RF-xx / RNF-xxx-xx |
| Tipo | RF / RNF |
| Atributo ISO 25010 | Solo RNF |
| Herramienta | Selenium / JMeter / SonarQube / GitHub Actions |
| Caso | SEL-* / JM-* / SQ-* / CI-* |
| Métrica | Valor objetivo medible |
| Umbral | Criterio de aceptación |
| Resultado | Valor realmente obtenido |
| Estado | PASS / FAIL |
| Evidencia | reporte, screenshot, JTL, Sonar, workflow |
| Commit | SHA |
| Entorno | CI / staging / demo |
| Fecha | fecha de ejecución |

---

# 10. Criterio de cierre RF

Para `RF = CUMPLE`:

1. Tiene caso Selenium asociado.
2. Fue ejecutado.
3. Resultado esperado confirmado.
4. Prueba de aceptación asociada.
5. Sin defecto crítico abierto.
6. Evidencia automática archivada.

Objetivo:

```text
RF total: 32
PASS:     32
FAIL:      0
```

---

# 11. Criterio de cierre RNF

Para `RNF = CUMPLE`:

1. Tiene atributo ISO/IEC 25010 definido.
2. Tiene herramienta asignada.
3. Tiene caso automatizado.
4. Tiene métrica objetiva.
5. Tiene umbral.
6. Fue ejecutado realmente.
7. Resultado cumple umbral.
8. Evidencia queda archivada.

Objetivo:

```text
RNF total:     42
PASS:          42
FAIL:           0
PARCIAL:        0
PENDIENTE:      0
```

---

# 12. Principales RNF reformulados

Para hacer posible la automatización se propone revisar especialmente:

- SEG-01
- SEG-05
- SEG-07
- SEG-08
- REN-04
- REN-05
- USA-01
- USA-02
- USA-05
- DIS-01
- DIS-02
- DIS-04
- ESC-03
- ESC-04
- MAN-05
- POR-01
- CON-03
- CON-05

Cambio conceptual:

```text
ANTES
RNF → evidencia manual / técnica / observación

PROPUESTA
RNF → ISO 25010 → herramienta → caso → métrica → umbral → PASS/FAIL
```

---

# 13. Reglas obligatorias para Codex

1. Mantener `RF-01` a `RF-32`.
2. Mantener 42 RNF.
3. Tomar las redacciones de este documento como **propuesta de automatización**, no reemplazarlas silenciosamente en documentación oficial sin registrar el cambio.
4. No eliminar las pruebas de Fase 5 existentes.
5. Considerar 48/48 pruebas de sistema verificadas.
6. Crear un caso Selenium `SEL-RF-*` por cada RF.
7. Crear los `SEL-*` de RNF aquí definidos.
8. Crear los `JM-*` aquí definidos.
9. Configurar métricas Sonar para los `SQ-*`.
10. Crear workflows/scripts para los `CI-*`.
11. Cada caso debe incluir requisito, métrica, umbral, resultado y evidencia.
12. `PASS` solo puede asignarse tras ejecución real.
13. En fallos Selenium guardar screenshot y reporte JUnit/HTML.
14. JMeter debe generar JTL/HTML.
15. SonarQube debe importar LCOV.
16. GitHub Actions debe guardar artifacts.
17. JMeter de carga debe ejecutarse mediante `workflow_dispatch` o `schedule` en entorno controlado.
18. Usar IDs estables: `SEL-*`, `JM-*`, `SQ-*`, `CI-*`.
19. Objetivo final: 32/32 RF PASS y 42/42 RNF PASS.
20. **Si automatizar un requisito cambia significativamente su propósito, marcar `REQUIERE_REVISION` y no modificarlo silenciosamente.**

---

# 14. Estructura canónica adoptada

```text
tests/results/
├── fase5/
│   ├── unitarias/reports/
│   ├── integracion/reports/
│   ├── sistema/casos/
│   ├── sistema/reports/
│   ├── aceptacion/casos/
│   ├── aceptacion/reports/
│   └── report/trazabilidad-fase5.csv
├── fase6/
│   ├── selenium/tests/{rf,rnf,support}/
│   ├── selenium/reports/
│   └── jmeter/{plans,results,reports}/
├── fase7/sonarqube/{results,evidence}/
├── fase8/github_actions/workflows/
└── trazabilidad/
    ├── trazabilidad_maestra_automatizable.md
    ├── resultados_rf.md
    ├── resultados_rnf.md
    └── matriz_final.csv
```

La Fase 8 conservará aquí su documentación y evidencia. Los YAML ejecutables
de GitHub Actions deberán ubicarse además en `.github/workflows/`, que es la
ruta reconocida por GitHub.

---

# 15. Trazabilidad final

```text
RF
 ↓
Selenium
 ↓
SEL-RF-*
 ↓
PASS/FAIL
 ↓
Evidencia


RNF
 ↓
ISO/IEC 25010
 ↓
Selenium / JMeter / SonarQube / GitHub Actions
 ↓
SEL-* / JM-* / SQ-* / CI-*
 ↓
Métrica
 ↓
Umbral
 ↓
PASS/FAIL
 ↓
Evidencia
```

## Objetivo final

```text
32 RF
→ 32 automatizados
→ 32 PASS

42 RNF
→ 42 trazados a ISO/IEC 25010
→ 42 con mecanismo automatizado
→ 42 PASS
```

Este documento debe utilizarse como la **nueva propuesta de trazabilidad automatizable** de El Poblano para orientar a Codex y la implementación de las Fases 6, 7 y 8.
