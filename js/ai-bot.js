/**
 * ai-bot.js - Mesin AI Chatbot Asisten Legal & Bisnis UMKM
 * Mendukung penalaran cerdas offline (tanpa API key) dan
 * konektor opsional ke Google Gemini API secara langsung.
 */

class LegalInAIBot {
  constructor() {
    this.history = [];
    this.isTyping = false;
  }

  // Ambil data profil pengguna untuk konteks AI
  getUserContext(state) {
    const user = state?.user || {};
    const bizType = user.type || "umum";
    const bizName = user.biz || "Usaha Anda";
    const pendingLicenses = [];

    if (state?.biz) {
      const rules = generateLegalRules(state.biz);
      rules.forEach(r => {
        if (!state.done?.[r.id] && r.w) {
          pendingLicenses.push(r.n);
        }
      });
    }

    return {
      bizName,
      bizType,
      pendingLicenses: pendingLicenses.length ? pendingLicenses.join(", ") : "Tidak ada izin mendesak"
    };
  }

  // Pesan sambutan awal berbasis konteks
  getInitialGreeting(state) {
    const ctx = this.getUserContext(state);
    return `Halo! Saya **Asisten AI Legal & Bisnis LegalIn**. 
Saya siap membantu menjawab pertanyaan seputar izin OSS/NIB, sertifikasi halal, BPOM, merek DJKI, pajak UMKM, hingga perhitungan modal usaha untuk **${ctx.bizName}**.

Ada yang ingin kamu tanyakan hari ini?`;
  }

  // Quick Chips (Saran Pertanyaan Populer)
  getQuickPrompts(state) {
    const type = state?.user?.type || "kuliner";
    const base = [
      "Bagaimana syarat & cara buat NIB OSS?",
      "Berapa biaya dan cara daftar merek DJKI?",
      "Bagaimana hitungan pajak UMKM 0,5%?"
    ];

    if (type === "kuliner") {
      base.splice(1, 0, "Apakah wajib sertifikasi halal & bagaimana caranya?", "Kapan produk butuh P-IRT dan kapan butuh BPOM?");
    } else if (type === "kosmetik") {
      base.splice(1, 0, "Bagaimana syarat notifikasi BPOM untuk maklon skincare?", "Apa saja yang harus ada di kontrak maklon?");
    } else if (type === "fashion") {
      base.splice(1, 0, "Cara melindungi desain baju & merek toko dari tiruan?", "Syarat perjanjian kemitraan reseller pakaian?");
    }

    return base.slice(0, 4);
  }

