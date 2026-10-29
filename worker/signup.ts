// Validation for the Kreditin early-access form. Pure functions, no Worker
// globals, so the same rules are unit tested in tests/signup.test.ts.

export const PLANS = ["mandiri", "bisnis", "konsultan"] as const;
export const BILLING = ["bulanan", "tahunan"] as const;
export const ROLES = ["admin-pajak", "staf-finance", "konsultan-pajak", "pemilik-usaha", "lainnya"] as const;
export const NPWP_COUNTS = ["1", "2-5", "6-25", "26+"] as const;
export const INVOICE_VOLUMES = ["<100", "100-300", "300-1000", "1000-5000", ">5000"] as const;

export interface Signup {
  name: string;
  email: string;
  whatsapp: string;
  role: (typeof ROLES)[number];
  npwpCount: (typeof NPWP_COUNTS)[number];
  invoiceVolume: (typeof INVOICE_VOLUMES)[number];
  plan: (typeof PLANS)[number];
  billing: (typeof BILLING)[number];
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
}

export type SignupResult =
  | { ok: true; data: Signup }
  | { ok: false; errors: Partial<Record<keyof Signup | "consent", string>> };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Normalizes an Indonesian mobile number to 62xxxxxxxxxx, or returns null. */
export function normalizeWhatsapp(raw: string): string | null {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  // Mobile numbers: 62 8xx, 9 to 12 digits after the country code.
  return /^628\d{8,11}$/.test(d) ? d : null;
}

function text(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function oneOf<T extends readonly string[]>(v: unknown, allowed: T): T[number] | null {
  return typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T[number]) : null;
}

export function parseSignup(input: Record<string, unknown>): SignupResult {
  const errors: Partial<Record<keyof Signup | "consent", string>> = {};

  const name = text(input.name, 120);
  if (name.length < 2) errors.name = "Isi nama Anda.";

  const email = text(input.email, 200).toLowerCase();
  if (!EMAIL.test(email)) errors.email = "Alamat email tidak valid.";

  const whatsapp = normalizeWhatsapp(text(input.whatsapp, 30));
  if (!whatsapp) errors.whatsapp = "Nomor WhatsApp tidak valid. Contoh: 0812 3456 7890.";

  const role = oneOf(input.role, ROLES);
  if (!role) errors.role = "Pilih peran Anda.";
  const npwpCount = oneOf(input.npwpCount, NPWP_COUNTS);
  if (!npwpCount) errors.npwpCount = "Pilih jumlah NPWP.";
  const invoiceVolume = oneOf(input.invoiceVolume, INVOICE_VOLUMES);
  if (!invoiceVolume) errors.invoiceVolume = "Pilih perkiraan jumlah faktur.";
  const plan = oneOf(input.plan, PLANS);
  if (!plan) errors.plan = "Pilih paket.";
  const billing = oneOf(input.billing, BILLING);
  if (!billing) errors.billing = "Pilih periode tagihan.";

  if (input.consent !== true) errors.consent = "Centang persetujuan untuk melanjutkan.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name,
      email,
      whatsapp: whatsapp!,
      role: role!,
      npwpCount: npwpCount!,
      invoiceVolume: invoiceVolume!,
      plan: plan!,
      billing: billing!,
      source: text(input.source, 200),
      utmSource: text(input.utmSource, 100),
      utmMedium: text(input.utmMedium, 100),
      utmCampaign: text(input.utmCampaign, 100),
      referrer: text(input.referrer, 300),
    },
  };
}
