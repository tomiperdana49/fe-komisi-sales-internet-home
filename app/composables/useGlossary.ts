import type { CommissionRules } from '~/types/rules'

// Plain-language explanations for commission terms, shown as tooltips and in the glossary panel.
// Numbers come from the selected period's commission rules (admin "Aturan Komisi" page);
// each text has a number-free fallback for the moment before those rules have loaded.
// Logic is documented in be-access-home-v2/KOMISI.md.

const pct = (n: number) => `${n.toLocaleString('id-ID')}%`
const rp = (n: number) => n >= 1_000_000
    ? `Rp ${(n / 1_000_000).toLocaleString('id-ID')}jt`
    : n >= 1_000 ? `Rp ${(n / 1_000).toLocaleString('id-ID')}rb` : `Rp ${n.toLocaleString('id-ID')}`

type Rules = CommissionRules | null

const GLOSSARY = {
    new: {
        term: 'New',
        text: (r: Rules) => `Pemasangan baru. Komisi tergantung paket dan lama kontrak; terkena potongan${r ? ` ${pct(r.penalties.missedTarget)}` : ''} bila sales Permanent tidak capai target.`
    },
    recurring: {
        term: 'Recurring',
        text: (r: Rules) => r
            ? `Tagihan bulanan rutin dari pelanggan yang sudah berjalan. Rate ${pct(r.rates.recurringOnTarget)} (capai target / Probation) atau ${pct(r.rates.recurringMissedTarget)} (tidak capai target).`
            : 'Tagihan bulanan rutin dari pelanggan yang sudah berjalan. Rate-nya lebih tinggi bila sales capai target.'
    },
    prorate: {
        term: 'Prorate',
        text: (r: Rules) => `Tagihan sebagian bulan (prorata) di awal berlangganan.${r ? ` Komisi flat ${pct(r.rates.prorate)}.` : ''}`
    },
    upgrade: {
        term: 'Upgrade',
        text: () => 'Pelanggan pindah ke paket yang lebih tinggi. Rate mengikuti paket dan lama kontrak, tanpa potongan target.'
    },
    alat: {
        term: 'Alat',
        text: (r: Rules) => r
            ? `Penjualan perangkat. Komisi ${pct(r.rates.alatWithSetup)} bila dibeli bersama setup, ${pct(r.rates.alatStandalone)} bila dibeli terpisah.`
            : 'Penjualan perangkat. Rate-nya berbeda bila dibeli bersama setup atau terpisah.'
    },
    setup: {
        term: 'Setup',
        text: (r: Rules) => {
            if (!r) return 'Biaya pemasangan.'
            const custom = r.products.some(p => p.setupRate !== null)
            return `Biaya pemasangan. Komisi ${pct(r.rates.setup)}${custom ? ', kecuali produk yang punya rate setup sendiri' : ''}.`
        }
    },
    churn: {
        term: 'Churn',
        text: () => 'Pelanggan berhenti berlangganan kurang dari 1 tahun sejak registrasi. Mengurangi komisi dan jumlah pencapaian New.'
    },
    subscription: {
        term: 'Subscription',
        text: () => 'Nilai invoice yang sudah dibayar pelanggan.'
    },
    mrc: {
        term: 'MRC',
        text: () => 'Monthly Recurring Charge — nilai tagihan pelanggan per bulan.'
    },
    contractMonths: {
        term: 'Lama Kontrak',
        text: () => 'Jumlah bulan yang dibayar di invoice ini. Menentukan rate komisi yang dipakai: rate 1 bulan, 6 bulan, atau 12 bulan.'
    },
    lateMonth: {
        term: 'Telat Bayar',
        text: (r: Rules) => r
            ? `Berapa bulan pembayaran terlambat. Komisi dipotong ${pct(r.penalties.latePerMonth)} per bulan (maks. ${pct(r.penalties.lateMax)}), kecuali invoice sudah disetujui.`
            : 'Berapa bulan pembayaran terlambat. Komisi dipotong per bulan keterlambatan, kecuali invoice sudah disetujui.'
    },
    commission: {
        term: 'Komisi',
        text: () => 'Dasar komisi × persentase = komisi yang diterima.'
    },
    activity: {
        term: 'Pencapaian New',
        text: () => 'Jumlah pemasangan baru setelah dikurangi churn. Angka ini yang menentukan target, bonus, dan rate recurring.'
    },
    newAchievement: {
        term: 'Pencapaian New',
        text: () => 'Jumlah pencapaian dari pemasangan baru. Home dan Nusafiber: 1 layanan = 1. NusaSelecta dihitung per kelompok: 3 unit Basic/Prime = 1, 2 unit Ultra = 1, sisa 2 Basic/Prime + 1 Ultra = 1; sisa unit lainnya tidak dihitung, tapi komisinya tetap dibayar.'
    },
    bonusBulanan: {
        term: 'Bonus Bulanan',
        text: (r: Rules) => r
            ? `Bonus bila pencapaian New mencapai ${r.bonus.tiers.map(t => t.at).join(' / ')} (untuk target ${r.targets.permanent}; bila target AM berbeda, tiap tier bergeser sebanyak selisihnya): ${r.bonus.tiers.map(t => rp(t.amount)).join(' / ')}.`
            : 'Bonus tunai bila pencapaian New mencapai tier tertentu.'
    },
    bonusKelebihanService: {
        term: 'Bonus Kelebihan Service',
        text: (r: Rules) => {
            const last = r?.bonus.tiers.at(-1)
            return r && last
                ? `Tambahan di atas Bonus Bulanan bila pencapaian melebihi ${last.at} (untuk target ${r.targets.permanent}; bergeser bila target AM berbeda): ${rp(r.bonus.excessPerUnit)} per service di atas batas itu.`
                : 'Tambahan di atas Bonus Bulanan bila pencapaian melebihi tier tertinggi: bonus per service di atas tier itu.'
        }
    },
    consistencyBonus: {
        term: 'Bonus Konsistensi',
        text: () => 'Bonus yang diberikan manual oleh admin untuk periode ini.'
    },
    teamSize: {
        term: 'Jumlah AM',
        text: (r: Rules) => {
            const t = r?.manager.teamThresholds
            const range = t && t.length ? ` (${t[0]!.teamSize} AM = ${pct(t[0]!.percent)} … ${t.at(-1)!.teamSize}+ AM = ${pct(t.at(-1)!.percent)})` : ''
            return `Semua anggota tim termasuk Probation. Menentukan threshold target: makin besar tim, makin ringan targetnya${range}.`
        }
    },
    baseTarget: {
        term: 'Target Dasar',
        text: (r: Rules) => `Jumlah target aktivitas semua anggota Permanent${r ? ` (default ${r.targets.permanent} per orang)` : ''}. Anggota Probation tidak menambah target.`
    },
    finalTarget: {
        term: 'Target Akhir',
        text: () => 'Target Dasar × threshold sesuai jumlah AM, dibulatkan. Tim harus mencapai angka ini agar manager berstatus Capai Target.'
    },
    teamAchievement: {
        term: 'Capaian Tim',
        text: (r: Rules) => {
            if (!r) return 'Total pencapaian New tim ÷ Target Dasar. Menentukan persentase Overriding New.'
            const tiers = [...r.manager.newCommissionTiers].sort((a, b) => b.minAchievement - a.minAchievement)
            return `Total pencapaian New tim ÷ Target Dasar. Menentukan persentase Overriding New: ${tiers.map(t => `≥${t.minAchievement}% → ${pct(t.rate)}`).join(', ')}, di bawahnya 0%.`
        }
    },
    overrideNew: {
        term: 'Overriding New',
        text: () => 'Bagian manager dari total komisi New, Prorate, dan Alat seluruh anggota tim, sesuai persentase Capaian Tim.'
    },
    overrideRecurring: {
        term: 'Overriding Recurring',
        text: (r: Rules) => r
            ? `Persentase dari total subscription recurring tim: ${pct(r.manager.recurringOnTarget)} bila Capai Target, ${pct(r.manager.recurringMissedTarget)} bila tidak.`
            : 'Persentase dari total subscription recurring tim; lebih tinggi bila tim Capai Target.'
    },
    personalSales: {
        term: 'Penjualan Pribadi',
        text: () => 'Komisi dari penjualan atas nama manager sendiri. Aturannya sama seperti sales, tapi status capai target mengikuti capaian tim.'
    },
    cro: {
        term: 'Customer Relation Officer',
        text: () => 'Invoice recurring tanpa sales yang dikreditkan ke manager. Ikut dihitung ke Overriding Recurring, tidak ke komisi pribadi.'
    }
} as const

export type GlossaryKey = keyof typeof GLOSSARY

export const useGlossary = () => {
    const { rules } = useCommissionRules()
    const explain = (key: GlossaryKey) => GLOSSARY[key].text(rules.value)
    const entries = (keys?: GlossaryKey[]) =>
        (keys ?? (Object.keys(GLOSSARY) as GlossaryKey[])).map(k => ({ term: GLOSSARY[k].term, text: GLOSSARY[k].text(rules.value) }))
    return { explain, entries }
}
