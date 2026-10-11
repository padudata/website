// Runs every health check over vendor records from one or more ERP exports.

import { checkNitku, checkTaxId, digitsOnly, formatNpwp15, type TaxIdResult } from "./taxid";
import { jaroWinkler, normalizeName } from "./names";

export interface VendorRecord {
  id: string;
  /** ERP or file the record came from, e.g. "D365". */
  source: string;
  /** Row number in the source file, 1-based, header excluded. */
  row: number;
  name: string;
  taxId: string;
  nitku: string;
  address: string;
  bankAccount: string;
}

export type Severity = "high" | "medium" | "low";
export type Category = "taxid" | "duplicate" | "crossErp" | "fraud";

export type IssueCode =
  | "taxid_empty"
  | "taxid_chars"
  | "taxid_length"
  | "taxid_placeholder"
  | "taxid_legacy15"
  | "taxid_unrecognized"
  | "nitku_length"
  | "nitku_mismatch"
  | "dup_same_taxid"
  | "dup_name_diff_taxid"
  | "dup_similar_name"
  | "xerp_name_mismatch"
  | "xerp_bank_mismatch"
  | "bank_shared";

export interface Issue {
  id: string;
  code: IssueCode;
  category: Category;
  severity: Severity;
  recordIds: string[];
  /** Values for the message template, e.g. the suggested 16-digit NPWP. */
  params: Record<string, string>;
}

export interface CheckResult {
  records: VendorRecord[];
  issues: Issue[];
  sources: string[];
  /** Records not referenced by any issue. */
  cleanCount: number;
}

const META: Record<IssueCode, { category: Category; severity: Severity }> = {
  taxid_empty: { category: "taxid", severity: "medium" },
  taxid_chars: { category: "taxid", severity: "low" },
  taxid_length: { category: "taxid", severity: "high" },
  taxid_placeholder: { category: "taxid", severity: "high" },
  taxid_legacy15: { category: "taxid", severity: "medium" },
  taxid_unrecognized: { category: "taxid", severity: "high" },
  nitku_length: { category: "taxid", severity: "medium" },
  nitku_mismatch: { category: "taxid", severity: "high" },
  dup_same_taxid: { category: "duplicate", severity: "high" },
  dup_name_diff_taxid: { category: "duplicate", severity: "high" },
  dup_similar_name: { category: "duplicate", severity: "medium" },
  xerp_name_mismatch: { category: "crossErp", severity: "low" },
  xerp_bank_mismatch: { category: "crossErp", severity: "high" },
  bank_shared: { category: "fraud", severity: "high" },
};

/** Names at or above this Jaro-Winkler score are reported as possible duplicates. */
export const SIMILAR_NAME_THRESHOLD = 0.93;

const SEVERITY_ORDER: Record<Severity, number> = { high: 0, medium: 1, low: 2 };

function groupBy<T>(items: T[], key: (item: T) => string | null): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!k) continue;
    const list = groups.get(k);
    if (list) list.push(item);
    else groups.set(k, [item]);
  }
  return groups;
}

const distinct = <T>(values: T[]): T[] => [...new Set(values)];

