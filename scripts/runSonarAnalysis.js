import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const host = (process.env.SONAR_HOST_URL || "https://sonarcloud.io").replace(/\/$/, "");
const token = process.env.SONAR_TOKEN;
const projectKey = process.env.SONAR_PROJECT_KEY;
const organization = process.env.SONAR_ORGANIZATION;
const phase7 = resolve(root, "tests/results/fase7/sonarqube");
const settings = resolve(phase7, "sonar-project.properties");
const output = resolve(phase7, "results");
const evidence = resolve(phase7, "evidence");
const collectOnly = process.argv.includes("--collect-only");

if (!token || !projectKey || !organization) {
  console.error("Configura SONAR_TOKEN, SONAR_PROJECT_KEY y SONAR_ORGANIZATION en la terminal.");
  process.exit(1);
}

if (!collectOnly) {
  const prepare = spawnSync(process.execPath, [resolve(root, "scripts/prepareSonarCoverage.js")], {
    cwd: root,
    stdio: "inherit",
  });
  if (prepare.status !== 0) process.exit(prepare.status ?? 1);

  const scanner = resolve(root, "node_modules/@sonar/scan/bin/sonar-scanner.js");
  const scan = spawnSync(process.execPath, [
    scanner,
    `-Dsonar.host.url=${host}`,
    `-Dsonar.token=${token}`,
    `-Dsonar.projectKey=${projectKey}`,
    `-Dsonar.organization=${organization}`,
    `-Dproject.settings=${settings}`,
  ], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (scan.status !== 0) process.exit(scan.status ?? 1);
}

const taskFile = resolve(root, ".scannerwork/report-task.txt");
if (!existsSync(taskFile)) {
  console.error("SonarScanner no generó report-task.txt.");
  process.exit(1);
}

const task = Object.fromEntries(
  readFileSync(taskFile, "utf8").trim().split(/\r?\n/).map((line) => line.split(/=(.*)/s).slice(0, 2)),
);
const authorization = `Basic ${Buffer.from(`${token}:`).toString("base64")}`;
const request = async (url) => {
  let lastError;
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { Authorization: authorization },
        signal: AbortSignal.timeout(30_000),
      });
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt < 5) await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 1_000));
    }
  }
  throw lastError;
};

let processing;
for (let attempt = 0; attempt < 30; attempt += 1) {
  processing = await request(task.ceTaskUrl);
  if (["SUCCESS", "FAILED", "CANCELED"].includes(processing.task.status)) break;
  await new Promise((resolvePromise) => setTimeout(resolvePromise, 2_000));
}
if (processing?.task?.status !== "SUCCESS") {
  console.error(`El procesamiento de SonarQube terminó con estado ${processing?.task?.status || "TIMEOUT"}.`);
  process.exit(1);
}

const metricKeys = [
  "bugs", "vulnerabilities", "code_smells", "coverage", "complexity",
  "cognitive_complexity", "sqale_index", "security_hotspots",
  "reliability_rating", "security_rating", "sqale_rating",
  "duplicated_lines_density", "sqale_debt_ratio",
].join(",");
const [measures, gate, issues] = await Promise.all([
  request(`${host}/api/measures/component?component=${encodeURIComponent(projectKey)}&metricKeys=${metricKeys}`),
  request(`${host}/api/qualitygates/project_status?projectKey=${encodeURIComponent(projectKey)}`),
  request(`${host}/api/issues/search?componentKeys=${encodeURIComponent(projectKey)}&resolved=false&ps=500`),
]);

mkdirSync(output, { recursive: true });
mkdirSync(evidence, { recursive: true });
writeFileSync(resolve(output, "metricas.json"), `${JSON.stringify(measures, null, 2)}\n`, "utf8");
writeFileSync(resolve(output, "quality-gate.json"), `${JSON.stringify(gate, null, 2)}\n`, "utf8");
writeFileSync(resolve(output, "incidencias.json"), `${JSON.stringify(issues, null, 2)}\n`, "utf8");

const values = Object.fromEntries(measures.component.measures.map(({ metric, value }) => [metric, value]));
const conditions = Object.fromEntries(
  gate.projectStatus.conditions.map(({ metricKey, actualValue, status }) => [metricKey, { actualValue, status }]),
);
const rating = (value) => ({ 1: "A", 2: "B", 3: "C", 4: "D", 5: "E" }[Number(value)] || "NO_DISPONIBLE");
const minutes = Number(values.sqale_index || 0);
const newCoverage = Number(conditions.new_coverage?.actualValue ?? NaN);
const newDuplication = Number(conditions.new_duplicated_lines_density?.actualValue ?? NaN);
const newMaintainability = rating(conditions.new_maintainability_rating?.actualValue);
const argon2Source = readFileSync(resolve(root, "apps/backend/src/modules/auth/infrastructure/passwordHasher.js"), "utf8");
const hasArgon2id = /argon2\.argon2id/.test(argon2Source);

