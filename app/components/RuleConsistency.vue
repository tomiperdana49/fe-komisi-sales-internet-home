<template>
    <section class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-800">
        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Bonus Konsistensi Otomatis</h4>
        <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ role }} yang Pencapaian New-nya minimal {{ value.minPerMonth }} selama {{ value.months }} bulan berturut-turut otomatis mendapat bonus di bulan ke-{{ value.months }}, sesuai tier total pencapaian bulan-bulan itu.
            Satu bulan tidak capai, atau bonus sudah dibayar (otomatis atau diberikan manual), membuat hitungan mulai lagi dari bulan berikutnya.
            Bonus yang diberikan manual di halaman Bonus Konsistensi menggantikan bonus otomatis di bulan itu.
        </p>
        <UCheckbox v-model="value.enabled" label="Hitung Bonus Konsistensi otomatis" :disabled="disabled" />
        <RuleNumber v-model="value.months" label="Jumlah bulan berturut-turut" :step="1" :max="12" :disabled="disabled" />
        <RuleNumber v-model="value.minPerMonth" label="Pencapaian New minimal per bulan (≥)" :step="1" :max="null" :disabled="disabled" />
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
</script>
