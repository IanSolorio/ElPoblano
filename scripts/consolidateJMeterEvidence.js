import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, relative, resolve } from "node:path";

const root = process.cwd();
const jmeterRoot = resolve(root, "tests/results/fase6/jmeter");
const sourceResultsRoot = resolve(jmeterRoot, "results");
const canonicalResultsRoot = resolve(sourceResultsRoot, "canonical");
const canonicalReportsRoot = resolve(jmeterRoot, "reports/canonical");
const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z$/;

const caseIds = [
  "JM-SEG-06",
  "JM-REN-01",
  "JM-REN-02",
  "JM-REN-03",
  "JM-REN-05",
  "JM-DIS-01",
  "JM-DIS-03",
  "JM-ESC-01",
  "JM-ESC-02",
  "JM-CON-01",
  "JM-CON-02",
  "JM-CON-03",
  "JM-CON-04",
  "JM-CON-05",
];
const knownIds = new Set(caseIds);
const selectionRule = "formal PASS > smoke PASS > PENDIENTE_FORMAL > FAIL; empate: ejecución más reciente";

const readJson = (path) => {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    // Una campaña formal puede estar escribiendo todavía su archivo.
    return null;
  }
};
const repositoryPath = (path) => relative(root, path).replaceAll("\\", "/");
const csv = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const executionTime = (candidate) => {
  const parsed = Date.parse(candidate.outcome.executedAt || "");
  return Number.isFinite(parsed) ? parsed : statSync(candidate.sourcePath).mtimeMs;
};

function priority(candidate) {
  const { status, profile } = candidate.outcome;
  if (status === "PASS" && profile === "formal") return 400;
  if (status === "PASS" && profile === "smoke") return 300;
  if (status === "PENDIENTE_FORMAL") return 200;
  if (status === "FAIL") return 100;
  return 0;
}

function candidateKey(candidate) {
  const outcome = candidate.outcome;
  return [candidate.runId, outcome.id, outcome.executedAt || "", outcome.profile || "", outcome.status || ""].join("|");
}

function loadCandidates() {
  if (!existsSync(sourceResultsRoot)) return new Map();
  const byId = new Map(caseIds.map((id) => [id, []]));
  const runs = readdirSync(sourceResultsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && timestampPattern.test(entry.name))
    .map((entry) => resolve(sourceResultsRoot, entry.name));

  for (const runDirectory of runs) {
    const runId = basename(runDirectory);
    const executionPath = resolve(runDirectory, "ejecucion.json");
    const execution = existsSync(executionPath) ? readJson(executionPath) : null;
    const rootCandidates = new Map();
    for (const outcome of execution?.outcomes || []) {
      if (!knownIds.has(outcome.id)) continue;
      const normalized = { ...outcome, profile: outcome.profile || execution.profile || "desconocido" };
      const candidate = {
        outcome: normalized,
        runId,
        runDirectory,
        sourcePath: executionPath,
        databaseName: execution.databaseName,
        detailed: false,
      };
      rootCandidates.set(candidateKey(candidate), candidate);
    }

    for (const entry of readdirSync(runDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory() || !knownIds.has(entry.name)) continue;
      const resultPath = resolve(runDirectory, entry.name, "resultado.json");
      if (!existsSync(resultPath)) continue;
      const result = readJson(resultPath);
      if (!result || result.id !== entry.name) continue;
      const candidate = {
        outcome: { ...result, profile: result.profile || execution?.profile || "desconocido" },
        runId,
        runDirectory,
        sourcePath: resultPath,
        databaseName: execution?.databaseName,
        detailed: true,
      };
      rootCandidates.set(candidateKey(candidate), candidate);
    }

    for (const candidate of rootCandidates.values()) byId.get(candidate.outcome.id).push(candidate);
  }
  return byId;
}

function selectBest(candidates) {
  return [...candidates]
    .filter((candidate) => priority(candidate) > 0)
    .sort((left, right) => {
      const byPriority = priority(left) - priority(right);
      if (byPriority) return byPriority;
      const byTime = executionTime(left) - executionTime(right);
      if (byTime) return byTime;
      if (left.detailed !== right.detailed) return Number(left.detailed) - Number(right.detailed);
      return repositoryPath(left.sourcePath).localeCompare(repositoryPath(right.sourcePath));
    })
    .at(-1);
}

