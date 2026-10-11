// UI text in Indonesian and English.

import type { Category, IssueCode, Severity } from "../lib/checks";
import type { Field } from "./parse";

export type Lang = "id" | "en";

interface IssueText {
  title: string;
  detail: string;
}

interface Strings {
  pageTitle: string;
  eyebrow: string;
  title: string;
  lede: string;
  privacy: string;
  step1: string;
  step1Hint: string;
  dropTitle: string;
  dropHint: string;
  excelTip: string;
  tryDemo: string;
  demoNote: string;
  source: string;
  rows: string;
  remove: string;
  notMapped: string;
  fields: Record<Field, string>;
  run: string;
  needName: string;
  readError: string;
  results: string;
  records: string;
  sources: string;
  clean: string;
  issues: string;
  categories: Record<Category, string>;
  severities: Record<Severity, string>;
  all: string;
  noIssues: string;
  noneInFilter: string;
  showing: string;
  export: string;
  colSource: string;
  colRow: string;
  colName: string;
  colTaxId: string;
  colBank: string;
  limitsTitle: string;
  limits: string[];
  ctaTitle: string;
  ctaBody: string;
  ctaButton: string;
  back: string;
  issue: Record<IssueCode, IssueText>;
}

export const STRINGS: Record<Lang, Strings> = {
  id: {
    pageTitle: "Vendor Master Health Check",
    eyebrow: "Tool gratis · Padu Data",
    title: "Vendor Master Health Check",
    lede: "Unggah ekspor master vendor dari satu atau beberapa ERP. Dalam hitungan detik Anda melihat NPWP yang bermasalah untuk Coretax, vendor ganda, data yang tidak konsisten antar-sistem, dan rekening yang mencurigakan.",
    privacy: "Diproses sepenuhnya di browser Anda. Data tidak dikirim ke server mana pun.",
    step1: "1. Tambahkan file",
    step1Hint: "CSV atau Excel, satu file per ERP. Beri nama sumbernya supaya perbandingan antar-sistem jelas.",
    dropTitle: "Tarik file ke sini atau klik untuk memilih",
    dropHint: ".csv, .xlsx, .xls",
    excelTip: "Tips: di Excel, format kolom NPWP sebagai Text sebelum ekspor. Kalau tidak, angka 0 di depan dan digit terakhir bisa hilang.",
    tryDemo: "Coba dengan data contoh",
    demoNote: "Data contoh berisi 3 ekspor fiktif (D365, AX 2012, Odoo) dengan masalah yang sengaja ditanam.",
    source: "Sumber",
    rows: "baris",
    remove: "Hapus",
    notMapped: "(tidak ada)",
    fields: { name: "Nama vendor", taxId: "NPWP / NIK", nitku: "NITKU", address: "Alamat", bankAccount: "No. rekening" },
    run: "Periksa data",
    needName: "Pilih kolom nama vendor untuk setiap file.",
    readError: "File tidak bisa dibaca",
    results: "2. Hasil pemeriksaan",
    records: "Record",
    sources: "Sumber",
    clean: "Tanpa masalah",
    issues: "Temuan",
    categories: { taxid: "Identitas pajak", duplicate: "Duplikat", crossErp: "Antar-ERP", fraud: "Indikasi fraud" },
    severities: { high: "Tinggi", medium: "Sedang", low: "Rendah" },
    all: "Semua",
    noIssues: "Tidak ada temuan. Data vendor Anda terlihat konsisten.",
    noneInFilter: "Tidak ada temuan untuk filter ini.",
    showing: "Menampilkan {shown} dari {total} temuan. Ekspor ke Excel untuk daftar lengkap.",
    export: "Ekspor ke Excel",
    colSource: "Sumber",
    colRow: "Baris",
    colName: "Nama",
    colTaxId: "NPWP / NIK",
    colBank: "Rekening",
    limitsTitle: "Batasan tool ini",
    limits: [
      "Yang dicek adalah format dan konsistensi. Status terdaftar di DJP tidak dicek.",
      "Digit kontrol NPWP 15 digit tidak diverifikasi karena algoritmanya tidak dipublikasikan DJP.",
      "Deteksi nama mirip bisa menghasilkan positif palsu. Anggap sebagai daftar yang perlu diperiksa, bukan kesimpulan.",
    ],
    ctaTitle: "Temuannya banyak?",
    ctaBody: "Padu Data sedang membangun platform yang mencegah masalah ini sejak awal: AI meninjau setiap perubahan master data, manusia yang memutuskan, dan data yang disetujui disinkronkan ke semua ERP.",
    ctaButton: "Bicara dengan kami",
    back: "Kembali ke Padu Data",
    issue: {
      taxid_empty: { title: "NPWP/NIK kosong", detail: "Vendor tanpa identitas pajak tidak bisa dicocokkan dengan faktur pajak di Coretax." },
      taxid_chars: { title: "Ada huruf di kolom NPWP", detail: "Nilai: {value}. Kolom identitas pajak sebaiknya hanya berisi angka." },
      taxid_length: { title: "Panjang NPWP/NIK tidak valid", detail: "Nilai: {value}. NPWP 15 atau 16 digit, NIK 16 digit." },
      taxid_placeholder: { title: "NPWP diisi asal", detail: "Nilai: {value}. Biasanya diisi supaya kolom wajib tidak kosong." },
      taxid_legacy15: { title: "NPWP masih format 15 digit", detail: "{legacy} sebaiknya diganti ke format 16 digit {suggested} untuk Coretax." },
      taxid_unrecognized: { title: "16 digit, tapi bukan NPWP badan maupun NIK", detail: "Nilai: {value}. NPWP badan 16 digit diawali 0. Selain itu, strukturnya harus sesuai NIK." },
      nitku_length: { title: "Panjang NITKU tidak valid", detail: "Nilai: {value}. NITKU terdiri dari 22 digit." },
      nitku_mismatch: { title: "NITKU tidak cocok dengan NPWP", detail: "NITKU {value} tidak diawali NPWP vendor ini ({npwp})." },
      dup_same_taxid: { title: "Vendor ganda di {source}", detail: "Beberapa record di sistem yang sama memakai NPWP {npwp}." },
      dup_name_diff_taxid: { title: "Nama sama, NPWP berbeda", detail: "\"{name}\" tercatat dengan NPWP yang berbeda. Salah satunya kemungkinan salah ketik." },
      dup_similar_name: { title: "Nama mirip, mungkin vendor yang sama", detail: "Kemiripan nama {score}. Periksa apakah ini vendor yang sama." },
      xerp_name_mismatch: { title: "Ejaan nama berbeda antar-ERP", detail: "Vendor dengan NPWP {npwp} ditulis dengan nama berbeda di tiap sistem." },
      xerp_bank_mismatch: { title: "Rekening berbeda antar-ERP", detail: "Vendor dengan NPWP {npwp} punya rekening berbeda di sistem yang berbeda. Pastikan mana yang benar sebelum membayar." },
      bank_shared: { title: "Satu rekening untuk vendor berbeda", detail: "Rekening {account} terdaftar untuk beberapa vendor dengan identitas berbeda. Pola ini sering muncul pada fraud pembayaran." },
    },
  },
  en: {
    pageTitle: "Vendor Master Health Check",
    eyebrow: "Free tool · Padu Data",
    title: "Vendor Master Health Check",
    lede: "Upload vendor master exports from one or more ERPs. In seconds you see tax IDs that will cause trouble in Coretax, duplicate vendors, data that differs between systems, and suspicious bank accounts.",
    privacy: "Processed entirely in your browser. No data is sent to any server.",
    step1: "1. Add files",
    step1Hint: "CSV or Excel, one file per ERP. Name each source so cross-system comparisons are clear.",
    dropTitle: "Drop files here or click to choose",
    dropHint: ".csv, .xlsx, .xls",
    excelTip: "Tip: in Excel, format the NPWP column as Text before exporting. Otherwise leading zeros and trailing digits can be lost.",
    tryDemo: "Try with sample data",
    demoNote: "The sample has 3 fictional exports (D365, AX 2012, Odoo) with problems planted on purpose.",
    source: "Source",
    rows: "rows",
    remove: "Remove",
    notMapped: "(none)",
    fields: { name: "Vendor name", taxId: "NPWP / NIK", nitku: "NITKU", address: "Address", bankAccount: "Bank account" },
    run: "Check data",
    needName: "Choose the vendor name column for every file.",
    readError: "Couldn't read file",
    results: "2. Results",
    records: "Records",
    sources: "Sources",
    clean: "No issues",
    issues: "Findings",
    categories: { taxid: "Tax identity", duplicate: "Duplicates", crossErp: "Cross-ERP", fraud: "Fraud signals" },
    severities: { high: "High", medium: "Medium", low: "Low" },
    all: "All",
    noIssues: "No findings. Your vendor data looks consistent.",
    noneInFilter: "No findings for this filter.",
    showing: "Showing {shown} of {total} findings. Export to Excel for the full list.",
    export: "Export to Excel",
    colSource: "Source",
    colRow: "Row",
    colName: "Name",
    colTaxId: "NPWP / NIK",
    colBank: "Bank account",
    limitsTitle: "What this tool doesn't do",
    limits: [
      "It checks format and consistency. It does not check registration status with DJP.",
      "The check digit of 15-digit NPWPs is not verified, because DJP has not published the algorithm.",
      "Similar-name matching can produce false positives. Treat it as a list to review, not a verdict.",
    ],
    ctaTitle: "Lots of findings?",
    ctaBody: "Padu Data is building a platform that prevents these problems at the source: AI reviews every master data change, a person decides, and approved records sync to every ERP.",
    ctaButton: "Talk to us",
    back: "Back to Padu Data",
    issue: {
      taxid_empty: { title: "Missing NPWP/NIK", detail: "A vendor without a tax ID can't be matched to tax invoices in Coretax." },
      taxid_chars: { title: "Letters in the NPWP column", detail: "Value: {value}. The tax ID column should contain digits only." },
      taxid_length: { title: "Invalid NPWP/NIK length", detail: "Value: {value}. An NPWP has 15 or 16 digits, a NIK has 16." },
      taxid_placeholder: { title: "Placeholder NPWP", detail: "Value: {value}. Usually typed to get past a required field." },
      taxid_legacy15: { title: "NPWP still in 15-digit format", detail: "Replace {legacy} with the 16-digit {suggested} for Coretax." },
      taxid_unrecognized: { title: "16 digits, but neither an entity NPWP nor a NIK", detail: "Value: {value}. A 16-digit entity NPWP starts with 0. Anything else must follow the NIK structure." },
      nitku_length: { title: "Invalid NITKU length", detail: "Value: {value}. A NITKU has 22 digits." },
      nitku_mismatch: { title: "NITKU doesn't match the NPWP", detail: "NITKU {value} doesn't start with this vendor's NPWP ({npwp})." },
      dup_same_taxid: { title: "Duplicate vendor in {source}", detail: "Several records in the same system share NPWP {npwp}." },
      dup_name_diff_taxid: { title: "Same name, different NPWP", detail: "\"{name}\" is recorded with different NPWPs. One of them is probably a typo." },
      dup_similar_name: { title: "Similar names, possibly the same vendor", detail: "Name similarity {score}. Check whether these are the same vendor." },
      xerp_name_mismatch: { title: "Name spelled differently across ERPs", detail: "The vendor with NPWP {npwp} has a different name in each system." },
      xerp_bank_mismatch: { title: "Different bank account across ERPs", detail: "The vendor with NPWP {npwp} has different bank accounts in different systems. Confirm which is correct before paying." },
      bank_shared: { title: "One bank account for different vendors", detail: "Account {account} belongs to several vendors with different identities. This pattern often shows up in payment fraud." },
    },
  },
};

export function fill(template: string, params: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => params[k] ?? "");
}

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem("hc-lang");
    if (saved === "id" || saved === "en") return saved;
  } catch {
    // storage unavailable: fall through to the browser language
  }
  return navigator.language.toLowerCase().startsWith("id") ? "id" : "en";
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem("hc-lang", lang);
  } catch {
    // not critical
  }
}
