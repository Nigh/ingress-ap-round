<script lang="ts">
	import {
		ACTION_KINDS,
		ACTION_LABELS,
		DEFAULT_COSTS,
		GAP_MAX,
		GUARANTEED_GAP,
		GUARANTEED_GAP_DOUBLE,
		type ActionKind,
		buildActions,
		gapOf,
		gapValid,
		guaranteedGap,
	} from "../lib/actions"
	import { formatSolution, type StepRow } from "../lib/format"
	import { computePlans, type SolResult } from "../lib/solver"

	let currentAp = $state(0)
	let targetAp = $state(5777)
	let isDouble = $state(true)
	let costs = $state({ ...DEFAULT_COSTS })
	let error = $state("")
	let results = $state<{ result: SolResult; steps: StepRow[] }[]>([])
	let busy = $state(false)

	let gap = $derived(gapOf(Math.trunc(Number(currentAp)), Math.trunc(Number(targetAp))))
	let guarantee = $derived(guaranteedGap(isDouble))

	function resetCosts() {
		costs = { ...DEFAULT_COSTS }
	}

	function sanitizeCosts(): Partial<Record<ActionKind, number>> {
		const out: Partial<Record<ActionKind, number>> = {}
		for (const k of ACTION_KINDS) {
			const n = Math.trunc(Number(costs[k]))
			out[k] = Number.isFinite(n) && n >= 1 ? n : DEFAULT_COSTS[k]
		}
		return out
	}

	function calculate() {
		error = ""
		results = []
		const cur = Math.trunc(Number(currentAp))
		const tgt = Math.trunc(Number(targetAp))
		if (!gapValid(cur, tgt)) {
			error = `Need target > current, both ≥ 0, and gap ≤ ${GAP_MAX}.`
			return
		}
		const g = gapOf(cur, tgt)
		const costMap = sanitizeCosts()
		busy = true
		queueMicrotask(() => {
			const actions = buildActions(isDouble, costMap)
			const plans = computePlans(g, isDouble, 3, costMap)
			results = plans.map((r) => ({ result: r, steps: formatSolution(actions, r) }))
			busy = false
		})
	}
</script>

<div class="mx-auto flex w-full max-w-lg flex-col gap-6">
	<header class="text-center">
		<p class="font-mono text-sm tracking-[0.2em] text-primary uppercase">Ingress</p>
		<h1 class="mt-1 text-3xl font-bold tracking-tight text-base-content sm:text-4xl">AP Round</h1>
		<p class="mt-2 text-sm text-base-content/70">
			Plan actions from your current AP to a target (gap at most {GAP_MAX}).
		</p>
		<p class="mt-1 text-xs text-base-content/55">
			Exact solutions are guaranteed when the AP gap is at least {GUARANTEED_GAP}
			({GUARANTEED_GAP_DOUBLE} with Double AP). Smaller gaps may still work.
		</p>
	</header>

	<section class="flex flex-col gap-4 rounded-box bg-base-100 p-5 shadow-sm ring-1 ring-base-content/10">
		<div class="grid grid-cols-2 gap-3">
			<label class="form-control w-full">
				<span class="label-text mb-1 font-medium">Current AP</span>
				<input
					type="number"
					class="input input-bordered w-full font-mono"
					min="0"
					bind:value={currentAp}
					onkeydown={(e) => e.key === "Enter" && calculate()}
				/>
			</label>
			<label class="form-control w-full">
				<span class="label-text mb-1 font-medium">Target AP</span>
				<input
					type="number"
					class="input input-bordered w-full font-mono"
					min="0"
					bind:value={targetAp}
					onkeydown={(e) => e.key === "Enter" && calculate()}
				/>
			</label>
		</div>

		<p class="font-mono text-sm text-base-content/70">
			Gap = <span class="text-base-content">{Number.isFinite(gap) ? gap : "—"}</span>
			{#if Number.isFinite(gap) && gap > 0 && gap < guarantee}
				<span class="text-warning"> · below guarantee ({guarantee})</span>
			{/if}
		</p>

		<label class="label cursor-pointer justify-start gap-3 py-0">
			<input type="checkbox" class="toggle toggle-primary" bind:checked={isDouble} />
			<span class="label-text">Double AP event</span>
		</label>

		{#if isDouble && Number.isFinite(gap) && gap > 0 && gap % 2 !== 0 && gap <= GAP_MAX}
			<p class="text-xs text-base-content/60">
				Odd gap under double AP will use one official 1 AP passcode.
			</p>
		{/if}

		<details class="rounded-box border border-base-content/10 bg-base-200/40">
			<summary class="cursor-pointer px-3 py-2 text-sm font-medium">Action costs</summary>
			<div class="flex flex-col gap-2 border-t border-base-content/10 px-3 py-3">
				<p class="text-xs text-base-content/55">
					Higher cost = planner avoids that action when possible.
				</p>
				{#each ACTION_KINDS as kind}
					<label class="flex items-center justify-between gap-3 text-sm">
						<span class="min-w-0 flex-1 truncate">{ACTION_LABELS[kind]}</span>
						<input
							type="number"
							class="input input-bordered input-sm w-20 font-mono"
							min="1"
							bind:value={costs[kind]}
						/>
					</label>
				{/each}
				<button type="button" class="btn btn-ghost btn-sm self-start" onclick={resetCosts}>
					Reset costs
				</button>
			</div>
		</details>

		{#if error}
			<p class="text-sm text-error" role="alert">{error}</p>
		{/if}

		<button class="btn btn-primary" disabled={busy} onclick={calculate}>
			{busy ? "Solving…" : "Calculate"}
		</button>
	</section>

	{#each results as item, i}
		<article class="rounded-box bg-base-100 p-5 shadow-sm ring-1 ring-base-content/10">
			<div class="mb-3 flex flex-wrap items-baseline justify-between gap-2">
				<h2 class="text-lg font-semibold">Solution {i + 1}</h2>
				<p class="font-mono text-xs text-base-content/60">
					diff={item.result.diff} · cost={item.result.cost} · ap={item.result.ap}
				</p>
			</div>
			<ul class="divide-y divide-base-content/10">
				{#each item.steps as step}
					<li
						class="flex items-baseline justify-between gap-3 py-2 text-sm"
						class:text-secondary={step.passcode}
					>
						<div class="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
							<span class="text-base-content">{step.action}</span>
							<span class="badge badge-ghost badge-sm font-mono opacity-80">{step.qty}</span>
						</div>
						<span class="shrink-0 font-mono text-sm tabular-nums text-primary">+{step.ap}ap</span>
					</li>
				{/each}
			</ul>
		</article>
	{/each}
</div>
