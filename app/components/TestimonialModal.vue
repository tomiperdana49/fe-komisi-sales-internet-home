<template>
    <UModal
        v-model:open="isOpen"
        :title="testimonial ? 'Ubah Testimoni' : 'Tambah Testimoni'"
        :description="employeeName ? `Testimoni pelanggan dari ${employeeName}.` : 'Testimoni pelanggan.'"
    >
        <template #body>
            <UForm :state="state" class="space-y-4">
                <UFormField label="ID Customer" name="customerId" required>
                    <UInput v-model="state.customerId" class="w-full" placeholder="Contoh: 0200634909" />
                </UFormField>
                <UFormField label="Nama Customer" name="customerName" required description="Terisi otomatis bila ID ada di transaksi periode ini.">
                    <UInput v-model="state.customerName" class="w-full" placeholder="Nama pelanggan" />
                </UFormField>
                <UFormField label="Tanggal Testimoni" name="testimonialDate" required>
                    <UInput v-model="state.testimonialDate" type="date" :max="today" class="w-full" />
                </UFormField>
                <UFormField label="Link Testimoni" name="link" required description="Link bukti testimoni, mis. Google Drive atau Google Maps review.">
                    <UInput v-model="state.link" type="url" class="w-full" placeholder="https://..." />
                </UFormField>
            </UForm>
        </template>

        <template #footer="{ close }">
            <div class="flex justify-end gap-3 w-full">
                <UButton type="button" color="neutral" variant="ghost" :disabled="saving" @click="close">Batal</UButton>
                <UButton type="button" color="primary" :loading="saving" @click="onSubmit">Simpan</UButton>
            </div>
        </template>
    </UModal>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue'
import { TestimonialService } from '~/services/testimonial-service'
import type { TestimonialItem } from '~/types/testimonial'

const props = defineProps<{
    employeeId: string
    employeeName?: string | null
    /** Customers already known for this Account Manager (ID → name), to fill the name in. */
    customers?: Map<string, string>
    /** The testimonial being corrected; none to add a new one. */
    testimonial?: TestimonialItem | null
}>()

const isOpen = defineModel<boolean>('open', { default: false })
const emit = defineEmits(['success'])

const testimonialService = new TestimonialService()
const toast = useToast()
const saving = ref(false)

const pad = (n: number) => String(n).padStart(2, '0')
const now = new Date()
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`

const state = reactive({ customerId: '', customerName: '', testimonialDate: today, link: '' })

watch(isOpen, (open) => {
    if (!open) return
    const t = props.testimonial
    Object.assign(state, t
        ? { customerId: t.customerId, customerName: t.customerName, testimonialDate: t.testimonialDate, link: t.link }
        : { customerId: '', customerName: '', testimonialDate: today, link: '' })
}, { immediate: true })

watch(() => state.customerId, (id) => {
    const name = props.customers?.get(id.trim())
    if (name && !state.customerName.trim()) state.customerName = name
})

async function onSubmit() {
    const missing = [
        [!state.customerId.trim(), 'ID Customer'],
        [!state.customerName.trim(), 'Nama Customer'],
        [!state.testimonialDate, 'Tanggal Testimoni'],
        [!/^https?:\/\/\S+$/i.test(state.link.trim()), 'Link Testimoni (diawali http:// atau https://)']
    ].filter(([bad]) => bad).map(([, label]) => label)
    if (missing.length) {
        toast.add({ title: 'Data belum lengkap', description: `Isi ${missing.join(', ')}.`, color: 'error' })
        return
    }

    saving.value = true
    try {
        const data = {
            customerId: state.customerId.trim(),
            customerName: state.customerName.trim(),
            testimonialDate: state.testimonialDate,
            link: state.link.trim()
        }
        const response = props.testimonial
            ? await testimonialService.update(props.employeeId, props.testimonial.id, data)
            : await testimonialService.create(props.employeeId, data)
        if (response && response.success) {
            toast.add({ title: 'Testimoni disimpan', description: `Testimoni ${data.customerName} berhasil ${props.testimonial ? 'diubah' : 'ditambahkan'}`, color: 'success' })
            emit('success')
            isOpen.value = false
        }
    } catch (error) {
        console.error('Failed to save testimonial:', error)
    } finally {
        saving.value = false
    }
}
</script>
