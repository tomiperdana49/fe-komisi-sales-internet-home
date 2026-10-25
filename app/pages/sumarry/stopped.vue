<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Layanan NA</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Semua layanan yang berhenti (NA) di NIS pada periode {{ selectedMonthLabel }} {{ year }}, diambil langsung dari NIS.
                        Kolom <strong>Status</strong> menunjukkan apakah layanan dihitung churn menurut Aturan Komisi periode ini, dan jika tidak, alasannya.
                    </p>
                </div>

                <UAlert
                    v-if="closed"
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-lock"
                    title="Periode ini sudah ditutup"
                    :description="`${selectedClosing ? `${describeClosing(selectedClosing)}. ` : ''}Churn mengikuti Daftar Churn yang dibekukan saat periode ditutup. Kolom Status tetap menyebut bila aturan sekarang menilai berbeda.`"
                />

                <SummaryStats :stats="stats" :active="statusFilter" @select="statusFilter = $event as StatusFilter" />

                <UCard>
                    <template #header>
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                            <UInput v-model="globalFilter" icon="i-heroicons-magnifying-glass" placeholder="Cari pelanggan, layanan, sales..." class="w-full sm:w-72" />
                            <USelect v-model="exclusionFilter" :items="exclusionOptions" class="w-full sm:w-64" />
                            <BranchFilter :branches="summaryData.map(r => r.employee_branch)" />
                        </div>
                    </template>

                    <UTable
                        ref="table"
                        sticky
                        v-model:pagination="pagination"
                        v-model:global-filter="globalFilter"
                        v-model:sorting="sorting"
                        :columns="columns"
                        :data="tableData"
                        :pagination-options="{
                            getPaginationRowModel: getPaginationRowModel()
                        }"
                        empty="Tidak ada layanan NA untuk periode ini."
                        class="flex-1 max-h-[800px]"
                    />

                    <template #footer>
                        <TablePaginationFooter :table-api="table?.tableApi" />
                    </template>
                </UCard>
            </div>
        </UContainer>
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent, ref, onMounted, watch, computed, useTemplateRef } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { SummaryService } from '~/services/summary-service'
import type { ChurnExclusion, StoppedServiceItem, StoppedServicesResponseData } from '~/types/summary'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
    headerProps: { toolbar: true }
})

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const NuxtLink = resolveComponent('NuxtLink')
const { sortableHeader } = useSortableHeader()
const { withTooltip } = useTextTooltip()

const { setLoading } = useLoading()
const { formatCurrency, formatDate } = useFormat()
const summaryService = new SummaryService()

const table = useTemplateRef('table')
const summaryData = ref<StoppedServiceItem[]>([])
// Churn list rows counted in this period whose service didn't stop in it (churn susulan, or
// changed in NIS after closing): listed too, so both pages add up row for row.
const carriedData = ref<StoppedServicesResponseData['data']['carried']>([])
const carriedRows = computed<StoppedServiceItem[]>(() => carriedData.value.map(r => ({
    ...r,
    customer_branch: null,
    exclusion: null,
    in_churn_list: true,
    carried: true
})))
// A closed period's Churn list is frozen, so it — not today's rules — decides what was a churn.
const closed = ref(false)
const { selectedClosing, describeClosing } = usePeriodClosings()
const isChurn = (r: StoppedServiceItem) => r.carried || (closed.value ? r.in_churn_list : r.exclusion === null)
const { byBranch } = useBranchFilter()
const branchData = computed(() => byBranch([...summaryData.value, ...carriedRows.value], r => r.employee_branch))
const { year, month: selectedMonth } = useSelectedPeriod()
const { monthLabel } = usePeriodOptions()
const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

// Same order the churn rules are checked in; a service shows the first one it fails.
const EXCLUSION_LABELS: Record<ChurnExclusion, string> = {
    branch: 'Di luar cabang komisi',
    product: 'Produk tidak dihitung churn',
    over_year: 'Berhenti > 1 tahun sejak registrasi',
    no_invoice: 'Tidak ada invoice aktif',
    paid_12_months: 'Sudah bayar 12 bulan',
    termination_paid: 'Invoice terminasi sudah dibayar',
    close_reason: 'Alasan tutup bukan churn'
}

