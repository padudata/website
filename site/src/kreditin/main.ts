// Kreditin page: billing toggle on the pricing cards. Plan buttons carry the
// chosen plan and billing period to the checkout page.

const rupiah = (n: number) => "Rp " + n.toLocaleString("id-ID");

function setBilling(billing: "bulanan" | "tahunan") {
  document.querySelectorAll<HTMLButtonElement>("[data-billing]").forEach((b) => {
    b.setAttribute("aria-checked", String(b.dataset.billing === billing));
  });
  document.querySelectorAll<HTMLElement>(".plan[data-monthly]").forEach((plan) => {
    const monthly = Number(plan.dataset.monthly);
    // Yearly is 10 months' price for 12 months.
    const price = billing === "tahunan" ? monthly * 10 : monthly;
    plan.querySelector(".amount")!.textContent = rupiah(price);
    plan.querySelector(".per")!.textContent = billing === "tahunan" ? "/tahun" : "/bulan";
  });
  document.querySelectorAll<HTMLAnchorElement>("[data-pick]").forEach((a) => {
    a.href = `/kreditin/checkout/?paket=${a.dataset.pick}&periode=${billing}`;
  });
}

document.querySelectorAll<HTMLButtonElement>("[data-billing]").forEach((b) => {
  b.addEventListener("click", () => setBilling(b.dataset.billing as "bulanan" | "tahunan"));
});

export {};
