<template>
    <UModal
        v-model:open="isOpen"
        :title="`Bonus Konsistensi — ${employeeName ?? ''}`"
        description="Nominal ditentukan admin, ditambahkan langsung ke Total Komisi periode ini."
    >
        <template #body>
            <UForm :state="state" class="space-y-4">
                <UFormField label="Nominal Bonus" name="amount" required description="Jumlah bonus yang diberikan, bebas ditentukan admin.">
                    <UInput v-model.number="state.amount" type="number" min="0" step="1000" icon="i-heroicons-banknotes" class="w-full" placeholder="Contoh: 1000000" />
                </UFormField>
                <UFormField label="Catatan" name="note" required description="Alasan pemberian bonus ini, wajib diisi untuk audit log.">
                    <UTextarea v-model="state.note" class="w-full" :rows="3" placeholder="Contoh: Konsisten capai target 3 bulan berturut-turut" />
                </UFormField>
                <UFormField label="Jumlah Service" name="serviceCount" required description="Jumlah service yang dicapai sales, diisi manual.">
                    <UInput v-model.number="state.serviceCount" type="number" min="0" class="w-full" placeholder="Contoh: 15" />
                </UFormField>
                <UFormField label="Bulan" name="months" description="Bulan-bulan pencapaian yang dijadikan catatan (opsional, tidak mempengaruhi periode bonus).">
                    <USelectMenu v-model="state.months" :items="monthOptions" value-key="id" multiple class="w-full" placeholder="Pilih bulan" />
                </UFormField>
                <UFormField label="Link Testimoni" name="testimonialLink" description="Opsional, link bukti testimoni pelanggan.">
                    <UInput v-model="state.testimonialLink" type="url" class="w-full" placeholder="https://..." />
                </UFormField>
            </UForm>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-3 w-full">
                <UButton type="button" color="neutral" variant="ghost" :disabled="saving" @click="close">Batal</UButton>
                <UButton type="button" color="primary" :loading="saving" @click="onSubmit">Berikan {{ state.amount ? formatCurrency(state.amount) : '' }}</UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { SummaryService } from '~/services/summary-service'

const props = defineProps<{
    employeeId: string | null
    employeeName: string | null
    existingAmount: number | null
    existingNote: string | null
    existingMonths: string | null
    existingServiceCount: number | null
    existingTestimonialLink: string | null
    month: number
    year: number
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits(['success'])

const summaryService = new SummaryService()
const { formatCurrency } = useFormat()
const toast = useToast()
const saving = ref(false)

const { monthSelect: monthOptions } = usePeriodOptions()

const state = reactive<{ amount: number | undefined; note: string; serviceCount: number | undefined; months: number[]; testimonialLink: string }>({
    amount: undefined,
    note: '',
    serviceCount: undefined,
    months: [],
    testimonialLink: ''
})

watch(
    () => [props.existingAmount, props.existingNote, props.existingMonths, props.existingServiceCount, props.existingTestimonialLink, isOpen.value] as const,
    ([amount, note, months, serviceCount, testimonialLink, open]) => {
        if (open) {
            state.amount = amount ?? undefined
            state.note = note ?? ''
            state.months = months ? months.split(',').map(Number) : []
            state.serviceCount = serviceCount ?? undefined
            state.testimonialLink = testimonialLink ?? ''
        }
    },
    { immediate: true }
)

async function onSubmit() {
    if (!props.employeeId) return
    if (state.amount === undefined || state.amount === null || state.amount <= 0) {
        toast.add({ title: 'Nominal bonus wajib diisi', description: 'Isi nominal bonus yang diberikan.', color: 'error' })
        return
    }
    if (!state.note.trim()) {
        toast.add({ title: 'Catatan wajib diisi', description: 'Tulis alasan pemberian bonus ini.', color: 'error' })
        return
    }
    if (state.serviceCount === undefined || state.serviceCount === null || state.serviceCount < 0) {
        toast.add({ title: 'Jumlah service wajib diisi', description: 'Isi jumlah service yang dicapai.', color: 'error' })
        return
    }

    saving.value = true
    try {
        const response = await summaryService.grantConsistencyBonus(
            props.employeeId,
            { month: props.month, year: props.year },
            {
                amount: state.amount,
                note: state.note.trim(),
                serviceCount: state.serviceCount,
                months: state.months.length > 0 ? state.months : undefined,
                testimonialLink: state.testimonialLink.trim() || undefined
            }
        )
        if (response && response.success) {
            toast.add({ title: 'Bonus diberikan', description: `Bonus Konsistensi ${formatCurrency(state.amount)} berhasil diberikan`, color: 'success' })
            emit('success')
            isOpen.value = false
        }
    } catch (error) {
        console.error('Failed to grant consistency bonus:', error)
    } finally {
        saving.value = false
    }
}
</script>
