// SPDX-License-Identifier: GPL-3.0-or-later
import type { Corpus } from '../core/types';

/** Every js-global key declared across the corpus (the globals to probe). Pure. */
export function globalPaths(corpus: Corpus): string[] {
  const set = new Set<string>();
  for (const fp of Object.values(corpus)) for (const k of Object.keys(fp.js ?? {})) set.add(k);
  return [...set];
}

/**
 * Injected into the page's MAIN world via executeScript({ world: 'MAIN', func, args: [paths] }).
 * MUST stay self-contained (same constraint as page.ts collectPage): the dotted-path resolver
 * is inlined here, not imported. `paths` arrives via args. Reads window globals through
 * `globalThis` (=== window in the MAIN world). Tested directly under jsdom.
 */
export function collectGlobals(paths: string[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const path of paths) {
    let cur: unknown = globalThis;
    let ok = true;
    for (const seg of path.split('.')) {
      if (cur != null && (typeof cur === 'object' || typeof cur === 'function') && seg in (cur as object)) {
        cur = (cur as Record<string, unknown>)[seg];
      } else { ok = false; break; }
    }
    if (ok) out[path] = (cur !== null && (typeof cur === 'object' || typeof cur === 'function')) ? true : cur;
  }
  return out;
}
