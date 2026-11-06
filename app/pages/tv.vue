<template>
    <div class="tv-viewport">
        <div class="tv-canvas" :style="{ transform: `translate(-50%, -50%) scale(${scale})` }">
            <div class="tv-stripe" />

            <img src="/logo.png" alt="Nusanet" class="absolute right-24 top-16 h-16" />

            <div v-if="error" class="flex h-full items-center justify-center text-4xl text-slate-500">{{ error }}</div>
            <div v-else-if="!tourItem" class="flex h-full items-center justify-center text-4xl text-slate-500">Memuat data…</div>

            <template v-else>
                <TvMonitoringSlide v-if="monitorSlide && report" :key="monitorSlide.key" :slide="monitorSlide" :report="report" :days-left="daysLeftLabel" />
                <template v-else-if="slide">
                <header class="px-20 pt-16">
                    <p class="text-[28px] font-extrabold tracking-[0.18em] text-navy">{{ monthName(current!.period).toUpperCase() }} {{ current!.period.slice(0, 4) }} · {{ daysLeftLabel }}</p>
                    <h1 class="mt-2 max-w-[1440px] font-black leading-[0.98] tracking-tight" :class="slide.title.length > 35 ? 'text-[64px]' : 'text-[84px]'">
                        <span class="text-navy">WHO'S NEXT? </span><span class="text-brand">{{ slide.title }}</span>
                    </h1>
                    <p class="mt-4 text-[28px] font-extrabold tracking-[0.12em] text-navy">ACCOUNT MANAGER HOME · {{ slide.branch.toUpperCase() }}</p>
                </header>

                <main class="absolute left-20 right-28 bottom-16 top-[400px] flex gap-14">
                    <section class="w-[520px] shrink-0">
                        <p class="mb-5 text-[22px] font-extrabold tracking-[0.16em] text-slate-500">{{ monthName(previous!.period).toUpperCase() }} WINNER</p>
                        <!-- Cut-out photo: a football "Player of the Month" card. -->
                        <div v-if="slide.winners.length && slide.winners[0]!.photoCutout" :key="slide.key" class="potm-card relative h-[560px] overflow-hidden rounded-[28px]">
                            <div class="potm-rays absolute inset-0" />
                            <div class="potm-stripes absolute inset-0" />
                            <p class="potm-month absolute inset-x-0 top-24 text-center">{{ monthShort(previous!.period) }}</p>
                            <div class="potm-pop absolute left-7 top-6 z-10 text-center leading-none">
                                <p class="potm-rating">{{ slide.rating(slide.value(slide.winners[0]!)).value }}</p>
                                <p class="mt-1 text-lg font-black tracking-[0.12em] text-amber-200">{{ slide.rating(slide.value(slide.winners[0]!)).unit }}</p>
                                <div class="mx-auto mt-3 h-0.5 w-12 bg-amber-300/70" />
                                <p class="mt-2 text-sm font-black tracking-[0.2em] text-white/80">AM</p>
                            </div>
                            <span class="absolute right-6 top-6 z-10 rounded-lg bg-amber-400 px-3 py-1 text-lg font-black tracking-wider text-[#0f3d14]">★ BEST {{ monthShort(previous!.period) }}</span>
                            <!-- Walkout: the player rises in, then the "camera" keeps moving (zoom to the face, pan, back),
                                 framed left or right depending on the slide so each category looks different. -->
                            <div class="potm-walk absolute inset-x-0 bottom-[118px] flex" :class="slideIndex % 2 ? 'justify-end pr-2' : 'justify-center'">
                                <img :src="slide.winners[0]!.photoCutout" :alt="slide.winners[0]!.name" class="potm-player h-[400px] object-contain object-bottom" :class="slideIndex % 2 ? 'potm-player--alt' : ''" />
                            </div>
                            <div class="potm-plate potm-rise absolute inset-x-0 bottom-0 z-10 px-7 pb-6 pt-10 text-center text-white">
                                <p class="line-clamp-2 font-black uppercase leading-none tracking-tight" :style="{ fontSize: `${nameSize(slide.winners.map(w => w.name).join(' & '))}px` }">{{ slide.winners.map(w => w.name).join(' & ') }}</p>
                                <div class="mx-auto my-2.5 h-0.5 w-3/4 bg-gradient-to-r from-transparent via-amber-300 to-transparent" />
                                <p class="text-lg font-bold tracking-[0.18em] text-green-100">ACCOUNT MANAGER HOME</p>
                            </div>
                        </div>
                        <!-- Not cut out yet: the photo itself, with tint and vignette hiding the office wall behind it. -->
                        <div v-else-if="slide.winners.length" class="winner-card relative h-[560px] overflow-hidden rounded-[28px]">
                            <img :src="slide.winners[0]!.photoProfile" :alt="slide.winners[0]!.name" class="winner-photo size-full object-cover" />
                            <div class="winner-tint absolute inset-0" />
                            <div class="winner-vignette absolute inset-0" />
                            <div class="winner-sheen absolute inset-0" />
                            <div class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0f3d14] via-[#0f3d14]/70 to-transparent" />
                            <span class="absolute left-6 top-6 rounded-xl bg-brand px-4 py-1.5 text-2xl font-black text-white">★ BEST</span>
                            <div class="absolute inset-x-0 bottom-0 p-8 text-white">
                                <p class="text-[52px] font-black leading-none">{{ slide.winners.map(w => w.name).join(' & ') }}</p>
                                <p class="mt-3 text-xl font-bold tracking-[0.14em] text-green-100">ACCOUNT MANAGER HOME</p>
                                <p class="mt-1 text-3xl font-black tracking-wide">{{ slide.winnerLabel(slide.value(slide.winners[0]!)) }}</p>
                            </div>
                        </div>
                        <div v-else class="flex h-[560px] items-center justify-center rounded-[28px] bg-white/70 text-2xl text-slate-400">Belum ada pemenang</div>
                    </section>

                    <div class="w-px bg-slate-300/70" />

                    <section class="min-w-0 flex-1">
                        <p class="mb-5 text-[22px] font-extrabold tracking-[0.16em] text-slate-500">{{ monthName(current!.period).toUpperCase() }} RANKING</p>
                        <template v-for="group in rankingGroups" :key="group.key">
                            <!-- The top 3 stay put as a podium; this divider marks where the rest starts gliding. -->
                            <div v-if="group.scrolls" class="chase-divider">
                                <span>THE CHASERS</span>
                            </div>
                            <div
                                :class="group.scrolls ? 'tv-list overflow-hidden' : ''"
                                :style="group.scrolls ? { height: `${PAGE_SIZE * ROW_PX - 10}px` } : undefined"
                            >
                                <div :class="group.scrolls ? 'tv-list-inner' : ''" :style="group.scrolls ? { transform: `translate3d(0, -${scrollOffset}px, 0)` } : undefined">
                                    <div
                                        v-for="r in group.rows"
                                        :key="r.row.name"
                                        class="rank-row flex items-center gap-6 rounded-2xl px-6"
                                        :class="medal(r.rank) ? `rank-row--${medal(r.rank)}` : ''"
                                        :style="{ height: `${ROW_PX - 8}px`, marginBottom: '8px' }"
                                    >
                                        <span v-if="medal(r.rank)" class="medal" :class="`medal--${medal(r.rank)}`">
                                            <UIcon v-if="r.rank === 1" name="i-lucide-crown" class="medal-crown" />
                                            {{ r.rank }}
                                        </span>
                                        <span v-else class="w-14 text-center text-4xl font-black text-slate-400 tabular-nums">{{ r.rank }}</span>
                                        <div class="relative shrink-0">
                                            <UAvatar :src="r.row.photoProfile" :alt="r.row.name" class="size-14 text-xl ring-2" :class="medal(r.rank) ? `avatar--${medal(r.rank)}` : 'ring-white'" />
                                            <span v-if="slide.winnerNames.has(r.row.name)" class="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-navy px-1.5 text-[11px] font-black text-white">BEST {{ monthShort(previous!.period) }}</span>
                                        </div>
                                        <div class="min-w-0 flex-1">
                                            <p class="truncate text-[32px] font-extrabold leading-tight text-navy">{{ r.row.name }}</p>
                                            <p class="truncate text-lg text-slate-500">
                                                <span v-if="r.chase" class="chase-hint">{{ r.chase }}</span>
                                                <template v-else>Account Manager Home</template>
                                            </p>
                                        </div>
                                        <span v-if="r.move" class="move" :class="r.move > 0 ? 'move--up' : 'move--down'">{{ r.move > 0 ? '▲' : '▼' }} {{ Math.abs(r.move) }}</span>
                                        <span class="text-right text-[40px] font-black tabular-nums text-navy">{{ slide.format(slide.value(r.row)) }}</span>
                                    </div>
                                </div>
                            </div>
                        </template>
                        <p v-if="!slide.ranking.length" class="py-10 text-2xl text-slate-400">Belum ada data bulan ini.</p>
                    </section>
                </main>
                </template>

                <footer class="absolute bottom-6 left-20 right-44 flex items-center justify-between text-lg text-slate-500">
                    <div class="flex items-center gap-2">
                        <span v-for="(s, i) in tour" :key="s.key" class="h-2.5 rounded-full transition-all" :class="i === slideIndex ? 'w-10 bg-brand' : 'w-2.5 bg-slate-300'" />
                    </div>
                    <span class="flex items-center gap-2">
                        <span class="inline-flex size-3 rounded-full" :class="stale ? 'bg-amber-400' : 'bg-red-500 animate-pulse'" />
                        {{ stale ? 'Menyambung ulang…' : 'LIVE' }} · diperbarui {{ updatedAt }}
                    </span>
                </footer>
            </template>

            <!-- GOAL!: someone's numbers went up since the last refresh. Pauses the slideshow while it plays. -->
            <Transition name="goal">
                <div v-if="goal" :key="goal.id" class="goal-overlay absolute inset-0 z-50 flex items-center overflow-hidden">
                    <span v-for="c in goal.confetti" :key="c.i" class="confetti" :style="c.style" />
                    <div class="goal-photo relative ml-28 shrink-0">
                        <img v-if="goal.row.photoCutout" :src="goal.row.photoCutout" :alt="goal.row.name" class="h-[640px] object-contain object-bottom" />
                        <UAvatar v-else :src="goal.row.photoProfile" :alt="goal.row.name" class="size-[420px] text-8xl ring-8 ring-amber-300" />
                    </div>
                    <div class="ml-16 text-white">
                        <p class="goal-word">{{ goal.kind === 'service' ? '⚽ GOAL!' : '💰 PAID!' }}</p>
                        <p class="mt-4 text-[80px] font-black uppercase leading-none tracking-tight">{{ goal.row.name }}</p>
                        <p class="mt-6 inline-block rounded-2xl bg-amber-400 px-8 py-3 text-[56px] font-black text-[#0f3d14]">{{ goal.headline }}</p>
                        <p class="mt-6 text-4xl font-bold text-green-100">{{ goal.detail }}</p>
                    </div>
                </div>
            </Transition>
        </div>
    </div>
</template>

<script setup lang="ts">
import { branchLabel } from '~/composables/useBranchFilter'
import { tvService, type TvMonitoringData, type TvMonitoringMember, type TvSalesData, type TvSalesRow } from '~/services/tv-service'
import type { TvMonitoringSlideData } from '~/components/TvMonitoringSlide.vue'

// A lounge TV: no header, no login (the BE checks ?key=), sized for 1920x1080 and scaled to fit.
definePageMeta({ layout: false })
useHead({ title: "Who's Next? — Live" })

const route = useRoute()
const key = computed(() => String(route.query.key ?? ''))
// ?branch=Medan narrows the screen to one branch (same names as the summary branch filter).
const branch = computed(() => (route.query.branch ? String(route.query.branch) : ''))
const screen = computed(() => String(route.query.screen ?? ''))
/** Sales Managers per board slide. */
const BOARD_SIZE = 8
/** Account Managers per slide of ?screen=am. */
const AM_PAGE_SIZE = 10

const REFRESH_MS = 60 * 1000
/** The leaders stay put; the rest of the ranking (PAGE_SIZE rows visible) glides up so the bottom shows too. */
const PINNED = 3
const PAGE_SIZE = 3
const ROW_PX = 88
/**
 * Every slide shows for SLIDE_MS. The ranking glides at a readable speed after a short hold and
 * picks up where it stopped the next time that slide comes round, so long lists still reach the bottom.
 */
const SLIDE_MS = 15000
const SCROLL_PX_PER_SECOND = 45
const HOLD_MS = 2500
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

const data = ref<TvSalesData | null>(null)
const report = ref<TvMonitoringData | null>(null)
const error = ref('')
const stale = ref(false)
const scale = ref(1)
const slideIndex = ref(0)
const slideElapsed = ref(0)

const monthName = (p: string) => MONTHS[Number(p.slice(4, 6)) - 1]!
const monthShort = (p: string) => monthName(p).slice(0, 3).toUpperCase()
/** The lounge is semi-public: rupiah amounts stay off the screen; the subscription ranking still orders by them. */
const SHOW_AMOUNTS = false

const compactRupiah = (v: number) => Math.abs(v) >= 1_000_000
    ? `Rp ${(v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
    : `Rp ${Math.round(v / 1000).toLocaleString('id-ID')} rb`

const updatedAt = computed(() => data.value?.generatedTime ?? '')

const isBranch = (r: TvSalesRow, name: string) => branchLabel(r.branch).toLowerCase() === name.toLowerCase()
const inBranch = (rows: TvSalesRow[]) => branch.value ? rows.filter(r => isBranch(r, branch.value)) : rows
const previous = computed(() => data.value?.previous)
const current = computed(() => data.value?.current)

const daysLeftLabel = computed(() => {
    if (!data.value) return ''
    return data.value.daysLeft <= 1 ? 'LAST DAY' : `${data.value.daysLeft} DAYS LEFT`
})

/** Highest value first, numbered 1, 2, 3, … (no shared ranks on a TV); ties go to the other metric, then the name. */
const rankBy = (rows: TvSalesRow[], value: (r: TvSalesRow) => number, tiebreak: (r: TvSalesRow) => number) =>
    [...rows]
        .sort((a, b) => value(b) - value(a) || tiebreak(b) - tiebreak(a) || a.name.localeCompare(b.name))
        .map((row, i) => ({ row, rank: i + 1 }))

const services = (r: TvSalesRow) => r.activityCount
const subscription = (r: TvSalesRow) => r.newSubscription

/** The running period's rows as they stood when the day started (only AMs already on the board then). */
const baselineRows = computed(() => {
    const base = new Map((data.value?.baseline ?? []).map(b => [b.name, b]))
    return (current.value?.rows ?? []).flatMap((r) => {
        const b = base.get(r.name)
        return b ? [{ ...r, activityCount: b.activityCount, newSubscription: b.newSubscription }] : []
    })
})

const firstName = (name: string) => name.split(' ')[0]

/**
 * ?branch= shows that branch; without it the screen tours every branch (biggest first), each with
 * its own last-month winner and its own ranking.
 */
const screenBranches = computed(() => {
    if (branch.value) return [branch.value]
    const count = new Map<string, number>()
    for (const r of current.value?.rows ?? []) count.set(branchLabel(r.branch), (count.get(branchLabel(r.branch)) ?? 0) + 1)
    return [...count.keys()].sort((a, b) => count.get(b)! - count.get(a)! || a.localeCompare(b))
})

const slides = computed(() => {
    if (!previous.value || !current.value) return []
    const metrics = [
        { title: 'BEST NEW SERVICE OF THE MONTH', value: services, tiebreak: subscription, format: (v: number) => String(v), gapLabel: (gap: number) => `+${gap + 1}`, winnerLabel: (v: number) => `${v} NEW SERVICES`, rating: (v: number) => ({ value: String(v), unit: 'SVC' }) },
        { title: 'BEST NEW SUBSCRIPTION BILLING PAID OF THE MONTH', value: subscription, tiebreak: services, format: (v: number) => (SHOW_AMOUNTS ? compactRupiah(v) : ''), gapLabel: (gap: number) => (SHOW_AMOUNTS ? `+${compactRupiah(Math.max(gap, 1000))}` : ''), winnerLabel: (v: number) => (SHOW_AMOUNTS ? compactRupiah(v).toUpperCase() : 'BILLING PAID CHAMPION'), rating: (v: number) => (SHOW_AMOUNTS ? { value: (v / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 }), unit: 'JUTA' } : { value: '#1', unit: 'PAID' }) }
    ]
    return screenBranches.value.flatMap(b => metrics.map((m) => {
        const prev = previous.value!.rows.filter(r => isBranch(r, b))
        const now = current.value!.rows.filter(r => isBranch(r, b))
        const last = rankBy(prev, m.value, m.tiebreak)
        const winners = last.filter(r => r.rank === 1 && m.value(r.row) > 0).map(r => r.row)
        const startOfDay = new Map(rankBy(baselineRows.value.filter(r => isBranch(r, b)), m.value, m.tiebreak).map(r => [r.row.name, r.rank]))
        const ranked = rankBy(now, m.value, m.tiebreak)
        const ranking = ranked.map((r, i) => {
            // How far to the next goal: the podium for ranks 4–6, otherwise the person just above.
            const target = r.rank >= 4 && r.rank <= 6 ? ranked[2] : ranked[i - 1]
            const gap = target ? m.value(target.row) - m.value(r.row) : 0
            const goal = target ? (target.rank === 3 && r.rank > 3 ? 'masuk Top 3' : `salip ${firstName(target.row.name)}`) : ''
            const was = startOfDay.get(r.row.name)
            return {
                ...r,
                chase: target ? (m.gapLabel(gap) ? `${m.gapLabel(gap)} lagi ${goal}` : `Ayo ${goal}!`) : '',
                // Positive = climbed since the day started.
                move: was ? was - r.rank : 0
            }
        })
        return { ...m, key: `${b}-${m.title}`, branch: b, winners, winnerNames: new Set(winners.map(w => w.name)), ranking }
    }))
})

/** Long names step down in size (up to two lines) instead of being cut off on the winner card. */
const nameSize = (name: string) => name.length <= 14 ? 46 : name.length <= 22 ? 36 : 30

const MEDALS = ['gold', 'silver', 'bronze'] as const
const medal = (rank: number) => MEDALS[rank - 1] ?? null

/** Daily monitoring: one board of every Sales Manager, then each team in turn. */
const monitorSlides = computed<TvMonitoringSlideData[]>(() => {
    const managers = [...(report.value?.managers ?? [])]
        .filter(m => !branch.value || branchLabel(m.branch).toLowerCase() === branch.value.toLowerCase())
        .sort((a, b) => b.achievementPercentage - a.achievementPercentage || a.name.localeCompare(b.name))
    const boards: TvMonitoringSlideData[] = []
    for (let i = 0; i < managers.length; i += BOARD_SIZE) {
        boards.push({ key: `board-${i}`, kind: 'board', firstRank: i + 1, managers: managers.slice(i, i + BOARD_SIZE) })
    }
    return [...boards, ...managers.map(manager => ({ key: `team-${manager.name}`, kind: 'manager' as const, manager }))]
})

/** ?screen=am: every Account Manager, ranked within their branch (biggest branch first), a page at a time. */
const amSlides = computed<TvMonitoringSlideData[]>(() => {
    const everyone = [
        ...(report.value?.managers ?? []).flatMap(m => m.members.map(member => ({ ...member, team: m.name }))),
        ...(report.value?.otherAccountManagers ?? []).map(am => ({ ...am, team: am.team ?? '–' }))
    ]
    const byBranch = new Map<string, (TvMonitoringMember & { team: string })[]>()
    for (const am of everyone) {
        const label = branchLabel(am.branch)
        if (branch.value && label.toLowerCase() !== branch.value.toLowerCase()) continue
        byBranch.set(label, [...(byBranch.get(label) ?? []), am])
    }
    return [...byBranch.entries()]
        .sort(([a, x], [b, y]) => y.length - x.length || a.localeCompare(b))
        .flatMap(([label, members]) => {
            const ranked = members.sort((a, b) => b.activityCount - a.activityCount || a.name.localeCompare(b.name))
            const pages = Math.ceil(ranked.length / AM_PAGE_SIZE)
            return Array.from({ length: pages }, (_, p) => ({
                key: `am-${label}-${p}`,
                kind: 'am' as const,
                branch: label,
                page: p + 1,
                pages,
                firstRank: p * AM_PAGE_SIZE + 1,
                rows: ranked.slice(p * AM_PAGE_SIZE, (p + 1) * AM_PAGE_SIZE)
            }))
        })
})

/** Each link shows one thing: ?screen=monitoring the Sales Managers, ?screen=am the Account Managers, otherwise the rankings. */
const tour = computed(() => {
    if (screen.value === 'am') return amSlides.value
    if (screen.value === 'monitoring') return monitorSlides.value
    return slides.value
})
const tourItem = computed(() => tour.value[slideIndex.value % Math.max(1, tour.value.length)])
const slide = computed(() => {
    const item = tourItem.value
    return item && 'ranking' in item ? item : undefined
})
const monitorSlide = computed(() => {
    const item = tourItem.value
    return item && 'kind' in item ? item : undefined
})
const rankingGroups = computed(() => {
    const ranking = slide.value?.ranking ?? []
    return [
        { key: 'pinned', scrolls: false, rows: ranking.slice(0, PINNED) },
        ...(ranking.length > PINNED ? [{ key: 'rest', scrolls: true, rows: ranking.slice(PINNED) }] : [])
    ]
})
/** How far the scrolling part travels: everything below the pinned rows, minus what fits in view. */
const maxOffset = computed(() => Math.max(0, ((slide.value?.ranking.length ?? 0) - PINNED - PAGE_SIZE) * ROW_PX))
/** Where each slide's ranking stopped last time it was on screen. */
const resumeAt = ref<number[]>([])
const scrollOffset = computed(() => Math.min(maxOffset.value,
    Math.min(resumeAt.value[slideIndex.value] ?? 0, maxOffset.value) + Math.max(0, slideElapsed.value - HOLD_MS) / 1000 * SCROLL_PX_PER_SECOND))

/** One animation frame of the slideshow: glide through the ranking, then move to the next category. */
let lastFrame = 0
let frame = 0
const animate = (t: number) => {
    // Capped so a frame after the tab was hidden doesn't jump the scroll; frozen while a GOAL! plays.
    if (!goal.value) slideElapsed.value += lastFrame ? Math.min(100, t - lastFrame) : 0
    lastFrame = t
    if (slideElapsed.value >= SLIDE_MS) {
        // Reached the bottom: start from the top next time; otherwise continue from here.
        resumeAt.value[slideIndex.value] = scrollOffset.value >= maxOffset.value ? 0 : scrollOffset.value
        slideElapsed.value = 0
        slideIndex.value = (slideIndex.value + 1) % Math.max(1, tour.value.length)
    }
    frame = requestAnimationFrame(animate)
}

const load = async () => {
    if (!key.value) {
        error.value = 'Alamat tampilan TV belum lengkap (key tidak ada).'
        return
    }
    if (screen.value === 'am' || screen.value === 'monitoring') {
        tvService.monitoring(key.value).then((next) => { report.value = next }).catch(() => { stale.value = true })
    }
    try {
        const next = await tvService.sales(key.value)
        if (data.value && data.value.current.period === next.current.period) queueGoals(data.value.current.rows, next.current.rows)
        else if (!data.value && route.query.demo === 'goal') queueDemoGoal(next.current.rows)
        data.value = next
        error.value = ''
        stale.value = false
    } catch (e: any) {
        // Keep showing the last data through a network blip; a bad key gets a message.
        if (e?.response?.status === 404) error.value = 'Key tampilan TV tidak valid.'
        else stale.value = true
    }
}

/* GOAL!: compare each refresh with the one before and celebrate whoever went up. */
const GOAL_MS = 6500
const CONFETTI_COLORS = ['#facc15', '#22c55e', '#ffffff', '#f97316', '#38bdf8', '#e11d48']

type Goal = { id: number; kind: 'service' | 'paid'; row: TvSalesRow; headline: string; detail: string; confetti: { i: number; style: Record<string, string> }[] }
const goal = ref<Goal | null>(null)
const goalQueue: Goal[] = []
let goalId = 0
let goalTimer: ReturnType<typeof setTimeout> | undefined

const confetti = () => Array.from({ length: 70 }, (_, i) => ({
    i,
    style: {
        left: `${Math.random() * 100}%`,
        background: CONFETTI_COLORS[i % CONFETTI_COLORS.length]!,
        animationDelay: `${Math.random() * 1.5}s`,
        animationDuration: `${2.5 + Math.random() * 2.5}s`,
        transform: `rotate(${Math.random() * 360}deg)`
    }
}))

const makeGoal = (row: TvSalesRow, kind: Goal['kind'], delta: number, rows: TvSalesRow[]): Goal => {
    const rank = rankBy(rows, kind === 'service' ? services : subscription, kind === 'service' ? subscription : services)
        .find(r => r.row.name === row.name)?.rank
    return {
        id: ++goalId,
        kind,
        row,
        headline: kind === 'service' ? `+${delta} NEW SERVICE` : SHOW_AMOUNTS ? `+${compactRupiah(delta).toUpperCase()} BILLING PAID` : 'NEW BILLING PAID',
        detail: kind === 'service'
            ? `${row.activityCount} layanan baru bulan ini${rank ? ` · peringkat #${rank}` : ''}`
            : `${SHOW_AMOUNTS ? `${compactRupiah(row.newSubscription)} bulan ini` : 'Subscription new'}${rank ? ` · peringkat #${rank}` : ''}`,
        confetti: confetti()
    }
}

const playNextGoal = () => {
    goal.value = goalQueue.shift() ?? null
    if (goal.value) goalTimer = setTimeout(playNextGoal, GOAL_MS)
}

const enqueue = (goals: Goal[]) => {
    goalQueue.push(...goals)
    if (!goal.value) playNextGoal()
}

const queueGoals = (before: TvSalesRow[], after: TvSalesRow[]) => {
    const old = new Map(before.map(r => [r.name, r]))
    const rows = inBranch(after)
    enqueue(rows.flatMap((r) => {
        const o = old.get(r.name)
        if (!o) return []
        if (r.activityCount > o.activityCount) return [makeGoal(r, 'service', r.activityCount - o.activityCount, rows)]
        if (r.newSubscription > o.newSubscription) return [makeGoal(r, 'paid', r.newSubscription - o.newSubscription, rows)]
        return []
    }))
}

/** ?demo=goal plays one celebration on load, to show what it looks like. */
const queueDemoGoal = (rows: TvSalesRow[]) => {
    const top = rankBy(inBranch(rows), services, subscription)[0]?.row
    if (top) setTimeout(() => enqueue([makeGoal(top, 'service', 1, inBranch(rows))]), 1500)
}

const fit = () => { scale.value = Math.min(window.innerWidth / 1920, window.innerHeight / 1080) }

let refreshTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
    fit()
    window.addEventListener('resize', fit)
    frame = requestAnimationFrame(animate)
    refreshTimer = setInterval(load, REFRESH_MS)
    load()
})
onBeforeUnmount(() => {
    window.removeEventListener('resize', fit)
    cancelAnimationFrame(frame)
    clearInterval(refreshTimer)
    clearTimeout(goalTimer)
})
</script>

<style scoped>
.tv-viewport {
    position: fixed;
    inset: 0;
    overflow: hidden;
    background: #eef6ee;
}
.tv-canvas {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 1920px;
    height: 1080px;
    overflow: hidden;
    transform-origin: center;
    font-family: 'Public Sans', sans-serif;
    background:
        radial-gradient(900px 700px at 15% 85%, rgba(134, 239, 172, 0.35), transparent),
        linear-gradient(135deg, #ffffff 0%, #f3f8f3 60%, #e7f3e7 100%);
}
/* The green diagonal band down the right edge, as in the HR lounge design. */
.tv-stripe {
    position: absolute;
    top: -10%;
    right: 18px;
    width: 46px;
    height: 120%;
    background: linear-gradient(180deg, #3aa935, #1f7a1f);
    transform: skewX(-6deg);
}
.text-navy { color: #24205f; }
.bg-navy { background-color: #24205f; }
.text-brand { color: #2f9e2a; }
.bg-brand { background-color: #2f9e2a; }
/* Winner photo: brand-green frame and glow, gently graded so any phone snapshot looks deliberate. */
.winner-card {
    background: linear-gradient(160deg, #3aa935, #1f6b1f);
    box-shadow: 0 0 0 6px #ffffff, 0 0 0 9px rgba(47, 158, 42, 0.55), 0 30px 60px -20px rgba(20, 83, 45, 0.45);
}
.winner-photo {
    object-position: center 20%;
    filter: contrast(1.08) saturate(1.12) brightness(1.04);
}
/* "Player of the Month": stadium-green card, spotlight rays, gold accents, the cut-out player in front. */
.potm-card {
    background: radial-gradient(circle at 50% 28%, #4ade80 0%, #16a34a 32%, #14532d 70%, #052e16 100%);
    box-shadow: 0 0 0 5px #facc15, 0 0 0 9px #ffffff, 0 30px 60px -20px rgba(20, 83, 45, 0.6);
}
.potm-rays {
    background: repeating-conic-gradient(from -90deg at 50% -10%, rgba(255, 255, 255, 0.10) 0deg 4deg, transparent 4deg 12deg);
    mask-image: linear-gradient(to bottom, black 20%, transparent 75%);
}
.potm-stripes {
    background: repeating-linear-gradient(120deg, rgba(255, 255, 255, 0.05) 0 18px, transparent 18px 46px);
}
/* The month, huge and outlined, behind the player. */
.potm-month {
    font-size: 220px;
    font-weight: 900;
    line-height: 1;
    letter-spacing: -0.04em;
    color: transparent;
    -webkit-text-stroke: 3px rgba(255, 255, 255, 0.22);
}
.potm-rating {
    font-size: 84px;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.04em;
    color: #fde68a;
    text-shadow: 0 4px 14px rgba(0, 0, 0, 0.35);
}
.potm-player {
    filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.45)) contrast(1.06) saturate(1.1);
    transform-origin: 50% 30%;
    animation: potm-camera 16s ease-in-out 1.4s infinite;
}
.potm-player--alt {
    animation-name: potm-camera-alt;
}

/* Walkout animation; the card is keyed by slide, so it all replays when the category changes. */
.potm-card {
    animation: potm-flip 0.9s cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.potm-card::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 20;
    pointer-events: none;
    background: linear-gradient(105deg, transparent 40%, rgba(255, 255, 255, 0.35) 50%, transparent 60%);
    transform: translateX(-120%);
    animation: potm-shine 7s ease-in-out 1.2s infinite;
}
.potm-rays {
    transform-origin: 50% -10%;
    animation: potm-sway 9s ease-in-out infinite alternate;
}
.potm-month {
    animation: potm-slide 1s ease-out 0.4s both;
}
.potm-walk {
    animation: potm-rise-in 1s cubic-bezier(0.2, 0.9, 0.3, 1.2) 0.4s both;
}
.potm-pop {
    animation: potm-pop 0.6s cubic-bezier(0.3, 1.6, 0.5, 1) 1s both;
}
.potm-rise {
    animation: potm-plate 0.7s ease-out 0.8s both;
}
@keyframes potm-flip {
    from { transform: perspective(1200px) rotateY(-75deg) scale(0.9); opacity: 0; }
    to { transform: none; opacity: 1; }
}
@keyframes potm-shine {
    0%, 70% { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
}
@keyframes potm-sway {
    from { transform: scale(1.4) rotate(-5deg); }
    to { transform: scale(1.4) rotate(5deg); }
}
@keyframes potm-slide {
    from { transform: translateX(-60px); opacity: 0; }
    to { transform: none; opacity: 1; }
}
@keyframes potm-rise-in {
    from { transform: translateY(120px) scale(0.85); opacity: 0; }
    to { transform: none; opacity: 1; }
}
@keyframes potm-pop {
    from { transform: scale(0.3); opacity: 0; }
    to { transform: none; opacity: 1; }
}
@keyframes potm-plate {
    from { transform: translateY(60px); opacity: 0; }
    to { transform: none; opacity: 1; }
}
/* The "camera": breathe, push in on the face, drift across, pull back out. */
@keyframes potm-camera {
    0%, 100% { transform: none; }
    15% { transform: translateY(-6px); }
    30%, 45% { transform: scale(1.35) translateY(14%); }
    60% { transform: scale(1.2) translate(-6%, 8%); }
    75% { transform: scale(1.2) translate(6%, 8%); }
    90% { transform: translateY(-4px); }
}
@keyframes potm-camera-alt {
    0%, 100% { transform: none; }
    20%, 40% { transform: scale(1.3) translate(-8%, 12%); }
    60% { transform: scale(1.1) translate(-14%, 4%); }
    80% { transform: translateY(-6px); }
}
.potm-plate {
    background: linear-gradient(to top, #052e16 0%, #052e16 55%, rgba(5, 46, 22, 0.85) 75%, transparent);
}
/* Green cast over the background; soft-light keeps skin tones natural. */
.winner-tint {
    background: linear-gradient(180deg, rgba(47, 158, 42, 0.55), rgba(15, 61, 20, 0.35));
    mix-blend-mode: soft-light;
}
/* Darken the edges (where the office wall shows) and keep the face in the light. */
.winner-vignette {
    background: radial-gradient(ellipse 70% 60% at 50% 35%, transparent 45%, rgba(15, 61, 20, 0.6) 100%);
}
.winner-sheen {
    background: linear-gradient(115deg, rgba(255, 255, 255, 0.18) 0%, transparent 35%);
}
/* Podium rows: gold / silver / bronze tint, medal badge, matching avatar ring. */
.rank-row--gold {
    background: linear-gradient(90deg, rgba(250, 204, 21, 0.30), rgba(250, 204, 21, 0.06));
    box-shadow: inset 6px 0 0 #eab308, 0 8px 24px -14px rgba(161, 98, 7, 0.6);
}
.rank-row--silver {
    background: linear-gradient(90deg, rgba(148, 163, 184, 0.28), rgba(148, 163, 184, 0.05));
    box-shadow: inset 6px 0 0 #94a3b8;
}
.rank-row--bronze {
    background: linear-gradient(90deg, rgba(217, 119, 6, 0.22), rgba(217, 119, 6, 0.04));
    box-shadow: inset 6px 0 0 #c2702a;
}
.medal {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    border-radius: 9999px;
    font-size: 30px;
    font-weight: 900;
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
    border: 3px solid rgba(255, 255, 255, 0.85);
}
.medal--gold { background: radial-gradient(circle at 30% 25%, #fef08a, #eab308 55%, #a16207); box-shadow: 0 0 18px rgba(234, 179, 8, 0.65); }
.medal--silver { background: radial-gradient(circle at 30% 25%, #f8fafc, #94a3b8 55%, #475569); }
.medal--bronze { background: radial-gradient(circle at 30% 25%, #fed7aa, #c2702a 55%, #7c2d12); }
.medal-crown {
    position: absolute;
    top: -22px;
    width: 26px;
    height: 26px;
    color: #eab308;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.25));
}
.avatar--gold { --tw-ring-color: #eab308; }
.avatar--silver { --tw-ring-color: #94a3b8; }
.avatar--bronze { --tw-ring-color: #c2702a; }
/* Divider between the podium and the gliding rest. */
.chase-divider {
    display: flex;
    align-items: center;
    gap: 16px;
    margin: 4px 0 10px;
    font-size: 16px;
    font-weight: 900;
    letter-spacing: 0.3em;
    color: #2f9e2a;
}
.chase-divider::before,
.chase-divider::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(47, 158, 42, 0.5), transparent);
}
/* Rank movement since the day started, and the distance to the next goal. */
.move {
    flex-shrink: 0;
    border-radius: 9999px;
    padding: 4px 12px;
    font-size: 22px;
    font-weight: 900;
}
.move--up { background: #dcfce7; color: #15803d; }
.move--down { background: #ffe4e6; color: #be123c; }
.chase-hint {
    font-weight: 800;
    color: #2f9e2a;
}

.goal-overlay {
    background:
        repeating-conic-gradient(from -90deg at 30% 110%, rgba(255, 255, 255, 0.07) 0deg 5deg, transparent 5deg 14deg),
        radial-gradient(circle at 30% 60%, #22c55e 0%, #15803d 35%, #052e16 85%);
}
.goal-photo {
    animation: goal-in 0.8s cubic-bezier(0.2, 0.9, 0.3, 1.3) both;
    filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.5));
}
.goal-word {
    font-size: 190px;
    font-weight: 900;
    line-height: 0.9;
    letter-spacing: -0.03em;
    color: #fde047;
    text-shadow: 0 8px 0 #a16207, 0 20px 40px rgba(0, 0, 0, 0.45);
    animation: goal-word 0.7s cubic-bezier(0.3, 1.8, 0.5, 1) 0.2s both, goal-pulse 1.2s ease-in-out 1s infinite;
}
.confetti {
    position: absolute;
    top: -30px;
    width: 14px;
    height: 26px;
    border-radius: 3px;
    animation-name: confetti-fall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
}
.goal-enter-active, .goal-leave-active { transition: opacity 0.5s ease, transform 0.5s ease; }
.goal-enter-from, .goal-leave-to { opacity: 0; transform: scale(1.04); }
@keyframes goal-in {
    from { transform: translateY(200px) scale(0.7); opacity: 0; }
    to { transform: none; opacity: 1; }
}
@keyframes goal-word {
    from { transform: scale(0.2) rotate(-8deg); opacity: 0; }
    to { transform: none; opacity: 1; }
}
@keyframes goal-pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
}
@keyframes confetti-fall {
    to { top: 110%; transform: rotate(720deg) translateX(80px); }
}
/* Fade the scrolling ranking in and out at both edges as it glides under the pinned leaders. */
.tv-list {
    mask-image: linear-gradient(to bottom, transparent, black 12%, black 82%, transparent);
}
.tv-list-inner {
    will-change: transform;
}
</style>
