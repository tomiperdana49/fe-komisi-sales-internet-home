<template>
    <div class="space-y-4">
        <SummaryToolbar v-model:month="selectedMonth" v-model:year="year" />

        <UContainer>
            <HeroBackground />
            <div class="py-4 space-y-4">
                <div>
                    <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">Aturan Komisi</h2>
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        Rate, potongan, target, bonus, dan aturan manager yang dipakai menghitung komisi. Setiap perubahan dibuat sebagai versi baru yang
                        <strong>berlaku mulai periode tertentu</strong>, sehingga komisi bulan-bulan sebelumnya tidak ikut berubah.
                    </p>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-4 items-start">
                    <!-- Daftar versi -->
                    <UCard :ui="{ body: 'p-3 sm:p-3' }">
                        <template #header>
                            <div class="flex items-center justify-between gap-2">
                                <h3 class="font-semibold text-gray-900 dark:text-white">Versi Aturan</h3>
                                <UButton size="sm" icon="i-lucide-plus" @click="openCreate()">Draft Baru</UButton>
                            </div>
                        </template>
                        <ul class="space-y-1">
                            <li v-for="set in ruleSets" :key="set.id">
                                <button
                                    type="button"
                                    :class="['w-full text-left rounded-lg px-3 py-2 transition-colors', selectedKey === set.id ? 'bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-200 dark:ring-primary-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
                                    @click="select(set.id)"
                                >
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="text-sm font-semibold text-gray-900 dark:text-white">Mulai {{ periodLabel(set.effectivePeriod) }}</span>
                                        <UBadge :color="set.status === 'draft' ? 'warning' : activeId === set.id ? 'success' : 'neutral'" variant="subtle" size="sm">
                                            {{ set.status === 'draft' ? 'Draft' : activeId === set.id ? 'Aktif' : 'Terbit' }}
                                        </UBadge>
                                    </div>
                                    <TextTooltip :text="set.note" hover-only>
                                        <p class="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mt-0.5">{{ set.note || '-' }}</p>
                                    </TextTooltip>
                                    <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                                        <UIcon name="i-lucide-user" class="size-3" />
                                        {{ set.status === 'published' ? `Diterbitkan ${set.publishedByName} · ${formatDate(set.publishedAt)}` : `${set.updatedByName ?? set.createdByName} · ${formatDate(set.updatedAt ?? set.createdAt)}` }}
                                    </p>
                                </button>
                            </li>
                            <li>
                                <button
                                    type="button"
                                    :class="['w-full text-left rounded-lg px-3 py-2 transition-colors', selectedKey === 'default' ? 'bg-primary-50 dark:bg-primary-950/30 ring-1 ring-primary-200 dark:ring-primary-800' : 'hover:bg-gray-50 dark:hover:bg-gray-800/50']"
                                    @click="select('default')"
                                >
                                    <div class="flex items-center justify-between gap-2">
                                        <span class="text-sm font-semibold text-gray-900 dark:text-white">Bawaan sistem</span>
                                        <UBadge :color="activeId === null ? 'success' : 'neutral'" variant="subtle" size="sm">{{ activeId === null ? 'Aktif' : 'Lama' }}</UBadge>
                                    </div>
                                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Dipakai untuk periode sebelum versi pertama diterbitkan.</p>
                                </button>
                            </li>
                        </ul>
                    </UCard>

                    <!-- Editor -->
                    <UCard v-if="form">
                        <template #header>
                            <div class="flex flex-col md:flex-row md:items-start justify-between gap-3">
                                <div class="space-y-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                            {{ selectedSet ? `Berlaku mulai ${periodLabel(selectedSet.effectivePeriod)}` : 'Aturan bawaan sistem' }}
                                        </h3>
                                        <UBadge v-if="isDraft" color="warning" variant="subtle">Draft</UBadge>
                                    </div>
                                    <p v-if="!selectedSet" class="text-sm text-gray-500 dark:text-gray-400">Nilai bawaan dari kode. Buat draft baru untuk mengubahnya.</p>
                                    <template v-else>
                                        <p v-if="!isDraft" class="text-sm text-gray-500 dark:text-gray-400">Versi yang sudah terbit tidak bisa diubah — buat draft baru dari versi ini.</p>
                                        <ul class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400 pt-1">
                                            <li><span class="font-medium text-gray-700 dark:text-gray-300">Dibuat</span> {{ selectedSet.createdByName }} · {{ formatDateTime(selectedSet.createdAt) }}</li>
                                            <li v-if="selectedSet.updatedAt"><span class="font-medium text-gray-700 dark:text-gray-300">Terakhir diubah</span> {{ selectedSet.updatedByName }} · {{ formatDateTime(selectedSet.updatedAt) }}</li>
                                            <li v-if="selectedSet.publishedAt"><span class="font-medium text-gray-700 dark:text-gray-300">Diterbitkan</span> {{ selectedSet.publishedByName }} · {{ formatDateTime(selectedSet.publishedAt) }}</li>
                                        </ul>
                                        <p v-if="!isDraft" class="text-sm text-gray-700 dark:text-gray-300 pt-1"><span class="font-medium">Catatan:</span> {{ selectedSet.note }}</p>
                                    </template>
                                </div>
                                <div class="flex flex-wrap items-center gap-2 md:shrink-0 md:flex-nowrap">
                                    <template v-if="isDraft">
                                        <UButton color="neutral" variant="ghost" icon="i-lucide-trash-2" @click="isDeleteOpen = true">Hapus</UButton>
                                        <UButton color="neutral" variant="outline" icon="i-lucide-save" :loading="saving" :disabled="!isDirty" @click="saveDraft">Simpan Draft</UButton>
                                        <UButton icon="i-lucide-send" :disabled="isDirty" @click="isPublishOpen = true">Terbitkan</UButton>
                                    </template>
                                    <UButton v-else icon="i-lucide-copy" variant="outline" @click="openCreate(selectedSet?.id)">Buat draft dari versi ini</UButton>
                                </div>
                            </div>

                            <div v-if="isDraft" class="grid grid-cols-1 md:grid-cols-[auto_1fr] gap-3 mt-4">
                                <UFormField label="Berlaku mulai">
                                    <div class="flex gap-2">
                                        <USelectMenu v-model="draftMonth" :items="monthSelect" value-key="id" class="w-36" />
                                        <USelectMenu v-model="draftYear" :items="futureYears" class="w-24" />
                                    </div>
                                </UFormField>
                                <UFormField label="Catatan perubahan" required>
                                    <UInput v-model="draftNote" class="w-full" placeholder="Contoh: Lite 12 bulan jadi 0%, tambah produk NusaSelecta Free" />
                                </UFormField>
                            </div>
                            <UAlert
                                v-if="isDraft && draftPeriod === thisPeriod"
                                class="mt-3"
                                color="warning"
                                variant="subtle"
                                icon="i-lucide-triangle-alert"
                                description="Draft ini berlaku mulai periode berjalan — komisi bulan ini akan ikut berubah begitu diterbitkan."
                            />
                            <p v-if="isDraft && isDirty" class="text-xs text-amber-600 dark:text-amber-400 mt-2">Ada perubahan yang belum disimpan. Simpan dulu sebelum simulasi atau terbit.</p>
                        </template>

                        <div v-if="selectedSet" class="mb-4 rounded-lg border border-gray-200 dark:border-gray-800">
                            <div class="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-gray-200 dark:border-gray-800">
                                <h4 class="text-sm font-semibold text-gray-900 dark:text-white">
                                    Perubahan dibanding {{ predecessorLabel }}
                                    <UBadge color="neutral" variant="subtle" size="sm" class="ml-1">{{ changes.length }}</UBadge>
                                </h4>
                                <span v-if="isDirty" class="text-xs text-amber-600 dark:text-amber-400">termasuk yang belum disimpan</span>
                            </div>
                            <p v-if="changes.length === 0" class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Belum ada perubahan — isi aturan masih sama.</p>
                            <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800 max-h-64 overflow-y-auto">
                                <li v-for="(ch, i) in changes" :key="i" class="px-4 py-2 text-sm grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-1 sm:gap-4">
                                    <span class="text-gray-700 dark:text-gray-300"><span class="text-xs text-gray-400 mr-1">{{ ch.section }} ·</span>{{ ch.label }}</span>
                                    <span class="tabular-nums whitespace-nowrap"><span class="text-red-500 dark:text-red-400 line-through">{{ ch.from }}</span> → <span class="font-semibold text-green-600 dark:text-green-400">{{ ch.to }}</span></span>
                                </li>
                            </ul>
                        </div>

                        <UTabs v-model="section" :items="sections" :content="false" color="neutral" variant="link" class="w-full mb-2" />
                        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">{{ sectionHints[section] }}</p>

                        <UTabs :key="section" :items="tabs" class="w-full" :unmount-on-hide="false">
                            <!-- Produk & Rate -->
                            <template #products>
                                <p class="text-sm text-gray-500 dark:text-gray-400 my-3">
                                    Rate komisi New & Upgrade per produk. Penjualan New/Upgrade produk yang <strong>tidak ada</strong> di tabel ini tidak mendapat komisi dan tidak menambah pencapaian.
                                    Pisahkan beberapa ServiceId dengan koma. Kontrak di bawah batas rate 6 bulan memakai rate 1 bulan. Kosongkan kolom Setup untuk memakai rate setup umum. Centang <strong>Churn</strong> agar layanan produk tersebut yang berhenti kurang dari 1 tahun dihitung sebagai churn.
                                </p>
                                <div class="overflow-x-auto">
                                    <table class="w-full min-w-[1230px] text-sm">
                                        <thead>
                                            <tr class="text-left text-xs uppercase text-gray-500 border-b border-gray-200 dark:border-gray-800">
                                                <th class="py-2 pr-2 min-w-56">Produk</th>
                                                <th class="py-2 pr-2 min-w-44">ServiceId</th>
                                                <th class="py-2 pr-2 min-w-48">Grup</th>
                                                <th class="py-2 pr-2 w-28 min-w-28">1 bln %</th>
                                                <th class="py-2 pr-2 w-28 min-w-28">6 bln %</th>
                                                <th class="py-2 pr-2 w-28 min-w-28">12 bln %</th>
                                                <th class="py-2 pr-2 w-32 min-w-32">Rate 6 bln mulai kontrak ≥</th>
                                                <th class="py-2 pr-2 w-32 min-w-32">Rate 12 bln mulai kontrak ≥</th>
                                                <th class="py-2 pr-2 w-28 min-w-28">Setup %</th>
                                                <th class="py-2 pr-2 w-20 min-w-20 text-center">Churn</th>
                                                <th v-if="isDraft" class="py-2 w-10" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr v-for="(p, i) in form.products" :key="i" class="border-b border-gray-100 dark:border-gray-800/60 align-top">
                                                <td class="py-2 pr-2"><UInput v-model="p.name" :disabled="!isDraft" class="w-full" /></td>
                                                <td class="py-2 pr-2">
                                                    <UInput
                                                        :model-value="p.serviceIds.join(', ')"
                                                        :disabled="!isDraft"
                                                        class="w-full"
                                                        @update:model-value="(v: string) => p.serviceIds = String(v).split(',').map(s => s.trim().toUpperCase()).filter(Boolean)"
                                                    />
                                                </td>
                                                <td class="py-2 pr-2"><USelect v-model="p.group" :items="productGroups" :disabled="!isDraft" class="w-full" /></td>
                                                <td class="py-2 pr-2"><UInput v-model.number="p.rate1" type="number" step="0.01" min="0" max="100" :disabled="!isDraft" /></td>
                                                <td class="py-2 pr-2"><UInput v-model.number="p.rate6" type="number" step="0.01" min="0" max="100" :disabled="!isDraft" /></td>
                                                <td class="py-2 pr-2"><UInput v-model.number="p.rate12" type="number" step="0.01" min="0" max="100" :disabled="!isDraft" /></td>
                                                <td class="py-2 pr-2"><UInput v-model.number="p.sixMonthRateFrom" type="number" min="2" :disabled="!isDraft"><template #trailing><span class="text-xs text-gray-400">bln</span></template></UInput></td>
                                                <td class="py-2 pr-2"><UInput v-model.number="p.twelveMonthRateFrom" type="number" min="3" :disabled="!isDraft"><template #trailing><span class="text-xs text-gray-400">bln</span></template></UInput></td>
                                                <td class="py-2 pr-2">
                                                    <UInput
                                                        :model-value="p.setupRate ?? ''"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max="100"
                                                        :placeholder="String(form.rates.setup)"
                                                        :disabled="!isDraft"
                                                        @update:model-value="(v: string | number) => p.setupRate = v === '' || v === null ? null : Number(v)"
                                                    />
                                                </td>
                                                <td class="py-2 pr-2 text-center"><UCheckbox v-model="p.churn" :disabled="!isDraft" class="justify-center pt-2" aria-label="Hitung churn" /></td>
                                                <td v-if="isDraft" class="py-2">
                                                    <UButton icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Hapus produk" @click="form.products.splice(i, 1)" />
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <UButton v-if="isDraft" class="mt-3" icon="i-lucide-plus" variant="soft" @click="addProduct">Tambah Produk</UButton>
                            </template>

                            <!-- Rate umum & potongan -->
                            <template #rates>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <section class="space-y-3">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Rate Umum (%)</h4>
                                        <RuleNumber v-model="form.rates.prorate" label="Prorate" hint="Flat untuk semua produk" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.rates.setup" label="Setup (default)" hint="Dipakai bila produk tidak punya rate setup sendiri" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.rates.alatWithSetup" label="Alat — bersama setup" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.rates.alatStandalone" label="Alat — terpisah" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.rates.recurringOnTarget" label="Recurring — capai target / Probation" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.rates.recurringMissedTarget" label="Recurring — Permanent tidak capai target" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.rates.digitalBusinessInternal" label="Digital Business recurring — Internal" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.rates.digitalBusinessResell" label="Digital Business recurring — Resell" :disabled="!isDraft" />
                                    </section>
                                    <section class="space-y-3">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Potongan (%)</h4>
                                        <RuleNumber v-model="form.penalties.latePerMonth" label="Telat bayar per bulan" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.penalties.lateMax" label="Telat bayar maksimal" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.penalties.missedTarget" label="Potongan New saat Permanent tidak capai target" hint="Contoh 70 = sales hanya dapat komisi dari 30% dasar komisi" :disabled="!isDraft" />

                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white pt-4">Kategori Recurring Tanpa Komisi</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">
                                            Invoice recurring dengan kategori ini tidak dihitung sama sekali. Berlaku saat data invoice periode tersebut diambil ulang (otomatis tiap jam),
                                            sehingga tidak terlihat di tab Simulasi.
                                        </p>
                                        <UInputTags v-model="form.excludedRecurringCategories" :disabled="!isDraft" placeholder="Ketik kategori lalu Enter" class="w-full" />
                                        <div v-if="isDraft" class="flex flex-wrap gap-1">
                                            <UButton
                                                v-for="c in categorySuggestions.filter(c => !form!.excludedRecurringCategories.some(x => x.toLowerCase() === c.toLowerCase()))"
                                                :key="c"
                                                size="xs"
                                                color="neutral"
                                                variant="outline"
                                                icon="i-lucide-plus"
                                                @click="form!.excludedRecurringCategories.push(c)"
                                            >
                                                {{ c }}
                                            </UButton>
                                        </div>
                                    </section>
                                </div>
                            </template>

                            <!-- Target & status -->
                            <template #targets>
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                                    <section class="space-y-3">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Target Default (layanan baru / bulan)</h4>
                                        <RuleNumber v-model="form.targets.permanent" label="Permanent" hint="Target layanan baru per bulan untuk semua AM Permanent. Juga membentuk Target Dasar tim Sales Manager." :step="1" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.targets.probation" label="Probation" :step="1" :disabled="!isDraft" />
                                    </section>
                                    <section class="space-y-3">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Batas Status Pencapaian</h4>
                                        <RuleNumber v-model="form.achievement.permanentBonus" label="Permanent — Capai target Bonus (≥)" :step="1" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.achievement.permanentOnTarget" label="Permanent — Capai target (≥)" :step="1" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.achievement.permanentSp1Below" label="Permanent — SP1 (di bawah)" :step="1" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.achievement.probationExcellent" label="Probation — Excellent (≥)" :step="1" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.achievement.probationVeryGood" label="Probation — Very Good (≥)" :step="1" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.achievement.probationAverage" label="Probation — Average (≥)" :step="1" :disabled="!isDraft" />
                                    </section>
                                </div>
                            </template>

                            <!-- Bonus -->
                            <template #bonus>
                                <div class="mt-4 space-y-4 max-w-xl">
                                    <p class="text-sm text-gray-500 dark:text-gray-400">
                                        Tier berlaku untuk AM dengan target default ({{ form.targets.permanent }}). Untuk AM Permanent dengan target lain, tier ikut bergeser sebesar selisih targetnya.
                                        Di atas tier terakhir, AM tetap mendapat bonus tier terakhir ditambah Bonus Kelebihan Service per layanan di atasnya.
                                    </p>
                                    <div v-for="(t, i) in form.bonus.tiers" :key="i" class="flex items-end gap-2">
                                        <UFormField label="Pencapaian New" class="w-36"><UInput v-model.number="t.at" type="number" min="0" :disabled="!isDraft" /></UFormField>
                                        <UFormField label="Bonus (Rp)" class="flex-1"><UInput v-model.number="t.amount" type="number" min="0" step="50000" :disabled="!isDraft" /></UFormField>
                                        <UButton v-if="isDraft && form.bonus.tiers.length > 1" icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Hapus tier" @click="form.bonus.tiers.splice(i, 1)" />
                                    </div>
                                    <UButton v-if="isDraft" icon="i-lucide-plus" variant="soft" size="sm" @click="form.bonus.tiers.push({ at: (form.bonus.tiers.at(-1)?.at ?? 0) + 1, amount: 0 })">Tambah Tier</UButton>
                                    <RuleNumber v-model="form.bonus.excessPerUnit" label="Bonus Kelebihan Service per layanan di atas tier terakhir (Rp)" :step="10000" :max="null" :disabled="!isDraft" />
                                </div>
                            </template>

                            <!-- Manager -->
                            <template #manager>
                                <div class="mt-4 rounded-lg border border-gray-200 dark:border-gray-800 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
                                    <span class="text-gray-700 dark:text-gray-300">
                                        <span class="font-semibold">Target Akses Home per AM:</span>
                                        Full (Permanent) {{ form.targets.permanent }} · Probation {{ form.targets.probation }}
                                    </span>
                                    <span class="text-xs text-gray-500 dark:text-gray-400">Diatur di Account Manager → Target &amp; Status. Target Dasar tim = jumlah target AM Permanent.</span>
                                </div>
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                    <section class="space-y-2">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Threshold Target Tim</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Target Akhir = Target Dasar × threshold. Baris terakhir juga berlaku untuk tim yang lebih besar.</p>
                                        <div v-for="(t, i) in form.manager.teamThresholds" :key="i" class="flex items-end gap-2">
                                            <UFormField :label="i === 0 ? 'Jumlah AM' : undefined" class="w-28"><UInput v-model.number="t.teamSize" type="number" min="1" :disabled="!isDraft" /></UFormField>
                                            <UFormField :label="i === 0 ? 'Threshold %' : undefined" class="w-28"><UInput v-model.number="t.percent" type="number" min="0" :disabled="!isDraft" /></UFormField>
                                            <UButton v-if="isDraft && form.manager.teamThresholds.length > 1" icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Hapus baris" @click="form.manager.teamThresholds.splice(i, 1)" />
                                        </div>
                                        <UButton v-if="isDraft" icon="i-lucide-plus" variant="soft" size="sm" @click="form.manager.teamThresholds.push({ teamSize: (form.manager.teamThresholds.at(-1)?.teamSize ?? 0) + 1, percent: 85 })">Tambah Baris</UButton>
                                    </section>
                                    <section class="space-y-2">
                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Overriding New</h4>
                                        <p class="text-xs text-gray-500 dark:text-gray-400">Bagian manager dari komisi New tim, berdasarkan Capaian Tim terhadap Target Akhir. Di bawah tier terendah = 0%.</p>
                                        <div v-for="(t, i) in form.manager.newCommissionTiers" :key="i" class="flex items-end gap-2">
                                            <UFormField :label="i === 0 ? 'Capaian ≥ %' : undefined" class="w-32"><UInput v-model.number="t.minAchievement" type="number" min="0" :disabled="!isDraft" /></UFormField>
                                            <UFormField :label="i === 0 ? 'Rate %' : undefined" class="w-28"><UInput v-model.number="t.rate" type="number" min="0" max="100" :disabled="!isDraft" /></UFormField>
                                            <UButton v-if="isDraft && form.manager.newCommissionTiers.length > 1" icon="i-lucide-x" color="neutral" variant="ghost" aria-label="Hapus tier" @click="form.manager.newCommissionTiers.splice(i, 1)" />
                                        </div>
                                        <UButton v-if="isDraft" icon="i-lucide-plus" variant="soft" size="sm" @click="form.manager.newCommissionTiers.push({ minAchievement: 0, rate: 0 })">Tambah Tier</UButton>

                                        <h4 class="text-sm font-semibold text-gray-900 dark:text-white pt-4">Overriding Recurring (%)</h4>
                                        <RuleNumber v-model="form.manager.recurringOnTarget" label="Tim capai target" :disabled="!isDraft" />
                                        <RuleNumber v-model="form.manager.recurringMissedTarget" label="Tim tidak capai target" :disabled="!isDraft" />
                                    </section>
                                </div>
                            </template>

                            <!-- Simulasi -->
                            <template #preview>
                                <div class="mt-4 space-y-3">
                                    <p v-if="!isDraft" class="text-sm text-gray-500 dark:text-gray-400">Simulasi hanya tersedia untuk draft.</p>
                                    <template v-else>
                                        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <p class="text-sm text-gray-500 dark:text-gray-400">
                                                Hitung ulang komisi <strong>{{ periodLabel(previewPeriod) }}</strong> (pilih periode di kanan atas) memakai draft ini, dibandingkan dengan aturan yang berlaku sekarang. Tidak ada data yang diubah.
                                            </p>
                                            <UButton icon="i-lucide-calculator" :loading="previewLoading" :disabled="isDirty" @click="runPreview">Jalankan Simulasi</UButton>
                                        </div>
                                        <template v-if="preview">
                                            <SummaryStats :stats="previewStats" />
                                            <USwitch v-model="onlyChanged" label="Hanya tampilkan yang berubah" />
                                            <UTable :data="previewRows" :columns="previewColumns" empty="Tidak ada perubahan komisi pada periode ini." class="max-h-[600px]" sticky />
                                        </template>
                                    </template>
                                </div>
                            </template>
                        </UTabs>
                    </UCard>
                </div>
            </div>
        </UContainer>

        <!-- Buat draft -->
        <UModal v-model:open="isCreateOpen" title="Draft Aturan Baru" :description="createFromLabel">
            <template #body>
                <div class="space-y-4">
                    <UFormField label="Berlaku mulai" required>
                        <div class="flex gap-2">
                            <USelectMenu v-model="createMonth" :items="monthSelect" value-key="id" class="w-36" />
                            <USelectMenu v-model="createYear" :items="futureYears" class="w-24" />
                        </div>
                    </UFormField>
                    <UFormField label="Catatan perubahan" required>
                        <UInput v-model="createNote" class="w-full" placeholder="Apa yang akan diubah dan kenapa" />
                    </UFormField>
                </div>
            </template>
            <template #footer>
                <div class="flex justify-end gap-2 w-full">
                    <UButton color="neutral" variant="ghost" @click="isCreateOpen = false">Batal</UButton>
                    <UButton :loading="creating" :disabled="!createNote.trim()" @click="createDraft">Buat Draft</UButton>
                </div>
            </template>
        </UModal>

        <ConfirmModal
            v-model:open="isPublishOpen"
            title="Terbitkan aturan ini?"
            :description="`Aturan akan dipakai untuk menghitung komisi mulai ${periodLabel(draftPeriod)} dan seterusnya, sampai ada versi yang lebih baru. Versi yang sudah terbit tidak bisa diubah atau dihapus.`"
            confirm-label="Ya, terbitkan"
            cancel-label="Batal"
            :on-confirm="publish"
        />
        <ConfirmModal
            v-model:open="isDeleteOpen"
            title="Hapus draft ini?"
            description="Draft akan dihapus permanen. Aturan yang sudah terbit tidak terpengaruh."
            confirm-label="Ya, hapus"
            cancel-label="Batal"
            :on-confirm="deleteDraft"
        />
    </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import { RulesService } from '~/services/rules-service'
