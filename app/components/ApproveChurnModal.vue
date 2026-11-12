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
            <UFormField
                label="Syarat Pelunasan Terminasi"
                name="duePeriod"
                class="mt-4"
                description="Untuk biaya terminasi yang dicicil. Bila invoice terminasi belum lunas di periode batas ini, churn otomatis memotong komisi di periode tersebut."
            >
                <USelect v-model="duePeriod" :items="dueItems" class="w-full" />
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
import { computed, ref, watch } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { ChurnSummaryItem } from '~/types/summary'

const props = defineProps<{
    churn: ChurnSummaryItem | null
    /** The churn's period (YYYYMM): the payment deadline is a later one. */
    period: string
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits<{ success: [note: string, duePeriod: string | null] }>()
const { monthLabel } = usePeriodOptions()

// "none" = unconditional; otherwise the next 6 periods after the churn's.
const NONE = 'none'
const duePeriod = ref(NONE)
const dueItems = computed(() => {
    const y = Number(props.period.slice(0, 4))
    const m = Number(props.period.slice(4, 6))
    const items = [{ label: 'Tanpa syarat (bebas permanen)', value: NONE }]
    for (let i = 1; i <= 6; i++) {
        const d = new Date(y, m - 1 + i, 1)
        const value = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
        items.push({ label: `Lunas paling lambat periode ${monthLabel(d.getMonth() + 1)} ${d.getFullYear()}`, value })
    }
    return items
})

const summaryService = new SummaryService()
const toast = useToast()
const saving = ref(false)
const note = ref('')

watch(isOpen, (open) => {
    if (open) {
        note.value = ''
        duePeriod.value = NONE
    }
})

async function onSubmit() {
    if (!props.churn) return
    if (!note.value.trim()) {
        toast.add({ title: 'Alasan wajib diisi', description: 'Tulis alasan churn ini dibebaskan.', color: 'error' })
        return
    }
    saving.value = true
    try {
        const due = duePeriod.value === NONE ? null : duePeriod.value
        const response = await summaryService.approveChurn(props.churn.customer_service_id, { isApproved: true, note: note.value.trim(), duePeriod: due })
        if (response && response.success) {
            toast.add({ title: 'Churn dibebaskan', description: `${props.churn.customer_service_account} tidak lagi memotong komisi sales${due ? ' selama terminasi lunas tepat waktu' : ''}`, color: 'success' })
            emit('success', note.value.trim(), due)
            isOpen.value = false
        }
    } catch (error) {
        console.error('Failed to approve churn:', error)
    } finally {
        saving.value = false
    }
}
</script>
