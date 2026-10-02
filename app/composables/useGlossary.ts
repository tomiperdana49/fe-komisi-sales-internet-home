// Plain-language explanations for commission terms, shown as tooltips and in the glossary panel.
// Source of truth for the rules: be-access-home-v2/KOMISI.md
const GLOSSARY = {
    new: { term: 'New', text: 'Pemasangan baru. Komisi tergantung paket dan lama kontrak; terkena potongan 70% bila sales Permanent tidak capai target.' },
    recurring: { term: 'Recurring', text: 'Tagihan bulanan rutin dari pelanggan yang sudah berjalan. Rate 1.5% (capai target / Probation) atau 0.5% (tidak capai target).' },
    prorate: { term: 'Prorate', text: 'Tagihan sebagian bulan (prorata) di awal berlangganan. Komisi flat 10%.' },
    upgrade: { term: 'Upgrade', text: 'Pelanggan pindah ke paket yang lebih tinggi. Rate mengikuti paket dan lama kontrak, tanpa potongan target.' },
    alat: { term: 'Alat', text: 'Penjualan perangkat. Komisi 2% bila dibeli bersama setup, 1% bila dibeli terpisah.' },
    setup: { term: 'Setup', text: 'Biaya pemasangan. Komisi flat 5%.' },
    churn: { term: 'Churn', text: 'Pelanggan berhenti berlangganan kurang dari 1 tahun sejak registrasi. Mengurangi komisi dan jumlah pencapaian New.' },
    subscription: { term: 'Subscription', text: 'Nilai invoice yang sudah dibayar pelanggan.' },
    mrc: { term: 'MRC', text: 'Monthly Recurring Charge — nilai tagihan pelanggan per bulan.' },
    contractMonths: { term: 'Lama Kontrak', text: 'Jumlah bulan yang dibayar di invoice ini. Menentukan persentase komisi (1, 6, atau 12 bulan).' },
    lateMonth: { term: 'Telat Bayar', text: 'Berapa bulan pembayaran terlambat. Komisi dipotong 10% per bulan (maks. 50%), kecuali invoice sudah disetujui.' },
    commission: { term: 'Komisi', text: 'Dasar komisi × persentase = komisi yang diterima.' },
    activity: { term: 'Pencapaian New', text: 'Jumlah pemasangan baru setelah dikurangi churn. Angka ini yang menentukan target, bonus, dan rate recurring.' },
    bonusBulanan: { term: 'Bonus Bulanan', text: 'Bonus bila pencapaian New mencapai 15 / 17 / 20 (untuk target 12): Rp 500rb / 1jt / 1,5jt.' },
    bonusKelebihanService: { term: 'Bonus Kelebihan Service', text: 'Menggantikan Bonus Bulanan bila pencapaian melebihi 20: Rp 1,5jt + Rp 150rb per service tambahan.' },
    consistencyBonus: { term: 'Bonus Konsistensi', text: 'Bonus yang diberikan manual oleh admin untuk periode ini.' },
    teamSize: { term: 'Jumlah AM', text: 'Semua anggota tim termasuk Probation. Menentukan threshold target: makin besar tim, makin ringan targetnya (1 AM = 120% … 10+ AM = 85%).' },
    baseTarget: { term: 'Target Dasar', text: 'Jumlah target aktivitas semua anggota Permanent (default 12 per orang). Anggota Probation tidak menambah target.' },
    finalTarget: { term: 'Target Akhir', text: 'Target Dasar × threshold sesuai jumlah AM, dibulatkan. Tim harus mencapai angka ini agar manager berstatus Capai Target.' },
    teamAchievement: { term: 'Capaian Tim', text: 'Total pencapaian New tim ÷ Target Dasar. Menentukan persentase Overriding New: ≥150% → 60%, ≥125% → 50%, ≥100% → 40%, ≥50% → 25%, di bawahnya 0%.' },
    overrideNew: { term: 'Overriding New', text: 'Bagian manager dari total komisi New seluruh anggota tim, sesuai persentase Capaian Tim.' },
    overrideRecurring: { term: 'Overriding Recurring', text: 'Persentase dari total subscription recurring tim: 0.90% bila Capai Target, 0.50% bila tidak.' },
    personalSales: { term: 'Penjualan Pribadi', text: 'Komisi dari penjualan atas nama manager sendiri. Aturannya sama seperti sales, tapi status capai target mengikuti capaian tim.' },
    cro: { term: 'Customer Relation Officer', text: 'Invoice recurring tanpa sales yang dikreditkan ke manager. Ikut dihitung ke Overriding Recurring, tidak ke komisi pribadi.' }
} as const

export type GlossaryKey = keyof typeof GLOSSARY

export const useGlossary = () => {
    const explain = (key: GlossaryKey) => GLOSSARY[key].text
    const entries = (keys?: GlossaryKey[]) => (keys ?? (Object.keys(GLOSSARY) as GlossaryKey[])).map(k => GLOSSARY[k])
    return { explain, entries }
}
