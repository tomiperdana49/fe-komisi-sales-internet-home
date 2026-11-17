const STORAGE_KEY = 'commissionSimulation'

/** Only these accounts get the Simulasi Komisi menu; for anyone else it stays off, whatever their browser has stored. */
const SIMULATION_EMAILS = ['tomi@nusa.id']

export type CommissionSimulation = {
    /** % applied to the New commission before the performance penalty (e.g. 30 = the team sheet's "× 30%"). */
    newPct: number | null
    /** % applied to the recurring commission as calculated (100 = unchanged). */
    oldPct: number | null
}

const empty = (): CommissionSimulation => ({ newPct: null, oldPct: null })
const toPct = (v: unknown): number | null => {
    const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : null
}

// Simulasi Komisi: a viewer-side what-if, so an AM can line the dashboard up against the
// team sheet. Only changes what this browser shows on the AM page — never the commission
// itself, the BE or the database. Remembered per browser; works for the visit when storage
// is unavailable.
export const useCommissionSimulation = () => {
    const state = useState<CommissionSimulation>('commissionSimulation', empty)
    const loaded = useState('commissionSimulationLoaded', () => false)

    if (import.meta.client && !loaded.value) {
        loaded.value = true
        try {
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
            if (saved) state.value = { newPct: toPct(saved.newPct), oldPct: toPct(saved.oldPct) }
        } catch { /* keep it empty */ }
    }

    const { state: authState } = useAuth()
    const allowed = computed(() => SIMULATION_EMAILS.includes((authState.user?.email ?? '').trim().toLowerCase()))
    const active = computed(() => allowed.value && (state.value.newPct !== null || state.value.oldPct !== null))

    const save = (value: CommissionSimulation) => {
        state.value = { newPct: toPct(value.newPct), oldPct: toPct(value.oldPct) }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state.value))
        } catch { /* still applies for this visit */ }
    }

    const reset = () => save(empty())

    return { state, allowed, active, save, reset }
}

type SimulationData = {
    breakdown: { [K in 'new' | 'recurring' | 'prorate' | 'upgrade' | 'alat' | 'setup' | 'event']?: { commission: number } }
    deduction: { commission: number }
    bonusBulanan: number
    bonusKelebihanService: number
    consistencyBonus: number
}
type SimulationItem = { type: string; commission: number; grossCommission?: number }

/**
 * The what-if behind Simulasi Komisi; both percentages apply to commission:
 * - customer baru: Σ New commission before the performance penalty (the sheet's per-row
 *   "Komisi") × newPct, then the churn deduction — 30% reproduces a missed-target month;
 * - customer lama: the recurring commission × oldPct (100% = unchanged).
 * Everything else (Prorate, Upgrade, Alat, Setup, Event, bonuses) stays as calculated.
 */
export function simulateCommission(data: SimulationData, items: SimulationItem[], sim: CommissionSimulation) {
    const b = data.breakdown
    const c = (k: keyof SimulationData['breakdown']) => Number(b[k]?.commission ?? 0)
    const churn = Number(data.deduction.commission ?? 0)
    const newGross = items.filter(i => i.type === 'new').reduce((s, i) => s + Number(i.grossCommission ?? i.commission), 0)
    // New as calculated, before churn (b.new is net of churn).
    const newActual = c('new') + churn
    const newSim = sim.newPct === null ? newActual : newGross * (sim.newPct / 100)
    const oldActual = c('recurring')
    const oldSim = sim.oldPct === null ? oldActual : oldActual * (sim.oldPct / 100)
    const salesOthers = c('prorate') + c('upgrade') + c('alat') + c('setup') + c('event')
    const others = salesOthers + data.bonusBulanan + data.bonusKelebihanService + data.consistencyBonus
    return {
        newGross, newSim, churn, oldActual, oldSim, others,
        /** "Komisi Penjualan" on the AM page: every sales commission before the churn deduction. */
        salesBeforeChurn: newSim + oldSim + salesOthers,
        total: newSim - churn + oldSim + others
    }
}
