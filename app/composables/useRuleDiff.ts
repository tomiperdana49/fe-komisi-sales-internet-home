import type { CommissionProductRule, CommissionRules } from '~/types/rules'

export interface RuleChange {
    section: string
    label: string
    from: string
    to: string
}

const pct = (v: number | null | undefined) => v === null || v === undefined ? 'default' : `${v}%`
const rupiah = (v: number) => `Rp ${v.toLocaleString('id-ID')}`
const num = (v: number) => String(v)

const SCALARS: { section: string; path: [keyof CommissionRules, string]; label: string; fmt: (v: number) => string }[] = [
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
    { section: 'Sales Manager', path: ['manager', 'recurringOnTarget'], label: 'Overriding Recurring — capai target', fmt: pct },
    { section: 'Sales Manager', path: ['manager', 'recurringMissedTarget'], label: 'Overriding Recurring — tidak capai target', fmt: pct }
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

/** Human-readable list of what differs between two rule sets, for the "who changed what" panel. */
export const diffRules = (before: CommissionRules, after: CommissionRules): RuleChange[] => {
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
        const a = (before[group] as Record<string, number>)[key]!
        const b = (after[group] as Record<string, number>)[key]!
        if (a !== b) changes.push({ section: s.section, label: s.label, from: s.fmt(a), to: s.fmt(b) })
    }

    const list = <T>(label: string, section: string, a: T[], b: T[], fmt: (t: T) => string) => {
        if (JSON.stringify(a) !== JSON.stringify(b)) {
            changes.push({ section, label, from: a.map(fmt).join(', '), to: b.map(fmt).join(', ') })
        }
    }
    list('Kategori recurring tanpa komisi', 'Rate & Potongan', before.excludedRecurringCategories, after.excludedRecurringCategories, String)
    list('Tier bonus bulanan', 'Bonus', before.bonus.tiers, after.bonus.tiers, t => `${t.at} → ${rupiah(t.amount)}`)
    list('Threshold target tim', 'Sales Manager', before.manager.teamThresholds, after.manager.teamThresholds, t => `${t.teamSize} AM: ${t.percent}%`)
    list('Tier overriding New', 'Sales Manager', before.manager.newCommissionTiers, after.manager.newCommissionTiers, t => `≥${t.minAchievement}%: ${t.rate}%`)

    return changes
}
