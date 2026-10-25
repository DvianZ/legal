/**
 * consultant.js - Modul Ruang Konsultasi Interaktif & Notulensi Resmi
 * Mengelola alur chat dengan konsultan manusia, skenario respons bertahap,
 * upload lampiran berkas, penerbitan notulensi resmi, dan eskalasi dari AI.
 */

class LegalInConsultantEngine {
  constructor() {
    // Skenario percakapan terarah berdasarkan topik
    this.scenarios = {
      "Merek dan HAKI": [
        "Halo! Terima kasih telah menjadwalkan sesi konsultasi Merek. Untuk memulai, apa nama merek yang ingin Anda lindungi dan apakah sudah memiliki desain logo tetap?",
        "Nama dan logo yang menarik. Apakah Anda sudah memeriksa apakah ada merek dengan ucapan atau ejaan mirip di pangkalan data DJKI?",
        "Bagus. Merek ini masuk ke kelas klasifikasi barang yang spesifik. Saya sarankan kita segera siapkan Surat Pernyataan UMK agar Anda mendapat diskon biaya resmi PNBP dari Rp 1,8 Juta menjadi Rp 500 Ribu. Anda bisa lampirkan draf logonya di sini untuk saya tinjau."
      ],
      "NIB dan izin usaha": [
        "Halo! Saya siap membantu kepatuhan perizinan usahamu. Apakah NIB usahamu saat ini sudah terbit lewat portal OSS RBA?",
        "Baik, saya catat. Kode KBLI apa yang saat ini tercantum di NIB, dan apakah semua kegiatan operasional toko Anda sudah tercover?",
        "Tepat sekali. Untuk izin edar turunan (seperti SPP-PIRT atau Sertifikasi Halal), pastikan data alamat sarana produksi di NIB sudah persis sesuai dengan lokasi fisik usaha Anda."
      ],
      "Kontrak dan kemitraan": [
        "Halo! Selamat datang di sesi konsultasi kemitraan. Model kerja sama apa yang sedang Anda rancang? Reseller, bagi hasil modal, atau waralaba/franchise?",
        "Model tersebut memiliki risiko jika klausul tidak tegas. Apakah sudah ada aturan tertulis mengenai Harga Eceran Terendah (HET) dan pembagian tanggungan jika ada produk rusak?",
        "Saran hukum saya: cantumkan klausul terminasi 30 hari dan larangan membuka usaha kompetitor sejenis dalam radius tertentu selama kemitraan berlangsung."
      ],
      "Keuangan dan harga jual": [
        "Halo! Senang bisa mendiskusikan struktur keuangan usaha Anda. Apakah saat ini rekening uang usaha sudah 100% terpisah dari rekening pribadi?",
        "Memisahkan rekening adalah langkah awal yang krusial. Bagaimana cara Anda menentukan harga jual saat ini? Apakah biaya sewa, listrik, dan gaji Anda sendiri sudah dihitung?",
        "Banyak pelaku UMKM mengalami 'ramai pembeli tapi uang habis' karena HPP tidak menghitung biaya overhead tersembunyi. Mari kita bedah formula harga jual bersih Anda."
      ],
      "default": [
        "Halo! Terima kasih sudah hadir tepat waktu di sesi konsultasi ini. Silakan ceritakan apa kendala terbesar yang sedang dihadapi usahamu saat ini?",
        "Saya memahami tantangan tersebut. Langkah apa saja yang sudah sempat Anda coba untuk menyelesaikannya?",
        "Rekomendasi saya: prioritaskan legalitas dasar terlebih dahulu, lalu susun SOP tertulis untuk tim agar operasional tidak bergantung pada Anda sendiri setiap hari."
      ]
    };
  }

  // Mendapatkan balasan konsultan berdasarkan topik dan progres percakapan
  getConsultantReply(session) {
    const topic = session.topic || "default";
    let list = this.scenarios[topic];
    if (!list) {
      // Cari kemiripan kata kunci
      if (topic.includes("Merek")) list = this.scenarios["Merek dan HAKI"];
      else if (topic.includes("NIB") || topic.includes("Izin")) list = this.scenarios["NIB dan izin usaha"];
      else if (topic.includes("Kontrak") || topic.includes("Mitra")) list = this.scenarios["Kontrak dan kemitraan"];
      else if (topic.includes("Keuangan") || topic.includes("Harga")) list = this.scenarios["Keuangan dan harga jual"];
      else list = this.scenarios["default"];
    }

    const userMsgCount = (session.msgs || []).filter(m => m[0] === "u").length;
    const index = Math.min(userMsgCount, list.length - 1);
    return list[index] || "Baik, poin tersebut sangat penting. Mari kita rangkum langkah tindak lanjutnya dalam notulensi resmi sesi ini.";
  }

