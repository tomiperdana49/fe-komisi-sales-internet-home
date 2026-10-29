<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Bonus Konsistensi</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Bonus Konsistensi {{ selectedMonthLabel }} {{ year }}. Kolom Otomatis dihitung dari Aturan Komisi (bila diaktifkan); bonus manual ditentukan admin dan menggantikan bonus otomatis di bulan itu.
                        Keduanya langsung ditambahkan ke Total Komisi sales periode ini.
                    </p>
                </div>

                <ClosedPeriodNotice />

                <SummaryStats :stats="stats" :active="statusFilter" @select="statusFilter = $event as StatusFilter" />

                <UCard>
                    <template #header>
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                            <UInput v-model="globalFilter" icon="i-heroicons-magnifying-glass" placeholder="Cari nama atau ID karyawan..." class="w-full sm:w-72" />
                            <BranchFilter :branches="summaryData.map(r => r.branch)" />
                        </div>
                    </template>
                    <UTable sticky :columns="columns" :data="filteredData" empty="Belum ada Account Manager yang terdata untuk periode ini." class="flex-1 max-h-[800px]" />
                </UCard>
            </div>
        </UContainer>

        <GrantConsistencyBonusModal
            v-model:open="isGrantModalOpen"
            :employee-id="selectedEmployeeId"
            :employee-name="selectedEmployeeName"
            :existing-amount="selectedExistingAmount"
            :existing-note="selectedExistingNote"
            :existing-months="selectedExistingMonths"
            :existing-service-count="selectedExistingServiceCount"
            :existing-testimonial-link="selectedExistingTestimonialLink"
            :month="selectedMonth"
            :year="year"
            @success="fetchSummary"
        />

        <ConfirmModal
            v-model:open="isRevokeModalOpen"
            title="Cabut Bonus Konsistensi?"
            :description="revokeTarget ? `Bonus ${formatCurrency(revokeTarget.amount)} untuk ${revokeTarget.name} periode ${selectedMonthLabel} ${year} akan dihapus dari Total Komisi.` : ''"
            confirm-label="Ya, cabut"
            cancel-label="Batal"
            :on-confirm="confirmRevoke"
        />
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { ConsistencyBonusItem } from '~/types/summary'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
    headerProps: { toolbar: true }
})

const NuxtLink = resolveComponent('NuxtLink')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')
// Admins only view; granting, editing and deleting are Super Admin only.
const { isSuperAdmin } = useAdminAccess()
const { isSelectedClosed } = usePeriodClosings()
// Granting or revoking is Super Admin only, and never in a closed period.
const canEdit = computed(() => isSuperAdmin.value && !isSelectedClosed.value)

const { setLoading } = useLoading()
const { formatCurrency } = useFormat()
const toast = useToast()
const summaryService = new SummaryService()

const { monthLabel } = usePeriodOptions()

const summaryData = ref<ConsistencyBonusItem[]>([])
const { byBranch } = useBranchFilter()
const branchData = computed(() => byBranch(summaryData.value, r => r.branch))
const { year, month: selectedMonth } = useSelectedPeriod()
const globalFilter = ref('')
// Clicking a stat card narrows the table: everyone, or only those already granted a bonus.
type StatusFilter = 'all' | 'granted'
const statusFilter = ref<StatusFilter>('all')
const revokingIds = ref(new Set<string>())
const isRevokeModalOpen = ref(false)
const revokeTarget = ref<ConsistencyBonusItem | null>(null)

const isGrantModalOpen = ref(false)
const selectedEmployeeId = ref<string | null>(null)
const selectedEmployeeName = ref<string | null>(null)
const selectedExistingAmount = ref<number | null>(null)
const selectedExistingNote = ref<string | null>(null)
const selectedExistingMonths = ref<string | null>(null)
const selectedExistingServiceCount = ref<number | null>(null)
const selectedExistingTestimonialLink = ref<string | null>(null)

