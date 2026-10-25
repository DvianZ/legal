/**
 * data.js - Basis Data & Konfigurasi LegalIn UMKM
 * Berisi aturan hukum, daftar konsultan, paket legalitas,
 * direktori KBLI OSS, template kontrak, dan data demo siap pakai.
 */

// Kunci penyimpanan localStorage
const STORAGE_KEY = "legalin_v2";

// Data Awal Demo Usaha
const INITIAL_DEMO_DATA = {
  user: {
    biz: "Dapur Sambal Bu Sari",
    owner: "Siti Rahmawati",
    phone: "0812-3456-7890",
    city: "Solo",
    type: "kuliner",
    staff: "y",
    online: "y",
    partner: "y"
  },
  biz: {
    type: "kuliner",
    staff: "y",
    online: "y",
    partner: "y"
  },
  done: {
    nib: true,
    npwp: true,
    pirt: false,
    halal: false,
    merek: false,
    kerja: true,
    bpjs: false,
    tnc: true,
    mitra: false
  },
  docs: [
    {
      id: 101,
      type: 0,
      name: "KTP Pemilik Usaha",
      exp: "",
      file: "ktp-siti-rahmawati.jpg",
      added: "2026-09-10"
    },
    {
      id: 102,
      type: 1,
      name: "NPWP Usaha",
      exp: "",
      file: "npwp-dapur-sambal.pdf",
      added: "2026-09-12"
    },
    {
      id: 103,
      type: 2,
      name: "NIB (Nomor Induk Berusaha)",
      exp: "",
      file: "nib-oss-rba.pdf",
      added: "2026-09-15"
    },
    {
      id: 104,
      type: 3,
      name: "SPP-IRT (P-IRT Dinas Kesehatan)",
      exp: "2026-11-20", // Mendekati kadaluwarsa untuk demo pengingat
      file: "spp-irt-sambal.pdf",
      added: "2025-11-20"
    },
    {
      id: 105,
      type: 4,
      name: "Sertifikat Halal BPJPH",
      exp: "2029-08-15",
      file: "sertifikat-halal.pdf",
      added: "2025-08-15"
    },
    {
      id: 106,
      type: 6,
      name: "Kontrak Kerja Karyawan Produksi",
      exp: "2027-01-01",
      file: "spk-karyawan-2026.pdf",
      added: "2026-01-02"
    }
  ],
  rem: [
    {
      id: 201,
      t: "Perpanjangan Izin Edar P-IRT di Dinkes Solo",
      d: "2026-11-20",
      done: false
    },
    {
      id: 202,
      t: "Lapor SPT Masa PPh Final 0,5% bulan ini",
      d: "2026-11-15",
      done: false
    }
  ],
  lead: 30,
  ch: ["app", "wa"],
  sessions: [
    {
      id: "SES-DEMO-01",
      title: "Sesi dengan Rina Wulandari, S.H.",
      who: "Rina Wulandari, S.H.",
      topic: "Merek dan HAKI",
      d: "2026-10-28",
      slot: "11.00",
      fmt: "Chat",
      st: "akan",
      pr: 150000,
      trx: "LGI-98342100",
      i: 0,
      msgs: [
        ["k", "Halo Bu Siti, saya Rina Wulandari, S.H. dari Solo. Terkait pendaftaran merek 'Dapur Sambal Bu Sari' di kelas 30 (bumbu & sambal), apakah logonya sudah final?"],
        ["u", "Halo Bu Rina, iya logo dan nama sudah siap. Apakah perlu cek pangkalan data DJKI dulu?"],
        ["k", "Betul sekali, kita akan lakukan penelusuran kemiripan fonetik dan visual dulu agar terhindar dari penolakan DJKI."]
      ]
    }
  ],
  order: null,
  diag: {
    s: 72,
    areas: {
      Pemasaran: 80,
      Keuangan: 65,
      Operasional: 70,
      Legalitas: 75
    }
  },
  mc: { age: true, rek: true, cat: true, slik: true },
  hl: { "0_0": true, "0_1": true, "0_2": true, "0_3": true },
  apiKey: "",
  cons: false
};

