import { useHideAmounts } from '~/composables/useHideAmounts'

export const useFormat = () => {
    const { hidden } = useHideAmounts()

    const formatCurrency = (value: number): string => {
        if (hidden.value) return 'Rp ••••••'
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)
    }

    const formatDate = (isoDate: string): string => {
        const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number)
        if (y === undefined || m === undefined || d === undefined) return isoDate
        return new Date(y, m - 1, d).toLocaleDateString('en-US', { dateStyle: 'medium' })
    }

    return {
        formatCurrency,
        formatDate
    }
}
