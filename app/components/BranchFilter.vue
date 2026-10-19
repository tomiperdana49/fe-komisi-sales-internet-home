<template>
    <USelectMenu v-model="branch" :items="items" value-key="value" icon="i-lucide-map-pin" :search-input="false" class="w-full sm:w-48" />
</template>

<script setup lang="ts">
const props = defineProps<{ branches: (string | null | undefined)[] }>()

const { branch, branchItems } = useBranchFilter()
const items = computed(() => branchItems(props.branches))
</script>
