<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Daftar Churn</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Pelanggan yang berhenti kurang dari 1 tahun sejak registrasi, periode {{ selectedMonthLabel }} {{ year }}.
                        Churn yang <strong>belum di-approve</strong> memotong komisi & pencapaian New sales. Approve untuk membebaskannya dari potongan.
                    </p>
                </div>

                <SummaryStats :stats="stats" />

                <UCard>
                    <template #header>
                        <UInput v-model="globalFilter" icon="i-heroicons-magnifying-glass" placeholder="Cari pelanggan, layanan, sales..." class="w-full sm:w-72" />
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
                        empty="Tidak ada churn untuk periode ini."
                        class="flex-1 max-h-[800px]"
                    />

                    <template #footer>
                        <TablePaginationFooter :table-api="table?.tableApi" />
                    </template>
                </UCard>
            </div>
        </UContainer>

        <ApproveChurnModal v-model:open="isApproveModalOpen" :churn="approvingChurn" @success="onApproved" />
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent, ref, onMounted, watch, computed, useTemplateRef } from 'vue'
import { getPaginationRowModel } from '@tanstack/vue-table'
import { SummaryService } from '~/services/summary-service'
import type { ChurnSummaryItem } from '~/types/summary'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
    headerProps: { toolbar: true }
})

const UAvatar = resolveComponent('UAvatar')
const NuxtLink = resolveComponent('NuxtLink')
const { sortableHeader } = useSortableHeader()
const USwitch = resolveComponent('USwitch')
const UIcon = resolveComponent('UIcon')
const UTooltip = resolveComponent('UTooltip')
const { withTooltip } = useTextTooltip()

const { setLoading } = useLoading()
const { formatCurrency, formatDate } = useFormat()
const toast = useToast()
const summaryService = new SummaryService()

const table = useTemplateRef('table')
const summaryData = ref<ChurnSummaryItem[]>([])
const { year, month: selectedMonth } = useSelectedPeriod()

const pagination = ref({
    pageIndex: 0,
    pageSize: 100
})
const sorting = ref([{ id: 'no', desc: false }])
const globalFilter = ref('')

const { monthLabel } = usePeriodOptions()

const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

// Waiving needs a reason, so switching on opens the reason form; switching off reinstates the cut right away.
const isApproveModalOpen = ref(false)
const approvingChurn = ref<ChurnSummaryItem | null>(null)
const authState = useAuth().state
const onApproved = (note: string) => {
    const row = approvingChurn.value
    if (!row) return
    row.is_approved = true
    row.approval_note = note
    row.approved_by = authState.user?.employee_id ?? null
    row.approved_by_name = authState.user?.name ?? null
    row.approved_at = new Date().toISOString()
}
const revokeApproval = async (row: ChurnSummaryItem) => {
    try {
        const response = await summaryService.approveChurn(row.customer_service_id, { isApproved: false })
        if (response && response.success) {
            row.is_approved = false
            row.approval_note = null
            row.approved_by = null
            row.approved_by_name = null
            row.approved_at = null
        }
    } catch (error) {
        toast.add({ title: 'Gagal', description: 'Status approve gagal diperbarui. Coba lagi.', color: 'error' })
    }
}

const stats = computed(() => {
    const rows = summaryData.value
    const pending = rows.filter(r => !r.is_approved)
    return [
        { label: 'Jumlah Churn', value: rows.length },
        { label: 'Memotong Komisi', value: pending.length, note: 'Belum di-approve', class: pending.length ? 'text-red-600 dark:text-red-400' : undefined },
        { label: 'Dibebaskan', value: rows.length - pending.length, note: 'Sudah di-approve', class: 'text-green-600 dark:text-green-400' },
        { label: 'Subscription Hilang', value: formatCurrency(pending.reduce((a, r) => a + (r.price ?? 0), 0)), note: 'Dari churn yang memotong komisi' }
    ]
})

