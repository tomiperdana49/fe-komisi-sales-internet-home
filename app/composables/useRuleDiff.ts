import type { ChurnCloseReasonRule, CommissionProductRule, CommissionRules } from '~/types/rules'

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
    { section: 'Sales Manager', path: ['manager', 'recurringOnTarget'], label: 'Overriding Recurring akses — capai target', fmt: pct },
    { section: 'Sales Manager', path: ['manager', 'recurringMissedTarget'], label: 'Overriding Recurring akses — tidak capai target', fmt: pct },
    { section: 'Sales Manager', path: ['manager', 'recurringDigitalBusinessInternalOnTarget'], label: 'Overriding Recurring DB Internal & IP Public — capai target', fmt: pct },
    { section: 'Sales Manager', path: ['manager', 'recurringDigitalBusinessInternalMissedTarget'], label: 'Overriding Recurring DB Internal & IP Public — tidak capai target', fmt: pct },
    { section: 'Sales Manager', path: ['manager', 'recurringDigitalBusinessResellOnTarget'], label: 'Overriding Recurring DB Resell — capai target', fmt: pct },
    { section: 'Sales Manager', path: ['manager', 'recurringDigitalBusinessResellMissedTarget'], label: 'Overriding Recurring DB Resell — tidak capai target', fmt: pct },
    { section: 'Sales Manager', path: ['manager', 'personalDigitalBusinessInternal'], label: 'Recurring DB Internal & IP Public pribadi SM', fmt: pct }
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

    const reasonKey = (r: ChurnCloseReasonRule) => `${r.status} — ${r.reason}`
    const yesNo = (r: ChurnCloseReasonRule) => `${r.churn ? 'Churn' : 'Bukan churn'} · ${r.effectFrom}${r.category ? ` · ${r.category}` : ''}${r.note ? ` · ${r.note}` : ''}`
    // Absent when the BE predates close-reason rules.
    const beforeReasons = new Map((before.churnCloseReasons ?? []).map(r => [reasonKey(r), r]))
    const afterReasons = new Map((after.churnCloseReasons ?? []).map(r => [reasonKey(r), r]))
    for (const [key, r] of afterReasons) {
        const old = beforeReasons.get(key)
        if (!old) changes.push({ section: 'Churn', label: `Alasan baru: ${key}`, from: '–', to: yesNo(r) })
        else if (yesNo(old) !== yesNo(r)) changes.push({ section: 'Churn', label: key, from: yesNo(old), to: yesNo(r) })
    }
    for (const [key, r] of beforeReasons) {
        if (!afterReasons.has(key)) changes.push({ section: 'Churn', label: `Alasan dihapus: ${key}`, from: yesNo(r), to: '–' })
    }
    list('Tier bonus bulanan', 'Bonus', before.bonus.tiers, after.bonus.tiers, t => `${t.at} → ${rupiah(t.amount)}`)
    list('Threshold target tim', 'Sales Manager', before.manager.teamThresholds, after.manager.teamThresholds, t => `${t.teamSize} AM: ${t.percent}%`)
    list('Tier overriding New', 'Sales Manager', before.manager.newCommissionTiers, after.manager.newCommissionTiers, t => `≥${t.minAchievement}%: ${t.rate}%`)

    return changes
}
