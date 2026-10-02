const MONTH_NAMES = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']

export const usePeriodOptions = () => {
    const monthSelect = MONTH_NAMES.map((label, i) => ({ label, id: i + 1 }))
    // Commission data starts in 2026; no point offering years that haven't happened yet.
    const yearItems = Array.from({ length: Math.max(new Date().getFullYear() - 2025, 1) }, (_, i) => 2026 + i)
    const monthLabel = (month: number) => MONTH_NAMES[month - 1] ?? String(month)
    return { monthSelect, yearItems, monthLabel }
}
