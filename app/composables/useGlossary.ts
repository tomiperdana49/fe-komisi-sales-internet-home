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
    period: {
        term: 'Periode Perhitungan',
        text: () => 'Satu periode komisi berjalan dari tanggal 26 bulan sebelumnya sampai tanggal 25. Invoice masuk periode menurut tanggal bayarnya; bila dibayar sampai tanggal 25 tetapi baru diinput finance tanggal 27 atau sesudahnya di bulan yang sama, invoice masuk periode berikutnya. Data diambil otomatis dari billing NIS setiap jam untuk periode berjalan dan periode sebelumnya.'
    },
    referralFee: {
        term: 'Biaya Referral',
        text: () => 'Fee untuk reseller atau perujuk pelanggan, dari spreadsheet reseller per cabang. Untuk tipe Cashback, Monthly, atau tanpa tipe, fee ini mengurangi dasar komisi invoice tersebut; tipe OTC tidak mengurangi dasar komisi.'
    },
    paidDate: {
        term: 'Tgl. Bayar',
        text: () => 'Tanggal transaksi pembayaran, yang menentukan periode komisi. Bila finance baru menginput pembayaran di hari lain, tanggal inputnya tampil di bawahnya. Pengecualian: dibayar sampai tgl 25 tetapi baru diinput tgl 27 ke atas di bulan invoice yang sama masuk periode berikutnya.'
    },
    activationDate: {
        term: 'Tgl. Aktif',
        text: () => 'Tanggal layanan pertama kali diaktivasi di NIS. Mulai periode Oktober 2026, komisi New/Prorate dihitung di periode yang lebih belakang antara tanggal bayar dan tanggal aktif: dibayar Oktober tetapi baru aktif November masuk November, dan layanan yang belum diaktivasi belum dihitung.'
    },
    periodClosed: {
        term: 'Periode Ditutup',
        text: () => 'Admin sudah menutup periode ini. Data tidak lagi ditarik ulang dari NIS, jadi angka komisi sudah final: pembayaran, churn, atau log call yang masuk belakangan tidak mengubahnya.'
    },
    new: {
        term: 'New',
        text: (r: Rules) => `Pemasangan baru yang sudah dibayar. Rate tergantung produk dan Lama Kontrak. Hanya produk yang ada di daftar rate Aturan Komisi yang dihitung; produk lain (mis. CBSHM, HOME30, HOME50, BOOSTER) tidak menghasilkan komisi New maupun pencapaian. Bila sales Permanent tidak capai target, komisi${r ? ` hanya dihitung dari ${pct(100 - r.penalties.missedTarget)} dasar komisi (potongan ${pct(r.penalties.missedTarget)})` : ' dipotong'}.`
    },
    recurring: {
        term: 'Recurring',
        text: (r: Rules) => {
            const excluded = r?.excludedRecurringCategories.length ? ` dan kategori ${r.excludedRecurringCategories.join(', ')}` : ''
            const rate = r
                ? `Rate ${pct(r.rates.recurringOnTarget)} (capai target / Probation) atau ${pct(r.rates.recurringMissedTarget)} (Permanent tidak capai target); Digital Business tetap ${pct(r.rates.digitalBusinessInternal)} Internal / ${pct(r.rates.digitalBusinessResell)} Resell.`
                : 'Rate-nya lebih tinggi bila sales capai target.'
            return `Tagihan rutin dari pelanggan yang sudah berjalan. ${rate} Recurring NusaSelecta${excluded} tidak mendapat komisi. Invoice berlabel Perpanjangan (kenaikan harga saat perpanjangan kontrak) juga dihitung di sini dan tidak menambah pencapaian New.`
        }
    },
    prorate: {
        term: 'Prorate',
        text: (r: Rules) => `Tagihan sebagian bulan (prorata) di awal berlangganan.${r ? ` Komisi flat ${pct(r.rates.prorate)}, tanpa potongan target.` : ''}`
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
        text: (r: Rules) => {
            const products = r ? r.products.filter(p => p.churn).flatMap(p => p.serviceIds).join(', ') : ''
            return `Layanan yang berhenti (status NA di NIS) dan dihitung churn bila semua syarat terpenuhi: produknya ${products ? `termasuk ${products}` : 'dicentang Churn di Aturan Komisi'}; berhenti paling lama 1 tahun sejak registrasi; alasan close di NIS berstatus Active to NA, Renewal, atau New Installation dengan alasan "Paid not yet to install"; pernah ditagih; dan belum lunas 12 bulan. Churn mengurangi Pencapaian New, MRC, dan komisi; potongannya dihitung seperti komisi New dengan rate saat capai target. Churn bisa dibebaskan oleh admin, atau lewat log call NIS berisi "Churn = false" dari approver.`
        }
    },
    closeReason: {
        term: 'Reason Close',
        text: () => 'Alasan close yang dipilih di NIS (data close terakhir layanan). Teks kecil di bawahnya adalah status layanan saat ditutup: New Installation, Active to NA, atau Renewal. Strip (-) berarti layanan ditutup sebelum ada kategori close di NIS.'
    },
    closeNote: {
        term: 'Alasan Berhenti',
        text: () => 'Catatan alasan berhenti yang ditulis saat layanan ditutup di NIS.'
    },
    activePeriod: {
        term: 'Masa Aktif',
        text: () => 'Lama layanan aktif, dari tanggal aktivasi sampai tanggal berhenti. Siklus tagihan (per 1, 6, atau 12 bulan) dipakai untuk menghitung nilai bulanan churn.'
    },
    lateWaived: {
        term: 'Dibebaskan',
        text: () => 'Potongan telat bayar invoice ini dihapus karena sudah disetujui admin di Summary > Invoice. Alasan, nama yang menyetujui, dan waktunya tampil di bawahnya.'
    },
    churnWaived: {
        term: 'Dibebaskan',
        text: () => 'Churn ini tidak memotong komisi maupun pencapaian. Dibebaskan oleh admin di Summary > Churn, atau otomatis dari log call NIS berisi "Churn = false" oleh approver. Catatan di bawahnya menunjukkan alasannya.'
    },
    subscription: {
        term: 'Subscription',
        text: () => 'Nilai invoice yang sudah dibayar pelanggan, diambil dari billing NIS. Dasar komisinya dikurangi referral fee dari spreadsheet reseller, kecuali referral bertipe OTC.'
    },
    baseCommission: {
        term: 'Dasar Komisi',
        text: (r: Rules) => r
            ? `Subscription dipotong Telat Bayar (${pct(r.penalties.latePerMonth)} per bulan dari subscription, maks. ${pct(r.penalties.lateMax)}), lalu dikurangi referral fee dan, khusus New untuk sales Permanent yang tidak capai target, potongan ${pct(r.penalties.missedTarget)}. Komisi = Dasar Komisi × persentase.`
            : 'Subscription dipotong Telat Bayar, lalu dikurangi referral fee, lalu potongan target (khusus New, sales Permanent). Komisi = Dasar Komisi × persentase.'
    },
    mrc: {
        term: 'MRC',
        text: () => 'Monthly Recurring Charge — nilai tagihan pelanggan per bulan.'
    },
    contractMonths: {
        term: 'Lama Kontrak',
        text: (r: Rules) => {
            const later = r ? [...new Set(r.products.filter(p => p.sixMonthRateFrom > 2).map(p => p.group.replace(/ (Basic\/Prime|Ultra)$/, '')))] : []
            const exception = later.length ? ` Pengecualian ${later.join(', ')}: rate 6 bulan baru berlaku mulai kontrak ${r!.products.find(p => p.sixMonthRateFrom > 2)!.sixMonthRateFrom} bulan; di bawahnya tetap rate 1 bulan.` : ''
            return `Jumlah bulan yang dibayar di invoice ini, menentukan rate komisi: kontrak tepat 1 bulan memakai rate 1 bulan, 2–11 bulan memakai rate 6 bulan, 12 bulan ke atas memakai rate 12 bulan.${exception}`
        }
    },
    lateMonth: {
        term: 'Telat Bayar',
        text: (r: Rules) => `Dihitung dari Tanggal Jatuh Tempo sampai tanggal transaksi pembayaran. Pembayaran sampai 1 bulan setelah jatuh tempo belum dihitung telat; setiap bulan lewat dari itu dihitung 1 bulan telat. Dasar komisi dipotong ${r ? `${pct(r.penalties.latePerMonth)} per bulan (maks. ${pct(r.penalties.lateMax)})` : 'per bulan keterlambatan'}, kecuali invoice sudah disetujui admin.`
    },
    commission: {
        term: 'Komisi',
        text: (r: Rules) => r
            ? `Dasar komisi × persentase = komisi yang diterima. Recurring: ${pct(r.rates.recurringOnTarget)} bila capai target (atau Probation), ${pct(r.rates.recurringMissedTarget)} bila tidak capai target (Digital Business tetap ${pct(r.rates.digitalBusinessInternal)} Internal / ${pct(r.rates.digitalBusinessResell)} Resell). Komisi New hanya dihitung dari ${pct(100 - r.penalties.missedTarget)} dasar komisi (potongan ${pct(r.penalties.missedTarget)}) bila sales Permanent tidak capai target.`
            : 'Dasar komisi × persentase = komisi yang diterima. Persentase Recurring lebih tinggi bila capai target; New dipotong bila sales Permanent tidak capai target.'
    },
    managerCommission: {
        term: 'Komisi (Penjualan Pribadi Manager)',
        text: (r: Rules) => r
            ? `Dasar komisi × persentase = komisi yang diterima. Persentase mengikuti status tim, bukan penjualan pribadi: Recurring ${pct(r.rates.recurringOnTarget)} bila tim capai Target Akhir, ${pct(r.rates.recurringMissedTarget)} bila tidak (Digital Business tetap ${pct(r.rates.digitalBusinessInternal)} Internal / ${pct(r.rates.digitalBusinessResell)} Resell). Komisi New hanya dihitung dari ${pct(100 - r.penalties.missedTarget)} dasar komisi (potongan ${pct(r.penalties.missedTarget)}) bila tim tidak capai Target Akhir.`
            : 'Dasar komisi × persentase = komisi yang diterima. Persentase mengikuti status tim: Recurring lebih tinggi dan New tidak dipotong bila tim capai Target Akhir.'
    },
    activity: {
        term: 'Pencapaian New',
        text: () => 'Jumlah pemasangan baru setelah dikurangi churn yang tidak dibebaskan. Angka ini yang menentukan status target, bonus, dan rate recurring. NusaSelecta dihitung per kelompok unit, bukan per layanan.'
    },
    newAchievement: {
        term: 'Pencapaian New per Produk',
        text: () => 'Jumlah pencapaian dari pemasangan baru. Home dan Nusafiber: 1 layanan = 1. NusaSelecta dihitung per kelompok: 3 unit Basic/Prime = 1, 2 unit Ultra = 1, sisa 2 Basic/Prime + 1 Ultra = 1; sisa unit lainnya tidak dihitung, tapi komisinya tetap dibayar.'
    },
    achievementStatus: {
        term: 'Status Pencapaian',
        text: (r: Rules) => {
            if (!r) return 'Ditentukan dari Pencapaian New setelah periode berakhir, dengan batas berbeda untuk Permanent dan Probation/Contract.'
            const a = r.achievement
            return `Ditentukan dari Pencapaian New setelah periode berakhir. Permanent: ≥${a.permanentBonus} Capai target Bonus, ≥${a.permanentOnTarget} Capai target, di bawah ${a.permanentSp1Below} SP1, selebihnya Tidak Capai target (batas Capai target bergeser bila AM punya target khusus). Probation/Contract: ≥${a.probationExcellent} Excellent, ≥${a.probationVeryGood} Very Good, ≥${a.probationAverage} Average, selebihnya Below Average.`
        }
    },
    bonusBulanan: {
        term: 'Bonus Bulanan',
        text: (r: Rules) => r
            ? `Bonus bila Pencapaian New mencapai ${r.bonus.tiers.map(t => t.at).join(' / ')}: ${r.bonus.tiers.map(t => rp(t.amount)).join(' / ')}. Untuk sales Permanent dengan target berbeda dari ${r.targets.permanent}, tiap tier bergeser sebanyak selisihnya; untuk Probation/Contract tier selalu tetap.`
            : 'Bonus tunai bila Pencapaian New mencapai tier tertentu.'
    },
    bonusKelebihanService: {
        term: 'Bonus Kelebihan Service',
        text: (r: Rules) => {
            const last = r?.bonus.tiers.at(-1)
            return r && last
                ? `Tambahan di atas Bonus Bulanan bila Pencapaian New melebihi ${last.at}: ${rp(r.bonus.excessPerUnit)} per service di atas batas itu. Batasnya bergeser untuk sales Permanent dengan target berbeda dari ${r.targets.permanent}; untuk Probation/Contract tetap.`
                : 'Tambahan di atas Bonus Bulanan bila pencapaian melebihi tier tertinggi: bonus per service di atas tier itu.'
        }
    },
    consistencyBonus: {
        term: 'Bonus Konsistensi',
        text: () => 'Bonus yang diberikan manual oleh admin untuk periode ini, nominalnya ditentukan admin. Tidak otomatis berulang ke bulan berikutnya.'
    },
    memberTotal: {
        term: 'Total Komisi Sales',
        text: () => 'Total yang diterima AM ini: komisi semua transaksi setelah potongan churn, ditambah Bonus Bulanan, Bonus Kelebihan Service, dan Bonus Konsistensi.'
    },
    teamSize: {
        term: 'Jumlah AM',
        text: (r: Rules) => {
            const t = r?.manager.teamThresholds
            const range = t && t.length ? ` (${t[0]!.teamSize} AM = ${pct(t[0]!.percent)} … ${t.at(-1)!.teamSize}+ AM = ${pct(t.at(-1)!.percent)})` : ''
            return `Semua anggota tim termasuk Probation yang sudah terdaftar status kepegawaiannya pada periode ini; yang belum terdaftar tidak dihitung sama sekali. Menentukan threshold target: makin besar tim, makin ringan targetnya${range}.`
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
            if (!r) return 'Total pencapaian New tim ÷ Target Akhir (sebelum Oktober 2026: ÷ Target Dasar). Menentukan persentase Overriding New.'
            const tiers = [...r.manager.newCommissionTiers].sort((a, b) => b.minAchievement - a.minAchievement)
            return `Total pencapaian New tim ÷ Target Akhir (sebelum Oktober 2026: ÷ Target Dasar). Menentukan persentase Overriding New: ${tiers.map(t => `≥${t.minAchievement}% → ${pct(t.rate)}`).join(', ')}, di bawahnya 0%.`
        }
    },
    overrideNew: {
        term: 'Overriding New',
        text: () => 'Bagian manager dari total komisi New, Prorate, dan Alat seluruh anggota tim, sesuai persentase Capaian Tim.'
    },
    overrideRecurring: {
        term: 'Overriding Recurring',
        text: (r: Rules) => r
            ? `Persentase dari total subscription recurring tim (setelah dikurangi referral fee dan potongan Telat Bayar; invoice Perpanjangan tidak ikut). Customer lama akses ${pct(r.manager.recurringOnTarget)} bila Capai Target, ${pct(r.manager.recurringMissedTarget)} bila tidak; Digital Business Internal & IP Public ${pct(r.manager.recurringDigitalBusinessInternalOnTarget)} / ${pct(r.manager.recurringDigitalBusinessInternalMissedTarget)}; Digital Business Resell ${pct(r.manager.recurringDigitalBusinessResellOnTarget)} / ${pct(r.manager.recurringDigitalBusinessResellMissedTarget)}.`
            : 'Persentase dari total subscription recurring tim; lebih tinggi bila tim Capai Target.'
    },
    personalSales: {
        term: 'Penjualan Pribadi',
        text: () => 'Komisi dari penjualan atas nama manager sendiri. Aturannya sama seperti sales, tapi status capai target mengikuti capaian tim. Penjualan pribadi tidak ikut dihitung ke Capaian Tim.'
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
