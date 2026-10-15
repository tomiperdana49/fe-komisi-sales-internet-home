<template>
    <!-- Touch screens have no hover and Reka's tooltip ignores taps, so there a tap opens the explanation in a popover. -->
    <UPopover v-if="!canHover" :content="{ side: 'top' }">
        <span role="button" tabindex="0" class="inline-flex items-center gap-1 cursor-help" @click.stop>
            <slot />
            <UIcon name="i-lucide-info" class="size-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
        </span>
        <template #content>
            <p class="max-w-[min(24rem,calc(100vw-2rem))] px-2.5 py-1.5 text-xs whitespace-normal break-words">{{ explain(term) }}</p>
        </template>
    </UPopover>
    <UTooltip v-else :text="explain(term)" :content="{ side: 'top' }" :ui="{ content: 'max-w-sm h-auto whitespace-normal', text: 'whitespace-normal' }">
        <span tabindex="0" class="inline-flex items-center gap-1 cursor-help">
            <slot />
            <UIcon name="i-lucide-info" class="size-3.5 shrink-0 text-gray-400 dark:text-gray-500" />
        </span>
    </UTooltip>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { GlossaryKey } from '~/composables/useGlossary'

defineProps<{ term: GlossaryKey }>()

const { explain } = useGlossary()

// Same check as TextTooltip: phones and tablets report no hover.
const canHover = ref(true)
onMounted(() => {
    canHover.value = window.matchMedia('(hover: hover)').matches
})
</script>
