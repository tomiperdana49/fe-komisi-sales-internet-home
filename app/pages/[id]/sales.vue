<template>
    <UContainer>
        <HeroBackground />
        <CommissionHeader
            :employee="employee"
            v-model:year="year"
            :year-items="yearItems"
            subtitle="Rincian komisi, bonus, dan transaksi per bulan"
        >
            <template #controls>
                <USelectMenu v-model="selectedMonth" value-key="id" :items="viewableMonths(year)" class="w-36" />
            </template>
        </CommissionHeader>

        <div class="py-2 grid grid-cols-1 gap-4">
            <UPageCard v-if="periodData">
                <template #default>
                    <!-- Total & cara menghitungnya -->
                    <div class="border-b border-gray-100 dark:border-gray-800 pb-4 md:pb-6 space-y-4">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Periode Perhitungan</p>
                                <p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                    {{ formatDate(periodData.startDate) }} – {{ formatDate(periodData.endDate) }}
                                </p>
                            </div>
                            <div class="md:text-right">
                                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Komisi Diterima{{ periodData && isOngoingUntil(periodData.endDate) ? ' (sementara)' : '' }}</p>
                                <p class="text-3xl md:text-4xl font-bold text-primary-500 dark:text-primary-400 tabular-nums">
                                    {{ formatCurrency(grandTotal) }}
                                </p>
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2 text-sm">
                            <template v-for="(part, idx) in totalParts" :key="part.label">
                                <span v-if="idx > 0" class="text-gray-400 font-semibold">{{ part.sign }}</span>
                                <span
                                    :class="['inline-flex flex-col px-3 py-1.5 rounded-lg border',
                                        part.sign === '−' ? 'border-red-100 dark:border-red-900/40 bg-red-50 dark:bg-red-950/20' : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50']"
                                >
                                    <span class="text-[11px] text-gray-500 dark:text-gray-400">{{ part.label }}</span>
                                    <span :class="['font-semibold tabular-nums', part.sign === '−' ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white']">
                                        {{ formatCurrency(part.value) }}
                                    </span>
                                </span>
                            </template>
                            <span class="text-gray-400 font-semibold">=</span>
                            <span class="inline-flex flex-col px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20">
                                <span class="text-[11px] text-primary-700 dark:text-primary-300">Total</span>
                                <span class="font-bold tabular-nums text-primary-600 dark:text-primary-400">{{ formatCurrency(grandTotal) }}</span>
                            </span>
                        </div>
                    </div>

                    <div class="mt-4 md:mt-6">
                        <PersonalSalesDetail :data="periodData" :churn-data="churnData" />
                    </div>
                </template>
            </UPageCard>
        </div>

        <div class="py-2">
            <UCard>
                <div class="mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Daftar Transaksi</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Invoice yang dihitung komisinya pada periode ini, dikelompokkan per kategori.</p>
                    </div>
                    <UInput v-model="transactionSearch" icon="i-lucide-search" placeholder="Cari pelanggan, layanan, no. invoice..." class="w-full sm:w-80" />
                </div>
                <UTabs :items="tabItems" class="w-full">
                    <template #content="{ item }">
                        <p v-if="item.key !== 'churn'" class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 my-2">
                            <span class="inline-block size-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700" />
                            Baris kuning = invoice ini menghasilkan komisi Rp 0.
                        </p>
                        <UTable
                            sticky
                            :data="getTabData(item.key)"
                            :columns="getColumns(item.key)"
                            :empty="transactionSearch.trim() ? `Tidak ada transaksi ${item.name} yang cocok dengan “${transactionSearch.trim()}”.` : `Tidak ada transaksi ${item.name} pada periode ini.`"
                            class="flex-1 max-h-[800px] [&_tr:has(.commission-zero)]:bg-yellow-50 dark:[&_tr:has(.commission-zero)]:bg-yellow-950/20"
                        />
                    </template>
                </UTabs>
            </UCard>
        </div>

        <div class="py-2">
            <GlossaryPanel :terms="glossaryTerms" />
        </div>

    </UContainer>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { CommissionService } from '~/services/commission-service'