export function runChecks(records: VendorRecord[]): CheckResult {
  const issues: Issue[] = [];
  let seq = 0;
  const add = (code: IssueCode, recordIds: string[], params: Record<string, string> = {}) => {
    issues.push({ id: `i${++seq}`, code, ...META[code], recordIds, params });
  };

  const tax = new Map<string, TaxIdResult>();
  const normName = new Map<string, string>();
  const bank = new Map<string, string>();
  for (const r of records) {
    tax.set(r.id, checkTaxId(r.taxId));
    normName.set(r.id, normalizeName(r.name));
    const account = digitsOnly(r.bankAccount);
    bank.set(r.id, account.length >= 6 ? account : "");
  }

  // 1. Tax identity format, per record.
  for (const r of records) {
    const t = tax.get(r.id)!;
    for (const code of t.issues) {
      const params: Record<string, string> = { value: t.raw };
      if (code === "taxid_legacy15") {
        params.legacy = formatNpwp15(t.digits);
        params.suggested = t.npwp16 ?? "";
      }
      add(code, [r.id], params);
    }
    for (const code of checkNitku(r.nitku, t.npwp16)) add(code, [r.id], { value: r.nitku, npwp: t.npwp16 ?? "" });
  }

  // 2. Same tax identity: duplicates within one system, inconsistencies across systems.
  const byTax = groupBy(records, (r) => tax.get(r.id)!.npwp16);
  for (const [npwp, group] of byTax) {
    if (group.length < 2) continue;

    for (const [source, inSource] of groupBy(group, (r) => r.source)) {
      if (inSource.length > 1) add("dup_same_taxid", inSource.map((r) => r.id), { npwp, source });
    }

    if (distinct(group.map((r) => r.source)).length < 2) continue;

    if (distinct(group.map((r) => normName.get(r.id)!)).length > 1) {
      add("xerp_name_mismatch", group.map((r) => r.id), { npwp });
    }
    const accounts = distinct(group.map((r) => bank.get(r.id)!).filter(Boolean));
    if (accounts.length > 1) add("xerp_bank_mismatch", group.map((r) => r.id), { npwp });
  }

  // 3. Same name, different tax identity.
  const byName = groupBy(records, (r) => normName.get(r.id) || null);
  for (const [, group] of byName) {
    const withTax = group.filter((r) => tax.get(r.id)!.npwp16);
    if (distinct(withTax.map((r) => tax.get(r.id)!.npwp16)).length > 1) {
      add("dup_name_diff_taxid", group.map((r) => r.id), { name: group[0].name });
    }
  }

  // 4. Similar (not identical) names whose tax identity doesn't already tie them together.
  //    Compared within blocks that share the first two letters to keep this fast.
  const names = [...byName.keys()];
  const blocks = groupBy(names, (n) => (n.length >= 4 ? n.slice(0, 2) : null));
  for (const [, block] of blocks) {
    for (let i = 0; i < block.length; i++) {
      for (let j = i + 1; j < block.length; j++) {
        const score = jaroWinkler(block[i], block[j]);
        if (score < SIMILAR_NAME_THRESHOLD) continue;
        const a = byName.get(block[i])!;
        const b = byName.get(block[j])!;
        const taxA = distinct(a.map((r) => tax.get(r.id)!.npwp16).filter(Boolean));
        const taxB = distinct(b.map((r) => tax.get(r.id)!.npwp16).filter(Boolean));
        const sameTax = taxA.length === 1 && taxB.length === 1 && taxA[0] === taxB[0];
        if (sameTax) continue; // already reported as a cross-ERP name mismatch
        add("dup_similar_name", [...a, ...b].map((r) => r.id), { score: Math.round(score * 100) + "%" });
      }
    }
  }

  // 5. One bank account used by vendors with different identities.
  const byBank = groupBy(records, (r) => bank.get(r.id) || null);
  for (const [account, group] of byBank) {
    // A record without a usable tax ID counts as the same vendor when its name matches,
    // or is very similar to, the name of a record that has one.
    const withTax = group.filter((r) => tax.get(r.id)!.npwp16);
    const taxedNames = distinct(withTax.map((r) => normName.get(r.id)!));
    const sameAsTaxed = (name: string) => taxedNames.some((t) => jaroWinkler(t, name) >= SIMILAR_NAME_THRESHOLD);
    const untaxedNames = group
      .filter((r) => !tax.get(r.id)!.npwp16 && !sameAsTaxed(normName.get(r.id)!))
      .map((r) => normName.get(r.id)!);
    const identities = distinct(withTax.map((r) => tax.get(r.id)!.npwp16)).length + distinct(untaxedNames).length;
    if (identities > 1) add("bank_shared", group.map((r) => r.id), { account });
  }

  issues.sort((x, y) => SEVERITY_ORDER[x.severity] - SEVERITY_ORDER[y.severity]);

  const flagged = new Set(issues.flatMap((i) => i.recordIds));
  return {
    records,
    issues,
    sources: distinct(records.map((r) => r.source)),
    cleanCount: records.filter((r) => !flagged.has(r.id)).length,
  };
}
