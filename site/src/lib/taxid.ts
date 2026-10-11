// Format checks for Indonesian tax identity numbers.
//
// Only format and internal consistency are checked here. Whether a number is
// actually registered can only be confirmed against DJP (directly or through a
// PJAP), which this module does not do.
//
// - NPWP 15 digits: legacy format (XX.XXX.XXX.X-XXX.XXX). The 9th digit is a
//   check digit, but DJP has not published the algorithm, so it is not verified.
// - NPWP 16 digits for entities: "0" + the 15-digit NPWP.
// - NPWP 16 digits for resident individuals: the NIK.
// - NITKU: 22 digits = 16-digit NPWP + a 6-digit sequence assigned by DJP.

export type TaxIdKind = "empty" | "npwp15" | "npwp16" | "nik" | "invalid";

export type TaxIdIssue =
  | "taxid_empty"
  | "taxid_chars"
  | "taxid_length"
  | "taxid_placeholder"
  | "taxid_legacy15"
  | "taxid_unrecognized";

export interface TaxIdResult {
  raw: string;
  digits: string;
  kind: TaxIdKind;
  /** 16-digit form used to compare records, or null when the number is unusable. */
  npwp16: string | null;
  issues: TaxIdIssue[];
}

export const digitsOnly = (value: string): string => value.replace(/\D/g, "");

/** Repeated digits or obvious sequences that people type to get past a required field. */
function isPlaceholder(digits: string): boolean {
  if (/^(\d)\1+$/.test(digits)) return true;
  return ["012345678901234", "0123456789012345", "123456789012345", "1234567890123456"].includes(digits);
}

/**
 * Structural check for a NIK: 2-digit province (11-96), regency, district,
 * then birth date as DDMMYY where women add 40 to the day.
 */
export function looksLikeNik(digits: string): boolean {
  if (!/^\d{16}$/.test(digits)) return false;
  const province = Number(digits.slice(0, 2));
  const day = Number(digits.slice(6, 8));
  const month = Number(digits.slice(8, 10));
  const dayOk = (day >= 1 && day <= 31) || (day >= 41 && day <= 71);
  return province >= 11 && province <= 96 && dayOk && month >= 1 && month <= 12;
}

export function checkTaxId(raw: string): TaxIdResult {
  const value = (raw ?? "").trim();
  const digits = digitsOnly(value);
  const issues: TaxIdIssue[] = [];

  if (!value) return { raw: value, digits, kind: "empty", npwp16: null, issues: ["taxid_empty"] };

  // Separators (dots, dashes, spaces) are normal. Letters are not.
  if (/[^0-9.\-\s]/.test(value)) issues.push("taxid_chars");

  if (digits.length > 0 && isPlaceholder(digits)) {
    issues.push("taxid_placeholder");
    return { raw: value, digits, kind: "invalid", npwp16: null, issues };
  }

  if (digits.length === 15) {
    issues.push("taxid_legacy15");
    return { raw: value, digits, kind: "npwp15", npwp16: "0" + digits, issues };
  }

  if (digits.length === 16) {
    if (digits.startsWith("0")) return { raw: value, digits, kind: "npwp16", npwp16: digits, issues };
    if (looksLikeNik(digits)) return { raw: value, digits, kind: "nik", npwp16: digits, issues };
    issues.push("taxid_unrecognized");
    return { raw: value, digits, kind: "invalid", npwp16: null, issues };
  }

  issues.push("taxid_length");
  return { raw: value, digits, kind: "invalid", npwp16: null, issues };
}

export type NitkuIssue = "nitku_length" | "nitku_mismatch";

/** Checks a NITKU against the record's own NPWP. Empty NITKU is not an issue by itself. */
export function checkNitku(raw: string, npwp16: string | null): NitkuIssue[] {
  const digits = digitsOnly(raw ?? "");
  if (!digits) return [];
  if (digits.length !== 22) return ["nitku_length"];
  if (npwp16 && !digits.startsWith(npwp16)) return ["nitku_mismatch"];
  return [];
}

/** Formats a 15-digit NPWP the way it is printed: 01.234.567.8-901.000 */
export function formatNpwp15(digits: string): string {
  if (digits.length !== 15) return digits;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}.${digits.slice(8, 9)}-${digits.slice(9, 12)}.${digits.slice(12)}`;
}
