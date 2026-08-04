// SPDX-License-Identifier: GPL-3.0-or-later OR MIT
import { parsePattern } from './pattern';
import type { PatternHit } from './types';

const asArray = (p: string | string[] | undefined): string[] =>
  p === undefined ? [] : Array.isArray(p) ? p : [p];

export function applyVersionTemplate(template: string, match: RegExpMatchArray): string {
  return template.replace(/\\(\d)/g, (_, d: string) => match[Number(d)] ?? '');
}

function hit(raw: string, value: string, field: string): PatternHit | null {
  const cp = parsePattern(raw);
  const m = value.match(cp.regex);
  if (!m) return null;
  const version = cp.versionTemplate ? applyVersionTemplate(cp.versionTemplate, m) : undefined;
  return { confidence: cp.confidence, version: version || undefined, field, raw };
}

/** Match one or more patterns against a single string value. */
export function matchField(
  patterns: string | string[] | undefined, value: string, field: string,
): PatternHit[] {
  const out: PatternHit[] = [];
  for (const raw of asArray(patterns)) {
    const h = hit(raw, value, field);
    if (h) out.push(h);
  }
  return out;
}

/** Match a name->pattern record (headers/cookies/meta/js) against name->value data. */
export function matchRecordField(
  patterns: Record<string, string> | undefined,
  values: Record<string, unknown>, field: string,
): PatternHit[] {
  if (!patterns) return [];
  const out: PatternHit[] = [];
  for (const [key, raw] of Object.entries(patterns)) {
    if (!(key in values)) continue;
    const value = String(values[key] ?? '');
    if (raw === '') { out.push({ confidence: 100, field, raw: `${key}(present)` }); continue; }
    const h = hit(raw, value, field);
    if (h) out.push(h);
  }
  return out;
}
