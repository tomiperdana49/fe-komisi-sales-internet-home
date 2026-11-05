type AchievementColorKey = 'red' | 'orange' | 'violet' | 'emerald' | 'teal' | 'green' | 'primary' | 'amber'

const badgeClasses: Record<AchievementColorKey, string> = {
    red: 'text-red-500 dark:text-red-400 border-red-200 dark:border-red-800',
    orange: 'text-orange-500 dark:text-orange-400 border-orange-200 dark:border-orange-800',
    violet: 'text-violet-500 dark:text-violet-400 border-violet-200 dark:border-violet-800',
    emerald: 'text-emerald-500 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    teal: 'text-teal-500 dark:text-teal-400 border-teal-200 dark:border-teal-800',
    green: 'text-green-500 dark:text-green-400 border-green-200 dark:border-green-800',
    primary: 'text-primary-500 dark:text-primary-400 border-primary-200 dark:border-primary-800',
    amber: 'text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
}

const textClasses: Record<AchievementColorKey, string> = {
    red: 'font-bold text-red-500 dark:text-red-400',
    orange: 'font-bold text-orange-500 dark:text-orange-400',
    violet: 'font-bold text-violet-500 dark:text-violet-400',
    emerald: 'font-bold text-emerald-500 dark:text-emerald-400',
    teal: 'font-bold text-teal-500 dark:text-teal-400',
    green: 'font-bold text-green-500 dark:text-green-400',
    primary: 'font-bold text-primary-500 dark:text-primary-400',
    amber: 'font-bold text-amber-600 dark:text-amber-400'
}

/** Single source of truth for which achievement status maps to which color. */
function achievementColorKey(status: string): AchievementColorKey {
    const s = status.toLowerCase()
    if (s.includes('tidak capai') || s.includes('sp1')) return 'red'
    if (s.includes('average')) return 'orange'
    if (s.includes('bonus')) return 'violet'
    if (s.includes('excelent') || s.includes('excellent')) return 'emerald'
    if (s.includes('very good')) return 'teal'
    if (s.includes('capai target')) return 'green'
    return 'primary'
}

/**
 * What the dashboard shows for the backend's achievement status. `ongoing`: the period is
 * still running, so missing the target so far reads "Belum Capai" rather than a verdict.
 * Probation/Contract keep their own scale (Excellent, Average, ...) throughout.
 */
function achievementDisplay(status: string, ongoing: boolean): { label: string, color: AchievementColorKey } {
    switch (status) {
        case 'Capai target Bonus': return { label: 'Capai Bonus', color: 'violet' }
        case 'Capai target': return { label: 'Capai Standard', color: 'green' }
        case 'Tidak Capai target': return ongoing ? { label: 'Belum Capai', color: 'amber' } : { label: 'Tidak Capai', color: 'red' }
        case 'SP1': return ongoing ? { label: 'Belum Capai', color: 'amber' } : { label: 'SP1', color: 'red' }
        default: return { label: status, color: achievementColorKey(status) }
    }
}

export const useAchievementColor = () => {
    const getAchievementBadgeClass = (status: string, ongoing = false): string => badgeClasses[achievementDisplay(status, ongoing).color]
    const getAchievementTextClass = (status: string, ongoing = false): string => textClasses[achievementDisplay(status, ongoing).color]
    const getAchievementLabel = (status: string, ongoing = false): string => achievementDisplay(status, ongoing).label

    return {
        getAchievementBadgeClass,
        getAchievementTextClass,
        getAchievementLabel
    }
}
