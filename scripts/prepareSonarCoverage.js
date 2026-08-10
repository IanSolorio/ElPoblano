import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const source = resolve(root, "tests/results/fase5/cobertura-unitarias.lcov");
const destinationDirectory = resolve(root, "tests/results/fase7");
const destination = resolve(destinationDirectory, "cobertura.lcov");

if (!existsSync(source)) {
  console.error("No existe la cobertura de la Fase 5. Ejecuta primero las pruebas unitarias con cobertura.");
  process.exit(1);
}

const normalized = readFileSync(source, "utf8")
  .replace(/^SF:src[\\/]/gm, "SF:apps/backend/src/")
  .replace(/^SF:\.\.[\\/]frontend[\\/]src[\\/]/gm, "SF:apps/frontend/src/")
  .replaceAll("\\", "/");

mkdirSync(destinationDirectory, { recursive: true });
writeFileSync(destination, normalized, "utf8");
console.log(`Cobertura preparada para SonarQube: ${destination}`);

