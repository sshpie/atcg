// SPDX-License-Identifier: GPL-3.0-or-later OR MIT
import type { Corpus } from './types';

/** Merge corpus layers left→right; later layers override same-named entries. */
export function loadCorpus(layers: Corpus[]): Corpus {
  const out: Corpus = {};
  for (const layer of layers) for (const [name, fp] of Object.entries(layer)) out[name] = fp;
  return out;
}
