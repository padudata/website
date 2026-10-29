// Kreditin checkout: live order summary and order submission.

import { PAYMENT_METHODS, PLANS, priceFor, type Billing, type PaymentMethod, type Plan } from "../../../worker/order";

declare global {
  interface Window {
    turnstile?: { reset(widget?: string | HTMLElement): void };
  }
}

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;

const form = $<HTMLFormElement>("#order-form");
const submit = $<HTMLButtonElement>("#f-submit");
const formErr = $<HTMLElement>("#form-err");

// Preselect from the pricing page link: ?paket=bisnis&periode=tahunan
const params = new URLSearchParams(location.search);
const pick = (name: string, value: string | null) => {
  const radio = value && form.querySelector<HTMLInputElement>(`input[name="${name}"][value="${CSS.escape(value)}"]`);
  if (radio) radio.checked = true;
};
pick("plan", params.get("paket"));
pick("billing", params.get("periode"));

function current() {
  const fd = new FormData(form);
  return {
    plan: fd.get("plan") as Plan,
    billing: fd.get("billing") as Billing,
    method: fd.get("paymentMethod") as PaymentMethod,
  };
}

function render() {
  const { plan, billing, method } = current();
  const p = PLANS[plan];
  const total = priceFor(plan, billing);
  const per = billing === "tahunan" ? "/tahun" : "/bulan";
  document.querySelectorAll<HTMLElement>("[data-price]").forEach((el) => {
    el.textContent = rupiah(priceFor(el.dataset.price as Plan, billing)) + per;
  });
  $("#sum-plan").textContent = `Kreditin ${p.name}`;
  $("#sum-detail").textContent = `${p.npwp} NPWP · ${p.invoices.toLocaleString("id-ID")} faktur/bulan`;
  $("#sum-period").textContent = billing === "tahunan" ? "Tagihan tahunan (12 bulan, bayar 10)" : "Tagihan bulanan";
  $("#sum-price").textContent = rupiah(total);
  $("#sum-subtotal").textContent = rupiah(total);
  $("#sum-total").textContent = rupiah(total);
  $("#sum-method").textContent = PAYMENT_METHODS[method];
}
form.addEventListener("change", render);
render();

function clearErrors() {
  form.querySelectorAll<HTMLElement>("[data-err]").forEach((el) => (el.textContent = ""));
  form.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  formErr.textContent = "";
}

function showErrors(errors: Record<string, string>) {
  let first: HTMLElement | null = null;
  for (const [field, message] of Object.entries(errors)) {
    const slot = form.querySelector<HTMLElement>(`[data-err="${field}"]`);
    if (slot) slot.textContent = message;
    const input = form.querySelector<HTMLElement>(`[name="${field}"]`);
    if (input) {
      input.setAttribute("aria-invalid", "true");
      first ??= input;
    }
  }
  first?.focus();
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearErrors();
  const fd = new FormData(form);
  const { plan, billing, method } = current();
  const payload = {
    plan,
    billing,
    paymentMethod: method,
    name: fd.get("name"),
    company: fd.get("company"),
    email: fd.get("email"),
    whatsapp: fd.get("whatsapp"),
    role: fd.get("role"),
    npwpCount: fd.get("npwpCount"),
    invoiceVolume: fd.get("invoiceVolume"),
    source: fd.get("source"),
    consent: fd.get("consent") === "on",
    turnstile: fd.get("cf-turnstile-response"),
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    referrer: document.referrer,
  };

  submit.disabled = true;
  submit.textContent = "Memproses…";
  try {
    const res = await fetch("/api/kreditin/pesan", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = (await res.json().catch(() => ({}))) as {
      ok?: boolean; code?: string; amount?: number; errors?: Record<string, string>; message?: string;
    };
    if (res.ok && out.ok && out.code) {
      $("#done-code").textContent = out.code;
      $("#done-plan").textContent = `Kreditin ${PLANS[plan].name}, ${billing === "tahunan" ? "tahunan" : "bulanan"}`;
      $("#done-total").textContent = rupiah(out.amount ?? priceFor(plan, billing));
      $("#done-method").textContent = PAYMENT_METHODS[method];
      $("#done-wa").textContent = String(payload.whatsapp ?? "");
      form.hidden = true;
      document.querySelector<HTMLElement>(".back")!.hidden = true;
      const done = $<HTMLElement>("#order-done");
      done.hidden = false;
      done.focus();
      window.scrollTo({ top: 0 });
      return;
    }
    if (out.errors) showErrors(out.errors);
    else formErr.textContent = out.message ?? "Pesanan gagal dibuat. Coba lagi beberapa saat lagi.";
    window.turnstile?.reset();
  } catch {
    formErr.textContent = "Tidak bisa terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.";
    window.turnstile?.reset();
  } finally {
    submit.disabled = false;
    submit.textContent = "Buat pesanan";
  }
});

export {};