  // Mengalihkan konteks dari AI Chatbot ke Sesi Konsultasi Baru
  createEscalatedBooking(aiQuery, state) {
    const defaultConsultant = CONSULTANTS[0]; // Rina Wulandari, S.H.
    const topic = "Merek dan HAKI";

    const newSession = {
      id: "SES-" + Date.now().toString().slice(-6),
      title: "Sesi dengan " + defaultConsultant.name,
      who: defaultConsultant.name,
      topic: topic,
      d: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      slot: "14.00",
      fmt: "Chat",
      st: "akan",
      pr: defaultConsultant.rate,
      trx: "LGI-ESK" + Math.floor(1000 + Math.random() * 9000),
      i: 0,
      msgs: [
        ["k", `Halo! Saya ${defaultConsultant.name}. Saya telah menerima ringkasan kendala Anda dari Asisten AI LegalIn terkait: "${aiQuery}". Mari kita bedah solusinya lebih dalam.`]
      ],
      note: ""
    };

    if (!state.sessions) state.sessions = [];
    state.sessions.unshift(newSession);

    // Tambah dokumen bukti pemesanan di brankas
    state.docs.unshift({
      id: Date.now(),
      type: 7,
      name: "Tiket Konsultasi: " + defaultConsultant.name,
      exp: "",
      file: newSession.trx + ".pdf",
      added: new Date().toISOString().split("T")[0]
    });

    return newSession;
  }

  // Menghasilkan Dokumen Notulensi Resmi Konsultasi
  generateSessionNotes(session, state) {
    const dateFormatted = new Date().toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const bizName = state?.user?.biz || "Pelaku UMKM";
    const consultantName = session.who || "Konsultan Ahli LegalIn";
    const topic = session.topic || "Konsultasi Legalitas & Bisnis";

    return `LEMBAR NOTULENSI RESMI KONSULTASI
Platform LegalIn UMKM - Nomor Berkas: NOT-${session.trx || Date.now().toString().slice(-6)}
================================================================================

TANGGAL SESI   : ${dateFormatted}
KONSULTAN      : ${consultantName} (Terverifikasi LegalIn)
KLIEN / UMKM   : ${bizName}
TOPIK PEMBAHASAN: ${topic}
DURASI SESI    : 45 Menit (Via Chat Aplikasi)

RINGKASAN DIAGNOSA DAN PEMBAHASAN:
1. Permasalahan Utama:
   Klien mendiskusikan kepatuhan dan strategi tindak lanjut mengenai ${topic} untuk memastikan keberlangsungan operasional usaha yang aman dari risiko sengketa.

2. Temuan Analisa Konsultan:
   - Dokumen dasar usaha dan legalitas identitas telah diverifikasi.
   - Diperlukan penyesuaian pada tata kelola draf tertulis serta pendaftaran hak kekayaan intelektual / izin edar instansi terkait.

3. RENCANA TINDAK LANJUT (ACTION PLAN):
   [✓] Menyiapkan kelengkapan berkas identitas dan bukti pendukung (KTP, NPWP, Logo/Resep).
   [✓] Mengajukan permohonan pendaftaran resmi ke instansi yang berwenang (OSS / BPJPH / DJKI).
   [✓] Menerapkan draf kontrak tertulis berstandar hukum untuk setiap kemitraan.
   [✓] Menyimpan seluruh salinan dokumen digital pada Brankas LegalIn UMKM.

STATUS SESI: SELESAI & DIVERIFIKASI
Dokumen notulensi ini sah dan diterbitkan secara digital melalui sistem perlindungan escrow LegalIn UMKM.

Tertanda,
Konsultan Pendamping,

${consultantName}
LegalIn UMKM Partner Network`;
  }
}

// Instance Tunggal Engine Konsultan
window.LegalInConsultant = new LegalInConsultantEngine();
