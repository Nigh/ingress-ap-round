<script lang="ts">
	import { TARGET_MAX, TARGET_MIN, buildActions, targetInRange } from "../lib/actions"
	import { formatSolution } from "../lib/format"
	import { computePlans, type SolResult } from "../lib/solver"

	let target = $state(5777)
	let isDouble = $state(true)
	let error = $state("")
	let results = $state<{ result: SolResult; steps: string[] }[]>([])
	let busy = $state(false)

	function calculate() {
		error = ""
		results = []
		const t = Math.trunc(Number(target))
		if (!Number.isFinite(t) || !targetInRange(t)) {
			error = `Target must be in [${TARGET_MIN}, ${TARGET_MAX}] — one farm-session gap.`
			return
		}
		busy = true
		// Yield so the button can show busy state on slow devices
		queueMicrotask(() => {
			const actions = buildActions(isDouble)
			const plans = computePlans(t, isDouble, 3)
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
			Plan actions to hit a farm-session AP gap ({TARGET_MIN}–{TARGET_MAX}).
		</p>
	</header>

	<section class="flex flex-col gap-4 rounded-box bg-base-100 p-5 shadow-sm ring-1 ring-base-content/10">
		<label class="form-control w-full">
			<span class="label-text mb-1 font-medium">Target AP</span>
			<input
				type="number"
				class="input input-bordered w-full font-mono"
				min={TARGET_MIN}
				max={TARGET_MAX}
				bind:value={target}
				onkeydown={(e) => e.key === "Enter" && calculate()}
			/>
		</label>

		<label class="label cursor-pointer justify-start gap-3 py-0">
			<input type="checkbox" class="toggle toggle-primary" bind:checked={isDouble} />
			<span class="label-text">Double AP event</span>
		</label>

		{#if isDouble && Number(target) % 2 !== 0 && targetInRange(Math.trunc(Number(target)))}
			<p class="text-xs text-base-content/60">
				Odd target under double AP will use one official 1 AP passcode.
			</p>
		{/if}

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
			<ol class="list-decimal space-y-1.5 pl-5 text-sm leading-relaxed">
				{#each item.steps as step}
					<li class={step.includes("passcode") ? "text-secondary" : ""}>{step}</li>
				{/each}
			</ol>
		</article>
	{/each}
</div>
