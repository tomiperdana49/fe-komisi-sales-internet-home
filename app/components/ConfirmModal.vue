

<template>
    <UModal
        :ui="{
            overlay: 'bg-white/45 dark:bg-black/45 backdrop-blur-xs'
        }"
    >
        <template #content>
        <div class="p-5">
            <div class="space-y-1">
            <h3 class="text-lg font-semibold">
                {{ title }}
            </h3>
            <p v-if="description" class="text-gray-500 text-sm">
                {{ description }}
            </p>
            </div>
            <div class="flex justify-end gap-2 mt-4">
            <UButton
                :label="cancelLabel"
                color="neutral"
                variant="subtle"
                @click="handleCancel"
            />
            <UButton
                :label="confirmLabel"
                color="error"
                variant="solid"
                loading-auto
                @click="handleConfirm"
            />
            </div>
        </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
    title?: string
    description?: string
    confirmLabel?: string
    cancelLabel?: string
    onConfirm?: () => Promise<void> | void
}>(), {
    title: 'Confirm',
    description: 'Are you sure?',
    confirmLabel: 'Confirm',
    cancelLabel: 'Cancel'
})

const emit = defineEmits(['update:open'])

async function handleConfirm() {
    if (props.onConfirm) await props.onConfirm()
}

function handleCancel() {
    emit('update:open', false)
}
</script>