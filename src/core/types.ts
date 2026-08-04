// SPDX-License-Identifier: GPL-3.0-or-later OR MIT

export interface Provenance {
  source: 'seed-webappanalyzer' | 'upstream-fork' | 'atcg-original';
  verified: string;      // ISO date, e.g. "2026-08-03"
  notes?: string;
}

/** Raw fingerprint as stored in fingerprints/*.json (webappanalyzer schema + _meta). */
export interface Fingerprint {
  cats: number[];
  website?: string;
  icon?: string;
  implies?: string | string[];
  excludes?: string | string[];
  requires?: string | string[];
  requiresCategory?: number | number[];
  headers?: Record<string, string>;
  cookies?: Record<string, string>;
  meta?: Record<string, string>;
  js?: Record<string, string>;
  dom?: string | string[] | Record<string, unknown>;
  html?: string | string[];
  scriptSrc?: string | string[];
  scripts?: string | string[];
  css?: string | string[];
  url?: string | string[];
  text?: string | string[];
  _meta?: Provenance;
}

export type Corpus = Record<string, Fingerprint>;

/** Browser-collected inputs. Plain data only — no browser/DOM types. */
export interface Signals {
  url: string;
  html: string;
  headers: Record<string, string>;   // lowercased name -> value
  cookies: Record<string, string>;
  meta: Record<string, string>;      // meta name -> content
  scriptSrc: string[];
  scripts: string[];
  css: string[];
  js: Record<string, unknown>;       // "window.path" -> value
  text?: string;
  dom?: string[];                    // matched selectors (presence), v1
}

export interface CompiledPattern {
  regex: RegExp;
  confidence: number;        // default 100
  versionTemplate?: string;
  raw: string;
}

export interface PatternHit {
  confidence: number;
  version?: string;
  field: string;
  raw: string;
}

export interface Detection {
  name: string;
  cats: number[];
  confidence: number;        // 0..100
  version?: string;
  provenance?: Provenance;
  reasons: PatternHit[];
  implied?: boolean;
}
