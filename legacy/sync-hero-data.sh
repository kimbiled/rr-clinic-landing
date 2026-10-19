#!/usr/bin/env bash
# Regenerates js/data/hero-data.js from data/hero.json (single source of truth).
# Run after every edit to data/hero.json:   ./scripts/sync-hero-data.sh
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
JSON="$ROOT/data/hero.json"
OUT="$ROOT/js/data/hero-data.js"
mkdir -p "$(dirname "$OUT")"

# Validate + pretty-print (fails loudly on invalid JSON).
BODY="$(python3 -I -c 'import json,sys; print(json.dumps(json.load(open(sys.argv[1], encoding="utf-8")), ensure_ascii=False, indent=2))' "$JSON")"

if grep -q 'figma.com/api/mcp/asset' <<<"$BODY"; then
  echo "ERROR: temporary Figma asset URL found in $JSON" >&2; exit 1
fi

cat > "$OUT" <<EOF
// AUTO-GENERATED from data/hero.json by scripts/sync-hero-data.sh — do not edit by hand.
// Embedded copy so the page works from file:// (where fetch() of local JSON is blocked).

/** Shape documented in docs/data-schema.md. Shallow-frozen: clone before mutating. */
export const heroData = Object.freeze(${BODY});

export const HERO_JSON_URL = 'data/hero.json';

/**
 * Loads hero content. Tries the JSON (or a future API endpoint) first so content can be
 * updated without touching JS; falls back to the embedded copy on file://, network errors,
 * non-2xx responses, invalid JSON, or timeout.
 *
 * @param {{ url?: string, timeoutMs?: number }} [options]
 * @returns {Promise<typeof heroData>}
 */
export async function loadHeroData({ url = HERO_JSON_URL, timeoutMs = 3000 } = {}) {
  if (typeof fetch !== 'function' || location.protocol === 'file:') return heroData;
  const ctrl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : null;
  try {
    const res = await fetch(url, { signal: ctrl?.signal, headers: { Accept: 'application/json' } });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const data = await res.json();
    if (!data || !Array.isArray(data.cases) || !Array.isArray(data.doctors)) {
      throw new Error('unexpected hero data shape');
    }
    return data;
  } catch (err) {
    console.warn('[hero-data] using embedded fallback:', err?.message || err);
    return heroData;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** Index doctors by id for quick lookup: getDoctor(data, case.doctorId). */
export function getDoctor(data, id) {
  return data.doctors.find((d) => d.id === id) ?? null;
}

/** Cases (optionally filtered by doctor), in display order. */
export function getCases(data, doctorId) {
  return doctorId ? data.cases.filter((c) => c.doctorId === doctorId) : data.cases;
}
EOF
echo "wrote $OUT"
