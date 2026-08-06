export const GAP_MAX = 10000
export const GUARANTEED_GAP = 1688
export const GUARANTEED_GAP_DOUBLE = 3376

/** Wiki: Destroying an enemy Resonator / Portal Mod / Link. */
export const DESTROY_AP = {
	resonator: 75,
	mod: 80,
	link: 187,
} as const

export type ActionKind =
	| "nearbyEnemy"
	| "nearbyMachina"
	| "machina"
	| "white"
	| "hack"
	| "mod"
	| "boost"
	| "link"
	| "field1"
	| "field2"
	| "res1"
	| "res27"
	| "res8"
	| "upgrade"

/** One nearby portal’s inventory. Links capped at 1. */
export type NearbyPortal = {
	resonators: number
	mods: number
	links: number
}

export type NearbyConfig = {
	enemy?: NearbyPortal | null
	machina?: NearbyPortal | null
}

export type ApAction = {
	kind: ActionKind
	stepMax: number
	cost: number
	ap: number[]
	instruction: string
	/** Hard cap on count (nearby: one portal, deploy 1–8 resonators). */
	hardMax?: number
	/** Destroy AP included in every capture step (after Double AP). */
	destroyAp?: number
	nearby?: NearbyPortal
}

export const DEFAULT_COSTS: Record<ActionKind, number> = {
	nearbyEnemy: 1,
	nearbyMachina: 1,
	machina: 4,
	white: 2,
	hack: 1,
	mod: 2,
	boost: 3,
	link: 3,
	field1: 4,
	field2: 5,
	res1: 3,
	res27: 2,
	res8: 3,
	upgrade: 2,
}

export const ACTION_LABELS: Record<ActionKind, string> = {
	nearbyEnemy: "Nearby Enemy Portal",
	nearbyMachina: "Nearby Machina Portal",
	machina: "Capture Machina Portal",
	white: "Capture White Portal",
	hack: "Hack Portal",
	mod: "Deploy Mod",
	boost: "Add a Boost to a portal",
	link: "Create Non-Field Link",
	field1: "Create 1 Field with 1 Link",
	field2: "Create 2 Fields with 1 Link",
	res1: "Deploy 1st Resonator",
	res27: "Deploy 2nd-7th Resonator",
	res8: "Deploy 8th Resonator",
	upgrade: "Upgrade Resonator",
}

/** Cost UI omits nearby kinds (configured under Nearby portals). */
export const COST_KINDS = Object.keys(DEFAULT_COSTS).filter(
	(k) => k !== "nearbyEnemy" && k !== "nearbyMachina",
) as ActionKind[]

export const ACTION_KINDS = Object.keys(DEFAULT_COSTS) as ActionKind[]

export function gapOf(current: number, target: number): number {
	return target - current
}

/** target > current, both non-negative integers, gap in (0, GAP_MAX]. */
export function gapValid(current: number, target: number): boolean {
	if (!Number.isInteger(current) || !Number.isInteger(target)) return false
	if (current < 0 || target < 0) return false
	const g = gapOf(current, target)
	return g > 0 && g <= GAP_MAX
}

export function guaranteedGap(double: boolean): number {
	return double ? GUARANTEED_GAP_DOUBLE : GUARANTEED_GAP
}

function clampInt(n: number, lo: number, hi: number): number {
	const x = typeof n === "number" ? n : Number(n)
	if (!Number.isFinite(x)) return lo
	return Math.min(hi, Math.max(lo, Math.trunc(x)))
}

export function clampNearby(p: NearbyPortal): NearbyPortal {
	return {
		resonators: clampInt(p.resonators, 0, 8),
		mods: clampInt(p.mods, 0, 4),
		links: clampInt(p.links, 0, 1),
	}
}

export function destroyApOf(p: NearbyPortal): number {
	const c = clampNearby(p)
	return (
		c.links * DESTROY_AP.link + c.mods * DESTROY_AP.mod + c.resonators * DESTROY_AP.resonator
	)
}

function captureSchedule(machina: boolean): number[] {
	const bonus = machina ? 1331 : 0
	return [
		675 + bonus + 125 * 1,
		675 + bonus + 125 * 2,
		675 + bonus + 125 * 3,
		675 + bonus + 125 * 4,
		675 + bonus + 125 * 5,
		675 + bonus + 125 * 6,
		675 + bonus + 125 * 7,
		675 + bonus + 125 * 8 + 250,
	]
}

function nearbyAction(
	kind: "nearbyEnemy" | "nearbyMachina",
	p: NearbyPortal,
	cost: number,
): ApAction {
	const nearby = clampNearby(p)
	const destroyAp = destroyApOf(nearby)
	const schedule = captureSchedule(kind === "nearbyMachina")
	return {
		kind,
		stepMax: 8,
		hardMax: 8,
		cost,
		ap: schedule.map((x) => x + destroyAp),
		destroyAp,
		nearby,
		instruction: ACTION_LABELS[kind],
	}
}

export function buildActions(
	double: boolean,
	costs?: Partial<Record<ActionKind, number>>,
	nearby?: NearbyConfig,
): ApAction[] {
	const c = { ...DEFAULT_COSTS, ...costs }
	const out: ApAction[] = []

	if (nearby?.enemy) {
		out.push(nearbyAction("nearbyEnemy", nearby.enemy, c.nearbyEnemy))
	}
	if (nearby?.machina) {
		out.push(nearbyAction("nearbyMachina", nearby.machina, c.nearbyMachina))
	}

	out.push(
		{
			kind: "machina",
			stepMax: 4,
			cost: c.machina,
			ap: captureSchedule(true),
			instruction: ACTION_LABELS.machina,
		},
		{
			kind: "white",
			stepMax: 0,
			cost: c.white,
			ap: captureSchedule(false),
			instruction: ACTION_LABELS.white,
		},
		{ kind: "hack", stepMax: 0, cost: c.hack, ap: [100], instruction: ACTION_LABELS.hack },
		{ kind: "mod", stepMax: 0, cost: c.mod, ap: [125], instruction: ACTION_LABELS.mod },
		{ kind: "boost", stepMax: 4, cost: c.boost, ap: [500], instruction: ACTION_LABELS.boost },
		{ kind: "link", stepMax: 0, cost: c.link, ap: [313], instruction: ACTION_LABELS.link },
		{ kind: "field1", stepMax: 0, cost: c.field1, ap: [313 + 1250], instruction: ACTION_LABELS.field1 },
		{ kind: "field2", stepMax: 0, cost: c.field2, ap: [313 + 1250 * 2], instruction: ACTION_LABELS.field2 },
		{ kind: "res1", stepMax: 4, cost: c.res1, ap: [125 + 675], instruction: ACTION_LABELS.res1 },
		{ kind: "res27", stepMax: 0, cost: c.res27, ap: [125], instruction: ACTION_LABELS.res27 },
		{ kind: "res8", stepMax: 4, cost: c.res8, ap: [125 + 250], instruction: ACTION_LABELS.res8 },
		{ kind: "upgrade", stepMax: 4, cost: c.upgrade, ap: [65], instruction: ACTION_LABELS.upgrade },
	)

	if (double) {
		for (const a of out) {
			a.ap = a.ap.map((x) => x * 2)
			if (a.destroyAp != null) a.destroyAp *= 2
		}
	}
	return out
}
