import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plan = readFileSync(resolve(root, "docs/PLAN_MAESTRO_PRUEBAS_FASE_5.md"), "utf8");
const pattern = /^\| (AT-\d{2}) \| (RF-\d{2}) \| (.*?) \| (P[0-2]) \|$/gm;
const cases = [...plan.matchAll(pattern)].map((match) => ({ id: match[1], requirement: match[2], criterion: match[3], priority: match[4] }));
const expected = Array.from({ length: 30 }, (_, index) => `AT-${String(index + 1).padStart(2, "0")}`);
if (cases.length !== 30 || new Set(cases.map((item) => item.id)).size !== 30 || expected.some((id) => !cases.some((item) => item.id === id))) {
  throw new Error(`Matriz de aceptación inválida: se esperaban 30 casos y se encontraron ${cases.length}.`);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = resolve(root, "tests/reports/acceptance", timestamp);
mkdirSync(output, { recursive: true });
const quote = (value) => `"${String(value).replaceAll('"', '""')}"`;
const header = ["ID", "Requisito", "Prioridad", "Criterio Dado/Cuando/Entonces", "Resultado", "Comentario del evaluador", "Defecto", "Evidencia", "Evaluador", "Rol", "Fecha UTC"];
const rows = cases.map((item) => [item.id, item.requirement, item.priority, item.criterion, "NO_EJECUTADO", "", "", `evidencias/${item.id}/`, "", "", ""]);
writeFileSync(resolve(output, "matriz-aceptacion.csv"), [header, ...rows].map((row) => row.map(quote).join(",")).join("\n") + "\n", "utf8");
for (const item of cases) mkdirSync(resolve(output, "evidencias", item.id), { recursive: true });

const command = (args) => { try { return execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim(); } catch { return "NO_DISPONIBLE"; } };
const commit = command(["rev-parse", "HEAD"]);
const status = command(["status", "--short"]) || "CLEAN";
const p0 = cases.filter((item) => item.priority === "P0").length;
const p1 = cases.filter((item) => item.priority === "P1").length;
const p2 = cases.filter((item) => item.priority === "P2").length;

const act = `# Acta de aceptación — El Poblano

## Identificación

- Fecha de creación UTC: ${new Date().toISOString()}
- Commit: ${commit}
- Estado inicial: ${status === "CLEAN" ? "CLEAN" : "CAMBIOS SIN COMMIT"}
- Versión demostrada:
- URL/ambiente:
- Ejecutor:
- Responsable de calidad:
- Evaluador/Product Owner:
- Rol del evaluador:

## Resumen

- Casos planificados: 30
- Prioridad P0: ${p0}
- Prioridad P1: ${p1}
- Prioridad P2: ${p2}
- Ejecutados: 0
- Aceptados: 0
- Rechazados: 0
- Bloqueados: 0
- No ejecutados: 30
- Resultado general: PENDIENTE DE EVALUACIÓN

## Decisión

- [ ] Aceptado sin observaciones
- [ ] Aceptado con observaciones registradas
- [ ] No aceptado

Observaciones y condiciones:

## Conformidad

- Nombre del evaluador:
- Rol:
- Firma o confirmación:
- Fecha:
- Nombre del responsable de calidad:
- Firma o confirmación:
`;
writeFileSync(resolve(output, "acta-conformidad.md"), act, "utf8");
writeFileSync(resolve(output, "commit.txt"), `${commit}\n`, "utf8");
writeFileSync(resolve(output, "estado-repositorio.txt"), `${status}\n`, "utf8");
writeFileSync(resolve(output, "instrucciones.txt"), "Complete la matriz durante una demostración con evaluador. No marque ACEPTADO sin su conformidad ni incluya secretos en evidencias.\n", "utf8");
console.log(`Expediente de aceptación creado con ${cases.length} casos en:\n${output}`);

