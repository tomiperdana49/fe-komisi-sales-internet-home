import { FIRST_PERIOD, currentPeriod } from '~/composables/usePeriodOptions'

// One month/year selection shared by every summary and commission page, so
// switching tabs or opening someone's detail keeps the period you picked.
// Lives for the browser session; a full page reload starts at the running period.
export const useSelectedPeriod = () => {
    const year = useState('selected-period-year', () => currentPeriod().year)
    const month = useState('selected-period-month', () => currentPeriod().month)

    // Keep the selection inside the viewable range (FIRST_PERIOD .. running period): switching years
    // can leave a month that hasn't happened yet, or one before the dashboard went live.
    const clamp = () => {
        const running = currentPeriod()
        if (year.value < FIRST_PERIOD.year) year.value = FIRST_PERIOD.year
        if (year.value > running.year) year.value = running.year
        if (year.value === running.year && month.value > running.month) month.value = running.month
        if (year.value === FIRST_PERIOD.year && month.value < FIRST_PERIOD.month) month.value = FIRST_PERIOD.month
    }
    clamp()
    watch(year, clamp)

    return { year, month }
}
