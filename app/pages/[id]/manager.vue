<template>
    <UContainer>
        <HeroBackground />
        <CommissionHeader
            :employee="employee"
            v-model:year="year"
            :year-items="yearItems"
            subtitle="Komisi manager dari penjualan pribadi dan capaian tim"
        >
            <template #controls>
                <USelectMenu v-model="selectedMonth" value-key="id" :items="monthSelect" class="w-36" />
            </template>
        </CommissionHeader>

        <div class="py-2 grid grid-cols-1 gap-4">
            <UPageCard v-if="periodData">
                <template #default>
                    <!-- Total & cara menghitungnya -->
                    <div class="border-b border-gray-100 dark:border-gray-800 pb-4 md:pb-6 space-y-4">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Periode Perhitungan</p>
                                <p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                    {{ formatDate(periodData.startDate) }} – {{ formatDate(periodData.endDate) }}
                                </p>
                            </div>
                            <div class="md:text-right">
                                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Komisi Manager</p>
                                <p class="text-3xl md:text-4xl font-bold text-primary-500 dark:text-primary-400 tabular-nums">
                                    {{ formatCurrency(periodData.totalCommission) }}
                                </p>
                            </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2 text-sm">
                            <template v-for="(part, idx) in totalParts" :key="part.label">
                                <span v-if="idx > 0" class="text-gray-400 font-semibold">+</span>
                                <span class="inline-flex flex-col px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                    <span class="text-[11px] text-gray-500 dark:text-gray-400">
                                        <TermHint :term="part.hint">{{ part.label }}</TermHint>
                                    </span>
                                    <span class="font-semibold tabular-nums text-gray-900 dark:text-white">{{ formatCurrency(part.value) }}</span>
                                </span>
                            </template>
                            <span class="text-gray-400 font-semibold">=</span>
                            <span class="inline-flex flex-col px-3 py-1.5 rounded-lg border border-primary-200 dark:border-primary-800 bg-primary-50 dark:bg-primary-950/20">
                                <span class="text-[11px] text-primary-700 dark:text-primary-300">Total</span>
                                <span class="font-bold tabular-nums text-primary-600 dark:text-primary-400">{{ formatCurrency(periodData.totalCommission) }}</span>
                            </span>
                        </div>
                    </div>

                    <!-- Capaian, target, dan rincian overriding -->
                    <div class="mt-4 md:mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                            <div class="flex justify-between items-center mb-4">
                                <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider">Capaian Tim</h4>
                                <UBadge :color="periodData.team.isTargetAchieved ? 'success' : 'error'" variant="subtle">
                                    {{ periodData.team.isTargetAchieved ? 'Capai Target' : 'Tidak Capai Target' }}
                                </UBadge>
                            </div>
                            <p class="text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
                                {{ periodData.team.activityCount }}
                                <span class="text-base font-medium text-gray-500 dark:text-gray-400">/ {{ periodData.team.finalTarget }} layanan baru</span>
                            </p>
                            <div class="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mt-3">
                                <div
                                    class="h-full"
                                    :class="periodData.team.isTargetAchieved ? 'bg-green-500' : 'bg-red-500'"
                                    :style="{ width: targetProgress + '%' }"
                                />
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {{ targetGapText }}
                            </p>
                            <div class="flex justify-between items-center text-sm mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <span class="text-gray-600 dark:text-gray-400">
                                    <TermHint term="teamAchievement">Capaian vs Target Dasar</TermHint>
                                </span>
                                <span class="font-bold text-gray-900 dark:text-white">{{ Math.round(periodData.team.achievementPercentage) }}%</span>
                            </div>
                        </div>

                        <div class="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Komposisi Tim & Target</h4>
                            <ul class="space-y-2.5 text-sm">
                                <li class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400"><TermHint term="teamSize">Jumlah AM</TermHint></span>
                                    <span class="font-semibold text-gray-900 dark:text-white">
                                        {{ periodData.team.totalCount }}
                                        <span class="font-normal text-gray-500">({{ periodData.team.permanentCount }} Permanent, {{ periodData.team.nonPermanentCount }} Probation)</span>
                                    </span>
                                </li>
                                <li class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400"><TermHint term="baseTarget">Target Dasar</TermHint></span>
                                    <span class="font-semibold text-gray-900 dark:text-white">{{ periodData.team.baseTarget }}</span>
                                </li>
                                <li class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400">Threshold</span>
                                    <span class="font-semibold text-gray-900 dark:text-white">× {{ periodData.team.thresholdPercentage }}%</span>
                                </li>
                                <li class="flex justify-between pt-2.5 border-t border-gray-100 dark:border-gray-800">
                                    <span class="font-bold text-gray-900 dark:text-white"><TermHint term="finalTarget">Target Akhir</TermHint></span>
                                    <span class="font-bold text-primary-600 dark:text-primary-400">{{ periodData.team.finalTarget }}</span>
                                </li>
                            </ul>
                        </div>

                        <div class="p-4 rounded-xl border border-primary-200 dark:border-primary-800 bg-primary-50/40 dark:bg-primary-950/10 md:col-span-2 lg:col-span-1">
                            <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Rincian Komisi Manager</h4>
                            <ul class="space-y-3 text-sm">
                                <li>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-400"><TermHint term="overrideNew">Overriding New</TermHint></span>
                                        <span class="font-semibold text-gray-900 dark:text-white tabular-nums">{{ formatCurrency(periodData.override.newCommission) }}</span>
                                    </div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">
                                        {{ periodData.override.newCommissionRate }}% × komisi New tim {{ formatCurrency(periodData.teamTotals.newCommission) }}
                                    </p>
                                </li>
                                <li>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-400"><TermHint term="overrideRecurring">Overriding Recurring</TermHint></span>
                                        <span class="font-semibold text-gray-900 dark:text-white tabular-nums">{{ formatCurrency(periodData.override.recurringCommission) }}</span>
                                    </div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400">
                                        {{ periodData.override.recurringCommissionRate }}% × subscription recurring tim {{ formatCurrency(periodData.override.teamRecurringSubscriptionNet) }}
                                    </p>
                                </li>
                                <li class="flex justify-between">
                                    <span class="text-gray-600 dark:text-gray-400"><TermHint term="personalSales">Penjualan Pribadi</TermHint></span>
                                    <span class="font-semibold text-gray-900 dark:text-white tabular-nums">{{ formatCurrency(personalTotal) }}</span>
                                </li>
                                <li class="flex justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <span class="font-bold text-gray-900 dark:text-white">Total Diterima</span>
                                    <span class="font-bold text-primary-600 dark:text-primary-400 tabular-nums">{{ formatCurrency(periodData.totalCommission) }}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <!-- Produksi tim per produk -->
                    <div class="mt-6 md:mt-8">
                        <h4 class="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2 mb-1">
                            <UIcon name="i-heroicons-squares-2x2" class="w-4 h-4 sm:w-5 sm:h-5 text-primary-500" />
                            Produksi Tim per Produk
                        </h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4">Gabungan seluruh anggota tim, sudah dikurangi churn.</p>
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                            <div v-for="box in teamServiceBoxes" :key="box.title" class="p-4 rounded-xl border border-gray-200 dark:border-gray-800">
                                <h5 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 pb-2 border-b border-gray-200 dark:border-gray-700">
                                    <TermHint v-if="box.hint" :term="box.hint">{{ box.title }}</TermHint>
                                    <template v-else>{{ box.title }}</template>
                                </h5>
                                <ul class="space-y-2">
                                    <li v-for="row in box.rows" :key="row.label" class="flex justify-between items-center gap-3 text-sm">
                                        <span class="text-gray-600 dark:text-gray-400">{{ row.label }}</span>
                                        <span :class="['font-semibold tabular-nums', row.value === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white']">
                                            {{ box.isCount ? row.value : formatCurrency(row.value) }}
                                        </span>
                                    </li>
                                    <li class="flex justify-between items-center text-sm pt-3 mt-1 border-t border-gray-200 dark:border-gray-700">
                                        <span class="font-bold text-gray-900 dark:text-white">Total</span>
                                        <span class="font-bold text-primary-600 dark:text-primary-400 tabular-nums">{{ box.isCount ? box.total : formatCurrency(box.total) }}</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </template>
            </UPageCard>
        </div>

        <div class="py-2">
            <UCard>
                <div class="mb-3">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Anggota Tim</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Kinerja tiap anggota bulan ini. Klik nama untuk melihat detail komisinya, atau tanda panah untuk rincian layanan baru.
                    </p>
                </div>
                <UTable
                    sticky
                    v-model:expanded="expanded"
                    v-model:column-pinning="columnPinning"
                    :data="members"
                    :columns="columns"
                    empty="Belum ada anggota tim yang terdata pada periode ini."
                    class="flex-1 max-h-[800px]"
                >
                    <template #expanded="{ row }">
                        <div class="p-4 bg-gray-50 dark:bg-gray-800/50">
                            <h4 class="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">Layanan Baru per Produk</h4>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div v-for="service in row.original.newService" :key="service.name" class="p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                                    <div class="flex justify-between items-start mb-2">
                                        <span class="font-semibold text-gray-900 dark:text-white">{{ service.name }}</span>
                                        <span class="font-medium">{{ service.count }} layanan</span>
                                    </div>
                                    <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                                        <div class="flex justify-between">
                                            <span>MRC</span>
                                            <span class="font-medium">{{ formatCurrency(service.mrc) }}</span>
                                        </div>
                                        <div class="flex justify-between">
                                            <span>Subscription</span>
                                            <span class="font-medium">{{ formatCurrency(service.subscription) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </UTable>
            </UCard>
        </div>

        <div class="py-2">
            <UCard>
                <div class="mb-3">
                    <h3 class="text-base font-semibold text-gray-900 dark:text-white">Transaksi Penjualan Pribadi</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Invoice atas nama manager sendiri. Tab Recurring juga memuat invoice <TermHint term="cro">Customer Relation Officer</TermHint> yang dikreditkan ke manager.
                    </p>
                </div>
                <UTabs :items="invoiceTabItems" class="w-full">
                    <template #content="{ item }">
                        <p class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 my-2">
                            <span class="inline-block size-3 rounded-sm bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700" />
                            Baris kuning = invoice ini menghasilkan komisi Rp 0.
                        </p>
                        <UTable
                            sticky
                            :data="getInvoiceTabData(item.key)"
                            :columns="getInvoiceColumns(item.key)"
                            :empty="`Tidak ada transaksi ${item.name} pada periode ini.`"
                            class="flex-1 max-h-[800px] [&_tr:has(.commission-zero)]:bg-yellow-50 dark:[&_tr:has(.commission-zero)]:bg-yellow-950/20"
                        />
                    </template>
                </UTabs>
            </UCard>
        </div>

        <div class="py-2">
            <GlossaryPanel :terms="glossaryTerms" />
        </div>
    </UContainer>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { CommissionService } from '~/services/commission-service'
import { EmployeeService } from '~/services/employee-service'
import type { Employee } from '~/types/employee'
import type { TableColumn } from '@nuxt/ui'
import type { GlossaryKey } from '~/composables/useGlossary'
import type { ManagerCommissionData, ManagerTeamMember } from '~/types/manager'

const { setLoading } = useLoading()
const route = useRoute()
const commissionService = new CommissionService()
const employeeService = new EmployeeService()
const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')

const { monthSelect, yearItems } = usePeriodOptions()
const { hintHeader, invoiceColumns } = useInvoiceColumns()
const glossaryTerms: GlossaryKey[] = ['teamSize', 'baseTarget', 'finalTarget', 'teamAchievement', 'overrideNew', 'overrideRecurring', 'personalSales', 'cro', 'new', 'recurring', 'prorate', 'upgrade', 'alat', 'setup', 'subscription', 'mrc', 'contractMonths', 'lateMonth', 'commission', 'bonusBulanan', 'bonusKelebihanService', 'consistencyBonus']

const employee = ref<Employee>()
const year = ref(new Date().getFullYear())
const selectedMonth = ref(new Date().getMonth() + 1)

const periodData = ref<ManagerCommissionData | null>(null)
const expanded = ref({})
const columnPinning = ref({ left: ['expand', 'employee'], right: [] })

const { formatCurrency, formatDate } = useFormat()
const { getAchievementTextClass } = useAchievementColor()

const personalTotal = computed(() => {
    const p = periodData.value?.personal
    if (!p) return 0
    return p.total.commission + p.bonusBulanan + p.bonusKelebihanService + p.consistencyBonus
})

const totalParts = computed<{ label: string; hint: GlossaryKey; value: number }[]>(() => {
    const d = periodData.value
    if (!d) return []
    return [
        { label: 'Penjualan Pribadi', hint: 'personalSales', value: personalTotal.value },
        { label: `Overriding New (${d.override.newCommissionRate}%)`, hint: 'overrideNew', value: d.override.newCommission },
        { label: `Overriding Recurring (${d.override.recurringCommissionRate}%)`, hint: 'overrideRecurring', value: d.override.recurringCommission }
    ]
})

const targetProgress = computed(() => {
    const t = periodData.value?.team
    if (!t || t.finalTarget <= 0) return t?.activityCount ? 100 : 0
    return Math.min(100, (t.activityCount / t.finalTarget) * 100)
})

const targetGapText = computed(() => {
    const t = periodData.value?.team
    if (!t) return ''
    const gap = t.finalTarget - t.activityCount
    if (gap > 0) return `Kurang ${gap} layanan baru lagi untuk capai target.`
    if (gap < 0) return `Melebihi target sebanyak ${-gap} layanan baru.`
    return 'Tepat mencapai target.'
})

interface TeamServiceBox {
    title: string
    hint?: GlossaryKey
    rows: { label: string; value: number }[]
    total: number
    isCount?: boolean
}

const serviceGroupOrder = ['Home', 'Nusafiber', 'NusaSelecta'] as const
// Recurring-only: carves Digital Business and Access Business out of Home (KOMISI.md 3) — New-side boxes stay on the 3-way serviceGroupOrder above.
const recurringServiceGroupOrder = ['Home', 'Nusafiber', 'NusaSelecta', 'Digital Business', 'Access Business'] as const

const teamServiceBoxes = computed<TeamServiceBox[]>(() => {
    if (!periodData.value) return []
    const g = periodData.value.teamTotals.byServiceGroup
    return [
        {
            title: 'Jumlah Layanan Baru',
            hint: 'new',
            rows: serviceGroupOrder.map(name => ({ label: name, value: g[name].newCount })),
            total: serviceGroupOrder.reduce((sum, name) => sum + g[name].newCount, 0),
            isCount: true
        },
        {
            title: 'Subscription Baru',
            hint: 'subscription',
            rows: serviceGroupOrder.map(name => ({ label: name, value: g[name].newSubscription })),
            total: serviceGroupOrder.reduce((sum, name) => sum + g[name].newSubscription, 0)
        },
        {
            title: 'MRC Baru',
            hint: 'mrc',
            rows: serviceGroupOrder.map(name => ({ label: name, value: g[name].newMrc })),
            total: serviceGroupOrder.reduce((sum, name) => sum + g[name].newMrc, 0)
        },
        {
            title: 'Subscription Recurring',
            hint: 'recurring',
            rows: recurringServiceGroupOrder.map(name => ({ label: name, value: g[name].recurringSubscription })),
            total: recurringServiceGroupOrder.reduce((sum, name) => sum + g[name].recurringSubscription, 0)
        },
        {
            title: 'Komisi Recurring Tim',
            rows: recurringServiceGroupOrder.map(name => ({ label: name, value: g[name].recurringCommission })),
            total: recurringServiceGroupOrder.reduce((sum, name) => sum + g[name].recurringCommission, 0)
        }
    ]
})

const personalItems = computed(() => periodData.value?.personal.items ?? [])
const croItems = computed(() => periodData.value?.croRecurring ?? [])
// Customer Relation Officer rows have no real salesperson, so they never
// appear in personal.items — folded into the Recurring tab here since
// that's the only commission stream they actually feed (KOMISI.md 6.D).
const recurringItems = computed(() => [...personalItems.value.filter(i => i.type === 'recurring'), ...croItems.value])

const invoiceTabItems = computed(() => {
    const byType = (key: string) => personalItems.value.filter(i => i.type === key).length
    const tab = (name: string, key: string, count: number) => ({ label: `${name} (${count})`, name, key })
    return [
        tab('New', 'new', byType('new')),
        tab('Recurring', 'recurring', recurringItems.value.length),
        tab('Prorate', 'prorate', byType('prorate')),
        tab('Upgrade', 'upgrade', byType('upgrade')),
        tab('Alat', 'alat', byType('alat')),
        tab('Setup', 'setup', byType('setup'))
    ]
})

const getInvoiceTabData = (key: string) => {
    if (key === 'recurring') return recurringItems.value
    return personalItems.value.filter(i => i.type === key)
}

const getInvoiceColumns = (key: string) => invoiceColumns(field => getInvoiceTabData(key).reduce((sum, r) => sum + r[field], 0))

const members = computed(() => periodData.value?.members ?? [])

type MoneyField = 'newSubscription' | 'newMrc' | 'newCommission' | 'recurringSubscription' | 'recurringCommission' | 'otherSubscription'
    | 'otherCommission' | 'bonusBulanan' | 'bonusKelebihanService' | 'consistencyBonus' | 'totalCommission' | 'managerNewCommission' | 'managerRecurringCommission'

const moneyColumn = (key: MoneyField, label: string, opts: { hint?: GlossaryKey; strong?: boolean } = {}): TableColumn<ManagerTeamMember> => ({
    accessorKey: key,
    header: () => h('div', { class: 'text-right whitespace-nowrap' }, opts.hint ? [hintHeader(label, opts.hint)()] : label),
    cell: ({ row }) => h('div', { class: ['text-right tabular-nums', opts.strong ? 'font-bold text-gray-900 dark:text-white' : 'font-medium'] }, formatCurrency(row.original[key])),
    footer: () => h('div', { class: 'text-right font-bold py-3 tabular-nums' }, formatCurrency(members.value.reduce((sum, m) => sum + m[key], 0)))
})

const columns = computed<TableColumn<ManagerTeamMember>[]>(() => [
    {
        id: 'expand',
        header: '',
        cell: ({ row }) => h(UButton, {
            color: 'neutral',
            variant: 'ghost',
            icon: 'i-heroicons-chevron-down-20-solid',
            'aria-label': 'Lihat rincian layanan baru',
            class: 'transition-transform duration-200',
            style: { transform: row.getIsExpanded() ? 'rotate(180deg)' : 'rotate(0deg)' },
            onClick: () => row.toggleExpanded()
        })
    },
    {
        accessorKey: 'employee',
        header: 'Karyawan',
        cell: ({ row }) => h(resolveComponent('NuxtLink'), {
            class: 'flex items-center gap-3 group',
            to: `/${row.original.employeeId}/sales`
        }, () => [
            h(UAvatar, { src: row.original.photoProfile, alt: row.original.name, size: 'md' }),
            h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.name),
                h('span', { class: 'text-xs text-gray-500' }, `${row.original.employeeId} · ${row.original.status ?? '-'}`)
            ])
        ]),
        footer: () => h('div', { class: 'font-bold py-3' }, 'Total Tim')
    },
    {
        id: 'achievement',
        header: 'Status Pencapaian',
        cell: ({ row }) => h('div', { class: ['text-xs uppercase font-semibold', getAchievementTextClass(row.original.achievementStatus)] }, row.original.achievementStatus)
    },
    {
        accessorKey: 'activityCount',
        header: () => h('div', { class: 'text-center' }, [hintHeader('Layanan Baru', 'activity')()]),
        cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.original.activityCount),
        footer: () => h('div', { class: 'text-center font-bold py-3' }, members.value.reduce((sum, m) => sum + m.activityCount, 0))
    },
    moneyColumn('totalCommission', 'Total Komisi Sales', { strong: true }),
    moneyColumn('managerNewCommission', 'Overriding New', { hint: 'overrideNew', strong: true }),
    moneyColumn('managerRecurringCommission', 'Overriding Recurring', { hint: 'overrideRecurring', strong: true }),
    moneyColumn('newCommission', 'Komisi New'),
    moneyColumn('newSubscription', 'Subscription New'),
    moneyColumn('newMrc', 'MRC New', { hint: 'mrc' }),
    moneyColumn('recurringCommission', 'Komisi Recurring'),
    moneyColumn('recurringSubscription', 'Subscription Recurring'),
    moneyColumn('otherCommission', 'Komisi Alat & Setup'),
    moneyColumn('otherSubscription', 'Subscription Alat & Setup'),
    moneyColumn('bonusBulanan', 'Bonus Bulanan', { hint: 'bonusBulanan' }),
    moneyColumn('bonusKelebihanService', 'Bonus Kelebihan Service', { hint: 'bonusKelebihanService' }),
    moneyColumn('consistencyBonus', 'Bonus Konsistensi', { hint: 'consistencyBonus' })
])

// --- Data fetching ---
const fetchPeriodData = async () => {
    const response = await commissionService.managerCommission(route.params.id as string, { month: selectedMonth.value, year: year.value })
    periodData.value = response.data
}

const initData = async () => {
    setLoading(true)
    try {
        const employeeData = await employeeService.getEmployee(route.params.id as string)
        employee.value = employeeData.data
        await fetchPeriodData()
    } finally {
        setLoading(false)
    }
}

watch(year, () => {
    fetchPeriodData()
})

watch(selectedMonth, () => {
    fetchPeriodData()
})

initData()
</script>
