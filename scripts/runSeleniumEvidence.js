import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = resolve(root, "tests/results/fase6/selenium", timestamp);
mkdirSync(output, { recursive: true });

const healthUrl = `${(process.env.E2E_BASE_URL || "http://localhost:5173").replace(/\/$/, "")}/`;
try {
  const response = await fetch(healthUrl);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
} catch (error) {
  console.error(`El frontend no está disponible en ${healthUrl}. Ejecuta npm.cmd run dev antes de Selenium.\n${error.message}`);
  process.exit(1);
}

const junit = resolve(output, "junit.xml");
const args = ["--test", "--test-concurrency=1", "--test-reporter=spec", "--test-reporter-destination=stdout", "--test-reporter=junit", `--test-reporter-destination=${junit}`, "tests/selenium/*.selenium.test.js"];
const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit", env: { ...process.env, E2E_REPORT_DIR: output } });
writeFileSync(resolve(output, "entorno.txt"), `Fecha UTC: ${new Date().toISOString()}\nURL: ${healthUrl}\nNode: ${process.version}\nHeadless: ${process.env.E2E_HEADLESS !== "false"}\n`, "utf8");
console.log(`Evidencia Selenium: ${output}`);
process.exitCode = result.status ?? 1;
