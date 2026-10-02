import { FIRST_PERIOD } from '~/composables/usePeriodOptions'

// One month/year selection shared by every summary and commission page, so
// switching tabs or opening someone's detail keeps the period you picked.
// Lives for the browser session; a full page reload starts at the current month.
export const useSelectedPeriod = () => {
    const year = useState('selected-period-year', () => new Date().getFullYear())
    const month = useState('selected-period-month', () => new Date().getMonth() + 1)

    // Keep the selection inside the viewable range (FIRST_PERIOD .. current month): switching years
    // can leave a month that hasn't happened yet, or one before the dashboard went live.
    const clamp = () => {
        const now = new Date()
        if (year.value < FIRST_PERIOD.year) year.value = FIRST_PERIOD.year
        if (year.value === now.getFullYear() && month.value > now.getMonth() + 1) month.value = now.getMonth() + 1
        if (year.value === FIRST_PERIOD.year && month.value < FIRST_PERIOD.month) month.value = FIRST_PERIOD.month
    }
    clamp()
    watch(year, clamp)

    return { year, month }
}
