<template>
    <ClientOnly>
        <Teleport v-if="isMounted" to="#toolbar-left">
            <nav class="flex items-center gap-1 overflow-x-auto">
                <UButton icon="i-lucide-arrow-left" size="lg" color="neutral" variant="ghost" to="/" aria-label="Kembali ke beranda" />
                <USeparator orientation="vertical" class="h-7 w-2" />
                <UButton
                    v-for="link in links"
                    :key="link.to"
                    :to="link.to"
                    :icon="link.icon"
                    :variant="route.path === link.to ? 'soft' : 'ghost'"
                    :color="route.path === link.to ? 'primary' : 'neutral'"
                    size="sm"
                    class="shrink-0"
                >
                    {{ link.label }}
                </UButton>
            </nav>
        </Teleport>
        <Teleport v-if="isMounted" to="#toolbar-right">
            <div class="flex items-center gap-2">
                <PeriodClosingControl :month="month" :year="year" />
                <USelectMenu v-model="month" :items="viewableMonths(year)" value-key="id" class="w-36" />
                <USelectMenu v-model="year" :items="yearItems" class="w-24" />
            </div>
        </Teleport>
    </ClientOnly>
</template>

<script setup lang="ts">
const month = defineModel<number>('month', { required: true })
const year = defineModel<number>('year', { required: true })

const route = useRoute()
const { viewableMonths, yearItems } = usePeriodOptions()

const links = [
    { to: '/sumarry/sales', icon: 'i-heroicons-users', label: 'Account Manager' },
    { to: '/sumarry/manager', icon: 'i-heroicons-presentation-chart-line', label: 'Sales Manager' },
    { to: '/sumarry/invoice', icon: 'i-heroicons-document-text', label: 'Invoice' },
    { to: '/sumarry/churn', icon: 'i-heroicons-archive-box-x-mark', label: 'Churn' },
    { to: '/sumarry/consistency-bonus', icon: 'i-heroicons-gift', label: 'Bonus Konsistensi' },
    { to: '/sumarry/target', icon: 'i-heroicons-flag', label: 'Target AM' },
    { to: '/sumarry/rules', icon: 'i-heroicons-adjustments-horizontal', label: 'Aturan Komisi' }
]

// The #toolbar-* targets live in AppHeader; wait a tick so they exist before teleporting.
const isMounted = ref(false)
onMounted(() => nextTick(() => { isMounted.value = true }))
</script>