// Pertanyaan Wizard Cek Izin
const LEGAL_QUESTIONS = [
  {
    k: "type",
    q: "Usaha kamu bergerak di bidang apa?",
    o: [
      ["kuliner", "Makanan dan Minuman (Kuliner / F&B)"],
      ["kosmetik", "Skincare, Kosmetik, atau Herbal"],
      ["fashion", "Fashion, Pakaian, atau Aksesoris"],
      ["jasa", "Jasa (Salon, Bengkel, Klinik, Laundry, dll.)"],
      ["dist", "Distributor, Toko Kelontong, atau Reseller"]
    ]
  },
  {
    k: "staff",
    q: "Apakah usahamu sudah mempekerjakan karyawan?",
    o: [
      ["y", "Ya, ada karyawan tetap / lepas"],
      ["n", "Belum, masih dikelola sendiri / keluarga"]
    ]
  },
  {
    k: "online",
    q: "Apakah kamu berjualan secara daring (online)?",
    o: [
      ["y", "Ya, lewat Marketplace, Medsos, atau Website"],
      ["n", "Tidak, hanya berjualan di toko fisik / offline"]
    ]
  },
  {
    k: "partner",
    q: "Apakah kamu membuka atau menjalin kemitraan / waralaba?",
    o: [
      ["y", "Ya, ada sistem kemitraan, reseller, atau franchise"],
      ["n", "Tidak ada kemitraan"]
    ]
  }
];

// Generator Aturan Izin Berdasarkan Profil
function generateLegalRules(biz) {
  const rules = [
    {
      id: "nib",
      n: "NIB (Nomor Induk Berusaha)",
      w: 1,
      agency: "OSS RBA - Kementerian Investasi / BKPM",
      d: "KTP, NPWP, dan kode KBLI. NIB berlaku sebagai identitas usaha, TDP, dan hak akses kepabeanan."
    },
    {
      id: "npwp",
      n: "NPWP Usaha / Badan",
      w: 1,
      agency: "Direktorat Jenderal Pajak (DJP)",
      d: "Identitas wajib pajak untuk pelaporan omzet dan PPh Final 0,5%."
    }
  ];

  if (biz.type === "kuliner") {
    rules.push(
      {
        id: "pirt",
        n: "SPP-IRT (Pangan Industri Rumah Tangga)",
        w: 1,
        agency: "Dinas Kesehatan Kabupaten / Kota",
        d: "Wajib untuk pangan olahan kering/rumahan. Memerlukan sertifikat PKP (Penyuluhan Keamanan Pangan) dan uji sarana."
      },
      {
        id: "halal",
        n: "Sertifikat Halal",
        w: 1,
        agency: "BPJPH Kementerian Agama",
        d: "Wajib untuk semua produk makanan & minuman. Bisa melalui jalur Self-Declare (gratis untuk mikro) atau Reguler."
      }
    );
  }

  if (biz.type === "kosmetik") {
    rules.push(
      {
        id: "bpom",
        n: "Izin Edar / Notifikasi Kosmetik BPOM",
        w: 1,
        agency: "Badan Pengawas Obat dan Makanan (BPOM)",
        d: "Wajib sebelum produk diedarkan ke publik. Memerlukan sertifikat CPKB pabrik atau kontrak maklon resmi."
      },
      {
        id: "halal",
        n: "Sertifikat Halal Kosmetik",
        w: 1,
        agency: "BPJPH Kementerian Agama",
        d: "Wajib bertahap untuk produk kosmetik dan perawatan tubuh."
      },
      {
        id: "maklon",
        n: "Perjanjian Kontrak Maklon",
        w: 1,
        agency: "Dokumen Hukum Perdata",
        d: "Perjanjian mengikat dengan pabrik maklon mengenai kerahasiaan formula, minimum order, dan hak atas merek."
      }
    );
  }

  if (biz.type === "fashion" || biz.type === "kosmetik" || biz.type === "kuliner") {
    rules.push({
      id: "merek",
      n: "Pendaftaran Merek & Hak Cipta (HAKI)",
      w: 0,
      agency: "DJKI Kementerian Hukum dan HAM",
      d: "Melindungi nama brand dan logo dari pembajakan. Berlaku 10 tahun dan dapat diperpanjang."
    });
  }

  if (biz.type === "jasa") {
    rules.push({
      id: "tempat",
      n: "Kesesuaian Tata Ruang (KKPR)",
      w: 1,
      agency: "Dinas Tata Ruang / ATR BPN",
      d: "Memastikan lokasi fisik operasional usaha sesuai peruntukan zona daerah."
    });
  }

  if (biz.type === "dist") {
    rules.push({
      id: "dist",
      n: "Perjanjian Distribusi & Keagenan",
      w: 1,
      agency: "Kementerian Perdagangan / Dokumen Perdata",
      d: "Mengatur hak wilayah edar, proteksi harga eceran terendah (HET), dan retur produk."
    });
  }

  if (biz.staff === "y") {
    rules.push(
      {
        id: "kerja",
        n: "Perjanjian Kerja (PKWT / PKWTT)",
        w: 1,
        agency: "Sesuai UU Ketenagakerjaan",
        d: "Surat perjanjian kerja tertulis berisi hak upah, jam kerja, masa kerja, dan uang kompensasi."
      },
      {
        id: "bpjs",
        n: "BPJS Ketenagakerjaan & Kesehatan",
        w: 1,
        agency: "BPJS Ketenagakerjaan & BPJS Kesehatan",
        d: "Perlindungan jaminan kecelakaan kerja (JKK), jaminan kematian (JKM), dan jaminan hari tua bagi karyawan."
      }
    );
  }

  if (biz.online === "y") {
    rules.push({
      id: "tnc",
      n: "Syarat & Ketentuan serta Kebijakan Privasi",
      w: 0,
      agency: "Kepatuhan UU ITE & UU PDP",
      d: "Klausul hukum di website/marketplace untuk melindungi penjual dari sengketa transaksi dan mengatur perlindungan data pembeli."
    });
  }

  if (biz.partner === "y") {
    rules.push(
      {
        id: "mitra",
        n: "Perjanjian Kemitraan / Franchise",
        w: 1,
        agency: "Dokumen Perdata Mengikat",
        d: "Klausul bagi hasil, hak penggunaan nama merek, SOP rahasia dagang, serta klausul terminasi kemitraan."
      },
      {
        id: "stpw",
        n: "STPW (Surat Tanda Pendaftaran Waralaba)",
        w: 0,
        agency: "Kementerian Perdagangan",
        d: "Wajib jika usaha sudah memenuhi kriteria waralaba resmi (punya prospektus dan terbukti menguntungkan min. 5 tahun)."
      }
    );
  }

  return rules;
}

