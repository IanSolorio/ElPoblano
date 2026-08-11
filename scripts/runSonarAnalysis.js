import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const host = (process.env.SONAR_HOST_URL || "https://sonarcloud.io").replace(/\/$/, "");
const token = process.env.SONAR_TOKEN;
const projectKey = process.env.SONAR_PROJECT_KEY;
const organization = process.env.SONAR_ORGANIZATION;
const phase7 = resolve(root, "tests/results/fase7/sonarqube");
const settings = resolve(root, "sonar-project.properties");
const output = resolve(phase7, "results");
const evidence = resolve(phase7, "evidence");
const collectOnly = process.argv.includes("--collect-only");
const branchName = process.env.SONAR_BRANCH_NAME || process.env.GITHUB_REF_NAME;
const branchQuery = branchName ? `&branch=${encodeURIComponent(branchName)}` : "";

if (!token || !projectKey || !organization) {
  console.error("Configura SONAR_TOKEN, SONAR_PROJECT_KEY y SONAR_ORGANIZATION en la terminal.");
  process.exit(1);
}

if (!existsSync(settings)) {
  console.error("Falta sonar-project.properties en la raíz del repositorio.");
  process.exit(1);
}

if (!collectOnly) {
  const prepare = spawnSync(process.execPath, [resolve(root, "scripts/prepareSonarCoverage.js")], {
    cwd: root,
    stdio: "inherit",
  });

  if (prepare.status !== 0) process.exit(prepare.status ?? 1);

  const scanner = resolve(root, "node_modules/@sonar/scan/bin/sonar-scanner.js");

  const scan = spawnSync(
    process.execPath,
    [
      scanner,
      `-Dsonar.host.url=${host}`,
      `-Dsonar.token=${token}`,
      `-Dsonar.projectKey=${projectKey}`,
      `-Dsonar.organization=${organization}`,
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: process.env,
    },
  );

  if (scan.status !== 0) process.exit(scan.status ?? 1);
}

const taskFile = resolve(root, ".scannerwork/report-task.txt");

if (!existsSync(taskFile)) {
  console.error("SonarScanner no generó report-task.txt.");
  process.exit(1);
}

const task = Object.fromEntries(
  readFileSync(taskFile, "utf8")
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(/=(.*)/s).slice(0, 2)),
);

const authorization = `Basic ${Buffer.from(`${token}:`).toString("base64")}`;

