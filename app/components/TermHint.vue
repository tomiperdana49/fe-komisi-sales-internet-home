<template>
    <UTooltip :text="explain(term)" :content="{ side: 'top' }" :ui="{ content: 'max-w-xs h-auto whitespace-normal', text: 'whitespace-normal' }">
        <span class="inline-flex items-center gap-1 cursor-help">
            <slot />
            <UIcon name="i-lucide-info" class="size-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
        </span>
    </UTooltip>
</template>

<script setup lang="ts">
import type { GlossaryKey } from '~/composables/useGlossary'

defineProps<{ term: GlossaryKey }>()

const { explain } = useGlossary()
</script>
