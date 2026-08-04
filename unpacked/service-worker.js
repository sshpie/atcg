// src/core/pattern.ts
function parsePattern(raw) {
  const parts = raw.split("\\;");
  const body = parts[0] ?? "";
  let confidence = 100;
  let versionTemplate;
  for (const tag of parts.slice(1)) {
    const [key, ...rest] = tag.split(":");
    const value = rest.join(":");
    if (key === "confidence") {
      const n = Number.parseInt(value, 10);
      if (!Number.isNaN(n)) confidence = n;
    } else if (key === "version") {
      versionTemplate = value;
    }
  }
  let regex;
  try {
    regex = new RegExp(body, "i");
  } catch {
    regex = /(?!x)x/;
  }
  return { regex, confidence, versionTemplate, raw };
}

// src/core/match.ts
var asArray = (p) => p === void 0 ? [] : Array.isArray(p) ? p : [p];
function applyVersionTemplate(template, match) {
  return template.replace(/\\(\d)/g, (_, d) => match[Number(d)] ?? "");
}
function hit(raw, value, field) {
  const cp = parsePattern(raw);
  const m = value.match(cp.regex);
  if (!m) return null;
  const version = cp.versionTemplate ? applyVersionTemplate(cp.versionTemplate, m) : void 0;
  return { confidence: cp.confidence, version: version || void 0, field, raw };
}
function matchField(patterns, value, field) {
  const out = [];
  for (const raw of asArray(patterns)) {
    const h = hit(raw, value, field);
    if (h) out.push(h);
  }
  return out;
}
function matchRecordField(patterns, values, field) {
  if (!patterns) return [];
  const out = [];
  for (const [key, raw] of Object.entries(patterns)) {
    if (!(key in values)) continue;
    const value = String(values[key] ?? "");
    if (raw === "") {
      out.push({ confidence: 100, field, raw: `${key}(present)` });
      continue;
    }
    const h = hit(raw, value, field);
    if (h) out.push(h);
  }
  return out;
}

// src/core/fingerprint.ts
function matchFingerprint(name, fp, s) {
  const reasons = [];
  reasons.push(...matchField(fp.html, s.html, "html"));
  reasons.push(...matchField(fp.url, s.url, "url"));
  reasons.push(...matchField(fp.text, s.text ?? "", "text"));
  for (const src of s.scriptSrc) reasons.push(...matchField(fp.scriptSrc, src, "scriptSrc"));
  for (const body of s.scripts) reasons.push(...matchField(fp.scripts, body, "scripts"));
  for (const sheet of s.css) reasons.push(...matchField(fp.css, sheet, "css"));
  if (fp.dom) for (const sel of s.dom ?? []) reasons.push(...matchField(domSelectors(fp.dom), sel, "dom"));
  reasons.push(...matchRecordField(lowerKeys(fp.headers), lowerKeys(s.headers), "headers"));
  reasons.push(...matchRecordField(fp.cookies, s.cookies, "cookies"));
  reasons.push(...matchRecordField(lowerKeys(fp.meta), lowerKeys(s.meta), "meta"));
  reasons.push(...matchRecordField(fp.js, s.js, "js"));
  if (reasons.length === 0) return null;
  const confidence = Math.min(100, reasons.reduce((sum, r) => sum + r.confidence, 0));
  const version = reasons.find((r) => r.version)?.version;
  return { name, cats: fp.cats, confidence, version, provenance: fp._meta, reasons };
}
function lowerKeys(rec) {
  if (!rec) return {};
  return Object.fromEntries(Object.entries(rec).map(([k, v]) => [k.toLowerCase(), v]));
}
function domSelectors(dom) {
  if (typeof dom === "string") return [dom];
  if (Array.isArray(dom)) return dom;
  return Object.keys(dom);
}

// src/core/relations.ts
var arr = (v) => v === void 0 ? [] : Array.isArray(v) ? v : [v];
var numArr = (v) => v === void 0 ? [] : Array.isArray(v) ? v : [v];
function resolveRelations(detections, corpus) {
  let present = new Set(detections.map((d) => d.name));
  const catsPresent = new Set(detections.flatMap((d) => d.cats));
  let kept = detections.filter((d) => {
    const fp = corpus[d.name];
    if (!fp) return true;
    const reqOk = arr(fp.requires).every((r) => present.has(r));
    const catOk = numArr(fp.requiresCategory).every((c) => catsPresent.has(c));
    return reqOk && catOk;
  });
  present = new Set(kept.map((d) => d.name));
  const excluded = new Set(kept.flatMap((d) => arr(corpus[d.name]?.excludes)));
  kept = kept.filter((d) => !excluded.has(d.name));
  present = new Set(kept.map((d) => d.name));
  for (const d of [...kept]) {
    for (const name of arr(corpus[d.name]?.implies)) {
      if (present.has(name)) continue;
      present.add(name);
      kept.push({
        name,
        cats: corpus[name]?.cats ?? [],
        confidence: 100,
        provenance: corpus[name]?._meta,
        reasons: [],
        implied: true
      });
    }
  }
  return kept;
}

