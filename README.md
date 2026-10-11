# padudata.com

Website for [Padu Data](https://padudata.com), master data governance for Indonesian enterprises running multiple ERPs.

- `/`: landing page
- `/pricing/`, `/privacy/`, `/terms/`: pricing (no public prices) and bilingual legal pages
- `/health-check/`: **Vendor Master Health Check**, a free tool that checks vendor exports from one or more ERPs for NPWP/NIK/NITKU format problems, duplicates, cross-ERP inconsistencies and shared bank accounts. It runs entirely in the browser; no data is uploaded. `/health-check/#demo` opens it with fictional sample data.

Built with Vite + TypeScript into static files, served by Cloudflare Workers static assets.

```
site/
├── index.html                 # landing page (HTML + inline CSS)
├── health-check/index.html    # tool page shell
├── pricing/ privacy/ terms/   # secondary pages, styled by src/styles/site.css
├── public/                    # copied as-is: favicon, robots.txt, sitemap.xml
└── src/
    ├── lib/                   # framework-free logic, unit tested
    │   ├── taxid.ts           # NPWP / NIK / NITKU format checks
    │   ├── names.ts           # company name normalization, Jaro-Winkler
    │   └── checks.ts          # all health checks over vendor records
    └── health-check/          # UI: parsing, column mapping, i18n (ID/EN), rendering
tests/                         # Vitest
brand/                         # logo files
wrangler.jsonc                 # Worker config: serves dist/, custom domains
```

## Develop

```sh
npm install
npm run dev      # http://localhost:5173
npm test
```

## Deploy

```sh
npm run deploy   # type-check, build to dist/, wrangler deploy
```

Wrangler needs Cloudflare credentials for the account that owns `padudata.com`
(`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, or `npx wrangler login`).

## What the tax ID checks do and don't do

Format and consistency only. Registration status with DJP is not checked. The
check digit of 15-digit NPWPs is not verified, because DJP has not published the
algorithm. NITKU is checked for length (22 digits) and for starting with the
record's own 16-digit NPWP.

## Brand

`brand/` holds the logo mark ("Unite": four systems around one golden record):

- `padudata-mark.svg`: for light backgrounds
- `padudata-mark-on-dark.svg`: for dark backgrounds
- `padudata-mark-mono.svg`: single color (`currentColor`)
- `padudata-avatar.svg` / `.png`: 400×400 avatar for GitHub and LinkedIn

## Contact

hello@padudata.com
