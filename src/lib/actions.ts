export const TARGET_MIN = 5000
export const TARGET_MAX = 10000

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

export function targetInRange(t: number): boolean {
	return t >= TARGET_MIN && t <= TARGET_MAX
}

export function buildActions(double: boolean): ApAction[] {
	const out: ApAction[] = [
		{
			kind: "machina",
			stepMax: 4,
			cost: 4,
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
			instruction: "Capture Machina Portal",
		},
		{
			kind: "white",
			stepMax: 0,
			cost: 2,
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
			instruction: "Capture White Portal",
		},
		{ kind: "hack", stepMax: 0, cost: 1, ap: [100], instruction: "Hack Portal" },
		{ kind: "mod", stepMax: 0, cost: 2, ap: [150], instruction: "Deploy Mod" },
		{ kind: "boost", stepMax: 4, cost: 3, ap: [500], instruction: "Add a Boost to a portal" },
		{ kind: "link", stepMax: 0, cost: 3, ap: [313], instruction: "Create Non-Field Link" },
		{ kind: "field1", stepMax: 0, cost: 4, ap: [313 + 1250], instruction: "Create 1 Field with 1 Link" },
		{ kind: "field2", stepMax: 0, cost: 5, ap: [313 + 1250 * 2], instruction: "Create 2 Fields with 1 Link" },
		{ kind: "res1", stepMax: 4, cost: 3, ap: [125 + 675], instruction: "Deploy 1st Resonator" },
		{ kind: "res27", stepMax: 0, cost: 2, ap: [125], instruction: "Deploy 2nd-7th Resonator" },
		{ kind: "res8", stepMax: 4, cost: 3, ap: [125 + 250], instruction: "Deploy 8th Resonator" },
		{ kind: "upgrade", stepMax: 4, cost: 2, ap: [65], instruction: "Upgrade Resonator" },
	]

	if (double) {
		for (const a of out) {
			a.ap = a.ap.map((x) => x * 2)
		}
	}
	return out
}
