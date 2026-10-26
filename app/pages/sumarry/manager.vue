<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Ringkasan Sales Manager</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Capaian tim dan komisi overriding tiap Sales Manager untuk {{ selectedMonthLabel }} {{ year }}. Klik nama untuk melihat rinciannya.
                            <span v-if="ongoing" class="block text-sky-600 dark:text-sky-400">Periode masih berjalan sampai {{ shortDate(periodEndDate(year, selectedMonth)) }} — status tim & komisi masih sementara.</span>
                        </p>
                    </div>
                </div>

                <SummaryStats :stats="stats" :active="statusFilter" @select="statusFilter = $event as StatusFilter" />

                <UCard>
                    <template #header>
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                            <UInput v-model="search" icon="i-lucide-search" placeholder="Cari nama atau ID manager..." class="w-full sm:w-72" />
                            <BranchFilter :branches="summaryData.map(r => r.branch)" />
                        </div>
                    </template>
                    <UTable
                        v-model:column-pinning="columnPinning"
                        sticky
                        :columns="columns"
                        :data="filteredData"
                        empty="Tidak ada data Sales Manager untuk periode ini."
                        class="flex-1 max-h-[800px]"
                    />
                </UCard>

                <GlossaryPanel :terms="glossaryTerms" />
            </div>
        </UContainer>
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { ManagerSummaryItem } from '~/types/summary'
import type { TableColumn } from '@nuxt/ui'
import type { GlossaryKey } from '~/composables/useGlossary'

definePageMeta({
    headerProps: { toolbar: true }
})

const NuxtLink = resolveComponent('NuxtLink')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')

const { setLoading } = useLoading()
const { formatCurrency } = useFormat()
const { hintHeader } = useInvoiceColumns()
const summaryService = new SummaryService()

const { monthLabel, isPeriodOngoing, periodEndDate, shortDate } = usePeriodOptions()
const ongoing = computed(() => isPeriodOngoing(year.value, selectedMonth.value))
const glossaryTerms: GlossaryKey[] = ['teamSize', 'finalTarget', 'teamAchievement', 'overrideNew', 'overrideRecurring', 'subscription', 'mrc']

const summaryData = ref<ManagerSummaryItem[]>([])
const { year, month: selectedMonth } = useSelectedPeriod()
const search = ref('')
const { byBranch } = useBranchFilter()
const branchData = computed(() => byBranch(summaryData.value, r => r.branch))
const columnPinning = ref({ left: ['name'], right: [] })

const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

// Most team new services first; ties keep the API's alphabetical order (sort is stable).
// Clicking a stat card narrows the table: every manager, or only those whose team is on target.
type StatusFilter = 'all' | 'on_target'
const statusFilter = ref<StatusFilter>('all')

const filteredData = computed(() => {
    const q = search.value.trim().toLowerCase()
    const byStatus = statusFilter.value === 'on_target' ? branchData.value.filter(r => r.isTargetAchieved) : branchData.value
    const rows = q
        ? byStatus.filter(r => r.name.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q))
        : byStatus
    return [...rows].sort((a, b) => b.activityCount - a.activityCount)
})

const sum = (key: keyof ManagerSummaryItem) => filteredData.value.reduce((acc, r) => acc + Number(r[key] ?? 0), 0)

const stats = computed(() => {
    const rows = branchData.value
    const onTarget = rows.filter(r => r.isTargetAchieved).length
    return [
        { label: 'Jumlah Sales Manager', value: rows.length, key: 'all' },
        { label: ongoing.value ? 'Tim Sudah Capai Target' : 'Tim Capai Target', value: `${onTarget} / ${rows.length}`, key: 'on_target', note: ongoing.value ? 'Sementara, periode berjalan' : undefined, class: 'text-green-600 dark:text-green-400' },
        { label: 'Total Layanan Baru Tim', value: rows.reduce((a, r) => a + r.activityCount, 0) },
        { label: 'Total Komisi Manager', value: formatCurrency(rows.reduce((a, r) => a + r.managerTotalCommission, 0)), class: 'text-primary-600 dark:text-primary-400' }
    ]
})

