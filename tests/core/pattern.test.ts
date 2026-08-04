// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { parsePattern } from '../../src/core/pattern';

describe('parsePattern', () => {
  it('parses a plain pattern with default confidence 100 and no version', () => {
    const p = parsePattern('/wp-content/');
    expect(p.regex.test('/wp-content/themes')).toBe(true);
    expect(p.confidence).toBe(100);
    expect(p.versionTemplate).toBeUndefined();
  });

  it('extracts a confidence tag', () => {
    const p = parsePattern('jquery\\;confidence:50');
    expect(p.confidence).toBe(50);
    expect(p.regex.source).toBe('jquery');
  });

  it('extracts a version template', () => {
    const p = parsePattern('jquery-([0-9.]+)\\.js\\;version:\\1');
    expect(p.versionTemplate).toBe('\\1');
    expect(p.confidence).toBe(100);
    const m = 'jquery-3.6.0.js'.match(p.regex);
    expect(m?.[1]).toBe('3.6.0');
  });

  it('handles both tags in any order', () => {
    const p = parsePattern('x([0-9]+)\\;version:\\1\\;confidence:30');
    expect(p.confidence).toBe(30);
    expect(p.versionTemplate).toBe('\\1');
  });

  it('is case-insensitive and does not throw on an invalid regex', () => {
    const p = parsePattern('ABC');
    expect(p.regex.test('abc')).toBe(true);
    const bad = parsePattern('('); // invalid regex must not crash
    expect(bad.regex.test('anything')).toBe(false);
  });
});
