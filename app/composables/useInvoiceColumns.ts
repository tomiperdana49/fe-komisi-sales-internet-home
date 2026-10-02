import { h, resolveComponent } from 'vue'
import TermHint from '~/components/TermHint.vue'
import type { TableColumn } from '@nuxt/ui'
import type { GlossaryKey } from '~/composables/useGlossary'
import type { CommissionLineItem } from '~/types/sales'

type TotalField = 'subscription' | 'mrc' | 'commission'

// Shared by the sales and manager pages so both invoice tables read the same way.
export const useInvoiceColumns = () => {
    const UBadge = resolveComponent('UBadge')
    const { formatCurrency } = useFormat()
    const { getServiceLabel } = useServiceLabel()

    const hintHeader = (label: string, term: GlossaryKey) => () => h(TermHint, { term }, () => label)

    const invoiceColumns = (total: (field: TotalField) => number): TableColumn<CommissionLineItem>[] => [
        {
            accessorKey: 'paidDate',
            header: 'Tgl. Bayar',
            cell: ({ row }) => row.original.paidDate ? new Date(row.original.paidDate).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'
        },
        {
            id: 'label',
            header: 'Produk',
            cell: ({ row }) => {
                const { label, color } = getServiceLabel(row.original.category, row.original.serviceId)
                return h(UBadge, { label, color, variant: 'subtle' })
            }
        },
        {
            header: 'Layanan',
            cell: ({ row }) => h('div', { class: 'flex flex-col min-w-[120px]' }, [
                h('a', { href: `https://isx.nusa.net.id/v2/customer/service/${row.original.customerServiceId}/detail`, target: '_blank', class: 'text-blue-500 hover:underline font-semibold text-sm break-all' }, row.original.customerServiceAccount ?? ''),
                h('span', { class: 'text-xs text-gray-500 dark:text-gray-400 whitespace-normal break-words line-clamp-2' }, row.original.serviceName ?? '')
            ])
        },
        {
            header: 'Pelanggan',
            cell: ({ row }) => h('div', { class: 'flex flex-col min-w-[120px]' }, [
                h('a', { href: `https://isx.nusa.net.id/customer.php?custId=${row.original.customerId}&pid=profile`, target: '_blank', class: 'text-blue-500 hover:underline font-semibold text-sm' }, row.original.customerId),
                h('span', { class: 'text-xs text-gray-500 dark:text-gray-400 whitespace-normal break-words line-clamp-2' }, row.original.customerName ?? '')
            ])
        },
        {
            accessorKey: 'subscription',
            header: hintHeader('Subscription', 'subscription'),
            cell: ({ row }) => h('span', { class: 'font-medium' }, formatCurrency(row.original.subscription)),
            footer: () => h('div', { class: 'hidden lg:block text-right font-bold' }, formatCurrency(total('subscription')))
        },
        {
            accessorKey: 'mrc',
            header: hintHeader('MRC', 'mrc'),
            cell: ({ row }) => h('span', { class: 'font-medium' }, formatCurrency(row.original.mrc)),
            footer: () => h('div', { class: 'hidden lg:block text-right font-bold' }, formatCurrency(total('mrc')))
        },
        { id: 'month', header: hintHeader('Lama Kontrak', 'contractMonths'), cell: ({ row }) => h('span', { class: 'font-medium' }, `${row.original.month} bln`) },
        { id: 'lateMonth', header: hintHeader('Telat Bayar', 'lateMonth'), cell: ({ row }) => h('span', { class: ['font-medium', row.original.lateMonth > 0 ? 'text-red-500 dark:text-red-400' : ''] }, row.original.lateMonth > 0 ? `${row.original.lateMonth} bln` : '–') },
        {
            id: 'commission',
            header: hintHeader('Komisi', 'commission'),
            cell: ({ row }) => {
                const isZero = row.original.commission === 0
                return h('div', { class: ['flex flex-col items-end', isZero ? 'commission-zero' : ''] }, [
                    h('span', { class: 'text-xs text-gray-500 dark:text-gray-400' }, `Dasar ${formatCurrency(row.original.baseCommission)}`),
                    h('span', { class: 'text-xs font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 mb-1' }, `${row.original.commissionPercentage}%`),
                    h('span', { class: 'text-sm font-bold text-gray-900 dark:text-white' }, formatCurrency(row.original.commission))
                ])
            },
            footer: () => h('div', { class: 'text-right font-bold text-gray-900 dark:text-white' }, formatCurrency(total('commission')))
        }
    ]

    return { hintHeader, invoiceColumns }
}
