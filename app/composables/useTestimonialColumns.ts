import { h } from 'vue'
// Explicit import: Nuxt only rewrites resolveComponent() inside .vue files, not in composables.
import { NuxtLink, UButton, UIcon } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { TestimonialItem } from '~/types/testimonial'

/** Testimonial table columns, in the sheet's order: Time Insert, Team (SM), Sales (AM), customer, date, link. */
export const useTestimonialColumns = () => {
    const { formatDate } = useFormat()

    const muted = (text = '-') => h('span', { class: 'text-xs text-gray-400 italic' }, text)

    const testimonialColumns = (options: {
        /** Show the Sales (AM) column — the admin listing spans every Account Manager. */
        showSales: boolean
        /** Whoever entered it, or a Super Admin, may edit or delete it; the API enforces the same. */
        canChange: (row: TestimonialItem) => boolean
        isDeleting: (row: TestimonialItem) => boolean
        onEdit: (row: TestimonialItem) => void
        onDelete: (row: TestimonialItem) => void
    }): TableColumn<TestimonialItem>[] => [
        {
            accessorKey: 'createdAt',
            header: 'Time Insert',
            cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'text-xs font-medium' }, new Date(row.original.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })),
                row.original.createdByName && row.original.createdBy !== row.original.employeeId
                    ? h('span', { class: 'text-[10px] text-gray-400' }, `oleh ${row.original.createdByName}`)
                    : null,
                row.original.updatedAt
                    ? h('span', { class: 'text-[10px] text-amber-600 dark:text-amber-400' }, `diubah ${row.original.updatedByName ?? ''} ${new Date(row.original.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}`)
                    : null
            ])
        },
        {
            accessorKey: 'managerName',
            header: 'Team (SM)',
            cell: ({ row }) => row.original.managerName ? h('span', { class: 'text-sm' }, row.original.managerName) : muted()
        },
        ...(options.showSales ? [{
            accessorKey: 'employeeName',
            header: 'Sales (AM)',
            cell: ({ row }) => h(NuxtLink, { to: `/${row.original.employeeId}/sales`, class: 'flex flex-col group' }, () => [
                h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.employeeName ?? row.original.employeeId),
                h('span', { class: 'text-xs text-gray-500' }, row.original.employeeId)
            ])
        } as TableColumn<TestimonialItem>] : []),
        {
            accessorKey: 'customerName',
            header: 'Nama Customer',
            cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.customerName)
        },
        {
            accessorKey: 'customerId',
            header: 'ID Customer',
            cell: ({ row }) => h('span', { class: 'font-mono text-xs' }, row.original.customerId)
        },
        {
            accessorKey: 'testimonialDate',
            header: 'Tanggal Testimoni',
            cell: ({ row }) => formatDate(row.original.testimonialDate)
        },
        {
            accessorKey: 'link',
            header: 'Link Testimoni',
            cell: ({ row }) => h('a', { href: row.original.link, target: '_blank', rel: 'noopener', class: 'text-xs text-blue-500 hover:underline' }, 'Lihat')
        },
        {
            id: 'actions',
            header: '',
            cell: ({ row }) => options.canChange(row.original)
                ? h('div', { class: 'flex justify-end gap-1' }, [
                    h(UButton, {
                        color: 'neutral',
                        variant: 'ghost',
                        size: 'xs',
                        icon: 'i-lucide-pencil',
                        'aria-label': 'Ubah testimoni',
                        onClick: () => options.onEdit(row.original)
                    }),
                    h(UButton, {
                        color: 'error',
                        variant: 'ghost',
                        size: 'xs',
                        icon: 'i-lucide-trash-2',
                        loading: options.isDeleting(row.original),
                        'aria-label': 'Hapus testimoni',
                        onClick: () => options.onDelete(row.original)
                    })
                ])
                : row.original.periodClosed
                    ? h('div', { class: 'flex justify-end', title: 'Periode sudah ditutup' }, [
                        h(UIcon, { name: 'i-lucide-lock', class: 'size-4 text-gray-400' })
                    ])
                    : null
        }
    ]

    const matchesTestimonial = (row: TestimonialItem, query: string) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return [row.customerName, row.customerId, row.employeeName, row.employeeId, row.managerName]
            .some(v => v?.toLowerCase().includes(q))
    }

    return { testimonialColumns, matchesTestimonial }
}