import type { CommissionRules, CommissionRuleSet, RulePreview } from '~/types/rules'
import { diffRules } from '~/composables/useRuleDiff'

definePageMeta({
    headerProps: { toolbar: true }
})

const UAvatar = resolveComponent('UAvatar')

const rulesService = new RulesService()
const { setLoading } = useLoading()
const { formatCurrency } = useFormat()
const toast = useToast()
const { monthSelect, monthLabel } = usePeriodOptions()
const { invalidate: invalidateViewerRules } = useCommissionRules()

const now = new Date()
const thisPeriod = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
const futureYears = [now.getFullYear(), now.getFullYear() + 1, now.getFullYear() + 2]
const toPeriod = (y: number, m: number) => `${y}${String(m).padStart(2, '0')}`
const periodLabel = (p: string | null | undefined) => p ? `${monthLabel(Number(p.slice(4, 6)))} ${p.slice(0, 4)}` : '-'
const formatDateTime = (iso: string | null) => iso ? new Date(iso).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'
const formatDate = (iso: string | null) => iso ? new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'

// Toolbar period = the period being previewed.
const { year, month: selectedMonth } = useSelectedPeriod()
const previewPeriod = computed(() => toPeriod(year.value, selectedMonth.value))

const productGroups = ['Home', 'Nusafiber', 'NusaSelecta Basic/Prime', 'NusaSelecta Ultra']
const categorySuggestions = ['IP Public', 'Domain', 'FO', 'FO Prepaid', 'Wireless', 'Starlink', 'CPE Rental', 'Digital Business', 'Cicilan', 'Rental', 'Setup', 'Lain-lain']
type Section = 'am' | 'sm' | 'preview'
const section = ref<Section>('am')
const sections = [
    { label: 'Account Manager', value: 'am', icon: 'i-lucide-user' },
    { label: 'Sales Manager', value: 'sm', icon: 'i-lucide-users' },
    { label: 'Simulasi', value: 'preview', icon: 'i-lucide-calculator' }
]
const sectionHints: Record<Section, string> = {
    am: 'Komisi Account Manager: rate per produk, rate umum & potongan, target & status pencapaian, dan bonus. Penjualan pribadi Sales Manager juga memakai aturan ini.',
    sm: 'Komisi Sales Manager dari timnya: threshold target tim, overriding komisi customer baru, dan overriding customer lama (recurring).',
    preview: 'Hitung ulang komisi semua AM & SM dengan draft ini sebelum diterbitkan.'
}
type RuleTab = { label: string; slot: 'products' | 'rates' | 'targets' | 'bonus' | 'manager' | 'preview'; icon: string }
const tabsBySection: Record<Section, RuleTab[]> = {
    am: [
        { label: 'Produk & Rate', slot: 'products', icon: 'i-lucide-package' },
        { label: 'Rate & Potongan', slot: 'rates', icon: 'i-lucide-percent' },
        { label: 'Target & Status', slot: 'targets', icon: 'i-lucide-flag' },
        { label: 'Bonus', slot: 'bonus', icon: 'i-lucide-gift' }
    ],
    sm: [
        { label: 'Target Tim & Overriding', slot: 'manager', icon: 'i-lucide-users' }
    ],
    preview: [
        { label: 'Simulasi', slot: 'preview', icon: 'i-lucide-calculator' }
    ]
}
const tabs = computed(() => tabsBySection[section.value])

