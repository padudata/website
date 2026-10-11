# padudata.com

Landing page for [Padu Data](https://padudata.com), master data governance for Indonesian enterprises running multiple ERPs.

A single static page served by Cloudflare Workers static assets.

```
public/
├── index.html    # the page (HTML + inline CSS/JS, no build step)
├── favicon.svg
├── robots.txt
└── sitemap.xml
wrangler.jsonc    # Worker config: assets directory + custom domains
```

## Develop

Open `public/index.html` in a browser. There is no build step.

## Deploy

```sh
npm install
npx wrangler deploy
```

Wrangler needs Cloudflare credentials for the account that owns `padudata.com`
(`CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`, or `npx wrangler login`).

## Contact

hello@padudata.com
