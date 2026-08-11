import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const phaseRoot = resolve(root, "tests/results/fase5");
const paths = {
  unit: resolve(phaseRoot, "unitarias/reports"),
  integration: resolve(phaseRoot, "integracion/reports"),
  systemCases: resolve(phaseRoot, "sistema/casos"),
  systemReports: resolve(phaseRoot, "sistema/reports"),
  acceptanceCases: resolve(phaseRoot, "aceptacion/casos"),
  acceptanceReports: resolve(phaseRoot, "aceptacion/reports"),
  report: resolve(phaseRoot, "report"),
};
Object.values(paths).forEach((directory) => mkdirSync(directory, { recursive: true }));

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    encoding: "utf8",
    stdio: options.inherit ? "inherit" : "pipe",
    shell: process.platform === "win32" && command.endsWith(".cmd"),
    env: { ...process.env, ...options.env },
  });
  if (!options.inherit) {
    const output = `${result.stdout || ""}${result.stderr || ""}`;
    if (options.output) writeFileSync(options.output, output, "utf8");
    process.stdout.write(output);
  }
  return result;
};

const parseCsv = (text) => {
  text = text.replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(value); value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(value); value = "";
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
    } else value += character;
  }
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
};
const countJUnit = (path) => {
  const text = readFileSync(path, "utf8");
  const executed = (text.match(/<testcase\b/g) || []).length;
  const failures = (text.match(/<(?:failure|error)\b/g) || []).length;
  const skipped = (text.match(/<skipped\b/g) || []).length;
  return { executed, failures, skipped, passed: executed - failures - skipped };
};

const backendRoot = resolve(root, "apps/backend");
const backendJUnit = resolve(paths.unit, "backend-junit.xml");
const backendConsole = resolve(paths.unit, "backend-consola.txt");
const backendLcov = resolve(paths.unit, "backend-lcov.info");
const frontendJUnit = resolve(paths.unit, "frontend-junit.xml");
const frontendConsole = resolve(paths.unit, "frontend-consola.txt");
const frontendCoverageDirectory = resolve(paths.unit, "frontend-coverage");
const frontendLcov = resolve(frontendCoverageDirectory, "lcov.info");
const frontendJUnitArgument = "../../tests/results/fase5/unitarias/reports/frontend-junit.xml";
const frontendCoverageArgument = "../../tests/results/fase5/unitarias/reports/frontend-coverage";

const backendUnit = run(process.execPath, [
  "--test", "--experimental-test-coverage",
  "--test-coverage-include=src/**/*.js", "--test-coverage-include=../frontend/src/modules/cart/**/*.js",
  "--test-coverage-exclude=src/server.js", "tests/*.test.js",
], { cwd: backendRoot, output: backendConsole });
const backendJUnitRun = run(process.execPath, ["--test", "--test-reporter=junit", `--test-reporter-destination=${backendJUnit}`, "tests/*.test.js"], { cwd: backendRoot });
const backendCoverageRun = run(process.execPath, [
  "--test", "--experimental-test-coverage",
  "--test-coverage-include=src/**/*.js", "--test-coverage-include=../frontend/src/modules/cart/**/*.js",
  "--test-coverage-exclude=src/server.js", "--test-reporter=lcov", `--test-reporter-destination=${backendLcov}`, "tests/*.test.js",
], { cwd: backendRoot });
const frontendUnit = run(npm, ["run", "test", "-w", "@elpoblano/frontend", "--", "--reporter=junit", `--outputFile=${frontendJUnitArgument}`]);
const frontendCoverage = run(npm, ["run", "test:coverage", "-w", "@elpoblano/frontend", "--", `--coverage.reportsDirectory=${frontendCoverageArgument}`], { output: frontendConsole });

const backend = countJUnit(backendJUnit);
const frontend = countJUnit(frontendJUnit);
const unitPassed = backend.failures === 0 && backend.skipped === 0 && backend.executed === 107
  && frontend.failures === 0 && frontend.skipped === 0 && frontend.executed === 20
  && [backendUnit, backendJUnitRun, backendCoverageRun, frontendUnit, frontendCoverage].every(({ status }) => status === 0)
  && existsSync(frontendLcov);
writeFileSync(resolve(paths.unit, "resumen.md"), `# Resumen — pruebas unitarias

- Backend: ${backend.executed} ejecutadas, ${backend.passed} aprobadas, ${backend.failures} fallidas, ${backend.skipped} omitidas.
- Frontend: ${frontend.executed} ejecutadas, ${frontend.passed} aprobadas, ${frontend.failures} fallidas, ${frontend.skipped} omitidas.
- Total: ${backend.executed + frontend.executed} ejecutadas.
- Cobertura backend: consultar \`backend-lcov.info\` y \`backend-consola.txt\`.
- Cobertura frontend: consultar \`frontend-coverage/lcov.info\` y \`frontend-consola.txt\`.
- Resultado: **${unitPassed ? "APROBADO" : "NO APROBADO"}**.
`, "utf8");

