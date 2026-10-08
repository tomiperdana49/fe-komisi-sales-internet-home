<template>
    <USlideover title="Approval" description="List of commission changes requiring approval"
        :ui="{
            overlay: 'bg-white/45 dark:bg-black/45 backdrop-blur-xs'
        }"
    >
        <div class="relative inline-flex">
            <UButton icon="i-lucide-bell" size="sm" color="neutral" variant="ghost" @click="fetchAdjustments" />
            <span v-if="approvalItems.length" class="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-gray-900 bg-green-500 transform translate-x-1/4 -translate-y-1/4" />
        </div>

        <template #body>
            <div v-if="loading" class="p-4 flex justify-center">
                 <UIcon name="i-lucide-loader-2" class="animate-spin w-6 h-6 text-gray-500" />
            </div>
            <div v-else-if="approvalItems.length === 0" class="p-8 flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
                 <UIcon name="i-lucide-check-circle" class="w-12 h-12 text-gray-300 dark:text-gray-700" />
                 <div>
                    <p class="font-medium text-gray-900 dark:text-white">All caught up!</p>
                    <p class="text-sm">No pending approvals available</p>
                 </div>
            </div>
            <div v-else class="space-y-3 p-1">
                <UCard 
                    v-for="(item, idx) in approvalItems" 
                    :key="item.id || idx"
                    :ui="{ 
                        body: 'p-3! sm:p-3!', 
                        header: 'p-3! sm:p-3!', 
                        footer: 'p-2! sm:p-2!' 
                    }"
                >
                    <template #header>
                        <div 
                            class="w-full flex items-center justify-between gap-2 cursor-pointer select-none"
                            @click="toggle(idx)"
                        >
                            <div class="flex justify-between items-center gap-2 overflow-hidden">
                                <UUser
                                    :name="item.requestName"
                                    :description="item.employeeId"
                                    :avatar="{
                                        src: item.requestPhotoProfile,
                                        icon: 'i-lucide-user'
                                    }"
                                />
                                <UBadge :label="item.action" variant="subtle" :color="item.action === 'delete' ? 'error' : 'primary'" />
                            </div>
                            <UIcon 
                                name="i-lucide-chevron-down" 
                                class="w-5 h-5 text-gray-500 transition-transform duration-200 flex-shrink-0"
                                :class="[expandedIndex === idx ? 'rotate-180' : '']"
                            />
                        </div>
                    </template>

                    <div class="space-y-2">
                        <div class="text-xs space-y-1.5 p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md border border-gray-100 dark:border-gray-800">
                             <div class="flex items-center justify-between">
                                <a :href="`/sales/${item.invoiceNumber}`" class="text-blue-500 hover:underline">#{{ item.invoiceNumber }}</a>
                                <span class="text-[10px] text-gray-500 bg-white dark:bg-gray-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                                    {{ item.serviceName }}
                                </span>
                            </div>
                            <div>
                                <TextTooltip :text="item.companyName">
                                    <p class="font-medium text-gray-700 dark:text-gray-200 line-clamp-1">{{ item.companyName }}</p>
                                </TextTooltip>
                                <p class="text-[10px] text-gray-500">{{ item.customerId }} • {{ item.serviceGroupId }}</p>
                            </div>
                        </div>

                        <UAlert
                            variant="soft"
                            color="neutral"
                            size="xs"
                            :description="item.note || 'No description'"
                        />

                        <div v-if="expandedIndex === idx" class="overflow-hidden rounded border border-gray-200 dark:border-gray-800">
                            <table class="w-full text-[10px] border-collapse">
                                <thead>
                                    <tr class="bg-gray-50 dark:bg-gray-900">
                                        <th class="px-2 py-1 text-left font-medium text-gray-500 dark:text-gray-400">
                                            Field
                                        </th>
                                        <th class="px-2 py-1 text-left font-medium text-red-600 dark:text-red-400">
                                            Old Value
                                        </th>
                                        <th class="px-2 py-1 text-left font-medium text-green-600 dark:text-green-400">
                                            New Value
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr 
                                        v-for="(value, key) in (item.newValue || item.oldValue || {})" 
                                        :key="key"
                                        class="border-t border-gray-200 dark:border-gray-800"
                                    >
                                        <td class="px-2 py-1 text-gray-500 dark:text-gray-400">
                                            {{ formatKey(String(key)) }}
                                        </td>
                                        <td class="px-2 py-1 font-medium text-gray-900 dark:text-white">
                                            {{ item.oldValue?.[key] ?? '-' }}
                                        </td>
                                        <td class="px-2 py-1 font-medium text-gray-900 dark:text-white">
                                            {{ item.newValue?.[key] ?? '-' }}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <template v-if="expandedIndex === idx" #footer>
                        <div class="flex gap-2">
                            <UButton 
                                color="error" 
                                variant="soft" 
                                block 
                                label="Decline" 
                                class="flex-1"

                                @click="onDecline(item.id)"
                            />
                            <UButton 
                                color="success" 
                                variant="solid" 
                                block 
                                label="Accept" 
                                class="flex-1"

                                @click="onAccept(item.id)"
                            />
                        </div>
                    </template>
                </UCard>
            </div>
        </template>
    </USlideover>
    <ConfirmModal 
        v-model:open="isConfirmModalOpen"
        :title="confirmTitle"
        :description="confirmDescription"
        :on-confirm="handleConfirm"
        :confirm-label="pendingActionType === 'decline' ? 'Decline' : 'Confirm'"
    />
</template>

<script setup lang="ts">
import { AdjustmentService } from '~/services/adjustment-service'
import type { AdjustmentData } from '~/types/adjustment'

const adjustmentService = new AdjustmentService()
const approvalItems = ref<AdjustmentData[]>([])
const loading = ref(false)
const expandedIndex = ref<number | null>(null)

const isConfirmModalOpen = ref(false)
const confirmTitle = ref('')
const confirmDescription = ref('')
const pendingActionId = ref<number | null>(null)
const pendingActionType = ref<'accept' | 'decline' | null>(null)

const toggle = (index: number) => {
    expandedIndex.value = expandedIndex.value === index ? null : index
}

const fetchAdjustments = async () => {
    loading.value = true
    const res = await adjustmentService.getAdjustment()
    if (res.success) {
        approvalItems.value = res.data
    }
    loading.value = false
}

const onAccept = (id: number) => {
    pendingActionId.value = id
    pendingActionType.value = 'accept'
    confirmTitle.value = 'Approve Request'
    confirmDescription.value = 'Are you sure you want to approve this request?'
    isConfirmModalOpen.value = true
}

const onDecline = (id: number) => {
    pendingActionId.value = id
    pendingActionType.value = 'decline'
    confirmTitle.value = 'Decline Request'
    confirmDescription.value = 'Are you sure you want to decline this request?'
    isConfirmModalOpen.value = true
}

const handleConfirm = async () => {
    if (!pendingActionId.value || !pendingActionType.value) return

    if (pendingActionType.value === 'accept') {
        await adjustmentService.adjustmentAccept(pendingActionId.value)
    } else {
        await adjustmentService.adjustmentDecline(pendingActionId.value)
    }
    await fetchAdjustments()
    
    isConfirmModalOpen.value = false
    pendingActionId.value = null
    pendingActionType.value = null
}

function formatKey(key: string) {
    const result = key.replace(/([A-Z])/g, " $1");
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
}

// Adjustment feature isn't built on the v2 backend yet, so this only
// fetches when the user opens the slideover (via the bell click handler)
// instead of erroring on every page load.
</script>