function findRelatedJtl(candidate) {
  if (!candidate) return [];
  const relatedDirectories = readdirSync(candidate.runDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && (entry.name === candidate.outcome.id || entry.name.startsWith(`${candidate.outcome.id}-`)))
    .map((entry) => ({ name: entry.name, path: resolve(candidate.runDirectory, entry.name) }));
  const files = [];
  for (const directory of relatedDirectories) {
    const source = resolve(directory.path, "resultados.jtl");
    if (!existsSync(source)) continue;
    const suffix = directory.name === candidate.outcome.id ? "" : directory.name.slice(candidate.outcome.id.length + 1);
    const destination = suffix
      ? resolve(canonicalResultsRoot, candidate.outcome.id, "jtl", suffix, "resultados.jtl")
      : resolve(canonicalResultsRoot, candidate.outcome.id, "resultados.jtl");
    files.push({ source, destination });
  }
  return files.sort((left, right) => repositoryPath(left.destination).localeCompare(repositoryPath(right.destination)));
}

function metricLines(outcome) {
  const metrics = (outcome.metrics || []).map((metric) =>
    `- ${metric.label}: ${metric.samples} muestras, p95 ${metric.p95Ms} ms, errores ${metric.errorPct} %, throughput ${metric.throughput}/s.`);
  if (outcome.oracle) metrics.push(`- Oráculo de datos: ${outcome.oracle.passed ? "PASS" : "FAIL"} — ${outcome.oracle.details}`);
  if (outcome.error) metrics.push(`- Error: ${clean(outcome.error)}`);
  return metrics;
}

function pendingOutcome(id) {
  return {
    id,
    status: "PENDIENTE_EVIDENCIA",
    profile: null,
    executedAt: null,
    criterion: "No existe una ejecución cerrada disponible para este caso.",
    evidenceFound: false,
    selection: { rule: selectionRule, sourceRun: null, sourceFile: null, jtlFiles: [] },
  };
}

mkdirSync(canonicalResultsRoot, { recursive: true });
mkdirSync(canonicalReportsRoot, { recursive: true });

const candidatesById = loadCandidates();
const canonicalOutcomes = [];
for (const id of caseIds) {
  const selected = selectBest(candidatesById.get(id) || []);
  if (!selected) {
    const outcome = pendingOutcome(id);
    canonicalOutcomes.push(outcome);
    const resultDirectory = resolve(canonicalResultsRoot, id);
    const reportDirectory = resolve(canonicalReportsRoot, id);
    mkdirSync(resultDirectory, { recursive: true });
    mkdirSync(reportDirectory, { recursive: true });
    writeFileSync(resolve(resultDirectory, "resultado.json"), `${JSON.stringify(outcome, null, 2)}\n`, "utf8");
    writeFileSync(resolve(reportDirectory, "RESUMEN.md"), `# ${id}\n\n- Estado: **PENDIENTE_EVIDENCIA**.\n- Selección: ${selectionRule}.\n- Detalle: no existe una ejecución cerrada disponible.\n`, "utf8");
    continue;
  }

  const jtl = findRelatedJtl(selected);
  for (const file of jtl) {
    mkdirSync(resolve(file.destination, ".."), { recursive: true });
    copyFileSync(file.source, file.destination);
  }
  const jtlPaths = jtl.map(({ destination }) => repositoryPath(destination));
  const outcome = {
    ...selected.outcome,
    evidenceFound: true,
    selection: {
      rule: selectionRule,
      priority: priority(selected),
      sourceRun: selected.runId,
      sourceFile: repositoryPath(selected.sourcePath),
      jtlFiles: jtlPaths,
    },
  };
  canonicalOutcomes.push(outcome);

  const resultDirectory = resolve(canonicalResultsRoot, id);
  const reportDirectory = resolve(canonicalReportsRoot, id);
  mkdirSync(resultDirectory, { recursive: true });
  mkdirSync(reportDirectory, { recursive: true });
  writeFileSync(resolve(resultDirectory, "resultado.json"), `${JSON.stringify(outcome, null, 2)}\n`, "utf8");
  const summary = [
    `# ${id}`,
    "",
    `- Estado: **${outcome.status}**.`,
    `- Perfil seleccionado: ${outcome.profile}.`,
    `- Fecha UTC: ${outcome.executedAt || "no disponible"}.`,
    `- Criterio: ${outcome.criterion || "no disponible"}.`,
    `- Duración medida: ${outcome.elapsedSeconds ?? "no disponible"} s.`,
    `- Fuente: \`${outcome.selection.sourceFile}\`.`,
    `- Regla de selección: ${selectionRule}.`,
    ...(jtlPaths.length ? ["- JTL canónicos:", ...jtlPaths.map((path) => `  - \`${path}\``)] : ["- JTL canónicos: no disponibles."]),
    "",
    ...metricLines(outcome),
    "",
  ].join("\n");
  writeFileSync(resolve(reportDirectory, "RESUMEN.md"), summary, "utf8");
}

