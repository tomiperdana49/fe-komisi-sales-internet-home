<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Ringkasan Account Manager</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Komisi seluruh Account Manager untuk {{ selectedMonthLabel }} {{ year }}. Klik nama untuk melihat rinciannya.
                            <span v-if="ongoing" class="block text-sky-600 dark:text-sky-400">Periode masih berjalan sampai {{ shortDate(periodEndDate(year, selectedMonth)) }} — status pencapaian & komisi masih sementara.</span>
                        </p>
                    </div>
                    <USwitch v-model="hideValues" label="Sembunyikan nominal" />
                </div>

                <SummaryStats :stats="stats" />

                <UCard>
                    <template #header>
                        <UInput v-model="search" icon="i-lucide-search" placeholder="Cari nama atau ID karyawan..." class="w-full sm:w-72" />
                    </template>
                    <UTable
                        v-model:column-pinning="columnPinning"
                        sticky
                        :columns="columns"
                        :data="filteredData"
                        empty="Tidak ada data Account Manager untuk periode ini."
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
import type { SalesSummaryItem } from '~/types/summary'
import type { TableColumn } from '@nuxt/ui'
import type { GlossaryKey } from '~/composables/useGlossary'

definePageMeta({
    headerProps: { toolbar: true }
})

const NuxtLink = resolveComponent('NuxtLink')
const UAvatar = resolveComponent('UAvatar')

const { setLoading } = useLoading()
const { formatCurrency } = useFormat()
const { getAchievementTextClass } = useAchievementColor()
const { hintHeader } = useInvoiceColumns()
const summaryService = new SummaryService()

const { monthLabel, isPeriodOngoing, periodEndDate, shortDate } = usePeriodOptions()
const ongoing = computed(() => isPeriodOngoing(year.value, selectedMonth.value))
const glossaryTerms: GlossaryKey[] = ['activity', 'new', 'recurring', 'alat', 'setup', 'subscription', 'mrc', 'bonusBulanan', 'bonusKelebihanService', 'consistencyBonus']

const summaryData = ref<SalesSummaryItem[]>([])
const { year, month: selectedMonth } = useSelectedPeriod()
const hideValues = ref(true)
const search = ref('')
const columnPinning = ref({ left: ['name'], right: [] })

const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

const maskedCurrency = (value: number) => hideValues.value ? '•••' : formatCurrency(value)

const filteredData = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return summaryData.value
    return summaryData.value.filter(r => r.name.toLowerCase().includes(q) || r.employeeId.toLowerCase().includes(q))
})

const sum = (key: keyof SalesSummaryItem) => filteredData.value.reduce((acc, r) => acc + Number(r[key] ?? 0), 0)

// "Capai target" also matches "Tidak Capai target", so exclude that one explicitly.
const isOnTarget = (status: string) => {
    const s = status.toLowerCase()
    return s.includes('capai target') && !s.includes('tidak')
}

const stats = computed(() => {
    const rows = summaryData.value
    const onTarget = rows.filter(r => isOnTarget(r.achievementStatus)).length
    return [
        { label: 'Jumlah Account Manager', value: rows.length },
        { label: ongoing.value ? 'Sudah Capai Target' : 'Capai Target', value: `${onTarget} / ${rows.length}`, note: ongoing.value ? 'Sementara, periode berjalan' : undefined, class: 'text-green-600 dark:text-green-400' },
        { label: 'Total Layanan Baru', value: rows.reduce((a, r) => a + r.activityCount, 0) },
        { label: 'Total Komisi Dibayar', value: maskedCurrency(rows.reduce((a, r) => a + r.totalCommission, 0)), class: 'text-primary-600 dark:text-primary-400' }
    ]
})

type MoneyKey = 'newMrc' | 'newSubscription' | 'newCommission' | 'recurringSubscription' | 'recurringCommission' | 'otherSubscription'
    | 'otherCommission' | 'bonusBulanan' | 'bonusKelebihanService' | 'consistencyBonus' | 'totalCommission'

const moneyColumn = (key: MoneyKey, label: string, opts: { hint?: GlossaryKey; cellClass?: string } = {}): TableColumn<SalesSummaryItem> => ({
    accessorKey: key,
    header: () => h('div', { class: 'text-right whitespace-nowrap' }, opts.hint ? [hintHeader(label, opts.hint)()] : label),
    cell: ({ row }) => h('div', { class: ['text-right tabular-nums', opts.cellClass ?? 'font-medium'] }, maskedCurrency(row.original[key])),
    footer: () => h('div', { class: 'text-right font-bold tabular-nums' }, maskedCurrency(sum(key)))
})

const columns: TableColumn<SalesSummaryItem>[] = [
    {
        accessorKey: 'name',
        header: 'Account Manager',
        cell: ({ row }) => h(NuxtLink, { to: `/${row.original.employeeId}/sales`, class: 'flex items-center gap-3 group' }, () => [
            h(UAvatar, { src: row.original.photoProfile, alt: row.original.name, size: 'sm' }),
            h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.name),
                h('span', { class: 'text-xs text-gray-500' }, `${row.original.employeeId} · ${row.original.status ?? '-'}`)
            ])
        ]),
        footer: () => h('div', { class: 'font-bold' }, `Total (${filteredData.value.length} orang)`)
    },
    {
        accessorKey: 'achievementStatus',
        header: 'Status Pencapaian',
        cell: ({ row }) => ongoing.value
            ? h('div', { class: 'text-xs uppercase font-semibold text-sky-600 dark:text-sky-400', title: `Status final setelah periode berakhir. Sementara: ${row.original.achievementStatus}` }, 'Berjalan')
            : h('div', { class: getAchievementTextClass(row.original.achievementStatus) + ' text-xs uppercase' }, row.original.achievementStatus)
    },
    {
        accessorKey: 'activityCount',
        header: () => h('div', { class: 'text-center' }, [hintHeader('Layanan Baru', 'activity')()]),
        cell: ({ row }) => h('div', { class: 'text-center font-bold' }, row.original.activityCount),
        footer: () => h('div', { class: 'text-center font-bold' }, sum('activityCount'))
    },
    moneyColumn('totalCommission', 'Total Komisi', { cellClass: 'font-bold text-primary-600 dark:text-primary-400' }),
    moneyColumn('newCommission', 'Komisi New', { hint: 'new' }),
    moneyColumn('newSubscription', 'Subscription New', { hint: 'subscription' }),
    moneyColumn('newMrc', 'MRC New', { hint: 'mrc' }),
    moneyColumn('recurringCommission', 'Komisi Recurring', { hint: 'recurring' }),
    moneyColumn('recurringSubscription', 'Subscription Recurring'),
    moneyColumn('otherCommission', 'Komisi Alat & Setup'),
    moneyColumn('otherSubscription', 'Subscription Alat & Setup'),
    moneyColumn('bonusBulanan', 'Bonus Bulanan', { hint: 'bonusBulanan', cellClass: 'font-medium text-violet-600 dark:text-violet-400' }),
    moneyColumn('bonusKelebihanService', 'Bonus Kelebihan Service', { hint: 'bonusKelebihanService', cellClass: 'font-medium text-violet-600 dark:text-violet-400' }),
    moneyColumn('consistencyBonus', 'Bonus Konsistensi', { hint: 'consistencyBonus', cellClass: 'font-medium text-violet-600 dark:text-violet-400' })
]

const fetchSummary = async () => {
    setLoading(true)
    try {
        const response = await summaryService.salesSummary({ month: selectedMonth.value, year: year.value })
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