const ruleSets = ref<CommissionRuleSet[]>([])
const defaultRules = ref<CommissionRules | null>(null)
/** Published set in force for the current period; null = system default. */
const activeId = ref<number | null>(null)

const selectedKey = ref<number | 'default'>('default')
const selectedSet = computed(() => typeof selectedKey.value === 'number' ? ruleSets.value.find(s => s.id === selectedKey.value) ?? null : null)
const isDraft = computed(() => selectedSet.value?.status === 'draft')

const form = ref<CommissionRules | null>(null)
const draftMonth = ref(1)
const draftYear = ref(now.getFullYear())
const draftNote = ref('')
const draftPeriod = computed(() => toPeriod(draftYear.value, draftMonth.value))

/**
 * What the selected set replaces: the latest published set in force just before it
 * (for a draft, whatever would be in force for its period), else the system defaults.
 */
const predecessor = computed<CommissionRuleSet | null>(() => {
    const set = selectedSet.value
    if (!set) return null
    const period = isDraft.value ? draftPeriod.value : set.effectivePeriod
    const candidates = ruleSets.value.filter(s => {
        if (s.id === set.id || s.status !== 'published') return false
        if (isDraft.value) return s.effectivePeriod <= period
        return s.effectivePeriod < period || (s.effectivePeriod === period && (s.publishedAt ?? '') < (set.publishedAt ?? ''))
    })
    return candidates.sort((a, b) => b.effectivePeriod.localeCompare(a.effectivePeriod) || (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))[0] ?? null
})
const predecessorLabel = computed(() => predecessor.value ? `versi mulai ${periodLabel(predecessor.value.effectivePeriod)}` : 'aturan bawaan sistem')
const changes = computed(() => {
    const base = predecessor.value?.rules ?? defaultRules.value
    return base && form.value ? diffRules(base, form.value) : []
})

