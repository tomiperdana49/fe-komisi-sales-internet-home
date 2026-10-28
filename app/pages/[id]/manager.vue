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
                <USelectMenu v-model="selectedMonth" value-key="id" :items="viewableMonths(year)" class="w-36" />
            </template>
        </CommissionHeader>

        <div class="py-2 grid grid-cols-1 gap-4">
            <UPageCard v-if="periodData">
                <template #default>
                    <!-- Total & cara menghitungnya -->
                    <div class="border-b border-gray-100 dark:border-gray-800 pb-4 md:pb-6 space-y-4">
                        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                            <div>
                                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"><TermHint term="period">Periode Perhitungan</TermHint></p>
                                <p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                                    {{ formatDate(periodData.startDate) }} – {{ formatDate(periodData.endDate) }}
                                </p>
                                <div v-if="periodData.closedAt" class="flex flex-wrap items-center gap-2 mt-2">
                                    <TermHint term="periodClosed"><UBadge color="neutral" variant="subtle" icon="i-lucide-lock">Periode Ditutup</UBadge></TermHint>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">Komisi sudah final sejak {{ shortDate(new Date(periodData.closedAt)) }}.</span>
                                </div>
                            </div>
                            <div class="md:text-right">
                                <p class="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Total Komisi Manager{{ ongoing ? ' (sementara)' : '' }}</p>
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
                                <UBadge v-if="ongoing" color="info" variant="subtle">Periode Berjalan</UBadge>
                                <UBadge v-else :color="periodData.team.isTargetAchieved ? 'success' : 'error'" variant="subtle">
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
                                    :class="periodData.team.isTargetAchieved ? 'bg-green-500' : ongoing ? 'bg-sky-500' : 'bg-red-500'"
                                    :style="{ width: targetProgress + '%' }"
                                />
                            </div>
                            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                {{ targetGapText }}
                            </p>
                            <div class="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
                                <div class="flex justify-between items-center text-sm">
                                    <span class="text-gray-600 dark:text-gray-400">
                                        <TermHint term="teamAchievement">Capaian untuk Overriding New</TermHint>
                                    </span>
                                    <span class="font-bold text-gray-900 dark:text-white tabular-nums">{{ Math.round(periodData.team.achievementPercentage) }}%</span>
                                </div>
                                <p v-if="periodData.team.achievementTarget > 0" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {{ periodData.team.activityCount }} ÷ {{ periodData.team.achievementTarget === periodData.team.finalTarget ? 'Target Akhir' : 'Target Dasar' }} {{ periodData.team.achievementTarget }} — penentu persentase Overriding New.
                                </p>
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
                                        {{ periodData.override.newCommissionRate }}% × komisi New, Prorate &amp; Alat tim {{ formatCurrency(periodData.teamTotals.newCommission) }}
                                    </p>
                                </li>
                                <li>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-400"><TermHint term="overrideRecurring">Overriding Recurring</TermHint></span>
                                        <span class="font-semibold text-gray-900 dark:text-white tabular-nums">{{ formatCurrency(periodData.override.recurringCommission) }}</span>
                                    </div>
                                    <p v-if="recurringRateLines.length <= 1" class="text-xs text-gray-500 dark:text-gray-400">
                                        {{ periodData.override.recurringCommissionRate }}% × subscription recurring tim {{ formatCurrency(periodData.override.teamRecurringSubscriptionNet) }}
                                    </p>
                                    <ul v-else class="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
                                        <li v-for="line in recurringRateLines" :key="line.label" class="flex justify-between gap-3">
                                            <span>{{ line.rate }}% × {{ line.label }} {{ formatCurrency(line.basis) }}</span>
                                            <span class="tabular-nums">{{ formatCurrency(line.basis * line.rate / 100) }}</span>
                                        </li>
                                    </ul>
                                    <ul v-if="recurringBasisLines.length" class="mt-1 space-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                                        <li v-for="line in recurringBasisLines" :key="line.label" class="flex justify-between gap-3">
                                            <button
                                                v-if="line.kind && line.items?.length"
                                                type="button"
                                                class="text-left underline decoration-dotted underline-offset-2 hover:text-primary-500 transition-colors"
                                                @click="openBasisItems(line.kind, line.items)"
                                            >
                                                {{ line.label }} ({{ line.items.length }})
                                            </button>
                                            <span v-else>{{ line.label }}</span>
                                            <span class="tabular-nums">{{ line.sign }}{{ formatCurrency(line.value) }}</span>
                                        </li>
                                        <li class="flex justify-between gap-3 pt-0.5 border-t border-gray-200 dark:border-gray-700 font-semibold">
                                            <span>Dasar overriding</span>
                                            <span class="tabular-nums">{{ formatCurrency(periodData.override.teamRecurringSubscriptionNet) }}</span>
                                        </li>
                                    </ul>
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
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3 md:mb-4">Total tim adalah gabungan seluruh anggota tim; kotak Recurring juga memuat invoice Customer Relation Officer. Churn hanya mengurangi angka New, tidak Recurring. Total tim pada Pencapaian New sama dengan Capaian Tim; penjualan pribadi manager ditampilkan terpisah dan dijumlahkan ke Total area. NusaSelecta dihitung dalam pencapaian, bukan jumlah unit. Subscription Baru = New, Prorate &amp; Upgrade (sama dengan halaman AM); MRC Baru hanya New &amp; Upgrade. Penjualan Alat dan Setup ada di kolom Alat &amp; Setup dan tidak menambah Pencapaian New. Di tabel Anggota Tim, Komisi New = New, Prorate &amp; Upgrade dan komisi Alat ada di Komisi Alat &amp; Setup; dasar Overriding New tetap komisi New, Prorate &amp; Alat (lihat Rincian Komisi Manager).</p>
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
                                        <span class="font-bold text-gray-900 dark:text-white">Total tim</span>
                                        <span class="font-bold text-primary-600 dark:text-primary-400 tabular-nums">{{ box.isCount ? box.total : formatCurrency(box.total) }}</span>
                                    </li>
                                    <li class="flex justify-between items-center gap-3 text-sm">
                                        <span class="text-gray-600 dark:text-gray-400">Pribadi manager</span>
                                        <span :class="['font-semibold tabular-nums', box.personal === 0 ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white']">{{ box.isCount ? formatSigned(box.personal) : formatCurrency(box.personal) }}</span>
                                    </li>
                                    <template v-if="box.personalCuts.length">
                                        <li class="flex justify-between items-center gap-3 text-xs pl-3">
                                            <span class="text-gray-500 dark:text-gray-400">Subscription</span>
                                            <span class="tabular-nums text-gray-600 dark:text-gray-300">{{ formatCurrency(box.personal + box.personalCuts.reduce((sum, cut) => sum + cut.value, 0)) }}</span>
                                        </li>
                                        <li v-for="cut in box.personalCuts" :key="cut.label" class="flex justify-between items-center gap-3 text-xs pl-3">
                                            <span class="text-gray-500 dark:text-gray-400">{{ cut.label }}</span>
                                            <span class="tabular-nums text-red-600 dark:text-red-400">{{ formatCurrency(-cut.value) }}</span>
                                        </li>
                                    </template>
                                    <template v-if="box.personalChurn">
                                        <li class="flex justify-between items-center gap-3 text-xs pl-3">
                                            <span class="text-gray-500 dark:text-gray-400">Pasang baru</span>
                                            <span class="tabular-nums text-gray-600 dark:text-gray-300">{{ box.isCount ? box.personal + box.personalChurn : formatCurrency(box.personal + box.personalChurn) }}</span>
                                        </li>
                                        <li class="flex justify-between items-start gap-3 text-xs pl-3">
                                            <span class="text-gray-500 dark:text-gray-400">
                                                <TermHint term="churn">Churn</TermHint>
                                                <span v-if="personalChurnNames.length" class="block text-gray-400 dark:text-gray-500">{{ personalChurnNames.join(', ') }}</span>
                                            </span>
                                            <span class="tabular-nums text-red-600 dark:text-red-400">{{ box.isCount ? -box.personalChurn : formatCurrency(-box.personalChurn) }}</span>
                                        </li>
                                        <li v-if="box.isCount" class="text-xs pl-3 text-gray-400 dark:text-gray-500">
                                            Tidak mengurangi Capaian Tim; hanya memotong komisi Penjualan Pribadi manager.
                                        </li>
                                    </template>
                                    <li class="flex justify-between items-center text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span class="font-bold text-gray-900 dark:text-white">Total area</span>
                                        <span class="font-bold text-gray-900 dark:text-white tabular-nums">{{ box.isCount ? box.total + box.personal : formatCurrency(box.total + box.personal) }}</span>
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
                                        <span class="font-medium">{{ service.count }} {{ service.name === 'NusaSelecta' ? 'pencapaian' : 'layanan' }}</span>
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
                <div class="mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Churn Tim ({{ teamChurn.length }})</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Seluruh <TermHint term="churn">churn</TermHint> anggota tim dan manager pada periode ini.
                            {{ countedChurn.length }} dihitung (potongan komisi AM {{ formatCurrency(countedChurnCommission) }}), {{ teamChurn.length - countedChurn.length }} dibebaskan.
                        </p>
                    </div>
                    <UInput v-model="churnSearch" icon="i-lucide-search" placeholder="Cari AM, pelanggan, layanan..." class="w-full sm:w-80" />
                </div>
                <UTable
                    sticky
                    :data="filteredTeamChurn"
                    :columns="teamChurnColumns"
                    :empty="churnSearch.trim() ? `Tidak ada churn yang cocok dengan “${churnSearch.trim()}”.` : 'Tidak ada churn tim pada periode ini 🎉'"
                    class="flex-1 max-h-[800px]"
                />
            </UCard>
        </div>

        <div class="py-2">
            <UCard>
                <div class="mb-3 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h3 class="text-base font-semibold text-gray-900 dark:text-white">Transaksi Penjualan Pribadi</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Invoice atas nama manager sendiri. Tab Recurring juga memuat invoice <TermHint term="cro">Customer Relation Officer</TermHint> yang dikreditkan ke manager.
                        </p>
                    </div>
                    <UInput v-model="transactionSearch" icon="i-lucide-search" placeholder="Cari pelanggan, layanan, no. invoice..." class="w-full sm:w-80" />
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
                            :empty="transactionSearch.trim() ? `Tidak ada transaksi ${item.name} yang cocok dengan “${transactionSearch.trim()}”.` : `Tidak ada transaksi ${item.name} pada periode ini.`"
                            class="flex-1 max-h-[800px] [&_tr:has(.commission-zero)]:bg-yellow-50 dark:[&_tr:has(.commission-zero)]:bg-yellow-950/20"
                        />
                    </template>
                </UTabs>
            </UCard>
        </div>

        <div class="py-2">
            <GlossaryPanel :terms="glossaryTerms" />
        </div>

        <RecurringBasisItemsModal v-model:open="basisItemsOpen" :kind="basisItemsKind" :items="basisItems" />
    </UContainer>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { CommissionService } from '~/services/commission-service'
