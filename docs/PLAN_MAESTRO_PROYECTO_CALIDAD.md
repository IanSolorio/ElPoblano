# Plan maestro del Proyecto Integrador de Calidad Aplicada al Software

| Campo | Valor |
|---|---|
| Sistema evaluado | Plataforma web El Poblano |
| Naturaleza | Proyecto académico de comercio electrónico |
| Documento fuente | `Proyecto_Integrador_Final.pdf` |
| Versión del plan | 1.0 |
| Fecha | 9 de agosto de 2026 |
| Norma de referencia complementaria | ISO/IEC 25010:2023 |

## 1. Interpretación de la consigna

El objetivo indicado por la guía es efectuar una auditoría integral de un sistema web mediante métricas, pruebas y análisis estático/dinámico, identificar deuda técnica y proponer mejoras sustentadas.

Las fases no son entregables aislados. Forman una cadena de trazabilidad:

```text
F1 Sistema y alcance
 ↓
F2 Atributos de calidad
 ↓
F3 Requisitos no funcionales medibles
 ↓
F4 Métricas, fórmulas, línea base y umbrales
 ↓
F5 Pruebas que producen evidencias
 ↓
F6 Selenium y JMeter automatizan evidencia funcional y de rendimiento
 ↓
F7 SonarQube produce evidencia estática, cobertura y deuda
 ↓
F8 GitHub Actions repite build, pruebas, análisis y reportes
 ↓
F10 Plan de mejora basado en resultados
```

La guía entregada contiene Fases 1–8 y luego Fase 10. No define una Fase 9. Este plan conserva esa numeración y registra la ausencia para confirmarla con el docente; no se inventa un entregable no solicitado.

## 2. Alcance auditado

- Frontend React/Vite desplegado en Vercel.
- API Node.js/Express desplegada en AWS EC2 detrás de Nginx y HTTPS.
- MySQL en AWS RDS privado y Prisma ORM.
- Firebase Storage para imágenes.
- Mercado Pago en modo prueba.
- Roles `CUSTOMER`, `ADMIN` y `SUPER_ADMIN`.
- Catálogo, categorías, stock, promociones, combos, carrito, cuentas, direcciones, pedidos, pagos, seguimiento, auditoría y estadísticas.

Quedan fuera del alcance actual: pagos reales, aplicación independiente de repartidores, seguimiento GPS en vivo, alta disponibilidad multiinstancia y recuperación ante desastres completamente automatizada.

## 3. Fase 1 — Comprensión del sistema

### Objetivo

Establecer qué se audita y evitar conclusiones sobre componentes inexistentes.

### Actividades y evidencias

| Actividad | Evidencia |
|---|---|
| Documentar arquitectura | Diagrama Vercel → Nginx/EC2 → RDS y servicios externos |
| Identificar tecnologías | Inventario con versiones, finalidad y entorno |
| Modelar actores | Visitante, cliente, administrador, superadministrador y proveedores externos |
| Documentar casos de uso | Catálogo, registro, compra, pago, gestión y seguimiento |
| Inventariar módulos | Frontend y backend por capacidad de negocio |
| Catalogar funcionalidades | Matriz RF-01 a RF-32 |

Documento base: [`DOCUMENTACION_TECNICA_Y_DESPLIEGUE.md`](./DOCUMENTACION_TECNICA_Y_DESPLIEGUE.md).

## 4. Fase 2 — Mapeo de atributos de calidad