  // Mesin Penalaran Offline (Rule & Intent Based Matcher)
  generateOfflineResponse(query, state) {
    const q = query.toLowerCase();
    const ctx = this.getUserContext(state);

    // 1. NIB / OSS
    if (q.includes("nib") || q.includes("oss") || q.includes("kbli") || q.includes("izin dasar")) {
      return `**Tentang NIB (Nomor Induk Berusaha) lewat OSS RBA:**

1. **Apa itu NIB?**
   NIB adalah identitas resmi pelaku usaha di Indonesia. Untuk usaha mikro dan kecil (UMK), NIB berlaku sekaligus sebagai Tanda Daftar Perusahaan (TDP), Angka Pengenal Impor (API), dan hak akses kepabeanan.
2. **Syarat yang Perlu Disiapkan:**
   - KTP Pemilik Usaha
   - NPWP Pribadi atau Badan
   - Alamat email & nomor WhatsApp aktif
   - Kode KBLI 5 digit yang sesuai dengan kegiatan usaha ${ctx.bizName}.
3. **Biaya Resmi:**
   Penerbitan NIB di sistem OSS (oss.go.id) **100% GRATIS** dari pemerintah.
4. **Izin Lanjutan di ${ctx.bizName}:**
   Izin yang belum selesai di daftar Anda: *${ctx.pendingLicenses}*.

💡 *Tips LegalIn:* Jika Anda bingung menentukan kode KBLI yang tepat, jadwalkan sesi temu dengan konsultan kami melalui menu **Temu Konsultan**.`;
    }

    // 2. Halal BPJPH
    if (q.includes("halal") || q.includes("bpjph") || q.includes("sihalal") || q.includes("self declare")) {
      return `**Ketentuan Sertifikasi Halal untuk Produk UMKM:**

Berdasarkan UU Jaminan Produk Halal, produk makanan, minuman, dan kosmetik yang beredar di Indonesia wajib bersertifikat halal dari BPJPH.

1. **Jalur Self-Declare (Gratis untuk Usaha Mikro & Kecil):**
   - Diperuntukkan bagi produk olahan sederhana dengan bahan baku yang sudah dipastikan kehalalannya (bersertifikat).
   - Proses produksi tidak rumit dan bebas kontaminasi najis.
   - Didampingi oleh Pendamping Proses Produk Halal (PPH).
2. **Jalur Reguler (Berbayar):**
   - Untuk produk dengan proses produksi kompleks, mengandung daging potong ruminansia, atau bahan berisiko tinggi.
   - Melibatkan audit langsung oleh Lembaga Pemeriksa Halal (LPH) seperti LPPOM MUI, Sucofindo, dll.
3. **Langkah Pengajuan:**
   Daftar melalui portal **ptsp.halal.go.id** menggunakan akun NIB OSS Anda.`;
    }

    // 3. P-IRT vs BPOM
    if (q.includes("p-irt") || q.includes("pirt") || q.includes("bpom") || q.includes("izin edar")) {
      return `**Perbedaan Izin Edar SPP-PIRT (Dinkes) dan BPOM MD:**

Bagi usaha kuliner seperti **${ctx.bizName}**, perhatikan perbedaan berikut:

• **SPP-PIRT (Pangan Industri Rumah Tangga):**
  - Diterbitkan oleh Dinas Kesehatan Kabupaten/Kota.
  - Untuk makanan/minuman kering dengan daya simpan lebih dari 7 hari di suhu ruang (misal: keripik, sambal kering, kue kering, kopi bubuk).
  - Tempat produksi boleh menyatu dengan dapur rumah tangga.
  - Syarat utama: Memiliki NIB, mengikuti Penyuluhan Keamanan Pangan (PKP), dan pemeriksaan sarana dapur.

• **BPOM MD / ML:**
  - Diterbitkan langsung oleh Badan POM RI.
  - Wajib untuk: pangan basah/frozen food berisiko tinggi, susu olahan, minuman berkarbonasi, makanan kaleng, atau jika diproduksi di pabrik terpisah.
  - Memerlukan izin sarana produksi (denah tata ruang pabrik berstandar CPPOB).`;
    }

    // 4. Merek & HAKI (DJKI)
    if (q.includes("merek") || q.includes("haki") || q.includes("hak cipta") || q.includes("djki") || q.includes("logo") || q.includes("paten")) {
      return `**Perlindungan Merek & HAKI untuk UMKM:**

Nama dan logo brand adalah aset paling bernilai bagi usahamu. Tanpa pendaftaran di DJKI, pihak lain bisa mendaftarkan nama yang sama dan menuntut usahamu.

1. **Prinsip First-to-File:**
   Siapa yang pertama kali mengajukan pendaftaran ke DJKI, dialah yang diakui secara hukum sebagai pemilik merek di Indonesia.
2. **Biaya Resmi PNBP Kemenkumham:**
   - Kategori UMK (dengan surat rekomendasi dinas): **Rp 500.000** per kelas.
   - Kategori Umum / Perusahaan: **Rp 1.800.000** per kelas.
3. **Langkah Aman Sebelum Mendaftar:**
   - Lakukan penelusuran di pangkalan data merek DJKI (*pdki-indonesia.dgip.go.id*).
   - Pastikan tidak ada kemiripan penulisan, bunyi ucapan (fonetik), atau visual logo pada kelas barang yang sama.
   - Masa perlindungan berlaku selama **10 tahun** dan dapat diperpanjang.`;
    }

    // 5. Pajak UMKM (PPh Final 0,5%)
    if (q.includes("pajak") || q.includes("pph") || q.includes("0,5") || q.includes("0.5") || q.includes("omzet") || q.includes("djp")) {
      return `**Panduan Pajak UMKM (PP No. 55 Tahun 2022):**

1. **Tarif PPh Final 0,5%:**
   Berlaku untuk pelaku usaha dengan peredaran bruto (omzet) tidak melebihi **Rp 4,8 Miliar** dalam 1 tahun pajak.
2. **Batas Bebas Pajak Khusus Orang Pribadi (PTKP Usaha):**
   - Pelaku UMKM Orang Pribadi **TIDAK DIKENAI PAJAK** atas omzet sampai dengan **Rp 500 Juta setahun**!
   - Pajak 0,5% hanya dihitung dari kelebihan omzet di atas Rp 500 Juta.
   - *Contoh:* Jika omzet tahunan Rp 600 Juta, yang kena pajak 0,5% hanya Rp 100 Juta (Bayar Rp 500.000 setahun).
3. **Untuk Badan Usaha (CV / PT / PT Perorangan):**
   Dikenai PPh Final 0,5% sejak rupiah pertama dari total omzet.
4. **Jadwal Pembayaran & Lapor:**
   Setor paling lambat tanggal 15 bulan berikutnya jika ada pajak terutang.`;
    }

    // 6. Modal Usaha & KUR (Kredit Usaha Rakyat)
    if (q.includes("modal") || q.includes("kur") || q.includes("pinjaman") || q.includes("bank") || q.includes("pembiayaan")) {
      return `**Akses Permodalan & Pengajuan KUR Bank:**

Pemerintah menyediakan program Kredit Usaha Rakyat (KUR) dengan subsidi bunga (efektif ~6% per tahun):

1. **Tingkatan Program:**
   - **KUR Super Mikro:** Plafon s.d. Rp 10 Juta (tanpa agunan tambahan).
   - **KUR Mikro:** Plafon Rp 10 Juta - Rp 100 Juta (bunga 6% pertama, tanpa agunan pokok).
   - **KUR Kecil:** Plafon Rp 100 Juta - Rp 500 Juta (wajib agunan fisik sesuai ketentuan bank).
2. **Syarat Kunci Lolos Verifikasi Bank:**
   - Usaha aktif minimal 6 bulan.
   - Memiliki NIB resmi dan NPWP.
   - Rekening bank khusus usaha (transaksi uang toko tidak bercampur dengan pribadi).
   - Bersih dari riwayat kredit macet di SLIK OJK (BI Checking).
   - Memiliki catatan buku kas pemasukan dan pengeluaran harian.`;
    }

    // 7. Kontrak, Kemitraan & Reseller
    if (q.includes("kontrak") || q.includes("perjanjian") || q.includes("karyawan") || q.includes("reseller") || q.includes("mitra") || q.includes("franchise")) {
      return `**Pentingnya Kontrak Tertulis untuk Usaha:**

Banyak sengketa UMKM terjadi karena kerja sama hanya bermodalkan "kepercayaan lisan". Kontrak tertulis melindungi Anda dan mitra:

1. **Kontrak Reseller:**
   Wajib mencantumkan Harga Eceran Terendah (HET), batas wilayah, serta batasan retur barang cacat.
2. **Kontrak Karyawan (PKWT):**
   Wajib mengatur jam kerja, hak upah, tugas pokok, kewajiban merahasiakan resep/rahasia dagang, dan kompensasi akhir kontrak.
3. **Perjanjian Kemitraan:**
   Wajib mengatur formula bagi hasil, hak pemakaian nama brand, dan klausul penyelesaian perselisihan bila salah satu pihak ingin keluar.

💡 *Gunakan menu **Draf Kontrak** di LegalIn untuk membuat template perjanjian yang siap dicetak!*`;
    }

    // 8. HPP & Harga Jual
    if (q.includes("hpp") || q.includes("harga") || q.includes("untung") || q.includes("biaya") || q.includes("laba")) {
      return `**Formula Hitung HPP & Harga Jual Aman:**

Harga jual jangan hanya dihitung dari biaya bahan baku! Perhatikan komponen berikut:

1. **Biaya Bahan Langsung (BBL):** Cabai, minyak, bumbu, kemasan botol, stiker label.
2. **Biaya Tenaga Kerja Langsung (BTK):** Upah staf memasak atau mengemas per botol.
3. **Biaya Overhead Usaha (BOH):** Gas LPG, listrik, sewa tempat per porsi, biaya kuota admin, dan penyusutan alat.
4. **Biaya Potongan Platform:** Komisi marketplace (5-10%) atau diskon promo.

**Rumus Sederhana:**
\`HPP per unit = (Total Biaya Bahan + Tenaga + Overhead) / Total Unit Dihasilkan\`
\`Harga Jual = HPP / (1 - Target Margin Bersih)\``;
    }

    // Default Fallback Response
    return `Pertanyaan yang bagus mengenai **${query}**.

Untuk regulasi di Indonesia, pastikan usahamu (**${ctx.bizName}**) selalu memenuhi kepatuhan legal dasar:
1. Memiliki **NIB OSS** dengan kode KBLI yang tepat.
2. Melindungi nama brand dengan **Pendaftaran Merek DJKI**.
3. Menyimpan perizinan rapi di **Brankas Dokumen** agar masa berlaku selalu terpantau.

Jika masalah ini butuh pendampingan khusus atau draf berkas legal formal, Anda dapat berkonsultasi langsung dengan tim advokat & konsultan bisnis kami.`;
  }