const monthShortLabel = (n: number) => monthLabel(n).slice(0, 3)
const formatMonths = (months: string | null) => months ? months.split(',').map(m => monthShortLabel(Number(m))).join(', ') : null

const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

const stats = computed(() => {
    const granted = branchData.value.filter(r => r.amount > 0)
    const auto = branchData.value.filter(r => r.autoAmount > 0)
    return [
        { label: 'Jumlah AM & SDR', value: branchData.value.length, key: 'all' },
        { label: 'Sudah Diberi Bonus', value: granted.length, key: 'granted', class: 'text-violet-600 dark:text-violet-400' },
        { label: 'Total Bonus', value: formatCurrency(branchData.value.reduce((a, r) => a + r.amount + r.autoAmount, 0)), class: 'text-violet-600 dark:text-violet-400', note: auto.length ? `Termasuk ${auto.length} bonus otomatis` : undefined },
        { label: 'Total Service Dicapai', value: granted.reduce((a, r) => a + (r.serviceCount ?? 0), 0), note: 'Dari sales yang diberi bonus' }
    ]
})

const askRevoke = (row: ConsistencyBonusItem) => {
    revokeTarget.value = row
    isRevokeModalOpen.value = true
}

const confirmRevoke = async () => {
    if (revokeTarget.value) await revokeBonus(revokeTarget.value)
    isRevokeModalOpen.value = false
}

const filteredData = computed(() => {
    const rows = statusFilter.value === 'granted' ? branchData.value.filter(r => r.amount > 0 || r.autoAmount > 0) : branchData.value
    const query = globalFilter.value.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(row =>
        row.name.toLowerCase().includes(query) || row.employeeId.toLowerCase().includes(query)
    )
})

const openGrantModal = (row: ConsistencyBonusItem) => {
    selectedEmployeeId.value = row.employeeId
    selectedEmployeeName.value = row.name
    selectedExistingAmount.value = row.amount > 0 ? row.amount : null
    selectedExistingNote.value = row.note
    selectedExistingMonths.value = row.months
    selectedExistingServiceCount.value = row.serviceCount
    selectedExistingTestimonialLink.value = row.testimonialLink
    isGrantModalOpen.value = true
}

const revokeBonus = async (row: ConsistencyBonusItem) => {
    revokingIds.value.add(row.employeeId)
    try {
        const response = await summaryService.revokeConsistencyBonus(row.employeeId, { month: selectedMonth.value, year: year.value })
        if (response && response.success) {
            row.amount = 0
            row.note = null
            row.months = null
            row.serviceCount = null
            row.testimonialLink = null
            row.grantedBy = null
            row.grantedByName = null
            row.createdAt = null
            toast.add({ title: 'Bonus dicabut', description: `Bonus Konsistensi ${row.name} dicabut`, color: 'success' })
        }
    } catch (error) {
        toast.add({ title: 'Gagal', description: 'Bonus gagal dicabut. Coba lagi.', color: 'error' })
    } finally {
        revokingIds.value.delete(row.employeeId)
    }
}

