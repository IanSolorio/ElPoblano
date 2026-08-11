import { spawn, spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

const root = process.cwd();
config({ path: resolve(root, "apps/backend/.env"), quiet: true });
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) throw new Error("TEST_DATABASE_URL no está configurada en apps/backend/.env.");
const databaseName = new URL(testDatabaseUrl).pathname.slice(1);
if (!databaseName.endsWith("_test")) throw new Error(`Selenium solo puede usar una base terminada en _test (actual: ${databaseName}).`);

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportsRoot = resolve(root, "tests/results/fase6/selenium/reports");
const output = resolve(reportsRoot, timestamp);
mkdirSync(output, { recursive: true });
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const frontendUrl = process.env.E2E_BASE_URL || "http://127.0.0.1:5174";
const apiOrigin = process.env.E2E_API_ORIGIN || "http://127.0.0.1:3001";
const requestedCases = process.argv.slice(2)
  .filter((argument) => argument.startsWith("--case="))
  .flatMap((argument) => argument.slice("--case=".length).split(","))
  .map((id) => id.trim())
  .filter(Boolean);
const backendEnv = {
  ...process.env, DATABASE_URL: testDatabaseUrl, NODE_ENV: "test", PORT: "3001",
  FRONTEND_ORIGIN: frontendUrl, PAYMENT_PROVIDER_MODE: "stub", GLOBAL_RATE_LIMIT: "10000", AUTH_RATE_LIMIT: "1000",
};
const frontendEnv = {
  ...process.env, VITE_ENDPOINT_BASE: `${apiOrigin}/api`, VITE_E2E_PAYMENT_STUB: "true",
};
let backend;
let frontend;

const run = (command, args, options = {}) => spawnSync(command, args, {
  cwd: options.cwd || root,
  stdio: options.stdio || "inherit",
  encoding: options.encoding,
  shell: process.platform === "win32" && command.endsWith(".cmd"),
  env: options.env || process.env,
});
const waitFor = async (url, label, attempts = 60) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try { if ((await fetch(url)).ok) return; } catch { /* espera */ }
    await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
  }
  throw new Error(`${label} no estuvo disponible en ${url}.`);
};
const testFiles = (directory) => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
  const path = resolve(directory, entry.name);
  return entry.isDirectory() ? testFiles(path) : entry.name.endsWith(".selenium.test.js") ? [path] : [];
}).sort();

try {
  const prepare = run(process.execPath, [resolve(root, "scripts/prepareSeleniumData.js")], { env: backendEnv });
  if (prepare.status !== 0) throw new Error("No se pudieron preparar los fixtures Selenium.");

  backend = spawn(process.execPath, [resolve(root, "apps/backend/src/server.js")], { cwd: resolve(root, "apps/backend"), stdio: "inherit", env: backendEnv });
  await waitFor(`${apiOrigin}/api/ready`, "Backend E2E");

  const build = run(npm, ["run", "build", "-w", "@elpoblano/frontend"], { env: frontendEnv });
  if (build.status !== 0) throw new Error("El build del frontend falló antes de Selenium.");
  frontend = spawn(process.execPath, [resolve(root, "node_modules/vite/bin/vite.js"), "preview", "--host", "127.0.0.1", "--port", "5174"], {
    cwd: resolve(root, "apps/frontend"), stdio: "inherit", env: frontendEnv,
  });
  await waitFor(frontendUrl, "Frontend E2E");

  const allFiles = testFiles(resolve(root, "tests/results/fase6/selenium/tests"));
  const files = requestedCases.length
    ? allFiles.filter((file) => requestedCases.some((id) => file.endsWith(`${id}.selenium.test.js`)))
    : allFiles;
  if (!files.length || (requestedCases.length && files.length !== new Set(requestedCases).size)) {
    throw new Error(`No se encontraron todos los casos Selenium solicitados: ${requestedCases.join(", ")}.`);
  }
  const junit = resolve(output, "junit.xml");
  const args = ["--test", "--test-concurrency=1", "--test-reporter=spec", "--test-reporter-destination=stdout", "--test-reporter=junit", `--test-reporter-destination=${junit}`, ...files];
  const result = run(process.execPath, args, {
    env: { ...backendEnv, E2E_BASE_URL: frontendUrl, E2E_API_URL: `${apiOrigin}/api`, E2E_REPORT_DIR: output, E2E_RESET_PER_CASE: "true" },
  });

  const junitText = readFileSync(junit, "utf8");
  const executed = (junitText.match(/<testcase\b/g) || []).length;
  const failed = (junitText.match(/<(?:failure|error)\b/g) || []).length;
  const skipped = (junitText.match(/<skipped\b/g) || []).length;
  const passed = executed - failed - skipped;
  const expected = files.length;
  const state = result.status === 0 && executed === expected && failed === 0 && skipped === 0 ? "APROBADO" : "NO APROBADO";
  writeFileSync(resolve(output, "resumen.md"), `# Resultado Selenium

- Fecha UTC: ${new Date().toISOString()}.
- Entorno: frontend compilado en ${frontendUrl}; backend aislado en ${apiOrigin}; base ${databaseName}.
- Casos esperados: ${expected}${requestedCases.length ? ` (selección: ${requestedCases.join(", ")})` : " (32 RF + 12 RNF)"}.
- Ejecutados: ${executed}.
- Aprobados: ${passed}.
- Fallidos: ${failed}.
- REQUIERE_REVISION/omitidos: ${skipped}.
- Resultado: **${state}**.

Los casos HTTPS pueden requerir \`E2E_HTTPS_BASE_URL\`, \`E2E_COOKIE_TEST_URL\` y credenciales E2E dedicadas. Nunca se sustituyen por un PASS local artificial.
`, "utf8");
  writeFileSync(resolve(output, "entorno.txt"), `Fecha UTC: ${new Date().toISOString()}\nFrontend: ${frontendUrl}\nAPI: ${apiOrigin}\nBase: ${databaseName}\nNode: ${process.version}\nHeadless: ${process.env.E2E_HEADLESS !== "false"}\n`, "utf8");
  mkdirSync(reportsRoot, { recursive: true });
  writeFileSync(resolve(reportsRoot, "ULTIMA_EJECUCION.md"), `# Última ejecución Selenium\n\n- Carpeta: \`${timestamp}\`.\n- Ejecutados: ${executed}.\n- Aprobados: ${passed}.\n- Fallidos: ${failed}.\n- Requieren revisión: ${skipped}.\n- Estado: **${state}**.\n`, "utf8");
  console.log(`Evidencia Selenium: ${output}`);
  if (state !== "APROBADO") process.exitCode = 1;
} finally {
  if (frontend?.exitCode === null) frontend.kill("SIGTERM");
  if (backend?.exitCode === null) backend.kill("SIGTERM");
}
