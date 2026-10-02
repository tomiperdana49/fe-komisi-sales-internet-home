<template>
    <UFormField :label="label" :description="hint" :ui="{ root: 'flex items-center justify-between gap-4', wrapper: 'flex-1', container: 'w-32 shrink-0' }">
        <UInput
            v-model.number="value"
            type="number"
            :step="step"
            min="0"
            :max="max ?? undefined"
            :disabled="disabled"
            :ui="{ base: 'text-right' }"
        />
    </UFormField>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
    label: string
    hint?: string
    step?: number
    /** null = no upper bound (e.g. rupiah amounts) */
    max?: number | null
    disabled?: boolean
}>(), {
    step: 0.01,
    max: 100,
    disabled: false
})

const value = defineModel<number>({ required: true })
</script>
