import { type ApAction } from "./actions"
import { type SolResult, apAt } from "./solver"

function pl(i: number, name: string): string {
	return i === 1 ? `${i} ${name}` : `${i} ${name}s`
}

function formatCapture(count: number, label: string, ap: number[]): string[] {
	const lines: string[] = []
	const full = Math.floor(count / 8)
	const step = count % 8
	if (full > 0) {
		lines.push(`Capture ${pl(full, label)} with 8 Resonators +${ap[ap.length - 1] * full}ap`)
	}
	if (step > 0) {
		lines.push(`Capture 1 ${label} with ${pl(step, "Resonator")} +${ap[step - 1]}ap`)
	}
	return lines
}

function formatHack(count: number, unit: number): string[] {
	const lines: string[] = []
	const enemy = Math.floor(count / 2)
	const allied = count % 2
	if (enemy > 0) lines.push(`Hack Enemy Portal ${pl(enemy, "time")} +${unit * 2 * enemy}ap`)
	if (allied > 0) lines.push(`Hack Allied Portal ${pl(allied, "time")} +${unit * allied}ap`)
	return lines
}

export function formatSolution(actions: ApAction[], r: SolResult): string[] {
	const lines: string[] = []
	for (let i = 0; i < actions.length; i++) {
		const n = r.sol[i] ?? 0
		if (n <= 0) continue
		const v = actions[i]
		switch (v.kind) {
			case "machina":
				lines.push(...formatCapture(n, "Machina Portal", v.ap))
				break
			case "white":
				lines.push(...formatCapture(n, "White Portal", v.ap))
				break
			case "hack":
				lines.push(...formatHack(n, v.ap[0]))
				break
			default:
				lines.push(`${v.instruction} ${pl(n, "time")} +${apAt(v, n)}ap`)
		}
	}
	if (r.passcode) lines.push("Get 1 AP passcode 1 time +1ap")
	return lines
}
