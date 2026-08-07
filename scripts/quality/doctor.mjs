#!/usr/bin/env node
// Diagnóstico del gate: envuelve `sentinel doctor --workspace . --json` y resume el estado.
import { ROOT, sentinel } from './common.mjs';

const res = sentinel(['doctor', '--workspace', ROOT, '--json']);
if (res.code !== 0) {
  console.error(res.err || res.out);
  process.exit(res.code ?? 1);
}
let doc;
try {
  doc = JSON.parse(res.out);
} catch {
  console.error(res.out);
  process.exit(1);
}

const policy = doc.policy ?? {};
const lock = doc.lock ?? {};
const runtime = doc.runtime ?? {};

console.log('=== Quality gate: doctor ===');
console.log(`  workspace: ${doc.workspace}`);
console.log(`  rama:      ${doc.branch ?? '(no repo)'}`);
console.log(`  runtime:   ${doc.sentinelVersion} (hash ${String(runtime.activeHash ?? '').slice(0, 12)}, verificado ${String(runtime.activeVerified)})`);
console.log(`  política:  ${policy.status}  modo=${policy.mode ?? '-'}  ${policy.policyPath ?? ''}`);
console.log(`  lock:      ${lock.present ? `presente (${lock.version} @ ${String(lock.commit ?? '').slice(0, 12)})` : 'ausente'}`);
console.log(`  leases:    ${doc.leases?.active ?? 0} activos / ${doc.leases?.expired ?? 0} expirados`);

if (policy.status !== 'policy') {
  console.error('\nLa política no está en estado policy: revisa sentinel.config.json (schema v2 con guard.directCommands).');
  process.exit(1);
}
process.exit(0);
