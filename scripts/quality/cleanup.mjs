#!/usr/bin/env node
// Limpieza de artefactos operativos del gate.
//   npm run quality:reports:cleanup            → dry-run (lista .quality-reports/)
//   npm run quality:reports:cleanup:dry        → idem, explícito (diagnóstico de la skill)
//   npm run quality:reports:cleanup -- --force → elimina .quality-reports/
//   npm run quality:cleanup -- --force         → además lista .sentinel/worktrees (no borra metadata)
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, printOk, printWarn } from './common.mjs';

const args = process.argv.slice(2);
const force = args.includes('--force') && !args.includes('--dry');
const target = args.includes('reports') ? 'reports' : 'all';

const reportsDir = path.resolve(ROOT, '.quality-reports');
const sentinelDir = path.resolve(ROOT, '.sentinel');

function listRecursive(dir, prefix = '') {
  if (!fs.existsSync(dir)) return 0;
  let count = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      count += listRecursive(full, `${prefix}${entry.name}/`);
    } else {
      count += 1;
      if (!force) console.log(`  ${prefix}${entry.name}`);
    }
  }
  return count;
}

console.log('=== Quality cleanup (dry-run por defecto) ===');
if (target === 'reports' || target === 'all') {
  const n = listRecursive(reportsDir, '.quality-reports/');
  if (force && fs.existsSync(reportsDir)) {
    fs.rmSync(reportsDir, { recursive: true, force: true });
    printOk('.quality-reports/ eliminado');
  } else {
    console.log(`  .quality-reports/: ${n} archivo(s) ${force ? '(eliminados)' : '(dry-run)'}`);
  }
}
if (target === 'all') {
  const worktrees = path.join(sentinelDir, 'worktrees');
  const n = fs.existsSync(worktrees) ? listRecursive(worktrees, '.sentinel/worktrees/') : 0;
  console.log(`  .sentinel/worktrees/: ${n} archivo(s) — metadata de coordinación, no se borra automáticamente`);
  if (force && n > 0) printWarn('.sentinel/ no se elimina aquí: usa sentinel task cleanup para tareas registradas');
}
console.log(force ? 'Cleanup: OK' : 'Cleanup: dry-run (usa --force para aplicar)');
process.exit(0);
