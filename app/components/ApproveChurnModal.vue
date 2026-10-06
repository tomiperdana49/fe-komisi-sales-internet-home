<template>
    <UModal
        v-model:open="isOpen"
        :title="`Bebaskan Churn — ${churn?.customer_service_account ?? ''}`"
        description="Churn yang dibebaskan tidak lagi memotong komisi dan pencapaian New sales. Alasannya ikut terlihat oleh sales."
    >
        <template #body>
            <div v-if="churn" class="text-sm space-y-1 mb-4 text-gray-600 dark:text-gray-300">
                <p><span class="text-gray-400">Sales:</span> {{ churn.employee_name ?? 'Customer Relation Officer' }}</p>
                <p><span class="text-gray-400">Pelanggan:</span> {{ churn.customer_name ?? churn.customer_id }}</p>
                <p><span class="text-gray-400">Alasan berhenti:</span> <span class="italic">{{ churn.reason ?? '-' }}</span></p>
            </div>
            <UFormField label="Alasan Dibebaskan" name="note" required description="Wajib diisi untuk audit, misalnya penyebab di luar kendali sales.">
                <UTextarea v-model="note" class="w-full" :rows="3" placeholder="Contoh: Berhenti karena gangguan jaringan di area, bukan kesalahan sales" />
            </UFormField>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-3 w-full">
                <UButton type="button" color="neutral" variant="ghost" :disabled="saving" @click="close">Batal</UButton>
                <UButton type="button" color="primary" :loading="saving" @click="onSubmit">Bebaskan</UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { ChurnSummaryItem } from '~/types/summary'

const props = defineProps<{
    churn: ChurnSummaryItem | null
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ success: [note: string] }>()

const summaryService = new SummaryService()
const toast = useToast()
const saving = ref(false)
const note = ref('')

watch(isOpen, (open) => {
    if (open) note.value = ''
})

async function onSubmit() {
    if (!props.churn) return
    if (!note.value.trim()) {
        toast.add({ title: 'Alasan wajib diisi', description: 'Tulis alasan churn ini dibebaskan.', color: 'error' })
        return
    }
    saving.value = true
    try {
        const response = await summaryService.approveChurn(props.churn.customer_service_id, { isApproved: true, note: note.value.trim() })
        if (response && response.success) {
            toast.add({ title: 'Churn dibebaskan', description: `${props.churn.customer_service_account} tidak lagi memotong komisi sales`, color: 'success' })
            emit('success', note.value.trim())
            isOpen.value = false
        }
    } catch (error) {
        console.error('Failed to approve churn:', error)
    } finally {
        saving.value = false
    }
}
</script>
