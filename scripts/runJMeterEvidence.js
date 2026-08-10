import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import { delimiter, resolve } from "node:path";

const root = process.cwd();
const candidates = [process.env.JMETER_HOME && resolve(process.env.JMETER_HOME, "bin", "jmeter.bat"), ...String(process.env.PATH || "").split(delimiter).map((part) => resolve(part, "jmeter.bat"))].filter(Boolean);
const executable = candidates.find(existsSync);
if (!executable) {
  console.error("JMeter no está instalado o JMETER_HOME no está configurado. Instala Apache JMeter y vuelve a ejecutar este comando.");
  process.exit(1);
}
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = resolve(root, "tests/reports/jmeter", timestamp); const dashboard = resolve(output, "dashboard");
mkdirSync(output, { recursive: true });
const url = new URL(process.env.JMETER_BASE_URL || "http://localhost:3000");
const args = ["-n", "-t", resolve(root, "tests/jmeter/elpoblano-api-load.jmx"), "-l", resolve(output, "resultados.jtl"), "-j", resolve(output, "jmeter.log"), "-e", "-o", dashboard, `-Jprotocol=${url.protocol.slice(0, -1)}`, `-Jhost=${url.hostname}`, `-Jport=${url.port || (url.protocol === "https:" ? "443" : "80")}`, `-Jthreads=${process.env.JMETER_THREADS || "10"}`, `-Jramp=${process.env.JMETER_RAMP || "10"}`, `-Jduration=${process.env.JMETER_DURATION || "60"}`];
const result = spawnSync(executable, args, { cwd: root, stdio: "inherit" });
console.log(`Evidencia JMeter: ${output}`); process.exitCode = result.status ?? 1;

