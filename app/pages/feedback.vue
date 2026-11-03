<template>
    <UContainer>
        <HeroBackground />
        <div class="py-4 space-y-4">
            <div>
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Riwayat Feedback</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Masalah, saran, dan pujian yang pernah Anda kirim lewat tombol Laporkan Masalah, terbaru di atas.
                </p>
            </div>

            <UCard>
                <UTable
                    :columns="columns"
                    :data="rows"
                    :loading="loading"
                    :empty="error ? 'Riwayat feedback tidak bisa dimuat. Coba lagi nanti.' : 'Belum ada feedback yang Anda kirim.'"
                    class="flex-1"
                />
            </UCard>
        </div>
    </UContainer>
</template>

<script setup lang="ts">
import { UBadge } from '#components'
import type { TableColumn } from '@nuxt/ui'
import { feedbackService, type FeedbackItem } from '~/services/feedback-service'

const rows = ref<FeedbackItem[]>([])
const loading = ref(true)
const error = ref(false)

// Same values as the Laporkan Masalah form (FeedbackModal).
const TYPES: Record<string, { label: string, color: 'error' | 'info' | 'success' }> = {
    issue: { label: 'Masalah', color: 'error' },
    suggestion: { label: 'Saran', color: 'info' },
    compliment: { label: 'Pujian', color: 'success' }
}

// Follow-up status the team sets in the feedback sheet's Action column.
const actionColor = (action?: string | null): 'success' | 'error' | 'warning' | 'neutral' => {
    const a = (action ?? '').trim().toLowerCase()
    if (!a) return 'neutral'
    if (['done', 'selesai', 'approve', 'approved'].includes(a)) return 'success'
    if (['reject', 'rejected', 'ditolak', 'tolak'].includes(a)) return 'error'
    return 'warning'
}

const time = (v: string) => {
    const d = new Date(v)
    return Number.isNaN(d.getTime())
        ? v
        : d.toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const columns: TableColumn<FeedbackItem>[] = [
    { accessorKey: 'timestamp', header: 'Waktu', cell: ({ row }) => h('span', { class: 'whitespace-nowrap' }, time(row.original.timestamp)) },
    {
        accessorKey: 'type',
        header: 'Tipe',
        cell: ({ row }) => {
            const t = TYPES[row.original.type]
            return h(UBadge, { color: t?.color ?? 'neutral', variant: 'subtle', label: t?.label ?? (row.original.type || '-') })
        }
    },
    { accessorKey: 'message', header: 'Deskripsi', cell: ({ row }) => h('p', { class: 'whitespace-pre-line min-w-64' }, row.original.message) },
    {
        accessorKey: 'url',
        header: 'Halaman',
        cell: ({ row }) => row.original.url
            ? h('a', { href: row.original.url, target: '_blank', rel: 'noopener', class: 'text-xs text-blue-500 hover:underline break-all' }, row.original.url)
            : '-'
    },
    {
        accessorKey: 'image',
        header: 'Lampiran',
        cell: ({ row }) => h('div', { class: 'flex gap-1' }, (row.original.image ?? []).map((src, i) =>
            h('a', { href: src, target: '_blank', rel: 'noopener' }, [h('img', { src, alt: `Lampiran ${i + 1}`, class: 'size-12 rounded object-cover border border-gray-200 dark:border-gray-800' })])
        ))
    },
    {
        id: 'followUp',
        header: 'Tindak Lanjut',
        cell: ({ row }) => h('div', { class: 'space-y-1 min-w-40' }, [
            h(UBadge, { color: actionColor(row.original.Action), variant: 'subtle', label: row.original.Action || 'Belum ditindaklanjuti' }),
            row.original.Note ? h('p', { class: 'text-xs text-gray-500 dark:text-gray-400 whitespace-pre-line' }, row.original.Note) : null
        ])
    }
]

onMounted(async () => {
    try {
        const items = await feedbackService.list()
        rows.value = [...items].sort((a, b) => (Date.parse(b.timestamp) || 0) - (Date.parse(a.timestamp) || 0))
    } catch (e) {
        console.error('Failed to load feedback history:', e)
        error.value = true
    } finally {
        loading.value = false
    }
})
</script>