// Database Mini KBLI OSS RBA 2020 Terpopuler untuk UMKM
const KBLI_DATABASE = [
  {
    code: "56101",
    name: "Restoran dan Rumah Makan",
    cat: "Kuliner",
    risk: "Menengah Rendah",
    desc: "Penyediaan jasa makanan dan minuman dengan tempat duduk, pelayanan makan di tempat.",
    req: "NIB, Sertifikat Standar, Sertifikat Halal, SPP-PIRT (jika ada kemasan)."
  },
  {
    code: "56102",
    name: "Warung Makan dan Kedai Makan",
    cat: "Kuliner",
    risk: "Rendah",
    desc: "Penyediaan makanan sederhana seperti warteg, kedai mie, soto, nasi uduk.",
    req: "NIB (berlaku langsung sebagai izin edar dan operasional)."
  },
  {
    code: "56303",
    name: "Kedai Kopi (Coffee Shop) & Minuman",
    cat: "Kuliner",
    risk: "Rendah",
    desc: "Penjualan aneka minuman kopi, boba, jus buah dengan fasilitas minum di tempat.",
    req: "NIB, Sertifikat Halal."
  },
  {
    code: "10792",
    name: "Industri Keripik, Kerupuk, Peyek & Sejenisnya",
    cat: "Kuliner",
    risk: "Menengah Rendah",
    desc: "Pembuatan aneka keripik tempe, singkong, pisang, dan camilan kering rumahan.",
    req: "NIB, SPP-IRT dari Dinas Kesehatan, Sertifikat Halal BPJPH."
  },
  {
    code: "10710",
    name: "Industri Produk Roti dan Kue",
    cat: "Kuliner",
    risk: "Menengah Rendah",
    desc: "Pembuatan aneka roti manis, kue kering, pastry rumahan dan katering kue.",
    req: "NIB, SPP-IRT Dinas Kesehatan, Sertifikat Halal."
  },
  {
    code: "20231",
    name: "Industri Kosmetik Termasuk Pasta Gigi",
    cat: "Kosmetik",
    risk: "Menengah Tinggi",
    desc: "Pembuatan sediaan kosmetik, skincare, sabun kecantikan, lotion, serum.",
    req: "NIB, Sertifikat Pemenuhan CPKB, Notifikasi BPOM per varian produk."
  },
  {
    code: "47725",
    name: "Perdagangan Eceran Kosmetik",
    cat: "Kosmetik",
    risk: "Rendah",
    desc: "Toko dan reseller produk kosmetik, skincare, parfum eceran.",
    req: "NIB, pastikan produk yang dijual sudah memiliki nomor notifikasi BPOM."
  },
  {
    code: "14111",
    name: "Industri Pakaian Jadi (Konveksi)",
    cat: "Fashion",
    risk: "Rendah",
    desc: "Pembuatan pakaian jadi wanita, pria, anak-anak, seragam, dan busana muslim.",
    req: "NIB, pendaftaran Merek DJKI sangat disarankan."
  },
  {
    code: "47711",
    name: "Perdagangan Eceran Pakaian",
    cat: "Fashion",
    risk: "Rendah",
    desc: "Butik, toko pakaian distro, toko busana online maupun offline.",
    req: "NIB, pendaftaran Merek toko/brand ke DJKI."
  },
  {
    code: "47911",
    name: "Perdagangan Eceran Melalui Media (Online / Marketplace)",
    cat: "Online",
    risk: "Rendah",
    desc: "Penjualan aneka barang lewat internet, media sosial, e-commerce, marketplace.",
    req: "NIB, Syarat & Ketentuan Transaksi (Terms & Privacy)."
  },
  {
    code: "96112",
    name: "Aktivitas Salon Kecantikan & Barbershop",
    cat: "Jasa",
    risk: "Rendah",
    desc: "Pemotongan rambut, penataan, perawatan wajah non-medis, spa kaki/tangan.",
    req: "NIB, Sertifikat Standar sanitasi lingkungan."
  },
  {
    code: "96200",
    name: "Aktivitas Pencucian dan Pembersihan (Laundry)",
    cat: "Jasa",
    risk: "Rendah",
    desc: "Jasa binatu, cuci kiloan, dry clean pakaian dan karpet.",
    req: "NIB, izin pengelolaan limbah sederhana lingkungan."
  },
  {
    code: "45201",
    name: "Reparasi dan Perawatan Mobil & Sepeda Motor",
    cat: "Jasa",
    risk: "Menengah Rendah",
    desc: "Bengkel servis motor, ganti oli, tune up, cuci kendaraan bermotor.",
    req: "NIB, persetujuan kesesuaian lokasi (KKPR) dan SPPL."
  },
  {
    code: "46312",
    name: "Perdagangan Besar Bahan Makanan dan Minuman",
    cat: "Distributor",
    risk: "Rendah",
    desc: "Distributor atau agen grosir sembako, bahan kue, minuman kemasan.",
    req: "NIB, Perjanjian Distribusi resmi dengan prinsipal."
  }
];