const columns: TableColumn<ChurnSummaryItem>[] = [
    {
        id: 'no',
        header: '#',
        cell: ({ row }) => h('div', { class: 'text-center text-xs' }, row.index + 1)
    },
    {
        id: 'employee',
        accessorFn: (row) => `${row.employee_name || 'Customer Relation Officer'} ${row.employee_eid || ''}`,
        header: sortableHeader('Account Manager'),
        sortingFn: (rowA, rowB) => {
            const nameA = rowA.original.employee_name || 'Customer Relation Officer'
            const nameB = rowB.original.employee_name || 'Customer Relation Officer'
            return nameA.localeCompare(nameB)
        },
        cell: ({ row }) => {
            const { employee_eid, employee_name, employee_photo } = row.original
            if (!employee_eid) return h('div', { class: 'text-gray-400 italic' }, 'Customer Relation Officer')

            return h(NuxtLink, {
                to: `/${employee_eid}/sales`,
                class: 'flex items-center gap-3 group'
            }, [
                h(UAvatar, { src: employee_photo || undefined, alt: employee_name || '', size: 'sm' }),
                h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, employee_name || 'Unknown'),
                    h('span', { class: 'text-xs text-gray-500' }, employee_eid || '')
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
            withTooltip(row.original.service_name, h('span', { class: 'text-xs text-gray-400 truncate max-w-[200px]' }, row.original.service_name ?? '-'))
        ])
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
        accessorKey: 'period',
        header: 'Lama Kontrak',
        cell: ({ row }) => h('div', { class: 'text-xs' }, `${row.original.period} bln`)
    },
    {
        accessorKey: 'price',
        header: sortableHeader('Subscription', 'right'),
        cell: ({ row }) => h('div', { class: 'text-right font-medium' }, formatCurrency(row.original.price ?? 0))
    },
    {
        accessorKey: 'reason',
        header: 'Alasan Berhenti',
        cell: ({ row }) => h('div', { class: 'text-xs italic text-gray-500 whitespace-normal min-w-[200px] max-w-[400px]', title: row.original.reason ?? '' }, row.original.reason ?? '-')
    },
    {
        accessorKey: 'is_approved',
        header: () => h('div', { class: 'flex items-center justify-center gap-1' }, [
            h('span', 'Bebaskan'),
            h(UTooltip, {
                text: 'Aktifkan (approve) agar churn ini TIDAK memotong komisi dan pencapaian New sales.',
                delayDuration: 0
            }, () => h(UIcon, {
                name: 'i-lucide-info',
                class: 'size-4 text-gray-400 cursor-help'
            }))
        ]),
        cell: ({ row }) => h('div', { class: 'flex justify-center' }, [
            h(USwitch, {
                modelValue: row.original.is_approved,
                'onUpdate:modelValue': (val: boolean) => {
                    if (val) {
                        approvingChurn.value = row.original
                        isApproveModalOpen.value = true
                    } else {
                        revokeApproval(row.original)
                    }
                }
            })
        ])
    },
    {
        accessorKey: 'approval_note',
        header: 'Alasan Dibebaskan',
        cell: ({ row }) => {
            const r = row.original
            if (!r.is_approved) return h('span', { class: 'text-xs text-gray-400 italic' }, '-')
            return h('div', { class: 'flex flex-col min-w-[180px] max-w-[300px]' }, [
                r.approval_note
                    ? h('span', { class: 'text-xs text-gray-700 dark:text-gray-200 whitespace-normal' }, r.approval_note)
                    : h('span', { class: 'text-xs text-gray-400 italic' }, 'Alasan belum dicatat'),
                r.approved_by
                    ? h('span', { class: 'text-[10px] text-gray-400 mt-0.5' }, [
                        r.approved_by_name ?? r.approved_by,
                        r.approved_at ? ` · ${new Date(r.approved_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}` : ''
                    ].join(''))
                    : null
            ])
        }
    }
]

const fetchSummary = async () => {
    setLoading(true)
    try {
        const response = await summaryService.churnSummary({ month: selectedMonth.value, year: year.value })
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
