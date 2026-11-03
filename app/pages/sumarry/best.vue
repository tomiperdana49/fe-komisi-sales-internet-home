<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Best of The Month</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Account Manager dan Sales Manager terbaik {{ selectedMonthLabel }} {{ year }}: layanan baru terbanyak dan subscription new (sudah bayar) terbesar, gabungan semua cabang lalu per cabang, atau pilih satu cabang di filter. Nilai sama = juara bersama.
                            <span v-if="ongoing" class="block text-sky-600 dark:text-sky-400">Periode masih berjalan sampai {{ shortDate(periodEndDate(year, selectedMonth)) }} — peringkat masih sementara.</span>
                        </p>
                    </div>
                    <BranchFilter :branches="[...sales, ...managers].map(r => r.branch)" />
                </div>

                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ allBranches ? 'Semua Cabang' : `Cabang ${branch}` }}</h3>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <UCard v-for="award in awards" :key="award.title">
                        <div class="flex items-start justify-between gap-2">
                            <div>
                                <p class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">{{ award.role }}</p>
                                <h3 class="text-base font-semibold text-gray-900 dark:text-white">{{ award.title }}</h3>
                            </div>
                            <UIcon name="i-lucide-trophy" class="size-6 text-amber-500 shrink-0" />
                        </div>

                        <div v-if="award.winners.length" class="mt-4 space-y-3">
                            <NuxtLink
                                v-for="w in award.winners"
                                :key="w.employeeId"
                                :to="`/${w.employeeId}/${award.page}`"
                                class="flex items-center gap-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 group"
                            >
                                <UAvatar :src="w.photoProfile" :alt="w.name" size="lg" />
                                <div class="min-w-0 flex-1">
                                    <p class="font-semibold text-gray-900 dark:text-white group-hover:text-primary-500 truncate">{{ w.name }}</p>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ w.employeeId }}<template v-if="w.branch"> · {{ w.branch }}</template></p>
                                </div>
                                <p class="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400 text-right">{{ award.format(award.value(w)) }}</p>
                            </NuxtLink>
                        </div>
                        <p v-else class="mt-4 text-sm text-gray-500 dark:text-gray-400">{{ award.empty }}</p>

                        <ol v-if="award.runnersUp.length" class="mt-4 divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                            <li v-for="r in award.runnersUp" :key="r.row.employeeId" class="flex items-center gap-3 py-1.5">
                                <span class="w-5 text-gray-400 tabular-nums">{{ r.rank }}</span>
                                <NuxtLink :to="`/${r.row.employeeId}/${award.page}`" class="flex-1 truncate text-gray-700 dark:text-gray-300 hover:text-primary-500">{{ r.row.name }}</NuxtLink>
                                <span class="tabular-nums text-gray-600 dark:text-gray-400">{{ award.format(award.value(r.row)) }}</span>
                            </li>
                        </ol>
                    </UCard>
                </div>

                <template v-if="allBranches">
                    <h3 class="pt-2 text-lg font-semibold text-gray-900 dark:text-white">Per Cabang</h3>
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <UCard v-for="b in branches" :key="b.branch">
                            <template #header>
                                <div class="flex items-center justify-between gap-2">
                                    <h4 class="font-semibold text-gray-900 dark:text-white">{{ b.branch }}</h4>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ b.amCount }} AM · {{ b.smCount }} SM</span>
                                </div>
                            </template>
                            <dl class="divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                                <div v-for="award in b.awards" :key="award.title" class="py-2 first:pt-0 last:pb-0">
                                    <dt class="text-xs text-gray-500 dark:text-gray-400">{{ award.title }}</dt>
                                    <dd v-if="award.winners.length" class="space-y-1 mt-1">
                                        <div v-for="w in award.winners" :key="w.employeeId" class="flex items-center gap-2">
                                            <UIcon name="i-lucide-trophy" class="size-4 text-amber-500 shrink-0" />
                                            <NuxtLink :to="`/${w.employeeId}/${award.page}`" class="flex-1 truncate font-medium text-gray-900 dark:text-white hover:text-primary-500">{{ w.name }}</NuxtLink>
                                            <span class="tabular-nums font-semibold text-amber-600 dark:text-amber-400">{{ award.format(award.value(w)) }}</span>
                                        </div>
                                    </dd>
                                    <dd v-else class="mt-1 text-gray-400">{{ award.empty }}</dd>
                                </div>
                            </dl>
                        </UCard>
                    </div>
                </template>
            </div>
        </UContainer>
    </div>
</template>

