import { describe, expect, it } from "vitest";
import { normalizeWhatsapp, orderCode, parseOrder, priceFor } from "../worker/order";

const valid = {
  plan: "bisnis",
  billing: "tahunan",
  paymentMethod: "qris",
  name: "Rina Wulandari",
  email: "Rina@Contoh.co.id",
  whatsapp: "0812-3456-7890",
  company: "PT Contoh Sejahtera",
  role: "admin-pajak",
  npwpCount: "2-5",
  invoiceVolume: "300-1000",
  consent: true,
};

describe("normalizeWhatsapp", () => {
  it("accepts common Indonesian formats", () => {
    expect(normalizeWhatsapp("0812 3456 7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("+62 812-3456-7890")).toBe("6281234567890");
    expect(normalizeWhatsapp("812345678")).toBe("62812345678");
  });

  it("rejects landlines and junk", () => {
    expect(normalizeWhatsapp("021 555 1234")).toBeNull();
    expect(normalizeWhatsapp("12345")).toBeNull();
    expect(normalizeWhatsapp("")).toBeNull();
  });
});

describe("priceFor", () => {
  it("charges 10 months for a yearly plan", () => {
    expect(priceFor("mandiri", "bulanan")).toBe(99_000);
    expect(priceFor("bisnis", "tahunan")).toBe(2_990_000);
    expect(priceFor("konsultan", "tahunan")).toBe(7_990_000);
  });
});

describe("parseOrder", () => {
  it("normalizes a valid order and prices it on the server", () => {
    const r = parseOrder({ ...valid, amount: 1 });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.email).toBe("rina@contoh.co.id");
      expect(r.data.whatsapp).toBe("6281234567890");
      expect(r.data.amount).toBe(2_990_000);
      expect(r.data.source).toBe("");
    }
  });

  it("company is optional", () => {
    expect(parseOrder({ ...valid, company: undefined }).ok).toBe(true);
  });

  it("reports every invalid field", () => {
    const r = parseOrder({ ...valid, email: "bukan-email", plan: "gratis", paymentMethod: "kartu", consent: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["consent", "email", "paymentMethod", "plan"]);
  });

  it("ignores non-string and prototype keys", () => {
    const r = parseOrder({ ...valid, name: 42, role: ["admin-pajak"], plan: "toString" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["name", "plan", "role"]);
  });
});

describe("orderCode", () => {
  it("uses an unambiguous alphabet", () => {
    const code = orderCode((n) => new Uint8Array(n).map((_, i) => i * 37));
    expect(code).toMatch(/^KRD-[2-9A-HJ-NP-Z]{6}$/);
  });
});
