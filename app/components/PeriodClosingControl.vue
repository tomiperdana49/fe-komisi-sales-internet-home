<template>
    <div class="flex items-center gap-2">
        <UBadge
            v-if="closing"
            color="neutral"
            variant="subtle"
            icon="i-lucide-lock"
            :title="`Ditutup oleh ${closing.closedBy} pada ${shortDate(new Date(closing.closedAt))}`"
        >
            Ditutup
        </UBadge>
        <UButton
            :icon="closing ? 'i-lucide-lock-open' : 'i-lucide-lock'"
            :color="closing ? 'neutral' : 'warning'"
            variant="soft"
            size="sm"
            :loading="loading"
            @click="isOpen = true"
        >
            {{ closing ? 'Buka kembali' : 'Tutup periode' }}
        </UButton>

        <UModal
            v-model:open="isOpen"
            :title="closing ? `Buka kembali periode ${label}?` : `Tutup periode ${label}?`"
            :description="closing
                ? 'Data periode ini akan kembali ditarik ulang dari NIS oleh job per jam, sehingga angkanya bisa berubah.'
                : 'Job per jam tidak akan menarik ulang data periode ini lagi, sehingga angkanya tidak berubah. Lakukan setelah komisi periode ini final.'"
        >
            <template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <UButton color="neutral" variant="ghost" @click="isOpen = false">Batal</UButton>
                    <UButton :color="closing ? 'primary' : 'warning'" :loading="loading" @click="toggle">
                        {{ closing ? 'Buka kembali' : 'Tutup periode' }}
                    </UButton>
                </div>
            </template>
        </UModal>
    </div>
</template>

<script setup lang="ts">
import { SummaryService } from '~/services/summary-service'
import type { PeriodClosing } from '~/types/summary'

const props = defineProps<{ month: number, year: number }>()

const summaryService = new SummaryService()
const toast = useToast()
const { monthLabel, shortDate } = usePeriodOptions()

const closings = ref<PeriodClosing[]>([])
const loading = ref(false)
const isOpen = ref(false)

const period = computed(() => `${props.year}${String(props.month).padStart(2, '0')}`)
const label = computed(() => `${monthLabel(props.month)} ${props.year}`)
const closing = computed(() => closings.value.find(c => c.period === period.value) ?? null)

async function load() {
    const response = await summaryService.periodClosings()
    closings.value = response?.data ?? []
}

async function toggle() {
    loading.value = true
    try {
        if (closing.value) {
            await summaryService.reopenPeriod({ period: period.value })
            toast.add({ title: 'Periode dibuka kembali', description: `${label.value} akan ditarik ulang oleh job per jam.`, color: 'success' })
        } else {
            await summaryService.closePeriod({ period: period.value })
            toast.add({ title: 'Periode ditutup', description: `${label.value} tidak akan ditarik ulang lagi.`, color: 'success' })
        }
        await load()
        isOpen.value = false
    } finally {
        loading.value = false
    }
}

onMounted(load)
</script>
