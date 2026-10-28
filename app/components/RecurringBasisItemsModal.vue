<template>
    <UModal v-model:open="isOpen" :title="title" :description="description" :ui="{ content: 'sm:max-w-3xl' }">
        <template #body>
            <div class="overflow-x-auto">
                <table class="w-full text-sm">
                    <thead>
                        <tr class="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                            <th class="py-2 pr-3 font-medium">Pelanggan</th>
                            <th v-if="!personal" class="py-2 pr-3 font-medium">Sales</th>
                            <th class="py-2 pr-3 font-medium">Produk</th>
                            <th class="py-2 pr-3 font-medium">Tgl Bayar</th>
                            <th v-if="kind === 'late'" class="py-2 pr-3 font-medium text-center">Telat</th>
                            <th class="py-2 pr-3 font-medium text-right">Subscription</th>
                            <th class="py-2 font-medium text-right">{{ kind === 'late' ? 'Potongan' : 'Tidak Dihitung' }}</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in items" :key="item.aiInvoice" class="border-b border-gray-100 dark:border-gray-800">
                            <td class="py-2 pr-3">
                                <div class="font-medium text-gray-900 dark:text-white">{{ item.customerName ?? '-' }}</div>
                                <div class="text-xs text-gray-500">{{ item.customerId }}</div>
                            </td>
                            <td v-if="!personal" class="py-2 pr-3 text-gray-700 dark:text-gray-300">{{ item.salesName ?? '-' }}</td>
                            <td class="py-2 pr-3 text-gray-700 dark:text-gray-300">{{ item.serviceId ?? '-' }}</td>
                            <td class="py-2 pr-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">{{ (item.transactionDate ?? item.paidDate) ? formatDate(item.transactionDate ?? item.paidDate!) : '-' }}</td>
                            <td v-if="kind === 'late'" class="py-2 pr-3 text-center text-red-500 dark:text-red-400 font-medium">{{ item.lateMonth }} bln</td>
                            <td class="py-2 pr-3 text-right tabular-nums">{{ formatCurrency(item.subscription) }}</td>
                            <td class="py-2 text-right tabular-nums">
                                <div class="font-semibold">{{ formatCurrency(item.amount) }}</div>
                                <div v-if="kind === 'late' && item.percentage !== undefined" class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {{ item.percentage }}% × {{ formatCurrency(item.basis ?? item.subscription) }}
                                </div>
                            </td>
                        </tr>
                    </tbody>
                    <tfoot>
                        <tr>
                            <td :colspan="(kind === 'late' ? 6 : 5) - (personal ? 1 : 0)" class="pt-3 pr-3 font-bold text-gray-900 dark:text-white">Total</td>
                            <td class="pt-3 text-right tabular-nums font-bold text-gray-900 dark:text-white">{{ formatCurrency(total) }}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ManagerRecurringBasisItem } from '~/types/manager'

const props = defineProps<{
    kind: 'renewal' | 'late' | 'cpe'
    items: ManagerRecurringBasisItem[]
    /** One Account Manager's own invoices (AM dashboard): no Sales column, AM wording. */
    personal?: boolean
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const { formatCurrency, formatDate } = useFormat()

const title = computed(() => props.kind === 'late' ? 'Potongan Telat Bayar' : props.kind === 'cpe' ? 'CPE Rental' : 'Kenaikan Harga Perpanjangan')
const description = computed(() => props.kind === 'late' && props.personal
    ? 'Invoice recurring yang dibayar lewat jatuh tempo. Mulai Oktober 2026: Potongan = persentase telat × Subscription (referral tidak mengurangi dasar potongan; referral dipotong terpisah di Biaya Referral). Potongan hilang bila invoice di-approve admin di Summary > Invoice.'
    : props.kind === 'late'
    ? 'Invoice recurring tim yang dibayar lewat jatuh tempo. Potongannya sama dengan potongan komisi AM; hilang bila invoice di-approve admin di Summary > Invoice.'
    : props.kind === 'cpe'
    ? 'Recurring CPE Rental tim. Mulai Oktober 2026 tetap dihitung untuk AM, tapi tidak ikut dasar Overriding Recurring SM.'
    : 'Kenaikan harga saat perpanjangan kontrak (label Perpanjangan). Dihitung sebagai recurring untuk AM, tapi tidak ikut dasar Overriding Recurring manager.')
const total = computed(() => props.items.reduce((sum, item) => sum + item.amount, 0))
</script>