type StatusFilter = 'all' | 'churn' | 'not_churn'
const statusFilter = ref<StatusFilter>('all')
const exclusionFilter = ref<ChurnExclusion | 'all'>('all')
const exclusionOptions = computed(() => [
    { label: 'Semua alasan', value: 'all' },
    ...(Object.keys(EXCLUSION_LABELS) as ChurnExclusion[]).map(key => ({
        label: `${EXCLUSION_LABELS[key]} (${branchData.value.filter(r => r.exclusion === key).length})`,
        value: key
    }))
])

const tableData = computed(() => branchData.value.filter((r) => {
    if (statusFilter.value === 'churn' && !isChurn(r)) return false
    if (statusFilter.value === 'not_churn' && isChurn(r)) return false
    return exclusionFilter.value === 'all' || r.exclusion === exclusionFilter.value
}))

const pagination = ref({
    pageIndex: 0,
    pageSize: 100
})
const sorting = ref([{ id: 'no', desc: false }])
const globalFilter = ref('')

watch([statusFilter, exclusionFilter, globalFilter], () => { pagination.value.pageIndex = 0 })

const stats = computed(() => {
    const stopped = branchData.value.filter(r => !r.carried)
    const carriedCount = branchData.value.length - stopped.length
    const churnCount = branchData.value.filter(isChurn).length
    return [
        { label: 'Total Layanan NA', value: stopped.length, note: 'Semua yang berhenti di NIS', key: 'all' },
        {
            label: 'Dihitung Churn',
            value: churnCount,
            note: carriedCount
                ? `Termasuk ${carriedCount} churn susulan / di luar layanan NA periode ini. Sama dengan Jumlah Churn di halaman Churn`
                : closed.value ? 'Sesuai Daftar Churn saat periode ditutup' : 'Memenuhi aturan churn',
            key: 'churn',
            class: 'text-red-600 dark:text-red-400'
        },
        { label: 'Bukan Churn', value: stopped.filter(r => !isChurn(r)).length, note: 'Lihat kolom Status', key: 'not_churn', class: 'text-gray-500 dark:text-gray-400' },
        { label: 'Subscription Berhenti', value: formatCurrency(stopped.reduce((a, r) => a + Number(r.price ?? 0), 0)), note: 'Dari semua layanan NA' }
    ]
})

