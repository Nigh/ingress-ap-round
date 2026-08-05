import { TARGET_MAX, TARGET_MIN, buildActions, targetInRange } from "./actions.ts"
import { computePlans, plan, sumAp } from "./solver.ts"

function assert(cond: unknown, msg: string): void {
	if (!cond) throw new Error(msg)
}

const even = 6000
assert(targetInRange(even), "even in range")
assert(!targetInRange(TARGET_MIN - 1), "below min")
assert(!targetInRange(TARGET_MAX + 1), "above max")

{
	const actions = buildActions(false)
	const r = plan(actions, even, false)
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

console.log("solver self-check ok")
