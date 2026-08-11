import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, relative, resolve } from "node:path";

const root = process.cwd();
const resultsRoot = resolve(root, "tests/results");
const traceRoot = resolve(resultsRoot, "trazabilidad");
const masterPath = resolve(traceRoot, "trazabilidad_maestra_automatizable.md");
const phase5Path = resolve(resultsRoot, "fase5/report/trazabilidad-fase5.csv");
const seleniumReportsRoot = resolve(resultsRoot, "fase6/selenium/reports");
const jmeterResultsRoot = resolve(resultsRoot, "fase6/jmeter/results");
const sonarRoot = resolve(resultsRoot, "fase7/sonarqube");
const sonarCasesPath = resolve(sonarRoot, "evidence/casos-sonarqube.csv");
const sonarRawPaths = [
  resolve(sonarRoot, "results/quality-gate.json"),
  resolve(sonarRoot, "results/metricas.json"),
];

const seleniumRnfIds = [
  "SEG-02", "SEG-03", "SEG-04", "SEG-07", "SEG-08", "REN-04",
  "USA-01", "USA-02", "USA-03", "USA-04", "USA-05", "POR-03",
];
const expectedSeleniumCases = new Set([
  ...Array.from({ length: 32 }, (_, index) => `SEL-RF-${String(index + 1).padStart(2, "0")}`),
  ...seleniumRnfIds.map((id) => `SEL-${id}`),
]);
const validGroups = new Set(["SEG", "REN", "USA", "DIS", "ESC", "MAN", "POR", "CON"]);

const readUtf8 = (path) => readFileSync(path, "utf8").replace(/^\uFEFF/, "");
const toRepositoryPath = (path) => relative(root, path).replaceAll("\\", "/");
const clean = (value) => String(value ?? "").replace(/\s+/g, " ").trim();
const truncate = (value, length = 220) => {
  const normalized = clean(value);
  return normalized.length > length ? `${normalized.slice(0, length - 1)}…` : normalized;
};
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
const markdownCell = (value) => String(value ?? "").replaceAll("|", "\\|").replace(/\r?\n/g, " ");

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        value += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        value += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ",") {
      row.push(value);
      value = "";
    } else if (character === "\n") {
      row.push(value.replace(/\r$/, ""));
      if (row.some((cell) => cell !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }
  if (value !== "" || row.length) {
    row.push(value.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows;
}

function csvObjects(path) {
  if (!existsSync(path)) return [];
  const rows = parseCsv(readUtf8(path));
  if (!rows.length) return [];
  const headers = rows[0].map((header) => header.replace(/^\uFEFF/, ""));
  return rows.slice(1).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}

function markdownRows(text) {
  return text.split(/\r?\n/)
    .filter((line) => /^\s*\|/.test(line))
    .map((line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim()))
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)));
}

function loadRequirements() {
  if (!existsSync(masterPath)) throw new Error(`No existe la trazabilidad maestra: ${toRepositoryPath(masterPath)}.`);
  const rows = markdownRows(readUtf8(masterPath));
  const requirements = [];
  const seen = new Set();
  for (const cells of rows) {
    const id = cells[0];
    if (/^RF-\d{2}$/.test(id) && cells.length >= 5 && !seen.has(id)) {
      requirements.push({ type: "RF", id, description: cells[1], iso: "N/A", tool: cells[2], caseId: cells[3], threshold: cells[4] });
      seen.add(id);
      continue;
    }
    const match = /^([A-Z]{3})-(\d{2})$/.exec(id);
    if (match && validGroups.has(match[1]) && cells.length >= 6 && !seen.has(id)) {
      let caseId = cells[4];
      if (cells[3].includes("SonarQube") && !caseId.includes(`SQ-${id}`)) caseId = `SQ-${id} + ${caseId}`;
      requirements.push({ type: "RNF", id, description: cells[1], iso: cells[2], tool: cells[3], caseId, threshold: cells[5] });
      seen.add(id);
    }
  }
  const functional = requirements.filter(({ type }) => type === "RF");
  const nonFunctional = requirements.filter(({ type }) => type === "RNF");
  if (functional.length !== 32 || nonFunctional.length !== 42) {
    throw new Error(`La trazabilidad maestra debe contener 32 RF y 42 RNF; se encontraron ${functional.length} y ${nonFunctional.length}.`);
  }
  return requirements;
}