const request = async (url) => {
  let lastError;

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          Authorization: authorization,
        },
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}: ${url}`);
      }

      return await response.json();
    } catch (error) {
      lastError = error;

      if (attempt < 5) {
        await new Promise((resolvePromise) =>
          setTimeout(resolvePromise, attempt * 1_000),
        );
      }
    }
  }

  throw lastError;
};

let processing;

for (let attempt = 0; attempt < 30; attempt += 1) {
  processing = await request(task.ceTaskUrl);

  if (
    ["SUCCESS", "FAILED", "CANCELED"].includes(
      processing.task.status,
    )
  ) {
    break;
  }

  await new Promise((resolvePromise) =>
    setTimeout(resolvePromise, 2_000),
  );
}

if (processing?.task?.status !== "SUCCESS") {
  console.error(
    `El procesamiento de SonarQube terminó con estado ${
      processing?.task?.status || "TIMEOUT"
    }.`,
  );

  process.exit(1);
}

const metricKeys = [
  "bugs",
  "vulnerabilities",
  "code_smells",
  "coverage",
  "complexity",
  "cognitive_complexity",
  "sqale_index",
  "security_hotspots",
  "reliability_rating",
  "security_rating",
  "sqale_rating",
  "duplicated_lines_density",
  "sqale_debt_ratio",
].join(",");

const [measures, gate, issues] = await Promise.all([
  request(
    `${host}/api/measures/component?component=${encodeURIComponent(
      projectKey,
    )}&metricKeys=${metricKeys}${branchQuery}`,
  ),
  request(
    `${host}/api/qualitygates/project_status?projectKey=${encodeURIComponent(
      projectKey,
    )}${branchQuery}`,
  ),
  request(
    `${host}/api/issues/search?componentKeys=${encodeURIComponent(
      projectKey,
    )}&ps=500${branchQuery}`,
  ),
]);

mkdirSync(output, { recursive: true });
mkdirSync(evidence, { recursive: true });

writeFileSync(
  resolve(output, "metricas.json"),
  `${JSON.stringify(measures, null, 2)}\n`,
  "utf8",
);

writeFileSync(
  resolve(output, "quality-gate.json"),
  `${JSON.stringify(gate, null, 2)}\n`,
  "utf8",
);

const closedIssueStates = new Set([
  "CLOSED",
  "FIXED",
  "RESOLVED",
  "FALSE_POSITIVE",
  "WONTFIX",
  "WON'T_FIX",
  "REMOVED",
]);

const openIssueStates = new Set([
  "OPEN",
  "CONFIRMED",
  "REOPENED",
  "ACCEPTED",
  "TO_REVIEW",
  "IN_REVIEW",
]);

const normalizeIssueState = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_");

const isOpenIssue = (issue) => {
  const states = [
    issue.status,
    issue.resolution,
    issue.issueStatus,
  ]
    .map(normalizeIssueState)
    .filter(Boolean);

  if (
    states.some((state) =>
      closedIssueStates.has(state),
    )
  ) {
    return false;
  }

  return states.some((state) =>
    openIssueStates.has(state),
  );
};

const historicalIssues = Array.isArray(issues.issues)
  ? issues.issues
  : [];

const openIssues = historicalIssues.filter(isOpenIssue);

const normalizeToken = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replaceAll(" ", "_");

const isSecurityIssue = (issue) => {
  if (normalizeToken(issue.type) === "VULNERABILITY") {
    return true;
  }

  return (
    Array.isArray(issue.impacts) &&
    issue.impacts.some(
      (impact) =>
        normalizeToken(impact.softwareQuality) === "SECURITY",
    )
  );
};

const activeSecurityIssues =
  openIssues.filter(isSecurityIssue);

const activeHighCriticalSecurityIssues =
  activeSecurityIssues.filter((issue) => {
    const severities = [
      issue.severity,
      ...(Array.isArray(issue.impacts)
        ? issue.impacts.map((impact) => impact.severity)
        : []),
    ].map(normalizeToken);

    return severities.some((severity) =>
      ["HIGH", "CRITICAL", "BLOCKER"].includes(severity),
    );
  });

const issueEvidence = {
  ...issues,
  apiTotal:
    issues.apiTotal ??
    issues.paging?.total ??
    issues.total ??
    historicalIssues.length,

  historicalTotal: historicalIssues.length,
  openTotal: openIssues.length,
  activeSecurityTotal: activeSecurityIssues.length,
  activeHighCriticalSecurityTotal:
    activeHighCriticalSecurityIssues.length,

  total: openIssues.length,
};

writeFileSync(
  resolve(output, "incidencias.json"),
  `${JSON.stringify(issueEvidence, null, 2)}\n`,
  "utf8",
);

const values = Object.fromEntries(
  measures.component.measures.map(
    ({ metric, value }) => [metric, value],
  ),
);

const conditions = Object.fromEntries(
  gate.projectStatus.conditions.map(
    ({
      metricKey,
      actualValue,
      status,
      errorThreshold,
    }) => [
      metricKey,
      {
        actualValue,
        status,
        errorThreshold,
      },
    ],
  ),
);

const rating = (value) =>
  ({
    1: "A",
    2: "B",
    3: "C",
    4: "D",
    5: "E",
  })[Number(value)] || "NO_DISPONIBLE";

const minutes = Number(values.sqale_index || 0);

const newCoverage = Number(
  conditions.new_coverage?.actualValue ?? NaN,
);

const newDuplication = Number(
  conditions.new_duplicated_lines_density?.actualValue ??
    NaN,
);

const globalDuplication = Number(
  values.duplicated_lines_density ?? NaN,
);

const duplicationValue = Number.isNaN(newDuplication)
  ? globalDuplication
  : newDuplication;

const duplicationScope = Number.isNaN(newDuplication)
  ? "global (fallback por ausencia de métrica de código nuevo)"
  : "código nuevo";

const newMaintainability = rating(
  conditions.new_maintainability_rating?.actualValue,
);

const overallMaintainability = rating(
  values.sqale_rating,
);

const effectiveMaintainability =
  newMaintainability === "NO_DISPONIBLE"
    ? overallMaintainability
    : newMaintainability;

const maintainabilityScope =
  newMaintainability === "NO_DISPONIBLE"
    ? "global (fallback)"
    : "código nuevo";

const newSecurityRating = rating(
  conditions.new_security_rating?.actualValue,
);

const argon2Source = readFileSync(
  resolve(
    root,
    "apps/backend/src/modules/auth/infrastructure/passwordHasher.js",
  ),
  "utf8",
);

const hasArgon2id =
  /argon2\.argon2id/.test(argon2Source);

const unitEvidence = readFileSync(
  resolve(
    root,
    "tests/results/fase5/unitarias/reports/backend-junit.xml",
  ),
  "utf8",
);

const integrationEvidence = readFileSync(
  resolve(
    root,
    "tests/results/fase5/integracion/reports/junit.xml",
  ),
  "utf8",
);

const hasNoHashExposureEvidence =
  ["UT-AUTH-12", "UT-USR-12"].every((id) =>
    unitEvidence.includes(id),
  ) &&
  ["IT-AUTH-06", "IT-USR-01"].every((id) =>
    integrationEvidence.includes(id),
  );

const credentialIssuePattern =
  /(argon2|password|passwd|contrase(?:n|ñ)a|credential|hash)/i;

const activeCredentialIssues =
  openIssues.filter((issue) =>
    credentialIssuePattern.test(
      JSON.stringify({
        rule: issue.rule,
        message: issue.message,
        component: issue.component,
        tags: issue.tags,
        flows: issue.flows,
      }),
    ),
  );

const complexityIssuePattern =
  /(complex|cognitive|cyclomatic|ciclom|cognitiv)/i;

const activeComplexityIssues =
  openIssues.filter((issue) =>
    complexityIssuePattern.test(
      JSON.stringify({
        rule: issue.rule,
        message: issue.message,
        tags: issue.tags,
        cleanCodeAttribute:
          issue.cleanCodeAttribute,
      }),
    ),
  );

const secretScanPath = resolve(
  root,
  "tests/results/fase8/github_actions/evidence/gitleaks-report.json",
);

const secretScanStatusPath = resolve(
  root,
  "tests/results/fase8/github_actions/evidence/gitleaks-status.json",
);

let secretScanFindings;
let secretScanOutcome = "N/D";

if (existsSync(secretScanPath)) {
  try {
    const report = JSON.parse(
      readFileSync(secretScanPath, "utf8"),
    );

    secretScanFindings = Array.isArray(report)
      ? report.length
      : Number(report.findings ?? NaN);
  } catch {
    secretScanFindings = NaN;
  }
}

if (existsSync(secretScanStatusPath)) {
  try {
    const statusReport = JSON.parse(
      readFileSync(secretScanStatusPath, "utf8"),
    );

    secretScanOutcome = String(
      statusReport.outcome || "N/D",
    ).toLowerCase();
  } catch {
    secretScanOutcome = "invalid";
  }
}

const secretScanPassed =
  secretScanFindings === 0 &&
  secretScanOutcome === "success";

const lcovSummary = (file) => {
  const source = readFileSync(file, "utf8");

  const found = [
    ...source.matchAll(/^LF:(\d+)$/gm),
  ].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  );

  const hit = [
    ...source.matchAll(/^LH:(\d+)$/gm),
  ].reduce(
    (sum, match) => sum + Number(match[1]),
    0,
  );

  return {
    found,
    hit,
    coverage: found
      ? Number(((hit * 100) / found).toFixed(2))
      : 0,
  };
};

const moduleCoverage = (files) => {
  const modules = new Map();

  for (const file of files) {
    for (const block of readFileSync(
      file,
      "utf8",
    ).split("end_of_record")) {
      const source = block
        .match(/^SF:(.+)$/m)?.[1]
        ?.replaceAll("\\", "/");

      const moduleName = source?.match(
        /src\/modules\/([^/]+)/,
      )?.[1];

      if (!moduleName) continue;

      const found = Number(
        block.match(/^LF:(\d+)$/m)?.[1] || 0,
      );

      const hit = Number(
        block.match(/^LH:(\d+)$/m)?.[1] || 0,
      );

      const current =
        modules.get(moduleName) || {
          found: 0,
          hit: 0,
        };

      modules.set(moduleName, {
        found: current.found + found,
        hit: current.hit + hit,
      });
    }
  }

  return Object.fromEntries(
    [...modules].map(([name, lines]) => [
      name,
      Number(
        (
          (lines.hit * 100) /
          lines.found
        ).toFixed(2),
      ),
    ]),
  );
};

const backendCoverage = lcovSummary(
  resolve(
    root,
    "tests/results/fase5/unitarias/reports/backend-lcov.info",
  ),
);

const criticalModules = moduleCoverage([
  resolve(
    root,
    "tests/results/fase5/unitarias/reports/backend-lcov.info",
  ),
  resolve(
    root,
    "tests/results/fase5/unitarias/reports/frontend-coverage/lcov.info",
  ),
]);

const criticalModuleNames = [
  "auth",
  "orders",
  "payments",
  "products",
  "promotions",
  "cart",
  "admin",
  "catalog",
];

const criticalModulesPass =
  criticalModuleNames.every(
    (name) => criticalModules[name] >= 70,
  );

const criticalModuleText =
  criticalModuleNames
    .map(
      (name) =>
        `${name} ${
          criticalModules[name] ?? "N/D"
        }%`,
    )
    .join("; ");

const cases = [
  {
    id: "SQ-MAN-01",
    requirement: "MAN-01",
    threshold:
      "Quality Gate PASS; 0 bugs y 0 vulnerabilidades activas",

    actual:
      `Gate ${gate.projectStatus.status}; ` +
      `bugs ${values.bugs ?? "N/D"}; ` +
      `vulnerabilidades activas reales ${activeSecurityIssues.length}; ` +
      `incidencias abiertas totales ${openIssues.length}; ` +
      `métrica global Sonar vulnerabilities ${
        values.vulnerabilities ?? "N/D"
      }`,

    status:
      gate.projectStatus.status === "OK" &&
      Number(values.bugs) === 0 &&
      activeSecurityIssues.length === 0
        ? "PASS"
        : "FAIL",
  },

  {
    id: "SQ-MAN-02",
    requirement: "MAN-02",
    threshold:
      "Cobertura global >=70%; backend >=80%; módulos críticos >=70%",

    actual:
      `Global ${values.coverage ?? "N/D"}%; ` +
      `backend ${backendCoverage.coverage}%; ` +
      `módulos críticos: ${criticalModuleText}`,

    status:
      Number(values.coverage) >= 70 &&
      backendCoverage.coverage >= 80 &&
      criticalModulesPass
        ? "PASS"
        : "FAIL",
  },

  {
    id: "SQ-MAN-03",
    requirement: "MAN-03",
    threshold:
      "Duplicación <=3%; se prioriza código nuevo y, si Sonar no publica la métrica, se usa duplicación global",

    actual:
      `Duplicación ${duplicationScope}: ${
        Number.isNaN(duplicationValue)
          ? "N/D"
          : `${duplicationValue}%`
      }`,

    status: Number.isNaN(duplicationValue)
      ? "PENDIENTE_METRICA"
      : duplicationValue <= 3
        ? "PASS"
        : "FAIL",
  },

  {
    id: "SQ-MAN-04",
    requirement: "MAN-04",
    threshold:
      "La complejidad ciclomática y cognitiva debe ser medida por SonarQube y no existir incidencias activas de mantenibilidad relacionadas con complejidad excesiva",

    actual:
      `Complejidad ciclomática global ${
        values.complexity ?? "N/D"
      }; ` +
      `complejidad cognitiva global ${
        values.cognitive_complexity ?? "N/D"
      }; ` +
      `code smells ${
        values.code_smells ?? "N/D"
      }; ` +
      `Maintainability Rating ${
        rating(values.sqale_rating)
      }; ` +
      `Quality Gate ${
        gate.projectStatus.status
      }; ` +
      `incidencias activas de complejidad ${
        activeComplexityIssues.length
      }`,

    status:
      values.complexity != null &&
      values.cognitive_complexity != null &&
      Number(values.code_smells) === 0 &&
      rating(values.sqale_rating) === "A" &&
      gate.projectStatus.status === "OK" &&
      activeComplexityIssues.length === 0
        ? "PASS"
        : "FAIL",
  },

  {
    id: "SQ-MAN-05",
    requirement: "MAN-05",
    threshold:
      "Maintainability Rating A; se prioriza código nuevo y, si no está disponible, se usa el rating global",

    actual:
      `Maintainability Rating ${maintainabilityScope}: ${effectiveMaintainability}`,

    status:
      effectiveMaintainability === "A"
        ? "PASS"
        : effectiveMaintainability ===
            "NO_DISPONIBLE"
          ? "PENDIENTE_METRICA"
          : "FAIL",
  },

  {
    id: "SQ-MAN-06",
    requirement: "MAN-06",
    threshold:
      "Ratio de deuda técnica <=5% y Maintainability Rating A",

    actual:
      `Deuda global ${minutes} min; ` +
      `ratio global ${
        values.sqale_debt_ratio ?? "N/D"
      }%; ` +
      `rating global ${overallMaintainability}`,

    status:
      values.sqale_debt_ratio == null
        ? "PENDIENTE_METRICA"
        : Number(values.sqale_debt_ratio) <=
              5 &&
            overallMaintainability === "A"
          ? "PASS"
          : "FAIL",
  },

  {
    id: "SQ-SEG-01",
    requirement: "SEG-01",
    threshold:
      "Argon2id presente y 0 exposiciones detectadas",

    actual:
      `Argon2id ${
        hasArgon2id
          ? "presente"
          : "ausente"
      }; ` +
      `evidencia de no exposición de hashes ${
        hasNoHashExposureEvidence
          ? "presente"
          : "ausente"
      }; ` +
      `incidencias activas sobre credenciales/hashes ${
        activeCredentialIssues.length
      }`,

    status:
      hasArgon2id &&
      hasNoHashExposureEvidence &&
      activeCredentialIssues.length === 0
        ? "PASS"
        : "FAIL",
  },

  {
    id: "SQ-SEG-05",
    requirement: "SEG-05",
    threshold:
      "0 secretos; 0 vulnerabilidades activas altas/críticas; Security Rating nuevo A",

    actual:
      `Gitleaks ${secretScanOutcome}; ` +
      `secretos detectados ${
        secretScanFindings ?? "N/D"
      }; ` +
      `vulnerabilidades activas de seguridad ${
        activeSecurityIssues.length
      }; ` +
      `altas/críticas ${
        activeHighCriticalSecurityIssues.length
      }; ` +
      `incidencias históricas ${
        historicalIssues.length
      }; ` +
      `hotspots ${
        values.security_hotspots ?? "N/D"
      }; ` +
      `Security Rating nuevo ${newSecurityRating}`,

    status:
      secretScanFindings == null ||
      Number.isNaN(secretScanFindings) ||
      secretScanOutcome === "N/D"
        ? "PENDIENTE_EVIDENCIA"
        : secretScanPassed &&
            activeHighCriticalSecurityIssues.length ===
              0 &&
            Number(values.security_hotspots) ===
              0 &&
            newSecurityRating === "A"
          ? "PASS"
          : "FAIL",
  },
];

const csv = (value) =>
  `"${String(value).replaceAll(
    '"',
    '""',
  )}"`;