| Atributo solicitado | Aplicación en El Poblano | Riesgo principal | Evidencia prevista |
|---|---|---|---|
| Disponibilidad | Frontend, API, Nginx, EC2 y RDS accesibles | Caída de proceso, instancia o base | Health/ready, uptime y prueba de reinicio |
| Seguridad | Sesiones, roles, datos personales, pagos e imágenes | Acceso indebido o exposición de secretos | Pruebas RBAC, SonarQube, headers y auditoría |
| Rendimiento | Catálogo, login, pedidos y panel | Latencia bajo concurrencia | JMeter: p95, throughput y errores |
| Escalabilidad | Crecimiento de usuarios, productos y pedidos | Saturación de EC2/RDS y consultas | Pruebas escalonadas, paginación y uso de recursos |
| Mantenibilidad | Monorepo y Clean Architecture modular | Complejidad, duplicación y deuda | SonarQube, cobertura, complejidad y deuda |
| Usabilidad | Compra, registro, mapa y administración | Abandono y errores humanos | Selenium, aceptación, accesibilidad y tiempos de tarea |
| Portabilidad | Configuración local/producción y proveedores | Acoplamiento al entorno | Build limpio, variables y despliegue reproducible |
| Confiabilidad | Pedidos, pagos, stock y auditoría | Duplicados o datos inconsistentes | Transacciones, idempotencia y concurrencia |

## 5. Fase 3 — Requisitos no funcionales

Todos los RNF usan la forma: condición, comportamiento, medida y umbral. Los umbrales son objetivos académicos iniciales; la Fase 4 debe obtener la línea base y justificar cualquier ajuste.

### 5.1 Seguridad

| ID | Requisito no funcional medible | Evidencia |
|---|---|---|
| RNF-SEG-01 | El 100 % de contraseñas deberá almacenarse con Argon2 y ninguna respuesta o log deberá exponer el hash | Inspección DB, integración, Sonar |
| RNF-SEG-02 | El 100 % de endpoints privados deberá responder 401 sin sesión válida y el 100 % de endpoints por rol responder 403 a roles insuficientes | Matriz API/RBAC |
| RNF-SEG-03 | En producción, la cookie de sesión deberá incluir `HttpOnly`, `Secure`, `SameSite=Lax` y alcance `/` | Integración HTTP/Selenium |
| RNF-SEG-04 | Una sesión cerrada, expirada o revocada deberá dejar de ser aceptada en la siguiente solicitud | Integración/Selenium |
| RNF-SEG-05 | Ningún secreto deberá encontrarse en Git, bundle Vite, respuesta HTTP o log de aplicación | Escaneo de secretos y revisión de artefactos |
| RNF-SEG-06 | La API deberá limitar cada cliente a 120 solicitudes por minuto y responder 429 al excederlo | Integración/JMeter controlado |
| RNF-SEG-07 | El 100 % de acciones administrativas críticas deberá registrar actor, acción, entidad y fecha | Consulta de auditoría |
| RNF-SEG-08 | Todo tráfico público de producción deberá usar HTTPS válido, sin contenido mixto | Inspección TLS/navegador |

### 5.2 Rendimiento

| ID | Requisito no funcional medible | Evidencia |
|---|---|---|
| RNF-REN-01 | Con 25 usuarios concurrentes, el p95 de `GET /productos` deberá ser ≤ 800 ms y la tasa de error < 1 % | JMeter |
| RNF-REN-02 | Con 15 usuarios concurrentes, el p95 de login deberá ser ≤ 1.5 s y la tasa de error funcional < 1 % | JMeter |
| RNF-REN-03 | Con 10 usuarios concurrentes, el p95 de creación de pedido deberá ser ≤ 2 s, excluyendo el tiempo externo de pago | JMeter |
| RNF-REN-04 | La página pública deberá mostrar contenido útil en ≤ 3 s bajo conexión de referencia y sin errores de recursos críticos | Lighthouse/Selenium |
| RNF-REN-05 | Las listas crecientes deberán estar paginadas con máximo 50 elementos por respuesta | Integración e inspección API |

### 5.3 Usabilidad

| ID | Requisito no funcional medible | Evidencia |
|---|---|---|
| RNF-USA-01 | Al menos 90 % de participantes deberá completar registro, carrito y llegada al pago sin ayuda | Prueba de aceptación con usuarios |
| RNF-USA-02 | El tiempo mediano para localizar un producto y agregarlo al carrito deberá ser ≤ 60 s | Observación/cronometraje |
| RNF-USA-03 | Todo error de formulario deberá indicar el campo o acción afectada y una forma comprensible de corregirlo | Checklist/Selenium |
| RNF-USA-04 | Las páginas críticas deberán operar a 360 px, 768 px y 1366 px sin pérdida de controles ni desplazamiento horizontal accidental | Selenium responsive |
| RNF-USA-05 | El flujo crítico deberá ser operable por teclado, con foco visible y nombre accesible en controles interactivos | axe/Lighthouse/revisión |

