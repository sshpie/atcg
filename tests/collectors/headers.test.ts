// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { normalizeHeaders } from '../../src/collectors/headers';

describe('normalizeHeaders', () => {
  it('lowercases names into a plain record', () => {
    const h = new Headers({ 'Server': 'nginx', 'X-Powered-By': 'PHP/8.2' });
    expect(normalizeHeaders(h)).toEqual({ server: 'nginx', 'x-powered-by': 'PHP/8.2' });
  });
});
