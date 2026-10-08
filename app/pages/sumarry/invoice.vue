<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Daftar Invoice</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Semua invoice yang dihitung komisinya untuk {{ selectedMonthLabel }} {{ year }}. Approve invoice yang telat bayar untuk menghapus potongan keterlambatan.
                    </p>
                </div>

                <SummaryStats :stats="stats" />

                <UCard>
                    <template #header>
                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                <span class="inline-block size-3 rounded-sm bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700" />
                                Baris oranye = invoice sudah diubah manual oleh admin.
                            </p>
                            <UInput v-model="globalFilter" icon="i-heroicons-magnifying-glass" placeholder="Cari invoice, pelanggan, sales..." class="w-full sm:w-72" />
                        </div>
                    </template>

                    <UTable
                        ref="table"
                        sticky
                        v-model:pagination="pagination"
                        v-model:global-filter="globalFilter"
                        v-model:sorting="sorting"
                        :columns="columns"
                        :data="summaryData"
                        :pagination-options="{
                            getPaginationRowModel: getPaginationRowModel()
                        }"
                        empty="Tidak ada invoice untuk periode ini."
                        class="flex-1 max-h-[800px] [&_tr:has(.row-adjusted)]:bg-amber-50 dark:[&_tr:has(.row-adjusted)]:bg-amber-950/20"
                    />

                    <template #footer>
                        <TablePaginationFooter :table-api="table?.tableApi" />
                    </template>
                </UCard>
            </div>
        </UContainer>
        <AdjustInvoiceModal
            v-model:open="isAdjustModalOpen"
            :ai="selectedAdjustAi"
            @success="fetchSummary"
        />
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent, ref, onMounted, watch, computed, useTemplateRef } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { SummaryService } from '~/services/summary-service'
import type { InvoiceSummaryItem } from '~/types/summary'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
    headerProps: { toolbar: true }
})

const { sortableHeader } = useSortableHeader()
const UAvatar = resolveComponent('UAvatar')
const NuxtLink = resolveComponent('NuxtLink')
const UButton = resolveComponent('UButton')
const USwitch = resolveComponent('USwitch')
const UIcon = resolveComponent('UIcon')
const UTooltip = resolveComponent('UTooltip')
const { withTooltip } = useTextTooltip()
const UDropdownMenu = resolveComponent('UDropdownMenu')

const { setLoading } = useLoading()
const { formatCurrency, formatDate } = useFormat()
const toast = useToast()
const summaryService = new SummaryService()

const isAdjustModalOpen = ref(false)
const selectedAdjustAi = ref<number | null>(null)

const openAdjustModal = (row: InvoiceSummaryItem) => {
    selectedAdjustAi.value = row.aiInvoice
    isAdjustModalOpen.value = true
}

const getRowItems = (row: any) => [
    [
        {
            label: 'Ubah Data Invoice',
            icon: 'i-heroicons-wrench-screwdriver',
            onSelect: () => openAdjustModal(row.original)
        }
    ]
]

const table = useTemplateRef('table')
const summaryData = ref<InvoiceSummaryItem[]>([])
const { year, month: selectedMonth } = useSelectedPeriod()

const pagination = ref({
    pageIndex: 0,
    pageSize: 100
})
const sorting = ref([{ id: 'no', desc: false }])
const globalFilter = ref('')

const { monthLabel } = usePeriodOptions()
const { rules } = useCommissionRules()

const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

const stats = computed(() => {
    const rows = summaryData.value
    const lateUnapproved = rows.filter(r => r.lateMonth > 0 && !r.isApproved).length
    return [
        { label: 'Jumlah Invoice', value: rows.length },
        { label: 'Total Komisi', value: formatCurrency(rows.reduce((a, r) => a + r.commission, 0)), class: 'text-primary-600 dark:text-primary-400' },
        { label: 'Telat Bayar, Belum Di-approve', value: lateUnapproved, note: 'Komisinya masih kena potongan', class: lateUnapproved ? 'text-red-600 dark:text-red-400' : undefined },
        { label: 'Diubah Manual', value: rows.filter(r => r.isAdjusted).length }
    ]
})