### 5.4 Disponibilidad

| ID | Requisito no funcional medible | Evidencia |
|---|---|---|
| RNF-DIS-01 | Durante la ventana de demostración, API y frontend deberán alcanzar ≥ 99 % de disponibilidad medida cada minuto | Monitor/health logs |
| RNF-DIS-02 | Ante una salida inesperada de Node, `systemd` deberá reiniciarlo y recuperar `/api/health` en ≤ 30 s | Prueba operativa |
| RNF-DIS-03 | `/api/health` deberá informar proceso vivo y `/api/ready` distinguir conexión disponible/no disponible con MySQL | Integración/operación |
| RNF-DIS-04 | El certificado HTTPS deberá renovarse automáticamente y la prueba de renovación deberá terminar sin error | Certbot dry-run |

### 5.5 Escalabilidad

| ID | Requisito no funcional medible | Evidencia |
|---|---|---|
| RNF-ESC-01 | Al aumentar de 5 a 25 usuarios concurrentes, la API deberá mantener errores < 1 % y no degradar el p95 más de 3 veces | JMeter escalonado |
| RNF-ESC-02 | Con 10 000 productos/pedidos de prueba, las consultas paginadas deberán conservar p95 ≤ 2 s | JMeter + dataset grande |
| RNF-ESC-03 | Los procesos web no deberán depender de archivos locales persistentes; imágenes y datos deberán residir en servicios externos configurados | Inspección arquitectónica |
| RNF-ESC-04 | La configuración deberá permitir cambiar host de API, base y proveedores sin modificar reglas de dominio | Prueba de configuración |

### 5.6 Mantenibilidad

| ID | Requisito no funcional medible | Evidencia |
|---|---|---|
| RNF-MAN-01 | El código nuevo deberá superar el Quality Gate sin bugs o vulnerabilidades nuevos de severidad alta/bloqueante | SonarQube |
| RNF-MAN-02 | La cobertura global deberá ser ≥ 70 %, la del backend ≥ 80 % y ningún módulo crítico deberá quedar por debajo de 70 % | LCOV/SonarQube |
| RNF-MAN-03 | La duplicación en código nuevo deberá ser ≤ 3 % | SonarQube |
| RNF-MAN-04 | Ninguna función nueva deberá superar complejidad ciclomática 10 sin justificación/refactorización | SonarQube |
| RNF-MAN-05 | El Maintainability Index promedio deberá ser ≥ 65/100 y ningún módulo crítico < 50/100 | Herramienta MI + reporte |
| RNF-MAN-06 | La deuda técnica nueva deberá ser ≤ 5 % del tiempo estimado de desarrollo y tener rating A en código nuevo | SonarQube |
| RNF-MAN-07 | `npm ci`, lint, pruebas y build deberán ser reproducibles desde un clon limpio y finalizar sin errores | GitHub Actions |

### 5.7 Portabilidad

| ID | Requisito no funcional medible | Evidencia |
|---|---|---|
| RNF-POR-01 | El proyecto deberá ejecutarse en un entorno limpio con Node 22, npm y MySQL siguiendo solo la documentación | Ensayo de instalación |
| RNF-POR-02 | Desarrollo y producción deberán usar el mismo código y diferenciarse únicamente mediante variables de entorno y servicios configurados | Revisión y pipeline |
| RNF-POR-03 | El frontend deberá compilar como artefacto estático desplegable en Vercel sin rutas rotas al recargar | Build/Selenium |
| RNF-POR-04 | Las migraciones Prisma deberán crear o actualizar una base vacía sin cambios manuales de tablas | Integración/CI |

### 5.8 Confiabilidad

