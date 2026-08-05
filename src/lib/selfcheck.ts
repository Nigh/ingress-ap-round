import {
	GAP_MAX,
	GUARANTEED_GAP,
	GUARANTEED_GAP_DOUBLE,
	buildActions,
	gapValid,
	guaranteedGap,
} from "./actions.ts"
import { computePlans, plan, sumAp, totalCost } from "./solver.ts"

function assert(cond: unknown, msg: string): void {
	if (!cond) throw new Error(msg)
}

assert(GUARANTEED_GAP === 1688 && GUARANTEED_GAP_DOUBLE === 3376, "guarantee constants")
assert(guaranteedGap(false) === GUARANTEED_GAP, "guaranteedGap false")
assert(guaranteedGap(true) === GUARANTEED_GAP_DOUBLE, "guaranteedGap true")

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
	// Raising hack cost should not increase use of hack when alternatives exist
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

console.log("solver self-check ok")
