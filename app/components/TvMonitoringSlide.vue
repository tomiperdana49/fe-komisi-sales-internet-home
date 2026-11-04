<template>
    <div class="absolute inset-0">
        <header class="px-20 pt-16">
            <p class="text-[28px] font-extrabold tracking-[0.18em] text-[#24205f]">{{ periodLabel }}<template v-if="daysLeft"> · {{ daysLeft }}</template></p>
            <h1 class="mt-2 max-w-[1440px] truncate font-black leading-[1.05] tracking-tight text-[72px]">
                <template v-if="manager"><span class="text-[#24205f]">TEAM </span><span class="text-[#2f9e2a]">{{ manager.name.toUpperCase() }}</span></template>
                <template v-else><span class="text-[#24205f]">DAILY </span><span class="text-[#2f9e2a]">PERFORMANCE</span></template>
            </h1>
            <p class="mt-3 text-[26px] font-extrabold tracking-[0.12em] text-[#24205f]">
                {{ subtitle }}
                <span class="ml-4 font-bold text-slate-500">· DATA S.D. {{ dataUntilLabel }}</span>
            </p>
        </header>

        <!-- Every Sales Manager against the pace. -->
        <main v-if="slide.kind === 'board'" class="absolute left-20 right-28 top-[270px] bottom-16">
            <div class="flex items-center gap-6 px-6 pb-3 text-[20px] font-extrabold tracking-[0.1em] text-slate-500">
                <span class="w-12" />
                <span class="w-[420px]">SALES MANAGER</span>
                <span class="flex-1 whitespace-nowrap">PROGRES (│ = LAJU SAAT INI)</span>
                <span class="w-36 text-right">CAPAIAN</span>
                <span class="w-36 text-right">RATA-RATA</span>
                <span class="w-32 text-right">{{ lastDayLabel }}</span>
                <span class="w-44 text-right">STATUS</span>
            </div>
            <div
                v-for="(m, i) in slide.managers"
                :key="m.name"
                class="mb-2 flex h-[80px] items-center gap-6 rounded-2xl bg-white/70 px-6"
            >
                <span class="w-12 text-center text-[36px] font-black tabular-nums text-slate-400">{{ slide.firstRank + i }}</span>
                <div class="flex w-[420px] min-w-0 items-center gap-4">
                    <UAvatar :src="m.photoProfile" :alt="m.name" class="size-14 shrink-0 text-xl ring-2 ring-white" />
                    <div class="min-w-0">
                        <p class="truncate text-[28px] font-extrabold leading-tight text-[#24205f]">{{ m.name }}</p>
                        <p class="truncate text-lg text-slate-500">{{ branchLabel(m.branch) }} · {{ m.teamSize }} AM</p>
                    </div>
                </div>
                <div class="relative h-8 flex-1 rounded-full bg-slate-200">
                    <div class="h-full rounded-full" :style="{ width: `${progress(m)}%`, background: statusOf(m).color }" />
                    <div v-if="m.finalTarget > 0" class="absolute -top-2 h-12 w-1.5 rounded bg-[#24205f]" :style="{ left: `calc(${pacePosition(m)}% - 3px)` }" />
                </div>
                <span class="w-36 text-right text-[36px] font-black tabular-nums text-[#24205f]">{{ m.activityCount }}<span class="text-[22px] font-bold text-slate-500"> / {{ m.finalTarget }}</span></span>
                <span class="w-36 text-right text-[32px] font-black tabular-nums text-[#24205f]">{{ oneDecimal(perDay(m)) }}<span class="text-[20px] font-bold text-slate-500">/hari</span></span>
                <span class="w-32 text-right text-[32px] font-black tabular-nums" :class="m.lastDayDelta > 0 ? 'text-[#2f9e2a]' : 'text-slate-400'">{{ signed(m.lastDayDelta) }}</span>
                <span class="w-44 rounded-full py-1.5 text-center text-[20px] font-black text-white" :style="{ background: statusOf(m).color }">{{ statusOf(m).label }}</span>
            </div>
        </main>

        <!-- Every Account Manager of a branch: figures and order only, no status label on individuals. -->
        <main v-else-if="slide.kind === 'am'" class="absolute left-20 right-28 top-[270px] bottom-16">
            <div class="flex items-center gap-6 px-6 pb-2 text-[20px] font-extrabold tracking-[0.1em] text-slate-500">
                <span class="w-12" />
                <span class="w-[440px]">ACCOUNT MANAGER</span>
                <span class="w-[220px]">TEAM</span>
                <span class="flex-1">PROGRES</span>
                <span class="w-32 text-right">CAPAIAN</span>
                <span class="w-36 text-right">RATA-RATA</span>
                <span class="w-28 text-right">{{ lastDayLabel }}</span>
            </div>
            <div
                v-for="(am, i) in slide.rows"
                :key="am.name"
                class="mb-1.5 flex h-[62px] items-center gap-6 rounded-2xl bg-white/70 px-6"
            >
                <span class="w-12 text-center text-[30px] font-black tabular-nums text-slate-400">{{ slide.firstRank + i }}</span>
                <div class="flex w-[440px] min-w-0 items-center gap-4">
                    <UAvatar :src="am.photoProfile" :alt="am.name" class="size-12 shrink-0 text-lg ring-2 ring-white" />
                    <p class="min-w-0 truncate text-[26px] font-extrabold text-[#24205f]">{{ am.name }}</p>
                </div>
                <p class="w-[220px] truncate text-[22px] font-bold text-slate-500">{{ am.team }}</p>
                <div class="h-5 flex-1 rounded-full bg-slate-200">
                    <div class="h-full rounded-full bg-[#2f9e2a]" :style="{ width: `${am.target > 0 ? Math.min(100, Math.max(0, am.activityCount / am.target * 100)) : 0}%` }" />
                </div>
                <span class="w-32 text-right text-[32px] font-black tabular-nums text-[#24205f]">{{ am.activityCount }}<span v-if="am.target > 0" class="text-[20px] font-bold text-slate-500"> / {{ am.target }}</span></span>
                <span class="w-36 text-right text-[28px] font-black tabular-nums text-[#24205f]">{{ oneDecimal(amPerDay(am.activityCount)) }}<span class="text-[18px] font-bold text-slate-500">/hari</span></span>
                <span class="w-28 text-right text-[28px] font-black tabular-nums" :class="am.lastDayDelta > 0 ? 'text-[#2f9e2a]' : 'text-slate-400'">{{ signed(am.lastDayDelta) }}</span>
            </div>
        </main>

        <!-- One team: the running total against the pace, and who made it. -->
        <main v-else-if="manager" class="absolute left-20 right-28 top-[270px] bottom-16 flex gap-12">
            <section class="w-[860px] shrink-0">
                <div class="mb-4 flex items-end gap-8">
                    <p class="text-[80px] font-black leading-none tabular-nums text-[#24205f]">{{ manager.activityCount }}<span class="text-[40px] font-bold text-slate-500"> / {{ manager.finalTarget }}</span></p>
                    <div class="pb-1">
                        <div class="flex items-center gap-4">
                            <span class="rounded-full px-5 py-1.5 text-[22px] font-black text-white" :style="{ background: statusOf(manager).color }">{{ statusOf(manager).label }}</span>
                            <span class="text-[24px] font-extrabold text-[#24205f]">Rata-rata {{ oneDecimal(perAm(manager)) }}/AM</span>
                        </div>
                        <p class="mt-2 text-[26px] font-extrabold text-[#2f9e2a]">Rata-rata {{ oneDecimal(perDay(manager)) }}/hari<template v-if="neededLabel"> · {{ neededLabel }}</template></p>
                    </div>
                </div>
                <svg :viewBox="`0 0 ${CHART.width} ${CHART.height}`" class="w-full" role="img" :aria-label="`Grafik capaian ${manager.name} dibanding laju target`">
                    <line :x1="CHART.left" :y1="yOf(0)" :x2="CHART.width - CHART.right" :y2="yOf(0)" stroke="#94a3b8" stroke-width="2" />
                    <line :x1="xOf(0)" :y1="yOf(paceAt(0))" :x2="xOf(report.daysTotal - 1)" :y2="yOf(manager.finalTarget)" stroke="#24205f" stroke-width="4" stroke-dasharray="14 12" />
                    <polyline :points="actualPoints" fill="none" stroke="#2f9e2a" stroke-width="8" stroke-linejoin="round" stroke-linecap="round" />
                    <circle v-if="lastPoint" :cx="lastPoint.x" :cy="lastPoint.y" r="11" fill="#2f9e2a" stroke="#ffffff" stroke-width="4" />
                    <text :x="xOf(report.daysTotal - 1)" :y="yOf(manager.finalTarget) - 12" text-anchor="end" font-size="26" font-weight="800" fill="#24205f">Target {{ manager.finalTarget }}</text>
                    <text :x="CHART.left" :y="CHART.height - 6" font-size="24" font-weight="700" fill="#64748b">{{ shortDay(report.startDate) }}</text>
                    <text :x="CHART.width - CHART.right" :y="CHART.height - 6" text-anchor="end" font-size="24" font-weight="700" fill="#64748b">{{ shortDay(report.endDate) }}</text>
                </svg>
                <p class="mt-2 flex items-center gap-8 text-[22px] font-bold text-slate-600">
                    <span class="flex items-center gap-2"><span class="inline-block h-2 w-10 rounded bg-[#2f9e2a]" />Capaian</span>
                    <span class="flex items-center gap-2"><span class="inline-block w-10 border-t-4 border-dashed border-[#24205f]" />Laju target</span>
                    <span>Churn periode ini: {{ manager.churnCount }}</span>
                </p>
            </section>

            <section class="min-w-0 flex-1">
                <p class="mb-4 text-[22px] font-extrabold tracking-[0.14em] text-slate-500">ACCOUNT MANAGER · {{ lastDayLabel }}</p>
                <div class="grid gap-3" :class="manager.members.length > 7 ? 'grid-cols-2' : 'grid-cols-1'">
                    <div
                        v-for="member in sortedMembers"
                        :key="member.name"
                        class="flex h-[80px] items-center gap-4 rounded-2xl bg-white/70 px-5"
                    >
                        <UAvatar :src="member.photoProfile" :alt="member.name" class="size-14 shrink-0 text-xl ring-2 ring-white" />
                        <p class="min-w-0 flex-1 font-extrabold leading-tight text-[#24205f]" :class="manager.members.length > 7 ? 'line-clamp-2 text-[22px]' : 'truncate text-[28px]'">{{ member.name }}</p>
                        <span v-if="member.lastDayDelta > 0" class="shrink-0 rounded-full bg-green-100 px-3 py-0.5 text-[22px] font-black text-green-700">{{ signed(member.lastDayDelta) }}</span>
                        <span class="w-16 shrink-0 text-right text-[40px] font-black tabular-nums text-[#24205f]">{{ member.activityCount }}</span>
                    </div>
                </div>
            </section>
        </main>
    </div>
