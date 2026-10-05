# Blackberrys Marketing Prototype

Interactive prototype for reviewing three connected workspaces:

1. **Commerce OS** — digital marketing performance, GA4 website funnel, Shopify actual orders/revenue, campaign and creative views, and recommendations.
2. **Retail Marketing OS** — store performance, POS/NPS/Jarvis demo data, campaign activity and cost register, and CSV upload with column mapping.
3. **ROMI Dashboard** — combined decision view, report preview, evidence and drill-downs, with a 10-city matched-control ROMI calculation example.

The app uses synthetic demo data. It is not connected to Blackberrys' advertising, analytics, e-commerce, CRM, POS, NPS, or footfall accounts. The CSV upload validates and stages rows in the reviewer's browser; it does not update the synthetic dashboard totals.

## Run locally

### Requirements

- Node.js `>=22.13.0`
- npm

### Development

```sh
npm ci
npm run dev
```

Open the local URL printed by the development server (normally `http://localhost:5173`).

### Build and preview

```sh
npm run build
npm run start
```

`npm run start` serves the built app locally through Wrangler. It does not publish or deploy the site.

## ROMI example

The ROMI view demonstrates the method in the supplied 10-city workbook:

```text
Lift = (test post-period YoY growth − test pre-period YoY growth)
     − (matched-control post-period YoY growth − matched-control pre-period YoY growth)

Incremental revenue = lift × test-city campaign-window LY revenue
Revenue ROMI = (incremental revenue − campaign spend) ÷ campaign spend
Margin ROMI = (incremental revenue × gross margin % − campaign spend) ÷ campaign spend
```

All values shown in the app are synthetic illustrations. The 55% gross-margin input is an assumption, not Blackberrys' confirmed margin. City-level revenue excludes e-commerce. Retail activity comparisons are shown separately to avoid adding potentially overlapping revenue. The workbook summary title and method note differ on the campaign-window end date; confirm the final cutoff before using live data.

## Project structure

- `app/page.tsx` — top-level navigation between all three workspaces
- `app/commerce.tsx` — Commerce OS interface
- `app/workspaces.tsx` — Retail Marketing OS and ROMI Dashboard interfaces
- `lib/demo.js` — synthetic Commerce OS metrics and records
- `lib/retail.js` — synthetic store, activity, POS and NPS records and calculations
- `lib/romi.js` — ROMI calculation example and validation checks
- `components/ui/` — reusable shadcn-style UI components

## Stack

- React 19, TypeScript, Vinext and Vite
- Tailwind CSS 4, Base UI, shadcn-style components and Lucide icons
- Cloudflare Vite plugin and Wrangler for the hosted runtime

Hosted review prototype: https://blackberrys-commerce-review.orange-grebe-7487.chatgpt.site
