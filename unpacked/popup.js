// src/ext/popup/render.ts
function groupByCategory(dets, catNames) {
  const groups = /* @__PURE__ */ new Map();
  for (const d of dets) {
    const cat = catNames[d.cats[0] ?? -1] ?? "Other";
    (groups.get(cat) ?? groups.set(cat, []).get(cat)).push(d);
  }
  return [...groups.entries()].map(([cat, items]) => ({ cat, items }));
}
function confidenceDots(c) {
  const filled = Math.round(Math.max(0, Math.min(100, c)) / 20);
  return "\u25CF".repeat(filled) + "\u25CB".repeat(5 - filled);
}
function reasonLine(hit) {
  return `${hit.field}: ${hit.raw}`;
}
function toJSON(dets) {
  return JSON.stringify(
    dets.map((d) => ({ name: d.name, version: d.version ?? null, confidence: d.confidence, cats: d.cats, reasons: d.reasons })),
    null,
    2
  );
}
function toCSV(dets) {
  const rows = [["name", "version", "confidence", "categories"].join(",")];
  for (const d of dets) rows.push([d.name, d.version ?? "", String(d.confidence), d.cats.join(" ")].map(csvCell).join(","));
  return rows.join("\n");
}
var csvCell = (s) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

// src/ext/popup/popup.ts
async function main() {
  const app = document.getElementById("app");
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id || !tab.url || !/^https?:/.test(tab.url)) {
    app.textContent = "No analyzable page.";
    return;
  }
  const host = document.getElementById("host");
  host.textContent = new URL(tab.url).host;
  const catNames = await fetch(chrome.runtime.getURL("fingerprints/categories.json")).then((r) => r.json()).then((c) => Object.fromEntries(Object.entries(c).map(([id, v]) => [Number(id), v.name]))).catch(() => ({}));
  const resp = await chrome.runtime.sendMessage({ type: "analyze", tabId: tab.id, url: tab.url });
  if (!resp?.ok) {
    app.textContent = "Analysis failed.";
    return;
  }
  const dets = resp.detections;
  render(app, dets, catNames);
  wireExport(dets);
}
function render(app, dets, catNames) {
  app.innerHTML = "";
  if (!dets.length) {
    app.textContent = "No technologies detected.";
    return;
  }
  for (const { cat, items } of groupByCategory(dets, catNames)) {
    const h = document.createElement("h3");
    h.textContent = cat;
    app.append(h);
    for (const d of items) {
      if (d.reasons.length === 0) {
        const row2 = document.createElement("div");
        row2.className = "row";
        row2.textContent = `${d.name}${d.version ? " " + d.version : ""}  ${confidenceDots(d.confidence)}`;
        app.append(row2);
        continue;
      }
      const row = document.createElement("details");
      row.className = "row";
      const sum = document.createElement("summary");
      sum.textContent = `${d.name}${d.version ? " " + d.version : ""}  ${confidenceDots(d.confidence)}`;
      row.append(sum);
      for (const hit of d.reasons) {
        const li = document.createElement("div");
        li.className = "reason";
        li.textContent = reasonLine(hit);
        row.append(li);
      }
      app.append(row);
    }
  }
}
function wireExport(dets) {
  const dl = (name, text, type) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
  };
  document.getElementById("export-json").addEventListener("click", () => dl("atcg.json", toJSON(dets), "application/json"));
  document.getElementById("export-csv").addEventListener("click", () => dl("atcg.csv", toCSV(dets), "text/csv"));
}
main();
