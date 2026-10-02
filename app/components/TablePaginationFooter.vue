<template>
    <div class="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 px-4">
        <p class="text-sm text-gray-500 dark:text-gray-400">
            Menampilkan
            <span class="font-medium text-gray-700 dark:text-gray-200">{{ from }}–{{ to }}</span>
            dari
            <span class="font-medium text-gray-700 dark:text-gray-200">{{ total }}</span>
            baris
        </p>
        <UPagination
            :page="pageIndex + 1"
            :items-per-page="pageSize"
            :total="total"
            @update:page="(p: number) => tableApi?.setPageIndex(p - 1)"
        />
    </div>
</template>

<script setup lang="ts">
import type { Table } from '@tanstack/vue-table'

const props = defineProps<{ tableApi: Table<any> | undefined }>()

const total = computed(() => props.tableApi?.getFilteredRowModel().rows.length ?? 0)
const pageIndex = computed(() => props.tableApi?.getState().pagination.pageIndex ?? 0)
const pageSize = computed(() => props.tableApi?.getState().pagination.pageSize ?? 0)
const from = computed(() => total.value === 0 ? 0 : pageIndex.value * pageSize.value + 1)
const to = computed(() => Math.min((pageIndex.value + 1) * pageSize.value, total.value))
</script>
