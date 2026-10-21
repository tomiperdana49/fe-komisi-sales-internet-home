<template>
    <UHeader
        :toggle="false"
        :ui="{
        right: 'justify-end-safe overflow-x-auto py-2'
        }"
    >
        <template #left>
        <NuxtLink to="/">
            <img class="h-10" src="/logo.png" alt="Logo" />
        </NuxtLink>
        </template>

        <template #right>
        <div
            role="group"
            class="flex items-center gap-1"
        >
            <UButton
                :icon="isCapturing ? 'i-lucide-loader-2' : 'i-lucide-message-square-warning'"
                size="sm"
                color="neutral"
                variant="ghost"
                :loading="isCapturing"
                :disabled="isCapturing"
                @click="triggerFeedback()"
            />

            <UTooltip :text="amountsHidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'">
                <UButton
                    :icon="amountsHidden ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    :aria-label="amountsHidden ? 'Tampilkan nominal' : 'Sembunyikan nominal'"
                    :aria-pressed="amountsHidden"
                    @click="toggleAmounts()"
                />
            </UTooltip>

            <UTooltip text="List Feedback">
                <UButton
                    icon="i-lucide-list-checks"
                    size="sm"
                    color="neutral"
                    variant="ghost"
                    to="https://docs.google.com/spreadsheets/d/1jbOM0sOHAauo2xdEQvieHPZJlCum9Vn-16F2bYFv-rw/edit?gid=0#gid=0"
                    target="_blank"
                />
            </UTooltip>

            <NotificationsSlideover />

            <UColorModeButton size="sm" />
            <ClientOnly>
                <UDropdownMenu
                    :items="items"
                    size="sm"
                    :content="{
                    align: 'start',
                    side: 'bottom',
                    sideOffset: 8
                    }"
                    :ui="{
                    content: 'w-48'
                    }"
                >
                    <UUser
                        size="sm"
                        :name="authState.user?.name"
                        :description="authState.user?.employee_id"
                        class="pl-2"
                        :avatar="{
                            src: authState.user?.photo_profile,
                        }"
                        :ui="{
                            name: 'hidden sm:block',
                            description: 'hidden sm:block'
                        }"
                    />
                </UDropdownMenu>
            </ClientOnly>
        </div>
        </template>
    </UHeader>

    <FeedbackModal v-model:open="isOpen" />

    <UDashboardToolbar 
        v-show="toolbar"
        class="mx-auto px-4 sm:px-6 lg:px-8 max-w-full px-4 sm:px-6 lg:px-25"
        :class="{ 'hidden': !toolbar }"
    >
        <template #left>
        <div id="toolbar-left" />
        <slot name="toolbar-left" />
        </template>
        <template #right>
        <div id="toolbar-right" />
        <slot name="toolbar-right" />
        </template>
    </UDashboardToolbar>
</template>

<script setup lang="ts">
    import type { DropdownMenuItem } from '@nuxt/ui'
    import { useFeedback } from '~/composables/useFeedback'
    import { useHideAmounts } from '~/composables/useHideAmounts'

    const { state: authState, service: authService } = useAuth()
    const toast = useToast()

    const { triggerFeedback, isCapturing, isOpen } = useFeedback()
    const { hidden: amountsHidden, toggle: toggleAmounts } = useHideAmounts()

    const handleLogout = async () => {
        await authService.logout()
        toast.add({ title: 'Logged out successfully' })
        navigateTo('/sign-in')
    }

    const items = computed<DropdownMenuItem[]>(() => [
        ...(authState.user?.is_admin ? [{
        label: 'Summary Dashboard',
        icon: 'i-lucide-bar-chart-4',
        onSelect: () => navigateTo('/sumarry/sales')
        }] : []),
        // The ACL behind the Summary pages; Super Admin only.
        ...(authState.user?.is_super_admin ? [{
        label: 'Akses Admin',
        icon: 'i-lucide-shield-check',
        onSelect: () => navigateTo('/sumarry/admin-access')
        }] : []),
        {
        label: 'Sign Out',
        icon: 'i-lucide-log-out',
        onSelect: handleLogout
        },
    ])

    const toolbar = defineModel<boolean>('toolbar', {
        type: Boolean,
        default: false
    })
</script>