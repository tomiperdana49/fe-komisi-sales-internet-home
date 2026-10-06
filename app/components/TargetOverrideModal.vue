<template>
    <UModal
        v-model:open="isOpen"
        :title="`${override ? 'Ubah' : 'Atur'} Target — ${employeeName ?? ''}`"
        :description="`Target default dari Aturan Komisi: ${defaultTarget}. Di luar rentang periode, target kembali ke default. Target tim Sales Manager tidak ikut berubah.`"
    >
        <template #body>
            <UForm :state="state" class="space-y-4">
                <UFormField label="Target Pencapaian New" name="target" required :description="isRunning ? 'Target manual ini sudah berjalan, jadi targetnya tidak bisa diubah — akhiri lalu buat yang baru.' : 'Jumlah pencapaian New yang harus dicapai AM ini per periode.'">
                    <UInput v-model.number="state.target" type="number" min="0" :disabled="isRunning" icon="i-heroicons-flag" class="w-full" placeholder="Contoh: 13" />
                </UFormField>
                <UFormField label="Mulai Periode" name="start" required :description="isRunning ? 'Sudah berjalan, tidak bisa diubah.' : `Paling awal ${periodLabel(currentPeriod)} (periode berjalan).`">
                    <div class="flex gap-2">
                        <USelectMenu v-model="state.startMonth" :items="monthSelect" value-key="id" :disabled="isRunning" class="w-36" />
                        <USelectMenu v-model="state.startYear" :items="yearOptions" :disabled="isRunning" class="w-24" />
                    </div>
                </UFormField>
                <UFormField label="Sampai Periode" name="end" required description="Periode terakhir target ini dipakai; setelahnya ikut Aturan Komisi.">
                    <div class="flex gap-2">
                        <USelectMenu v-model="state.endMonth" :items="monthSelect" value-key="id" class="w-36" />
                        <USelectMenu v-model="state.endYear" :items="yearOptions" class="w-24" />
                    </div>
                </UFormField>
                <UFormField label="Catatan" name="note" description="Opsional, alasan target ini diubah.">
                    <UTextarea v-model="state.note" class="w-full" :rows="2" placeholder="Contoh: Target dinaikkan karena area baru" />
                </UFormField>
            </UForm>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-3 w-full">
                <UButton type="button" color="neutral" variant="ghost" :disabled="saving" @click="close">Batal</UButton>
                <UButton type="button" color="primary" :loading="saving" @click="onSubmit">Simpan</UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { TargetOverride } from '~/types/summary'

const props = defineProps<{
    employeeId: string | null
    employeeName: string | null
    defaultTarget: number
    /** The range being edited; null to create a new one. */
    override: TargetOverride | null
    /** The running commission period (YYYYMM) — nothing before it can change. */
    currentPeriod: string
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits(['success'])

const summaryService = new SummaryService()
const toast = useToast()
const saving = ref(false)
const { monthSelect, monthLabel } = usePeriodOptions()

const thisYear = new Date().getFullYear()
const yearOptions = [thisYear, thisYear + 1, thisYear + 2]

const toPeriod = (year: number, month: number) => `${year}${String(month).padStart(2, '0')}`
const periodLabel = (period: string) => `${monthLabel(Number(period.slice(4, 6)))} ${period.slice(0, 4)}`

/** Started before the running period: only its end and note may still change. */
const isRunning = computed(() => !!props.override && props.override.startPeriod < props.currentPeriod)

const state = reactive({ target: undefined as number | undefined, startMonth: 1, startYear: thisYear, endMonth: 1, endYear: thisYear, note: '' })

watch(isOpen, (open) => {
    if (!open) return
    const start = props.override?.startPeriod ?? props.currentPeriod
    const end = props.override?.endPeriod ?? props.currentPeriod
    state.target = props.override?.target
    state.startYear = Number(start.slice(0, 4))
    state.startMonth = Number(start.slice(4, 6))
    state.endYear = Number(end.slice(0, 4))
    state.endMonth = Number(end.slice(4, 6))
    state.note = props.override?.note ?? ''
}, { immediate: true })

async function onSubmit() {
    if (!props.employeeId) return
    if (state.target === undefined || state.target === null || !Number.isInteger(state.target) || state.target < 0) {
        toast.add({ title: 'Target wajib diisi', description: 'Isi target berupa bilangan bulat.', color: 'error' })
        return
    }
    const startPeriod = toPeriod(state.startYear, state.startMonth)
    const endPeriod = toPeriod(state.endYear, state.endMonth)
    if (endPeriod < startPeriod) {
        toast.add({ title: 'Periode tidak valid', description: "'Sampai Periode' tidak boleh sebelum 'Mulai Periode'.", color: 'error' })
        return
    }

    const input = { target: state.target, startPeriod, endPeriod, note: state.note.trim() || undefined }
    saving.value = true
    try {
        const response = props.override
            ? await summaryService.updateTargetOverride(props.override.id, input)
            : await summaryService.createTargetOverride({ employeeId: props.employeeId, ...input })
        if (response && response.success) {
            toast.add({
                title: 'Target disimpan',
                description: `Target ${props.employeeName} menjadi ${state.target} untuk ${periodLabel(startPeriod)} – ${periodLabel(endPeriod)}`,
                color: 'success'
            })
            emit('success')
            isOpen.value = false
        }
    } catch (error) {
        console.error('Failed to save target override:', error)
    } finally {
        saving.value = false
    }
}
</script>
