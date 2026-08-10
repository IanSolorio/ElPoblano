import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { delimiter, dirname, resolve } from "node:path";

const root = process.cwd();
const candidates = [
  process.env.JMETER_HOME && resolve(process.env.JMETER_HOME, "bin", "jmeter.bat"),
  process.env.LOCALAPPDATA && resolve(process.env.LOCALAPPDATA, "ElPoblanoTools", "apache-jmeter-5.6.3", "bin", "jmeter.bat"),
  ...String(process.env.PATH || "").split(delimiter).map((part) => resolve(part, "jmeter.bat")),
].filter(Boolean);
const executable = candidates.find(existsSync);
if (!executable) {
  console.error("JMeter no está instalado o JMETER_HOME no está configurado. Instala Apache JMeter y vuelve a ejecutar este comando.");
  process.exit(1);
}
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = resolve(root, "tests/results/fase6/jmeter", timestamp); const dashboard = resolve(output, "dashboard");
mkdirSync(output, { recursive: true });
const url = new URL(process.env.JMETER_BASE_URL || "http://localhost:3000");
const args = ["-n", "-t", resolve(root, "tests/jmeter/elpoblano-api-load.jmx"), "-l", resolve(output, "resultados.jtl"), "-j", resolve(output, "jmeter.log"), "-e", "-o", dashboard, `-Jprotocol=${url.protocol.slice(0, -1)}`, `-Jhost=${url.hostname}`, `-Jport=${url.port || (url.protocol === "https:" ? "443" : "80")}`, `-Jthreads=${process.env.JMETER_THREADS || "25"}`, `-Jramp=${process.env.JMETER_RAMP || "5"}`];
const jmeterJar = resolve(dirname(executable), "ApacheJMeter.jar");
if (!existsSync(jmeterJar)) {
  console.error(`La instalación de JMeter está incompleta: falta ${jmeterJar}`);
  process.exit(1);
}
const result = spawnSync("java", ["-jar", jmeterJar, ...args], { cwd: root, stdio: "inherit" });
if (result.error) console.error(result.error.message);
if (result.status === 0) {
  const statistics = JSON.parse(readFileSync(resolve(dashboard, "statistics.json"), "utf8"));
  const catalog = statistics["GET productos"];
  const maxP95 = Number(process.env.JMETER_MAX_P95_MS || 800);
  const maxErrorPct = Number(process.env.JMETER_MAX_ERROR_PCT || 1);
  const summary = {
    executedAt: new Date().toISOString(),
    target: url.origin,
    threads: Number(process.env.JMETER_THREADS || 25),
    samples: catalog.sampleCount,
    p95Ms: Math.round(catalog.pct2ResTime * 100) / 100,
    errorPct: catalog.errorPct,
    throughputPerSecond: catalog.throughput,
    thresholds: { maxP95Ms: maxP95, maxErrorPct },
    passed: catalog.pct2ResTime <= maxP95 && catalog.errorPct <= maxErrorPct,
  };
  writeFileSync(resolve(output, "resumen.json"), `${JSON.stringify(summary, null, 2)}\n`, "utf8");
  writeFileSync(resolve(output, "RESUMEN.md"), `# Resultado JMeter\n\n- Objetivo: ${summary.target}\n- Usuarios concurrentes: ${summary.threads}\n- Muestras: ${summary.samples}\n- Percentil 95: ${summary.p95Ms} ms (máximo ${maxP95} ms)\n- Errores: ${summary.errorPct.toFixed(2)} % (máximo ${maxErrorPct} %)\n- Rendimiento: ${summary.throughputPerSecond.toFixed(2)} solicitudes/s\n- Resultado: **${summary.passed ? "APROBADO" : "NO APROBADO"}**\n`, "utf8");
  if (!summary.passed) process.exitCode = 1;
} else {
  process.exitCode = result.status ?? 1;
}
console.log(`Evidencia JMeter: ${output}`);
