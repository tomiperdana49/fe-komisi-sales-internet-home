import { h, resolveComponent } from 'vue'
import type { Column } from '@tanstack/vue-table'

// Clickable column header that cycles the column's sort order.
export const useSortableHeader = () => {
    const UButton = resolveComponent('UButton')

    const sortableHeader = (label: string, align?: 'right' | 'center') => ({ column }: { column: Column<any> }) => {
        const isSorted = column.getIsSorted()
        return h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            label,
            icon: isSorted ? (isSorted === 'asc' ? 'i-lucide-arrow-up-narrow-wide' : 'i-lucide-arrow-down-wide-narrow') : 'i-lucide-arrow-up-down',
            onClick: () => column.toggleSorting(column.getIsSorted() === 'asc'),
            class: align === 'right' ? 'ml-auto' : align === 'center' ? 'mx-auto' : undefined
        })
    }

    return { sortableHeader }
}