const snapshot = ref('')
const currentState = () => JSON.stringify({ form: form.value, period: draftPeriod.value, note: draftNote.value })
const isDirty = computed(() => isDraft.value && currentState() !== snapshot.value)

const select = (key: number | 'default') => {
    selectedKey.value = key
    const set = selectedSet.value
    const source = set ? set.rules : defaultRules.value
    form.value = source ? structuredClone(toRaw(source)) : null
    if (set) {
        draftMonth.value = Number(set.effectivePeriod.slice(4, 6))
        draftYear.value = Number(set.effectivePeriod.slice(0, 4))
        draftNote.value = set.note
    }
    preview.value = null
    snapshot.value = currentState()
}

const load = async (selectId?: number) => {
    setLoading(true)
    try {
        const [list, current, defaults] = await Promise.all([
            rulesService.list(),
            rulesService.effective(thisPeriod),
            // No rule set is ever effective this early, so this returns the system defaults.
            rulesService.effective('200001')
        ])
        ruleSets.value = list.data
        activeId.value = current.data.ruleSetId
        defaultRules.value = defaults.data.rules
        select(selectId ?? activeId.value ?? 'default')
    } finally {
        setLoading(false)
    }
}

// --- Create draft ---
const isCreateOpen = ref(false)
const createFromId = ref<number | undefined>()
const createMonth = ref(now.getMonth() + 1)
const createYear = ref(now.getFullYear())
const createNote = ref('')
const creating = ref(false)
const createFromLabel = computed(() => {
    const from = createFromId.value ? ruleSets.value.find(s => s.id === createFromId.value) : null
    return from ? `Disalin dari versi yang berlaku mulai ${periodLabel(from.effectivePeriod)}.` : 'Disalin dari aturan yang berlaku pada periode yang dipilih.'
})

