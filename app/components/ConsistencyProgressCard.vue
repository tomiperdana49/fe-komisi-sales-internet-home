<template>
    <UCard>
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-4">
            <div>
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">Bonus Konsistensi</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Blok {{ label(progress.blockStart) }} – {{ label(progress.blockEnd) }}, dinilai di periode {{ label(progress.blockEnd) }}.
                </p>
            </div>
            <UBadge :color="badge.color" variant="subtle" :label="badge.label" class="self-start" />
        </div>

        <UAlert v-if="message" :color="badge.color" variant="soft" :description="message" class="mb-4" />

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
                v-for="m in progress.months"
                :key="m.period"
                class="rounded-lg border p-3"
                :class="m.period === period ? 'border-primary-400 dark:border-primary-600' : 'border-gray-200 dark:border-gray-800'"
            >
                <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <span>{{ label(m.period) }}<span v-if="m.period === period"> (dipilih)</span></span>
                    <UIcon :name="monthIcon(m).name" :class="monthIcon(m).class" class="size-4" />
                </div>
                <p class="mt-1 text-xl font-semibold text-gray-900 dark:text-white">
                    <template v-if="m.activityCount !== null">{{ m.activityCount }}</template>
                    <template v-else>–</template>
                    <span class="text-sm font-normal text-gray-500 dark:text-gray-400"> / min {{ progress.minPerMonth }}</span>
                </p>
            </div>
        </div>

        <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div class="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 space-y-1">
                <p class="font-medium text-gray-900 dark:text-white">Total pencapaian blok: {{ total }}</p>
                <p v-for="t in progress.tiers" :key="t.at" class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                    <UIcon :name="total >= t.at ? 'i-lucide-circle-check' : 'i-lucide-circle'" :class="total >= t.at ? 'text-green-500' : 'text-gray-400'" class="size-4" />
                    Total ≥ {{ t.at }} → {{ formatCurrency(t.amount) }}
                </p>
                <p v-if="nextTier && progress.status === 'running'" class="text-gray-500 dark:text-gray-400">
                    Kurang {{ nextTier.at - total }} lagi untuk {{ formatCurrency(nextTier.amount) }}.
                </p>
            </div>
            <div v-if="progress.minTestimonials > 0" class="rounded-lg bg-gray-50 dark:bg-gray-900 p-3 space-y-1">
                <p class="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                    <UIcon :name="testimonialMet ? 'i-lucide-circle-check' : 'i-lucide-circle-alert'" :class="testimonialMet ? 'text-green-500' : 'text-orange-500'" class="size-4" />
                    Testimoni pelanggan: {{ progress.testimonials }} / min {{ progress.minTestimonials }}
                </p>
                <p class="text-gray-500 dark:text-gray-400">
                    Dihitung testimoni bertanggal {{ blockDates }}. Tambahkan lewat kartu Testimoni Pelanggan di bawah.
                </p>
            </div>
        </div>
    </UCard>
</template>

<script setup lang="ts">
import type { ConsistencyProgress } from '~/types/sales'

const props = defineProps<{
    progress: ConsistencyProgress
    /** The period selected on the page (YYYYMM). */
    period: string
}>()

const { formatCurrency } = useFormat()
const { periodLabel: label, shiftPeriod: shift, blockTotal, blockDates: datesOf } = useConsistencyProgress()

const total = computed(() => blockTotal(props.progress))
const nextTier = computed(() => props.progress.tiers.find(t => total.value < t.at) ?? null)
const testimonialMet = computed(() => props.progress.testimonials >= props.progress.minTestimonials)
const missedMonth = computed(() => props.progress.months.find(m => m.period < props.period && ((m.activityCount ?? 0) < props.progress.minPerMonth || m.belowNonNusaSelecta)))

const blockDates = computed(() => datesOf(props.progress))

const monthIcon = (m: ConsistencyProgress['months'][number]) => {
    if (m.activityCount === null) return { name: 'i-lucide-clock', class: 'text-gray-400' }
    if (m.activityCount >= props.progress.minPerMonth && !m.belowNonNusaSelecta) return { name: 'i-lucide-circle-check', class: 'text-green-500' }
    if (m.period >= props.period) return { name: 'i-lucide-hourglass', class: 'text-orange-500' }
    return { name: 'i-lucide-circle-x', class: 'text-red-500' }
}

const badge = computed((): { color: 'success' | 'error' | 'neutral' | 'warning' | 'info', label: string } => {
    switch (props.progress.status) {
        case 'failed': return { color: 'error', label: 'Blok tidak dapat' }
        case 'manual': return { color: 'success', label: 'Diberikan manual' }
        case 'notStarted': return { color: 'neutral', label: 'Belum mulai' }
        default: return { color: 'info', label: 'Berjalan' }
    }
})

const message = computed(() => {
    const p = props.progress
    switch (p.status) {
        case 'failed':
            return `${label(missedMonth.value!.period)} ${(missedMonth.value!.activityCount ?? 0) < p.minPerMonth ? `di bawah ${p.minPerMonth}` : 'kurang service non-NusaSelecta'}, jadi blok ini tidak dapat bonus. Hitungan mulai lagi di blok ${label(shift(p.blockEnd, 1))} – ${label(shift(p.blockEnd, p.months.length))}.`
        case 'manual':
            return 'Bonus Konsistensi periode ini sudah diberikan manual oleh admin. Blok berikutnya mulai bulan depan.'
        case 'notStarted':
            return `Blok pertama dimulai ${label(p.blockStart)}.`
        default:
            return `Syarat bonus: setiap bulan minimal ${p.minPerMonth}${p.minNonNusaSelecta ? ` dengan minimal ${p.minNonNusaSelecta} service non-NusaSelecta` : ''}, total blok minimal ${p.tiers[0]?.at ?? 0}${p.minTestimonials > 0 ? `, dan minimal ${p.minTestimonials} testimoni pelanggan` : ''}. Angka bulan berjalan masih bisa berubah sampai periodenya ditutup.`
    }
})
</script>
