import { spawn, spawnSync } from "node:child_process";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createConnection } from "node:net";
import { delimiter, dirname, join, resolve } from "node:path";
import { tmpdir } from "node:os";
import { config } from "dotenv";
import argon2 from "argon2";

const root = process.cwd();
config({ path: resolve(root, "apps/backend/.env"), quiet: true });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL no está configurada en apps/backend/.env.");
const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!/(^|_)test($|_)/i.test(databaseName)) throw new Error(`JMeter cancelado: TEST_DATABASE_URL debe usar una base de prueba (actual: ${databaseName}).`);
if (process.env.NODE_ENV === "production") throw new Error("JMeter cancelado: NODE_ENV no puede ser production.");
process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = "test";

const [{ prisma }] = await Promise.all([import("../apps/backend/src/shared/database/prisma.js")]);
const tokenHash = (token) => createHash("sha256").update(token).digest("hex");
const round = (value) => Math.round(Number(value) * 100) / 100;
const csv = (value) => `"${String(value).replaceAll('"', '""')}"`;
const nowId = () => new Date().toISOString().replace(/[:.]/g, "-");
const sleep = (milliseconds) => new Promise((done) => setTimeout(done, milliseconds));

const args = process.argv.slice(2);
const profile = args.find((arg) => arg.startsWith("--profile="))?.split("=")[1] || "formal";
if (!new Set(["formal", "smoke"]).has(profile)) throw new Error("--profile debe ser formal o smoke.");
const requestedIds = args.filter((arg) => arg.startsWith("--case=")).flatMap((arg) => arg.slice(7).split(",")).filter(Boolean);

const executableNames = process.platform === "win32" ? ["jmeter.bat"] : ["jmeter"];
const executableCandidates = [
  ...executableNames.map((name) => process.env.JMETER_HOME && resolve(process.env.JMETER_HOME, "bin", name)),
  process.env.LOCALAPPDATA && resolve(process.env.LOCALAPPDATA, "ElPoblanoTools", "apache-jmeter-5.6.3", "bin", "jmeter.bat"),
  ...String(process.env.PATH || "").split(delimiter).flatMap((part) => executableNames.map((name) => resolve(part, name))),
].filter(Boolean);
const jmeterExecutable = executableCandidates.find(existsSync);
if (!jmeterExecutable) throw new Error("JMeter no está instalado o JMETER_HOME no está configurado.");
const jmeterJar = resolve(dirname(jmeterExecutable), "ApacheJMeter.jar");
if (!existsSync(jmeterJar)) throw new Error(`Instalación JMeter incompleta: falta ${jmeterJar}.`);

const plansRoot = resolve(root, "tests/results/fase6/jmeter/plans");
const runId = nowId();
const resultsRoot = resolve(root, "tests/results/fase6/jmeter/results", runId);
const reportsRoot = resolve(root, "tests/results/fase6/jmeter/reports", runId);
mkdirSync(resultsRoot, { recursive: true });
mkdirSync(reportsRoot, { recursive: true });
const port = Number(process.env.JMETER_PHASE6_PORT || 3301);
const frontendPort = Number(process.env.JMETER_PHASE6_FRONTEND_PORT || port + 1);
const viteExecutable = resolve(root, "node_modules/vite/bin/vite.js");
let backend;
let frontend;
let passwordHash;

const resetDatabase = async () => {
  await prisma.auditLog.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.promotionProduct.deleteMany();
  await prisma.promotion.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.session.deleteMany();
  await prisma.address.deleteMany();
  await prisma.user.deleteMany();
};

const createSession = async (userId) => {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({ data: { userId, tokenHash: tokenHash(token), expiresAt: new Date(Date.now() + 86_400_000) } });
  return token;
};