type MoneyKey = 'newMrc' | 'newSubscription' | 'newCommission' | 'recurringSubscription' | 'recurringCommission'
    | 'managerNewCommission' | 'managerRecurringCommission' | 'managerTotalCommission'

const moneyColumn = (key: MoneyKey, label: string, opts: { hint?: GlossaryKey; cellClass?: string } = {}): TableColumn<ManagerSummaryItem> => ({
    accessorKey: key,
    header: () => h('div', { class: 'text-right whitespace-nowrap' }, opts.hint ? [hintHeader(label, opts.hint)()] : label),
    cell: ({ row }) => h('div', { class: ['text-right tabular-nums', opts.cellClass ?? 'font-medium'] }, formatCurrency(row.original[key])),
    footer: () => h('div', { class: 'text-right font-bold tabular-nums' }, formatCurrency(sum(key)))
})

const columns: TableColumn<ManagerSummaryItem>[] = [
    {
        accessorKey: 'name',
        header: 'Sales Manager',
        cell: ({ row }) => h(NuxtLink, { to: `/${row.original.employeeId}/manager`, class: 'flex items-center gap-3 group' }, () => [
            h(UAvatar, { src: row.original.photoProfile, alt: row.original.name, size: 'sm' }),
            h('div', { class: 'flex flex-col text-left' }, [
                h('span', { class: 'font-semibold text-sm text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.name),
                h('span', { class: 'text-xs text-gray-500' }, row.original.employeeId)
            ])
        ]),
        footer: () => h('div', { class: 'font-bold' }, `Total (${filteredData.value.length} manager)`)
    },
    {
        accessorKey: 'isTargetAchieved',
        header: 'Status Tim',
        cell: ({ row }) => ongoing.value
            ? h(UBadge, { color: 'info', variant: 'subtle', title: `Sementara: ${row.original.isTargetAchieved ? 'Capai Target' : 'Belum Capai Target'}` }, () => 'Berjalan')
            : h(UBadge, { color: row.original.isTargetAchieved ? 'success' : 'error', variant: 'subtle' }, () => row.original.isTargetAchieved ? 'Capai Target' : 'Tidak Capai Target')
    },
    {
        accessorKey: 'totalCount',
        header: () => h('div', { class: 'text-center' }, [hintHeader('Jumlah AM', 'teamSize')()]),
        cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.original.totalCount),
        footer: () => h('div', { class: 'text-center font-bold' }, sum('totalCount'))
    },
    {
        accessorKey: 'activityCount',
        header: () => h('div', { class: 'text-center' }, 'Layanan Baru Tim'),
        cell: ({ row }) => h('div', { class: 'text-center font-bold' }, row.original.activityCount),
        footer: () => h('div', { class: 'text-center font-bold' }, sum('activityCount'))
    },
    {
        accessorKey: 'achievementPercentage',
        header: () => h('div', { class: 'text-center' }, [hintHeader('Capaian', 'teamAchievement')()]),
        cell: ({ row }) => h('div', { class: 'text-center font-bold text-sm' }, `${Math.round(row.original.achievementPercentage)}%`)
    },
    moneyColumn('managerTotalCommission', 'Total Komisi Manager', { cellClass: 'font-bold text-primary-700 dark:text-primary-300' }),
    moneyColumn('managerNewCommission', 'Overriding New', { hint: 'overrideNew', cellClass: 'font-semibold text-primary-600 dark:text-primary-400' }),
    moneyColumn('managerRecurringCommission', 'Overriding Recurring', { hint: 'overrideRecurring', cellClass: 'font-semibold text-primary-600 dark:text-primary-400' }),
    moneyColumn('newCommission', 'Komisi New Tim'),
    moneyColumn('newSubscription', 'Subscription New Tim', { hint: 'subscription' }),
    moneyColumn('newMrc', 'MRC New Tim', { hint: 'mrc' }),
    moneyColumn('recurringCommission', 'Komisi Recurring Tim'),
    moneyColumn('recurringSubscription', 'Subscription Recurring Tim')
]

const fetchSummary = async () => {
    setLoading(true)
    try {
        const response = await summaryService.managerSummary({ month: selectedMonth.value, year: year.value })
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
