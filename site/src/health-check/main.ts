import "./style.css";
import { runChecks, type Category, type CheckResult, type Issue, type Severity, type VendorRecord } from "../lib/checks";
import { DEMO_FILES } from "./demo";
import { fill, initialLang, saveLang, STRINGS, type Lang } from "./i18n";
import { FIELDS, guessMapping, parseCsvText, readFile, type Field, type Mapping, type Table } from "./parse";

interface LoadedFile {
  id: string;
  fileName: string;
  source: string;
  table: Table;
  mapping: Mapping;
}

const MAX_SHOWN = 300;

const state = {
  lang: initialLang(),
  files: [] as LoadedFile[],
  result: null as CheckResult | null,
  category: "all" as Category | "all",
  severity: "all" as Severity | "all",
  error: "",
};
let fileSeq = 0;

const app = document.getElementById("app")!;
const s = () => STRINGS[state.lang];

const esc = (value: string): string =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function addTable(fileName: string, table: Table, source?: string) {
  state.files.push({
    id: `f${++fileSeq}`,
    fileName,
    source: source ?? fileName.replace(/\.[^.]+$/, ""),
    table,
    mapping: guessMapping(table.headers),
  });
}

async function addFiles(list: FileList | null) {
  if (!list) return;
  state.error = "";
  for (const file of Array.from(list)) {
    try {
      addTable(file.name, await readFile(file));
    } catch {
      state.error = `${s().readError}: ${file.name}`;
    }
  }
  state.result = null;
  render();
}

function toRecords(): VendorRecord[] {
  const cell = (row: string[], index: number) => (index >= 0 ? row[index] ?? "" : "");
  return state.files.flatMap((f) =>
    f.table.rows.map((row, i) => ({
      id: `${f.id}-${i}`,
      source: f.source.trim() || f.fileName,
      row: i + 1,
      name: cell(row, f.mapping.name),
      taxId: cell(row, f.mapping.taxId),
      nitku: cell(row, f.mapping.nitku),
      address: cell(row, f.mapping.address),
      bankAccount: cell(row, f.mapping.bankAccount),
    })),
  );
}

