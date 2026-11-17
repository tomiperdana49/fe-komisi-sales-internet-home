<template>
    <UModal
        v-model:open="open"
        title="Simulasi Komisi"
        description="Hanya simulasi tampilan di browser ini, untuk dicocokkan dengan sheet. Tidak mengubah komisi, dan tidak tersimpan ke database."
    >
        <template #body>
            <div class="space-y-4">
                <UFormField
                    label="% Customer Baru"
                    description="Dikalikan ke total komisi New sebelum potongan performa (seperti kolom Komisi per baris di sheet). Contoh: 30 = setelah potongan 70%. Kosongkan bila tidak dipakai."
                >
                    <UInput v-model="form.newPct" type="number" min="0" max="100" step="0.01" placeholder="Contoh: 30" class="w-full">
                        <template #trailing><span class="text-xs text-gray-500">%</span></template>
                    </UInput>
                </UFormField>
                <UFormField
                    label="% Customer Lama"
                    description="Dikalikan ke komisi Recurring (customer lama) yang sudah dihitung. Contoh: 90 = 90% dari komisi recurring; 100 = tidak berubah. Kosongkan bila tidak dipakai."
                >
                    <UInput v-model="form.oldPct" type="number" min="0" max="100" step="0.01" placeholder="Contoh: 90" class="w-full">
                        <template #trailing><span class="text-xs text-gray-500">%</span></template>
                    </UInput>
                </UFormField>
                <p v-if="invalid" class="text-sm text-red-500">Isi persen antara 0 dan 100.</p>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-between gap-3 w-full">
                <UButton type="button" color="neutral" variant="ghost" icon="i-lucide-rotate-ccw" @click="onReset(close)">Reset</UButton>
                <div class="flex gap-3">
                    <UButton type="button" color="neutral" variant="ghost" @click="close">Batal</UButton>
                    <UButton type="button" color="primary" :disabled="invalid" @click="onSave(close)">Terapkan</UButton>
                </div>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
const open = defineModel<boolean>('open', { default: false })
const { state, save, reset } = useCommissionSimulation()

const form = reactive<{ newPct: string | number; oldPct: string | number }>({ newPct: '', oldPct: '' })
watch(open, (isOpen) => {
    if (!isOpen) return
    form.newPct = state.value.newPct ?? ''
    form.oldPct = state.value.oldPct ?? ''
})

const parse = (v: string | number): number | null | undefined => {
    if (v === '' || v === null || v === undefined) return null
    const n = Number(String(v).replace(',', '.'))
    return Number.isFinite(n) && n >= 0 && n <= 100 ? n : undefined
}
const invalid = computed(() => parse(form.newPct) === undefined || parse(form.oldPct) === undefined)

const onSave = (close: () => void) => {
    if (invalid.value) return
    save({ newPct: parse(form.newPct) ?? null, oldPct: parse(form.oldPct) ?? null })
    close()
}
const onReset = (close: () => void) => {
    reset()
    close()
}
</script>
