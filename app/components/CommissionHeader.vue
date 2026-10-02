<template>
    <div class="md:py-8 py-2">
        <div class="flex sm:flex-row flex-col sm:items-end justify-between gap-4">
            <div class="flex items-center gap-2">
                <UButton icon="i-lucide-arrow-left" size="lg" color="neutral" variant="ghost" @click="goBack"/>
                <div class="flex items-center gap-1">
                    <UUser
                        :avatar="{
                            src: employee?.photo_profile,
                            icon: 'i-lucide-image'
                        }"
                        :ui="{ avatar: 'h-10 w-10' }"
                    />
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                                Komisi {{ employee?.name }}
                        </h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            {{ subtitle }}                  
                        </p>
                    </div>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <slot name="controls" />
                <USelectMenu v-model="selectedYear" :items="yearItems" class="w-28" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { Employee } from '~/types/employee'

const props = defineProps<{
    employee: Employee | undefined
    subtitle: string
    yearItems: number[]
}>()

const selectedYear = defineModel<number>('year')

const router = useRouter()

const goBack = () => {
    if (window.history.length > 1 && window.history.state?.back) {
        router.back()
    } else {
        router.push('/')
    }
}
</script>