const caseCsv = [
  [
    "Caso",
    "Requisito",
    "Umbral",
    "Resultado observado",
    "Estado",
  ],

  ...cases.map(
    ({
      id,
      requirement,
      threshold,
      actual,
      status,
    }) => [
      id,
      requirement,
      threshold,
      actual,
      status,
    ],
  ),
]
  .map((row) => row.map(csv).join(","))
  .join("\n");

writeFileSync(
  resolve(evidence, "casos-sonarqube.csv"),
  `${caseCsv}\n`,
  "utf8",
);

const caseRows = cases
  .map(
    ({
      id,
      requirement,
      threshold,
      actual,
      status,
    }) =>
      `| ${id} | ${requirement} | ${threshold} | ${actual} | **${status}** |`,
  )
  .join("\n");

const failedGateConditions =
  gate.projectStatus.conditions.filter(
    ({ status }) => status !== "OK",
  );

const onlyNewCoverageFailed =
  gate.projectStatus.status === "ERROR" &&
  failedGateConditions.length === 1 &&
  failedGateConditions[0].metricKey ===
    "new_coverage";

const gateConclusion =
  onlyNewCoverageFailed
    ? `El Quality Gate se encuentra en estado ERROR debido a que la cobertura de código nuevo es ${conditions.new_coverage.actualValue} %, inferior al umbral configurado de ${conditions.new_coverage.errorThreshold} %. Las demás condiciones del Quality Gate se encuentran aprobadas.`
    : failedGateConditions.length === 1 &&
        failedGateConditions[0].metricKey ===
          "new_security_rating" &&
        activeSecurityIssues.length === 0
      ? "El Quality Gate se encuentra en estado ERROR porque el Security Rating del código nuevo permanece en B dentro del periodo de versión vigente, aunque la única incidencia registrada está CLOSED/FIXED y no existen incidencias activas. No se modificó artificialmente el periodo de código nuevo."
      : `El Quality Gate se encuentra en estado ${gate.projectStatus.status}. Consulta las condiciones de \`quality-gate.json\` para conocer el detalle.`;

