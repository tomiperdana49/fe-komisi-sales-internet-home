import type { ManagerServiceGroup } from '~/types/manager'

const COLORS = {
    'Home': 'primary',
    'Nusafiber': 'info',
    'NusaSelecta': 'warning',
    'Digital Business': 'success',
    'Access Business': 'neutral'
} as const

export const useServiceLabel = () => {
    // The group comes from the period's Aturan Komisi on the BE, so a product an admin adds is labelled right away.
    const getServiceLabel = (category: string | null | undefined, serviceGroup: ManagerServiceGroup) => {
        if (category?.trim() === 'Alat') return { label: 'Alat', color: 'error' as const }
        return { label: serviceGroup, color: COLORS[serviceGroup] }
    }

    return { getServiceLabel }
}
