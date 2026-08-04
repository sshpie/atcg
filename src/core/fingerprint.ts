// SPDX-License-Identifier: GPL-3.0-or-later OR MIT
import { matchField, matchRecordField } from './match';
import type { Detection, Fingerprint, PatternHit, Signals } from './types';

export function matchFingerprint(name: string, fp: Fingerprint, s: Signals): Detection | null {
  const reasons: PatternHit[] = [];

  // String / string[] fields matched against a joined haystack or each element.
  reasons.push(...matchField(fp.html, s.html, 'html'));
  reasons.push(...matchField(fp.url, s.url, 'url'));
  reasons.push(...matchField(fp.text, s.text ?? '', 'text'));
  for (const src of s.scriptSrc) reasons.push(...matchField(fp.scriptSrc, src, 'scriptSrc'));
  for (const body of s.scripts) reasons.push(...matchField(fp.scripts, body, 'scripts'));
  for (const sheet of s.css) reasons.push(...matchField(fp.css, sheet, 'css'));
  if (fp.dom) for (const sel of s.dom ?? []) reasons.push(...matchField(domSelectors(fp.dom), sel, 'dom'));

  // Record fields: name -> pattern. Header and meta names are case-insensitive,
  // so lowercase BOTH the fingerprint keys and the signal keys before lookup —
  // otherwise a fingerprint keyed "Server" never matches signals keyed "server".
  // Cookie names and js global paths are case-sensitive → left as-is.
  reasons.push(...matchRecordField(lowerKeys(fp.headers), lowerKeys(s.headers), 'headers'));
  reasons.push(...matchRecordField(fp.cookies, s.cookies, 'cookies'));
  reasons.push(...matchRecordField(lowerKeys(fp.meta), lowerKeys(s.meta), 'meta'));
  reasons.push(...matchRecordField(fp.js, s.js, 'js'));

  if (reasons.length === 0) return null;

  const confidence = Math.min(100, reasons.reduce((sum, r) => sum + r.confidence, 0));
  const version = reasons.find((r) => r.version)?.version;
  return { name, cats: fp.cats, confidence, version, provenance: fp._meta, reasons };
}

/** Lowercase the KEYS of a record (values untouched). Undefined-safe. */
function lowerKeys<T>(rec: Record<string, T> | undefined): Record<string, T> {
  if (!rec) return {};
  return Object.fromEntries(Object.entries(rec).map(([k, v]) => [k.toLowerCase(), v]));
}

/** For v1, dom fingerprints declared as a selector string/array are treated as presence patterns. */
function domSelectors(dom: NonNullable<Fingerprint['dom']>): string[] {
  if (typeof dom === 'string') return [dom];
  if (Array.isArray(dom)) return dom;
  return Object.keys(dom);
}
