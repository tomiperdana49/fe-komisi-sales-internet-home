const STORAGE_KEY = 'hideAmounts'

// Privacy toggle: masks every rupiah amount (formatCurrency) so a commission page can be
// opened in front of others. Remembered per browser; storage can be unavailable (private
// mode, blocked site data), in which case amounts simply stay hidden.
// Hidden by default: amounts only show once the viewer chooses to reveal them.
export const useHideAmounts = () => {
    const hidden = useState('hideAmounts', () => true)
    const loaded = useState('hideAmountsLoaded', () => false)

    if (import.meta.client && !loaded.value) {
        loaded.value = true
        try {
            hidden.value = localStorage.getItem(STORAGE_KEY) !== '0'
        } catch { /* keep the default */ }
    }

    const toggle = () => {
        hidden.value = !hidden.value
        try {
            localStorage.setItem(STORAGE_KEY, hidden.value ? '1' : '0')
        } catch { /* still toggles for this visit */ }
    }

    return { hidden, toggle }
}
