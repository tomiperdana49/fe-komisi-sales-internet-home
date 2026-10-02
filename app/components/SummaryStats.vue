<template>
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
            v-for="stat in stats"
            :key="stat.label"
            class="p-4 rounded-xl border border-gray-200 dark:border-gray-800"
        >
            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{{ stat.label }}</p>
            <p :class="['text-xl md:text-2xl font-bold tabular-nums', stat.class ?? 'text-gray-900 dark:text-white']">{{ stat.value }}</p>
            <p v-if="stat.note" class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ stat.note }}</p>
        </div>
    </div>
</template>

<script setup lang="ts">
defineProps<{
    stats: { label: string; value: string | number; note?: string; class?: string }[]
}>()
</script>
