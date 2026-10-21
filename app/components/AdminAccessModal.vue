<template>
    <UModal
        v-model:open="isOpen"
        :title="entry ? `Ubah Akses — ${entry.name ?? entry.employeeId}` : 'Tambah Akses Admin'"
        description="Super Admin bisa melihat semua branch dan melakukan semua perubahan. Admin hanya bisa melihat, di semua branch atau satu branch saja."
    >
        <template #body>
            <UForm :state="state" class="space-y-4">
                <UFormField v-if="!entry" label="Karyawan" name="employee" required description="Cari nama, employee ID, atau email di Nusawork.">
                    <UInput v-model="search" icon="i-lucide-search" class="w-full" placeholder="Minimal 2 huruf..." :loading="searching" />
                    <div v-if="selected" class="mt-2 flex items-center gap-3 rounded-md border border-primary-300 dark:border-primary-700 p-2">
                        <UAvatar :src="selected.photoProfile" :alt="selected.name" size="sm" />
                        <div class="min-w-0 flex-1">
                            <p class="text-sm font-medium truncate">{{ selected.name }}</p>
                            <p class="text-xs text-gray-500 truncate">{{ selected.employeeId }} · {{ selected.jobPosition }} · {{ branchLabel(selected.branch) }}</p>
                        </div>
                        <UButton icon="i-lucide-x" color="neutral" variant="ghost" size="xs" aria-label="Ganti karyawan" @click="selected = null" />
                    </div>
                    <ul v-else-if="candidates.length" class="mt-2 max-h-56 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 rounded-md border border-gray-200 dark:border-gray-800">
                        <li v-for="c in candidates" :key="c.employeeId">
                            <button
                                type="button"
                                class="w-full flex items-center gap-3 p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 disabled:opacity-50 disabled:cursor-not-allowed"
                                :disabled="c.hasAccess"
                                @click="selected = c"
                            >
                                <UAvatar :src="c.photoProfile" :alt="c.name" size="sm" />
                                <div class="min-w-0 flex-1">
                                    <p class="text-sm font-medium truncate">{{ c.name }}</p>
                                    <p class="text-xs text-gray-500 truncate">{{ c.employeeId }} · {{ c.jobPosition }} · {{ branchLabel(c.branch) }}</p>
                                </div>
                                <UBadge v-if="c.hasAccess" color="neutral" variant="subtle" size="sm">Sudah punya akses</UBadge>
                            </button>
                        </li>
                    </ul>
                    <p v-else-if="search.trim().length >= 2 && !searching" class="mt-2 text-xs text-gray-500">Tidak ada karyawan yang cocok.</p>
                </UFormField>

                <UFormField label="Role" name="role" required>
                    <URadioGroup v-model="state.role" :items="roleItems" />
                </UFormField>

                <UFormField v-if="state.role === 'admin'" label="Cakupan Branch" name="branch" description="Data yang bisa dilihat Admin ini.">
                    <USelectMenu v-model="state.branch" :items="branchItems" value-key="value" :search-input="false" class="w-full" />
                </UFormField>

                <UFormField label="Catatan" name="note" description="Opsional, mis. alasan akses diberikan.">
                    <UTextarea v-model="state.note" class="w-full" :rows="2" />
                </UFormField>
            </UForm>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-3 w-full">
                <UButton type="button" color="neutral" variant="ghost" :disabled="saving" @click="close">Batal</UButton>
                <UButton type="button" color="primary" :loading="saving" :disabled="!entry && !selected" @click="onSubmit">Simpan</UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { AdminAccessService } from '~/services/admin-access-service'
import type { AdminAccessItem, AdminCandidate, AdminRole } from '~/types/admin-access'

const props = defineProps<{
    /** The entry being edited; null to add someone. */
    entry: AdminAccessItem | null
    branches: string[]
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits(['success'])

const service = new AdminAccessService()
const toast = useToast()
const saving = ref(false)

const ALL = '__all__'
const branchLabel = (branch: string) => branch.replace(/^PT\.\s*Media Antar Nusa\s*-\s*/i, '').trim() || branch
const roleItems = [
    { label: 'Super Admin — semua branch, bisa melakukan semua perubahan', value: 'super_admin' },
    { label: 'Admin — hanya melihat', value: 'admin' }
]
const branchItems = computed(() => [
    { label: 'Semua branch', value: ALL },
    ...props.branches.map(b => ({ label: branchLabel(b), value: b }))
])

const state = reactive({ role: 'admin' as AdminRole, branch: ALL, note: '' })

const search = ref('')
const searching = ref(false)
const candidates = ref<AdminCandidate[]>([])
const selected = ref<AdminCandidate | null>(null)

watch(isOpen, (open) => {
    if (!open) return
    state.role = props.entry?.role ?? 'admin'
    state.branch = props.entry?.branch ?? ALL
    state.note = props.entry?.note ?? ''
    search.value = ''
    candidates.value = []
    selected.value = null
}, { immediate: true })

// Debounced: the directory is searched on the server as the name is typed.
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(search, (q) => {
    clearTimeout(searchTimer)
    selected.value = null
    if (q.trim().length < 2) {
        candidates.value = []
        return
    }
    searchTimer = setTimeout(async () => {
        searching.value = true
        try {
            candidates.value = (await service.candidates(q.trim())).data
        } finally {
            searching.value = false
        }
    }, 300)
})

async function onSubmit() {
    const input = {
        role: state.role,
        branch: state.role === 'admin' && state.branch !== ALL ? state.branch : null,
        note: state.note.trim() || null
    }
    saving.value = true
    try {
        const response = props.entry
            ? await service.update(props.entry.id, input)
            : await service.create(selected.value!.employeeId, input)
        if (response?.success) {
            const name = props.entry?.name ?? selected.value?.name
            toast.add({ title: 'Akses disimpan', description: `${name} sekarang ${input.role === 'super_admin' ? 'Super Admin' : 'Admin'}`, color: 'success' })
            emit('success')
            isOpen.value = false
        }
    } catch (error) {
        console.error('Failed to save admin access:', error)
    } finally {
        saving.value = false
    }
}
</script>
