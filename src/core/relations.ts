// SPDX-License-Identifier: GPL-3.0-or-later OR MIT
import type { Corpus, Detection } from './types';

const arr = (v: string | string[] | undefined): string[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];
const numArr = (v: number | number[] | undefined): number[] =>
  v === undefined ? [] : Array.isArray(v) ? v : [v];

export function resolveRelations(detections: Detection[], corpus: Corpus): Detection[] {
  let present = new Set(detections.map((d) => d.name));
  const catsPresent = new Set(detections.flatMap((d) => d.cats));

  // 1. requires / requiresCategory — drop unmet.
  let kept = detections.filter((d) => {
    const fp = corpus[d.name];
    if (!fp) return true;
    const reqOk = arr(fp.requires).every((r) => present.has(r));
    const catOk = numArr(fp.requiresCategory).every((c) => catsPresent.has(c));
    return reqOk && catOk;
  });
  present = new Set(kept.map((d) => d.name));

  // 2. excludes — remove targets excluded by any kept detection.
  const excluded = new Set(kept.flatMap((d) => arr(corpus[d.name]?.excludes)));
  kept = kept.filter((d) => !excluded.has(d.name));
  present = new Set(kept.map((d) => d.name));

  // 3. implies — add missing implied techs (one pass).
  for (const d of [...kept]) {
    for (const name of arr(corpus[d.name]?.implies)) {
      if (present.has(name)) continue;
      present.add(name);
      kept.push({ name, cats: corpus[name]?.cats ?? [], confidence: 100,
        provenance: corpus[name]?._meta, reasons: [], implied: true });
    }
  }
  return kept;
}