const columns: TableColumn<ConsistencyBonusItem>[] = [
    {
        accessorKey: 'name',
        header: 'Account Manager / SDR',
        cell: ({ row }) => h(NuxtLink, { to: `/${row.original.employeeId}/sales`, class: 'flex items-center gap-3 group' }, () => [
            h(UAvatar, { src: row.original.photoProfile, alt: row.original.name, size: 'sm' }),
            h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.name),
                h('span', { class: 'text-xs text-gray-500' }, row.original.isSdr ? `${row.original.employeeId} · SDR` : row.original.employeeId)
            ])
        ])
    },
    {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => row.original.status
            ? h(UBadge, { color: row.original.status === 'Permanent' ? 'primary' : 'neutral', variant: 'subtle' }, () => row.original.status)
            : h('span', { class: 'text-xs text-gray-400 italic' }, '-')
    },
    {
        accessorKey: 'amount',
        header: () => h('div', { class: 'text-right' }, 'Manual'),
        cell: ({ row }) => row.original.amount > 0
            ? h('div', { class: 'text-right font-bold text-violet-600 dark:text-violet-400' }, formatCurrency(row.original.amount))
            : h('div', { class: 'text-right text-xs text-gray-400 italic' }, 'Belum diberikan')
    },
    {
        accessorKey: 'autoAmount',
        header: () => h('div', { class: 'text-right' }, 'Otomatis'),
        cell: ({ row }) => {
            const { autoAmount, autoMonths } = row.original
            if (!autoMonths.length) return h('div', { class: 'text-right text-xs text-gray-400 italic' }, '-')
            const detail = autoMonths.map(m => `${monthShortLabel(Number(m.period.slice(4)))} ${m.activityCount}`).join(' · ')
            return h('div', { class: 'flex flex-col items-end' }, [
                h('span', { class: 'font-bold text-violet-600 dark:text-violet-400' }, formatCurrency(autoAmount)),
                h('span', { class: 'text-[10px] text-gray-500' }, `${detail} = ${autoMonths.reduce((a, m) => a + m.activityCount, 0)}`)
            ])
        }
    },
    {
        accessorKey: 'note',
        header: 'Catatan',
        cell: ({ row }) => {
            const note = row.original.note
            if (!note) return h('span', { class: 'text-xs text-gray-400 italic' }, '-')
            return h(UTooltip, { text: note, delayDuration: 0 }, () =>
                h('span', { class: 'text-xs text-gray-600 dark:text-gray-300 truncate block max-w-[220px]' }, note))
        }
    },
    {
        accessorKey: 'serviceCount',
        header: () => h('div', { class: 'text-center' }, 'Jumlah Service'),
        cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.original.serviceCount ?? '-')
    },
    {
        accessorKey: 'months',
        header: 'Bulan Pencapaian',
        cell: ({ row }) => {
            const label = formatMonths(row.original.months)
            return label
                ? h('span', { class: 'text-xs text-gray-600 dark:text-gray-300' }, label)
                : h('span', { class: 'text-xs text-gray-400 italic' }, '-')
        }
    },
    {
        accessorKey: 'testimonialLink',
        header: 'Testimoni',
        cell: ({ row }) => row.original.testimonialLink
            ? h('a', { href: row.original.testimonialLink, target: '_blank', class: 'text-xs text-blue-500 hover:underline' }, 'Lihat')
            : h('span', { class: 'text-xs text-gray-400 italic' }, '-')
    },
    {
        accessorKey: 'grantedByName',
        header: 'Diberikan Oleh',
        cell: ({ row }) => row.original.grantedByName
            ? h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'text-xs font-medium' }, row.original.grantedByName),
                h('span', { class: 'text-[10px] text-gray-400' }, row.original.createdAt ? new Date(row.original.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '')
            ])
            : h('span', { class: 'text-xs text-gray-400 italic' }, '-')
    },
    {
        id: 'actions',
        header: () => canEdit.value ? h('div', { class: 'text-right' }, 'Aksi') : null,
        cell: ({ row }) => !canEdit.value ? null : h('div', { class: 'flex justify-end gap-2' }, [
            row.original.amount > 0
                ? h(UButton, {
                    color: 'error',
                    variant: 'soft',
                    loading: revokingIds.value.has(row.original.employeeId),
                    onClick: () => askRevoke(row.original)
                }, () => 'Cabut')
                : h(UButton, {
                    color: 'primary',
                    onClick: () => openGrantModal(row.original)
                }, () => 'Beri Bonus')
        ])
    }
]

const fetchSummary = async () => {
    setLoading(true)
    try {
        const response = await summaryService.consistencyBonus({ month: selectedMonth.value, year: year.value })
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
