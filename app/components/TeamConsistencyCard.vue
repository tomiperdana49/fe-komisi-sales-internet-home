<template>
    <UCard>
        <div class="mb-3">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Bonus Konsistensi Tim</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">
                Posisi tiap Account Manager di blok Bonus Konsistensinya. Yang bloknya dinilai di {{ periodLabel(period) }} ada di atas — ingatkan yang masih kurang pencapaian atau belum mencatat testimoni.
            </p>
        </div>

        <SummaryStats :stats="stats" class="mb-4" />

        <UTable sticky :data="sortedRows" :columns="columns" empty="Tidak ada anggota tim dengan Bonus Konsistensi otomatis pada periode ini." class="flex-1 max-h-[600px]" />
    </UCard>
</template>

<script setup lang="ts">
import { NuxtLink, UBadge, UIcon } from '#components'
import type { TableColumn } from '@nuxt/ui'
import type { ConsistencyProgress, TeamConsistencyRow } from '~/types/sales'

const props = defineProps<{
    rows: TeamConsistencyRow[]
    /** The period selected on the page (YYYYMM). */
    period: string
}>()

const { formatCurrency } = useFormat()
const { periodLabel, shiftPeriod, blockTotal, shortfall } = useConsistencyProgress()

const endsNow = (p: ConsistencyProgress) => p.status === 'running' && p.blockEnd === props.period
const testimonialMet = (p: ConsistencyProgress) => p.testimonials >= p.minTestimonials

/** On track for at least the first tier right now: every month so far at the minimum, total reached, testimonials in. */
const onTrack = (p: ConsistencyProgress) => p.status === 'running' && shortfall(p, props.period) === 0 && testimonialMet(p)

const tierAmount = (p: ConsistencyProgress) => {
    const total = blockTotal(p)
    return p.tiers.reduce((amount, t) => (total >= t.at ? t.amount : amount), 0)
}

const rank = (p: ConsistencyProgress) => (endsNow(p) ? 0 : p.status === 'running' ? 1 : p.status === 'notStarted' ? 2 : 3)
const sortedRows = computed(() => [...props.rows].sort((a, b) =>
    rank(a.progress) - rank(b.progress)
    || shortfall(a.progress, props.period) - shortfall(b.progress, props.period)
    || a.name.localeCompare(b.name)
))

const stats = computed(() => {
    const dueNow = props.rows.filter(r => endsNow(r.progress))
    return [
        { label: `Dinilai ${periodLabel(props.period)}`, value: dueNow.length, note: 'Blok berakhir periode ini' },
        { label: 'Sudah memenuhi syarat', value: dueNow.filter(r => onTrack(r.progress)).length, note: 'Sementara, dari yang dinilai' },
        { label: 'Belum ada testimoni', value: dueNow.filter(r => !testimonialMet(r.progress)).length, note: 'Dari yang dinilai' }
    ]
})

const columns: TableColumn<TeamConsistencyRow>[] = [
    {
        accessorKey: 'name',
        header: 'Account Manager',
        cell: ({ row }) => h(NuxtLink, { to: `/${row.original.employeeId}/sales`, class: 'font-medium text-primary-600 hover:underline' }, () => row.original.name)
    },
    {
        id: 'block',
        header: 'Blok',
        cell: ({ row }) => `${periodLabel(row.original.progress.blockStart)} – ${periodLabel(row.original.progress.blockEnd)}`
    },
    {
        id: 'months',
        header: 'Pencapaian per bulan',
        cell: ({ row }) => {
            const p = row.original.progress
            return h('div', { class: 'flex gap-1.5' }, p.months.map(m => h('span', {
                title: periodLabel(m.period),
                class: [
                    'inline-flex min-w-9 justify-center rounded px-1.5 py-0.5 text-xs font-medium',
                    m.activityCount === null
                        ? 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                        : m.activityCount >= p.minPerMonth
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : m.period >= props.period
                                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                ]
            }, m.activityCount === null ? '–' : String(m.activityCount))))
        }
    },
    {
        id: 'total',
        header: 'Total',
        cell: ({ row }) => `${blockTotal(row.original.progress)} / ${row.original.progress.tiers[0]?.at ?? 0}`
    },
    {
        id: 'testimonials',
        header: 'Testimoni',
        cell: ({ row }) => {
            const p = row.original.progress
            const met = testimonialMet(p)
            return h('span', { class: ['inline-flex items-center gap-1 text-sm', met ? 'text-green-600' : 'text-orange-600'] }, [
                h(UIcon, { name: met ? 'i-lucide-circle-check' : 'i-lucide-circle-alert', class: 'size-4' }),
                `${p.testimonials} / ${p.minTestimonials}`
            ])
        }
    },
    {
        id: 'status',
        header: 'Keterangan',
        cell: ({ row }) => {
            const p = row.original.progress
            if (p.status === 'failed') return h(UBadge, { color: 'error', variant: 'subtle', label: `Gagal, mulai lagi ${periodLabel(shiftPeriod(p.blockEnd, 1))}` })
            if (p.status === 'manual') return h(UBadge, { color: 'success', variant: 'subtle', label: 'Diberikan manual' })
            if (p.status === 'notStarted') return h(UBadge, { color: 'neutral', variant: 'subtle', label: `Mulai ${periodLabel(p.blockStart)}` })
            const missing = shortfall(p, props.period)
            const notes = [
                missing > 0 ? `kurang ${missing} lagi` : `sementara ${formatCurrency(tierAmount(p))}`,
                ...(testimonialMet(p) ? [] : ['belum ada testimoni'])
            ]
            const color = onTrack(p) ? 'success' : endsNow(p) ? 'warning' : 'info'
            return h('div', { class: 'flex flex-col gap-0.5' }, [
                h(UBadge, { color, variant: 'subtle', label: endsNow(p) ? `Dinilai ${periodLabel(p.blockEnd)}` : `Berjalan, dinilai ${periodLabel(p.blockEnd)}`, class: 'self-start' }),
                h('span', { class: 'text-xs text-gray-500 dark:text-gray-400' }, notes.join(', '))
            ])
        }
    }
]
</script>
