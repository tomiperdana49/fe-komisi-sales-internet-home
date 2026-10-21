<template>
    <UContainer>
        <HeroBackground />
        <div class="space-y-8 py-8">
        <UPageHeader
            :title="`Hello, ${authState.user?.name ?? ''} 👋`"            
            :description="`${greeting}, Have a nice day 😃`"
        >
        </UPageHeader>
        </div>

        <div class="py-2">
        <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="space-y-1">
                <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
                    My Team
                </h2>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    Team member list
                </p>
            </div>
            <div class="w-full lg:w-auto flex flex-col sm:flex-row gap-2">
                <USelectMenu v-model="branchFilter" :items="branchItems" value-key="value" :search-input="false" icon="i-lucide-building-2" class="w-full sm:w-48" />
                <UTabs v-model="roleFilter" :items="roleTabs" :content="false" size="sm" class="w-full sm:w-auto" />
                <UInput v-model="searchQuery" icon="i-lucide-search" size="md" variant="outline" class="w-full sm:w-64" placeholder="Search..." />
            </div>
        </div>
        </div>

        <div class="py-2">
        <p v-if="filteredEmployeeCards.length === 0 && employeeCard.length > 0" class="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Tidak ada anggota tim yang cocok dengan filter ini.
        </p>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UPageCard
                v-for="card in filteredEmployeeCards"
                :key="card.employeeId"
                :to="card.to"
            >
                <template #body>
                    <UUser
                        :avatar="{ src: card.photoProfile, alt: card.name }"
                        class="w-full"
                        :ui="{ avatar: 'h-14 w-14' }"
                    >
                        <div class="min-w-0">
                        <TextTooltip :text="card.name" hover-only>
                            <h1 class="text-md font-medium text-gray-900 dark:text-white truncate">
                                {{ card.name }}
                            </h1>
                        </TextTooltip>

                        <TextTooltip :text="`${card.employeeId} - ${card.organizationName}`" hover-only>
                            <p class="text-xs text-gray-500 dark:text-gray-400 truncate mb-1">
                                {{ card.employeeId }} - {{ card.organizationName }}
                            </p>
                        </TextTooltip>

                        <TextTooltip :text="card.position" hover-only>
                            <p class="text-sm text-gray-600 dark:text-gray-300 truncate">
                                {{ card.position }}
                            </p>
                        </TextTooltip>
                        </div>
                    </UUser>
                    </template>

            </UPageCard>
        </div>
        </div>

    </UContainer>
</template>

<script setup lang="ts">
const { setLoading } = useLoading()
import { EmployeeService } from '~/services/employee-service';

const { state: authState } = useAuth()
const employeeCard = ref<{ employeeId: string; name: string; photoProfile: string; position: string; organizationName: string; jobLevel: string; branch: string; to: string }[]>([])
const searchQuery = ref('')

type RoleFilter = 'all' | 'sm' | 'am' | 'sdr'
// Remembered for the session so coming back from someone's dashboard keeps the choice.
const chosenRole = useState<RoleFilter | null>('home-role-filter', () => null)
// Until the user picks one: admins start on Sales Managers (if any), everyone else sees their whole team.
const roleFilter = computed<RoleFilter>({
    get: () => chosenRole.value
        ?? (authState.user?.is_admin && cardsInBranch.value.some(c => roleOf(c) === 'sm') ? 'sm' : 'all'),
    set: (value) => { chosenRole.value = value }
})
// Same split as the card links (useDashboardRoute): manager dashboards are SM, sales dashboards are AM or SDR.
const roleOf = (card: { to: string; position: string }): RoleFilter | null =>
    card.to.endsWith('/manager') ? 'sm' : card.to.endsWith('/sales') ? (card.position === 'Sales Development Representative' ? 'sdr' : 'am') : null
const roleTabs = computed(() => [
    { label: `Semua (${cardsInBranch.value.length})`, value: 'all' },
    { label: `Sales Manager (${cardsInBranch.value.filter(c => roleOf(c) === 'sm').length})`, value: 'sm' },
    { label: `Account Manager (${cardsInBranch.value.filter(c => roleOf(c) === 'am').length})`, value: 'am' },
    // Only shown when the team has SDRs, so other teams' filter stays as it was.
    ...(cardsInBranch.value.some(c => roleOf(c) === 'sdr')
        ? [{ label: `SDR (${cardsInBranch.value.filter(c => roleOf(c) === 'sdr').length})`, value: 'sdr' }]
        : [])
])
const { getRoute } = useDashboardRoute()

// Branch names arrive as "PT. Media Antar Nusa - Medan"; the city alone is enough in the filter.
const branchLabel = (branch: string) => branch.replace(/^PT\.\s*Media Antar Nusa\s*-\s*/i, '').trim() || branch
const branches = computed(() => [...new Set(employeeCard.value.map(c => c.branch).filter(Boolean))].sort())
const chosenBranch = useState<string | null>('home-branch-filter', () => null)
// Until the user picks one: their own branch, or every branch when nobody on the team shares it.
const branchFilter = computed<string>({
    get: () => chosenBranch.value
        ?? (branches.value.includes(authState.user?.branch ?? '') ? authState.user!.branch : 'all'),
    set: (value) => { chosenBranch.value = value }
})
const cardsInBranch = computed(() => branchFilter.value === 'all'
    ? employeeCard.value
    : employeeCard.value.filter(c => c.branch === branchFilter.value))
const branchItems = computed(() => [
    { label: 'Semua Branch', value: 'all' },
    ...branches.value.map(b => ({ label: branchLabel(b), value: b }))
])

const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good Morning'
    if (hour < 18) return 'Good Afternoon'
    return 'Good Evening'
})

const filteredEmployeeCards = computed(() => {
    const byRole = roleFilter.value === 'all'
        ? cardsInBranch.value
        : cardsInBranch.value.filter(card => roleOf(card) === roleFilter.value)
    if (!searchQuery.value) {
        return byRole
    }
    const query = searchQuery.value.toLowerCase()
    return byRole.filter(card => {
        return card.name.toLowerCase().includes(query) ||
               card.employeeId.toLowerCase().includes(query) ||
               card.position.toLowerCase().includes(query) ||
               card.organizationName.toLowerCase().includes(query) ||
               card.branch.toLowerCase().includes(query)
    })
})

const fetchEmployeeCard = async () => {
    if (!authState.user?.employee_id) return
    try {
        const employeeService = new EmployeeService()
        const data = await employeeService.getEmployeeHierarchy(authState.user?.employee_id)
        employeeCard.value = data.data.map((item) => {
            return {
                photoProfile: item.photo_profile,
                name: item.name,
                employeeId: item.employee_id,
                position: item.job_position,
                // Nusawork names SDR teams "Sales Development Representative (SDR) <city>"; the acronym only lengthens the card.
                organizationName: item.organization_name.replace(/\s*\(SDR\)/, ''),
                jobLevel: item.job_level,
                branch: item.branch ?? '',
                to: getRoute(item),
            }
        })
    } finally {
        // setLoading managed by caller
    }
}

const initData = async () => {
    setLoading(true)
    try {
        await fetchEmployeeCard()
    } finally {
        setLoading(false)
    }
}

watch(() => authState.user, (user) => {
    if (user?.employee_id) {
        initData()
    }
}, { immediate: true })

onMounted(() => {
    if (authState.user?.employee_id) {
        initData()
    }
})

</script>
