<template>
    <div class="flex items-center gap-2">
        <UTooltip v-if="closing" :text="describeClosing(closing)" :delay-duration="0">
            <UBadge color="neutral" variant="subtle" icon="i-lucide-lock" class="cursor-help">
                Ditutup
            </UBadge>
        </UTooltip>
        <UButton
            v-if="isSuperAdmin"
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
            v-if="isSuperAdmin"
            v-model:open="isOpen"
            :title="closing ? `Buka kembali periode ${label}?` : `Tutup periode ${label}?`"
            :description="closing
                ? 'Data periode ini akan kembali ditarik ulang dari NIS oleh job per jam dan bisa diubah lagi, sehingga angkanya bisa berubah.'
                : 'Job per jam tidak akan menarik ulang data periode ini lagi, dan approve invoice, bebaskan churn, serta Bonus Konsistensi periode ini dikunci, sehingga angkanya tidak berubah. Lakukan setelah komisi periode ini final.'"
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

const props = defineProps<{ month: number, year: number }>()

const summaryService = new SummaryService()
const toast = useToast()
const { isSuperAdmin } = useAdminAccess()
const { monthLabel } = usePeriodOptions()

const { load, closingOf, describeClosing } = usePeriodClosings()
const loading = ref(false)
const isOpen = ref(false)

const period = computed(() => `${props.year}${String(props.month).padStart(2, '0')}`)
const label = computed(() => `${monthLabel(props.month)} ${props.year}`)
const closing = computed(() => closingOf(period.value))

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
