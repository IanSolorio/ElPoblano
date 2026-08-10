import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const planPath = resolve(root, "docs/PLAN_MAESTRO_PRUEBAS_FASE_5.md");
const plan = readFileSync(planPath, "utf8");
const pattern = /^\| (ST-(?:E2E|NF)-\d{2}) \| (.*?) \| (.*?) \| (P[0-2]) \|$/gm;
const cases = [...plan.matchAll(pattern)].map((match) => ({ id: match[1], scenario: match[2], expected: match[3], priority: match[4] }));

const expectedIds = [
  ...Array.from({ length: 40 }, (_, index) => `ST-E2E-${String(index + 1).padStart(2, "0")}`),
  ...Array.from({ length: 8 }, (_, index) => `ST-NF-${String(index + 1).padStart(2, "0")}`),
];
const actualIds = cases.map((item) => item.id);
if (cases.length !== 48 || expectedIds.some((id) => !actualIds.includes(id)) || new Set(actualIds).size !== 48) {
  throw new Error(`Matriz inválida: se esperaban 48 identificadores únicos y se encontraron ${cases.length}.`);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const output = resolve(root, "tests/reports/system", timestamp);
mkdirSync(output, { recursive: true });

const escapeCsv = (value) => `"${String(value).replaceAll('"', '""')}"`;
const header = ["ID", "Prioridad", "Escenario", "Resultado esperado", "Resultado", "Resultado observado", "Defecto", "Evidencia", "Responsable", "Fecha UTC"];
const rows = cases.map((item) => [item.id, item.priority, item.scenario, item.expected, "NO_EJECUTADO", "", "", `evidencias/${item.id}/`, "", ""]);
writeFileSync(resolve(output, "matriz-ejecucion.csv"), [header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n") + "\n", "utf8");

for (const item of cases) mkdirSync(resolve(output, "evidencias", item.id), { recursive: true });

let commit = "NO_DISPONIBLE";
let status = "NO_DISPONIBLE";
try { commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(); } catch {}
try { status = execFileSync("git", ["status", "--short"], { cwd: root, encoding: "utf8" }).trim() || "CLEAN"; } catch {}

const summary = `# Acta de ejecución — pruebas de sistema

- Fecha de creación UTC: ${new Date().toISOString()}
- Commit: ${commit}
- Estado inicial del repositorio: ${status === "CLEAN" ? "CLEAN" : "CAMBIOS SIN COMMIT (consultar estado-repositorio.txt)"}
- Casos planificados: 48
- Casos ejecutados: 0
- Aprobados: 0
- Fallidos: 0
- Bloqueados: 0
- No ejecutados: 48
- Resultado general: PENDIENTE DE EJECUCIÓN

## Ambiente

- URL frontend:
- URL backend:
- Base de datos de prueba:
- Navegador y versión:
- Sistema operativo:
- Responsable:

## Cierre

- Defectos críticos abiertos:
- Observaciones:
- Firma del responsable:
- Fecha de cierre:
`;
writeFileSync(resolve(output, "acta-ejecucion.md"), summary, "utf8");
writeFileSync(resolve(output, "estado-repositorio.txt"), `${status}\n`, "utf8");
writeFileSync(resolve(output, "commit.txt"), `${commit}\n`, "utf8");
writeFileSync(resolve(output, "instrucciones.txt"), "Complete matriz-ejecucion.csv, coloque evidencias en cada carpeta y actualice acta-ejecucion.md. No incluya secretos.\n", "utf8");

console.log(`Expediente creado con ${cases.length} casos en:\n${output}`);