function loadPhase5() {
  const evidence = new Map();
  for (const row of csvObjects(phase5Path)) {
    const rawId = row.ID || row.Id || row.id;
    if (!rawId) continue;
    const id = rawId.replace(/^RNF-/, "");
    const state = row["Estado Fase 5"] || row.Estado || "SIN_ESTADO";
    evidence.set(id, { state, path: toRepositoryPath(phase5Path) });
  }
  return evidence;
}

function decodeXml(value) {
  return String(value ?? "")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

function xmlAttribute(attributes, name) {
  const match = new RegExp(`\\b${name}="([^"]*)"`).exec(attributes);
  return decodeXml(match?.[1] || "");
}

function parseJunit(path) {
  const text = readUtf8(path);
  const cases = new Map();
  const expression = /<testcase\b([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/g;
  for (const match of text.matchAll(expression)) {
    const name = xmlAttribute(match[1], "name");
    const id = /SEL-(?:RF-\d{2}|[A-Z]{3}-\d{2})/.exec(name)?.[0];
    if (!id || cases.has(id)) continue;
    const body = match[2] || "";
    const failure = /<(?:failure|error)\b([^>]*)>/.exec(body);
    const skipped = /<skipped\b([^>]*)(?:\/>|>)/.exec(body);
    let status = "PASS";
    let detail = `${id} aprobado en la campaña Selenium completa.`;
    if (failure) {
      status = "FAIL";
      detail = truncate(xmlAttribute(failure[1], "message") || `${id} falló en la campaña Selenium completa.`);
    } else if (skipped) {
      status = "REQUIERE_REVISION";
      detail = truncate(xmlAttribute(skipped[1], "message") || `${id} fue omitido y requiere revisión.`);
    }
    cases.set(id, { status, detail, name });
  }
  return cases;
}

function loadSelenium() {
  if (!existsSync(seleniumReportsRoot)) return { run: null, cases: new Map(), ignoredPartialRuns: 0 };
  const directories = readdirSync(seleniumReportsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => resolve(seleniumReportsRoot, entry.name));
  const complete = [];
  let partial = 0;
  for (const directory of directories) {
    const summaryPath = resolve(directory, "resumen.md");
    const junitPath = resolve(directory, "junit.xml");
    if (!existsSync(summaryPath) || !existsSync(junitPath)) {
      partial += 1;
      continue;
    }
    const summary = readUtf8(summaryPath);
    const cases = parseJunit(junitPath);
    const explicitlyComplete = /Casos esperados:\s*44\s*\(32 RF \+ 12 RNF\)/.test(summary)
      && /Ejecutados:\s*44\b/.test(summary);
    const exactCases = cases.size === expectedSeleniumCases.size
      && [...expectedSeleniumCases].every((id) => cases.has(id));
    if (explicitlyComplete && exactCases) complete.push({ directory, summaryPath, junitPath, cases });
    else partial += 1;
  }
  complete.sort((left, right) => basename(left.directory).localeCompare(basename(right.directory)));
  const selected = complete.at(-1);
  if (!selected) return { run: null, cases: new Map(), ignoredPartialRuns: partial };
  return {
    run: basename(selected.directory),
    cases: selected.cases,
    junitPath: toRepositoryPath(selected.junitPath),
    summaryPath: toRepositoryPath(selected.summaryPath),
    ignoredPartialRuns: partial,
  };
}

function filesRecursively(directory, acceptedNames) {
  if (!existsSync(directory)) return [];
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return filesRecursively(path, acceptedNames);
    return acceptedNames.has(entry.name) ? [path] : [];
  });
}

function outcomeTimestamp(outcome, source) {
  const parsed = Date.parse(outcome.executedAt || "");
  return Number.isFinite(parsed) ? parsed : statSync(source).mtimeMs;
}

function loadJmeter() {
  const candidates = new Map();
  const files = filesRecursively(jmeterResultsRoot, new Set(["ejecucion.json", "resultado.json"]));
  for (const path of files) {
    let document;
    try {
      document = JSON.parse(readUtf8(path));
    } catch {
      continue;
    }
    const outcomes = Array.isArray(document.outcomes) ? document.outcomes : document.id ? [document] : [];
    for (const outcome of outcomes) {
      if (!/^JM-[A-Z]{3}-\d{2}$/.test(outcome.id || "")) continue;
      const candidate = {
        ...outcome,
        profile: outcome.profile || document.profile || "desconocido",
        source: path,
        timestamp: outcomeTimestamp(outcome, path),
      };
      if (!candidates.has(outcome.id)) candidates.set(outcome.id, []);
      candidates.get(outcome.id).push(candidate);
    }
  }
  const selected = new Map();
  for (const [id, all] of candidates) {
    const formal = all.filter(({ profile }) => profile === "formal");
    const pool = formal.length ? formal : all;
    pool.sort((left, right) => left.timestamp - right.timestamp || toRepositoryPath(left.source).localeCompare(toRepositoryPath(right.source)));
    const outcome = pool.at(-1);
    const status = outcome.status === "PASS" ? "PASS"
      : outcome.status === "FAIL" ? "FAIL"
        : outcome.status === "PENDIENTE_FORMAL" ? "PARCIAL"
          : "REQUIERE_REVISION";
    const metrics = (outcome.metrics || []).map((metric) => `${metric.label}: ${metric.samples} muestras, p95 ${metric.p95Ms} ms, errores ${metric.errorPct} %`).join("; ");
    const detail = outcome.error
      ? truncate(outcome.error)
      : truncate([metrics, outcome.oracle?.details, outcome.status === "PENDIENTE_FORMAL" ? "falta perfil formal" : ""].filter(Boolean).join("; "));
    selected.set(id, { status, detail: detail || `${id}: ${outcome.status}.`, path: toRepositoryPath(outcome.source), profile: outcome.profile });
  }
  return selected;
}

function loadSonar() {
  const selected = new Map();
  if (!existsSync(sonarCasesPath) || sonarRawPaths.some((path) => !existsSync(path))) return selected;
  for (const row of csvObjects(sonarCasesPath)) {
    const id = (row.Requisito || "").replace(/^RNF-/, "");
    if (!/^[A-Z]{3}-\d{2}$/.test(id)) continue;
    const status = row.Estado || "REQUIERE_REVISION";
    selected.set(id, {
      status: new Set(["PASS", "FAIL", "PARCIAL", "PENDIENTE_METRICA"]).has(status) ? status : "REQUIERE_REVISION",
      detail: row["Resultado observado"] || "Evidencia Sonar sin resultado observado.",
      path: toRepositoryPath(sonarCasesPath),
    });
  }
  return selected;
}

function evidenceFor(requirement, sources) {
  const components = [];
  const evidence = [];
  const seleniumCase = requirement.caseId.match(/SEL-(?:RF-\d{2}|[A-Z]{3}-\d{2})/)?.[0];
  const jmeterCase = requirement.caseId.match(/JM-[A-Z]{3}-\d{2}/)?.[0];
  const hasSonar = requirement.tool.includes("SonarQube");
  const hasCi = requirement.tool.includes("GitHub Actions");

  if (seleniumCase) {
    const result = sources.selenium.cases.get(seleniumCase);
    if (result) {
      components.push({ kind: "Selenium", ...result });
      evidence.push(sources.selenium.junitPath, sources.selenium.summaryPath);
    } else {
      components.push({ kind: "Selenium", status: "PENDIENTE_AUTOMATIZACION", detail: sources.selenium.run
        ? `${seleniumCase} no apareció en la campaña completa seleccionada.`
        : "No existe una ejecución Selenium completa de 44/44 casos." });
    }
  }
  if (jmeterCase) {
    const result = sources.jmeter.get(jmeterCase);
    if (result) {
      components.push({ kind: "JMeter", ...result });
      evidence.push(result.path);
    } else {
      components.push({ kind: "JMeter", status: "PENDIENTE_AUTOMATIZACION", detail: `${jmeterCase} no tiene ejecución canónica disponible.` });
    }
  }
  if (hasSonar) {
    const result = sources.sonar.get(requirement.id);
    if (result) {
      components.push({ kind: "SonarQube", ...result });
      evidence.push(result.path, ...sonarRawPaths.map(toRepositoryPath));
    } else {
      components.push({ kind: "SonarQube", status: "PENDIENTE_AUTOMATIZACION", detail: `SQ-${requirement.id} no tiene evidencia cruda y caso consolidado completos.` });
    }
  }
  if (hasCi) components.push({ kind: "GitHub Actions", status: "PENDIENTE_FASE8", detail: "Validación CI pendiente de implementación en Fase 8." });

  let state;
  const states = components.map(({ status }) => status);
  if (states.includes("FAIL")) state = "FAIL";
  else if (states.includes("REQUIERE_REVISION")) state = "REQUIERE_REVISION";
  else if (states.includes("PENDIENTE_METRICA")) state = "PENDIENTE_METRICA";
  else if (states.includes("PENDIENTE_AUTOMATIZACION")) state = "PENDIENTE_AUTOMATIZACION";
  else if (states.includes("PARCIAL")) state = "PARCIAL";
  else if (hasCi && components.some(({ status }) => status === "PASS")) state = "PARCIAL";
  else if (hasCi) state = "PENDIENTE_FASE8";
  else if (states.length && states.every((status) => status === "PASS")) state = "PASS";
  else state = "PENDIENTE_AUTOMATIZACION";

  const phase5 = sources.phase5.get(requirement.id);
  if (phase5) evidence.push(phase5.path);
  const details = components.map(({ kind, detail }) => `${kind}: ${detail}`);
  if (phase5) details.push(`Fase 5: ${phase5.state} (evidencia complementaria; no sustituye la automatización).`);
  return { ...requirement, state, result: details.join(" "), evidence: [...new Set(evidence.filter(Boolean))].join("; "), phase5 };
}

function countStates(rows) {
  return rows.reduce((counts, row) => ({ ...counts, [row.state]: (counts[row.state] || 0) + 1 }), {});
}

function stateSummary(counts) {
  return Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)).map(([state, count]) => `- ${state}: **${count}**.`).join("\n");
}

