// Reporter del gate: resume el reporte JSON de .quality-reports/check/<id>/
// mostrando como máximo 3 hallazgos y 4 recordatorios en la terminal
// (regla de la skill); el reporte completo queda en latest.md/latest.json.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ROOT, readJson } from './common.mjs';

export function summarize(taskId, root = ROOT) {
  const rel = path.join('.quality-reports', 'check', taskId);
  const reportDir = path.join(root, rel);
  const latest = readJson(path.join(rel, 'latest.json'));
  if (!latest) {
    console.log(`\x1b[33m[reporter]\x1b[0m sin reporte JSON en ${reportDir} (gate no ejecutado o en dry-run).`);
    return;
  }

  const stages = latest.stages ?? [];
  const findings = stages.flatMap((s) => (s.findings ?? []).map((f) => ({ ...f, stage: s.stage })));
  const errors = findings.filter((f) => f.severity === 'error');
  const warnings = findings.filter((f) => f.severity === 'warning');
  const decision = latest.decision ?? {};

  console.log(`\x1b[36m=== Gate ${taskId}: ${String(decision.decision ?? 'desconocido')} (exit ${String(decision.exitCode ?? '?')}) ===\x1b[0m`);
  for (const s of stages) {
    console.log(`  ${s.stage}: ${s.status ?? '?'} — ${String(s.summary ?? '').slice(0, 80)} (${(s.findings ?? []).length} hallazgos)`);
  }

  const top = [...errors, ...warnings].slice(0, 3);
  if (top.length > 0) {
    console.log('  Hallazgos (máx 3):');
    for (const f of top) {
      const loc = f.ruta ?? f.path ?? f.file ?? '.';
      const msg = String(f.message ?? '').split('\n')[0].slice(0, 120);
      console.log(`    \x1b[31m[${f.severity}]\x1b[0m ${f.ruleId ?? '?'} @ ${loc}: ${msg}`);
    }
  } else {
    console.log('  Hallazgos: ninguno.');
  }

  console.log('  Recordatorios:');
  const reminders = [
    `reporte completo: ${path.join(reportDir, 'latest.md')}`,
    'integra en project.primaryBranch con sentinel task integrate (--ff-only)',
    'tras integrar: sentinel task cleanup y sentinel task release',
    errors.length > 0
      ? `${errors.length} error(es): resuélvelos o afina severidades en sentinel.config.json / varsense.config.json`
      : `${warnings.length} aviso(s) sin bloquear; revisa los 3 principales del gate para subir calidad`,
  ];
  for (const r of reminders) console.log(`    • ${r}`);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const id = process.argv[2];
  if (!id) {
    console.error('Uso: node scripts/quality/reporter.mjs <TareaId>');
    process.exit(2);
  }
  summarize(id);
}