</template>

<script setup lang="ts">
import { branchLabel } from '~/composables/useBranchFilter'
import type { TvMonitoringData, TvMonitoringManager, TvMonitoringMember } from '~/services/tv-service'

export type TvMonitoringSlideData =
    | { key: string; kind: 'board'; firstRank: number; managers: TvMonitoringManager[] }
    | { key: string; kind: 'am'; branch: string; page: number; pages: number; firstRank: number; rows: (TvMonitoringMember & { team: string })[] }
    | { key: string; kind: 'manager'; manager: TvMonitoringManager }

const props = defineProps<{
    slide: TvMonitoringSlideData
    report: TvMonitoringData
    daysLeft: string
}>()

const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER']
const CHART = { width: 860, height: 540, left: 8, right: 8, top: 44, bottom: 40 }
const STATUS = {
    on_track: { label: 'ON TRACK', color: '#2f9e2a' },
    slightly_behind: { label: 'MENGEJAR', color: '#d97706' },
    behind: { label: 'TERTINGGAL', color: '#e11d48' },
    no_target: { label: 'TANPA TARGET', color: '#64748b' }
}

const manager = computed(() => props.slide.kind === 'manager' ? props.slide.manager : null)
const periodLabel = computed(() => `${MONTHS[Number(props.report.period.slice(4, 6)) - 1]} ${props.report.period.slice(0, 4)}`)
const statusOf = (m: TvMonitoringManager) => STATUS[m.status]
const subtitle = computed(() => {
    const s = props.slide
    if (s.kind === 'manager') return `SALES MANAGER · ${branchLabel(s.manager.branch).toUpperCase()}`
    if (s.kind === 'am') return `ACCOUNT MANAGER · ${s.branch.toUpperCase()}${s.pages > 1 ? ` · ${s.page}/${s.pages}` : ''}`
    return 'SALES MANAGER HOME'
})
const amPerDay = (activity: number) => props.report.daysElapsed > 0 ? activity / props.report.daysElapsed : 0