import { EmployeeService } from '~/services/employee-service'
import { InvoiceService } from '~/services/invoice-service'
import type { Employee } from '~/types/employee'
import type { TableColumn } from '@nuxt/ui'
import type { GlossaryKey } from '~/composables/useGlossary'
import type { ChurnRow, CommissionLineItem, SalesCommissionData } from '~/types/sales'

const UBadge = resolveComponent('UBadge')
const { withTooltip } = useTextTooltip()

const { setLoading } = useLoading()
const route = useRoute()
const commissionService = new CommissionService()
const employeeService = new EmployeeService()
const invoiceService = new InvoiceService()

const { viewableMonths, yearItems, isOngoingUntil } = usePeriodOptions()

const employee = ref<Employee>()
const { year, month: selectedMonth } = useSelectedPeriod()

const periodData = ref<SalesCommissionData | null>(null)
const invoiceItems = ref<CommissionLineItem[]>([])
const churnData = ref<ChurnRow[]>([])

const { formatCurrency, formatDate } = useFormat()

const tabItems = computed(() => {
    const byType = (key: string) => getTabData(key).length
    const tab = (name: string, key: string, count: number) => ({ label: `${name} (${count})`, name, key })
    return [
        tab('New', 'new', byType('new')),
        tab('Recurring', 'recurring', byType('recurring')),
        tab('Prorate', 'prorate', byType('prorate')),
        tab('Upgrade', 'upgrade', byType('upgrade')),
        tab('Alat', 'alat', byType('alat')),
        tab('Setup', 'setup', byType('setup')),
        tab('Churn', 'churn', getTabData('churn').length)
    ]
})

const grandTotal = computed(() => {
    const d = periodData.value
    if (!d) return 0
    return d.total.commission + d.bonusBulanan + d.bonusKelebihanService + d.consistencyBonus
})

// total.commission is already net of churn, so add the deduction back to show the gross figure it came from.
const totalParts = computed(() => {
    const d = periodData.value
    if (!d) return []
    const parts = [
        { label: 'Komisi Penjualan', value: d.total.commission + d.deduction.commission, sign: '' },
        { label: 'Potongan Churn', value: d.deduction.commission, sign: '−' },
        { label: 'Bonus Bulanan', value: d.bonusBulanan, sign: '+' },
        { label: 'Bonus Kelebihan Service', value: d.bonusKelebihanService, sign: '+' },
        { label: 'Bonus Konsistensi', value: d.consistencyBonus, sign: '+' }
    ]
    return parts.filter((p, i) => i === 0 || p.value !== 0)
})

const { hintHeader, invoiceColumns, matchesSearch } = useInvoiceColumns()
const transactionSearch = ref('')
const glossaryTerms: GlossaryKey[] = ['new', 'recurring', 'prorate', 'upgrade', 'alat', 'setup', 'churn', 'subscription', 'mrc', 'contractMonths', 'lateMonth', 'commission', 'activity', 'bonusBulanan', 'bonusKelebihanService', 'consistencyBonus']

const getTabData = (key: string): any[] => {
    const rows: any[] = key === 'churn' ? churnData.value : invoiceItems.value.filter(i => i.type === key)
    return rows.filter(r => matchesSearch(r, transactionSearch.value))
}

// Footer totals: the period's official figures (net of churn) unless a search narrows the rows,
// in which case the footer sums just the rows shown.
const boxTotal = (key: string, field: 'subscription' | 'mrc' | 'commission') => transactionSearch.value.trim()
    ? getTabData(key).reduce((sum, r) => sum + Number(r[field] ?? 0), 0)
    : periodData.value?.breakdown[key as keyof typeof periodData.value.breakdown]?.[field] ?? 0

