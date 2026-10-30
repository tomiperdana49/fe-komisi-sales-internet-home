import type { CommissionProductRule } from '~/types/rules'
import type { SdrCommissionRules } from '~/types/sdr-rules'
import type { RuleChange } from './useRuleDiff'

const pct = (v: number | null | undefined) => v === null || v === undefined ? 'default' : `${v}%`
const rupiah = (v: number) => `Rp ${v.toLocaleString('id-ID')}`
const num = (v: number) => String(v)

const SCALARS: { section: string; path: [keyof SdrCommissionRules, string]; label: string; fmt: (v: number) => string }[] = [
    { section: 'Rate & Potongan', path: ['rates', 'prorate'], label: 'Prorate', fmt: pct },
    { section: 'Rate & Potongan', path: ['rates', 'setup'], label: 'Setup (default)', fmt: pct },
    { section: 'Rate & Potongan', path: ['rates', 'alatWithSetup'], label: 'Alat — bersama setup', fmt: pct },
    { section: 'Rate & Potongan', path: ['rates', 'alatStandalone'], label: 'Alat — terpisah', fmt: pct },
    { section: 'Rate & Potongan', path: ['rates', 'recurringOnTarget'], label: 'Recurring — capai target / Probation', fmt: pct },
    { section: 'Rate & Potongan', path: ['rates', 'recurringMissedTarget'], label: 'Recurring — tidak capai target', fmt: pct },
    { section: 'Rate & Potongan', path: ['rates', 'digitalBusinessInternal'], label: 'Digital Business — Internal', fmt: pct },
    { section: 'Rate & Potongan', path: ['rates', 'digitalBusinessResell'], label: 'Digital Business — Resell', fmt: pct },
    { section: 'Rate & Potongan', path: ['penalties', 'latePerMonth'], label: 'Telat bayar per bulan', fmt: pct },
    { section: 'Rate & Potongan', path: ['penalties', 'lateMax'], label: 'Telat bayar maksimal', fmt: pct },
    { section: 'Rate & Potongan', path: ['penalties', 'missedTarget'], label: 'Potongan gagal target', fmt: pct },
    { section: 'Target & Status', path: ['targets', 'permanent'], label: 'Target default Permanent', fmt: num },
    { section: 'Target & Status', path: ['targets', 'probation'], label: 'Target default Probation', fmt: num },
    { section: 'Target & Status', path: ['achievement', 'permanentBonus'], label: 'Permanent — Capai target Bonus', fmt: num },
    { section: 'Target & Status', path: ['achievement', 'permanentOnTarget'], label: 'Permanent — Capai target', fmt: num },
    { section: 'Target & Status', path: ['achievement', 'permanentSp1Below'], label: 'Permanent — SP1 di bawah', fmt: num },
    { section: 'Target & Status', path: ['achievement', 'probationExcellent'], label: 'Probation — Excellent', fmt: num },
    { section: 'Target & Status', path: ['achievement', 'probationVeryGood'], label: 'Probation — Very Good', fmt: num },
    { section: 'Target & Status', path: ['achievement', 'probationAverage'], label: 'Probation — Average', fmt: num },
    { section: 'Bonus', path: ['bonus', 'excessPerUnit'], label: 'Bonus Kelebihan Service per layanan', fmt: rupiah },
    { section: 'Bonus', path: ['consistency', 'months'], label: 'Bonus Konsistensi — jumlah bulan per blok', fmt: num },
    { section: 'Bonus', path: ['consistency', 'startPeriod'], label: 'Bonus Konsistensi — bulan mulai blok', fmt: (v: string) => `${v.slice(4)}/${v.slice(0, 4)}` },
    { section: 'Bonus', path: ['consistency', 'minTestimonials'], label: 'Bonus Konsistensi — testimoni minimal per blok', fmt: num },
    { section: 'Bonus', path: ['consistency', 'minPerMonth'], label: 'Bonus Konsistensi — pencapaian minimal per bulan', fmt: num }
]

