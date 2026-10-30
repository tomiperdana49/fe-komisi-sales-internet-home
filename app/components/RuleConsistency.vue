<template>
    <section class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Bonus Konsistensi Otomatis</h4>
        <p class="text-sm text-gray-500 dark:text-gray-400">
            Konsistensi dinilai per blok {{ value.months }} bulan, mulai {{ startLabel }} ({{ blockExample }}, dst.). {{ role }} yang baru masuk setelah itu memulai blok dari bulan pertamanya (atau bulan berikutnya bila bulan pertama belum mencapai minimum), dan setelah bonus manual blok berikutnya mulai sebulan sesudahnya.
            Bila setiap bulan dalam blok Pencapaian New-nya minimal {{ value.minPerMonth }}<template v-if="value.minTestimonials > 0"> dan ada minimal {{ value.minTestimonials }} testimoni pelanggan bertanggal di dalam blok</template>, bonus dibayar di bulan terakhir blok sesuai tier total pencapaian blok itu.
            Satu bulan tidak capai membuat blok itu tidak dapat bonus; hitungan mulai lagi dari blok berikutnya.
            Bonus yang diberikan manual di halaman Bonus Konsistensi menggantikan bonus otomatis di bulan itu.
        </p>
        <UCheckbox v-model="value.enabled" label="Hitung Bonus Konsistensi otomatis" :disabled="disabled" />
        <RuleNumber v-model="value.months" label="Jumlah bulan per blok" :step="1" :max="12" :disabled="disabled" />
        <UFormField label="Bulan mulai blok pertama" description="Blok berikutnya menyusul tanpa jeda, dapat bonus atau tidak.">
            <UInput v-model="startMonth" type="month" class="w-48" :disabled="disabled" />
        </UFormField>
        <RuleNumber v-model="value.minPerMonth" label="Pencapaian New minimal per bulan (≥)" :step="1" :max="null" :disabled="disabled" />
        <RuleNumber v-model="value.minTestimonials" label="Testimoni pelanggan minimal per blok (≥, 0 = tidak wajib)" :step="1" :max="null" :disabled="disabled" />
        <div v-for="(t, i) in value.tiers" :key="i" class="flex items-end gap-2">
            <UFormField label="Total Pencapaian (≥)" class="w-36"><UInput v-model.number="t.at" type="number" min="0" :disabled="disabled" /></UFormField>
            <UFormField label="Bonus (Rp)" class="flex-1"><UInput v-model.number="t.amount" type="number" min="0" step="50000" :disabled="disabled" /></UFormField>
            <UButton v-if="!disabled && value.tiers.length > 1" icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Hapus tier" @click="value.tiers.splice(i, 1)" />
        </div>
        <UButton v-if="!disabled" icon="i-lucide-plus" variant="soft" size="sm" @click="value.tiers.push({ at: (value.tiers.at(-1)?.at ?? 0) + 1, amount: 0 })">Tambah Tier</UButton>
    </section>
</template>

<script setup lang="ts">
import type { CommissionRules } from '~/types/rules'

withDefaults(defineProps<{
    /** Who earns it, for the explanation: "AM" or "SDR". */
    role?: string
    disabled?: boolean
}>(), {
    role: 'AM',
    disabled: false
})

const value = defineModel<CommissionRules['consistency']>({ required: true })

const { monthLabel } = usePeriodOptions()
const label = (period: string) => `${monthLabel(Number(period.slice(4))).slice(0, 3)} ${period.slice(0, 4)}`
const shift = (period: string, n: number) => {
    const i = Number(period.slice(0, 4)) * 12 + Number(period.slice(4)) - 1 + n
    return `${Math.floor(i / 12)}${String(i % 12 + 1).padStart(2, '0')}`
}

// <input type="month"> speaks YYYY-MM; the rules store YYYYMM.
const startMonth = computed({
    get: () => `${value.value.startPeriod.slice(0, 4)}-${value.value.startPeriod.slice(4)}`,
    set: (v: string) => { if (/^\d{4}-\d{2}$/.test(v)) value.value.startPeriod = v.replace('-', '') }
})
const startLabel = computed(() => label(value.value.startPeriod))
const blockExample = computed(() => [0, 1].map((b) => {
    const first = shift(value.value.startPeriod, b * value.value.months)
    return `${label(first)}–${label(shift(first, value.value.months - 1))}`
}).join(', '))
</script>
