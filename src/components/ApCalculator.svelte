<script lang="ts">
	import {
		COST_KINDS,
		ACTION_LABELS,
		DEFAULT_COSTS,
		DESTROY_AP,
		GAP_MAX,
		GUARANTEED_GAP,
		GUARANTEED_GAP_DOUBLE,
		type ActionKind,
		type NearbyConfig,
		type NearbyPortal,
		buildActions,
		clampNearby,
		destroyApOf,
		gapOf,
		gapValid,
		guaranteedGap,
	} from "../lib/actions"
	import { formatSolution, type StepRow } from "../lib/format"
	import { computePlans, type SolResult } from "../lib/solver"

	const RES_OPTS = [0, 1, 2, 3, 4, 5, 6, 7, 8] as const
	const MOD_OPTS = [0, 1, 2, 3, 4] as const
	const LINK_OPTS = [0, 1] as const

	let currentAp = $state(0)
	let targetAp = $state(5777)
	let isDouble = $state(false)
	let costs = $state({ ...DEFAULT_COSTS })
	let useEnemy = $state(false)
	let enemy = $state<NearbyPortal>({ resonators: 8, mods: 0, links: 0 })
	let useMachina = $state(false)
	let machina = $state<NearbyPortal>({ resonators: 8, mods: 4, links: 0 })
	let error = $state("")
	let results = $state<{ result: SolResult; steps: StepRow[] }[]>([])
	let checked = $state<boolean[][]>([])
	let busy = $state(false)

	let gap = $derived(gapOf(Math.trunc(Number(currentAp)), Math.trunc(Number(targetAp))))
	let guarantee = $derived(guaranteedGap(isDouble))
	let curAp = $derived(Math.trunc(Number(currentAp)) || 0)

	/** Full clear + Capture+8 preview (respects Double AP). */
	function nearbyPreview(p: NearbyPortal, machinaPortal: boolean): number {
		const d = destroyApOf(p)
		const fill = (machinaPortal ? 675 + 1331 : 675) + 125 * 8 + 250
		const total = d + fill
		return isDouble ? total * 2 : total
	}

	function nearbyConfig(): NearbyConfig {
		return {
			enemy: useEnemy ? clampNearby(enemy) : null,
			machina: useMachina ? clampNearby(machina) : null,
		}
	}

	function resetCosts() {
		costs = { ...DEFAULT_COSTS }
	}

	function sanitizeCosts(): Partial<Record<ActionKind, number>> {
		const out: Partial<Record<ActionKind, number>> = {}
		for (const k of COST_KINDS) {
			const n = Math.trunc(Number(costs[k]))
			if (!Number.isFinite(n)) {
				out[k] = DEFAULT_COSTS[k]
			} else {
				out[k] = Math.min(100, Math.max(1, n))
			}
		}
		return out
	}

	function sanitizeNearbyInputs() {
		if (useEnemy) enemy = clampNearby(enemy)
		if (useMachina) machina = clampNearby(machina)
	}

	function checkedAp(solIdx: number): number {
		const item = results[solIdx]
		const flags = checked[solIdx]
		if (!item || !flags) return 0
		let sum = 0
		for (let j = 0; j < item.steps.length; j++) {
			if (flags[j]) sum += item.steps[j].ap
		}
		return sum
	}

	function calculate() {
		error = ""
		results = []
		checked = []
		const cur = Math.trunc(Number(currentAp))
		const tgt = Math.trunc(Number(targetAp))
		if (!gapValid(cur, tgt)) {
			error = `Need target > current, both ≥ 0, and gap ≤ ${GAP_MAX}.`
			return
		}
		sanitizeNearbyInputs()
		const g = gapOf(cur, tgt)
		const costMap = sanitizeCosts()
		costs = { ...DEFAULT_COSTS, ...costMap } as typeof costs
		const nearby = nearbyConfig()
		busy = true
		queueMicrotask(() => {
			const actions = buildActions(isDouble, costMap, nearby)
			const plans = computePlans(g, isDouble, 3, costMap, nearby).filter((r) => r.diff === 0)
			if (plans.length === 0) {
				error = "No exact solution for this gap."
				busy = false
				return
			}
			results = plans.map((r) => ({ result: r, steps: formatSolution(actions, r) }))
			checked = results.map((item) => item.steps.map(() => false))
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

		<details class="rounded-box border border-base-content/10 bg-base-200/40" open>
			<summary class="cursor-pointer px-3 py-2 text-sm font-medium">Nearby portals</summary>
			<div class="flex flex-col gap-3 border-t border-base-content/10 px-3 py-3">
				<p class="text-xs text-base-content/55">
					Optional: up to one enemy and one Machina. Planner may clear → capture → deploy 1–8
					resonators. Link ≤ 1. Destroy: {DESTROY_AP.resonator}/{DESTROY_AP.mod}/{DESTROY_AP.link} AP
					(res/mod/link).
				</p>

				<div class="rounded-box border border-base-content/10 bg-base-100/60 p-3">
					<label class="label cursor-pointer justify-start gap-3 py-0">
						<input type="checkbox" class="toggle toggle-sm toggle-primary" bind:checked={useEnemy} />
						<span class="label-text font-medium">Enemy portal</span>
					</label>
					{#if useEnemy}
						<div class="mt-3 grid grid-cols-3 gap-2">
							<label class="form-control">
								<span class="label-text mb-1 text-xs">Resonators</span>
								<select class="select select-bordered select-sm w-full font-mono" bind:value={enemy.resonators}>
									{#each RES_OPTS as n}
										<option value={n}>{n}</option>
									{/each}
								</select>
							</label>
							<label class="form-control">
								<span class="label-text mb-1 text-xs">Mods</span>
								<select class="select select-bordered select-sm w-full font-mono" bind:value={enemy.mods}>
									{#each MOD_OPTS as n}
										<option value={n}>{n}</option>
									{/each}
								</select>
							</label>
							<label class="form-control">
								<span class="label-text mb-1 text-xs">Links</span>
								<select class="select select-bordered select-sm w-full font-mono" bind:value={enemy.links}>
									{#each LINK_OPTS as n}
										<option value={n}>{n}</option>
									{/each}
								</select>
							</label>
						</div>
						<p class="mt-2 font-mono text-xs tabular-nums text-base-content/60">
							Clear + fill 8 ≈ +{nearbyPreview(clampNearby(enemy), false)} AP
						</p>
					{/if}
				</div>

				<div class="rounded-box border border-base-content/10 bg-base-100/60 p-3">
					<label class="label cursor-pointer justify-start gap-3 py-0">
						<input type="checkbox" class="toggle toggle-sm toggle-primary" bind:checked={useMachina} />
						<span class="label-text font-medium">Machina portal</span>
					</label>
					{#if useMachina}
						<div class="mt-3 grid grid-cols-3 gap-2">
							<label class="form-control">
								<span class="label-text mb-1 text-xs">Resonators</span>
								<select class="select select-bordered select-sm w-full font-mono" bind:value={machina.resonators}>
									{#each RES_OPTS as n}
										<option value={n}>{n}</option>
									{/each}
								</select>
							</label>
							<label class="form-control">
								<span class="label-text mb-1 text-xs">Mods</span>
								<select class="select select-bordered select-sm w-full font-mono" bind:value={machina.mods}>
									{#each MOD_OPTS as n}
										<option value={n}>{n}</option>
									{/each}
								</select>
							</label>
							<label class="form-control">
								<span class="label-text mb-1 text-xs">Links</span>
								<select class="select select-bordered select-sm w-full font-mono" bind:value={machina.links}>
									{#each LINK_OPTS as n}
										<option value={n}>{n}</option>
									{/each}
								</select>
							</label>
						</div>
						<p class="mt-2 font-mono text-xs tabular-nums text-base-content/60">
							Clear + fill 8 ≈ +{nearbyPreview(clampNearby(machina), true)} AP
						</p>
					{/if}
				</div>
			</div>
		</details>

		<details class="rounded-box border border-base-content/10 bg-base-200/40">
			<summary class="cursor-pointer px-3 py-2 text-sm font-medium">Action costs</summary>
			<div class="flex flex-col gap-2 border-t border-base-content/10 px-3 py-3">
				<p class="text-xs text-base-content/55">
					Higher cost = planner avoids that action when possible (1–100).
				</p>
				{#each COST_KINDS as kind}
					<label class="flex items-center justify-between gap-3 text-sm">
						<span class="min-w-0 flex-1 truncate">{ACTION_LABELS[kind]}</span>
						<input
							type="number"
							class="input input-bordered input-sm w-20 font-mono"
							min="1"
							max="100"
							step="1"
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
		{@const done = checkedAp(i)}
		<article class="rounded-box bg-base-100 p-5 shadow-sm ring-1 ring-base-content/10">
			<div class="mb-3 flex flex-wrap items-center justify-between gap-2">
				<h2 class="text-lg font-semibold">Solution {i + 1}</h2>
				<div class="flex flex-wrap gap-1.5">
					<span class="badge badge-ghost font-mono tabular-nums">cost {item.result.cost}</span>
					<span class="badge badge-primary font-mono tabular-nums">+{item.result.ap} AP</span>
				</div>
			</div>
			<p class="mb-2 font-mono text-sm tabular-nums text-base-content/70">
				Checked +{done} AP · should be at
				<span class="font-semibold text-base-content">{curAp + done}</span>
			</p>
			<ul class="divide-y divide-base-content/10">
				{#each item.steps as step, j}
					<li
						class="{step.passcode
							? 'rounded-lg bg-secondary/10 ring-1 ring-secondary/40'
							: ''}"
					>
						<label
							class="flex cursor-pointer items-baseline justify-between gap-3 py-2 text-sm {step.passcode
								? 'px-2'
								: ''} {checked[i]?.[j] ? 'opacity-60' : ''}"
						>
							<span class="flex min-w-0 items-baseline gap-2">
								<input
									type="checkbox"
									class="checkbox checkbox-sm shrink-0 translate-y-0.5"
									bind:checked={checked[i][j]}
								/>
								<span class="min-w-0 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
									<span
										class={step.passcode
											? "font-semibold text-secondary"
											: "text-base-content"}
									>
										{step.action}
									</span>
									<span
										class="badge badge-sm font-mono {step.passcode
											? 'badge-secondary'
											: 'badge-ghost opacity-80'}"
									>
										{step.qty}
									</span>
								</span>
							</span>
							<span
								class="shrink-0 font-mono text-sm tabular-nums {step.passcode
									? 'font-semibold text-secondary'
									: 'text-primary'}"
							>
								+{step.ap}ap
							</span>
						</label>
					</li>
				{/each}
			</ul>
		</article>
	{/each}
</div>