| ID | Requisito no funcional medible | Evidencia |
|---|---|---|
| RNF-CON-01 | Repetir una solicitud de pedido con la misma clave idempotente deberá producir exactamente un pedido y un descuento de stock | Integración/concurrencia |
| RNF-CON-02 | Bajo compras concurrentes, el stock nunca deberá ser negativo ni vender más unidades de las disponibles | Integración/JMeter específico |
| RNF-CON-03 | Pedido, items, pago inicial, stock, movimiento y auditoría deberán confirmarse completamente o revertirse completamente | Prueba transaccional |
| RNF-CON-04 | Un webhook repetido o fuera de orden no deberá duplicar cobros, devoluciones o movimientos de inventario | Integración proveedor |
| RNF-CON-05 | El 100 % de cálculos de total deberá usar precios del servidor y conservar precisión monetaria de dos decimales | Unitarias/integración |

Total: 42 RNF medibles, por encima del mínimo de 20 solicitado.

## 6. Fase 4 — Métricas de calidad

### 6.1 Catálogo y fórmulas

| Métrica solicitada | Fórmula/criterio | Fuente | Periodicidad |
|---|---|---|---|
| Defectos encontrados | Conteo de incidencias confirmadas | Registro de defectos/GitHub Issues | Por ejecución y versión |
| Defectos críticos | Defectos severidad crítica o P0 abiertos | Registro de defectos | Por versión |
| Defectos corregidos | Incidencias cerradas y verificadas | Issues + re-test | Por versión |
| Tasa de corrección | Corregidos / encontrados × 100 | Issues | Por versión |
| Densidad de defectos | Defectos confirmados / KLOC | Issues + analizador | Por versión |
| Cobertura de líneas | Líneas ejecutadas / instrumentadas × 100 | LCOV | Cada pipeline |
| Cobertura de ramas | Ramas ejecutadas / totales × 100 | LCOV | Cada pipeline |
| Complejidad ciclomática | Caminos independientes por función/módulo | SonarQube | Cada pipeline |
| Duplicidad | Líneas duplicadas / líneas analizadas × 100 | SonarQube | Cada pipeline |
| Maintainability Index | Índice 0–100 calculado por volumen, complejidad y LOC | Herramienta MI | Cada versión |
| Productividad | Casos/historias terminadas y verificadas / horas-persona del periodo | Registro del equipo | Semanal/por iteración |
| Bugs/vulnerabilidades/smells | Conteo y severidad | SonarQube | Cada pipeline |
| Deuda técnica | Tiempo estimado de remediación y ratio | SonarQube | Cada pipeline |
| Latencia | mediana, p90, p95 y máximo | JMeter | Por escenario |
| Throughput | Solicitudes completadas por segundo | JMeter | Por escenario |
| Tasa de error | Solicitudes fallidas / total × 100 | JMeter | Por escenario |
| Disponibilidad | Comprobaciones correctas / totales × 100 | Monitor health | Semanal/demostración |
| Éxito de tareas | Usuarios que completan / participantes × 100 | Aceptación | Por ronda |

### 6.2 Línea base y comparación

Para cada métrica se conservarán tres valores: `línea base`, `objetivo` y `resultado posterior a mejoras`. No deben inventarse resultados antes de ejecutar las herramientas.

| Métrica | Línea base | Objetivo | Resultado final |
|---|---:|---:|---:|
| Cobertura global | Pendiente | ≥ 70 % | Pendiente |
| Cobertura backend | Pendiente | ≥ 80 % | Pendiente |
| Bugs críticos | Pendiente | 0 | Pendiente |
| Vulnerabilidades altas/bloqueantes nuevas | Pendiente | 0 | Pendiente |
| Duplicación nueva | Pendiente | ≤ 3 % | Pendiente |
| Complejidad por función | Pendiente | ≤ 10 | Pendiente |
| Maintainability Index promedio | Pendiente | ≥ 65 | Pendiente |
| Deuda técnica nueva | Pendiente | ≤ 5 % | Pendiente |
| Error JMeter | Pendiente | < 1 % | Pendiente |
| p95 catálogo | Pendiente | ≤ 800 ms | Pendiente |

