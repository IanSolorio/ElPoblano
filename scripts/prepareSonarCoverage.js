import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const unitReports = resolve(root, "tests/results/fase5/unitarias/reports");
const backendSource = resolve(unitReports, "backend-lcov.info");
const frontendCoverageDirectory = resolve(unitReports, "frontend-coverage");
const frontendSource = resolve(frontendCoverageDirectory, "lcov.info");
const destinationDirectory = resolve(root, "tests/results/fase7/sonarqube/results");
const destination = resolve(destinationDirectory, "cobertura.lcov");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

mkdirSync(unitReports, { recursive: true });
for (const { command, args, cwd = root } of [
  {
    command: process.execPath,
    cwd: resolve(root, "apps/backend"),
    args: [
      "--test", "--experimental-test-coverage",
      "--test-coverage-include=src/**/*.js", "--test-coverage-include=../frontend/src/modules/cart/**/*.js",
      "--test-coverage-exclude=src/server.js", "--test-reporter=lcov",
      `--test-reporter-destination=${backendSource}`, "tests/*.test.js",
    ],
  },
  {
    command: npm,
    args: [
      "run", "test:coverage", "-w", "@elpoblano/frontend", "--",
      "--coverage.reportsDirectory=../../tests/results/fase5/unitarias/reports/frontend-coverage",
    ],
  },
]) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32" && command.endsWith(".cmd"),
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

if (!existsSync(backendSource) || !existsSync(frontendSource)) {
  console.error("No se pudieron generar los reportes LCOV de backend y frontend.");
  process.exit(1);
}

const backendCoverage = readFileSync(backendSource, "utf8")
  .replace(/^SF:src[\\/]/gm, "SF:apps/backend/src/")
  .replace(/^SF:\.\.[\\/]frontend[\\/]src[\\/]/gm, "SF:apps/frontend/src/")
  .replaceAll("\\", "/");
const frontendCoverage = readFileSync(frontendSource, "utf8")
  .replace(/^SF:src[\\/]/gm, "SF:apps/frontend/src/")
  .replaceAll("\\", "/");
const combinedCoverage = `${backendCoverage.trim()}\n${frontendCoverage.trim()}\n`;

mkdirSync(destinationDirectory, { recursive: true });
writeFileSync(destination, combinedCoverage, "utf8");
console.log(`Cobertura combinada preparada para SonarQube: ${destination}`);