const columns: TableColumn<InvoiceSummaryItem>[] = [
    {
        id: 'no',
        header: '#',
        cell: ({ row }) => h('div', { class: 'text-center text-xs' }, row.index + 1)
    },
    {
        accessorKey: 'aiInvoice',
        header: sortableHeader('No. Invoice'),
        cell: ({ row }) => h('div', { class: ['flex items-center justify-center gap-1.5', row.original.isAdjusted ? 'row-adjusted' : ''] }, [
            h('span', row.original.aiInvoice),
            row.original.isAdjusted
                ? h(UTooltip, { text: 'Invoice ini sudah diubah manual oleh admin', delayDuration: 0 }, () =>
                    h(UIcon, { name: 'i-lucide-wrench', class: 'size-3.5 text-amber-500' }))
                : null
        ])
    },
    {
        id: 'sales',
        accessorFn: (row) => {
            const name = row.sales?.name || 'Customer Relation Officer'
            const employeeId = row.sales?.employeeId || ''
            return `${name} ${employeeId}`
        },
        header: sortableHeader('Account Manager'),
        sortingFn: (rowA, rowB) => {
            const nameA = rowA.original.sales?.name || 'Customer Relation Officer'
            const nameB = rowB.original.sales?.name || 'Customer Relation Officer'
            return nameA.localeCompare(nameB)
        },
        cell: ({ row }) => {
            const sales = row.original.sales
            if (!sales || !sales.employeeId) return h('div', { class: 'text-gray-400 italic' }, 'Customer Relation Officer')

            return h(NuxtLink, {
                to: `/${sales.employeeId}/sales`,
                class: 'flex items-center gap-3 group'
            }, [
                h(UAvatar, { src: sales.photoProfile || undefined, alt: sales.name || '', size: 'sm' }),
                h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, sales.name || 'Unknown'),
                    h('span', { class: 'text-xs text-gray-500' }, sales.employeeId || '')
                ])
            ])
        }
    },
    {
        id: 'manager',
        accessorFn: (row) => row.managerEmployee?.name || row.managerEmployee?.employeeId || '',
        header: sortableHeader('Sales Manager'),
        sortingFn: (rowA, rowB) => {
            const nameA = rowA.original.managerEmployee?.name || ''
            const nameB = rowB.original.managerEmployee?.name || ''
            return nameA.localeCompare(nameB)
        },
        cell: ({ row }) => {
            const manager = row.original.managerEmployee
            if (!manager) return h('div', { class: 'text-gray-400 italic text-xs' }, '-')

            return h(NuxtLink, {
                to: `/${manager.employeeId}/manager`,
                class: 'flex items-center gap-3 group'
            }, [
                h(UAvatar, { src: manager.photoProfile || undefined, alt: manager.name || '', size: 'sm' }),
                h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, manager.name || 'Unknown'),
                    h('span', { class: 'text-xs text-gray-500' }, manager.employeeId || '')
                ])
            ])
        }
    },
    {
        accessorKey: 'customerName',
        header: sortableHeader('Pelanggan'),
        cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
            h('span', { class: 'font-medium' }, row.original.customerName ?? '-'),
            h('a', {
                href: `https://isx.nusa.net.id/customer.php?custId=${row.original.customerId}&pid=profile`,
                target: '_blank',
                class: 'text-xs text-blue-500 hover:underline'
            }, row.original.customerId)
        ])
    },
    {
        accessorKey: 'customerServiceAccount',
        header: sortableHeader('Layanan'),
        cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
            h('a', {
                href: `https://isx.nusa.net.id/v2/customer/service/${row.original.customerServiceId}/detail`,
                target: '_blank',
                class: 'font-medium text-blue-500 hover:underline'
            }, row.original.customerServiceAccount ?? '-'),
            withTooltip(row.original.serviceName, h('span', { class: 'text-xs text-gray-400 truncate max-w-[200px]' }, row.original.serviceName ?? '-'))
        ])
    },
    {
        accessorKey: 'type',
        header: sortableHeader('Tipe'),
        cell: ({ row }) => h('span', { class: 'text-sm font-semibold' }, row.original.type)
    },
    {
        accessorKey: 'category',
        header: sortableHeader('Kategori'),
        cell: ({ row }) => h('span', { class: 'text-sm text-gray-500 uppercase' }, row.original.category ?? '-')
    },
    {
        accessorKey: 'paidDate',
        header: sortableHeader('Tgl. Bayar'),
        cell: ({ row }) => h('div', { class: 'text-xs' }, row.original.paidDate ? formatDate(row.original.paidDate) : '-')
    },
    {
        accessorKey: 'subscription',
        header: sortableHeader('Subscription', 'right'),
        cell: ({ row }) => h('div', { class: 'text-right font-medium' }, formatCurrency(row.original.subscription))
    },
    {
        accessorKey: 'commission',
        header: sortableHeader('Komisi', 'right'),
        cell: ({ row }) => h('div', { class: 'text-right font-bold text-primary-600 dark:text-primary-400' }, formatCurrency(row.original.commission))
    },
    {
        accessorKey: 'referralType',
        header: sortableHeader('Tipe Referral', 'right'),
        cell: ({ row }) => h('div', { class: 'text-right font-medium' }, row.original.referralType ?? '-')
    },
    {
        accessorKey: 'referralFee',
        header: sortableHeader('Fee Referral', 'right'),
        cell: ({ row }) => h('div', { class: 'text-right font-medium' }, formatCurrency(row.original.referralFee))
    },
    {
        accessorKey: 'lateMonth',
        header: sortableHeader('Telat Bayar', 'center'),
        cell: ({ row }) => h('div', { class: ['text-center', row.original.lateMonth > 0 ? 'font-semibold text-red-500 dark:text-red-400' : 'text-gray-400'] }, row.original.lateMonth > 0 ? `${row.original.lateMonth} bln` : '–')
    },
    {
        accessorKey: 'isApproved',
        header: () => h('div', { class: 'flex items-center justify-center gap-1' }, [
            h('span', 'Approve Telat'),
            h(UTooltip, {
                text: rules.value
                    ? `Aktifkan untuk menghapus potongan telat bayar (${rules.value.penalties.latePerMonth}%/bulan) pada invoice ini.`
                    : 'Aktifkan untuk menghapus potongan telat bayar pada invoice ini.',
                delayDuration: 0
            }, () => h(UIcon, {
                name: 'i-lucide-info',
                class: 'size-4 text-gray-400 cursor-help'
            }))
        ]),
        cell: ({ row }) => {
            if (row.original.lateMonth <= 0) return null

            return h('div', { class: 'flex justify-center' }, [
                h(USwitch, {
                    modelValue: row.original.isApproved,
                    'onUpdate:modelValue': async (val: boolean) => {
                        try {
                            const response = await summaryService.approveInvoice(row.original.aiInvoice, { isApproved: val })
                            if (response && response.success) {
                                row.original.isApproved = val
                            }
                        } catch (error) {
                            toast.add({
                                title: 'Gagal',
                                description: 'Status approve gagal diperbarui. Coba lagi.',
                                color: 'error'
                            })
                        }
                    }
                })
            ])
        }
    },
    {
        id: 'actions',
        cell: ({ row }) => {
            return h(
                UDropdownMenu,
                {
                    content: { align: 'end' },
                    items: getRowItems(row),
                    'aria-label': 'Aksi invoice'
                },
                () =>
                    h(UButton, {
                        icon: 'i-lucide-ellipsis-vertical',
                        color: 'neutral',
                        variant: 'ghost',
                        'aria-label': 'Aksi invoice'
                    })
            )
        }
    }
]

const fetchSummary = async () => {
    setLoading(true)
    try {
        const response = await summaryService.invoiceSummary({ month: selectedMonth.value, year: year.value })
        summaryData.value = response?.data ?? []
    } finally {
        setLoading(false)
    }
}

onMounted(() => {
    fetchSummary()
})

watch([year, selectedMonth], () => {
    fetchSummary()
})
</script>