const getColumns = (key: string): TableColumn<any>[] => {
    if (key === 'churn') {
        return [
            {
                header: 'Layanan',
                cell: ({ row }) => h('div', { class: 'flex flex-col min-w-[120px]' }, [
                    h('a', { href: `https://isx.nusa.net.id/v2/customer/service/${row.original.customer_service_id}/detail`, target: '_blank', class: 'text-blue-500 hover:underline font-semibold text-sm break-all' }, row.original.customer_service_account),
                    withTooltip(row.original.service_name, h('span', { class: 'text-xs text-gray-500 dark:text-gray-400 whitespace-normal break-words line-clamp-2' }, row.original.service_name ?? ''))
                ])
            },
            {
                header: 'Pelanggan',
                cell: ({ row }) => h('div', { class: 'flex flex-col min-w-[120px]' }, [
                    h('a', { href: `https://isx.nusa.net.id/customer.php?custId=${row.original.customer_id}&pid=profile`, target: '_blank', class: 'text-blue-500 hover:underline font-semibold text-sm' }, row.original.customer_id),
                    withTooltip(row.original.customer_name, h('span', { class: 'text-xs text-gray-500 dark:text-gray-400 whitespace-normal break-words line-clamp-2' }, row.original.customer_name ?? ''))
                ])
            },
            {
                accessorKey: 'reason',
                header: 'Alasan Berhenti',
                cell: ({ row }) => withTooltip(row.original.reason, h('span', { class: 'text-xs italic text-gray-500 dark:text-gray-400 whitespace-normal line-clamp-2 min-w-[150px]' }, row.original.reason ?? ''))
            },
            {
                header: 'Lama Berlangganan',
                cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'text-sm font-medium' }, `${row.original.period} bulan`),
                    h('span', { class: 'text-[10px] text-gray-400 dark:text-gray-500' }, `${formatDate(String(row.original.registration_date).slice(0, 10))} - ${formatDate(String(row.original.unregistration_date).slice(0, 10))}`)
                ])
            },
            { id: 'price', header: hintHeader('Subscription', 'subscription'), cell: ({ row }) => h('span', { class: 'font-medium' }, formatCurrency(row.original.price ?? 0)) },
            { id: 'mrc', header: hintHeader('MRC', 'mrc'), cell: ({ row }) => h('span', { class: 'font-medium' }, formatCurrency(row.original.mrc)) },
            {
                id: 'commission',
                header: hintHeader('Potongan Komisi', 'churn'),
                // A waived churn cuts nothing: show the would-be amount struck through, with the admin's reason.
                cell: ({ row }) => row.original.is_approved
                    ? h('div', { class: 'flex flex-col items-end max-w-[220px]' }, [
                        h(UBadge, { color: 'success', variant: 'subtle', size: 'sm', class: 'mb-1' }, () => 'Dibebaskan'),
                        h('span', { class: 'text-sm text-gray-400 line-through' }, formatCurrency(row.original.commission)),
                        row.original.approval_note
                            ? h('span', { class: 'text-[11px] text-gray-500 dark:text-gray-400 text-right whitespace-normal mt-1' }, row.original.approval_note)
                            : null
                    ])
                    : h('div', { class: 'flex flex-col items-end' }, [
                        h('span', { class: 'text-xs font-medium bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 mb-1' }, `${row.original.commissionPercentage}%`),
                        h('span', { class: 'text-sm font-bold text-gray-900 dark:text-white' }, formatCurrency(row.original.commission))
                    ])
            }
        ]
    }

    return invoiceColumns(field => boxTotal(key, field))
}

// --- Data fetching ---
const fetchPeriodData = async () => {
    const response = await commissionService.salesCommission(route.params.id as string, { month: selectedMonth.value, year: year.value })
    periodData.value = response.data
}

const fetchInvoiceData = async () => {
    const response = await invoiceService.getInvoiceSales(route.params.id as string, { month: selectedMonth.value, year: year.value })
    invoiceItems.value = response.data.data
}

const fetchChurnData = async () => {
    const response = await commissionService.salesChurn(route.params.id as string, { month: selectedMonth.value, year: year.value })
    churnData.value = response.data
}

const fetchMonthData = () => Promise.all([fetchPeriodData(), fetchInvoiceData(), fetchChurnData()])

const initData = async () => {
    setLoading(true)
    try {
        const employeeData = await employeeService.getEmployee(route.params.id as string)
        employee.value = employeeData.data
        await fetchMonthData()
    } finally {
        setLoading(false)
    }
}

watch(year, () => {
    fetchMonthData()
})

watch(selectedMonth, () => {
    fetchMonthData()
})

initData()
</script>