const selectedDates = canonicalOutcomes.map(({ executedAt }) => executedAt).filter(Boolean).sort();
const databases = [...new Set([...candidatesById.values()].flat().map(({ databaseName }) => databaseName).filter(Boolean))];
const execution = {
  runId: "canonical",
  profile: "mixed",
  consolidatedThrough: selectedDates.at(-1) || null,
  complete: canonicalOutcomes.every(({ evidenceFound }) => evidenceFound),
  expectedCases: caseIds.length,
  evidencedCases: canonicalOutcomes.filter(({ evidenceFound }) => evidenceFound).length,
  databaseNames: databases,
  selectionRule,
  outcomes: canonicalOutcomes,
};
writeFileSync(resolve(canonicalResultsRoot, "ejecucion.json"), `${JSON.stringify(execution, null, 2)}\n`, "utf8");

const matrixRows = [
  ["ID", "Perfil", "Estado", "Criterio", "Fecha", "Fuente", "JTL"],
  ...canonicalOutcomes.map((outcome) => [
    outcome.id,
    outcome.profile || "N/A",
    outcome.status,
    outcome.criterion,
    outcome.executedAt || "N/A",
    outcome.selection.sourceFile || "N/A",
    (outcome.selection.jtlFiles || []).join("; ") || "N/A",
  ]),
];
writeFileSync(resolve(canonicalReportsRoot, "matriz-jmeter.csv"), `${matrixRows.map((row) => row.map(csv).join(",")).join("\n")}\n`, "utf8");

const counts = canonicalOutcomes.reduce((summary, outcome) => ({
  ...summary,
  [outcome.status]: (summary[outcome.status] || 0) + 1,
}), {});
const report = [
  "# Evidencia canónica JMeter — Fase 6",
  "",
  `- Casos esperados: **${caseIds.length}**.`,
  `- Casos con evidencia: **${execution.evidencedCases}**.`,
  `- Evidencia completa: **${execution.complete ? "sí" : "no"}**.`,
  `- Consolidada hasta: ${execution.consolidatedThrough || "sin ejecuciones"}.`,
  `- Regla: ${selectionRule}.`,
  "",
  ...Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)).map(([status, count]) => `- ${status}: **${count}**.`),
  "",
  "| Caso | Perfil | Estado | Fuente |",
  "|---|---|---|---|",
  ...canonicalOutcomes.map((outcome) => `| ${outcome.id} | ${outcome.profile || "N/A"} | **${outcome.status}** | ${outcome.selection.sourceRun || "N/A"} |`),
  "",
  "> Este snapshot no contiene dashboards ni logs. Las campañas fuente permanecen intactas.",
  "",
].join("\n");
writeFileSync(resolve(canonicalReportsRoot, "RESUMEN.md"), report, "utf8");

const writtenIds = new Set(canonicalOutcomes.map(({ id }) => id));
if (canonicalOutcomes.length !== 14 || writtenIds.size !== 14 || caseIds.some((id) => !writtenIds.has(id))) {
  throw new Error("La consolidación JMeter no contiene exactamente los 14 IDs esperados.");
}

console.log(`Evidencia JMeter canónica: ${repositoryPath(canonicalResultsRoot)}`);
console.log(`Reportes JMeter canónicos: ${repositoryPath(canonicalReportsRoot)}`);
console.log(`Casos evidenciados: ${execution.evidencedCases}/14; estados: ${JSON.stringify(counts)}.`);