const integrationJUnit = resolve(paths.integration, "junit.xml");
const integrationRun = run(process.execPath, ["--test", "--test-concurrency=1", "--test-reporter=junit", `--test-reporter-destination=${integrationJUnit}`, "tests/integration/*.integration.test.js"], {
  cwd: backendRoot,
  env: {
    ...(process.env.TEST_DATABASE_URL ? { DATABASE_URL: process.env.TEST_DATABASE_URL } : {}),
    NODE_ENV: "test",
    FRONTEND_ORIGIN: "http://integration.test",
  },
});
const integration = countJUnit(integrationJUnit);
const integrationPassed = integrationRun.status === 0 && integration.executed === 61 && integration.failures === 0 && integration.skipped === 0;
writeFileSync(resolve(paths.integration, "resumen.md"), `# Resumen — pruebas de integración

- Ejecutadas: ${integration.executed}.
- Aprobadas: ${integration.passed}.
- Fallidas: ${integration.failures}.
- Omitidas: ${integration.skipped}.
- Base utilizada: \`TEST_DATABASE_URL\` o la configuración de integración existente.
- Resultado: **${integrationPassed ? "APROBADO" : "NO APROBADO"}**.
`, "utf8");

const systemResults = resolve(paths.systemReports, "resultados.csv");
if (!existsSync(systemResults)) throw new Error("Falta sistema/reports/resultados.csv.");
const systemRows = parseCsv(readFileSync(systemResults, "utf8"));
const systemHeader = systemRows.shift();
const systemObjects = systemRows.map((row) => Object.fromEntries(systemHeader.map((header, index) => [header, row[index] || ""])));
const expectedSystemIds = [
  ...Array.from({ length: 40 }, (_, index) => `ST-E2E-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 8 }, (_, index) => `ST-NF-${String(index + 1).padStart(2, "0")}`),
];
const systemIds = systemObjects.map(({ ID }) => ID);
const validSystemIds = new Set(systemIds).size === 48 && expectedSystemIds.every((id) => systemIds.includes(id));
for (const item of systemObjects) {
  writeFileSync(resolve(paths.systemCases, `${item.ID}.md`), `# ${item.ID} — prueba de sistema

- Prioridad: ${item.Prioridad}
- Escenario: ${item.Escenario}
- Resultado esperado: ${item["Resultado esperado"]}
- Resultado observado: ${item["Resultado observado"] || "No registrado"}
- Estado: **${item.Resultado}**
- Defecto: ${item.Defecto || "NINGUNO"}
- Responsable: ${item.Responsable || "No registrado"}
- Fecha UTC: ${item["Fecha UTC"] || "No registrada"}
`, "utf8");
}
const systemApproved = systemObjects.filter(({ Resultado }) => Resultado === "APROBADO").length;
const systemPassed = systemObjects.length === 48 && validSystemIds && systemApproved === 48;
writeFileSync(resolve(paths.systemReports, "resumen.md"), `# Resumen — pruebas de sistema

- Casos definidos: ${systemObjects.length}.
- Aprobados: ${systemApproved}.
- No aprobados: ${systemObjects.length - systemApproved}.
- Ejecución: validación de la matriz manual registrada en Fase 5.
- Resultado: **${systemPassed ? "APROBADO" : "NO APROBADO"}**.
`, "utf8");

const acceptanceResults = resolve(paths.acceptanceReports, "resultados.csv");
if (!existsSync(acceptanceResults)) throw new Error("Falta aceptacion/reports/resultados.csv.");
const acceptanceRows = parseCsv(readFileSync(acceptanceResults, "utf8"));
const acceptanceHeader = acceptanceRows.shift();
const acceptanceObjects = acceptanceRows.map((row) => Object.fromEntries(acceptanceHeader.map((header, index) => [header, row[index] || ""])));
const expectedAcceptanceIds = Array.from({ length: 32 }, (_, index) => `AT-${String(index + 1).padStart(2, "0")}`);
const acceptanceIds = acceptanceObjects.map(({ ID }) => ID);
const validAcceptanceIds = new Set(acceptanceIds).size === 32 && expectedAcceptanceIds.every((id) => acceptanceIds.includes(id));
for (const item of acceptanceObjects) {
  writeFileSync(resolve(paths.acceptanceCases, `${item.ID}.md`), `# ${item.ID} — prueba de aceptación

- Requisito: ${item.Requisito}
- Prioridad: ${item.Prioridad}
- Criterio: ${item["Criterio Dado/Cuando/Entonces"]}
- Estado: **${item.Resultado}**
- Comentario: ${item["Comentario del evaluador"] || "Sin observaciones"}
- Defecto: ${item.Defecto || "NINGUNO"}
- Evaluador: ${item.Evaluador || "No registrado"}
- Rol: ${item.Rol || "No registrado"}
- Fecha UTC: ${item["Fecha UTC"] || "No registrada"}
`, "utf8");
}
const acceptanceApproved = acceptanceObjects.filter(({ Resultado }) => Resultado === "ACEPTADO").length;
const acceptancePassed = acceptanceObjects.length === 32 && validAcceptanceIds && acceptanceApproved === 32;
writeFileSync(resolve(paths.acceptanceReports, "resumen.md"), `# Resumen — pruebas de aceptación

- Casos definidos: ${acceptanceObjects.length}.
- Aceptados: ${acceptanceApproved}.
- No aceptados: ${acceptanceObjects.length - acceptanceApproved}.
- Modalidad: aceptación simulada conservada como evidencia académica.
- Resultado: **${acceptancePassed ? "ACEPTADO" : "NO ACEPTADO"}**.
`, "utf8");

const tracePath = resolve(paths.report, "trazabilidad-fase5.csv");
if (!existsSync(tracePath)) {
  throw new Error("Falta la trazabilidad histórica de Fase 5 en report/trazabilidad-fase5.csv.");
}
const traceRows = parseCsv(readFileSync(tracePath, "utf8"));
const traceHeader = traceRows.shift();
const traceIdIndex = traceHeader.indexOf("ID");
const traceTypeIndex = traceHeader.indexOf("Tipo");
const tracedIds = traceRows.map((row) => row[traceIdIndex]);
const tracedRf = traceRows.filter((row) => row[traceTypeIndex] === "RF").length;
const tracedRnf = traceRows.filter((row) => row[traceTypeIndex] === "RNF").length;
const expectedRequirementIds = [
  ...Array.from({ length: 32 }, (_, index) => `RF-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 42 }, (_, index) => {
    const groups = [
      ["SEG", 8], ["REN", 5], ["USA", 5], ["DIS", 4], ["ESC", 4],
      ["MAN", 7], ["POR", 4], ["CON", 5],
    ];
    let offset = index;
    for (const [prefix, count] of groups) {
      if (offset < count) return `RNF-${prefix}-${String(offset + 1).padStart(2, "0")}`;
      offset -= count;
    }
    throw new Error("No se pudo construir el identificador RNF esperado.");
  }),
];
const traceIsValid = traceRows.length === 74
  && tracedRf === 32
  && tracedRnf === 42
  && new Set(tracedIds).size === 74
  && expectedRequirementIds.every((id) => tracedIds.includes(id));
