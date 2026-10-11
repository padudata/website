import { describe, expect, it } from "vitest";
import { checkNitku, checkTaxId, formatNpwp15, looksLikeNik } from "../site/src/lib/taxid";

describe("checkTaxId", () => {
  it("accepts a 16-digit entity NPWP", () => {
    const r = checkTaxId("0012345678901000");
    expect(r.kind).toBe("npwp16");
    expect(r.npwp16).toBe("0012345678901000");
    expect(r.issues).toEqual([]);
  });

  it("flags a legacy 15-digit NPWP and suggests the 16-digit form", () => {
    const r = checkTaxId("01.234.567.8-901.000");
    expect(r.kind).toBe("npwp15");
    expect(r.npwp16).toBe("0012345678901000");
    expect(r.issues).toEqual(["taxid_legacy15"]);
  });

  it("accepts a structurally valid NIK", () => {
    const r = checkTaxId("3273011505800003");
    expect(r.kind).toBe("nik");
    expect(r.issues).toEqual([]);
  });

  it("rejects 16 digits that are neither an entity NPWP nor a NIK", () => {
    // month 13 is not a valid birth month
    expect(checkTaxId("3273011513800003").issues).toEqual(["taxid_unrecognized"]);
  });

  it("flags empty, wrong length, placeholders and letters", () => {
    expect(checkTaxId("  ").issues).toEqual(["taxid_empty"]);
    expect(checkTaxId("01.234.567.8-90").issues).toEqual(["taxid_length"]);
    expect(checkTaxId("0000000000000000").issues).toEqual(["taxid_placeholder"]);
    expect(checkTaxId("NPWP 0012345678901000").issues).toEqual(["taxid_chars"]);
  });
});

describe("looksLikeNik", () => {
  it("accepts women's birth days (day + 40)", () => {
    expect(looksLikeNik("3273015505800003")).toBe(true);
  });
  it("rejects an out-of-range province code", () => {
    expect(looksLikeNik("0973011505800003")).toBe(false);
  });
});

describe("checkNitku", () => {
  it("accepts a NITKU that starts with the record's NPWP", () => {
    expect(checkNitku("0012345678901000000000", "0012345678901000")).toEqual([]);
  });
  it("flags a NITKU from another NPWP", () => {
    expect(checkNitku("0034567890124000000001", "0034567890123000")).toEqual(["nitku_mismatch"]);
  });
  it("flags a wrong length and ignores an empty NITKU", () => {
    expect(checkNitku("00123456789010000", "0012345678901000")).toEqual(["nitku_length"]);
    expect(checkNitku("", "0012345678901000")).toEqual([]);
  });
});

it("formats a 15-digit NPWP", () => {
  expect(formatNpwp15("012345678901000")).toBe("01.234.567.8-901.000");
});