## 7. Fase 5 — Pruebas

El diseño detallado se encuentra en [`PLAN_MAESTRO_PRUEBAS_FASE_5.md`](./PLAN_MAESTRO_PRUEBAS_FASE_5.md): 104 pruebas unitarias, 59 de integración, 46 de sistema y 30 de aceptación.

La matriz funcional se complementa con los RNF anteriores. Cada RNF debe tener al menos una prueba o medición asociada; por tanto, la Fase 5 no se limita a RF-01–RF-32.

### Criterios de salida

- Todos los P0 ejecutados y aprobados.
- Todos los RF y RNF trazados a evidencia.
- Sin defectos críticos abiertos.
- Reportes unitarios, integración, sistema y aceptación archivados.
- Cobertura generada en formato LCOV y resultados en formato JUnit cuando aplique.

## 8. Fase 6 — Automatización

### 8.1 Selenium

Automatizar como mínimo:

1. Navegación y catálogo público.
2. Registro con dirección y validaciones.
3. Login, persistencia, logout y sesión expirada.
4. Carrito con productos y combos.
5. Restricción de checkout sin autenticación.
6. Compra con pago de prueba aprobado y rechazado.
7. Pedidos actuales e historial.
8. Acceso por roles.
9. CRUD de producto e imagen.
10. Promoción individual y combo.
11. Cola y secuencia operativa de pedidos.
12. Usuarios, administradores y categorías.
13. Estadísticas.
14. Carrusel, rutas profundas y resoluciones responsive.

Los scripts usarán Page Objects, selectores estables `data-testid`, datos independientes, capturas al fallar y reporte JUnit/HTML. No deberán depender del orden entre pruebas.

### 8.2 JMeter

Escenarios:

| ID | Escenario | Perfil inicial | Métricas |
|---|---|---|---|
| JM-01 | Catálogo y promociones públicas | 5→25 usuarios, 5 min | p95, throughput, error |
| JM-02 | Login | 15 usuarios, cuentas distintas | p95, error, 429 |
| JM-03 | Consulta de pedidos propios | 15 usuarios autenticados | p95, throughput |
| JM-04 | Cola y estadísticas admin | 5 administradores simulados | p95, consultas DB |
| JM-05 | Creación concurrente de pedidos | 10 usuarios, stock controlado | latencia, error e integridad |
| JM-06 | Escalabilidad con dataset grande | 10 000 registros, 5→25 usuarios | degradación relativa |
| JM-07 | Prueba corta de estabilidad | carga moderada 20–30 min | error, memoria y latencia |

No se realizará una prueba destructiva contra producción. Se usará ambiente aislado, datos ficticios y límites graduales.

## 9. Fase 7 — SonarQube

### Configuración prevista

- Analizar `apps/backend/src` y `apps/frontend/src`.
- Excluir `node_modules`, `dist`, migraciones generadas y artefactos.
- Importar `coverage/lcov.info`.
- Aplicar Quality Gate especialmente sobre código nuevo.

### Resultados que se archivarán

| Dimensión | Evidencia |
|---|---|
| Bugs | Cantidad, severidad, archivo, regla y resolución |
| Vulnerabilidades | Cantidad, severidad y tratamiento |
| Security Hotspots | Revisión manual y decisión documentada |
| Code Smells | Cantidad, severidad y refactorización |
| Cobertura | Global, frontend, backend y módulos críticos |
| Complejidad | Funciones/módulos sobre el umbral |
| Duplicación | Porcentaje global y en código nuevo |
| Deuda técnica | Tiempo, ratio y rating de mantenibilidad |

Quality Gate propuesto: cero bugs/vulnerabilidades nuevas altas o bloqueantes, cobertura nueva ≥ 80 %, duplicación nueva ≤ 3 %, rating de mantenibilidad A y hotspots revisados.

## 10. Fase 8 — CI/CD con GitHub Actions