import { EmployeeService } from '~/services/employee-service'
import type { Employee } from '~/types/employee'
import type { TableColumn } from '@nuxt/ui'
import type { GlossaryKey } from '~/composables/useGlossary'
import type { ManagerChurnRow, ManagerCommissionData, ManagerRecurringBasisItem, ManagerServiceGroup, ManagerServiceGroupTotal, ManagerTeamMember } from '~/types/manager'

const { setLoading } = useLoading()
const route = useRoute()
const commissionService = new CommissionService()
const employeeService = new EmployeeService()
const UAvatar = resolveComponent('UAvatar')
const UButton = resolveComponent('UButton')

const { viewableMonths, yearItems, isOngoingUntil, shortDate } = usePeriodOptions()
const { hintHeader, invoiceColumns, churnColumns, matchesSearch } = useInvoiceColumns()
const { withTooltip } = useTextTooltip()
const glossaryTerms: GlossaryKey[] = ['period', 'periodClosed', 'teamSize', 'baseTarget', 'finalTarget', 'teamAchievement', 'overrideNew', 'overrideRecurring', 'personalSales', 'cro', 'memberTotal', 'achievementStatus', 'churn', 'churnWaived', 'new', 'activationDate', 'recurring', 'prorate', 'upgrade', 'alat', 'setup', 'subscription', 'baseCommission', 'mrc', 'contractMonths', 'lateMonth', 'managerCommission', 'bonusBulanan', 'bonusKelebihanService', 'consistencyBonus']

