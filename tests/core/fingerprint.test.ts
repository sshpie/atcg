// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { matchFingerprint } from '../../src/core/fingerprint';
import type { Fingerprint, Signals } from '../../src/core/types';

const blank: Signals = {
  url: 'https://ex.com/', html: '', headers: {}, cookies: {}, meta: {},
  scriptSrc: [], scripts: [], css: [], js: {},
};

describe('matchFingerprint', () => {
  it('returns null when nothing matches', () => {
    const fp: Fingerprint = { cats: [1], scriptSrc: '/wp-content/' };
    expect(matchFingerprint('WordPress', fp, blank)).toBeNull();
  });

  it('detects via scriptSrc and carries cats + provenance', () => {
    const fp: Fingerprint = { cats: [1, 11], scriptSrc: '/wp-(?:content|includes)/',
      _meta: { source: 'seed-webappanalyzer', verified: '2026-08-03' } };
    const s = { ...blank, scriptSrc: ['https://ex.com/wp-content/x.js'] };
    const d = matchFingerprint('WordPress', fp, s)!;
    expect(d.name).toBe('WordPress');
    expect(d.cats).toEqual([1, 11]);
    expect(d.confidence).toBe(100);
    expect(d.provenance?.source).toBe('seed-webappanalyzer');
    expect(d.reasons.length).toBeGreaterThan(0);
  });

  it('accumulates confidence across fields and caps at 100', () => {
    const fp: Fingerprint = { cats: [1],
      html: 'foo\\;confidence:60', scriptSrc: 'bar\\;confidence:60' };
    const s = { ...blank, html: 'foo here', scriptSrc: ['bar.js'] };
    expect(matchFingerprint('X', fp, s)!.confidence).toBe(100);
  });

  it('resolves a version from a matching field', () => {
    const fp: Fingerprint = { cats: [1], meta: { generator: 'WordPress ([0-9.]+)\\;version:\\1' } };
    const s = { ...blank, meta: { generator: 'WordPress 6.4.2' } };
    expect(matchFingerprint('WordPress', fp, s)!.version).toBe('6.4.2');
  });

  it('matches js globals by presence', () => {
    const fp: Fingerprint = { cats: [1], js: { Shopify: '' } };
    const s = { ...blank, js: { Shopify: {} } };
    expect(matchFingerprint('Shopify', fp, s)).not.toBeNull();
  });

  it('matches header names case-insensitively (fp "Server" vs signal "server")', () => {
    const fp: Fingerprint = { cats: [22], headers: { Server: 'nginx' } };
    const s = { ...blank, headers: { server: 'nginx/1.25.0' } };
    expect(matchFingerprint('Nginx', fp, s)).not.toBeNull();
  });

  it('matches meta names case-insensitively', () => {
    const fp: Fingerprint = { cats: [1], meta: { Generator: 'WordPress' } };
    const s = { ...blank, meta: { generator: 'WordPress 6.4' } };
    expect(matchFingerprint('WordPress', fp, s)).not.toBeNull();
  });
});
