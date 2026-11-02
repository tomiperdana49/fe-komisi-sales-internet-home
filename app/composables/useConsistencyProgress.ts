import type { ConsistencyProgress } from '~/types/sales'

/** Labels and sums for a Bonus Konsistensi block (be: ConsistencyProgress), shared by the AM and SM cards. */
export const useConsistencyProgress = () => {
    const { monthLabel } = usePeriodOptions()

    /** 202611 → "Nov 2026". */
    const periodLabel = (p: string) => `${monthLabel(Number(p.slice(4))).slice(0, 3)} ${p.slice(0, 4)}`

    const shiftPeriod = (p: string, n: number) => {
        const i = Number(p.slice(0, 4)) * 12 + Number(p.slice(4)) - 1 + n
        return `${Math.floor(i / 12)}${String(i % 12 + 1).padStart(2, '0')}`
    }

    const blockTotal = (p: ConsistencyProgress) => p.months.reduce((sum, m) => sum + (m.activityCount ?? 0), 0)

    /**
     * New Achievement still missing for the first tier, given every month left
     * (the selected one included) must also reach the monthly minimum.
     */
    const shortfall = (p: ConsistencyProgress, period: string) => {
        const perMonth = p.months
            .filter(m => m.period >= period)
            .reduce((sum, m) => sum + Math.max(p.minPerMonth - (m.activityCount ?? 0), 0), 0)
        return Math.max((p.tiers[0]?.at ?? 0) - blockTotal(p), perMonth)
    }

    /** A period runs from the 26th of the month before to the 25th (be: getDateRangeForPeriod). */
    const blockDates = (p: ConsistencyProgress) => `26 ${periodLabel(shiftPeriod(p.blockStart, -1))} – 25 ${periodLabel(p.blockEnd)}`

    return { periodLabel, shiftPeriod, blockTotal, shortfall, blockDates }
}
