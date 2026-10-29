// Kreditin plans, prices and checkout validation. Pure functions with no
// Worker globals: the checkout page imports the price list from here too,
// and tests/order.test.ts covers the rules.

export const PLANS = {
  mandiri: { name: "Mandiri", monthly: 99_000, npwp: 1, invoices: 300 },
  bisnis: { name: "Bisnis", monthly: 299_000, npwp: 5, invoices: 2_000 },
  konsultan: { name: "Konsultan", monthly: 799_000, npwp: 25, invoices: 10_000 },
} as const;
export type Plan = keyof typeof PLANS;

export const BILLING = ["bulanan", "tahunan"] as const;
export type Billing = (typeof BILLING)[number];

/** Total charged for one billing period. Yearly is 10 months' price for 12 months. */
export function priceFor(plan: Plan, billing: Billing): number {
  return PLANS[plan].monthly * (billing === "tahunan" ? 10 : 1);
}

export const PAYMENT_METHODS = {
  qris: "QRIS",
  "va-bca": "Virtual Account BCA",
  "va-bni": "Virtual Account BNI",
  "va-bri": "Virtual Account BRI",
  "va-mandiri": "Virtual Account Mandiri",
  "va-permata": "Virtual Account Permata",
  ovo: "OVO",
  dana: "DANA",
  shopeepay: "ShopeePay",
  alfamart: "Alfamart",
  indomaret: "Indomaret",
} as const;
export type PaymentMethod = keyof typeof PAYMENT_METHODS;

export const ROLES = ["admin-pajak", "staf-finance", "konsultan-pajak", "pemilik-usaha", "lainnya"] as const;
export const NPWP_COUNTS = ["1", "2-5", "6-25", "26+"] as const;
export const INVOICE_VOLUMES = ["<100", "100-300", "300-1000", "1000-5000", ">5000"] as const;

export interface Order {
  plan: Plan;
  billing: Billing;
  amount: number;
  paymentMethod: PaymentMethod;
  name: string;
  email: string;
  whatsapp: string;
  company: string;
  role: (typeof ROLES)[number];
  npwpCount: (typeof NPWP_COUNTS)[number];
  invoiceVolume: (typeof INVOICE_VOLUMES)[number];
  source: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  referrer: string;
}

type Field = Exclude<keyof Order, "amount"> | "consent";
export type OrderResult = { ok: true; data: Order } | { ok: false; errors: Partial<Record<Field, string>> };

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

function keyOf<T extends object>(v: unknown, obj: T): keyof T | null {
  return typeof v === "string" && Object.hasOwn(obj, v) ? (v as keyof T) : null;
}

export function parseOrder(input: Record<string, unknown>): OrderResult {
  const errors: Partial<Record<Field, string>> = {};

  const plan = keyOf(input.plan, PLANS);
  if (!plan) errors.plan = "Pilih paket.";
  const billing = oneOf(input.billing, BILLING);
  if (!billing) errors.billing = "Pilih periode tagihan.";
  const paymentMethod = keyOf(input.paymentMethod, PAYMENT_METHODS);
  if (!paymentMethod) errors.paymentMethod = "Pilih metode pembayaran.";

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

  if (input.consent !== true) errors.consent = "Centang persetujuan untuk melanjutkan.";

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    data: {
      plan: plan!,
      billing: billing!,
      // Always priced on the server; the amount shown in the browser is display only.
      amount: priceFor(plan!, billing!),
      paymentMethod: paymentMethod!,
      name,
      email,
      whatsapp: whatsapp!,
      company: text(input.company, 160),
      role: role!,
      npwpCount: npwpCount!,
      invoiceVolume: invoiceVolume!,
      source: text(input.source, 200),
      utmSource: text(input.utmSource, 100),
      utmMedium: text(input.utmMedium, 100),
      utmCampaign: text(input.utmCampaign, 100),
      referrer: text(input.referrer, 300),
    },
  };
}

// No 0/O or 1/I, so codes read cleanly over WhatsApp.
const CODE_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

/** Order code such as KRD-7QF3MZ. `random` returns bytes; injectable for tests. */
export function orderCode(random: (n: number) => Uint8Array): string {
  const bytes = random(6);
  let s = "";
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return "KRD-" + s;
}
