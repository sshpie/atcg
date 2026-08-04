// SPDX-License-Identifier: GPL-3.0-or-later OR MIT
import { matchFingerprint } from './fingerprint';
import { resolveRelations } from './relations';
import type { Corpus, Detection, Signals } from './types';

export function detect(signals: Signals, corpus: Corpus): Detection[] {
  const raw: Detection[] = [];
  for (const [name, fp] of Object.entries(corpus)) {
    const d = matchFingerprint(name, fp, signals);
    if (d) raw.push(d);
  }
  const resolved = resolveRelations(raw, corpus);
  return resolved.sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
}
