import { h } from 'vue'
// Explicit import: Nuxt only rewrites resolveComponent() inside .vue files, not in composables.
import { UBadge } from '#components'
import TermHint from '~/components/TermHint.vue'
import type { TableColumn } from '@nuxt/ui'
import type { GlossaryKey } from '~/composables/useGlossary'
import type { CommissionLineItem } from '~/types/sales'

type TotalField = 'subscription' | 'mrc' | 'commission'

// Shared by the sales and manager pages so both invoice tables read the same way.
export const useInvoiceColumns = () => {
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
                const { label, color } = getServiceLabel(row.original.category, row.original.serviceGroup)
                const badge = h(UBadge, { label, color, variant: 'subtle' })
                if (!row.original.isRenewal) return badge
                return h('div', { class: 'flex flex-col items-start gap-1' }, [
                    badge,
                    h(UBadge, {
                        label: 'Perpanjangan',
                        color: 'neutral',
                        variant: 'outline',
                        size: 'sm',
                        title: 'Kenaikan harga saat perpanjangan kontrak. Billing mencatatnya sebagai baru, tapi dihitung sebagai recurring dan tidak menambah pencapaian New.'
                    })
                ])
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

    /**
     * Free-text match for the transaction tables: customer ID/name/company, service
     * account/name and invoice number. Works for invoice line items and churn rows.
     */
    const matchesSearch = (row: Record<string, any>, query: string) => {
        const q = query.trim().toLowerCase()
        if (!q) return true
        return [
            row.customerId, row.customerName, row.customerCompany, row.customerServiceAccount, row.serviceName, row.aiInvoice,
            row.customer_id, row.customer_name, row.customer_service_account, row.service_name
        ].some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(q))
    }

    return { hintHeader, invoiceColumns, matchesSearch }
}