const seedBase = async ({ customers = 1, admins = 0, stock = 100, price = 10 } = {}) => {
  await resetDatabase();
  passwordHash ||= await argon2.hash("Carga-segura-2026!", { type: argon2.argon2id });
  const category = await prisma.category.create({ data: { name: "Pruebas JMeter", slug: `jmeter-${randomUUID()}`, active: true } });
  const product = await prisma.product.create({ data: { categoryId: category.id, name: "[JMETER] Producto controlado", description: "Uso exclusivo de TEST_DATABASE_URL", price, stock, active: true } });
  const customerRows = [];
  for (let index = 1; index <= customers; index += 1) {
    const user = await prisma.user.create({ data: { email: `jm.customer.${index}.${runId}@test.local`, passwordHash, firstName: "JMeter", lastName: `Cliente ${index}`, phone: "999000000", role: "CUSTOMER" } });
    const address = await prisma.address.create({ data: { userId: user.id, label: "Carga", addressLine: "Av. Pruebas JMeter 123", latitude: -12.0464, longitude: -77.0428, isDefault: true } });
    customerRows.push({ user, address, token: await createSession(user.id) });
  }
  const adminRows = [];
  for (let index = 1; index <= admins; index += 1) {
    const user = await prisma.user.create({ data: { email: `jm.admin.${index}.${runId}@test.local`, passwordHash, firstName: "JMeter", lastName: `Admin ${index}`, role: "ADMIN" } });
    adminRows.push({ user, token: await createSession(user.id) });
  }
  return { category, product, customers: customerRows, admins: adminRows, password: "Carga-segura-2026!" };
};

const writeCustomerCsv = (directory, fixture) => {
  const file = resolve(directory, "customers.csv");
  const rows = ["email,password,addressId,productId,sessionToken", ...fixture.customers.map(({ user, address, token }) => [user.email, fixture.password, address.id, fixture.product.id, token].map(csv).join(","))];
  writeFileSync(file, `${rows.join("\n")}\n`, "utf8");
  return file;
};

const createSyntheticOrders = async (owner, count, prefix) => {
  for (let offset = 0; offset < count; offset += 500) {
    const size = Math.min(500, count - offset);
    await prisma.order.createMany({ data: Array.from({ length: size }, (_, item) => ({
      id: randomUUID(), userId: owner.id, idempotencyKey: `${prefix}-${offset + item + 1}`,
      status: "PENDING", customerName: `${owner.firstName} ${owner.lastName}`, customerEmail: owner.email,
      customerPhone: owner.phone || "999000000", deliveryAddress: "Dirección JMeter", subtotal: 10, deliveryFee: 0, total: 10,
      notes: `[${prefix}]`,
    })) });
  }
};

const tcpReady = (targetPort) => new Promise((resolveReady) => {
  const socket = createConnection({ host: "127.0.0.1", port: targetPort });
  socket.once("connect", () => { socket.destroy(); resolveReady(true); });
  socket.once("error", () => resolveReady(false));
});

const startBackend = async ({ injectFailure = false, enforceRateLimit = false } = {}) => {
  let stderr = "";
  backend = spawn(process.execPath, [resolve(root, "apps/backend/src/server.js")], {
    cwd: resolve(root, "apps/backend"),
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      DATABASE_URL: testDatabaseUrl,
      NODE_ENV: "test",
      PORT: String(port),
      FRONTEND_ORIGIN: `http://127.0.0.1:${frontendPort}`,
      PAYMENT_PROVIDER_MODE: "stub",
      GLOBAL_RATE_LIMIT: enforceRateLimit ? "120" : "100000",
      AUTH_RATE_LIMIT: "100000",
      JMETER_INJECT_ORDER_FAILURE: injectFailure ? "true" : "false",
    },
  });
  backend.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (backend.exitCode !== null) throw new Error(`Backend JMeter terminó antes de iniciar. ${stderr}`);
    if (await tcpReady(port)) return;
    await sleep(250);
  }
  throw new Error(`Backend JMeter no abrió el puerto ${port}. ${stderr}`);
};

