import { DESTROY_AP, type ApAction, type NearbyPortal } from "./actions"
import { type SolResult, apAt } from "./solver"

export type StepRow = {
	action: string
	qty: string
	ap: number
	passcode?: boolean
}

function pl(i: number, name: string): string {
	return i === 1 ? `${i} ${name}` : `${i} ${name}s`
}

function formatCapture(count: number, label: string, ap: number[]): StepRow[] {
	const rows: StepRow[] = []
	const full = Math.floor(count / 8)
	const step = count % 8
	if (full > 0) {
		rows.push({
			action: `Capture ${label}`,
			qty: `${pl(full, "portal")} · 8 Resonators`,
			ap: ap[ap.length - 1] * full,
		})
	}
	if (step > 0) {
		rows.push({
			action: `Capture ${label}`,
			qty: `1 portal · ${pl(step, "Resonator")}`,
			ap: ap[step - 1],
		})
	}
	return rows
}

function formatHack(count: number, unit: number): StepRow[] {
	const rows: StepRow[] = []
	const enemy = Math.floor(count / 2)
	const allied = count % 2
	if (enemy > 0) {
		rows.push({ action: "Hack Enemy Portal", qty: `×${enemy}`, ap: unit * 2 * enemy })
	}
	if (allied > 0) {
		rows.push({ action: "Hack Allied Portal", qty: `×${allied}`, ap: unit * allied })
	}
	return rows
}

/** Scale destroy unit AP so parts sum to destroyAp (handles Double AP). */
function destroyParts(p: NearbyPortal, destroyAp: number): { link: number; mod: number; res: number } {
	const base =
		p.links * DESTROY_AP.link + p.mods * DESTROY_AP.mod + p.resonators * DESTROY_AP.resonator
	if (base <= 0 || destroyAp <= 0) return { link: 0, mod: 0, res: 0 }
	const scale = destroyAp / base
	return {
		link: p.links * DESTROY_AP.link * scale,
		mod: p.mods * DESTROY_AP.mod * scale,
		res: p.resonators * DESTROY_AP.resonator * scale,
	}
}

function formatNearby(count: number, v: ApAction): StepRow[] {
	const p = v.nearby
	const destroyAp = v.destroyAp ?? 0
	if (!p || count <= 0) return []
	const label = v.kind === "nearbyMachina" ? "Nearby Machina" : "Nearby Enemy"
	const rows: StepRow[] = []
	const parts = destroyParts(p, destroyAp)

	if (p.links > 0) {
		rows.push({ action: `Destroy Link · ${label}`, qty: `×${p.links}`, ap: parts.link })
	}
	if (p.mods > 0) {
		rows.push({ action: `Destroy Mod · ${label}`, qty: `×${p.mods}`, ap: parts.mod })
	}
	if (p.resonators > 0) {
		rows.push({
			action: `Destroy Resonator · ${label}`,
			qty: `×${p.resonators}`,
			ap: parts.res,
		})
	}
	rows.push({
		action: `Capture ${label}`,
		qty: `1 portal · ${pl(count, "Resonator")}`,
		ap: apAt(v, count) - destroyAp,
	})
	return rows
}

export function formatSolution(actions: ApAction[], r: SolResult): StepRow[] {
	const rows: StepRow[] = []
	for (let i = 0; i < actions.length; i++) {
		const n = r.sol[i] ?? 0
		if (n <= 0) continue
		const v = actions[i]
		switch (v.kind) {
			case "nearbyEnemy":
			case "nearbyMachina":
				rows.push(...formatNearby(n, v))
				break
			case "machina":
				rows.push(...formatCapture(n, "Machina Portal", v.ap))
				break
			case "white":
				rows.push(...formatCapture(n, "White Portal", v.ap))
				break
			case "hack":
				rows.push(...formatHack(n, v.ap[0]))
				break
			default:
				rows.push({ action: v.instruction, qty: `×${n}`, ap: apAt(v, n) })
		}
	}
	if (r.passcode) {
		rows.push({ action: "Get 1 AP passcode", qty: "×1", ap: 1, passcode: true })
	}
	return rows
}
