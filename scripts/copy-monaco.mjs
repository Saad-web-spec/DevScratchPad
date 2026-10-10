// Copies the Monaco Editor AMD build into public/monaco/vs so the editor is served same-origin
// instead of from cdn.jsdelivr.net (faster first load, no third-party request, tighter CSP).
// Runs automatically via the `predev` / `prebuild` npm hooks; public/monaco is gitignored.
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const pkgPath = require.resolve("monaco-editor/package.json", { paths: [root] });
const { version } = JSON.parse(readFileSync(pkgPath, "utf8"));

const source = join(dirname(pkgPath), "min", "vs");
const target = join(root, "public", "monaco", "vs");
const marker = join(root, "public", "monaco", ".version");

if (existsSync(marker) && readFileSync(marker, "utf8").trim() === version && existsSync(target)) {
  console.log(`[copy-monaco] monaco-editor ${version} already in public/monaco`);
  process.exit(0);
}

rmSync(join(root, "public", "monaco"), { recursive: true, force: true });
cpSync(source, target, { recursive: true });
writeFileSync(marker, version);
console.log(`[copy-monaco] copied monaco-editor ${version} to public/monaco/vs`);