// Daftar Konsultan Hukum & Bisnis
const CONSULTANTS = [
  {
    id: 1,
    name: "Rina Wulandari, S.H.",
    title: "Advokat & Konsultan Regulasi Usaha",
    city: "Solo",
    spec: "Perizinan OSS, NIB, & SPP-IRT",
    rating: 4.9,
    reviewsCount: 142,
    rate: 150000,
    type: "h",
    bio: "Berpengalaman lebih dari 8 tahun mendampingi ratusan UMKM Solo Raya dalam legalitas OSS, izin edar P-IRT, dan kepatuhan hukum usaha mikro.",
    topics: ["NIB dan OSS-RBA", "SPP-IRT dan Sertifikasi Halal", "Sengketa Usaha Mikro"]
  },
  {
    id: 2,
    name: "Bagas Pratama, S.H., M.Kn.",
    title: "Konsultan Hukum Korporasi & Notariat",
    city: "Solo",
    spec: "PT Perorangan & Kontrak Kemitraan",
    rating: 4.8,
    reviewsCount: 98,
    rate: 250000,
    type: "h",
    bio: "Spesialis pendirian PT Perorangan, draf perjanjian waralaba/franchise, dan pengikatan modal ventura lokal.",
    topics: ["Pendirian PT Perorangan", "Perjanjian Kemitraan & Waralaba", "Kontrak Kerja Karyawan"]
  },
  {
    id: 3,
    name: "Dewi Anggraini, S.H.",
    title: "Konsultan Kekayaan Intelektual Terdaftar",
    city: "Semarang",
    spec: "Merek Dagang, Hak Cipta, & HAKI",
    rating: 4.9,
    reviewsCount: 215,
    rate: 200000,
    type: "h",
    bio: "Membantu UMKM mendaftarkan merek ke DJKI, penelusuran kelas barang, serta pendampingan sanggahan jika merek terancam ditolak.",
    topics: ["Penelusuran Merek DJKI", "Sanggahan & Oposisi Merek", "Hak Cipta Desain Kemasan"]
  },
  {
    id: 4,
    name: "Siti Aminah, S.H.",
    title: "Pendamping Proses Produk Halal & Perizinan",
    city: "Yogyakarta",
    spec: "Halal BPJPH & Izin Dinkes",
    rating: 4.8,
    reviewsCount: 88,
    rate: 130000,
    type: "h",
    bio: "Fasilitator resmi pendamping halal mikro, berpengalaman membimbing audit kebersihan dapur dan kelengkapan dokumen bahan baku.",
    topics: ["Halal Self Declare", "Halal Reguler & Uji Laboratorium", "Syarat Higiene Sanitasi Dinkes"]
  },
  {
    id: 5,
    name: "Andre Kusuma, S.H., LL.M.",
    title: "Advokat Kontrak Bisnis & Regulasi Farmasi",
    city: "Jakarta",
    spec: "Kontrak Maklon & Izin BPOM",
    rating: 4.9,
    reviewsCount: 167,
    rate: 350000,
    type: "h",
    bio: "Fokus pada industri kecantikan dan wellness, draf kontrak maklon, perlindungan hak formula skincare, dan perizinan BPOM.",
    topics: ["Perjanjian Maklon Skincare", "Notifikasi Kosmetik BPOM", "Perjanjian Kerahasiaan (NDA)"]
  },
  {
    id: 6,
    name: "Fajar Nugroho, M.M.",
    title: "Konsultan Strategi Bisnis & Kemitraan",
    city: "Semarang",
    spec: "Ekspansi Cabang & Model Bisnis",
    rating: 4.8,
    reviewsCount: 120,
    rate: 180000,
    type: "b",
    bio: "Mantan manajer operasional F&B nasional, kini membantu brand lokal menyusun SOP kemitraan dan membuka cabang baru.",
    topics: ["Skema Kemitraan & Bagi Hasil", "SOP Operasional Toko", "Strategi Buka Cabang Baru"]
  },
  {
    id: 7,
    name: "Maya Lestari, M.M.",
    title: "Praktisi Pemasaran Digital & E-Commerce",
    city: "Solo",
    spec: "Optimasi Penjualan & Iklan Medsos",
    rating: 4.9,
    reviewsCount: 174,
    rate: 140000,
    type: "b",
    bio: "Membantu UMKM meningkatkan omzet lewat TikTok Shop, Shopee, dan strategi retensi pelanggan organik.",
    topics: ["Optimasi Penjualan Online", "Strategi Iklan Berbayar", "Branding & Positioning Produk"]
  },
  {
    id: 8,
    name: "Hendra Wijaya, CFP",
    title: "Perencana Keuangan Bisnis & Analis Modal",
    city: "Jakarta",
    spec: "Keuangan, HPP, & Akses Modal Bank",
    rating: 4.9,
    reviewsCount: 195,
    rate: 300000,
    type: "b",
    bio: "Membantu UMKM menghitung harga pokok produksi (HPP) dengan akurat, merapikan laporan keuangan untuk pengajuan KUR dan pembiayaan.",
    topics: ["Penetapan Harga Jual & HPP", "Pemisahan Keuangan Pribadi & Toko", "Persiapan Pengajuan KUR Bank"]
  },
  {
    id: 9,
    name: "Laras Ayu, M.M.",
    title: "Konsultan Manajemen Operasional & SDM",
    city: "Yogyakarta",
    spec: "Sistem Penggajian & Produktivitas Tim",
    rating: 4.7,
    reviewsCount: 76,
    rate: 130000,
    type: "b",
    bio: "Spesialis merancang struktur gaji, insentif target penjualan karyawan, dan budaya kerja toko ritel.",
    topics: ["Struktur Gaji & Bonus Karyawan", "SOP Pelayanan Pelanggan", "Rekrutmen Pegawai UMKM"]
  }
];

