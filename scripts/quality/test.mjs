#!/usr/bin/env node
// Smoke test del gate (quality:test): preflight → doctor → lock --check →
// task:check BOOTSTRAP-01 en dry-run. Sale 0 solo si todo el cableado funciona.
import { ROOT, run, sentinel } from './common.mjs';

const steps = [
  { label: 'preflight', fn: () => run(process.execPath, ['scripts/quality/preflight.mjs'], { capture: false }) },
  { label: 'doctor', fn: () => run(process.execPath, ['scripts/quality/doctor.mjs'], { capture: false }) },
  { label: 'lock --check', fn: () => run(process.execPath, ['scripts/quality/lock.mjs', '--check'], { capture: false }) },
  { label: 'check dry-run', fn: () => sentinel(['check', 'BOOTSTRAP-01', '--dry-run', '--workspace', ROOT, '--json'], { capture: false }) },
];

let failed = 0;
for (const step of steps) {
  const res = step.fn();
  if ((res.status ?? 1) !== 0) {
    failed += 1;
    console.error(`\x1b[31m[quality:test] FAIL: ${step.label}\x1b[0m`);
  } else {
    console.log(`\x1b[32m[quality:test] OK: ${step.label}\x1b[0m`);
  }
}

if (failed === 0) {
  console.log('\n[quality:test] OK: preflight, doctor, lock y task:check dry-run funcionan.');
  process.exit(0);
}
console.error(`\n[quality:test] ${failed} paso(s) fallidos.`);
process.exit(1);
