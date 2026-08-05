# Ingress AP Round

PWA that plans Ingress actions from your current AP to a target.

Built from [astro-pwa-template](https://github.com/Nigh/astro-pwa-template) (Astro + Svelte + Tailwind + DaisyUI).

## What it does

- Inputs: **Current AP** and **Target AP** (`target > current`, gap ≤ **10000**)
- Optional **Double AP** event mode
- Per-action **cost** weights (planner prefers lower cost)
- Up to **3** plans (exact hit preferred, then lower cost)
- Under double AP, **odd** gaps force at most one official **1 AP passcode**
- Exact solutions are **guaranteed** for gaps ≥ **1688** ( ≥ **3376** with Double AP); smaller gaps may still work

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
