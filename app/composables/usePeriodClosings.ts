import { SummaryService } from '~/services/summary-service'
import type { PeriodClosing } from '~/types/summary'

// Closed periods, shared so every summary page locks its edits the moment a
// Super Admin closes or reopens a period from the toolbar.
export const usePeriodClosings = () => {
    const closings = useState<PeriodClosing[]>('period-closings', () => [])
    const { year, month } = useSelectedPeriod()

    const load = async () => {
        const response = await new SummaryService().periodClosings()
        closings.value = response?.data ?? []
    }
    const closingOf = (period: string) => closings.value.find(c => c.period === period) ?? null

    const selectedClosing = computed(() => closingOf(`${year.value}${String(month.value).padStart(2, '0')}`))
    /** The period picked in the toolbar is closed: its invoices, churns and bonuses can't change. */
    const isSelectedClosed = computed(() => selectedClosing.value !== null)

    /** "Ditutup oleh Name (id) pada 5 Okt 2026, 15.36" */
    const describeClosing = (c: PeriodClosing) => {
        const who = c.closedByName ? `${c.closedByName} (${c.closedBy})` : c.closedBy
        const when = new Date(c.closedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
        return `Ditutup oleh ${who} pada ${when}`
    }

    return { closings, load, closingOf, selectedClosing, isSelectedClosed, describeClosing }
}