const shortDay = (day: string) => new Date(`${day}T00:00:00`).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
const dataUntilLabel = computed(() => props.report.dataUntil ? shortDay(props.report.dataUntil).toUpperCase() : 'BELUM ADA')
const lastDayLabel = computed(() => props.report.dataUntil ? shortDay(props.report.dataUntil).toUpperCase() : '')
const signed = (n: number) => n > 0 ? `+${n}` : String(n)
const oneDecimal = (n: number) => n.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const perDay = (m: TvMonitoringManager) => props.report.daysElapsed > 0 ? m.activityCount / props.report.daysElapsed : 0
const perAm = (m: TvMonitoringManager) => m.teamSize > 0 ? m.activityCount / m.teamSize : 0

const progress = (m: TvMonitoringManager) => m.finalTarget > 0 ? Math.min(100, Math.max(0, m.activityCount / m.finalTarget * 100)) : 0
const pacePosition = (m: TvMonitoringManager) => m.finalTarget > 0 ? Math.min(100, m.expected / m.finalTarget * 100) : 0

const sortedMembers = computed(() => [...(manager.value?.members ?? [])].sort((a, b) => b.activityCount - a.activityCount || a.name.localeCompare(b.name)))

const neededLabel = computed(() => {
    const m = manager.value
    if (!m || m.finalTarget <= 0) return ''
    if (m.activityCount >= m.finalTarget) return 'Target tercapai!'
    if (props.report.daysElapsed >= props.report.daysTotal) return 'Periode selesai'
    return `Butuh ±${m.neededPerDay.toLocaleString('id-ID', { maximumFractionDigits: 1 })}/hari`
})

/* Chart scale: covers the target, and a total pushed below zero by churn. */
const yMax = computed(() => Math.max(manager.value?.finalTarget ?? 0, ...(manager.value?.cumulative ?? []), 1))
const yMin = computed(() => Math.min(0, ...(manager.value?.cumulative ?? [])))
const xOf = (i: number) => CHART.left + (CHART.width - CHART.left - CHART.right) * (props.report.daysTotal > 1 ? i / (props.report.daysTotal - 1) : 0)
const yOf = (v: number) => CHART.top + (CHART.height - CHART.top - CHART.bottom) * (1 - (v - yMin.value) / (yMax.value - yMin.value))
const paceAt = (i: number) => (manager.value?.finalTarget ?? 0) * (i + 1) / Math.max(props.report.daysTotal, 1)

const actualPoints = computed(() => (manager.value?.cumulative ?? []).map((v, i) => `${xOf(i)},${yOf(v)}`).join(' '))
const lastPoint = computed(() => {
    const c = manager.value?.cumulative ?? []
    return c.length ? { x: xOf(c.length - 1), y: yOf(c.at(-1)!) } : null
})
</script>