const openCreate = (fromId?: number) => {
    createFromId.value = fromId
    // Default to next month: changing the current month's commission should be a deliberate choice.
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    createMonth.value = next.getMonth() + 1
    createYear.value = next.getFullYear()
    createNote.value = ''
    isCreateOpen.value = true
}

const createDraft = async () => {
    creating.value = true
    try {
        const res = await rulesService.createDraft(toPeriod(createYear.value, createMonth.value), createNote.value.trim(), createFromId.value)
        isCreateOpen.value = false
        toast.add({ title: 'Draft dibuat', color: 'success' })
        await load(res.data.id)
    } finally {
        creating.value = false
    }
}

// --- Edit / publish / delete ---
const saving = ref(false)
const saveDraft = async () => {
    if (!selectedSet.value || !form.value) return
    saving.value = true
    try {
        await rulesService.updateDraft(selectedSet.value.id, draftPeriod.value, draftNote.value.trim(), form.value)
        toast.add({ title: 'Draft tersimpan', color: 'success' })
        await load(selectedSet.value.id)
    } finally {
        saving.value = false
    }
}

const isPublishOpen = ref(false)
const publish = async () => {
    if (!selectedSet.value) return
    try {
        await rulesService.publish(selectedSet.value.id)
        invalidateViewerRules()
        toast.add({ title: 'Aturan diterbitkan', description: `Berlaku mulai ${periodLabel(draftPeriod.value)}.`, color: 'success' })
        isPublishOpen.value = false
        await load(selectedSet.value.id)
    } catch {
        isPublishOpen.value = false
    }
}

