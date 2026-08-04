// SPDX-License-Identifier: GPL-3.0-or-later OR MIT
import type { CompiledPattern } from './types';

/**
 * Parse a webappanalyzer pattern string: a regex body followed by optional
 * "\;confidence:NN" and "\;version:TEMPLATE" tags (in any order).
 * An invalid regex compiles to one that never matches (never throws).
 */
export function parsePattern(raw: string): CompiledPattern {
  const parts = raw.split('\\;');
  const body = parts[0] ?? '';
  let confidence = 100;
  let versionTemplate: string | undefined;

  for (const tag of parts.slice(1)) {
    const [key, ...rest] = tag.split(':');
    const value = rest.join(':');
    if (key === 'confidence') {
      const n = Number.parseInt(value, 10);
      if (!Number.isNaN(n)) confidence = n;
    } else if (key === 'version') {
      versionTemplate = value;
    }
  }

  let regex: RegExp;
  try {
    regex = new RegExp(body, 'i');
  } catch {
    regex = /(?!x)x/; // matches nothing
  }
  return { regex, confidence, versionTemplate, raw };
}