const employee = ref<Employee>()
const { year, month: selectedMonth } = useSelectedPeriod()

const periodData = ref<ManagerCommissionData | null>(null)
const ongoing = computed(() => periodData.value ? isOngoingUntil(periodData.value.endDate) : false)
const expanded = ref({})
const columnPinning = ref({ left: ['employee'], right: [] })

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
        { label: recurringRateLines.value.length > 1 ? 'Overriding Recurring' : `Overriding Recurring (${d.override.recurringCommissionRate}%)`, hint: 'overrideRecurring', value: d.override.recurringCommission }
    ]
})

// Overriding Recurring per rate (access / Digital Business Internal & IP Public / Resell); only the parts the team has.
const recurringRateLines = computed(() => {
    const k = periodData.value?.override.recurringByKind
    if (!k) return []
    return [
        { label: 'cust lama akses', ...k.access },
        { label: 'DB Internal & IP Public', ...k.digitalBusinessInternal },
        { label: 'DB Resell', ...k.digitalBusinessResell }
    ].filter(line => line.basis !== 0)
})

const targetProgress = computed(() => {
    const t = periodData.value?.team
    if (!t || t.finalTarget <= 0) return (t?.activityCount ?? 0) > 0 ? 100 : 0
    return Math.min(100, Math.max(0, (t.activityCount / t.finalTarget) * 100))
})

