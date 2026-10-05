/** The earliest period the dashboard offers — nothing earlier is ever shown. */
export const FIRST_PERIOD = { year: 2026, month: 1 }

const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export const usePeriodOptions = () => {
    // Every month — for picking a future period (e.g. when a rule set takes effect).
    const monthSelect = MONTH_NAMES.map((label, i) => ({ label, id: i + 1 }))
    /**
     * Months that have data to view: from FIRST_PERIOD up to the current month.
     * The first year starts at FIRST_PERIOD.month; the current year stops at the current month.
     */
    const viewableMonths = (year: number) => {
        const now = new Date()
        const from = year === FIRST_PERIOD.year ? FIRST_PERIOD.month : 1
        const to = year >= now.getFullYear() ? now.getMonth() + 1 : 12
        return monthSelect.filter(m => m.id >= from && m.id <= to)
    }
    // From the first year up to the current one; no point offering years that haven't happened yet.
    const yearItems = Array.from({ length: Math.max(new Date().getFullYear() - FIRST_PERIOD.year + 1, 1) }, (_, i) => FIRST_PERIOD.year + i)
    const monthLabel = (month: number) => MONTH_NAMES[month - 1] ?? String(month)

    // A commission period runs from the 26th of the previous month to the 25th (be: getDateRangeForPeriod).
    // Until it ends, achievement statuses are provisional — the count can still move either way.
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
    const periodEndDate = (year: number, month: number) => new Date(year, month - 1, 25, 23, 59, 59)
    const isPeriodOngoing = (year: number, month: number) => new Date() <= periodEndDate(year, month)
    /** Same check from a period's endDate (YYYY-MM-DD) as returned by the API. */
    const isOngoingUntil = (endDate: string) => {
        const [y, m, d] = endDate.slice(0, 10).split('-').map(Number)
        return new Date() <= endOfDay(new Date(y!, m! - 1, d!))
    }
    const shortDate = (date: Date) => date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

    return { monthSelect, viewableMonths, yearItems, monthLabel, periodEndDate, isPeriodOngoing, isOngoingUntil, shortDate }
}
