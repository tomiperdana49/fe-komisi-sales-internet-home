<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Testimoni Pelanggan</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Testimoni yang dicatat Account Manager dengan tanggal testimoni di periode {{ selectedMonthLabel }} {{ year }}.
                        Testimoni ditambahkan dari dashboard masing-masing Account Manager.
                    </p>
                </div>

                <SummaryStats :stats="stats" />

                <UCard>
                    <template #header>
                        <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                            <UInput v-model="globalFilter" icon="i-heroicons-magnifying-glass" placeholder="Cari customer, AM, atau SM..." class="w-full sm:w-72" />
                            <BranchFilter :branches="summaryData.map(r => r.branch)" />
                        </div>
                    </template>
                    <UTable sticky :columns="columns" :data="filteredData" empty="Belum ada testimoni untuk periode ini." class="flex-1 max-h-[800px]" />
                </UCard>
            </div>
        </UContainer>

        <TestimonialModal
            v-if="editTarget"
            v-model:open="isEditModalOpen"
            :employee-id="editTarget.employeeId"
            :employee-name="editTarget.employeeName"
            :testimonial="editTarget"
            @success="fetchSummary"
        />

        <ConfirmModal
            v-model:open="isDeleteModalOpen"
            title="Hapus testimoni?"
            :description="deleteTarget ? `Testimoni ${deleteTarget.customerName} (${deleteTarget.customerId}) dari ${deleteTarget.employeeName ?? deleteTarget.employeeId} akan dihapus.` : ''"
            confirm-label="Ya, hapus"
            cancel-label="Batal"
            :on-confirm="confirmDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { TestimonialService } from '~/services/testimonial-service'
import type { TestimonialItem } from '~/types/testimonial'

definePageMeta({
    headerProps: { toolbar: true }
})

const { setLoading } = useLoading()
const toast = useToast()
const testimonialService = new TestimonialService()
const { isSuperAdmin } = useAdminAccess()
const { monthLabel } = usePeriodOptions()
const { testimonialColumns, matchesTestimonial } = useTestimonialColumns()

const summaryData = ref<TestimonialItem[]>([])
const { byBranch } = useBranchFilter()
const branchData = computed(() => byBranch(summaryData.value, r => r.branch))
const { year, month: selectedMonth } = useSelectedPeriod()
const globalFilter = ref('')
const isDeleteModalOpen = ref(false)
const deleteTarget = ref<TestimonialItem | null>(null)
const isEditModalOpen = ref(false)
const editTarget = ref<TestimonialItem | null>(null)
const deletingIds = ref(new Set<number>())

const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

const filteredData = computed(() => branchData.value.filter(r => matchesTestimonial(r, globalFilter.value)))

const stats = computed(() => [
    { label: 'Jumlah Testimoni', value: branchData.value.length },
    { label: 'Account Manager', value: new Set(branchData.value.map(r => r.employeeId)).size, note: 'Yang mencatat testimoni' },
    { label: 'Customer', value: new Set(branchData.value.map(r => r.customerId)).size }
])

// Editing or deleting from the admin page is Super Admin only.
const columns = testimonialColumns({
    showSales: true,
    canChange: () => isSuperAdmin.value,
    isDeleting: r => deletingIds.value.has(r.id),
    onEdit: (r) => {
        editTarget.value = r
        isEditModalOpen.value = true
    },
    onDelete: (r) => {
        deleteTarget.value = r
        isDeleteModalOpen.value = true
    }
})

const confirmDelete = async () => {
    const row = deleteTarget.value
    isDeleteModalOpen.value = false
    if (!row) return
    deletingIds.value.add(row.id)
    try {
        const response = await testimonialService.remove(row.employeeId, row.id)
        if (response && response.success) {
            summaryData.value = summaryData.value.filter(r => r.id !== row.id)
            toast.add({ title: 'Testimoni dihapus', description: `Testimoni ${row.customerName} dihapus`, color: 'success' })
        }
    } catch (error) {
        console.error('Failed to delete testimonial:', error)
    } finally {
        deletingIds.value.delete(row.id)
    }
}

const fetchSummary = async () => {
    setLoading(true)
    try {
        const response = await testimonialService.listByPeriod({ month: selectedMonth.value, year: year.value })
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
