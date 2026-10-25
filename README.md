# LegalIn UMKM - Platform Legalitas & Konsultasi Bisnis

Platform pendampingan hukum dan operasional bisnis bagi pelaku Usaha Mikro, Kecil, dan Menengah (UMKM) di Indonesia. Dirancang dengan antarmuka *mobile-first* bergaya *Claymorphism* yang ramah, interaktif, dan mudah digunakan.

---

## 🚀 Fitur Utama

- **🤖 Asisten AI Legal & Bisnis (Freemium)**: Chatbot simulasi cerdas offline untuk konsultasi regulasi NIB/OSS, sertifikasi halal BPJPH, pendaftaran merek DJKI, BPOM/P-IRT, pajak UMKM PPh Final 0,5%, hingga perhitungan HPP dan modal KUR. Dilengkapi opsi integrasi langsung dengan Google Gemini API.
- **💬 Ruang Konsultasi Ahli Berpandu Skenario**: Konsultasi chat 45 menit dengan praktisi hukum dan konsultan bisnis terverifikasi per daerah (Solo, Semarang, Yogyakarta, Jakarta), lengkap dengan fitur lampiran berkas dan tombol eskalasi langsung dari AI.
- **📄 Penerbitan Notulensi Resmi**: Format rangkuman hasil sesi konsultasi berstandar resmi yang siap dicetak (format A4) dan otomatis tersimpan di Brankas digital.
- **🔍 Pencari Kode KBLI 2020 (OSS-RBA)**: Direktori pencarian kode KBLI 5 digit untuk UMKM lengkap dengan analisis tingkat risiko perizinan (Rendah s.d. Menengah Tinggi) serta dokumen izin wajib yang akan diterbitkan.
- **📝 Generator Draf Kontrak Legal**: Template perjanjian reseller, kontrak kerja karyawan (PKWT), dan perjanjian supplier yang dapat diisi dan langsung dicetak/diekspor.
- **🗄️ Brankas Dokumen & Pengingat Masa Berlaku**: Penyimpanan salinan berkas legalitas penting (KTP, NPWP, NIB, P-IRT, Halal) dengan penghitung mundur kedaluwarsa serta simulasi notifikasi via WhatsApp Business API.
- **🛡️ Sistem Escrow Pembayaran Bergaransi**: Simulasi pembayaran paket pengurusan legalitas bertahap (*milestone-based*), di mana dana ditahan dan baru dicairkan setelah tiap dokumen selesai diverifikasi.

---

## 📁 Struktur Berkas

```
.
├── index.html            # Shell aplikasi utama, modal AI drawer, FAB, & navigasi
├── css/
│   └── style.css         # Desain Claymorphism, tema Terang/Gelap, chat bubbles, mode cetak
├── js/
    ├── data.js           # Basis data KBLI, profil konsultan, aturan izin, data demo
    ├── ai-bot.js         # Mesin AI reasoning offline & konektor Gemini API
    ├── consultant.js     # Skenario chat konsultan terpandu & generator notulensi
    └── app.js            # Router, state management (localStorage), event handling
```

---

## 💻 Cara Menjalankan

Aplikasi ini bersifat *client-side* murni (Vanilla HTML, CSS, JavaScript). Anda cukup membuka berkas `index.html` langsung di browser mana pun (Google Chrome, Firefox, Safari, Microsoft Edge) tanpa perlu instalasi server atau `node_modules`.
