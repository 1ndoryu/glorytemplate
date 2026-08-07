// Cache operativa del gate (bajo .quality-reports/, ignorada por Git):
//   - cooldown de pesadas (180 min por defecto) con excepción auditable --allow-heavy;
//   - lock "un proceso por proyecto" para evitar gates concurrentes.
// Regla de la skill: `cargo test 2>&1` cuenta como el mismo test pesado — las
// variantes de un mismo test comparten clave (sharedTestKeys).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './common.mjs';

const CACHE_DIR = path.join(ROOT, '.quality-reports', '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'gate.json');
const LOCK_FILE = path.join(CACHE_DIR, 'gate.lock');

function readCache() {
  try {
    return JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
  } catch {
    return {};
  }
}

function writeCache(cache) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  fs.writeFileSync(CACHE_FILE, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

/* Normaliza la clave de una pesada: cualquier variante de test (cargo test,
 * npm test, etc.) comparte la clave 'test' — regla de la skill:
 * "cargo test 2>&1 cuenta como el mismo test pesado". */
export function heavyKeyFor(name, cfg = {}) {
  const shared = cfg.sharedTestKeys ?? ['cargo test', 'npm test'];
  const lower = name.toLowerCase();
  if (shared.some((k) => lower.includes(k.toLowerCase()))) return 'test';
  return name;
}

/* ¿La pesada `key` está dentro del cooldown de `minutes`? */
export function isHeavyCooldown(key, minutes) {
  const last = readCache().heavy?.[key]?.at;
  if (!last) return false;
  return Date.now() - last < (minutes ?? 180) * 60_000;
}

/* Registra la ejecución de una pesada. Con `allow` se anota la excepción
 * auditable (pid + timestamp) en la caché. */
export function markHeavyRun(key, { allow = false } = {}) {
  const cache = readCache();
  cache.heavy = cache.heavy ?? {};
  cache.heavy[key] = { at: Date.now() };
  if (allow) {
    cache.allowances = cache.allowances ?? [];
    cache.allowances.push({ key, at: Date.now(), pid: process.pid });
    if (cache.allowances.length > 20) cache.allowances = cache.allowances.slice(-20);
  }
  writeCache(cache);
}

/* Lock "un proceso por proyecto": rechaza si hay otro gate vivo (pid activo)
 * o un lock reciente con pid irresoluble. Los locks huérfanos se relevan. */
export function acquireProjectLock() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  if (fs.existsSync(LOCK_FILE)) {
    let rec = null;
    try {
      rec = JSON.parse(fs.readFileSync(LOCK_FILE, 'utf8'));
    } catch {
      rec = null;
    }
    if (rec && typeof rec.pid === 'number') {
      let alive = true;
      try {
        process.kill(rec.pid, 0);
      } catch {
        alive = false; // pid muerto → lock huérfano: se releva de inmediato
      }
      if (alive) return { ok: false, pid: rec.pid }; // proceso vivo → gate en curso
    } else if (rec && Date.now() - rec.at < 60 * 60_000) {
      // Lock sin pid (o corrupto) y reciente: no sabemos si hay un gate; bloquear.
      return { ok: false, pid: rec.pid ?? 0 };
    }
  }
  fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, at: Date.now() }));
  return { ok: true };
}

export function releaseProjectLock() {
  try {
    fs.rmSync(LOCK_FILE, { force: true });
  } catch {
    /* best-effort */
  }
}
