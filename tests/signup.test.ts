import { describe, expect, it } from "vitest";
import { normalizeWhatsapp, parseSignup } from "../worker/signup";

const valid = {
  name: "Rina Wulandari",
  email: "Rina@Contoh.co.id",
  whatsapp: "0812-3456-7890",
  role: "admin-pajak",
  npwpCount: "2-5",
  invoiceVolume: "300-1000",
  plan: "bisnis",
  billing: "tahunan",
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

describe("parseSignup", () => {
  it("normalizes a valid signup", () => {
    const r = parseSignup(valid);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.email).toBe("rina@contoh.co.id");
      expect(r.data.whatsapp).toBe("6281234567890");
      expect(r.data.source).toBe("");
    }
  });

  it("reports every invalid field", () => {
    const r = parseSignup({ ...valid, email: "bukan-email", plan: "gratis", consent: false });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["consent", "email", "plan"]);
  });

  it("ignores non-string input", () => {
    const r = parseSignup({ ...valid, name: 42, role: ["admin-pajak"] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["name", "role"]);
  });
});