const cases = [
  {
    id: "SQ-MAN-01", requirement: "MAN-01", threshold: "Quality Gate PASS; 0 bugs y 0 vulnerabilidades",
    actual: `Gate ${gate.projectStatus.status}; bugs ${values.bugs ?? "N/D"}; vulnerabilidades ${values.vulnerabilities ?? "N/D"}`,
    status: gate.projectStatus.status === "OK" && Number(values.bugs) === 0 && Number(values.vulnerabilities) === 0 ? "PASS" : "FAIL",
  },
  {
    id: "SQ-MAN-02", requirement: "MAN-02", threshold: "Cobertura global >=70%; backend >=80%; módulos críticos >=70%",
    actual: `Global ${values.coverage ?? "N/D"}%; código nuevo ${Number.isNaN(newCoverage) ? "N/D" : `${newCoverage}%`}; backend y módulos críticos sin desglose`,
    status: Number(values.coverage) >= 70 ? "PARCIAL" : "FAIL",
  },
  {
    id: "SQ-MAN-03", requirement: "MAN-03", threshold: "Duplicación nueva <=3%",
    actual: `Duplicación nueva ${Number.isNaN(newDuplication) ? "N/D" : `${newDuplication}%`}`,
    status: Number.isNaN(newDuplication) ? "PENDIENTE_METRICA" : newDuplication <= 3 ? "PASS" : "FAIL",
  },
  {
    id: "SQ-MAN-04", requirement: "MAN-04", threshold: "Complejidad ciclomática por función nueva <=10",
    actual: `Complejidad global ${values.complexity ?? "N/D"}; cognitiva global ${values.cognitive_complexity ?? "N/D"}; sin desglose por función nueva`,
    status: "PENDIENTE_METRICA",
  },
  {
    id: "SQ-MAN-05", requirement: "MAN-05", threshold: "Maintainability Rating de código nuevo = A",
    actual: `Rating de código nuevo ${newMaintainability}`,
    status: newMaintainability === "A" ? "PASS" : newMaintainability === "NO_DISPONIBLE" ? "PENDIENTE_METRICA" : "FAIL",
  },
  {
    id: "SQ-MAN-06", requirement: "MAN-06", threshold: "Deuda técnica nueva <=5% y rating A",
    actual: `Deuda global ${minutes} min; ratio global ${values.sqale_debt_ratio ?? "N/D"}%; rating global ${rating(values.sqale_rating)}`,
    status: values.sqale_debt_ratio == null ? "PARCIAL" : Number(values.sqale_debt_ratio) <= 5 && rating(values.sqale_rating) === "A" ? "PASS" : "FAIL",
  },
  {
    id: "SQ-SEG-01", requirement: "SEG-01", threshold: "Argon2id presente y 0 exposiciones detectadas",
    actual: `Argon2id ${hasArgon2id ? "presente" : "ausente"}; vulnerabilidades ${values.vulnerabilities ?? "N/D"}; incidencias abiertas ${issues.total}`,
    status: hasArgon2id && Number(values.vulnerabilities) === 0 && issues.total === 0 ? "PASS" : "FAIL",
  },
  {
    id: "SQ-SEG-05", requirement: "SEG-05", threshold: "0 secretos y 0 vulnerabilidades críticas/nuevas altas",
    actual: `Vulnerabilidades ${values.vulnerabilities ?? "N/D"}; hotspots ${values.security_hotspots ?? "N/D"}; escaneo dedicado de secretos pendiente de Fase 8`,
    status: Number(values.vulnerabilities) === 0 && Number(values.security_hotspots) === 0 ? "PARCIAL" : "FAIL",
  },
];

const csv = (value) => `"${String(value).replaceAll('"', '""')}"`;
const caseCsv = [
  ["Caso", "Requisito", "Umbral", "Resultado observado", "Estado"],
  ...cases.map(({ id, requirement, threshold, actual, status }) => [id, requirement, threshold, actual, status]),
].map((row) => row.map(csv).join(",")).join("\n");
writeFileSync(resolve(evidence, "casos-sonarqube.csv"), `${caseCsv}\n`, "utf8");

const caseRows = cases
  .map(({ id, requirement, threshold, actual, status }) => `| ${id} | ${requirement} | ${threshold} | ${actual} | **${status}** |`)
  .join("\n");
const summary = `# Resultado de SonarQube Cloud\n\n- Fecha UTC: ${new Date().toISOString()}\n- Organización: ${organization}\n- Proyecto: ${projectKey}\n- Quality Gate: **${gate.projectStatus.status}**\n- Bugs: ${values.bugs ?? 0}\n- Vulnerabilidades: ${values.vulnerabilities ?? 0}\n- Code smells: ${values.code_smells ?? 0}\n- Security hotspots: ${values.security_hotspots ?? 0}\n- Cobertura global: ${values.coverage ?? 0} %\n- Cobertura de código nuevo: ${Number.isNaN(newCoverage) ? "N/D" : `${newCoverage} %`}\n- Complejidad ciclomática global: ${values.complexity ?? 0}\n- Complejidad cognitiva global: ${values.cognitive_complexity ?? 0}\n- Deuda técnica global: ${minutes} minutos (${(minutes / 60).toFixed(2)} horas)\n- Incidencias abiertas: ${issues.total}\n\n## Casos trazables\n\n| Caso | RNF | Umbral | Resultado observado | Estado |\n|---|---|---|---|---|\n${caseRows}\n\n> El Quality Gate está aprobado porque evalúa principalmente código nuevo. Esto no sustituye el umbral académico de cobertura global: ${values.coverage ?? 0} % todavía es menor que 70 %. Los estados PARCIAL y PENDIENTE_METRICA se conservan para no presentar como validado aquello que el análisis actual no mide por completo.\n\nLos JSON crudos se conservan en \`../results/\`.\n`;
writeFileSync(resolve(evidence, "RESUMEN.md"), summary, "utf8");
console.log(`Evidencia SonarQube generada en: ${evidence}`);
if (gate.projectStatus.status !== "OK") process.exitCode = 1;
