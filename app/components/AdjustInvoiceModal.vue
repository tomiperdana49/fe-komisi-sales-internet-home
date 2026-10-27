<template>
    <UModal
        v-model:open="isOpen"
        :title="`Adjust Invoice #${ai ?? ''}`"
        description="Correct this invoice's underlying data. Adjusted rows are protected from future re-crawls."
        :ui="{ content: 'max-w-2xl' }"
    >
        <template #body>
            <div class="space-y-5">
                <UAlert
                    color="warning"
                    variant="subtle"
                    icon="i-lucide-alert-triangle"
                    title="This changes real commission data"
                    description="Only the fields you touch are updated. AI Invoice, AI Receipt, and Period stay locked — they're the identity keys a re-crawl matches on."
                />

                <UForm :state="state" class="space-y-5">
                    <div>
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Customer</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <UFormField label="Customer ID" name="customerId">
                                <UInput v-model="state.customerId" class="w-full" />
                            </UFormField>
                            <UFormField label="Customer Name" name="customerName">
                                <UInput v-model="state.customerName" class="w-full" />
                            </UFormField>
                            <UFormField label="Company" name="customerCompany">
                                <UInput v-model="state.customerCompany" class="w-full" />
                            </UFormField>
                            <UFormField label="Service Account" name="customerServiceAccount">
                                <UInput v-model="state.customerServiceAccount" class="w-full" />
                            </UFormField>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Service</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <UFormField label="Service ID" name="serviceId">
                                <UInput v-model="state.serviceId" class="w-full" />
                            </UFormField>
                            <UFormField label="Service Name" name="serviceName">
                                <UInput v-model="state.serviceName" class="w-full" />
                            </UFormField>
                            <UFormField label="Category" name="category">
                                <UInput v-model="state.category" class="w-full" />
                            </UFormField>
                            <UFormField label="Type" name="type">
                                <USelect v-model="state.type" :items="typeOptions" class="w-full" />
                            </UFormField>
                            <UFormField label="Business Operation" name="businessOperation">
                                <USelect v-model="state.businessOperation" :items="businessOperationOptions" class="w-full" />
                            </UFormField>
                            <UFormField label="Vendor" name="vendor">
                                <UInput v-model="state.vendor" class="w-full" />
                            </UFormField>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attribution</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <UFormField label="Sales (Employee ID)" name="sales">
                                <UInput v-model="state.sales" class="w-full" />
                            </UFormField>
                            <UFormField label="Manager (Employee ID)" name="manager">
                                <UInput v-model="state.manager" class="w-full" />
                            </UFormField>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Financial & Timing</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <UFormField label="Subscription" name="subscription">
                                <UInput v-model.number="state.subscription" type="number" class="w-full" />
                            </UFormField>
                            <UFormField label="Line Rental" name="lineRental">
                                <UInput v-model.number="state.lineRental" type="number" class="w-full" />
                            </UFormField>
                            <UFormField label="Month" name="month">
                                <UInput v-model.number="state.month" type="number" min="1" class="w-full" />
                            </UFormField>
                            <UFormField label="Late Month" name="lateMonth">
                                <UInput v-model.number="state.lateMonth" type="number" min="0" class="w-full" />
                            </UFormField>
                            <UFormField label="Tgl. Transaksi Bayar" name="transactionDate" description="Ditampilkan sebagai Tgl. Bayar. Informasi saja, tidak mengubah komisi.">
                                <UInput v-model="state.transactionDate" type="date" class="w-full" />
                            </UFormField>
                            <UFormField label="Tgl. Input Bayar (Paid Date)" name="paidDate">
                                <UInput v-model="state.paidDate" type="date" class="w-full" />
                            </UFormField>
                            <UFormField label="Activation Date (Tgl. Aktif)" name="activationDate" description="Informasi saja, tidak mengubah komisi.">
                                <UInput v-model="state.activationDate" type="date" class="w-full" />
                            </UFormField>
                        </div>
                    </div>

                    <div>
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Referral</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <UFormField label="Referral Type" name="referralType">
                                <USelect v-model="state.referralType" :items="referralTypeOptions" class="w-full" />
                            </UFormField>
                            <UFormField label="Referral Fee" name="referralFee">
                                <UInput v-model.number="state.referralFee" type="number" class="w-full" />
                            </UFormField>
                            <UFormField label="Referral Name" name="referralName" class="col-span-2">
                                <UInput v-model="state.referralName" class="w-full" />
                            </UFormField>
                        </div>
                    </div>

                    <UFormField label="Note" name="note" required description="Why is this being corrected? Required for the audit log.">
                        <UTextarea v-model="state.note" class="w-full" :rows="2" placeholder="Reason for this adjustment..." />
                    </UFormField>

                    <div v-if="history.length > 0">
                        <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Adjustment History</h4>
                        <div class="space-y-2 max-h-40 overflow-y-auto">
                            <div v-for="entry in history" :key="entry.id" class="text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-800">
                                <div class="flex justify-between items-center mb-1">
                                    <span class="font-semibold text-gray-900 dark:text-white">{{ entry.employeeName ?? entry.employeeId }}</span>
                                    <span class="text-gray-400">{{ new Date(entry.createdAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) }}</span>
                                </div>
                                <p class="text-gray-500 dark:text-gray-400 italic mb-1">"{{ entry.note }}"</p>
                                <pre class="text-[10px] text-gray-400 whitespace-pre-wrap break-all">{{ JSON.stringify(entry.oldValue) }} → {{ JSON.stringify(entry.newValue) }}</pre>
                            </div>
                        </div>
                    </div>
                </UForm>
            </div>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-3 w-full">
                <UButton type="button" color="neutral" variant="ghost" :disabled="saving" @click="close">Cancel</UButton>
                <UButton type="button" color="primary" :loading="saving" @click="onSubmit">Save Adjustment</UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { SummaryService } from '~/services/summary-service'
