export const GAP_MAX = 10000
export const GUARANTEED_GAP = 1688
export const GUARANTEED_GAP_DOUBLE = 3376

export type ActionKind =
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

export type ApAction = {
	kind: ActionKind
	stepMax: number
	cost: number
	ap: number[]
	instruction: string
}

export const DEFAULT_COSTS: Record<ActionKind, number> = {
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

export function buildActions(
	double: boolean,
	costs?: Partial<Record<ActionKind, number>>,
): ApAction[] {
	const c = { ...DEFAULT_COSTS, ...costs }
	const out: ApAction[] = [
		{
			kind: "machina",
			stepMax: 4,
			cost: c.machina,
			ap: [
				675 + 1331 + 125 * 1,
				675 + 1331 + 125 * 2,
				675 + 1331 + 125 * 3,
				675 + 1331 + 125 * 4,
				675 + 1331 + 125 * 5,
				675 + 1331 + 125 * 6,
				675 + 1331 + 125 * 7,
				675 + 1331 + 125 * 8 + 250,
			],
			instruction: ACTION_LABELS.machina,
		},
		{
			kind: "white",
			stepMax: 0,
			cost: c.white,
			ap: [
				675 + 125 * 1,
				675 + 125 * 2,
				675 + 125 * 3,
				675 + 125 * 4,
				675 + 125 * 5,
				675 + 125 * 6,
				675 + 125 * 7,
				675 + 125 * 8 + 250,
			],
			instruction: ACTION_LABELS.white,
		},
		{ kind: "hack", stepMax: 0, cost: c.hack, ap: [100], instruction: ACTION_LABELS.hack },
		{ kind: "mod", stepMax: 0, cost: c.mod, ap: [150], instruction: ACTION_LABELS.mod },
		{ kind: "boost", stepMax: 4, cost: c.boost, ap: [500], instruction: ACTION_LABELS.boost },
		{ kind: "link", stepMax: 0, cost: c.link, ap: [313], instruction: ACTION_LABELS.link },
		{ kind: "field1", stepMax: 0, cost: c.field1, ap: [313 + 1250], instruction: ACTION_LABELS.field1 },
		{ kind: "field2", stepMax: 0, cost: c.field2, ap: [313 + 1250 * 2], instruction: ACTION_LABELS.field2 },
		{ kind: "res1", stepMax: 4, cost: c.res1, ap: [125 + 675], instruction: ACTION_LABELS.res1 },
		{ kind: "res27", stepMax: 0, cost: c.res27, ap: [125], instruction: ACTION_LABELS.res27 },
		{ kind: "res8", stepMax: 4, cost: c.res8, ap: [125 + 250], instruction: ACTION_LABELS.res8 },
		{ kind: "upgrade", stepMax: 4, cost: c.upgrade, ap: [65], instruction: ACTION_LABELS.upgrade },
	]

	if (double) {
		for (const a of out) {
			a.ap = a.ap.map((x) => x * 2)
		}
	}
	return out
}