  // Panggilan ke Gemini API (Opsional)
  async callGeminiAPI(query, apiKey, state) {
    const ctx = this.getUserContext(state);
    const systemPrompt = `Kamu adalah Asisten Ahli Hukum & Bisnis UMKM Indonesia di aplikasi LegalIn UMKM. 
Nama usaha pengguna: ${ctx.bizName}.
Bidang usaha: ${ctx.bizType}.
Izin yang belum selesai: ${ctx.pendingLicenses}.
Tugasmu adalah memberikan panduan hukum, perizinan (OSS, BPOM, Halal, Merek, Pajak PP 55, Kontrak), dan manajemen bisnis Indonesia yang praktis, ramah, akurat, dan mudah dipahami pelaku usaha mikro/kecil. Jawaban harus terstruktur dengan markdown. Jangan memberi nasihat yang menyesatkan.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const payload = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemPrompt}\n\nPertanyaan pengguna: ${query}` }]
        }
      ],
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 800
      }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Gagal menghubungi Gemini API: status ${response.status}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada respons yang dihasilkan.";
  }

  // Kirim Pertanyaan & Dapatkan Respons
  async ask(query, state) {
    const q = query.trim();
    if (!q) return null;

    // Catat riwayat pengguna
    this.history.push({ sender: "user", text: q, time: new Date() });

    let botReply = "";

    // Cek apakah ada API Key yang tersimpan
    if (state?.apiKey && state.apiKey.trim().length > 10) {
      try {
        botReply = await this.callGeminiAPI(q, state.apiKey, state);
      } catch (err) {
        console.warn("Gemini API error, fallback to offline reasoning:", err);
        botReply = this.generateOfflineResponse(q, state) + "\n\n*(Catatan: respons offline ditampilkan karena koneksi Gemini API gagal)*";
      }
    } else {
      // Simulasi delay pengetikan manusiawi (300-600ms)
      await new Promise(r => setTimeout(r, 450));
      botReply = this.generateOfflineResponse(q, state);
    }

    this.history.push({ sender: "bot", text: botReply, time: new Date() });
    return botReply;
  }
}

// Instance Tunggal AI Bot
window.LegalInAI = new LegalInAIBot();
