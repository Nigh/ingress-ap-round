# Ingress AP Round

PWA that plans Ingress actions to hit a farm-session AP gap.

Built from [astro-pwa-template](https://github.com/Nigh/astro-pwa-template) (Astro + Svelte + Tailwind + DaisyUI).

## What it does

- Target AP in **[5000, 10000]** (one outing’s worth of farming)
- Optional **Double AP** event mode
- Finds up to **3** low-cost action plans (exact hit preferred)
- Under double AP, **odd** targets force at most one official **1 AP passcode** (not a normal action)

Solver runs entirely in the browser (grouped knapsack DP).

## Develop

```bash
npm install
npm run dev
```

```bash
npm run check:solver   # exact-hit / passcode self-check
npm run build
npm run preview
```

## PWA icons

`public/pwa-192x192.png`, `public/pwa-512x512.png`, and `public/favicon.svg` are required for installability.
