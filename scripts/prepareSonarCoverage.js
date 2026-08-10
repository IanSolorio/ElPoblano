import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const backendSource = resolve(root, "tests/results/fase5/cobertura-unitarias.lcov");
const frontendSource = resolve(root, "tests/results/fase7/frontend-coverage/lcov.info");
const destinationDirectory = resolve(root, "tests/results/fase7");
const destination = resolve(destinationDirectory, "cobertura.lcov");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

for (const args of [
  ["run", "test:unit:evidence", "-w", "@elpoblano/backend"],
  ["run", "test:coverage", "-w", "@elpoblano/frontend"],
]) {
  const result = spawnSync(npm, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
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
