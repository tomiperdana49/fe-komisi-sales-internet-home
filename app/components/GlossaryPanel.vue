<template>
    <UCollapsible class="rounded-lg border border-gray-200 dark:border-gray-800">
        <UButton
            label="Penjelasan istilah"
            icon="i-lucide-book-open"
            trailing-icon="i-lucide-chevron-down"
            color="neutral"
            variant="ghost"
            block
            class="justify-start group"
            :ui="{ trailingIcon: 'ms-auto group-data-[state=open]:rotate-180 transition-transform' }"
        />
        <template #content>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 px-4 pb-4 pt-1 text-sm">
                <div v-for="entry in entries(terms)" :key="entry.term">
                    <dt class="font-semibold text-gray-900 dark:text-white">{{ entry.term }}</dt>
                    <dd class="text-gray-600 dark:text-gray-400">{{ entry.text }}</dd>
                </div>
            </dl>
        </template>
    </UCollapsible>
</template>

<script setup lang="ts">
import type { GlossaryKey } from '~/composables/useGlossary'

defineProps<{ terms?: GlossaryKey[] }>()

const { entries } = useGlossary()
</script>
