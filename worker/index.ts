// Worker for padudata.com. Static pages come from the assets binding; only
// /api/* runs this code (see run_worker_first in wrangler.jsonc).

import { orderCode, parseOrder } from "./order";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  TURNSTILE_SECRET: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const out = (await res.json()) as { success?: boolean };
  return out.success === true;
}

async function kreditinOrder(req: Request, env: Env): Promise<Response> {
  // Same-origin only; the checkout page is the only legitimate caller.
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return json({ error: "forbidden" }, 403);

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return json({ error: "bad_request" }, 400);
  }

  const ip = req.headers.get("cf-connecting-ip");
  const token = typeof body.turnstile === "string" ? body.turnstile : "";
  if (!token || !(await verifyTurnstile(token, env.TURNSTILE_SECRET, ip))) {
    return json({ error: "captcha", message: "Verifikasi anti-spam gagal. Muat ulang halaman lalu coba lagi." }, 400);
  }

  const parsed = parseOrder(body);
  if (!parsed.ok) return json({ error: "invalid", errors: parsed.errors }, 422);
  const o = parsed.data;
  const country = (req as Request & { cf?: { country?: string } }).cf?.country ?? null;

  // Codes are random; on the rare collision, draw again.
  for (let attempt = 0; attempt < 3; attempt++) {
    const code = orderCode((n) => crypto.getRandomValues(new Uint8Array(n)));
    try {
      await env.DB.prepare(
        `INSERT INTO orders (code, product, plan, billing, amount, payment_method, name, email, whatsapp, company,
                             role, npwp_count, invoice_volume, source, utm_source, utm_medium, utm_campaign, referrer, country)
         VALUES (?1, 'kreditin', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)`,
      )
        .bind(code, o.plan, o.billing, o.amount, o.paymentMethod, o.name, o.email, o.whatsapp, o.company,
          o.role, o.npwpCount, o.invoiceVolume, o.source, o.utmSource, o.utmMedium, o.utmCampaign, o.referrer, country)
        .run();
      return json({ ok: true, code, amount: o.amount });
    } catch (err) {
      if (!String(err).includes("UNIQUE")) throw err;
    }
  }
  throw new Error("could not allocate an order code");
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === "/api/kreditin/pesan") {
      if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      try {
        return await kreditinOrder(req, env);
      } catch (err) {
        console.error("kreditin order failed", err);
        return json({ error: "server", message: "Terjadi kesalahan di server. Coba lagi beberapa saat lagi." }, 500);
      }
    }
    if (pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
