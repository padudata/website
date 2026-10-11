// Reads CSV/XLSX exports into a plain table and guesses which column is which.

import Papa from "papaparse";

export interface Table {
  headers: string[];
  rows: string[][];
}

export type Field = "name" | "taxId" | "nitku" | "address" | "bankAccount";
export const FIELDS: Field[] = ["name", "taxId", "nitku", "address", "bankAccount"];

/** Column index per field, -1 when the file has no such column. */
export type Mapping = Record<Field, number>;

function toTable(matrix: unknown[][]): Table {
  const [head = [], ...body] = matrix;
  const headers = head.map((h) => String(h ?? "").trim());
  const rows = body
    .map((row) => headers.map((_, i) => String(row[i] ?? "").trim()))
    .filter((row) => row.some(Boolean));
  return { headers, rows };
}

export function parseCsvText(text: string): Table {
  const { data } = Papa.parse<string[]>(text.replace(/^\uFEFF/, ""), { skipEmptyLines: true });
  return toTable(data);
}

export async function readFile(file: File): Promise<Table> {
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    // SheetJS is large, so it loads only when an Excel file is actually opened.
    const { read, utils } = await import("xlsx");
    const book = read(await file.arrayBuffer());
    const sheet = book.Sheets[book.SheetNames[0]];
    // raw: false keeps cells as displayed text, so "0012..." stays a string when the column is formatted as text.
    return toTable(utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" }));
  }
  return parseCsvText(await file.text());
}

const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// Header spellings seen in common ERP exports. Matched after lowercasing and stripping punctuation.
const SYNONYMS: Record<Field, string[]> = {
  name: ["name", "vendorname", "suppliername", "nama", "namavendor", "namasupplier", "displayname", "organizationname", "vendororganizationname", "partner", "company"],
  taxId: ["npwp", "nik", "npwpnik", "taxid", "vat", "vatnum", "vatnumber", "taxregistrationnumber", "taxregistrationno", "taxnumber", "tin"],
  nitku: ["nitku", "idtku", "tku", "nitkuvendor"],
  address: ["address", "alamat", "street", "fulladdress", "addressline1", "primaryaddress"],
  bankAccount: ["bankaccount", "bankaccountnumber", "accountnumber", "rekening", "norekening", "nomorrekening", "bankacc", "bankidsaccnumber", "bankaccountsaccountnumber", "iban"],
};

export function guessMapping(headers: string[]): Mapping {
  const keys = headers.map(key);
  const mapping = {} as Mapping;
  const used = new Set<number>();
  for (const field of FIELDS) {
    // Exact synonym first, then a header that contains one ("Vendor NPWP", "Bank account no.").
    let index = keys.findIndex((k, i) => !used.has(i) && SYNONYMS[field].includes(k));
    if (index < 0) index = keys.findIndex((k, i) => !used.has(i) && SYNONYMS[field].some((s) => s.length >= 3 && k.includes(s)));
    if (index >= 0) used.add(index);
    mapping[field] = index;
  }
  return mapping;
}