const PRODUCT_FIELDS: { key: keyof CommissionProductRule; label: string; fmt: (v: any) => string }[] = [
    { key: 'serviceIds', label: 'ServiceId', fmt: (v: string[]) => v.join(', ') },
    { key: 'group', label: 'grup', fmt: String },
    { key: 'rate1', label: 'rate 1 bln', fmt: pct },
    { key: 'rate6', label: 'rate 6 bln', fmt: pct },
    { key: 'rate12', label: 'rate 12 bln', fmt: pct },
    { key: 'sixMonthRateFrom', label: 'rate 6 bln mulai', fmt: (v: number) => `kontrak ≥ ${v} bln` },
    { key: 'twelveMonthRateFrom', label: 'rate 12 bln mulai', fmt: (v: number) => `kontrak ≥ ${v} bln` },
    { key: 'setupRate', label: 'setup', fmt: pct },
    { key: 'churn', label: 'hitung churn', fmt: (v: boolean) => v ? 'Ya' : 'Tidak' }
]

const describeProduct = (p: CommissionProductRule) => `${p.serviceIds.join(', ')} · ${p.rate1}% / ${p.rate6}% / ${p.rate12}%`

/** Same as diffRules, for the SDR rule sets (no manager part, no recurring category list). */
export const diffSdrRules = (before: SdrCommissionRules, after: SdrCommissionRules): RuleChange[] => {
    const changes: RuleChange[] = []

    const beforeByName = new Map(before.products.map(p => [p.name, p]))
    const afterByName = new Map(after.products.map(p => [p.name, p]))
    for (const p of after.products) {
        const old = beforeByName.get(p.name)
        if (!old) {
            changes.push({ section: 'Produk & Rate', label: `Produk baru: ${p.name}`, from: '–', to: describeProduct(p) })
            continue
        }
        for (const f of PRODUCT_FIELDS) {
            if (JSON.stringify(old[f.key]) !== JSON.stringify(p[f.key])) {
                changes.push({ section: 'Produk & Rate', label: `${p.name} — ${f.label}`, from: f.fmt(old[f.key]), to: f.fmt(p[f.key]) })
            }
        }
    }
    for (const p of before.products) {
        if (!afterByName.has(p.name)) {
            changes.push({ section: 'Produk & Rate', label: `Produk dihapus: ${p.name}`, from: describeProduct(p), to: '–' })
        }
    }

    for (const s of SCALARS) {
        const [group, key] = s.path
        // Optional: absent when the BE predates the setting.
        const a = (before[group] as Record<string, number> | undefined)?.[key]
        const b = (after[group] as Record<string, number> | undefined)?.[key]
        if (a === undefined || b === undefined) continue
        if (a !== b) changes.push({ section: s.section, label: s.label, from: s.fmt(a), to: s.fmt(b) })
    }

    const list = <T>(label: string, section: string, a: T[], b: T[], fmt: (t: T) => string) => {
        if (JSON.stringify(a) !== JSON.stringify(b)) {
            changes.push({ section, label, from: a.map(fmt).join(', '), to: b.map(fmt).join(', ') })
        }
    }
    list('Tier bonus bulanan', 'Bonus', before.bonus.tiers, after.bonus.tiers, t => `${t.at} → ${rupiah(t.amount)}`)
    if (before.consistency && after.consistency) {
        const onOff = (v: boolean) => v ? 'Aktif' : 'Tidak aktif'
        if (before.consistency.enabled !== after.consistency.enabled) {
            changes.push({ section: 'Bonus', label: 'Bonus Konsistensi otomatis', from: onOff(before.consistency.enabled), to: onOff(after.consistency.enabled) })
        }
        list('Tier Bonus Konsistensi', 'Bonus', before.consistency.tiers, after.consistency.tiers, t => `${t.at} → ${rupiah(t.amount)}`)
    }

    return changes
}
