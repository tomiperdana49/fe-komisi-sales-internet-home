import { CommissionSimulationService } from '~/services/commission-simulation-service'

export type CommissionSimulation = {
    /** % applied to the New commission before the performance penalty (e.g. 30 = the team sheet's "× 30%"). */
    newPct: number | null
    /** % applied to the recurring commission as calculated (100 = unchanged). */
    oldPct: number | null
}

const service = new CommissionSimulationService()

// Simulasi Komisi: one shared what-if, set by the designated account (BE decides who: canEdit)
// and applied to the figures every AM page SHOWS, so sales can line them up with the team
// sheet. Never changes the commission itself; the setting lives in a small file on the BE,
// not in the database. Empty = every page shows the real figures.
export const useCommissionSimulation = () => {
    const state = useState<CommissionSimulation>('commissionSimulation', () => ({ newPct: null, oldPct: null }))
    const canEdit = useState('commissionSimulationCanEdit', () => false)
    const loadedFor = useState<string | null>('commissionSimulationLoadedFor', () => null)
    const { state: authState } = useAuth()

    const load = async () => {
        const token = authState.token
        if (!token) return
        loadedFor.value = token
        try {
            const res = await service.get()
            if (res?.success && res.data) {
                state.value = { newPct: res.data.newPct ?? null, oldPct: res.data.oldPct ?? null }
                canEdit.value = Boolean(res.data.canEdit)
            }
        } catch { /* no setting = real figures */ }
    }

    // Once per login session (a new token = a new user may be signed in).
    if (import.meta.client && authState.token && loadedFor.value !== authState.token) load()

    const active = computed(() => state.value.newPct !== null || state.value.oldPct !== null)

    const save = async (value: CommissionSimulation): Promise<{ ok: boolean; message?: string }> => {
        try {
            const res = await service.save(value)
            if (!res?.success) return { ok: false, message: res?.message }
            state.value = { newPct: res.data.newPct ?? null, oldPct: res.data.oldPct ?? null }
            return { ok: true }
        } catch (error: any) {
            return { ok: false, message: error?.message }
        }
    }

    const reset = () => save({ newPct: null, oldPct: null })

    return { state, allowed: canEdit, active, save, reset, load }
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
