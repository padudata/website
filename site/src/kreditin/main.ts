// Kreditin page: billing toggle, plan picker, and the early-access form.

declare global {
  interface Window {
    turnstile?: { reset(widget?: string | HTMLElement): void };
  }
}

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function setBilling(billing: "bulanan" | "tahunan") {
  document.querySelectorAll<HTMLButtonElement>("[data-billing]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.billing === billing));
  });
  document.querySelectorAll<HTMLElement>(".plan[data-monthly]").forEach((plan) => {
    const monthly = Number(plan.dataset.monthly);
    // Yearly is 10 months' price for 12 months.
    const price = billing === "tahunan" ? monthly * 10 : monthly;
    const per = billing === "tahunan" ? "/tahun" : "/bulan";
    plan.querySelector(".amount")!.textContent = rupiah(price);
    plan.querySelector(".per")!.textContent = per;
    plan.querySelector(".founding-amount")!.textContent = rupiah(price / 2);
    plan.querySelector(".founding-per")!.textContent = billing === "tahunan" ? "/tahun pertama" : "/bulan";
  });
  const radio = document.querySelector<HTMLInputElement>(`input[name="billing"][value="${billing}"]`);
  if (radio) radio.checked = true;
}

document.querySelectorAll<HTMLButtonElement>("[data-billing]").forEach((b) => {
  b.addEventListener("click", () => setBilling(b.dataset.billing as "bulanan" | "tahunan"));
});

document.querySelectorAll<HTMLAnchorElement>("[data-pick]").forEach((a) => {
  a.addEventListener("click", () => {
    const radio = document.querySelector<HTMLInputElement>(`input[name="plan"][value="${a.dataset.pick}"]`);
    if (radio) radio.checked = true;
  });
});

const form = document.querySelector<HTMLFormElement>("#signup-form")!;
const submit = form.querySelector<HTMLButtonElement>("#f-submit")!;
const formErr = form.querySelector<HTMLElement>("#form-err")!;

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
  const params = new URLSearchParams(location.search);
  const payload = {
    name: fd.get("name"),
    email: fd.get("email"),
    whatsapp: fd.get("whatsapp"),
    role: fd.get("role"),
    npwpCount: fd.get("npwpCount"),
    invoiceVolume: fd.get("invoiceVolume"),
    plan: fd.get("plan"),
    billing: fd.get("billing"),
    source: fd.get("source"),
    consent: fd.get("consent") === "on",
    turnstile: fd.get("cf-turnstile-response"),
    utmSource: params.get("utm_source") ?? "",
    utmMedium: params.get("utm_medium") ?? "",
    utmCampaign: params.get("utm_campaign") ?? "",
    referrer: document.referrer,
  };

  submit.disabled = true;
  submit.textContent = "Mengirim…";
  try {
    const res = await fetch("/api/kreditin/daftar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const out = (await res.json().catch(() => ({}))) as { ok?: boolean; errors?: Record<string, string>; message?: string };
    if (res.ok && out.ok) {
      document.querySelector("#done-wa")!.textContent = String(payload.whatsapp ?? "");
      form.hidden = true;
      const done = document.querySelector<HTMLElement>("#signup-done")!;
      done.hidden = false;
      done.focus();
      return;
    }
    if (out.errors) showErrors(out.errors);
    else formErr.textContent = out.message ?? "Pendaftaran gagal. Coba lagi beberapa saat lagi.";
    window.turnstile?.reset();
  } catch {
    formErr.textContent = "Tidak bisa terhubung ke server. Periksa koneksi internet Anda lalu coba lagi.";
    window.turnstile?.reset();
  } finally {
    submit.disabled = false;
    submit.textContent = "Daftar sekarang";
  }
});

document.querySelector("#share-btn")?.addEventListener("click", async () => {
  const url = "https://padudata.com/kreditin/?utm_source=referral&utm_medium=share";
  const note = document.querySelector("#share-copied")!;
  try {
    await navigator.clipboard.writeText(url);
    note.textContent = "Link tersalin.";
  } catch {
    note.textContent = url;
  }
});

export {};
