<template>
    <!-- Touch screens have no hover, so there a tap opens the full text in a popover instead. -->
    <UPopover v-if="text && !canHover && !hoverOnly" :content="{ side: 'top' }">
        <slot />
        <template #content>
            <p class="max-w-xs px-2.5 py-1.5 text-xs whitespace-normal break-words">{{ text }}</p>
        </template>
    </UPopover>
    <UTooltip
        v-else-if="text"
        :text="text"
        :delay-duration="0"
        :content="{ side: 'top' }"
        :ui="{ content: 'max-w-xs h-auto whitespace-normal', text: 'whitespace-normal' }"
    >
        <slot />
    </UTooltip>
    <slot v-else />
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

// Shows text cut off by truncate/line-clamp in full: on hover, or on tap on touch screens.
// hoverOnly: for text inside a link/button, where a tap must keep doing what the link/button does.
defineProps<{ text?: string | null, hoverOnly?: boolean }>()

const canHover = ref(true)
onMounted(() => {
    canHover.value = window.matchMedia('(hover: hover)').matches
})
</script>
