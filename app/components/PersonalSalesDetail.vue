<template>
    <div class="space-y-6 md:space-y-8">
        <!-- Ringkasan: pencapaian, layanan baru, jumlah transaksi -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <!-- Pencapaian -->
            <div class="space-y-3 md:space-y-4">
                <h4 class="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <UIcon name="i-heroicons-trophy" class="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                    Pencapaian Bulan Ini
                </h4>
                <div class="p-4 md:p-5 rounded-xl md:rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
                    <div class="flex items-end justify-between gap-4">
                        <div>
                            <p class="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                <TermHint term="activity">Pencapaian New</TermHint>
                            </p>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white leading-none tabular-nums">
                                {{ data.activityCount }}
                                <span class="text-sm font-medium text-gray-500 dark:text-gray-400">{{ data.target > 0 ? `/ ${data.target} layanan` : 'layanan' }}</span>
                            </p>
                        </div>
                        <span
                            v-if="ongoing"
                            class="text-xs font-bold uppercase px-2.5 py-1 rounded-md border bg-gray-50 dark:bg-gray-800 text-right text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800"
                            :title="`Status final setelah ${shortDate(new Date(data.endDate))}. Sementara: ${data.achievementStatus}`"
                        >
                            Berjalan
                        </span>
                        <span v-else :class="['text-xs font-bold uppercase px-2.5 py-1 rounded-md border bg-gray-50 dark:bg-gray-800 text-right', getAchievementBadgeClass(data.achievementStatus)]">
                            {{ data.achievementStatus }}
                        </span>
                    </div>
                    <div v-if="data.target > 0" class="space-y-2">
                        <div class="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                                class="h-full"
                                :class="data.activityCount >= data.target ? 'bg-green-500' : ongoing ? 'bg-sky-500' : 'bg-red-500'"
                                :style="{ width: targetProgress + '%' }"
                            />
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ targetGapText }}</p>
                    </div>
                    <div v-if="data.manualTarget" class="flex justify-between items-center gap-3 text-sm">
                        <span class="text-gray-500 dark:text-gray-400">Target khusus</span>
                        <span class="flex items-center gap-2">
                            <UBadge color="primary" variant="subtle" size="sm">{{ manualRangeLabel }}</UBadge>
                            <span class="font-semibold text-gray-900 dark:text-white tabular-nums">{{ data.manualTarget.target }}</span>
                        </span>
                    </div>
                    <div class="flex justify-between text-sm">
                        <span class="text-gray-500 dark:text-gray-400">Status Karyawan</span>
                        <span class="font-semibold text-gray-900 dark:text-white">{{ data.status ?? '-' }}</span>
                    </div>
                    <p v-if="ongoing" class="text-xs text-sky-600 dark:text-sky-400">
                        Periode berjalan sampai {{ shortDate(new Date(data.endDate)) }}. Status pencapaian ditentukan setelah periode berakhir.
                    </p>
                    <p class="pt-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-300 italic">
                        "{{ ongoing ? 'Periode masih berjalan — terus semangat!' : data.motivation }}"
                    </p>
                </div>
            </div>

            <!-- Layanan baru per produk -->
            <div class="space-y-3 md:space-y-4">
                <h4 class="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <UIcon name="i-heroicons-chart-bar" class="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                    Layanan Baru per Produk
                </h4>
                <div class="grid grid-cols-1 gap-2 md:gap-3">
                    <div
                        v-for="group in serviceGroupOrder"
                        :key="group"
                        :class="['p-3 md:p-4 rounded-lg md:rounded-xl border flex justify-between items-center', groupColor[group]!.bg]"
                    >
                        <span :class="['text-sm font-semibold', groupColor[group]!.text]">
                            {{ group }}
                            <span v-if="group === 'NusaSelecta' && nusaSelectaUnits > 0" class="block text-xs font-normal opacity-80">
                                {{ nusaSelectaUnits }} unit terjual
                            </span>
                        </span>
                        <span :class="['text-lg sm:text-xl font-bold', groupColor[group]!.textStrong]">
                            {{ data.byServiceGroup[group]?.new.count ?? 0 }}
                        </span>
                    </div>
                </div>
                <p v-if="nusaSelectaUnits > 0" class="text-xs text-gray-500 dark:text-gray-400">
                    Angka di kanan = pencapaian New. NusaSelecta dihitung berkelompok: 3 unit Basic/Prime atau 2 unit Ultra = 1 pencapaian.
                    Setiap unit tetap mendapat komisi, sehingga jumlah invoice di tab New bisa lebih banyak dari pencapaian.
                </p>
            </div>

            <!-- Jumlah transaksi per kategori -->
            <div class="space-y-3 md:space-y-4">
                <h4 class="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <UIcon name="i-heroicons-rectangle-stack" class="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                    Jumlah Transaksi per Kategori
                </h4>
                <div class="grid grid-cols-2 gap-2 md:gap-3">
                    <div
                        v-for="cat in categoryCards"
                        :key="cat.label"
                        :class="['flex justify-between items-center p-2 md:p-3 rounded-lg md:rounded-xl border', cat.color.bg]"
                    >
                        <span :class="['text-xs font-medium uppercase', cat.color.text]">
                            <TermHint :term="cat.hint">{{ cat.label }}</TermHint>
                        </span>
                        <span :class="['text-sm font-bold px-2 py-0.5 rounded bg-white/50 dark:bg-black/20', cat.color.textStrong]">{{ cat.count }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Rincian keuangan -->
        <div>
            <h4 class="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-3 md:mb-4">
                <UIcon name="i-heroicons-banknotes" class="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                Rincian Keuangan
            </h4>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div
                    v-for="box in financialBoxes"
                    :key="box.title"
                    :class="['p-4 md:p-5 rounded-xl border', box.class]"
                >
                    <h5 :class="['text-xs font-bold uppercase tracking-wider mb-3 pb-2 border-b', box.negative ? 'text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/40' : 'text-gray-500 border-gray-200 dark:border-gray-700']">
                        {{ box.title }}
                    </h5>
                    <p v-if="box.rows.length === 0" class="text-sm text-gray-400 dark:text-gray-500">{{ box.empty ?? 'Tidak ada data' }}</p>
                    <ul v-else class="space-y-2">
                        <li v-for="row in box.rows" :key="row.label" class="flex justify-between items-center gap-3 text-sm">
                            <span class="text-gray-600 dark:text-gray-400">
                                <TermHint v-if="row.hint" :term="row.hint">{{ row.label }}</TermHint>
                                <template v-else>{{ row.label }}</template>
                            </span>
                            <span :class="['font-semibold tabular-nums', box.negative ? 'text-red-500 dark:text-red-400' : row.value === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white']">
                                {{ box.negative && row.value ? '−' : '' }}{{ box.isCount ? `${row.value} layanan` : formatCurrency(row.value) }}
                            </span>
                        </li>
                        <li v-if="box.total !== undefined" class="flex justify-between items-center text-sm pt-3 mt-1 border-t border-gray-200 dark:border-gray-700">
                            <span class="font-bold text-gray-900 dark:text-white">{{ box.totalLabel ?? 'Total' }}</span>
                            <span :class="['font-bold tabular-nums', box.negative ? 'text-red-600 dark:text-red-400' : 'text-primary-600 dark:text-primary-400']">
                                {{ box.negative && box.total ? '−' : '' }}{{ formatCurrency(box.total) }}
                            </span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { ChurnRow, SalesCommissionData } from '~/types/sales'
import type { GlossaryKey } from '~/composables/useGlossary'

const props = defineProps<{
    data: SalesCommissionData
    churnData: ChurnRow[]
}>()

const { formatCurrency } = useFormat()
const { getAchievementBadgeClass } = useAchievementColor()
const { isOngoingUntil, shortDate, monthLabel } = usePeriodOptions()
const ongoing = computed(() => isOngoingUntil(props.data.endDate))

const targetProgress = computed(() => Math.min(100, Math.max(0, (props.data.activityCount / props.data.target) * 100)))
const targetGapText = computed(() => {
    const gap = props.data.target - props.data.activityCount
    if (gap <= 0) return `Target ${props.data.target} layanan tercapai.`
    return ongoing.value
        ? `Kurang ${gap} layanan lagi untuk capai target.`
        : `Kurang ${gap} layanan dari target.`
})
// Admin-set target (Target AM page): shown with its range so the AM knows when it reverts to the default.
const periodShort = (period: string) => `${monthLabel(Number(period.slice(4, 6))).slice(0, 3)} ${period.slice(0, 4)}`
const manualRangeLabel = computed(() => {
    const m = props.data.manualTarget
    if (!m) return ''
    return m.startPeriod === m.endPeriod ? periodShort(m.startPeriod) : `${periodShort(m.startPeriod)} – ${periodShort(m.endPeriod)}`
})
// While the period runs the motivation line (tied to the provisional status, e.g. SP1) is swapped for a neutral one in the template.
// NusaSelecta units sold vs. the grouped achievement shown next to it.
const nusaSelectaUnits = computed(() => (props.data.nusaSelectaNewUnits?.basicPrime ?? 0) + (props.data.nusaSelectaNewUnits?.ultra ?? 0))

const serviceGroupOrder = ['Home', 'NusaSelecta', 'Nusafiber'] as const
// Recurring-only: carves Digital Business and Access Business out of Home (KOMISI.md 3) — New-side boxes stay on the 3-way serviceGroupOrder above.
const recurringServiceGroupOrder = ['Home', 'NusaSelecta', 'Nusafiber', 'Digital Business', 'Access Business'] as const
const groupColor: Record<string, { bg: string; text: string; textStrong: string }> = {
    Home: { bg: 'bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-800', text: 'text-sky-700 dark:text-sky-300', textStrong: 'text-sky-900 dark:text-sky-100' },
    NusaSelecta: { bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800', text: 'text-orange-700 dark:text-orange-300', textStrong: 'text-orange-900 dark:text-orange-100' },
    Nusafiber: { bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800', text: 'text-purple-700 dark:text-purple-300', textStrong: 'text-purple-900 dark:text-purple-100' }
}

const categoryColor: Record<string, { bg: string; text: string; textStrong: string }> = {
    primary: { bg: 'bg-primary-50 dark:bg-primary-900/10 border-primary-100 dark:border-primary-800', text: 'text-primary-600 dark:text-primary-400', textStrong: 'text-primary-700 dark:text-primary-300' },
    orange: { bg: 'bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-800', text: 'text-orange-600 dark:text-orange-400', textStrong: 'text-orange-700 dark:text-orange-300' },
    purple: { bg: 'bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-800', text: 'text-purple-600 dark:text-purple-400', textStrong: 'text-purple-700 dark:text-purple-300' },
    indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-indigo-800', text: 'text-indigo-600 dark:text-indigo-400', textStrong: 'text-indigo-700 dark:text-indigo-300' },
    pink: { bg: 'bg-pink-50 dark:bg-pink-900/10 border-pink-100 dark:border-pink-800', text: 'text-pink-600 dark:text-pink-400', textStrong: 'text-pink-700 dark:text-pink-300' },
    teal: { bg: 'bg-teal-50 dark:bg-teal-900/10 border-teal-100 dark:border-teal-800', text: 'text-teal-600 dark:text-teal-400', textStrong: 'text-teal-700 dark:text-teal-300' }
}

const categoryCards = computed(() => {
    const b = props.data.breakdown
    return [
        { label: 'New', hint: 'new', count: b.new.count, color: categoryColor.primary! },
        { label: 'Recurring', hint: 'recurring', count: b.recurring.count, color: categoryColor.orange! },
        { label: 'Prorate', hint: 'prorate', count: b.prorate.count, color: categoryColor.purple! },
        { label: 'Upgrade', hint: 'upgrade', count: b.upgrade.count, color: categoryColor.indigo! },
        { label: 'Alat', hint: 'alat', count: b.alat.count, color: categoryColor.pink! },
        { label: 'Setup', hint: 'setup', count: b.setup.count, color: categoryColor.teal! }
    ] satisfies { label: string; hint: GlossaryKey; count: number; color: unknown }[]
})

const churnByService = computed(() => {
    const counts = new Map<string, number>()
    for (const c of props.churnData ?? []) {
        if (c.is_approved) continue
        const name = c.service_name ?? c.service_id ?? 'Unknown'
        counts.set(name, (counts.get(name) ?? 0) + 1)
    }
    return Array.from(counts.entries()).map(([label, value]) => ({ label, value }))
})

interface FinancialBox {
    title: string
    rows: { label: string; value: number; hint?: GlossaryKey }[]
    total?: number
    totalLabel?: string
    negative?: boolean
    isCount?: boolean
    empty?: string
    class: string
}

const plainBox = 'border-gray-200 dark:border-gray-800'
const negativeBox = 'border-red-100 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/10'

const financialBoxes = computed<FinancialBox[]>(() => {
    const data = props.data
    const b = data.breakdown
    const g = data.byServiceGroup
    return [
        {
            title: 'Komisi & Bonus',
            class: 'border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-950/10 lg:row-span-3',
            rows: [
                { label: 'New', hint: 'new', value: b.new.commission },
                { label: 'Prorate', hint: 'prorate', value: b.prorate.commission },
                { label: 'Recurring', hint: 'recurring', value: b.recurring.commission },
                { label: 'Upgrade', hint: 'upgrade', value: b.upgrade.commission },
                { label: 'Alat', hint: 'alat', value: b.alat.commission },
                { label: 'Setup', hint: 'setup', value: b.setup.commission },
                { label: 'Bonus Bulanan', hint: 'bonusBulanan', value: data.bonusBulanan },
                { label: 'Bonus Kelebihan Service', hint: 'bonusKelebihanService', value: data.bonusKelebihanService },
                { label: 'Bonus Konsistensi', hint: 'consistencyBonus', value: data.consistencyBonus }
            ],
            total: data.total.commission + data.bonusBulanan + data.bonusKelebihanService + data.consistencyBonus,
            totalLabel: 'Total Diterima'
        },
        {
            title: 'MRC Layanan Baru',
            class: plainBox,
            rows: [
                ...serviceGroupOrder.map(name => ({ label: name, value: g[name]?.new.mrc ?? 0 })),
                { label: 'Upgrade', value: b.upgrade.mrc }
            ],
            total: b.new.mrc + b.upgrade.mrc
        },
        {
            title: 'Subscription Layanan Baru',
            class: plainBox,
            rows: [
                ...serviceGroupOrder.map(name => ({ label: name, value: g[name]?.new.subscription ?? 0 })),
                { label: 'Prorate', value: b.prorate.subscription },
                { label: 'Upgrade', value: b.upgrade.subscription }
            ],
            total: b.new.subscription + b.prorate.subscription + b.upgrade.subscription
        },
        {
            title: 'Subscription Recurring',
            class: plainBox,
            rows: recurringServiceGroupOrder.map(name => ({ label: name, value: g[name]?.recurring.subscription ?? 0 })),
            total: b.recurring.subscription
        },
        {
            title: 'Subscription Alat & Setup',
            class: plainBox,
            rows: [
                { label: 'Alat', value: b.alat.subscription },
                { label: 'Setup', value: b.setup.subscription }
            ],
            total: b.alat.subscription + b.setup.subscription
        },
        {
            title: 'Potongan Churn',
            class: negativeBox,
            rows: [
                { label: 'Komisi', value: data.deduction.commission },
                { label: 'MRC', value: data.deduction.mrc },
                { label: 'Subscription', value: data.deduction.subscription }
            ],
            negative: true
        },
        {
            title: 'Layanan Churn',
            class: negativeBox,
            rows: churnByService.value,
            negative: true,
            isCount: true,
            empty: 'Tidak ada churn bulan ini 🎉'
        }
    ]
})
</script>