const isDeleteOpen = ref(false)
const deleteDraft = async () => {
    if (!selectedSet.value) return
    try {
        await rulesService.deleteDraft(selectedSet.value.id)
        toast.add({ title: 'Draft dihapus', color: 'success' })
    } finally {
        isDeleteOpen.value = false
        await load()
    }
}

const addProduct = () => {
    form.value?.products.push({ name: '', serviceIds: [], group: 'Home', rate1: 0, rate6: 0, rate12: 0, sixMonthRateFrom: 2, twelveMonthRateFrom: 12, setupRate: null, churn: true })
}

// --- Preview ---
const preview = ref<RulePreview | null>(null)
const previewLoading = ref(false)
const onlyChanged = ref(true)

const runPreview = async () => {
    if (!selectedSet.value) return
    previewLoading.value = true
    try {
        preview.value = (await rulesService.preview(selectedSet.value.id, previewPeriod.value)).data
    } finally {
        previewLoading.value = false
    }
}

type PreviewRow = { role: string; name: string; photoProfile: string; current: number; draft: number; statusChange: string | null }
const changed = (r: { current: number; draft: number }) => Math.abs(r.draft - r.current) >= 1

const allPreviewRows = computed<PreviewRow[]>(() => {
    if (!preview.value) return []
    return [
        ...preview.value.sales.map(r => ({
            role: 'AM',
            name: r.name,
            photoProfile: r.photoProfile,
            current: r.current,
            draft: r.draft,
            statusChange: r.currentStatus !== r.draftStatus ? `${r.currentStatus} → ${r.draftStatus}` : null
        })),
        ...preview.value.managers.map(r => ({ role: 'SM', name: r.name, photoProfile: r.photoProfile, current: r.current, draft: r.draft, statusChange: null }))
    ]
})
const previewRows = computed(() => onlyChanged.value ? allPreviewRows.value.filter(r => changed(r) || r.statusChange) : allPreviewRows.value)

