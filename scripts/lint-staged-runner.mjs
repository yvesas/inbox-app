// Roda Prettier (--write) e ESLint (--fix) usando o ferramental DA PRÓPRIA app,
// para que cada uma use sua config (backend: eslint flat v10; frontend: eslint-next).
//
// lint-staged invoca: node scripts/lint-staged-runner.mjs <app> <arquivo...>
// onde os arquivos vêm como caminhos relativos à raiz (ex.: backend/src/x.ts).
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const [app, ...files] = process.argv.slice(2);
if (!app || files.length === 0) process.exit(0);

// Caminhos relativos à pasta da app (lint-staged passa relativos à raiz).
const rel = files.map((f) => path.relative(app, f));

function runIfAvailable(bin, args) {
  // Absoluto: execFileSync resolve o binário relativo ao cwd (app), o que quebraria.
  const binPath = path.resolve(app, "node_modules", ".bin", bin);
  if (!existsSync(binPath)) {
    console.warn(`[lint-staged] ${bin} não instalado em ${app} — pulando.`);
    return;
  }
  // stdio inherit + sem shell: erros de lint não-corrigíveis abortam o commit.
  execFileSync(binPath, [...args, ...rel], { cwd: app, stdio: "inherit" });
}

runIfAvailable("prettier", ["--write"]);
runIfAvailable("eslint", ["--fix"]);
