# Ingress AP Round

Plan in-game Ingress actions to earn a **specific amount of AP** — from your current total to a target.

**Use it:** https://nigh.github.io/ingress-ap-round/

## How to use

1. Enter your **Current AP** and **Target AP** (target must be higher; the gap can be at most 10 000).
2. Turn on **Double AP event** only if a Double AP event is active in-game (off by default).
3. Optionally enable **Nearby portals** (at most one enemy and one Machina). Pick resonators (1–8), mods (0–4), and links (0–1) from dropdowns — a link is only available when resonators ≥ 3. The planner may clear that portal, then capture and deploy 1–8 resonators.
4. Optionally open **Action costs** and raise costs for actions you want to avoid (1–100). Reset restores defaults.
5. Tap **Calculate**. You’ll get up to three exact plans.

Each plan shows a cost score (lower is “easier” for the planner) and the AP it adds. Check off steps as you finish them — the plan shows **what your AP total should be** so you can catch mistakes. Under Double AP, an **odd** gap may include one official **1 AP passcode**.

Nearby portal steps are ordered in-game (destroy → capture → deploy). Other actions have no required order.

## When a solution is guaranteed

- Normal: gap **≥ 1 688**
- Double AP: gap **≥ 3 376**

Smaller gaps often still work; if nothing exact exists, the app tells you. Nearby portals do not change these guarantees; they only add optional inventory.

## Tips

- Star the [GitHub repo](https://github.com/Nigh/ingress-ap-round) from the top-left button if this helps you.
- AP values follow the public Ingress Access Points tables (e.g. Deploy Mod = 125 AP; destroy resonator / mod / link = 75 / 80 / 187).

## Privacy

Everything runs in your browser. Nothing is uploaded.
