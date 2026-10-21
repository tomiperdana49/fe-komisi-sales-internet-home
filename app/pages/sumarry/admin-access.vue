<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                    <div>
                        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Akses Admin</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            Siapa yang bisa membuka halaman Summary. <strong>Super Admin</strong> melihat semua branch dan bisa melakukan semua perubahan;
                            <strong>Admin</strong> hanya melihat, di semua branch atau satu branch saja. Perubahan berlaku saat orang tersebut membuka halaman berikutnya.
                        </p>
                    </div>
                    <UButton icon="i-lucide-user-plus" class="shrink-0" @click="openModal(null)">Tambah Akses</UButton>
                </div>

                <SummaryStats :stats="stats" />

                <UCard>
                    <template #header>
                        <UInput v-model="search" icon="i-lucide-search" placeholder="Cari nama atau ID karyawan..." class="w-full sm:w-72" />
                    </template>
                    <UTable sticky :columns="columns" :data="filteredItems" empty="Belum ada akses admin." class="flex-1 max-h-[800px]" />
                </UCard>
            </div>
        </UContainer>

        <AdminAccessModal v-model:open="isModalOpen" :entry="editing" :branches="branches" @success="fetchData" />

        <ConfirmModal
            v-model:open="isDeleteModalOpen"
            title="Hapus akses admin?"
            :description="deleting ? `${deleting.name ?? deleting.employeeId} tidak bisa membuka halaman Summary lagi. Data karyawan dan komisinya tetap ada.` : ''"
            confirm-label="Ya, hapus"
            cancel-label="Batal"
            :on-confirm="confirmDelete"
        />
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import { AdminAccessService } from '~/services/admin-access-service'
import type { AdminAccessItem } from '~/types/admin-access'
import type { TableColumn } from '@nuxt/ui'

definePageMeta({
    headerProps: { toolbar: true }
})

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')

const { setLoading } = useLoading()
const toast = useToast()
const service = new AdminAccessService()
const { state: authState } = useAuth()
const { formatDate } = useFormat()

// The toolbar's period picker has no effect here; it's kept so the toolbar looks the same on every admin page.
const { year, month: selectedMonth } = useSelectedPeriod()

const items = ref<AdminAccessItem[]>([])
const branches = ref<string[]>([])
const search = ref('')

const branchLabel = (branch: string) => branch.replace(/^PT\.\s*Media Antar Nusa\s*-\s*/i, '').trim() || branch
const isSelf = (row: AdminAccessItem) => row.employeeId === authState.user?.employee_id

const filteredItems = computed(() => {
    const q = search.value.trim().toLowerCase()
    if (!q) return items.value
    return items.value.filter(r => (r.name ?? '').toLowerCase().includes(q) || r.employeeId.includes(q))
})

const stats = computed(() => [
    { label: 'Super Admin', value: items.value.filter(r => r.role === 'super_admin').length, class: 'text-primary-600 dark:text-primary-400' },
    { label: 'Admin — semua branch', value: items.value.filter(r => r.role === 'admin' && !r.branch).length },
    { label: 'Admin — satu branch', value: items.value.filter(r => r.role === 'admin' && r.branch).length }
])

const isModalOpen = ref(false)
const editing = ref<AdminAccessItem | null>(null)
const openModal = (row: AdminAccessItem | null) => {
    editing.value = row
    isModalOpen.value = true
}

const isDeleteModalOpen = ref(false)
const deleting = ref<AdminAccessItem | null>(null)
const askDelete = (row: AdminAccessItem) => {
    deleting.value = row
    isDeleteModalOpen.value = true
}
const confirmDelete = async () => {
    if (deleting.value) {
        try {
            const response = await service.remove(deleting.value.id)
            if (response?.success) {
                toast.add({ title: 'Akses dihapus', description: `${deleting.value.name ?? deleting.value.employeeId} tidak lagi punya akses admin`, color: 'success' })
                await fetchData()
            }
        } catch (error) {
            console.error('Failed to delete admin access:', error)
        }
    }
    isDeleteModalOpen.value = false
}

const columns: TableColumn<AdminAccessItem>[] = [
    {
        accessorKey: 'name',
        header: 'Karyawan',
        cell: ({ row }) => h('div', { class: 'flex items-center gap-3' }, [
            h(UAvatar, { src: row.original.photoProfile ?? undefined, alt: row.original.name ?? undefined, size: 'sm' }),
            h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'font-semibold text-gray-900 dark:text-white' }, [
                    row.original.name ?? '(tidak ada di data karyawan)',
                    isSelf(row.original) ? h('span', { class: 'ml-1 text-xs font-normal text-gray-400' }, '(Anda)') : null
                ]),
                h('span', { class: 'text-xs text-gray-500' }, [row.original.employeeId, row.original.jobPosition, row.original.employeeBranch && branchLabel(row.original.employeeBranch)].filter(Boolean).join(' · '))
            ])
        ])
    },
    {
        accessorKey: 'role',
        header: 'Role',
        cell: ({ row }) => row.original.role === 'super_admin'
            ? h(UBadge, { color: 'primary', variant: 'subtle' }, () => 'Super Admin')
            : h(UBadge, { color: 'neutral', variant: 'subtle' }, () => 'Admin')
    },
    {
        accessorKey: 'branch',
        header: 'Cakupan',
        cell: ({ row }) => h('span', { class: 'text-sm' },
            row.original.role === 'super_admin' || !row.original.branch ? 'Semua branch' : branchLabel(row.original.branch))
    },
    {
        accessorKey: 'note',
        header: 'Catatan',
        cell: ({ row }) => h('span', { class: 'text-xs text-gray-600 dark:text-gray-300' }, row.original.note ?? '-')
    },
    {
        id: 'changedBy',
        header: 'Diatur Oleh',
        cell: ({ row }) => {
            const r = row.original
            const by = r.updatedBy ? (r.updatedByName ?? r.updatedBy) : (r.createdByName ?? r.createdBy)
            const at = r.updatedAt ?? r.createdAt
            return h('div', { class: 'flex flex-col text-xs' }, [
                h('span', { class: 'font-medium' }, by),
                at ? h('span', { class: 'text-gray-400' }, formatDate(at)) : null
            ])
        }
    },
    {
        id: 'actions',
        header: () => h('div', { class: 'text-right' }, 'Aksi'),
        cell: ({ row }) => h('div', { class: 'flex justify-end gap-2' }, isSelf(row.original)
            // Nobody can change or remove their own access (so a Super Admin can't lock themselves out).
            ? [h('span', { class: 'text-xs text-gray-400' }, 'Akses Anda')]
            : [
                h(UButton, { size: 'xs', color: 'neutral', variant: 'outline', icon: 'i-lucide-pencil', onClick: () => openModal(row.original) }, () => 'Ubah'),
                h(UButton, { size: 'xs', color: 'error', variant: 'ghost', icon: 'i-lucide-trash-2', 'aria-label': 'Hapus akses', onClick: () => askDelete(row.original) })
            ])
    }
]

const fetchData = async () => {
    setLoading(true)
    try {
        const response = await service.list()
        items.value = response?.data?.items ?? []
        branches.value = response?.data?.branches ?? []
    } finally {
        setLoading(false)
    }
}

onMounted(() => {
    fetchData()
})
</script>
