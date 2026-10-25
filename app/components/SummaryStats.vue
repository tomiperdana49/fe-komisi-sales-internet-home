<template>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <component
            :is="stat.key ? 'button' : 'div'"
            v-for="stat in stats"
            :key="stat.label"
            :type="stat.key ? 'button' : undefined"
            :aria-pressed="stat.key ? active === stat.key : undefined"
            :class="[
                'p-4 rounded-xl border text-left',
                stat.key && active === stat.key
                    ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50/50 dark:bg-primary-950/30'
                    : 'border-gray-200 dark:border-gray-800',
                stat.key ? 'cursor-pointer hover:border-primary-400 transition-colors' : ''
            ]"
            @click="stat.key && emit('select', stat.key)"
        >
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{{ stat.label }}</p>
            <p :class="['text-xl md:text-2xl font-bold tabular-nums', stat.class ?? 'text-gray-900 dark:text-white']">{{ stat.value }}</p>
            <p v-if="stat.note" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ stat.note }}</p>
        </component>
    </div>
</template>

<script setup lang="ts">
// A stat with a `key` is clickable (e.g. to filter a table); `active` marks the selected one.
defineProps<{
    stats: { label: string; value: string | number; note?: string; class?: string; key?: string }[]
    active?: string
}>()
const emit = defineEmits<{ select: [key: string] }>()
</script>