const startFrontend = async () => {
  if (!existsSync(viteExecutable)) throw new Error(`No se encontró Vite en ${viteExecutable}.`);
  const frontendDirectory = resolve(root, "apps/frontend");
  const frontendEnv = { ...process.env, VITE_ENDPOINT_BASE: `http://127.0.0.1:${port}/api` };
  const build = spawnSync(process.execPath, [viteExecutable, "build"], {
    cwd: frontendDirectory,
    env: frontendEnv,
    stdio: "inherit",
  });
  if (build.status !== 0) throw new Error(`No se pudo compilar el frontend para JM-DIS-01 (exit ${build.status}).`);

  let stderr = "";
  frontend = spawn(process.execPath, [viteExecutable, "preview", "--host", "127.0.0.1", "--port", String(frontendPort), "--strictPort"], {
    cwd: frontendDirectory,
    env: frontendEnv,
    stdio: ["ignore", "pipe", "pipe"],
  });
  frontend.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (frontend.exitCode !== null) throw new Error(`Frontend JMeter terminó antes de iniciar. ${stderr}`);
    if (await tcpReady(frontendPort)) return;
    await sleep(250);
  }
  throw new Error(`Frontend JMeter no abrió el puerto ${frontendPort}. ${stderr}`);
};

const stopFrontend = async () => {
  if (!frontend || frontend.exitCode !== null) { frontend = undefined; return; }
  frontend.kill("SIGTERM");
  for (let attempt = 0; attempt < 40 && frontend.exitCode === null; attempt += 1) await sleep(100);
  if (frontend.exitCode === null) frontend.kill("SIGKILL");
  frontend = undefined;
};

const stopBackend = async () => {
  if (!backend || backend.exitCode !== null) { backend = undefined; return; }
  backend.kill("SIGTERM");
  for (let attempt = 0; attempt < 40 && backend.exitCode === null; attempt += 1) await sleep(100);
  if (backend.exitCode === null) backend.kill("SIGKILL");
  backend = undefined;
};

const statisticsFor = (reportDirectory) => JSON.parse(readFileSync(resolve(reportDirectory, "dashboard/statistics.json"), "utf8"));
const metric = (statistics, label) => {
  const value = statistics[label];
  if (!value) throw new Error(`No se encontró el sampler '${label}'.`);
  return { label, samples: value.sampleCount, p95Ms: round(value.pct2ResTime), errorPct: round(value.errorPct), throughput: round(value.throughput) };
};

const executePlan = ({ id, plan, properties = {}, suffix = "" }) => {
  const name = suffix ? `${id}-${suffix}` : id;
  const resultDirectory = resolve(resultsRoot, name);
  const reportDirectory = resolve(reportsRoot, name);
  mkdirSync(resultDirectory, { recursive: true });
  mkdirSync(reportDirectory, { recursive: true });
  const jtl = resolve(resultDirectory, "resultados.jtl");
  const dashboard = resolve(reportDirectory, "dashboard");
  const commandArgs = [
    "-jar", jmeterJar, "-n", "-t", resolve(plansRoot, plan), "-l", jtl, "-j", resolve(resultDirectory, "jmeter.log"), "-e", "-o", dashboard,
    "-Jprotocol=http", "-Jhost=127.0.0.1", `-Jport=${port}`,
    "-JfrontendProtocol=http", "-JfrontendHost=127.0.0.1", `-JfrontendPort=${frontendPort}`,
    ...Object.entries(properties).map(([key, value]) => `-J${key}=${value}`),
  ];
  const startedAt = Date.now();
  const result = spawnSync("java", commandArgs, { cwd: root, stdio: "inherit" });
  if (result.status !== 0) throw new Error(`${id} no pudo ejecutar JMeter (exit ${result.status}).`);
  return { resultDirectory, reportDirectory, statistics: statisticsFor(reportDirectory), elapsedSeconds: round((Date.now() - startedAt) / 1000) };
};

const oracle = (passed, details) => ({ passed: Boolean(passed), details });
const noMutationOracle = async () => oracle(true, "El escenario no requiere mutaciones persistentes.");

