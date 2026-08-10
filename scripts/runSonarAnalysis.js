import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const host = (process.env.SONAR_HOST_URL || "https://sonarcloud.io").replace(/\/$/, "");
const token = process.env.SONAR_TOKEN;
const projectKey = process.env.SONAR_PROJECT_KEY;
const organization = process.env.SONAR_ORGANIZATION;
const output = resolve(root, "tests/results/fase7");
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

const task = Object.fromEntries(readFileSync(taskFile, "utf8").trim().split(/\r?\n/).map((line) => line.split(/=(.*)/s).slice(0, 2)));
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
].join(",");
const [measures, gate, issues] = await Promise.all([
  request(`${host}/api/measures/component?component=${encodeURIComponent(projectKey)}&metricKeys=${metricKeys}`),
  request(`${host}/api/qualitygates/project_status?projectKey=${encodeURIComponent(projectKey)}`),
  request(`${host}/api/issues/search?componentKeys=${encodeURIComponent(projectKey)}&resolved=false&ps=500`),
]);

mkdirSync(output, { recursive: true });
writeFileSync(resolve(output, "metricas.json"), `${JSON.stringify(measures, null, 2)}\n`, "utf8");
writeFileSync(resolve(output, "quality-gate.json"), `${JSON.stringify(gate, null, 2)}\n`, "utf8");
writeFileSync(resolve(output, "incidencias.json"), `${JSON.stringify(issues, null, 2)}\n`, "utf8");

const values = Object.fromEntries(measures.component.measures.map(({ metric, value }) => [metric, value]));
const minutes = Number(values.sqale_index || 0);
const summary = `# Resultado de SonarQube Cloud\n\n- Fecha UTC: ${new Date().toISOString()}\n- Organización: ${organization}\n- Proyecto: ${projectKey}\n- Quality Gate: **${gate.projectStatus.status}**\n- Bugs: ${values.bugs ?? 0}\n- Vulnerabilidades: ${values.vulnerabilities ?? 0}\n- Code smells: ${values.code_smells ?? 0}\n- Security hotspots: ${values.security_hotspots ?? 0}\n- Cobertura: ${values.coverage ?? 0} %\n- Complejidad ciclomática: ${values.complexity ?? 0}\n- Complejidad cognitiva: ${values.cognitive_complexity ?? 0}\n- Deuda técnica: ${minutes} minutos (${(minutes / 60).toFixed(2)} horas)\n- Incidencias abiertas: ${issues.total}\n\nConsulta los archivos JSON de esta carpeta para el detalle auditable.\n`;
writeFileSync(resolve(output, "RESUMEN.md"), summary, "utf8");
console.log(`Evidencia SonarQube generada en: ${output}`);
if (gate.projectStatus.status !== "OK") process.exitCode = 1;