const targetGapText = computed(() => {
    const t = periodData.value?.team
    if (!t) return ''
    const gap = t.finalTarget - t.activityCount
    if (gap > 0) return ongoing.value ? `Kurang ${gap} layanan baru lagi untuk capai target. Periode berjalan sampai ${shortDate(new Date(periodData.value!.endDate))}.` : `Kurang ${gap} layanan baru dari target.`
    if (gap < 0) return `Melebihi target sebanyak ${-gap} layanan baru.`
    return 'Tepat mencapai target.'
})

interface TeamServiceBox {
    title: string
    hint?: GlossaryKey
    rows: { label: string; value: number }[]
    /** Team members (+ Customer Relation Officer recurring) only — matches Capaian Tim for the count box. */
    total: number
    /** The manager's own personal sales for the same box, shown even when 0 so every manager page reads the same. */
    personal: number
    /** Uncancelled churn already netted out of `personal` (New-side boxes only); 0 hides the breakdown. */
    personalChurn: number
    /** Referral and late-payment cuts already netted out of `personal` (Subscription Recurring only), as on the AM page's Dasar Komisi Recurring. */
    personalCuts: { label: string; value: number }[]
    isCount?: boolean
}

const formatSigned = (n: number) => (n > 0 ? `+${n}` : `${n}`)

const serviceGroupOrder = ['Home', 'Nusafiber', 'NusaSelecta'] as const
// Recurring-only: carves Digital Business and Access Business out of Home (KOMISI.md 3) — New-side boxes stay on the 3-way serviceGroupOrder above.
const recurringServiceGroupOrder = ['Home', 'Nusafiber', 'NusaSelecta', 'Digital Business', 'Access Business'] as const

const teamServiceBoxes = computed<TeamServiceBox[]>(() => {
    if (!periodData.value) return []
    const g = periodData.value.teamTotals.byServiceGroup
    const p = periodData.value.teamTotals.personalByServiceGroup
    const d = periodData.value.personal.deduction
    const box = (
        title: string,
        groups: readonly ManagerServiceGroup[],
        field: keyof ManagerServiceGroupTotal,
        opts: { hint?: GlossaryKey; isCount?: boolean; personalChurn?: number; personalCuts?: { label: string; value: number }[] } = {}
    ): TeamServiceBox => {
        const personalCuts = (opts.personalCuts ?? []).filter(cut => Math.round(cut.value) !== 0)
        return {
            title,
            personalChurn: 0,
            ...opts,
            personalCuts,
            rows: groups.map(name => ({ label: name, value: g[name][field] })),
            total: groups.reduce((sum, name) => sum + g[name][field], 0),
            personal: groups.reduce((sum, name) => sum + p[name][field], 0) - personalCuts.reduce((sum, cut) => sum + cut.value, 0)
        }
    }
    const personal = periodData.value.personal
    return [
        box('Pencapaian New', serviceGroupOrder, 'newCount', { hint: 'newAchievement', isCount: true, personalChurn: d.count }),
        box('Subscription Baru', serviceGroupOrder, 'newSubscription', { hint: 'subscription', personalChurn: d.subscription }),
        box('MRC Baru', serviceGroupOrder, 'newMrc', { hint: 'mrc', personalChurn: d.mrc }),
        box('Subscription Recurring', recurringServiceGroupOrder, 'recurringSubscription', {
            hint: 'recurring',
            personalCuts: [
                { label: 'Biaya referral', value: personal.recurringReferralFee ?? 0 },
                { label: 'Telat bayar', value: personal.recurringLatePenalty ?? 0 }
            ]
        }),
        box('Komisi Recurring Tim', recurringServiceGroupOrder, 'recurringCommission')
    ]
})

