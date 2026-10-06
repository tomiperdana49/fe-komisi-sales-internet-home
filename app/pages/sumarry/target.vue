<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Target AM</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Target pencapaian New per Account Manager untuk {{ selectedMonthLabel }} {{ year }}. Tanpa target manual, target ikut Aturan Komisi.
                        Target manual berlaku untuk rentang periode tertentu, lalu otomatis kembali ke default. Hanya komisi AM tersebut yang terpengaruh;
                        target tim Sales Manager tetap memakai target default.
                    </p>
                </div>

                <SummaryStats :stats="stats" />

                <UCard>
                    <template #header>
                        <UInput v-model="globalFilter" icon="i-heroicons-magnifying-glass" placeholder="Cari nama atau ID karyawan..." class="w-full sm:w-72" />
                    </template>
                    <UTable sticky :columns="columns" :data="filteredData" empty="Belum ada Account Manager yang terdata untuk periode ini." class="flex-1 max-h-[800px]" />
                </UCard>
            </div>
        </UContainer>

        <TargetOverrideModal
            v-model:open="isModalOpen"
            :employee-id="editing?.row.employeeId ?? null"
            :employee-name="editing?.row.name ?? null"
            :default-target="editing?.row.defaultTarget ?? 0"
            :override="editing?.override ?? null"
            :current-period="currentPeriod"
            @success="fetchData"
        />

        <ConfirmModal
            v-model:open="isDeleteModalOpen"
            title="Hapus target manual?"
            :description="deleteTarget ? `Target ${deleteTarget.override.target} untuk ${deleteTarget.row.name} (${rangeLabel(deleteTarget.override)}) dihapus; periode tersebut kembali ke target default.` : ''"
            confirm-label="Ya, hapus"
            cancel-label="Batal"
            :on-confirm="confirmDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { TargetOverride, TargetOverrideRosterItem } from '~/types/summary'
import type { DropdownMenuItem, TableColumn } from '@nuxt/ui'

definePageMeta({
    headerProps: { toolbar: true }
})

const NuxtLink = resolveComponent('NuxtLink')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UDropdownMenu = resolveComponent('UDropdownMenu')
const UTooltip = resolveComponent('UTooltip')

const { setLoading } = useLoading()
const toast = useToast()
const summaryService = new SummaryService()
const { monthLabel } = usePeriodOptions()

const data = ref<TargetOverrideRosterItem[]>([])
const { year, month: selectedMonth } = useSelectedPeriod()
const globalFilter = ref('')

const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

/** The running commission period: from the 26th a sale already belongs to next month (be: currentCommissionPeriod). */
const currentPeriod = (() => {
    const now = new Date()
    const d = now.getDate() > 25 ? new Date(now.getFullYear(), now.getMonth() + 1, 1) : now
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
})()

const periodShort = (period: string) => `${monthLabel(Number(period.slice(4, 6))).slice(0, 3)} ${period.slice(0, 4)}`
const rangeLabel = (o: TargetOverride) => o.startPeriod === o.endPeriod ? periodShort(o.startPeriod) : `${periodShort(o.startPeriod)} – ${periodShort(o.endPeriod)}`
/** Started before the running period — can only be ended early, not deleted. */
const isRunning = (o: TargetOverride) => o.startPeriod < currentPeriod

const stats = computed(() => [
    { label: 'Jumlah Account Manager', value: data.value.length },
    { label: 'Target Manual Aktif', value: data.value.filter(r => r.active).length, class: 'text-primary-600 dark:text-primary-400' },
    { label: 'Terjadwal', value: data.value.reduce((a, r) => a + r.upcoming.length, 0), note: 'Target manual yang mulai setelah periode ini' }
])

const filteredData = computed(() => {
    const query = globalFilter.value.trim().toLowerCase()
    if (!query) return data.value
    return data.value.filter(row => row.name.toLowerCase().includes(query) || row.employeeId.toLowerCase().includes(query))
})

const isModalOpen = ref(false)
const editing = ref<{ row: TargetOverrideRosterItem; override: TargetOverride | null } | null>(null)
const openModal = (row: TargetOverrideRosterItem, override: TargetOverride | null) => {
    editing.value = { row, override }
    isModalOpen.value = true
}

const isDeleteModalOpen = ref(false)
const deleteTarget = ref<{ row: TargetOverrideRosterItem; override: TargetOverride } | null>(null)
const askDelete = (row: TargetOverrideRosterItem, override: TargetOverride) => {
    deleteTarget.value = { row, override }
    isDeleteModalOpen.value = true
}
const confirmDelete = async () => {
    if (deleteTarget.value) {
        try {
            const response = await summaryService.deleteTargetOverride(deleteTarget.value.override.id)
            if (response && response.success) {
                toast.add({ title: 'Target dihapus', description: `Target manual ${deleteTarget.value.row.name} dihapus`, color: 'success' })
                await fetchData()
            }
        } catch (error) {
            console.error('Failed to delete target override:', error)
        }
    }
    isDeleteModalOpen.value = false
}