<script setup lang="ts">
import { SummaryService } from '~/services/summary-service'
import { branchLabel, useBranchFilter } from '~/composables/useBranchFilter'
import type { ManagerSummaryItem, SalesSummaryItem } from '~/types/summary'

definePageMeta({
    headerProps: { toolbar: true }
})

type Person = SalesSummaryItem | ManagerSummaryItem

const { setLoading } = useLoading()
const { formatCurrency } = useFormat()
const summaryService = new SummaryService()

const { monthLabel, isPeriodOngoing, periodEndDate, shortDate } = usePeriodOptions()
const { year, month: selectedMonth } = useSelectedPeriod()
const ongoing = computed(() => isPeriodOngoing(year.value, selectedMonth.value))
const selectedMonthLabel = computed(() => monthLabel(selectedMonth.value))

const sales = ref<SalesSummaryItem[]>([])
const managers = ref<ManagerSummaryItem[]>([])

// SDRs are commissioned on their own rules, so they don't compete with Account Managers.
const accountManagers = computed(() => sales.value.filter(r => !r.isSdr))

const RUNNERS_UP = 4

/** Everyone tied on the top value wins; the next few, ranked by the same value, are listed below. */
const rank = (rows: Person[], value: (r: Person) => number) => {
    const sorted = rows.filter(r => value(r) > 0).sort((a, b) => value(b) - value(a) || a.name.localeCompare(b.name))
    const top = sorted.length ? value(sorted[0]!) : 0
    const winners = sorted.filter(r => value(r) === top)
    // Competition ranking: ties share a rank, the next distinct value skips ahead (1, 1, 3).
    const runnersUp = sorted.slice(winners.length, winners.length + RUNNERS_UP)
        .map(row => ({ row, rank: sorted.findIndex(r => value(r) === value(row)) + 1 }))
    return { winners, runnersUp }
}

const services = (r: Person) => r.activityCount
const subscription = (r: Person) => r.newSubscription
const servicesLabel = (v: number) => `${v} layanan`

const emptyText = (pool: Person[], role: string) =>
    pool.length ? 'Belum ada pencapaian pada periode ini.' : `Tidak ada ${role} di cabang ini.`

const awardsFor = (ams: Person[], sms: Person[]) => [
    { role: 'Account Manager', title: 'Best New Service Of The Month', page: 'sales', value: services, format: servicesLabel, empty: emptyText(ams, 'Account Manager'), ...rank(ams, services) },
    { role: 'Account Manager', title: 'Best New Subscription Billing Paid Of The Month', page: 'sales', value: subscription, format: formatCurrency, empty: emptyText(ams, 'Account Manager'), ...rank(ams, subscription) },
    { role: 'Sales Manager', title: 'Best New Service Of The Month Sales Manager', page: 'manager', value: services, format: servicesLabel, empty: emptyText(sms, 'Sales Manager'), ...rank(sms, services) },
    { role: 'Sales Manager', title: 'Best New Subscription Billing Paid Of The Month Sales Manager', page: 'manager', value: subscription, format: formatCurrency, empty: emptyText(sms, 'Sales Manager'), ...rank(sms, subscription) }
]

// The branch picked in the filter (shared with the other summary tabs) narrows the main cards
// to that branch's winners; "Semua Branch" shows the company-wide winners plus every branch below.
const { branch, byBranch } = useBranchFilter()
const allBranches = computed(() => branch.value === 'all')
const awards = computed(() => awardsFor(byBranch(accountManagers.value, r => r.branch), byBranch(managers.value, r => r.branch)))

// Each person competes in their own branch (an SM by the SM's branch, not their AMs'); biggest branch first.
const branches = computed(() => {
    const names = [...new Set([...accountManagers.value, ...managers.value].map(r => branchLabel(r.branch)))]
    return names
        .map((branch) => {
            const ams = accountManagers.value.filter(r => branchLabel(r.branch) === branch)
            const sms = managers.value.filter(r => branchLabel(r.branch) === branch)
            return { branch, amCount: ams.length, smCount: sms.length, awards: awardsFor(ams, sms) }
        })
        .sort((a, b) => b.amCount - a.amCount || a.branch.localeCompare(b.branch))
})

const fetchSummary = async () => {
    setLoading(true)
    try {
        const params = { month: selectedMonth.value, year: year.value }
        const [s, m] = await Promise.all([summaryService.salesSummary(params), summaryService.managerSummary(params)])
        sales.value = s?.data ?? []
        managers.value = m?.data ?? []
    } finally {
        setLoading(false)
    }
}

onMounted(fetchSummary)
watch([year, selectedMonth], fetchSummary)
</script>