// How the Subscription Recurring "Total tim" card gets down to the
// Overriding Recurring basis; zero adjustments are left out.
const recurringBasisLines = computed(() => {
    const b = periodData.value?.override.recurringBasis
    if (!b) return []
    type Line = { label: string, value: number, sign: string, kind?: BasisItemsKind, items?: ManagerRecurringBasisItem[] }
    const minus = (label: string, value: number, kind?: BasisItemsKind, items?: ManagerRecurringBasisItem[]): Line => ({ label, value, sign: '− ', kind, items })
    const lines: Line[] = [
        { label: 'Total tim (Subscription Recurring)', value: b.teamSubscription, sign: '' },
        minus('Kenaikan harga perpanjangan', b.renewalExcluded, 'renewal', b.renewalItems),
        minus('Potongan referral', b.referralDeduction),
        minus('Potongan telat bayar', b.latePenalty, 'late', b.lateItems),
        minus('Lainnya', b.otherAdjustment)
    ]
    return lines.filter((line, i) => i === 0 || Math.round(line.value) !== 0)
})

type BasisItemsKind = 'renewal' | 'late'
const basisItemsOpen = ref(false)
const basisItemsKind = ref<BasisItemsKind>('renewal')
const basisItems = ref<ManagerRecurringBasisItem[]>([])
const openBasisItems = (kind: BasisItemsKind, items: ManagerRecurringBasisItem[]) => {
    basisItemsKind.value = kind
    basisItems.value = items
    basisItemsOpen.value = true
}

const personalItems = computed(() => periodData.value?.personal.items ?? [])
const croItems = computed(() => periodData.value?.croRecurring ?? [])
// Customer Relation Officer rows have no real salesperson, so they never
// appear in personal.items — folded into the Recurring tab here since
// that's the only commission stream they actually feed (KOMISI.md 6.D).
const recurringItems = computed(() => [...personalItems.value.filter(i => i.type === 'recurring'), ...croItems.value])

const invoiceTabItems = computed(() => {
    const byType = (key: string) => getInvoiceTabData(key).length
    const tab = (name: string, key: string, count: number) => ({ label: `${name} (${count})`, name, key })
    return [
        tab('New', 'new', byType('new')),
        tab('Recurring', 'recurring', byType('recurring')),
        tab('Prorate', 'prorate', byType('prorate')),
        tab('Upgrade', 'upgrade', byType('upgrade')),
        tab('Alat', 'alat', byType('alat')),
        tab('Setup', 'setup', byType('setup'))
    ]
})

const transactionSearch = ref('')
const getInvoiceTabData = (key: string) => {
    const rows = key === 'recurring' ? recurringItems.value : personalItems.value.filter(i => i.type === key)
    return rows.filter(r => matchesSearch(r, transactionSearch.value))
}

const getInvoiceColumns = (key: string) => invoiceColumns(field => getInvoiceTabData(key).reduce((sum, r) => sum + r[field], 0), 'managerCommission', ['new', 'prorate', 'upgrade'].includes(key), key === 'recurring')