const definitions = [
  {
    id: "JM-SEG-06", plan: "JM-SEG-06-rate-limit.jmx", labels: ["SEG06 permitida", "SEG06 exceso 429"],
    setup: () => seedBase(), verify: noMutationOracle,
    evaluate: ({ metrics }) => metrics[0].samples === 120 && metrics[1].samples === 10 && metrics.every((item) => item.errorPct === 0),
    criterion: "120 solicitudes permitidas y 100 % de excesos con HTTP 429",
  },
  {
    id: "JM-REN-01", plan: "JM-REN-01-productos.jmx", labels: ["REN01 GET productos"],
    setup: () => seedBase(), verify: noMutationOracle,
    evaluate: ({ metrics }) => metrics[0].samples >= 25 && metrics[0].p95Ms <= 800 && metrics[0].errorPct < 1,
    criterion: "25 usuarios; p95 <= 800 ms; errores < 1 %",
  },
  {
    id: "JM-REN-02", plan: "JM-REN-02-login.jmx", labels: ["REN02 POST login"],
    setup: async ({ temp }) => { const fixture = await seedBase({ customers: 15 }); return { ...fixture, properties: { dataFile: writeCustomerCsv(temp, fixture) }, beforeSessions: await prisma.session.count() }; },
    verify: async (fixture) => { const sessions = await prisma.session.count(); const audits = await prisma.auditLog.count({ where: { action: "USER_LOGGED_IN" } }); return oracle(sessions - fixture.beforeSessions === 15 && audits === 15, `Sesiones nuevas=${sessions - fixture.beforeSessions}; auditorías login=${audits}`); },
    evaluate: ({ metrics }) => metrics[0].samples === 15 && metrics[0].p95Ms <= 1500 && metrics[0].errorPct < 1,
    criterion: "15 usuarios distintos; p95 <= 1.5 s; errores < 1 %",
  },
  {
    id: "JM-REN-03", plan: "JM-REN-03-crear-pedidos.jmx", labels: ["REN03 POST pedido"],
    setup: async ({ temp }) => { const fixture = await seedBase({ customers: 10, stock: 100 }); return { ...fixture, properties: { dataFile: writeCustomerCsv(temp, fixture) } }; },
    verify: async (fixture) => { const orders = await prisma.order.count({ where: { notes: "[JM-REN-03]" } }); const payments = await prisma.payment.count(); const audits = await prisma.auditLog.count({ where: { action: "ORDER_CREATED" } }); const stock = (await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock; return oracle(orders === 10 && payments === 10 && audits === 10 && stock === 90, `Pedidos=${orders}; pagos=${payments}; auditorías=${audits}; stock=${stock}`); },
    evaluate: ({ metrics }) => metrics[0].samples === 10 && metrics[0].p95Ms <= 2000 && metrics[0].errorPct < 1,
    criterion: "10 creaciones concurrentes; p95 <= 2 s; persistencia íntegra",
  },
  {
    id: "JM-REN-05", plan: "JM-REN-05-paginacion.jmx", labels: ["REN05 historial cliente", "REN05 pedidos admin", "REN05 usuarios admin", "REN05 rechaza limit 51"],
    setup: async () => { const fixture = await seedBase({ customers: 60, admins: 1 }); await createSyntheticOrders(fixture.admins[0].user, 60, "jm-ren05"); return { ...fixture, properties: { adminToken: fixture.admins[0].token } }; },
    verify: async () => oracle(await prisma.order.count() === 60 && await prisma.user.count() >= 60, "Dataset conserva 60 pedidos y al menos 60 usuarios."),
    evaluate: ({ metrics }) => metrics.length === 4 && metrics.every((item) => item.errorPct === 0),
    criterion: "Todos los listados paginados devuelven <= 50; limit=51 se rechaza",
  },
  {
    id: "JM-DIS-01", plan: "JM-DIS-01-estabilidad.jmx", labels: ["DIS01 GET frontend", "DIS01 GET productos"], requiresFormalDuration: true, requiresFrontend: true,
    setup: () => seedBase(), verify: noMutationOracle,
    properties: ({ formal }) => ({ duration: formal ? 300 : 15, threads: 10, delay: formal ? 6000 : 1000, ramp: formal ? 10 : 1 }),
    evaluate: ({ metrics, elapsedSeconds, formal }) => metrics.length === 2 && metrics.every((item) => item.samples > 0 && item.errorPct <= 1) && (!formal || elapsedSeconds >= 295),
    criterion: "5 minutos de carga sostenida y disponibilidad observada >= 99 %",
  },
  {
    id: "JM-DIS-03", plan: "JM-DIS-03-health-ready.jmx", labels: ["DIS03 carga productos", "DIS03 GET health", "DIS03 GET ready"], requiresFormalDuration: true,
    setup: () => seedBase(), verify: noMutationOracle,
    properties: ({ formal }) => ({ duration: formal ? 300 : 15, loadThreads: formal ? 15 : 3, loadDelay: formal ? 10000 : 1000, probeDelay: formal ? 10000 : 1000 }),
    evaluate: ({ metrics, elapsedSeconds, formal }) => metrics.every((item) => item.errorPct === 0) && (!formal || elapsedSeconds >= 280),
    criterion: "/health y /ready responden 100 % correctamente bajo carga",
  },
  {
    id: "JM-ESC-01", plan: "JM-ESC-01-escalabilidad.jmx", labels: ["ESC01 GET productos"], stages: [5, 10, 15, 20, 25],
    setup: () => seedBase(), verify: noMutationOracle,
    properties: ({ stage }) => ({ threads: stage, loops: 3, ramp: 2 }),
    evaluate: ({ stageMetrics }) => { const ratio = stageMetrics.at(-1).p95Ms / Math.max(1, stageMetrics[0].p95Ms); return stageMetrics.every((item) => item.errorPct < 1) && ratio <= 3; },
    criterion: "5→25 usuarios; errores < 1 %; degradación p95 <= 3x",
  },
  {
    id: "JM-ESC-02", plan: "JM-ESC-02-dataset-100.jmx", labels: ["ESC02 GET 100 pedidos"],
    setup: async () => { const fixture = await seedBase({ customers: 1, admins: 1 }); await createSyntheticOrders(fixture.customers[0].user, 100, "jm-esc02"); return { ...fixture, properties: { adminToken: fixture.admins[0].token } }; },
    verify: async () => { const count = await prisma.order.count({ where: { idempotencyKey: { startsWith: "jm-esc02-" } } }); return oracle(count >= 100, `Pedidos sintéticos=${count}`); },
    evaluate: ({ metrics }) => metrics[0].samples === 75 && metrics[0].p95Ms <= 2000 && metrics[0].errorPct < 1,
    criterion: "Dataset de al menos 100 pedidos; 25 usuarios x 3; p95 <= 2 s",
  },
  {
    id: "JM-CON-01", plan: "JM-CON-01-idempotencia.jmx", labels: ["CON01 POST misma clave"],
    setup: async () => { const fixture = await seedBase({ customers: 1, stock: 100 }); return { ...fixture, key: `jm-con01-${randomUUID()}`, properties: { customerToken: fixture.customers[0].token, addressId: fixture.customers[0].address.id, productId: fixture.product.id, idempotencyKey: `jm-con01-${randomUUID()}` } }; },
    normalize: (fixture) => { fixture.key = fixture.properties.idempotencyKey; return fixture; },
    verify: async (fixture) => { const orders = await prisma.order.findMany({ where: { idempotencyKey: fixture.key }, include: { items: true, payment: true } }); const stock = (await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock; const movements = await prisma.inventoryMovement.count({ where: { productId: fixture.product.id, type: "SALE" } }); const audits = await prisma.auditLog.count({ where: { action: "ORDER_CREATED" } }); return oracle(orders.length === 1 && orders[0].items.length === 1 && Boolean(orders[0].payment) && stock === 99 && movements === 1 && audits === 1, `Pedidos=${orders.length}; stock=${stock}; movimientos=${movements}; auditorías=${audits}`); },
    evaluate: ({ metrics }) => metrics[0].samples === 10 && metrics[0].errorPct === 0,
    criterion: "10 solicitudes con la misma clave generan exactamente 1 pedido",
  },
  {
    id: "JM-CON-02", plan: "JM-CON-02-stock.jmx", labels: ["CON02 POST stock limitado"],
    setup: async ({ temp }) => { const fixture = await seedBase({ customers: 10, stock: 5 }); return { ...fixture, properties: { dataFile: writeCustomerCsv(temp, fixture) } }; },
    verify: async (fixture) => { const stock = (await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock; const orders = await prisma.order.count({ where: { notes: "[JM-CON-02]" } }); const movements = await prisma.inventoryMovement.aggregate({ where: { productId: fixture.product.id, type: "SALE" }, _sum: { quantity: true }, _count: true }); return oracle(stock === 0 && orders === 5 && movements._count === 5 && movements._sum.quantity === -5, `Stock=${stock}; pedidos=${orders}; movimientos=${movements._count}; suma=${movements._sum.quantity}`); },
    evaluate: ({ metrics }) => metrics[0].samples === 10 && metrics[0].errorPct === 0,
    criterion: "5 éxitos y 5 rechazos por stock; stock final 0, nunca negativo",
  },
  {
    id: "JM-CON-03", plan: "JM-CON-03-rollback.jmx", labels: ["CON03 POST fallo controlado"], injectFailure: true,
    setup: async () => { const fixture = await seedBase({ customers: 1, stock: 10 }); return { ...fixture, key: `jm-con03-${randomUUID()}`, properties: { customerToken: fixture.customers[0].token, addressId: fixture.customers[0].address.id, productId: fixture.product.id, idempotencyKey: `jm-con03-${randomUUID()}` } }; },
    normalize: (fixture) => { fixture.key = fixture.properties.idempotencyKey; return fixture; },
    verify: async (fixture) => { const stock = (await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock; const orders = await prisma.order.count({ where: { idempotencyKey: fixture.key } }); const movements = await prisma.inventoryMovement.count({ where: { productId: fixture.product.id } }); return oracle(stock === 10 && orders === 0 && movements === 0 && await prisma.payment.count() === 0 && await prisma.orderItem.count() === 0, `Stock=${stock}; pedidos=${orders}; movimientos=${movements}; pagos/items=0`); },
    evaluate: ({ metrics }) => metrics[0].samples === 1 && metrics[0].errorPct === 0,
    criterion: "Fallo controlado posterior a escrituras no deja estado parcial",
  },
  {
    id: "JM-CON-04", plan: "JM-CON-04-webhooks.jmx", labels: ["CON04 webhook aprobado duplicado", "CON04 webhook rechazado atrasado"],
    setup: async () => { const fixture = await seedBase({ customers: 1, stock: 9 }); const order = await prisma.order.create({ data: { userId: fixture.customers[0].user.id, idempotencyKey: `jm-con04-${randomUUID()}`, status: "PENDING", customerName: "JMeter Cliente", customerEmail: fixture.customers[0].user.email, customerPhone: "999000000", deliveryAddress: "Dirección JMeter", subtotal: 10, total: 10, items: { create: { productId: fixture.product.id, productName: fixture.product.name, unitPrice: 10, quantity: 1, subtotal: 10 } }, payment: { create: { provider: "CARD_PENDING_INTEGRATION", method: "CREDIT_CARD", status: "PENDING", amount: 10 } } } }); await prisma.inventoryMovement.create({ data: { productId: fixture.product.id, type: "SALE", quantity: -1, reference: order.id } }); return { ...fixture, order, properties: { orderId: order.id } }; },
    verify: async (fixture) => { const order = await prisma.order.findUnique({ where: { id: fixture.order.id }, include: { payment: true } }); const approvedAudits = await prisma.auditLog.count({ where: { entityId: order.id, action: "PAYMENT_APPROVED" } }); const rejectedAudits = await prisma.auditLog.count({ where: { entityId: order.id, action: "PAYMENT_REJECTED" } }); const returns = await prisma.inventoryMovement.count({ where: { reference: order.id, type: "RETURN" } }); return oracle(order.status === "CONFIRMED" && order.payment.status === "APPROVED" && approvedAudits === 1 && rejectedAudits === 0 && returns === 0, `Pedido=${order.status}; pago=${order.payment.status}; aprobaciones=${approvedAudits}; rechazos=${rejectedAudits}; devoluciones=${returns}`); },
    evaluate: ({ metrics }) => metrics[0].samples === 10 && metrics[1].samples === 1 && metrics.every((item) => item.errorPct === 0),
    criterion: "Duplicados/desordenados no duplican ni degradan una aprobación",
  },
  {
    id: "JM-CON-05", plan: "JM-CON-05-total-servidor.jmx", labels: ["CON05 total raíz manipulado", "CON05 unitPrice manipulado"],
    setup: async () => { const fixture = await seedBase({ customers: 1, stock: 10, price: 10 }); return { ...fixture, validKey: `jm-con05-ok-${randomUUID()}`, invalidKey: `jm-con05-bad-${randomUUID()}`, properties: { customerToken: fixture.customers[0].token, addressId: fixture.customers[0].address.id, productId: fixture.product.id, validKey: `jm-con05-ok-${randomUUID()}`, invalidKey: `jm-con05-bad-${randomUUID()}` } }; },
    normalize: (fixture) => { fixture.validKey = fixture.properties.validKey; fixture.invalidKey = fixture.properties.invalidKey; return fixture; },
    verify: async (fixture) => { const order = await prisma.order.findUnique({ where: { idempotencyKey: fixture.validKey }, include: { items: true, payment: true } }); const invalid = await prisma.order.count({ where: { idempotencyKey: fixture.invalidKey } }); const stock = (await prisma.product.findUnique({ where: { id: fixture.product.id } })).stock; const valid = order && Number(order.total) === 20 && Number(order.subtotal) === 20 && Number(order.payment.amount) === 20 && order.items.length === 1 && Number(order.items[0].unitPrice) === 10 && order.items[0].quantity === 2; return oracle(valid && invalid === 0 && stock === 8, `Total=${order && Number(order.total)}; pedido inválido=${invalid}; stock=${stock}`); },
    evaluate: ({ metrics }) => metrics.length === 2 && metrics.every((item) => item.samples === 1 && item.errorPct === 0),
    criterion: "0 manipulaciones aceptadas; total calculado desde precio persistido",
  },
];

const knownIds = new Set(definitions.map(({ id }) => id));
for (const id of requestedIds) if (!knownIds.has(id)) throw new Error(`Caso JMeter desconocido: ${id}`);
const selected = requestedIds.length ? definitions.filter(({ id }) => requestedIds.includes(id)) : definitions;
const formal = profile === "formal";
const outcomes = [];

const runDefinition = async (definition) => {
  const temp = mkdtempSync(join(tmpdir(), "elpoblano-jmeter-"));
  let fixture;
  const executions = [];
  try {
    fixture = await definition.setup({ temp });
    if (definition.normalize) fixture = definition.normalize(fixture);
    if (definition.stages) {
      for (const stage of definition.stages) {
        await startBackend({ injectFailure: definition.injectFailure, enforceRateLimit: definition.id === "JM-SEG-06" });
        try {
          if (definition.requiresFrontend) await startFrontend();
          executions.push(executePlan({ id: definition.id, plan: definition.plan, suffix: `${stage}-usuarios`, properties: { ...(fixture.properties || {}), ...(definition.properties?.({ formal, stage }) || {}) } }));
        } finally { await stopFrontend(); await stopBackend(); }
      }
    } else {
      await startBackend({ injectFailure: definition.injectFailure, enforceRateLimit: definition.id === "JM-SEG-06" });
      try {
        if (definition.requiresFrontend) await startFrontend();
        executions.push(executePlan({ id: definition.id, plan: definition.plan, properties: { ...(fixture.properties || {}), ...(definition.properties?.({ formal }) || definition.properties || {}) } }));
      } finally { await stopFrontend(); await stopBackend(); }
    }
    const metrics = executions.flatMap(({ statistics }) => definition.labels.map((label) => metric(statistics, label)).filter(({ samples }) => samples > 0));
    const stageMetrics = definition.stages ? executions.map(({ statistics }, index) => ({ stage: definition.stages[index], ...metric(statistics, definition.labels[0]) })) : undefined;
    const elapsedSeconds = round(executions.reduce((sum, item) => sum + item.elapsedSeconds, 0));
    const thresholdPassed = definition.evaluate({ metrics, stageMetrics, elapsedSeconds, formal });
    const databaseOracle = await definition.verify(fixture);
    const technicallyPassed = thresholdPassed && databaseOracle.passed;
    const pendingFormal = definition.requiresFormalDuration && !formal;
    const status = pendingFormal && technicallyPassed ? "PENDIENTE_FORMAL" : technicallyPassed ? "PASS" : "FAIL";
    const outcome = { id: definition.id, status, profile, executedAt: new Date().toISOString(), criterion: definition.criterion, elapsedSeconds, metrics, stageMetrics, oracle: databaseOracle };
    const resultDirectory = resolve(resultsRoot, definition.id);
    const reportDirectory = resolve(reportsRoot, definition.id);
    mkdirSync(resultDirectory, { recursive: true });
    mkdirSync(reportDirectory, { recursive: true });
    writeFileSync(resolve(resultDirectory, "resultado.json"), `${JSON.stringify(outcome, null, 2)}\n`, "utf8");
    writeFileSync(resolve(reportDirectory, "RESUMEN.md"), `# ${definition.id}\n\n- Perfil: ${profile}\n- Criterio: ${definition.criterion}\n- Duración medida: ${elapsedSeconds} s\n- Oráculo DB: ${databaseOracle.details}\n- Estado: **${status}**\n\n${metrics.map((item) => `- ${item.label}: ${item.samples} muestras, p95 ${item.p95Ms} ms, errores ${item.errorPct} %, throughput ${item.throughput}/s`).join("\n")}\n`, "utf8");
    return outcome;
  } catch (error) {
    return { id: definition.id, status: "FAIL", profile, executedAt: new Date().toISOString(), criterion: definition.criterion, error: error.stack || error.message };
  } finally {
    await stopFrontend();
    await stopBackend();
    rmSync(temp, { recursive: true, force: true });
  }
};

try {
  for (const definition of selected) {
    console.log(`\n[${definition.id}] Ejecutando perfil ${profile}...`);
    const outcome = await runDefinition(definition);
    outcomes.push(outcome);
    console.log(`[${definition.id}] ${outcome.status}`);
  }
  const rows = ["ID,Perfil,Estado,Criterio,Fecha", ...outcomes.map((item) => [item.id, item.profile, item.status, item.criterion, item.executedAt].map(csv).join(","))];
  writeFileSync(resolve(reportsRoot, "matriz-jmeter.csv"), `${rows.join("\n")}\n`, "utf8");
  writeFileSync(resolve(reportsRoot, "RESUMEN.md"), `# Campaña JMeter Fase 6\n\n- Ejecución: ${runId}\n- Perfil: ${profile}\n- Base aislada: ${databaseName}\n\n${outcomes.map((item) => `- ${item.id}: **${item.status}**`).join("\n")}\n\nPASS solo se asigna tras ejecución real. PENDIENTE_FORMAL indica que el smoke técnico no sustituye la duración exigida.\n`, "utf8");
  writeFileSync(resolve(resultsRoot, "ejecucion.json"), `${JSON.stringify({ runId, profile, databaseName, outcomes }, null, 2)}\n`, "utf8");
  console.log(`\nResultados: ${resultsRoot}\nReportes: ${reportsRoot}`);
  if (outcomes.some(({ status }) => status === "FAIL")) process.exitCode = 1;
} finally {
  await stopFrontend();
  await stopBackend();
  await prisma.$disconnect();
}