// Paket Layanan Pengurusan Resmi (Escrow Milestone)
const PACKAGES = [
  {
    id: "dasar",
    n: "Paket Usaha Resmi",
    p: 450000,
    provider: "Griya Legalitas Usaha (Solo)",
    dur: "3-5 hari kerja",
    t: "NIB OSS RBA, penentuan KBLI, dan NPWP Badan/Usaha",
    inc: [
      "Pendaftaran akun dan penerbitan NIB lewat OSS-RBA",
      "Penentuan kode KBLI 5 digit yang tepat agar izin sesuai",
      "Pendaftaran NPWP usaha terintegrasi",
      "Panduan kewajiban perpajakan awal"
    ],
    m: ["Pemeriksaan kelengkapan KTP & data usaha", "Penerbitan NIB OSS-RBA resmi", "Penerbitan NPWP & penyerahan berkas"],
    doc: ["KTP Pemilik", "NPWP Pribadi", "Alamat & Foto Lokasi Usaha", "Deskripsi Kegiatan Usaha"]
  },
  {
    id: "kul",
    n: "Paket Lengkap Kuliner Rumahan",
    p: 1250000,
    provider: "Dapur Legal Nusantara (Solo)",
    dur: "3-6 minggu",
    t: "NIB, Izin Edar SPP-PIRT Dinkes, dan Sertifikat Halal",
    inc: [
      "Pengurusan NIB OSS",
      "Pendampingan uji sarana dan penyuluhan PKP Dinkes",
      "Penerbitan nomor SPP-PIRT 15 digit",
      "Pengajuan sertifikasi halal jalur Self-Declare/Reguler",
      "Konsultasi desain label kemasan sesuai ketentuan BPOM"
    ],
    m: ["NIB terbit", "Penyuluhan Dinkes & SPP-PIRT terbit", "Dokumen halal diverifikasi BPJPH", "Sertifikat Halal terbit"],
    doc: ["KTP & NPWP", "Daftar Bahan Baku & Resep", "Foto Dapur & Kemasan", "Sertifikat PKP (bila ada)"]
  },
  {
    id: "merek",
    n: "Paket Proteksi Merek Dagang",
    p: 1850000,
    provider: "Rumah Merek Jateng (Semarang)",
    dur: "2-4 hari kerja s.d. bukti terbit",
    t: "Penelusuran kemiripan, penentuan kelas DJKI, dan pendaftaran resmi",
    inc: [
      "Analisa risiko penolakan fonetik & visual",
      "Pemilihan kelas barang/jasa (Nice Classification)",
      "Pembayaran biaya resmi PNBP Kementerian Hukum & HAM",
      "Penerbitan Bukti Penerimaan Permohonan (BPP) resmi",
      "Monitoring masa pengumuman berita resmi merek (BRM)"
    ],
    m: ["Analisa & penelusuran kemiripan selesai", "Pembayaran PNBP DJKI berhasil", "Bukti pendaftaran (BPP) terbit"],
    doc: ["KTP Pemilik Brand", "File Logo / Nama Merek Resolusi Tinggi", "Daftar Barang/Jasa yang Dijual"]
  },
  {
    id: "skin",
    n: "Paket Siap Maklon Skincare",
    p: 3500000,
    provider: "Kantor Hukum Nusantara Mandiri (Jakarta)",
    dur: "4-8 minggu",
    t: "PT Perorangan, NIB, Kontrak Maklon, dan Pendaftaran Merek",
    inc: [
      "Pendirian PT Perorangan di Kemenkumham",
      "Draf perjanjian maklon melindungi formula dan batasan MOQ",
      "Pengajuan pendaftaran merek kelas 03 kosmetik",
      "Konsultasi persyaratan notifikasi BPOM pabrik maklon"
    ],
    m: ["Sertifikat PT Perorangan & NIB terbit", "Draf kontrak maklon selesai & disetujui", "Pendaftaran merek diajukan ke DJKI"],
    doc: ["KTP & NPWP Pendiri", "Profil Pabrik Maklon Rekanan", "Konsep Brand & Daftar Produk"]
  },
  {
    id: "fran",
    n: "Paket Siap Buka Kemitraan & Franchise",
    p: 5500000,
    provider: "Lintang Konsultan Bisnis (Yogyakarta)",
    dur: "4-7 minggu",
    t: "PT, Hak Merek, Perjanjian Kemitraan, & Kontrak Karyawan",
    inc: [
      "Legalitas badan usaha PT dan merek dagang",
      "Penyusunan Perjanjian Kemitraan komprehensif (Bagi hasil & Royalti)",
      "Perjanjian Kerahasiaan Resep (NDA)",
      "Standard format kontrak kerja karyawan cabang"
    ],
    m: ["Badan usaha & merek terdaftar", "Draf perjanjian kemitraan selesai", "Dokumen legal franchise siap operasional"],
    doc: ["Identitas Pemilik", "SOP Usaha Inti", "Perhitungan Finansial Kemitraan"]
  }
];

