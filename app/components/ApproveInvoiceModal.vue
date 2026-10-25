<template>
    <UModal
        v-model:open="isOpen"
        :title="`Approve Telat Bayar — ${invoice?.customerServiceAccount ?? ''}`"
        description="Invoice yang di-approve tidak lagi kena potongan telat bayar, di komisi AM maupun overriding SM."
    >
        <template #body>
            <div v-if="invoice" class="text-sm space-y-1 mb-4 text-gray-600 dark:text-gray-300">
                <p><span class="text-gray-400">Sales:</span> {{ invoice.sales?.name ?? 'Customer Relation Officer' }}</p>
                <p><span class="text-gray-400">Pelanggan:</span> {{ invoice.customerName ?? invoice.customerId }}</p>
                <p><span class="text-gray-400">Telat bayar:</span> {{ invoice.lateMonth }} bln</p>
            </div>
            <UFormField label="Alasan Approve" name="note" required description="Wajib diisi untuk audit, misalnya keterlambatan di luar kendali sales.">
                <UTextarea v-model="note" class="w-full" :rows="3" placeholder="Contoh: Pembayaran tertunda karena gangguan sistem pembayaran" />
            </UFormField>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-3 w-full">
                <UButton type="button" color="neutral" variant="ghost" :disabled="saving" @click="close">Batal</UButton>
                <UButton type="button" color="primary" :loading="saving" @click="onSubmit">Approve</UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { InvoiceSummaryItem } from '~/types/summary'

const props = defineProps<{
    invoice: InvoiceSummaryItem | null
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
    if (!props.invoice) return
    if (!note.value.trim()) {
        toast.add({ title: 'Alasan wajib diisi', description: 'Tulis alasan potongan telat bayar ini dihapus.', color: 'error' })
        return
    }
    saving.value = true
    try {
        const response = await summaryService.approveInvoice(props.invoice.aiInvoice, { isApproved: true, note: note.value.trim() })
        if (response && response.success) {
            toast.add({ title: 'Invoice di-approve', description: `Potongan telat bayar ${props.invoice.customerServiceAccount} dihapus`, color: 'success' })
            emit('success', note.value.trim())
            isOpen.value = false
        }
    } catch (error) {
        console.error('Failed to approve invoice:', error)
    } finally {
        saving.value = false
    }
}
</script>
