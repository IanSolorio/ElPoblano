import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repositoryRoot = resolve(backendRoot, "../..");
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const reportDirectory = resolve(repositoryRoot, "tests/reports/unit", timestamp);
mkdirSync(reportDirectory, { recursive: true });

const node = process.execPath;
const tests = "tests/*.test.js";
const coverageArguments = [
  "--experimental-test-coverage",
  "--test-coverage-include=src/**/*.js",
  "--test-coverage-include=../frontend/src/modules/cart/**/*.js",
  "--test-coverage-exclude=src/server.js",
];

const execute = (arguments_, outputFile) => {
  const result = spawnSync(node, arguments_, { cwd: backendRoot, encoding: "utf8" });
  const output = `${result.stdout || ""}${result.stderr || ""}`;
  if (outputFile) writeFileSync(outputFile, output, "utf8");
  return { ...result, output };
};

const consoleResult = execute(["--test", ...coverageArguments, tests], resolve(reportDirectory, "resultado-consola.txt"));
process.stdout.write(consoleResult.output);

const junitPath = resolve(reportDirectory, "junit.xml");
const junitResult = execute(["--test", "--test-reporter=junit", `--test-reporter-destination=${junitPath}`, tests]);

const lcovPath = resolve(reportDirectory, "lcov.info");
const lcovResult = execute(["--test", ...coverageArguments, "--test-reporter=lcov", `--test-reporter-destination=${lcovPath}`, tests]);

const command = (executable, arguments_) => spawnSync(executable, arguments_, { cwd: repositoryRoot, encoding: "utf8", shell: process.platform === "win32" }).stdout.trim();
const commit = command("git", ["rev-parse", "HEAD"]);
const gitStatus = command("git", ["status", "--short"]);
const npmVersion = command("npm", ["--version"]);
writeFileSync(resolve(reportDirectory, "commit.txt"), `${commit}\n`, "utf8");
writeFileSync(resolve(reportDirectory, "git-status.txt"), `${gitStatus || "CLEAN"}\n`, "utf8");
writeFileSync(resolve(reportDirectory, "node-version.txt"), `${process.version}\n`, "utf8");
writeFileSync(resolve(reportDirectory, "npm-version.txt"), `${npmVersion}\n`, "utf8");
writeFileSync(resolve(reportDirectory, "fecha.txt"), `${new Date().toISOString()}\n`, "utf8");

const junit = readFileSync(junitPath, "utf8");
const executed = (junit.match(/<testcase\b/g) || []).length;
const failed = (junit.match(/<failure\b/g) || []).length;
const passed = executed - failed;
const coverage = consoleResult.output.match(/all files\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)\s*\|\s*([\d.]+)/);
const summary = `# Evidencia de pruebas unitarias

- Fecha UTC: ${new Date().toISOString()}
- Commit: ${commit}
- Estado del repositorio: ${gitStatus ? "CAMBIOS SIN COMMIT (consultar git-status.txt)" : "CLEAN"}
- Node.js: ${process.version}
- npm: ${npmVersion}
- Casos planificados: 104
- Casos implementados: ${executed}
- Casos ejecutados: ${executed}
- Aprobados: ${passed}
- Fallidos: ${failed}
- Cobertura de líneas: ${coverage?.[1] ?? "consultar resultado-consola.txt"} %
- Cobertura de ramas: ${coverage?.[2] ?? "consultar resultado-consola.txt"} %
- Cobertura de funciones: ${coverage?.[3] ?? "consultar resultado-consola.txt"} %
- Resultado: ${failed === 0 && executed === 104 ? "APROBADO" : "NO APROBADO"}

## Archivos

- \`resultado-consola.txt\`: ejecución legible y tabla de cobertura.
- \`junit.xml\`: resultado estructurado por identificador UT.
- \`lcov.info\`: cobertura importable por SonarQube.
- \`commit.txt\`, \`git-status.txt\`, \`node-version.txt\`, \`npm-version.txt\` y \`fecha.txt\`: trazabilidad del entorno.
`;
writeFileSync(resolve(reportDirectory, "resumen.md"), summary, "utf8");

console.log(`\nEvidencia generada en: ${reportDirectory}`);
if (consoleResult.status !== 0 || junitResult.status !== 0 || lcovResult.status !== 0 || executed !== 104 || failed !== 0) process.exitCode = 1;