// Template Dokumen Hukum UMKM
const CONTRACT_TEMPLATES = [
  {
    id: "reseller",
    title: "Perjanjian Reseller & Keagenan",
    desc: "Perjanjian antara produsen/pemilik brand dengan pihak reseller untuk menjaga harga pasar dan target penjualan.",
    fields: [
      { key: "p1_name", label: "Nama Produsen / Pemilik Usaha", ph: "Contoh: Siti Rahmawati (Dapur Sambal Bu Sari)" },
      { key: "p2_name", label: "Nama Reseller / Agen", ph: "Contoh: Budi Santoso" },
      { key: "area", label: "Wilayah Penjualan / Distribusi", ph: "Contoh: Eks Karesidenan Surakarta & Online" },
      { key: "min_order", label: "Minimal Pembelian per Bulan (Rp)", ph: "Contoh: Rp 3.000.000" },
      { key: "het", label: "Ketentuan Harga Eceran Terendah (HET)", ph: "Contoh: Tidak boleh menjual di bawah Rp 25.000 per botol" }
    ],
    generate: function (d) {
      return `SURAT PERJANJIAN RESELLER DAN DISTRIBUSI PRODUK
Nomor: LGI-AGR/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}

Pada hari ini, ${new Date().toLocaleDateString("id-ID", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}, telah disepakati perjanjian kerja sama antara:

I. PIHAK PERTAMA (PRODUSEN / PEMILIK MERK):
Nama: ${d.p1_name || "..................................................."}
Bertindak selaku pemilik usaha sah dan penyedia produk.

II. PIHAK KEDUA (RESELLER / AGEN):
Nama: ${d.p2_name || "..................................................."}
Bertindak selaku mitra penjualan mandiri.

Kedua belah pihak bersepakat atas pasal-pasal sebagai berikut:

PASAL 1: WILAYAH DAN HAK PENJUALAN
Pihak Pertama memberikan hak kepada Pihak Kedua untuk mendistribusikan produk resmi pada area: ${d.area || "Seluruh Indonesia secara offline dan online"}.

PASAL 2: HARGA DAN DISKON
1. Pihak Kedua berhak mendapatkan harga khusus reseller sesuai ketentuan Pihak Pertama.
2. Pihak Kedua WAJIB mematuhi Harga Eceran Terendah (HET): ${d.het || "Sesuai pricelist resmi"}. Pelanggaran atas HET dapat berakibat pemutusan kemitraan sepihak.

PASAL 3: TARGET DAN PEMESANAN MINIMAL
Pihak Kedua menyanggupi komitmen pembelian minimal sebesar: ${d.min_order || "Sesuai kesepakatan"} per bulan kalender.

PASAL 4: JAMINAN KUALITAS & RETUR
Pihak Pertama menjamin produk dalam keadaan baik dan memenuhi standar legalitas pangan/izin edar. Retur produk cacat produksi dilayani maksimal 3 (tiga) hari kerja sejak barang diterima.

PASAL 5: JANGKA WAKTU
Perjanjian ini berlaku selama 1 (satu) tahun terhitung sejak tanggal ditandatangani dan dapat diperpanjang atas kesepakatan tertulis kedua pihak.

Demikian perjanjian ini dibuat dengan kesadaran penuh tanpa paksaan pihak mana pun.

PIHAK PERTAMA,                                 PIHAK KEDUA,

( ${d.p1_name || "..................."} )                 ( ${d.p2_name || "..................."} )`;
    }
  },
  {
    id: "kerja",
    title: "Kontrak Kerja Karyawan (PKWT)",
    desc: "Perjanjian kerja waktu tertentu untuk staf toko, admin, koki, atau kurir sesuai regulasi ketenagakerjaan UMKM.",
    fields: [
      { key: "p1_name", label: "Nama Pemberi Kerja / Usaha", ph: "Contoh: Dapur Sambal Bu Sari" },
      { key: "p2_name", label: "Nama Lengkap Karyawan", ph: "Contoh: Ahmad Fauzi" },
      { key: "role", label: "Jabatan / Posisi Kerja", ph: "Contoh: Staf Produksi & Pengemasan" },
      { key: "salary", label: "Gaji Pokok & Tunjangan (Rp)", ph: "Contoh: Rp 2.300.000 / bulan" },
      { key: "duration", label: "Masa Kontrak", ph: "Contoh: 12 (dua belas) bulan" }
    ],
    generate: function (d) {
      return `SURAT PERJANJIAN KERJA WAKTU TERTENTU (PKWT)
Nomor: PKWT/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}

Yang bertanda tangan di bawah ini:
1. PEMBERI KERJA: ${d.p1_name || "..................................................."}
2. PEKERJA: ${d.p2_name || "..................................................."}

Sepakat mengikatkan diri dalam Perjanjian Kerja dengan ketentuan:

PASAL 1: TUGAS DAN PENEMPATAN
Pekerja ditugaskan sebagai: ${d.role || "Staf Operasional"} dengan waktu kerja 6 hari dalam seminggu, 7-8 jam per hari.

PASAL 2: UPAH DAN PEMBAYARAN
Pemberi Kerja membayarkan upah sebesar: ${d.salary || "Sesuai UMK yang disepakati"} setiap akhir bulan kalender.

PASAL 3: MASA BERLAKU KONTRAK
Kontrak kerja ini berlaku selama: ${d.duration || "1 tahun"} terhitung sejak ditandatangani.

PASAL 4: HAK DAN KEWAJIBAN
1. Pekerja wajib menjaga rahasia resep, formula, serta tata cara operasional usaha.
2. Pemberi Kerja menjamin keselamatan kerja serta perlakuan yang manusiawi dan adil.

Dibuat rangkap dua bermeterai cukup dan memiliki kekuatan hukum yang sama.

PEMBERI KERJA,                                 PEKERJA,

( ${d.p1_name || "..................."} )                 ( ${d.p2_name || "..................."} )`;
    }
  },
  {
    id: "supplier",
    title: "Perjanjian Pasokan Bahan Baku (Supplier)",
    desc: "Perjanjian jaminan ketersediaan bahan, standar mutu, dan tempo pembayaran dengan pemasok bahan baku.",
    fields: [
      { key: "p1_name", label: "Nama Pembeli / UMKM", ph: "Contoh: Dapur Sambal Bu Sari" },
      { key: "p2_name", label: "Nama Pemasok / Supplier", ph: "Contoh: UD Tani Makmur Cabai Sejahtera" },
      { key: "goods", label: "Jenis Bahan yang Dipasok", ph: "Contoh: Cabai rawit merah segar kualitas grade A" },
      { key: "terms", label: "Syarat Pembayaran", ph: "Contoh: Tempo 14 hari setelah nota dan barang diterima" }
    ],
    generate: function (d) {
      return `SURAT PERJANJIAN PASOKAN BAHAN BAKU BERKALA
Nomor: SPB/${new Date().getFullYear()}/${Math.floor(100 + Math.random() * 900)}

ANTARA:
Pembeli: ${d.p1_name || "..................................................."}
Pemasok: ${d.p2_name || "..................................................."}

PASAL 1: OBJEK PASOKAN
Pemasok menyediakan secara rutin kepada Pembeli: ${d.goods || "Bahan baku pangan"}.

PASAL 2: STANDAR KUALITAS
Barang yang dipasok wajib segar, bebas zat berbahaya, dan telah memenuhi standar higienis. Barang yang tidak sesuai kriteria dapat ditolak tanpa ganti rugi biaya kirim.

PASAL 3: HARGA DAN SISTEM PEMBAYARAN
Sistem pembayaran yang disepakati: ${d.terms || "Tunai saat pengiriman atau tempo 14 hari"}.

Perjanjian berlaku selama 1 (satu) tahun.

PIHAK PEMBELI,                                 PIHAK PEMASOK,

( ${d.p1_name || "..................."} )                 ( ${d.p2_name || "..................."} )`;
    }
  }
];

// Jenis Dokumen Brankas
const DOCUMENT_TYPES = [
  ["ktp", "KTP Pemilik Usaha", "ID"],
  ["npwp", "NPWP Usaha / Pajak", "NP"],
  ["nib", "NIB (Nomor Induk Berusaha)", "NB"],
  ["pirt", "SPP-PIRT Dinas Kesehatan", "IR"],
  ["halal", "Sertifikat Halal BPJPH", "HL"],
  ["merek", "Sertifikat / Bukti Merek DJKI", "MK"],
  ["kontrak", "Perjanjian / Kontrak Bisnis", "KT"],
  ["lain", "Dokumen Legalitas Lainnya", "DL"]
];
