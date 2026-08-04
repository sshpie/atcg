// SPDX-License-Identifier: GPL-3.0-or-later
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';

describe('manifest', () => {
  const m = JSON.parse(readFileSync('src/ext/manifest.json', 'utf8'));
  it('is MV3 with exactly the minimal permissions', () => {
    expect(m.manifest_version).toBe(3);
    expect(m.permissions.sort()).toEqual(['activeTab', 'scripting', 'storage']);
    expect(m.host_permissions).toBeUndefined();
    expect(JSON.stringify(m)).not.toContain('webRequest');
  });
  it('declares the service worker as a module and a default popup', () => {
    expect(m.background.type).toBe('module');
    expect(m.action.default_popup).toBe('popup.html');
    expect(m.minimum_chrome_version).toBe('102');
    expect(m.web_accessible_resources).toBeUndefined();
  });
});
