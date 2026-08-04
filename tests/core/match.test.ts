// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { matchField, matchRecordField } from '../../src/core/match';

describe('matchField', () => {
  it('returns a hit with extracted version', () => {
    const hits = matchField('jquery-([0-9.]+)\\.js\\;version:\\1', 'https://x/jquery-3.6.0.js', 'scriptSrc');
    expect(hits).toHaveLength(1);
    expect(hits[0]!.version).toBe('3.6.0');
    expect(hits[0]!.confidence).toBe(100);
    expect(hits[0]!.field).toBe('scriptSrc');
  });

  it('returns no hit when nothing matches', () => {
    expect(matchField('/wp-content/', 'https://x/app.js', 'scriptSrc')).toEqual([]);
  });

  it('accepts an array of patterns', () => {
    const hits = matchField(['react', 'vue'], 'built with react', 'html');
    expect(hits).toHaveLength(1);
  });

  it('composes a version template with literal text', () => {
    const hits = matchField('v([0-9]+)\\;version:3.\\1', 'v7', 'html');
    expect(hits[0]!.version).toBe('3.7');
  });
});

describe('matchRecordField', () => {
  it('matches a named header value (empty pattern = presence)', () => {
    const hits = matchRecordField({ 'x-powered-by': 'PHP/([0-9.]+)\\;version:\\1' },
      { 'x-powered-by': 'PHP/8.2.1' }, 'headers');
    expect(hits[0]!.version).toBe('8.2.1');
  });

  it('an empty pattern matches on mere presence of the key', () => {
    const hits = matchRecordField({ 'shopify': '' }, { 'shopify': 'anything' }, 'js');
    expect(hits).toHaveLength(1);
    expect(hits[0]!.confidence).toBe(100);
  });

  it('ignores keys that are absent from the values', () => {
    expect(matchRecordField({ 'x-drupal': '' }, { 'server': 'nginx' }, 'headers')).toEqual([]);
  });
});