const rowActions = (row: TargetOverrideRosterItem): DropdownMenuItem[][] => {
    const forOverride = (o: TargetOverride, label: string): DropdownMenuItem[] => [
        { label: `Ubah ${label}`, icon: 'i-heroicons-pencil-square', onSelect: () => openModal(row, o) },
        isRunning(o)
            ? { label: `Hapus ${label}`, icon: 'i-heroicons-trash', disabled: true, description: 'Sudah berjalan — ubah Sampai Periode untuk mengakhirinya' }
            : { label: `Hapus ${label}`, icon: 'i-heroicons-trash', color: 'error', onSelect: () => askDelete(row, o) }
    ]
    return [
        [{ label: 'Atur target baru', icon: 'i-heroicons-plus', onSelect: () => openModal(row, null) }],
        ...(row.active ? [forOverride(row.active, `(${rangeLabel(row.active)})`)] : []),
        ...row.upcoming.map(o => forOverride(o, `(${rangeLabel(o)})`))
    ]
}

const columns: TableColumn<TargetOverrideRosterItem>[] = [
    {
        accessorKey: 'name',
        header: 'Account Manager',
        cell: ({ row }) => h(NuxtLink, { to: `/${row.original.employeeId}/sales`, class: 'flex items-center gap-3 group' }, () => [
            h(UAvatar, { src: row.original.photoProfile, alt: row.original.name, size: 'sm' }),
            h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.name),
                h('span', { class: 'text-xs text-gray-500' }, row.original.employeeId)
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
        accessorKey: 'defaultTarget',
        header: () => h('div', { class: 'text-center' }, 'Target Default'),
        cell: ({ row }) => h('div', { class: 'text-center text-gray-500' }, row.original.defaultTarget)
    },
    {
        accessorKey: 'effectiveTarget',
        header: () => h('div', { class: 'text-center' }, 'Target Berlaku'),
        cell: ({ row }) => h('div', { class: 'flex items-center justify-center gap-2' }, [
            h('span', { class: ['font-bold', row.original.active ? 'text-primary-600 dark:text-primary-400' : 'text-gray-900 dark:text-white'] }, row.original.effectiveTarget),
            row.original.active ? h(UBadge, { color: 'primary', variant: 'subtle', size: 'sm' }, () => 'Manual') : null
        ])
    },
    {
        id: 'range',
        header: 'Rentang Periode',
        cell: ({ row }) => row.original.active
            ? h('span', { class: 'text-xs text-gray-700 dark:text-gray-300' }, rangeLabel(row.original.active))
            : h('span', { class: 'text-xs text-gray-400 italic' }, 'Ikut Aturan Komisi')
    },
    {
        id: 'upcoming',
        header: 'Terjadwal',
        cell: ({ row }) => row.original.upcoming.length
            ? h('div', { class: 'flex flex-col gap-0.5' }, row.original.upcoming.map(o =>
                h('span', { class: 'text-xs text-gray-700 dark:text-gray-300' }, `${o.target} · ${rangeLabel(o)}`)))
            : h('span', { class: 'text-xs text-gray-400 italic' }, '-')
    },
    {
        id: 'note',
        header: 'Catatan',
        cell: ({ row }) => {
            const note = row.original.active?.note
            if (!note) return h('span', { class: 'text-xs text-gray-400 italic' }, '-')
            return h(UTooltip, { text: note, delayDuration: 0 }, () =>
                h('span', { class: 'text-xs text-gray-600 dark:text-gray-300 truncate block max-w-[200px]' }, note))
        }
    },
    {
        id: 'updatedBy',
        header: 'Diatur Oleh',
        cell: ({ row }) => {
            const o = row.original.active ?? row.original.upcoming[0]
            return o
                ? h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'text-xs font-medium' }, o.updatedByName ?? o.updatedBy),
                    h('span', { class: 'text-[10px] text-gray-400' }, new Date(o.updatedAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }))
                ])
                : h('span', { class: 'text-xs text-gray-400 italic' }, '-')
        }
    },
    {
        id: 'actions',
        header: () => h('div', { class: 'text-right' }, 'Aksi'),
        cell: ({ row }) => h('div', { class: 'flex justify-end' }, [
            row.original.active || row.original.upcoming.length
                ? h(UDropdownMenu, { items: rowActions(row.original), content: { align: 'end' } }, () =>
                    h(UButton, { color: 'neutral', variant: 'outline', trailingIcon: 'i-heroicons-chevron-down' }, () => 'Kelola'))
                : h(UButton, { color: 'primary', onClick: () => openModal(row.original, null) }, () => 'Atur Target')
        ])
    }
]

const fetchData = async () => {
    setLoading(true)
    try {
        const response = await summaryService.targetOverrides({ month: selectedMonth.value, year: year.value })
        data.value = response?.data ?? []
    } finally {
        setLoading(false)
    }
}

onMounted(() => {
    fetchData()
})

watch([year, selectedMonth], () => {
    fetchData()
})
</script>
