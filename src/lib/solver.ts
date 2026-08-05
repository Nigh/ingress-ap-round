import { type ActionKind, type ApAction, buildActions } from "./actions"

export type SolResult = {
	sol: number[]
	diff: number
	cost: number
	ap: number
	passcode: boolean
}

export function apAt(v: ApAction, n: number): number {
	if (n <= 0) return 0
	const L = v.ap.length
	const full = Math.floor(n / L)
	const rem = n % L
	let s = full * v.ap[L - 1]
	if (rem > 0) s += v.ap[rem - 1]
	return s
}

export function actionCost(v: ApAction, n: number): number {
	if (n <= 0) return 0
	const L = v.ap.length
	let c = Math.floor((10 * v.cost * n) / L)
	if (v.stepMax > 0 && n > v.stepMax) {
		c += Math.floor((10 * v.cost * (n - v.stepMax)) / L)
	}
	return c
}

export function sumAp(actions: ApAction[], sol: number[]): number {
	let s = 0
	for (let i = 0; i < actions.length; i++) s += apAt(actions[i], sol[i] ?? 0)
	return s
}

export function totalCost(actions: ApAction[], sol: number[]): number {
	let c = 0
	for (let i = 0; i < actions.length; i++) c += actionCost(actions[i], sol[i] ?? 0)
	return c
}

function maxCount(v: ApAction, limit: number): number {
	if (limit <= 0 || v.ap.length === 0 || v.ap[0] <= 0) return 0
	let lo = 0
	let hi = Math.floor(limit / v.ap[0]) + v.ap.length
	while (lo < hi) {
		const mid = Math.floor((lo + hi + 1) / 2)
		if (apAt(v, mid) <= limit) lo = mid
		else hi = mid - 1
	}
	return lo
}

function absInt(x: number): number {
	return x < 0 ? -x : x
}

/** Grouped knapsack on a fixed action table. */
export function solve(actions: ApAction[], target: number, skip: number): SolResult {
	const n = actions.length
	if (n === 0 || target < 0) {
		return { sol: Array(n).fill(0), diff: target, cost: 0, ap: 0, passcode: false }
	}

	let maxUnit = 0
	for (let i = 0; i < n; i++) {
		if (i === skip || actions[i].ap.length === 0) continue
		const a = actions[i].ap[actions[i].ap.length - 1]
		if (a > maxUnit) maxUnit = a
	}
	const limit = target + maxUnit
	const inf = Math.floor(Number.MAX_SAFE_INTEGER / 4)

	let dp = new Array<number>(limit + 1).fill(inf)
	dp[0] = 0

	type Step = { from: number; count: number }
	const parent: Step[][] = Array.from({ length: n }, () =>
		Array.from({ length: limit + 1 }, () => ({ from: -1, count: 0 })),
	)

	for (let ai = 0; ai < n; ai++) {
		const v = actions[ai]
		if (ai === skip || v.ap.length === 0) continue
		const ndp = dp.slice()
		const mc = maxCount(v, limit)
		for (let ap = 0; ap <= limit; ap++) {
			if (dp[ap] >= inf) continue
			for (let c = 1; c <= mc; c++) {
				const add = apAt(v, c)
				const next = ap + add
				if (next > limit) break
				const cost = dp[ap] + actionCost(v, c)
				if (cost < ndp[next]) {
					ndp[next] = cost
					parent[ai][next] = { from: ap, count: c }
				}
			}
		}
		dp = ndp
	}

	let bestAP = 0
	let bestDiff = target
	let bestCost = inf
	for (let ap = 0; ap <= limit; ap++) {
		const cost = dp[ap]
		if (cost >= inf) continue
		const diff = absInt(ap - target)
		if (diff < bestDiff || (diff === bestDiff && cost < bestCost)) {
			bestDiff = diff
			bestCost = cost
			bestAP = ap
		}
	}

	const sol = Array(n).fill(0)
	let ap = bestAP
	for (let ai = n - 1; ai >= 0; ai--) {
		const st = parent[ai][ap]
		if (st.from < 0) continue
		sol[ai] = st.count
		ap = st.from
	}
	return { sol, diff: bestDiff, cost: bestCost, ap: bestAP, passcode: false }
}

/** Odd double targets force one 1 AP passcode; passcode is never a knapsack item. */
export function plan(actions: ApAction[], target: number, double: boolean, skip = -1): SolResult {
	let core = target
	const usePass = double && target % 2 !== 0
	if (usePass) core = target - 1
	const r = solve(actions, core, skip)
	if (usePass) {
		r.passcode = true
		r.ap++
		r.diff = absInt(r.ap - target)
	}
	return r
}

function solKey(r: SolResult): string {
	return `${r.sol.join(",")}/${r.passcode}`
}

export function alternatives(
	actions: ApAction[],
	target: number,
	double: boolean,
	primary: SolResult,
	want: number,
): SolResult[] {
	const seen = new Set<string>([solKey(primary)])
	const alts: SolResult[] = []
	for (let i = 0; i < primary.sol.length; i++) {
		if (!primary.sol[i]) continue
		const alt = plan(actions, target, double, i)
		const k = solKey(alt)
		if (seen.has(k)) continue
		seen.add(k)
		alts.push(alt)
	}
	alts.sort((a, b) => (a.diff !== b.diff ? a.diff - b.diff : a.cost - b.cost))
	return [primary, ...alts.slice(0, Math.max(0, want - 1))]
}

export function computePlans(
	target: number,
	double: boolean,
	want = 3,
	costs?: Partial<Record<ActionKind, number>>,
): SolResult[] {
	const actions = buildActions(double, costs)
	const primary = plan(actions, target, double, -1)
	return alternatives(actions, target, double, primary, want)
}
