#!/usr/bin/env node
// Verificación del guard: comprueba que los comandos directos bloqueados
// (guard.blockedProbes de quality.config.json, por defecto npm run type-check)
// son interceptados por el shim (blocked/observed) y que los libres
// (guard.freeProbes, por defecto npm run dev) NO se bloquean.
import { ROOT, readJson, sentinel } from './common.mjs';

const qconfig = readJson('quality.config.json') ?? {};
const guardCfg = qconfig.guard ?? {};
const blockedProbes = guardCfg.blockedProbes ?? ['type-check'];
const freeProbes = guardCfg.freeProbes ?? ['dev'];

function probe(args) {
  return sentinel(['guard', '--executable', 'npm', '--project-root', ROOT, '--json', '--', 'npm', ...args]);
}

let allOk = true;
console.log('=== Quality gate: guard (self-probe) ===');

for (const script of blockedProbes) {
  const res = probe(['run', script]);
  let b = null;
  try {
    b = JSON.parse(res.out);
  } catch {
    b = null;
  }
  console.log(`  npm run ${script} → bloqueado=${String(b?.blocked)} observado=${String(b?.observed)} exit=${res.code}`);
  if (!b || (b.blocked !== true && !b.observed)) {
    console.error(`\nEl guard no está interceptando npm run ${script}. Revisa sentinel.config.json (guard.directCommands) y los shims del runtime.`);
    allOk = false;
  }
}

for (const script of freeProbes) {
  const res = probe(['run', script]);
  let d = null;
  try {
    d = JSON.parse(res.out);
  } catch {
    d = null;
  }
  console.log(`  npm run ${script} → bloqueado=${String(d?.blocked)} (debe ser false)`);
  if (d?.blocked) {
    console.error(`\nEl guard está bloqueando npm run ${script}: revisa guard.directCommands.npmScripts.`);
    allOk = false;
  }
}

if (allOk) {
  console.log('\nGuard OK: comandos gateados pasan por sentinel check; los libres quedan sin bloquear.');
}
process.exit(allOk ? 0 : 1);
