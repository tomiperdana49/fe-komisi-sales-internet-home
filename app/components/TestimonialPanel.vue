<template>
    <UCard>
        <div class="mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">Testimoni Pelanggan ({{ rows.length }})</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Testimoni diinput oleh Sales Manager setelah dicek dan direview, terbaru di atas.
                    <template v-if="!canManage">Kirim testimoni pelanggan ke Sales Manager Anda untuk diinput.</template>
                </p>
            </div>
            <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <UInput v-model="search" icon="i-lucide-search" placeholder="Cari nama atau ID customer..." class="w-full sm:w-72" />
                <UButton v-if="canManage" icon="i-lucide-plus" color="primary" @click="openModal(null)">Tambah Testimoni</UButton>
            </div>
        </div>
        <UTable sticky :data="filteredRows" :columns="columns" :empty="search.trim() ? 'Tidak ada testimoni yang cocok.' : 'Belum ada testimoni.'" class="flex-1 max-h-[600px]" />

        <TestimonialModal
            v-model:open="isModalOpen"
            :employee-id="employeeId"
            :employee-name="employeeName"
            :customers="customers"
            :testimonial="editTarget"
            @success="onSaved"
        />

        <ConfirmModal
            v-model:open="isDeleteModalOpen"
            title="Hapus testimoni?"
            :description="deleteTarget ? `Testimoni ${deleteTarget.customerName} (${deleteTarget.customerId}) akan dihapus.` : ''"
            confirm-label="Ya, hapus"
            cancel-label="Batal"
            :on-confirm="confirmDelete"
        />
    </UCard>
</template>

<script setup lang="ts">
import { TestimonialService } from '~/services/testimonial-service'
import type { TestimonialItem } from '~/types/testimonial'

const props = defineProps<{
    employeeId: string
    employeeName?: string | null
    /** Customers known for this Account Manager (ID → name), to fill the form's name in. */
    customers?: Map<string, string>
}>()

/** `changed`: a testimonial was added, edited or deleted (the Bonus Konsistensi card recounts). */
const emit = defineEmits(['changed'])

const testimonialService = new TestimonialService()
const toast = useToast()
const { state } = useAuth()
const { isSuperAdmin } = useAdminAccess()
const { testimonialColumns, matchesTestimonial } = useTestimonialColumns()

const rows = ref<TestimonialItem[]>([])
const search = ref('')
const isModalOpen = ref(false)
const isDeleteModalOpen = ref(false)
const deleteTarget = ref<TestimonialItem | null>(null)
const editTarget = ref<TestimonialItem | null>(null)
const deletingIds = ref(new Set<number>())

// The Sales Manager (anyone above the Account Manager) reviews and enters testimonials; the Account Manager only sees them.
const canManage = computed(() => isSuperAdmin.value || (!!state.user && state.user.employee_id !== props.employeeId))

const filteredRows = computed(() => rows.value.filter(r => matchesTestimonial(r, search.value)))

const openModal = (row: TestimonialItem | null) => {
    editTarget.value = row
    isModalOpen.value = true
}

const columns = testimonialColumns({
    showSales: false,
    canChange: r => isSuperAdmin.value || (canManage.value && !r.periodClosed),
    isDeleting: r => deletingIds.value.has(r.id),
    onEdit: openModal,
    onDelete: (r) => {
        deleteTarget.value = r
        isDeleteModalOpen.value = true
    }
})

const fetchRows = async () => {
    const response = await testimonialService.listBySales(props.employeeId)
    rows.value = response?.data ?? []
}

const onSaved = async () => {
    await fetchRows()
    emit('changed')
}

const confirmDelete = async () => {
    const row = deleteTarget.value
    isDeleteModalOpen.value = false
    if (!row) return
    deletingIds.value.add(row.id)
    try {
        const response = await testimonialService.remove(props.employeeId, row.id)
        if (response && response.success) {
            rows.value = rows.value.filter(r => r.id !== row.id)
            emit('changed')
            toast.add({ title: 'Testimoni dihapus', description: `Testimoni ${row.customerName} dihapus`, color: 'success' })
        }
    } catch (error) {
        console.error('Failed to delete testimonial:', error)
    } finally {
        deletingIds.value.delete(row.id)
    }
}

watch(() => props.employeeId, fetchRows, { immediate: true })
</script>
