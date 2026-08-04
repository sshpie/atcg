// SPDX-License-Identifier: GPL-3.0-or-later

export function normalizeHeaders(h: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  h.forEach((value, key) => { out[key.toLowerCase()] = value; });
  return out;
}

/** Same-origin re-fetch of the active tab URL (activeTab grants host access on the user gesture). */
export async function fetchHeaders(url: string): Promise<Record<string, string>> {
  try {
    const res = await fetch(url, { method: 'GET', credentials: 'omit', redirect: 'follow' });
    return normalizeHeaders(res.headers);
  } catch { return {}; }
}