function run(scroll = true) {
  if (state.files.some((f) => f.mapping.name < 0)) {
    state.error = s().needName;
    render();
    return;
  }
  state.error = "";
  state.result = runChecks(toRecords());
  state.category = "all";
  state.severity = "all";
  render();
  if (scroll) document.getElementById("results")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function loadDemo(scroll = true) {
  state.files = [];
  for (const demo of DEMO_FILES) addTable(demo.name, parseCsvText(demo.csv), demo.source);
  run(scroll);
}

async function exportXlsx() {
  const result = state.result;
  if (!result) return;
  const { utils, writeFile } = await import("xlsx");
  const t = s();
  const byId = new Map(result.records.map((r) => [r.id, r]));
  const findings = result.issues.flatMap((issue) =>
    issue.recordIds.map((id) => {
      const r = byId.get(id)!;
      return {
        [state.lang === "id" ? "Tingkat" : "Severity"]: t.severities[issue.severity],
        [state.lang === "id" ? "Kategori" : "Category"]: t.categories[issue.category],
        [t.issues]: fill(t.issue[issue.code].title, issue.params),
        Detail: fill(t.issue[issue.code].detail, issue.params),
        [t.colSource]: r.source,
        [t.colRow]: r.row,
        [t.colName]: r.name,
        [t.colTaxId]: r.taxId,
        NITKU: r.nitku,
        [t.colBank]: r.bankAccount,
      };
    }),
  );
  const book = utils.book_new();
  utils.book_append_sheet(book, utils.json_to_sheet(findings), t.issues);
  utils.book_append_sheet(
    book,
    utils.json_to_sheet(result.records.map((r) => ({
      [t.colSource]: r.source, [t.colRow]: r.row, [t.colName]: r.name, [t.colTaxId]: r.taxId,
      NITKU: r.nitku, [t.fields.address]: r.address, [t.colBank]: r.bankAccount,
    }))),
    t.records,
  );
  writeFile(book, "padudata-vendor-health-check.xlsx");
}

// ---------- rendering ----------

function renderFile(f: LoadedFile): string {
  const t = s();
  const options = (field: Field) =>
    [`<option value="-1">${esc(t.notMapped)}</option>`]
      .concat(f.table.headers.map((h, i) => `<option value="${i}"${f.mapping[field] === i ? " selected" : ""}>${esc(h || `#${i + 1}`)}</option>`))
      .join("");
  return `
    <div class="file">
      <div class="file-head">
        <label class="source-label">
          <span>${esc(t.source)}</span>
          <input type="text" id="src-${f.id}" data-source="${f.id}" value="${esc(f.source)}" maxlength="40">
        </label>
        <span class="file-meta mono">${esc(f.fileName)} · ${f.table.rows.length} ${esc(t.rows)}</span>
        <button type="button" class="link-btn" data-action="remove" data-file="${f.id}">${esc(t.remove)}</button>
      </div>
      <div class="mapping">
        ${FIELDS.map((field) => `
          <label>
            <span>${esc(t.fields[field])}${field === "name" ? " *" : ""}</span>
            <select id="map-${f.id}-${field}" data-map="${f.id}" data-field="${field}">${options(field)}</select>
          </label>`).join("")}
      </div>
    </div>`;
}

function renderIssue(issue: Issue, byId: Map<string, VendorRecord>): string {
  const t = s();
  const text = t.issue[issue.code];
  const rows = issue.recordIds.map((id) => {
    const r = byId.get(id)!;
    return `<tr><td>${esc(r.source)}</td><td class="num">${r.row}</td><td>${esc(r.name)}</td><td class="mono">${esc(r.taxId)}</td><td class="mono">${esc(r.bankAccount)}</td></tr>`;
  }).join("");
  return `
    <article class="issue sev-${issue.severity}">
      <div class="issue-head">
        <span class="pill ${issue.severity}">${esc(t.severities[issue.severity])}</span>
        <span class="cat">${esc(t.categories[issue.category])}</span>
      </div>
      <h3>${esc(fill(text.title, issue.params))}</h3>
      <p>${esc(fill(text.detail, issue.params))}</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th>${esc(t.colSource)}</th><th class="num">${esc(t.colRow)}</th><th>${esc(t.colName)}</th><th>${esc(t.colTaxId)}</th><th>${esc(t.colBank)}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </article>`;
}

function renderResults(result: CheckResult): string {
  const t = s();
  const byId = new Map(result.records.map((r) => [r.id, r]));
  const cleanPct = result.records.length ? Math.round((result.cleanCount / result.records.length) * 100) : 100;
  const count = (pred: (i: Issue) => boolean) => result.issues.filter(pred).length;

  const filtered = result.issues.filter(
    (i) => (state.category === "all" || i.category === state.category) && (state.severity === "all" || i.severity === state.severity),
  );
  const shown = filtered.slice(0, MAX_SHOWN);

  const catChip = (c: Category | "all") => {
    const n = c === "all" ? result.issues.length : count((i) => i.category === c);
    const label = c === "all" ? t.all : t.categories[c];
    return `<button type="button" class="chip${state.category === c ? " on" : ""}" data-action="cat" data-value="${c}" aria-pressed="${state.category === c}">${esc(label)} <span class="mono">${n}</span></button>`;
  };
  const sevChip = (v: Severity | "all") => {
    const label = v === "all" ? t.all : t.severities[v];
    return `<button type="button" class="chip${state.severity === v ? " on" : ""}" data-action="sev" data-value="${v}" aria-pressed="${state.severity === v}">${esc(label)}</button>`;
  };

  return `
    <section class="block" id="results">
      <div class="results-head">
        <h2>${esc(t.results)}</h2>
        <button type="button" class="btn btn-ghost" data-action="export">${esc(t.export)}</button>
      </div>
      <div class="stats">
        <div class="stat"><span class="label">${esc(t.records)}</span><span class="value">${result.records.length}</span></div>
        <div class="stat"><span class="label">${esc(t.sources)}</span><span class="value">${result.sources.length}</span></div>
        <div class="stat"><span class="label">${esc(t.clean)}</span><span class="value">${cleanPct}%</span></div>
        <div class="stat"><span class="label">${esc(t.issues)}</span><span class="value">${result.issues.length}</span>
          <span class="sev-line mono"><span class="high">${count((i) => i.severity === "high")}</span> · <span class="medium">${count((i) => i.severity === "medium")}</span> · <span class="low">${count((i) => i.severity === "low")}</span></span></div>
      </div>
      ${result.issues.length === 0 ? `<p class="empty">${esc(t.noIssues)}</p>` : `
        <div class="filters">
          <div class="chips">${(["all", "taxid", "duplicate", "crossErp", "fraud"] as const).map(catChip).join("")}</div>
          <div class="chips">${(["all", "high", "medium", "low"] as const).map(sevChip).join("")}</div>
        </div>
        <div class="issues">
          ${shown.length ? shown.map((i) => renderIssue(i, byId)).join("") : `<p class="empty">${esc(t.noneInFilter)}</p>`}
        </div>
        ${filtered.length > MAX_SHOWN ? `<p class="note">${esc(fill(t.showing, { shown: String(MAX_SHOWN), total: String(filtered.length) }))}</p>` : ""}
      `}
    </section>`;
}

function render() {
  const t = s();
  document.documentElement.lang = state.lang;
  document.title = `${t.pageTitle} · Padu Data`;

  app.innerHTML = `
    <header class="nav">
      <div class="wrap">
        <a class="brand" href="/">
          <svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><g transform="rotate(45 16 16)">
            <rect x="9.75" y="3.75" width="12.5" height="5.5" rx="2.75" fill="var(--muted)"/>
            <rect x="22.75" y="9.75" width="5.5" height="12.5" rx="2.75" fill="var(--muted)"/>
            <rect x="9.75" y="22.75" width="12.5" height="5.5" rx="2.75" fill="var(--muted)"/>
            <rect x="3.75" y="9.75" width="5.5" height="12.5" rx="2.75" fill="var(--muted)"/>
            <rect x="11.75" y="11.75" width="8.5" height="8.5" rx="1.8" fill="var(--accent)"/></g></svg>
          Padu Data
        </a>
        <div class="lang" role="group" aria-label="Language">
          <button type="button" data-action="lang" data-value="id" aria-pressed="${state.lang === "id"}">ID</button>
          <button type="button" data-action="lang" data-value="en" aria-pressed="${state.lang === "en"}">EN</button>
        </div>
      </div>
    </header>

    <main class="wrap">
      <section class="hero">
        <div class="eyebrow">${esc(t.eyebrow)}</div>
        <h1>${esc(t.title)}</h1>
        <p class="lede">${esc(t.lede)}</p>
        <p class="privacy"><svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="currentColor" stroke-width="1.4"/></svg>${esc(t.privacy)}</p>
      </section>

      <section class="block">
        <h2>${esc(t.step1)}</h2>
        <p class="hint">${esc(t.step1Hint)}</p>
        <label class="drop" id="drop">
          <input type="file" id="file-input" accept=".csv,.xlsx,.xls,text/csv" multiple>
          <span class="drop-title">${esc(t.dropTitle)}</span>
          <span class="drop-hint mono">${esc(t.dropHint)}</span>
        </label>
        <div class="demo-row">
          <button type="button" class="btn btn-ghost" data-action="demo">${esc(t.tryDemo)}</button>
          <span class="note">${esc(t.demoNote)}</span>
        </div>
        <p class="note">${esc(t.excelTip)}</p>
        ${state.files.length ? `<div class="files">${state.files.map(renderFile).join("")}</div>
          <div class="run-row"><button type="button" class="btn btn-primary" data-action="run">${esc(t.run)}</button></div>` : ""}
        ${state.error ? `<p class="error" role="alert">${esc(state.error)}</p>` : ""}
      </section>

      ${state.result ? renderResults(state.result) : ""}

      <section class="block limits">
        <h2>${esc(t.limitsTitle)}</h2>
        <ul>${t.limits.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>
      </section>

      <section class="block cta">
        <h2>${esc(t.ctaTitle)}</h2>
        <p>${esc(t.ctaBody)}</p>
        <a class="btn btn-primary" href="/#contact">${esc(t.ctaButton)}</a>
      </section>
    </main>

    <footer><div class="wrap"><a href="/">${esc(t.back)}</a><span class="mono">padudata.com</span></div></footer>`;
}

// ---------- events (delegated, so they survive re-renders) ----------

app.addEventListener("click", (event) => {
  const el = (event.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!el) return;
  const { action, value, file } = el.dataset;
  if (action === "demo") loadDemo();
  else if (action === "run") run();
  else if (action === "export") exportXlsx();
  else if (action === "remove") {
    state.files = state.files.filter((f) => f.id !== file);
    state.result = null;
    render();
  } else if (action === "cat") {
    state.category = value as Category | "all";
    render();
  } else if (action === "sev") {
    state.severity = value as Severity | "all";
    render();
  } else if (action === "lang") {
    state.lang = value as Lang;
    saveLang(state.lang);
    render();
  }
});

app.addEventListener("change", (event) => {
  const el = event.target as HTMLElement;
  if (el.id === "file-input") {
    addFiles((el as HTMLInputElement).files);
    return;
  }
  const select = el.closest<HTMLSelectElement>("select[data-map]");
  if (select) {
    const f = state.files.find((x) => x.id === select.dataset.map);
    if (f) f.mapping[select.dataset.field as Field] = Number(select.value);
  }
});

app.addEventListener("input", (event) => {
  const input = (event.target as HTMLElement).closest<HTMLInputElement>("input[data-source]");
  if (!input) return;
  const f = state.files.find((x) => x.id === input.dataset.source);
  if (f) f.source = input.value;
});

app.addEventListener("dragover", (event) => {
  if (!(event.target as HTMLElement).closest("#drop")) return;
  event.preventDefault();
  document.getElementById("drop")?.classList.add("over");
});
app.addEventListener("dragleave", () => document.getElementById("drop")?.classList.remove("over"));
app.addEventListener("drop", (event) => {
  if (!(event.target as HTMLElement).closest("#drop")) return;
  event.preventDefault();
  addFiles(event.dataTransfer?.files ?? null);
});

// padudata.com/health-check/#demo opens straight into the sample results.
if (location.hash === "#demo") loadDemo(false);
else render();
