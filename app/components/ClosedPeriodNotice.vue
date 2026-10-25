<template>
    <UAlert
        v-if="selectedClosing"
        color="neutral"
        variant="subtle"
        icon="i-lucide-lock"
        title="Periode ini sudah ditutup"
        :description="`${describeClosing(selectedClosing)}. Data periode ini sudah final dan tidak bisa diubah. Super Admin dapat menekan Buka kembali di toolbar bila perlu koreksi.`"
    />
</template>

<script setup lang="ts">
const { selectedClosing, describeClosing } = usePeriodClosings()
</script>
