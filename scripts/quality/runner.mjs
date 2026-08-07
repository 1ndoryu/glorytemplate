#!/usr/bin/env node
// Puerta única del quality gate: npm run task:check -- <TareaId> [modos]
//
// Modos (quality.config.json → modes):
//   local-light (por defecto): analyze + varsense + stack del alcance afectado.
//   --full / --ci: analyze + varsense + stack completo (pesada).
//
// Pesadas: cooldown de 180 minutos y un proceso por proyecto; `--allow-heavy`
// es la excepción auditable (se registra en .quality-reports/.cache/gate.json).
//
// Flujo: preflight → analyze → varsense → stack (alcance) → reporter
// (≤3 hallazgos + 4 recordatorios en terminal; reporte completo en .quality-reports/).
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { ROOT, readJson, sentinel, sentinelRuntimeRoot } from './common.mjs';
import { affectedStacks } from './scope.mjs';
import { acquireProjectLock, releaseProjectLock, isHeavyCooldown, markHeavyRun, heavyKeyFor } from './cache.mjs';
import { summarize } from './reporter.mjs';

const USAGE = 'Uso: npm run task:check -- <TareaId> [--full|--ci|--allow-heavy|--dry-run]';
const args = process.argv.slice(2);
const first = args[0] ?? '';
if (!first || first.startsWith('-')) {
  console.error(USAGE);
  process.exit(2);
}
const [taskId, ...flags] = args;

const qconfig = readJson('quality.config.json') ?? {};
const heavyCfg = qconfig.heavyRun ?? { cooldownMinutes: 180, allowHeavyFlag: '--allow-heavy' };
const mode = flags.includes('--full') ? 'full' : flags.includes('--ci') ? 'ci' : 'light';
const allowHeavy = flags.includes('--allow-heavy');
const dryRun = flags.includes('--dry-run');
const forwarded = dryRun ? ['--dry-run'] : [];
const heavy = mode !== 'light'; // stack completo en full/ci

/* 0. Un proceso por proyecto. */
const lock = acquireProjectLock();
if (!lock.ok) {
  console.error(`[quality] otro gate en ejecución (pid ${lock.pid}): un proceso por proyecto.`);
  process.exit(2);
}

let exitCode = 1;
try {
  /* 1. Cooldown de pesadas (salvo --allow-heavy o dry-run). */
  const heavyKey = heavyKeyFor('stack-full', heavyCfg);
  if (heavy && !dryRun && !allowHeavy && isHeavyCooldown(heavyKey, heavyCfg.cooldownMinutes)) {
    console.error(`[quality] stack completo en cooldown (${heavyCfg.cooldownMinutes} min): usa ${heavyCfg.allowHeavyFlag} (excepción auditable) o espera.`);
    process.exit(2);
  }

  /* 2. Alcance: en local-light el stack solo corre si frontend está afectado. */
  const stacks = affectedStacks();
  const stackNeeded = heavy || stacks.includes('frontend');
  if (!stackNeeded) {
    console.log(`[quality] modo ${mode}: sin cambios en frontend (afectado: ${stacks.length ? stacks.join(', ') : 'ninguno'}) — etapa stack omitida.`);
  }

  /* 3. Etapas declarativas. {reportPath} lo sustituye el runtime por
        <reportRoot>/<etapa>.json (reportRoot = .quality-reports/check/<taskId>). */
  const stages = [];
  const runtimeRoot = sentinelRuntimeRoot();
  if (runtimeRoot) {
    stages.push({
      name: 'analyze',
      executable: process.execPath,
      args: [path.join(runtimeRoot, 'current.js'), 'analyze', '--workspace', ROOT, '--format', 'json', '--output', '{reportPath}'],
      expectedSchemaVersion: '1',
      timeoutMs: qconfig.timeouts?.analyzerMs ?? 300_000,
    });
  } else {
    console.warn('[quality] aviso: no se resolvió el runtime de Sentinel; la etapa analyze se omite.');
  }

  const varsenseCli = path.join(ROOT, '.agent', 'varsense', 'dist', 'cli', 'index.js');
  if (fs.existsSync(varsenseCli)) {
    stages.push({
      name: 'varsense',
      executable: process.execPath,
      args: [varsenseCli, 'scan', '--workspace', ROOT, '--format', 'json', '--output', '{reportPath}'],
      expectedSchemaVersion: '1',
      timeoutMs: qconfig.timeouts?.varsenseMs ?? 300_000,
    });
  } else {
    console.warn('[quality] aviso: varsense sin dist (npm run quality:setup); la etapa varsense se omite.');
  }

  if (stackNeeded) {
    stages.push({
      name: 'stack-typecheck',
      executable: process.execPath,
      args: [path.join(ROOT, 'scripts', 'quality', 'stage-typecheck.mjs'), '--report', '{reportPath}'],
      timeoutMs: qconfig.timeouts?.stackMs ?? 600_000,
    });
  }

  if (stages.length === 0) {
    console.error('[quality] sin etapas: revisa el runtime de Sentinel y el dist de varsense.');
    process.exit(2);
  }

  const stagesPath = path.join(os.tmpdir(), `glory-quality-stages-${taskId}.json`);
  fs.writeFileSync(stagesPath, JSON.stringify(stages, null, 2), 'utf8');

  /* 4. Gate. */
  const cmd = ['check', taskId, '--workspace', ROOT, '--stages', stagesPath, ...forwarded];
  console.log(`\x1b[36m[quality]\x1b[0m modo=${mode} sentinel check ${taskId} ${forwarded.join(' ')}`);
  const res = sentinel(cmd, { capture: false });

  if (heavy && !dryRun) markHeavyRun(heavyKey, { allow: allowHeavy });

  /* 5. Reporter: ≤3 hallazgos + 4 recordatorios. */
  summarize(taskId, ROOT);
  exitCode = res.status ?? 1;
} finally {
  releaseProjectLock();
}
process.exit(exitCode);