import type { SnapshotAdjustmentItem, SnapshotDetailItem } from '~/types/summary'

const props = defineProps<{
    ai: number | null
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits(['success'])

const summaryService = new SummaryService()
const toast = useToast()
const saving = ref(false)
const loading = ref(false)
const history = ref<SnapshotAdjustmentItem[]>([])

const typeOptions = ['new', 'upgrade', 'prorate', 'recurring']
const referralTypeOptions = ['', 'OTC', 'Cashback', 'Monthly']
const businessOperationOptions = ['', 'Internal', 'Resell']

const emptyState = () => ({
    customerId: '',
    customerName: '',
    customerCompany: '',
    customerServiceAccount: '',
    serviceId: '',
    serviceName: '',
    category: '',
    type: '',
    businessOperation: '',
    vendor: '',
    sales: '',
    manager: '',
    subscription: 0,
    lineRental: 0,
    month: 1,
    lateMonth: 0,
    paidDate: '',
    transactionDate: '',
    activationDate: '',
    referralType: '',
    referralFee: 0,
    referralName: '',
    note: ''
})

const state = reactive(emptyState())

function fillFromDetail(detail: SnapshotDetailItem | null) {
    if (!detail) {
        Object.assign(state, emptyState())
        return
    }
    Object.assign(state, {
        customerId: detail.customerId ?? '',
        customerName: detail.customerName ?? '',
        customerCompany: detail.customerCompany ?? '',
        customerServiceAccount: detail.customerServiceAccount ?? '',
        serviceId: detail.serviceId ?? '',
        serviceName: detail.serviceName ?? '',
        category: detail.category ?? '',
        type: detail.type ?? '',
        businessOperation: detail.businessOperation ?? '',
        vendor: detail.vendor ?? '',
        sales: detail.sales ?? '',
        manager: detail.manager ?? '',
        subscription: Number(detail.subscription ?? 0),
        lineRental: Number(detail.lineRental ?? 0),
        month: Number(detail.month ?? 1),
        lateMonth: Number(detail.lateMonth ?? 0),
        paidDate: detail.paidDate ?? '',
        transactionDate: detail.transactionDate ?? '',
        activationDate: detail.activationDate ?? '',
        referralType: detail.referralType ?? '',
        referralFee: Number(detail.referralFee ?? 0),
        referralName: detail.referralName ?? '',
        note: ''
    })
}

async function loadHistory(ai: number) {
    const response = await summaryService.invoiceAdjustments(ai)
    history.value = response?.data ?? []
}

async function loadDetail(ai: number) {
    loading.value = true
    try {
        // The history is extra: if it fails to load, the form still fills from the detail.
        const [detailResult] = await Promise.allSettled([
            summaryService.invoiceDetail(ai),
            loadHistory(ai)
        ])
        fillFromDetail(detailResult.status === 'fulfilled' ? detailResult.value?.data ?? null : null)
    } finally {
        loading.value = false
    }
}

watch(
    () => [props.ai, isOpen.value] as const,
    ([ai, open]) => {
        if (open && ai) {
            loadDetail(ai)
        } else {
            fillFromDetail(null)
            history.value = []
        }
    },
    { immediate: true }
)

async function onSubmit() {
    if (!props.ai) return
    if (!state.note.trim()) {
        toast.add({ title: 'Note is required', description: 'Explain why this invoice is being adjusted.', color: 'error' })
        return
    }

    saving.value = true
    try {
        const response = await summaryService.adjustInvoice(props.ai, {
            customerId: state.customerId || undefined,
            customerName: state.customerName || null,
            customerCompany: state.customerCompany || null,
            customerServiceAccount: state.customerServiceAccount || null,
            serviceId: state.serviceId || null,
            serviceName: state.serviceName || null,
            category: state.category || null,
            type: state.type || null,
            businessOperation: state.businessOperation || null,
            vendor: state.vendor || null,
            sales: state.sales || null,
            manager: state.manager || null,
            subscription: state.subscription,
            lineRental: state.lineRental,
            month: state.month,
            lateMonth: state.lateMonth,
            paidDate: state.paidDate || null,
            transactionDate: state.transactionDate || null,
            activationDate: state.activationDate || null,
            referralType: state.referralType || null,
            referralFee: state.referralFee,
            referralName: state.referralName || null,
            note: state.note.trim()
        })

        if (response && response.success) {
            toast.add({ title: 'Adjusted', description: 'Invoice adjustment saved successfully', color: 'success' })
            emit('success')
            isOpen.value = false
        }
    } catch (error) {
        console.error('Failed to adjust invoice:', error)
    } finally {
        saving.value = false
    }
}
</script>