function writeMatrix(rows) {
  const headers = ["Tipo", "ID", "Requisito", "ISO_IEC_25010", "Herramienta", "Caso", "Umbral", "Estado", "Resultado_actual", "Evidencia"];
  const content = [headers, ...rows.map((row) => [row.type, row.id, row.description, row.iso, row.tool, row.caseId, row.threshold, row.state, row.result, row.evidence])]
    .map((row) => row.map(csvCell).join(","))
    .join("\n");
  writeFileSync(resolve(traceRoot, "matriz_final.csv"), `${content}\n`, "utf8");
}

function writeRfReport(rows, selenium) {
  const counts = countStates(rows);
  const source = selenium.run
    ? `Campaña Selenium completa seleccionada: \`${selenium.run}\` (44/44 casos).`
    : "No se encontró una campaña Selenium completa de 44/44 casos.";
  const lines = [
    "# Resultados consolidados de requisitos funcionales",
    "",
    `- Total de RF: **${rows.length}**.`,
    `- ${source}`,
    `- Ejecuciones parciales Selenium ignoradas como fuente final: **${selenium.ignoredPartialRuns}**.`,
    stateSummary(counts),
    "",
    "> PASS se asigna solo desde el JUnit de la última campaña completa. Las ejecuciones selectivas no sobrescriben esta fotografía.",
    "",
    "| RF | Caso | Estado | Resultado | Evidencia |",
    "|---|---|---|---|---|",
    ...rows.map((row) => `| ${row.id} | ${row.caseId} | **${row.state}** | ${markdownCell(row.result)} | ${markdownCell(row.evidence)} |`),
    "",
  ];
  writeFileSync(resolve(traceRoot, "resultados_rf.md"), lines.join("\n"), "utf8");
}

