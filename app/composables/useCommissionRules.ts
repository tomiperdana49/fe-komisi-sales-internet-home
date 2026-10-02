import { RulesService } from '~/services/rules-service'
import type { CommissionRules } from '~/types/rules'

const inFlight = new Set<string>()

/**
 * The commission rules in force for the selected period (useSelectedPeriod),
 * cached per period for the session. `rules` is null until loaded — callers
 * should render a number-free fallback meanwhile rather than guess values.
 */
export const useCommissionRules = () => {
    const cache = useState<Record<string, CommissionRules>>('commission-rules-by-period', () => ({}))
    const { year, month } = useSelectedPeriod()
    const period = computed(() => `${year.value}${String(month.value).padStart(2, '0')}`)

    const load = async (p: string) => {
        if (cache.value[p] || inFlight.has(p) || !useAuth().state.token) return
        inFlight.add(p)
        try {
            const response = await new RulesService().effectiveForViewer(p)
            cache.value = { ...cache.value, [p]: response.data.rules }
        } catch {
            // Tooltips fall back to generic wording; nothing else depends on this.
        } finally {
            inFlight.delete(p)
        }
    }

    watch(period, load, { immediate: true })

    /** Drop cached rules (e.g. after an admin publishes a new version) and reload the current period's. */
    const invalidate = () => {
        cache.value = {}
        load(period.value)
    }

    return { rules: computed(() => cache.value[period.value] ?? null), period, invalidate }
}
