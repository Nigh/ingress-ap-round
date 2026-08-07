import {
	DESTROY_AP,
	GAP_MAX,
	GUARANTEED_GAP,
	GUARANTEED_GAP_DOUBLE,
	buildActions,
	clampNearby,
	destroyApOf,
	gapValid,
	guaranteedGap,
} from "./actions.ts"
import { formatSolution } from "./format.ts"
import { computePlans, plan, sumAp, totalCost } from "./solver.ts"

function assert(cond: unknown, msg: string): void {
	if (!cond) throw new Error(msg)
}

assert(GUARANTEED_GAP === 1688 && GUARANTEED_GAP_DOUBLE === 3376, "guarantee constants")
assert(guaranteedGap(false) === GUARANTEED_GAP, "guaranteedGap false")
assert(guaranteedGap(true) === GUARANTEED_GAP_DOUBLE, "guaranteedGap true")
assert(DESTROY_AP.resonator === 75 && DESTROY_AP.mod === 80 && DESTROY_AP.link === 187, "destroy AP")

assert(gapValid(0, 100), "small gap ok")
assert(gapValid(0, GAP_MAX), "max gap ok")
assert(!gapValid(100, 100), "zero gap bad")
assert(!gapValid(200, 100), "negative gap bad")
assert(!gapValid(0, GAP_MAX + 1), "over max bad")
assert(!gapValid(-1, 10), "negative current bad")

{
	const gap = 6000
	const actions = buildActions(false)
	const r = plan(actions, gap, false)
	assert(r.diff === 0, `non-double exact: diff=${r.diff}`)
	assert(!r.passcode, "non-double no passcode")
	assert(sumAp(actions, r.sol) === r.ap, "sum matches")
}

{
	const actions = buildActions(true)
	const odd = 8777
	const r = plan(actions, odd, true)
	assert(r.diff === 0 && r.ap === odd, `double odd exact: ${r.ap}`)
	assert(r.passcode, "odd double needs passcode")
	assert(sumAp(actions, r.sol) + 1 === odd, "core+1")

	const e = plan(actions, 8776, true)
	assert(!e.passcode && e.diff === 0, "even double no passcode")
}

{
	const plans = computePlans(5777, false, 3)
	assert(plans.length >= 1 && plans[0].diff === 0, "computePlans")
}

{
	const gap = 2000
	const cheapHack = computePlans(gap, false, 1, { hack: 1 })[0]
	const priceyHack = computePlans(gap, false, 1, { hack: 99 })[0]
	assert(cheapHack.diff === 0 && priceyHack.diff === 0, "cost overrides still exact")
	const actionsCheap = buildActions(false, { hack: 1 })
	const actionsPricey = buildActions(false, { hack: 99 })
	const hackIdx = actionsCheap.findIndex((a) => a.kind === "hack")
	assert(hackIdx >= 0, "hack present")
	assert(
		(priceyHack.sol[hackIdx] ?? 0) <= (cheapHack.sol[hackIdx] ?? 0) ||
			priceyHack.cost >= cheapHack.cost,
		"higher hack cost affects plan",
	)
	assert(totalCost(actionsPricey, priceyHack.sol) === priceyHack.cost, "cost matches")
}

{
	const low = clampNearby({ resonators: 2, mods: 1, links: 1 })
	assert(low.resonators === 2 && low.links === 0, "links cleared when res < 3")
	assert(clampNearby({ resonators: 0, mods: 0, links: 0 }).resonators === 1, "res min 1")
	assert(clampNearby({ resonators: 3, mods: 0, links: 1 }).links === 1, "links ok at res 3")
}

{
	const portal = { resonators: 6, mods: 2, links: 1 }
	const d = destroyApOf(portal)
	assert(d === 6 * 75 + 2 * 80 + 187, `destroyApOf=${d}`)
	const nearby = { enemy: portal }
	const actions = buildActions(false, undefined, nearby)
	const near = actions.find((a) => a.kind === "nearbyEnemy")
	assert(near && near.hardMax === 8 && near.destroyAp === d, "nearby action")
	assert(near!.ap[0] === d + 675 + 125, "capture+1 embeds destroy")
	const gap = near!.ap[3] // destroy + capture+4
	const r = plan(actions, gap, false)
	assert(r.diff === 0, "nearby gap exact")
	const idx = actions.findIndex((a) => a.kind === "nearbyEnemy")
	assert((r.sol[idx] ?? 0) > 0 && (r.sol[idx] ?? 0) <= 8, "nearby used ≤ 8")
	const steps = formatSolution(actions, r)
	const stepSum = steps.reduce((s, row) => s + row.ap, 0)
	assert(stepSum === r.ap, `format steps sum ${stepSum} vs ${r.ap}`)
}

{
	const actions = buildActions(true, undefined, { machina: { resonators: 1, mods: 0, links: 0 } })
	const near = actions.find((a) => a.kind === "nearbyMachina")
	assert(near && near.destroyAp === 75 * 2, "double destroy")
	assert(near!.ap[0] === (75 + 675 + 1331 + 125) * 2, "double machina capture+1")
}

console.log("solver self-check ok")