```text
Pull request / push
  ├─ instalación reproducible (`npm ci`)
  ├─ lint
  ├─ build frontend
  ├─ pruebas unitarias + integración
  ├─ cobertura LCOV + JUnit
  ├─ análisis y Quality Gate SonarQube
  └─ publicación de reportes/artefactos

Programado o manual
  ├─ Selenium E2E
  └─ JMeter (nunca carga destructiva en cada push)

main aprobado
  └─ despliegue, verificación health/ready y registro de versión
```

Los secretos de Sonar, base de pruebas, Firebase, Mercado Pago y despliegue residirán en GitHub Secrets/Environments. Los pull requests provenientes de forks no ejecutarán pasos que requieran secretos. Los reportes se conservarán como artifacts aun cuando una prueba falle.

## 11. Fase 10 — Plan de mejora

Las propuestas deben originarse en evidencia de Fases 4–8 y contener:

| Campo | Descripción |
|---|---|
| Hallazgo | Defecto, métrica fuera de umbral o riesgo |
| Evidencia | Sonar, JMeter, Selenium, cobertura, logs o aceptación |
| Severidad | Crítica, alta, media o baja |
| Causa raíz | Razón técnica/organizacional comprobable |
| Acción | Corrección, refactorización, prueba o mejora arquitectónica |
| Esfuerzo | Horas o puntos estimados |
| Responsable | Integrante asignado |
| Prioridad/plazo | Orden y fecha objetivo |
| Verificación | Métrica o prueba que demostrará la mejora |

Se compararán línea base y resultado posterior para demostrar reducción de defectos, complejidad, duplicación y deuda técnica.

## 12. Matriz de trazabilidad integral

| Origen | Especificación | Evidencia | Automatización | Reporte |
|---|---|---|---|---|
| RF-01–RF-32 | Funcionalidades | UT/IT/ST/AT | Node test + Selenium | JUnit/HTML |
| RNF-SEG | Seguridad | RBAC, sesión, headers, Sonar | Integración + Sonar | JUnit/Sonar |
| RNF-REN/ESC | Rendimiento/escalabilidad | p95, throughput, error | JMeter | HTML/JTL |
| RNF-USA | Usabilidad | tareas, responsive, accesibilidad | Selenium + evaluación humana | HTML/checklist |
| RNF-DIS | Disponibilidad | health, ready, reinicio, TLS | scripts operativos/monitor | logs |
| RNF-MAN | Mantenibilidad | cobertura, complejidad, duplicación y deuda | cobertura + Sonar | LCOV/Sonar |
| RNF-POR | Portabilidad | build/migración desde entorno limpio | GitHub Actions | logs/artifacts |
| RNF-CON | Confiabilidad | idempotencia, transacción y concurrencia | integración + JMeter específico | JUnit/JTL |

## 13. Entregables exigidos y ubicación propuesta

| Entregable de la guía | Ubicación/resultado |
|---|---|
| Documento técnico | `docs/` y versión final PDF |
| Repositorio GitHub | Código, pruebas, configuración y evidencias no secretas |
| Reporte SonarQube | Exportación/capturas y enlace del proyecto |
| Colección Postman | `tests/postman/ElPoblano.postman_collection.json` |
| Scripts Selenium | `tests/selenium/` |
| Scripts JMeter | `tests/jmeter/` |
| Pipeline GitHub Actions | `.github/workflows/quality.yml` |
| Presentación de máximo 10 | Diapositivas con problema, método, resultados y mejoras |

## 14. Cronograma de implementación recomendado

1. Aprobar atributos, 42 RNF y umbrales.
2. Obtener línea base de Fase 4.
3. Completar primero pruebas unitarias P0 y de integración crítica.
4. Configurar cobertura LCOV.
5. Automatizar recorridos prioritarios con Selenium.
6. Crear scripts JMeter y ejecutar carga gradual.
7. Configurar SonarQube y corregir el Quality Gate.
8. Integrar todo en GitHub Actions.
9. Ejecutar auditoría final y comparar métricas.
10. Elaborar plan de mejora, informe y presentación.