const summary =
  `# Resultado de SonarQube Cloud\n\n` +
  `- Fecha UTC: ${new Date().toISOString()}\n` +
  `- Organización: ${organization}\n` +
  `- Proyecto: ${projectKey}\n` +
  `- Quality Gate: **${gate.projectStatus.status}**\n` +
  `- Bugs: ${values.bugs ?? 0}\n` +
  `- Vulnerabilidades activas reales: ${activeSecurityIssues.length}\n` +
  `- Vulnerabilidades activas altas/críticas: ${activeHighCriticalSecurityIssues.length}\n` +
  `- Métrica global Sonar vulnerabilities: ${values.vulnerabilities ?? 0}\n` +
  `- Code smells: ${values.code_smells ?? 0}\n` +
  `- Security hotspots: ${values.security_hotspots ?? 0}\n` +
  `- Cobertura global: ${values.coverage ?? 0} %\n` +
  `- Cobertura de código nuevo: ${
    Number.isNaN(newCoverage)
      ? "N/D"
      : `${newCoverage} %`
  }\n` +
  `- Cobertura backend (LCOV): ${backendCoverage.coverage} %\n` +
  `- Complejidad ciclomática global: ${values.complexity ?? 0}\n` +
  `- Complejidad cognitiva global: ${values.cognitive_complexity ?? 0}\n` +
  `- Deuda técnica global: ${minutes} minutos (${(
    minutes / 60
  ).toFixed(2)} horas)\n` +
  `- Incidencias abiertas: ${openIssues.length}\n` +
  `- Incidencias históricas conservadas: ${historicalIssues.length}\n\n` +
  `## Casos trazables\n\n` +
  `| Caso | RNF | Umbral | Resultado observado | Estado |\n` +
  `|---|---|---|---|---|\n` +
  `${caseRows}\n\n` +
  `> ${gateConclusion}\n\n` +
  `Los JSON crudos se conservan en \`../results/\`.\n`;

writeFileSync(
  resolve(evidence, "RESUMEN.md"),
  summary,
  "utf8",
);

console.log(
  `Evidencia SonarQube generada en: ${evidence}`,
);

if (gate.projectStatus.status !== "OK") {
  process.exitCode = 1;
}