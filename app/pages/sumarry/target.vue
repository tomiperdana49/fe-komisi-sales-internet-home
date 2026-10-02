<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Target Account Manager</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Target jumlah layanan baru (New) per bulan untuk {{ selectedMonthLabel }} {{ year }}.
                        Default {{ defaultTarget }} untuk Permanent dan 0 untuk Probation. Target ini menentukan rate recurring, potongan 70%, dan Target Dasar tim manager.
                    </p>
                </div>

                <UAlert
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-info"
                    description="Account Manager yang belum terdata untuk periode ini tidak muncul di daftar. Badge status pencapaian (15 / 12 / 3) tidak ikut berubah meski target diubah."
                />

                <UCard>
                    <template #header>
                        <UInput v-model="globalFilter" icon="i-heroicons-magnifying-glass" placeholder="Cari nama atau ID karyawan..." class="w-full sm:w-72" />
                    </template>
                    <UTable sticky :columns="columns" :data="filteredData" empty="Belum ada Account Manager yang terdata untuk periode ini." class="flex-1 max-h-[800px]" />
                </UCard>
            </div>
        </UContainer>
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { SalesTargetItem } from '~/types/summary'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
    headerProps: { toolbar: true }
})

const NuxtLink = resolveComponent('NuxtLink')
const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UInput = resolveComponent('UInput')
const UButton = resolveComponent('UButton')

const { setLoading } = useLoading()
const toast = useToast()
const summaryService = new SummaryService()

const defaultTarget = 12

const { monthLabel } = usePeriodOptions()

const summaryData = ref<SalesTargetItem[]>([])
const year = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)
const globalFilter = ref('')
const savingIds = ref(new Set<string>())
const drafts = ref<Record<string, number>>({})

const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

const filteredData = computed(() => {
    const query = globalFilter.value.trim().toLowerCase()
    if (!query) return summaryData.value
    return summaryData.value.filter(row =>
        row.name.toLowerCase().includes(query) || row.employeeId.toLowerCase().includes(query)
    )
})

const saveTarget = async (row: SalesTargetItem, value: number) => {
    if (!Number.isFinite(value) || value < 0) {
        toast.add({ title: 'Target tidak valid', description: 'Target harus berupa angka 0 atau lebih.', color: 'error' })
        return
    }
    if (value === row.target) return

    savingIds.value.add(row.employeeId)
    try {
        const response = await summaryService.updateSalesTarget(
            row.employeeId,
            { month: selectedMonth.value, year: year.value },
            { target: value }
        )
        if (response && response.success) {
            row.target = value
            drafts.value[row.employeeId] = value
            toast.add({ title: 'Target tersimpan', description: `Target ${row.name} sekarang ${value}.`, color: 'success' })
        }
    } catch (error) {
        toast.add({ title: 'Gagal', description: 'Target gagal disimpan. Coba lagi.', color: 'error' })
    } finally {
        savingIds.value.delete(row.employeeId)
    }
}

const columns: TableColumn<SalesTargetItem>[] = [
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
        accessorKey: 'target',
        header: () => h('div', { class: 'text-right' }, 'Target Layanan Baru / Bulan'),
        cell: ({ row }) => {
            const employeeId = row.original.employeeId
            const draft = drafts.value[employeeId] ?? row.original.target
            const isDirty = draft !== row.original.target
            const isSaving = savingIds.value.has(employeeId)

            return h('div', { class: 'flex justify-end items-center gap-2' }, [
                h(UInput, {
                    type: 'number',
                    min: 0,
                    modelValue: draft,
                    disabled: isSaving,
                    class: 'w-24',
                    ui: { base: 'text-right' },
                    'onUpdate:modelValue': (val: string | number) => {
                        drafts.value[employeeId] = Number(val)
                    },
                    onKeydown: (e: KeyboardEvent) => {
                        if (e.key === 'Enter') saveTarget(row.original, drafts.value[employeeId] ?? draft)
                    }
                }),
                h(UButton, {
                    icon: 'i-heroicons-check',
                    size: 'xs',
                    color: 'primary',
                    variant: 'soft',
                    disabled: !isDirty,
                    loading: isSaving,
                    onClick: () => saveTarget(row.original, drafts.value[employeeId] ?? draft)
                }, () => 'Simpan')
            ])
        }
    }
]

const fetchSummary = async () => {
    setLoading(true)
    try {
        const response = await summaryService.salesTarget({ month: selectedMonth.value, year: year.value })
        summaryData.value = response?.data ?? []
        drafts.value = {}
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