const previewStats = computed(() => {
    const rows = allPreviewRows.value
    const delta = rows.reduce((a, r) => a + r.draft - r.current, 0)
    return [
        { label: 'Karyawan Terdampak', value: `${rows.filter(r => changed(r) || r.statusChange).length} / ${rows.length}` },
        { label: 'Total Komisi Sekarang', value: formatCurrency(rows.reduce((a, r) => a + r.current, 0)) },
        { label: 'Total Komisi dengan Draft', value: formatCurrency(rows.reduce((a, r) => a + r.draft, 0)) },
        { label: 'Selisih', value: `${delta >= 0 ? '+' : '−'}${formatCurrency(Math.abs(delta))}`, class: delta < 0 ? 'text-red-600 dark:text-red-400' : delta > 0 ? 'text-green-600 dark:text-green-400' : undefined }
    ]
})

const previewColumns: TableColumn<PreviewRow>[] = [
    {
        accessorKey: 'name',
        header: 'Karyawan',
        cell: ({ row }) => h('div', { class: 'flex items-center gap-2' }, [
            h(UAvatar, { src: row.original.photoProfile, alt: row.original.name, size: 'sm' }),
            h('div', { class: 'flex flex-col' }, [
                h('span', { class: 'font-medium text-gray-900 dark:text-white' }, row.original.name),
                h('span', { class: 'text-xs text-gray-500' }, row.original.role === 'AM' ? 'Account Manager' : 'Sales Manager')
            ])
        ])
    },
    { accessorKey: 'statusChange', header: 'Perubahan Status', cell: ({ row }) => h('span', { class: 'text-xs' }, row.original.statusChange ?? '–') },
    { accessorKey: 'current', header: () => h('div', { class: 'text-right' }, 'Sekarang'), cell: ({ row }) => h('div', { class: 'text-right tabular-nums' }, formatCurrency(row.original.current)) },
    { accessorKey: 'draft', header: () => h('div', { class: 'text-right' }, 'Dengan Draft'), cell: ({ row }) => h('div', { class: 'text-right tabular-nums font-semibold' }, formatCurrency(row.original.draft)) },
    {
        id: 'delta',
        header: () => h('div', { class: 'text-right' }, 'Selisih'),
        cell: ({ row }) => {
            const d = row.original.draft - row.original.current
            const cls = d < -0.5 ? 'text-red-600 dark:text-red-400' : d > 0.5 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'
            return h('div', { class: ['text-right tabular-nums font-semibold', cls] }, Math.abs(d) < 0.5 ? '–' : `${d > 0 ? '+' : '−'}${formatCurrency(Math.abs(d))}`)
        }
    }
]

watch(previewPeriod, () => { preview.value = null })

onMounted(() => load())
</script>
