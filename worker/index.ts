// Worker for padudata.com. Static pages come from the assets binding; only
// /api/* runs this code (see run_worker_first in wrangler.jsonc).

import { parseSignup } from "./signup";

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

async function kreditinSignup(req: Request, env: Env): Promise<Response> {
  // Same-origin only; the form is the only legitimate caller.
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

  const parsed = parseSignup(body);
  if (!parsed.ok) return json({ error: "invalid", errors: parsed.errors }, 422);
  const s = parsed.data;
  const country = (req as Request & { cf?: { country?: string } }).cf?.country ?? null;

  // Re-registering with the same email updates the answers instead of adding a row.
  await env.DB.prepare(
    `INSERT INTO signups (product, name, email, whatsapp, role, npwp_count, invoice_volume, plan, billing,
                          source, utm_source, utm_medium, utm_campaign, referrer, country)
     VALUES ('kreditin', ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)
     ON CONFLICT (product, email) DO UPDATE SET
       name = excluded.name, whatsapp = excluded.whatsapp, role = excluded.role,
       npwp_count = excluded.npwp_count, invoice_volume = excluded.invoice_volume,
       plan = excluded.plan, billing = excluded.billing, source = excluded.source,
       updated_at = datetime('now')`,
  )
    .bind(s.name, s.email, s.whatsapp, s.role, s.npwpCount, s.invoiceVolume, s.plan, s.billing,
      s.source, s.utmSource, s.utmMedium, s.utmCampaign, s.referrer, country)
    .run();

  return json({ ok: true });
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (pathname === "/api/kreditin/daftar") {
      if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
      try {
        return await kreditinSignup(req, env);
      } catch (err) {
        console.error("kreditin signup failed", err);
        return json({ error: "server", message: "Terjadi kesalahan di server. Coba lagi beberapa saat lagi." }, 500);
      }
    }
    if (pathname.startsWith("/api/")) return json({ error: "not_found" }, 404);
    return env.ASSETS.fetch(req);
  },
} satisfies ExportedHandler<Env>;
