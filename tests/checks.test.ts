import { describe, expect, it } from "vitest";
import { runChecks, type VendorRecord } from "../site/src/lib/checks";
import { jaroWinkler, normalizeName } from "../site/src/lib/names";

let n = 0;
const rec = (source: string, name: string, taxId: string, bankAccount = "", nitku = ""): VendorRecord => ({
  id: `r${++n}`, source, row: n, name, taxId, nitku, address: "", bankAccount,
});
const codes = (records: VendorRecord[]) => runChecks(records).issues.map((i) => i.code).sort();

describe("normalizeName", () => {
  it("drops legal forms and punctuation", () => {
    expect(normalizeName("PT. Sinar Logam Abadi, Tbk")).toBe("sinar logam abadi");
    expect(normalizeName("Sinar Logam Abadi, PT")).toBe("sinar logam abadi");
  });
});

describe("jaroWinkler", () => {
  it("scores a one-letter typo high and unrelated names low", () => {
    expect(jaroWinkler("sinar logam abadi", "sinar logam abdi")).toBeGreaterThan(0.93);
    expect(jaroWinkler("sinar logam abadi", "hijau daun agro")).toBeLessThan(0.6);
  });
});

describe("runChecks", () => {
  it("reports nothing for one consistent vendor in two systems", () => {
    expect(codes([
      rec("D365", "PT Gemilang Elektrik", "0067890123456000", "1112223334"),
      rec("AX", "Gemilang Elektrik, PT", "0067890123456000", "1112223334"),
    ])).toEqual([]);
  });

  it("finds a bank account mismatch across systems", () => {
    expect(codes([
      rec("D365", "PT Sinar Logam Abadi", "0012345678901000", "4410000001"),
      rec("Odoo", "PT Sinar Logam Abadi", "0012345678901000", "2208000002"),
    ])).toEqual(["xerp_bank_mismatch"]);
  });

  it("finds a duplicate inside one system", () => {
    expect(codes([
      rec("AX", "CV Maju Bersama Teknik", "0023456789012000"),
      rec("AX", "Maju Bersama Teknik", "0023456789012000"),
    ])).toEqual(["dup_same_taxid"]);
  });

  it("finds the same name with different tax IDs", () => {
    expect(codes([
      rec("D365", "PT Delta Pangan Nusantara", "0045678901234000"),
      rec("AX", "PT Delta Pangan Nusantara", "0045678901243000"),
    ])).toEqual(["dup_name_diff_taxid"]);
  });

  it("finds similar names that may be the same vendor", () => {
    expect(codes([
      rec("D365", "PT Karya Prima Logistik", "0034567890123000"),
      rec("Odoo", "PT Karya Prima Logistic", ""),
    ])).toEqual(["dup_similar_name", "taxid_empty"]);
  });

  it("flags one bank account shared by different vendors", () => {
    expect(codes([
      rec("D365", "PT Cahaya Mandiri Sentosa", "0090123456789000", "1230045678"),
      rec("D365", "PT Putra Abadi Jaya", "0091234567890000", "123-004-5678"),
    ])).toEqual(["bank_shared"]);
  });

  it("does not treat a missing tax ID as a different vendor for a shared bank account", () => {
    expect(codes([
      rec("D365", "CV Maju Bersama Teknik", "0023456789012000", "7771234501"),
      rec("Odoo", "Maju Bersama Teknik", "", "7771234501"),
    ])).toEqual(["taxid_empty"]);
  });

  it("does not flag a shared bank account when the untaxed record's name is only a typo away", () => {
    expect(codes([
      rec("D365", "PT Karya Prima Logistik", "0034567890123000", "5550001112"),
      rec("Odoo", "PT Karya Prima Logistic", "", "5550001112"),
    ])).toEqual(["dup_similar_name", "taxid_empty"]);
  });

  it("counts records without any issue as clean", () => {
    const result = runChecks([
      rec("D365", "PT Hijau Daun Agro", "0078901234567000"),
      rec("D365", "UD Sumber Rejeki", ""),
    ]);
    expect(result.cleanCount).toBe(1);
  });
});
