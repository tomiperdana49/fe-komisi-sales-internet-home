<template>
    <UCard>
        <div class="mb-3">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Persetujuan &amp; Perubahan Admin</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400">Transaksi periode ini yang dibebaskan atau diubah manual oleh admin, beserta alasannya.</p>
        </div>
        <UTable
            :data="rows"
            :columns="columns"
            empty="Tidak ada transaksi yang dibebaskan atau diubah admin pada periode ini."
            class="flex-1"
        />
    </UCard>
</template>

<script setup lang="ts">
import { h } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { ChurnRow, CommissionLineItem } from '~/types/sales'

const props = defineProps<{
    items: CommissionLineItem[]
    churn: ChurnRow[]
}>()

const { formatCurrency } = useFormat()
const UBadge = resolveComponent('UBadge')

type ChangeRow = {
    key: string
    kind: 'late' | 'churn' | 'adjusted'
    account: string | null
    serviceId: number | null
    customerId: string
    customerName: string | null
    detail: string
    note: string | null
    by: string | null
    at: string | null
}

const KIND = {
    late: { label: 'Telat Bayar Dibebaskan', color: 'success' },
    churn: { label: 'Churn Dibebaskan', color: 'success' },
    adjusted: { label: 'Diubah Admin', color: 'warning' }
} as const

const TYPE_LABEL: Record<string, string> = { new: 'New', recurring: 'Recurring', prorate: 'Prorate', upgrade: 'Upgrade', alat: 'Alat', setup: 'Setup' }

const rows = computed<ChangeRow[]>(() => [
    ...props.items
        .filter(i => i.isApproved && i.lateMonth > 0)
        .map(i => ({
            key: `late-${i.aiInvoice}`,
            kind: 'late' as const,
            account: i.customerServiceAccount,
            serviceId: i.customerServiceId,
            customerId: i.customerId,
            customerName: i.customerName,
            detail: `Telat ${i.lateMonth} bln · tidak dipotong`,
            note: i.approvalNote ?? null,
            by: i.approvedByName ?? i.approvedBy ?? null,
            at: i.approvedAt ?? null
        })),
    ...props.churn
        .filter(c => c.is_approved)
        .map(c => ({
            key: `churn-${c.customer_service_id}`,
            kind: 'churn' as const,
            account: c.customer_service_account,
            serviceId: c.customer_service_id,
            customerId: c.customer_id,
            customerName: c.customer_name,
            detail: `Potongan ${formatCurrency(c.commission)} tidak dikenakan`,
            note: c.approval_note,
            by: c.approved_by_name ?? c.approved_by ?? null,
            at: c.approved_at ?? null
        })),
    ...props.items
        .filter(i => i.isAdjusted)
        .map(i => ({
            key: `adjusted-${i.aiInvoice}-${i.type}`,
            kind: 'adjusted' as const,
            account: i.customerServiceAccount,
            serviceId: i.customerServiceId,
            customerId: i.customerId,
            customerName: i.customerName,
            detail: `${TYPE_LABEL[i.type] ?? i.type} · ${formatCurrency(i.subscription)}`,
            note: i.adjustmentNote ?? null,
            by: i.adjustedByName ?? null,
            at: i.adjustedAt ?? null
        }))
])

const formatWhen = (at: string | null) => at ? new Date(at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : ''

const columns: TableColumn<ChangeRow>[] = [
    {
        id: 'kind',
        header: 'Jenis',
        cell: ({ row }) => h(UBadge, { color: KIND[row.original.kind].color, variant: 'subtle', size: 'sm' }, () => KIND[row.original.kind].label)
    },
    {
        id: 'service',
        header: 'Layanan',
        cell: ({ row }) => h('div', { class: 'flex flex-col' }, [
            h('a', { href: `https://isx.nusa.net.id/v2/customer/service/${row.original.serviceId}/detail`, target: '_blank', class: 'text-blue-500 hover:underline font-semibold text-sm break-all' }, row.original.account ?? '-'),
            h('span', { class: 'text-xs text-gray-500 dark:text-gray-400' }, [row.original.customerId, row.original.customerName].filter(Boolean).join(' · '))
        ])
    },
    {
        id: 'detail',
        header: 'Keterangan',
        cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.detail)
    },
    {
        id: 'note',
        header: 'Alasan',
        cell: ({ row }) => h('div', { class: 'flex flex-col min-w-[200px] max-w-[360px]' }, [
            row.original.note
                ? h('span', { class: 'text-sm text-gray-700 dark:text-gray-200 whitespace-normal' }, row.original.note)
                : h('span', { class: 'text-xs text-gray-400 italic' }, 'Alasan belum dicatat'),
            row.original.by
                ? h('span', { class: 'text-[11px] text-gray-400 mt-0.5' }, [row.original.by, formatWhen(row.original.at)].filter(Boolean).join(' · '))
                : null
        ])
    }
]
</script>