const columns: TableColumn<StoppedServiceItem>[] = [
    {
        id: 'no',
        header: '#',
        cell: ({ row }) => h('div', { class: 'text-center text-xs' }, row.index + 1)
    },
    {
        id: 'status',
        accessorFn: row => [
            isChurn(row) ? (row.is_approved ? 'Churn Dibebaskan' : 'Churn') : 'Bukan churn',
            row.carried ? 'Churn susulan' : '',
            row.exclusion ? EXCLUSION_LABELS[row.exclusion] : ''
        ].join(' '),
        header: sortableHeader('Status'),
        cell: ({ row }) => {
            const { exclusion, in_churn_list, is_approved, carried, deduct_date, unregistration_date } = row.original
            const badge = !isChurn(row.original)
                ? h(UBadge, { color: 'neutral', variant: 'subtle', size: 'sm' }, () => 'Bukan churn')
                : is_approved
                    ? h(UBadge, { color: 'success', variant: 'subtle', size: 'sm' }, () => 'Churn · Dibebaskan')
                    : h(UBadge, { color: 'error', variant: 'subtle', size: 'sm' }, () => 'Churn')

            let detail: string
            if (carried && deduct_date) {
                detail = `Churn susulan: berhenti ${unregistration_date ? formatDate(unregistration_date) : '-'}, dipotong di periode ini.`
            } else if (carried) {
                detail = 'Ada di Daftar Churn, tapi di NIS sekarang tidak berhenti (NA) di periode ini.'
            } else if (closed.value && in_churn_list && exclusion) {
                detail = `Menurut aturan sekarang: ${EXCLUSION_LABELS[exclusion]}. Tetap churn karena periode sudah ditutup.`
            } else if (closed.value && !in_churn_list && !exclusion) {
                detail = 'Memenuhi aturan sekarang, tapi tidak ada di Daftar Churn saat periode ditutup.'
            } else if (exclusion) {
                detail = EXCLUSION_LABELS[exclusion]
            } else {
                detail = in_churn_list ? 'Ada di Daftar Churn' : 'Belum masuk Daftar Churn (tunggu job per jam)'
            }
            return h('div', { class: 'flex flex-col items-start gap-1 min-w-[170px] max-w-[260px]' }, [
                badge,
                h('span', { class: 'text-xs text-gray-500 whitespace-normal' }, detail)
            ])
        }
    },
    {
        id: 'employee',
        accessorFn: row => `${row.employee_name || row.sales_id || ''} ${row.sales_id || ''}`,
        header: sortableHeader('Account Manager'),
        cell: ({ row }) => {
            const { sales_id, employee_name, employee_photo } = row.original
            if (!employee_name) return h('div', { class: 'text-gray-400 italic text-xs' }, sales_id || '-')

            return h(NuxtLink, {
                to: `/${sales_id}/sales`,
                class: 'flex items-center gap-3 group'
            }, [
                h(UAvatar, { src: employee_photo || undefined, alt: employee_name, size: 'sm' }),
                h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, employee_name),
                    h('span', { class: 'text-xs text-gray-500' }, sales_id)
                ])
            ])
        }
    },
    {
        accessorKey: 'customer_name',
        header: sortableHeader('Pelanggan'),
        cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
            h('span', { class: 'font-medium' }, row.original.customer_name ?? '-'),
            h('a', {
                href: `https://isx.nusa.net.id/customer.php?custId=${row.original.customer_id}&pid=profile`,
                target: '_blank',
                class: 'text-xs text-blue-500 hover:underline'
            }, row.original.customer_id)
        ])
    },
    {
        accessorKey: 'customer_service_account',
        header: sortableHeader('Layanan'),
        cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
            h('a', {
                href: `https://isx.nusa.net.id/v2/customer/service/${row.original.customer_service_id}/detail`,
                target: '_blank',
                class: 'font-medium text-blue-500 hover:underline'
            }, row.original.customer_service_account ?? '-'),
            withTooltip(row.original.service_name, h('span', { class: 'text-xs text-gray-400 truncate max-w-[200px]' }, `${row.original.service_id ?? '-'} · ${row.original.service_name ?? '-'}`))
        ])
    },
    {
        accessorKey: 'customer_branch',
        header: sortableHeader('Cabang'),
        cell: ({ row }) => h('div', { class: 'text-xs' }, row.original.customer_branch ?? '-')
    },
    {
        accessorKey: 'registration_date',
        header: sortableHeader('Tgl. Registrasi'),
        cell: ({ row }) => h('div', { class: 'text-xs' }, row.original.registration_date ? formatDate(row.original.registration_date) : '-')
    },
    {
        accessorKey: 'unregistration_date',
        header: sortableHeader('Tgl. Berhenti'),
        cell: ({ row }) => h('div', { class: 'text-xs' }, row.original.unregistration_date ? formatDate(row.original.unregistration_date) : '-')
    },
    {
        accessorKey: 'price',
        header: sortableHeader('Subscription', 'right'),
        cell: ({ row }) => h('div', { class: 'text-right font-medium' }, formatCurrency(Number(row.original.price ?? 0)))
    },
    {
        accessorKey: 'close_reason',
        header: 'Reason Close',
        cell: ({ row }) => h('div', { class: 'flex flex-col min-w-[120px]' }, [
            h('span', { class: 'text-xs whitespace-normal' }, row.original.close_reason ?? '-'),
            h('span', { class: 'text-[10px] text-gray-400' }, row.original.close_status ?? '')
        ])
    },
    {
        accessorKey: 'reason',
        header: 'Alasan Berhenti',
        cell: ({ row }) => h('div', { class: 'text-xs italic text-gray-500 whitespace-normal min-w-[200px] max-w-[400px]', title: row.original.reason ?? '' }, row.original.reason ?? '-')
    }
]

const fetchSummary = async () => {
    setLoading(true)
    try {
        const response = await summaryService.stoppedServices({ month: selectedMonth.value, year: year.value })
        summaryData.value = response?.data?.services ?? []
        carriedData.value = response?.data?.carried ?? []
        closed.value = response?.data?.closed ?? false
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