// Most new services first; ties go to the higher total commission.
const members = computed(() => [...(periodData.value?.members ?? [])]
    .sort((a, b) => b.activityCount - a.activityCount || b.totalCommission - a.totalCommission))

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
        accessorKey: 'employee',
        header: 'Karyawan',
        // Expand toggle lives inside this cell so only one column needs pinning —
        // pinning two columns offsets the second by the first's nominal size, not its rendered width.
        cell: ({ row }) => h('div', { class: 'flex items-center gap-1' }, [
            h(UButton, {
                color: 'neutral',
                variant: 'ghost',
                icon: 'i-heroicons-chevron-down-20-solid',
                'aria-label': 'Lihat rincian layanan baru',
                class: 'transition-transform duration-200',
                style: { transform: row.getIsExpanded() ? 'rotate(180deg)' : 'rotate(0deg)' },
                onClick: () => row.toggleExpanded()
            }),
            h(resolveComponent('NuxtLink'), {
                class: 'flex items-center gap-3 group',
                to: `/${row.original.employeeId}/sales`
            }, () => [
                h(UAvatar, { src: row.original.photoProfile, alt: row.original.name, size: 'md' }),
                h('div', { class: 'flex flex-col' }, [
                    h('span', { class: 'text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.name),
                    h('span', { class: 'text-xs text-gray-500' }, `${row.original.employeeId} · ${row.original.status ?? '-'}`)
                ])
            ])
        ]),
        footer: () => h('div', { class: 'font-bold py-3 pl-10' }, 'Total Tim')
    },
    {
        id: 'achievement',
        header: hintHeader('Status Pencapaian', 'achievementStatus'),
        cell: ({ row }) => ongoing.value
            ? withTooltip(`Status final setelah periode berakhir. Sementara: ${row.original.achievementStatus}`, h('div', { class: 'text-xs uppercase font-semibold text-sky-600 dark:text-sky-400' }, 'Berjalan'))
            : h('div', { class: ['text-xs uppercase font-semibold', getAchievementTextClass(row.original.achievementStatus)] }, row.original.achievementStatus)
    },
    {
        accessorKey: 'activityCount',
        header: () => h('div', { class: 'text-center' }, [hintHeader('Layanan Baru', 'activity')()]),
        cell: ({ row }) => h('div', { class: 'text-center font-medium' }, row.original.activityCount),
        footer: () => h('div', { class: 'text-center font-bold py-3' }, members.value.reduce((sum, m) => sum + m.activityCount, 0))
    },
    moneyColumn('totalCommission', 'Total Komisi Sales', { hint: 'memberTotal', strong: true }),
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

// --- Churn tim ---
const teamChurn = ref<ManagerChurnRow[]>([])
const churnSearch = ref('')
const countedChurn = computed(() => teamChurn.value.filter(c => !c.is_approved))
// The manager's own uncancelled churn — named under "Pribadi manager" in the production boxes.
const personalChurnNames = computed(() => countedChurn.value
    .filter(c => c.sales_id === route.params.id)
    .map(c => c.customer_name ?? c.customer_service_account ?? String(c.customer_service_id)))
const countedChurnCommission = computed(() => countedChurn.value.reduce((sum, c) => sum + c.commission, 0))
// Grouped by AM, newest stop date first within each.
const filteredTeamChurn = computed(() => teamChurn.value
    .filter(c => matchesSearch(c, churnSearch.value))
    .sort((a, b) => a.sales_name.localeCompare(b.sales_name) || String(b.unregistration_date).localeCompare(String(a.unregistration_date))))

const teamChurnColumns = computed(() => churnColumns<ManagerChurnRow>({
    id: 'sales',
    header: 'Account Manager',
    cell: ({ row }) => h(resolveComponent('NuxtLink'), {
        class: 'flex items-center gap-2 group min-w-[160px]',
        to: `/${row.original.sales_id}/sales`
    }, () => [
        h(UAvatar, { src: row.original.sales_photo_profile ?? undefined, alt: row.original.sales_name, size: 'sm' }),
        h('div', { class: 'flex flex-col' }, [
            h('span', { class: 'text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors' }, row.original.sales_name),
            h('span', { class: 'text-xs text-gray-500' }, row.original.sales_id ?? '')
        ])
    ])
}))

// --- Data fetching ---
const fetchPeriodData = async () => {
    const response = await commissionService.managerCommission(route.params.id as string, { month: selectedMonth.value, year: year.value })
    periodData.value = response.data
}

const fetchTeamChurn = async () => {
    const response = await commissionService.managerChurn(route.params.id as string, { month: selectedMonth.value, year: year.value })
    teamChurn.value = response.data
}

const fetchMonthData = () => Promise.all([fetchPeriodData(), fetchTeamChurn()])

const initData = async () => {
    setLoading(true)
    try {
        const employeeData = await employeeService.getEmployee(route.params.id as string)
        employee.value = employeeData.data
        await fetchMonthData()
    } finally {
        setLoading(false)
    }
}

watch(year, () => {
    fetchMonthData()
})

watch(selectedMonth, () => {
    fetchMonthData()
})

initData()
</script>