if (!traceIsValid) {
  throw new Error(`La trazabilidad Fase 5 debe contener exactamente 32 RF y 42 RNF únicos; contiene ${tracedRf} RF y ${tracedRnf} RNF.`);
}

const allPassed = unitPassed && integrationPassed && systemPassed && acceptancePassed;
writeFileSync(resolve(paths.report, "resumen.md"), `# Resultado consolidado — Fase 5

| Nivel | Ejecutadas/revisadas | Aprobadas | Estado |
|---|---:|---:|---|
| Unitarias backend + frontend | ${backend.executed + frontend.executed} | ${backend.passed + frontend.passed} | ${unitPassed ? "APROBADO" : "NO APROBADO"} |
| Integración | ${integration.executed} | ${integration.passed} | ${integrationPassed ? "APROBADO" : "NO APROBADO"} |
| Sistema | ${systemObjects.length} | ${systemApproved} | ${systemPassed ? "APROBADO" : "NO APROBADO"} |
| Aceptación | ${acceptanceObjects.length} | ${acceptanceApproved} | ${acceptancePassed ? "ACEPTADO" : "NO ACEPTADO"} |

- Total formal de Fase 5: 268 comprobaciones (127 unitarias, 61 integración, 48 sistema y 32 aceptación). Las 20 unitarias frontend ahora se contabilizan explícitamente.
- Fecha UTC: ${new Date().toISOString()}.
- Resultado general: **${allPassed ? "APROBADO" : "NO APROBADO"}**.
- Trazabilidad: \`trazabilidad-fase5.csv\`.
`, "utf8");

console.log(`\nResultados de Fase 5: ${phaseRoot}`);
if (!allPassed) process.exitCode = 1;