function writeRnfReport(rows, selenium) {
  const counts = countStates(rows);
  const lines = [
    "# Resultados consolidados de requisitos no funcionales",
    "",
    `- Total de RNF: **${rows.length}**.`,
    `- Selenium: ${selenium.run ? `campaña completa \`${selenium.run}\`` : "sin campaña completa"}; se ignoraron **${selenium.ignoredPartialRuns}** ejecuciones parciales.`,
    stateSummary(counts),
    "",
    "> Los smoke de duración reducida se conservan como PARCIAL cuando el umbral exige campaña formal. Los casos HTTPS omitidos quedan REQUIERE_REVISION. Todo componente CI continúa pendiente de Fase 8 y no produce PASS por sí solo.",
    "",
    "| RNF | ISO/IEC 25010 | Herramienta | Caso | Umbral | Estado | Resultado | Evidencia |",
    "|---|---|---|---|---|---|---|---|",
    ...rows.map((row) => `| ${row.id} | ${markdownCell(row.iso)} | ${markdownCell(row.tool)} | ${markdownCell(row.caseId)} | ${markdownCell(row.threshold)} | **${row.state}** | ${markdownCell(row.result)} | ${markdownCell(row.evidence)} |`),
    "",
  ];
  writeFileSync(resolve(traceRoot, "resultados_rnf.md"), lines.join("\n"), "utf8");
}

function validateMatrix(path) {
  const rows = csvObjects(path);
  const rf = rows.filter(({ Tipo }) => Tipo === "RF");
  const rnf = rows.filter(({ Tipo }) => Tipo === "RNF");
  const ids = new Set(rows.map(({ ID }) => ID));
  if (rows.length !== 74 || rf.length !== 32 || rnf.length !== 42 || ids.size !== 74) {
    throw new Error(`Matriz inválida: total=${rows.length}, RF=${rf.length}, RNF=${rnf.length}, IDs únicos=${ids.size}.`);
  }
}

mkdirSync(traceRoot, { recursive: true });
const requirements = loadRequirements();
const sources = {
  phase5: loadPhase5(),
  selenium: loadSelenium(),
  jmeter: loadJmeter(),
  sonar: loadSonar(),
};
const consolidated = requirements.map((requirement) => evidenceFor(requirement, sources));
const functional = consolidated.filter(({ type }) => type === "RF");
const nonFunctional = consolidated.filter(({ type }) => type === "RNF");

writeMatrix(consolidated);
writeRfReport(functional, sources.selenium);
writeRnfReport(nonFunctional, sources.selenium);
validateMatrix(resolve(traceRoot, "matriz_final.csv"));

console.log(`Trazabilidad consolidada: ${toRepositoryPath(traceRoot)}`);
console.log(`RF: 32 (${JSON.stringify(countStates(functional))})`);
console.log(`RNF: 42 (${JSON.stringify(countStates(nonFunctional))})`);
console.log(`Selenium completo: ${sources.selenium.run || "no disponible"}; parciales ignorados: ${sources.selenium.ignoredPartialRuns}.`);
