// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { transformEntry } from '../scripts/import-corpus.mjs';

describe('transformEntry', () => {
  it('adds provenance _meta without mutating detection fields', () => {
    const out = transformEntry({ cats: [1], scriptSrc: '/wp-content/' }, 'seed-webappanalyzer', '2026-08-03');
    expect(out.scriptSrc).toBe('/wp-content/');
    expect(out._meta).toEqual({ source: 'seed-webappanalyzer', verified: '2026-08-03', notes: '' });
  });
  it('preserves an existing _meta if already present', () => {
    const out = transformEntry({ cats: [1], _meta: { source: 'atcg-original', verified: '2026-01-01' } },
      'seed-webappanalyzer', '2026-08-03');
    expect(out._meta.source).toBe('atcg-original');
  });
});