// src/core/detect.ts
function detect(signals, corpus) {
  const raw = [];
  for (const [name, fp] of Object.entries(corpus)) {
    const d = matchFingerprint(name, fp, signals);
    if (d) raw.push(d);
  }
  const resolved = resolveRelations(raw, corpus);
  return resolved.sort((a, b) => b.confidence - a.confidence || a.name.localeCompare(b.name));
}

// src/core/corpus.ts
function loadCorpus(layers) {
  const out = {};
  for (const layer of layers) for (const [name, fp] of Object.entries(layer)) out[name] = fp;
  return out;
}

// src/collectors/assemble.ts
function assembleSignals(url, page, globals, headers) {
  return {
    url,
    html: page.html,
    headers,
    cookies: page.cookies,
    meta: page.meta,
    scriptSrc: page.scriptSrc,
    scripts: page.scripts,
    css: page.css,
    js: globals,
    text: page.text,
    dom: []
  };
}

// src/collectors/page.ts
function collectPage() {
  const scriptSrc = [];
  const scripts = [];
  for (const s of Array.from(document.scripts)) {
    if (s.src) scriptSrc.push(s.src);
    else if (s.textContent) scripts.push(s.textContent);
  }
  const meta = {};
  for (const m of Array.from(document.querySelectorAll("meta[name][content]"))) {
    const name = m.getAttribute("name");
    const content = m.getAttribute("content");
    if (name && content) meta[name.toLowerCase()] = content;
  }
  const css = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]')).map((l) => l.getAttribute("href") || "").filter(Boolean);
  const cookies = {};
  for (const c of (document.cookie || "").split(";")) {
    const [k, ...v] = c.trim().split("=");
    if (k) cookies[k] = v.join("=");
  }
  return {
    html: document.documentElement.outerHTML,
    scriptSrc,
    scripts,
    meta,
    cookies,
    css,
    text: (document.body?.textContent || "").replace(/\s+/g, " ").trim().slice(0, 2e4)
  };
}

// src/collectors/globals.ts
function globalPaths(corpus) {
  const set = /* @__PURE__ */ new Set();
  for (const fp of Object.values(corpus)) for (const k of Object.keys(fp.js ?? {})) set.add(k);
  return [...set];
}
function collectGlobals(paths) {
  const out = {};
  for (const path of paths) {
    let cur = globalThis;
    let ok = true;
    for (const seg of path.split(".")) {
      if (cur != null && (typeof cur === "object" || typeof cur === "function") && seg in cur) {
        cur = cur[seg];
      } else {
        ok = false;
        break;
      }
    }
    if (ok) out[path] = cur !== null && (typeof cur === "object" || typeof cur === "function") ? true : cur;
  }
  return out;
}

// src/collectors/headers.ts
function normalizeHeaders(h) {
  const out = {};
  h.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}
async function fetchHeaders(url) {
  try {
    const res = await fetch(url, { method: "GET", credentials: "omit", redirect: "follow" });
    return normalizeHeaders(res.headers);
  } catch {
    return {};
  }
}

// src/ext/service-worker.ts
var LETTERS = "_abcdefghijklmnopqrstuvwxyz".split("");
var corpusCache = null;
async function getCorpus() {
  if (corpusCache) return corpusCache;
  const layers = await Promise.all(LETTERS.map(async (l) => {
    try {
      return await (await fetch(chrome.runtime.getURL(`fingerprints/${l}.json`))).json();
    } catch (e) {
      console.warn("atcg: corpus shard failed to load", l, e);
      return {};
    }
  }));
  corpusCache = loadCorpus(layers);
  return corpusCache;
}
async function analyze(tabId, url) {
  const corpus = await getCorpus();
  const [pageRes] = await chrome.scripting.executeScript({ target: { tabId }, func: collectPage });
  const [globalsRes] = await chrome.scripting.executeScript({
    target: { tabId },
    world: "MAIN",
    func: collectGlobals,
    args: [globalPaths(corpus)]
  });
  const headers = await fetchHeaders(url);
  const signals = assembleSignals(url, pageRes.result, globalsRes.result ?? {}, headers);
  return detect(signals, corpus);
}
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "analyze") return false;
  analyze(msg.tabId, msg.url).then((detections) => sendResponse({ ok: true, detections })).catch((e) => sendResponse({ ok: false, error: String(e) }));
  return true;
});
